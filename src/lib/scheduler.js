const cron = require('node-cron');
const { spawn } = require('child_process');
const fs = require('fs');
const { saveDb } = require('./db');
const secrets = require('./secrets');

const DEFAULT_MAX_HISTORY = 500;
const MAX_HISTORY_CAP = 5000;
// Case-insensitive: PowerShell variable names are case-insensitive, so
// $secret.Foo, $SECRET.foo, $Secret.foo all refer to the same thing.
const SECRET_REF_RE = /\$Secret\.([A-Za-z_][A-Za-z0-9_]*)/gi;

// Escape a string for PowerShell single-quoted literals: double any apostrophe.
function psQuote(s) {
  return "'" + String(s).replace(/'/g, "''") + "'";
}

class SchedulerEngine {
  constructor(db) {
    this.db = db;
    this.jobs = new Map(); // scheduleId -> cron task
  }

  startAll() {
    for (const schedule of this.db.schedules) {
      if (schedule.enabled) {
        this._startJob(schedule);
      }
    }
    console.log(`Started ${this.jobs.size} scheduled job(s)`);
  }

  stopAll() {
    for (const [id, task] of this.jobs) {
      task.stop();
    }
    this.jobs.clear();
  }

  addSchedule(schedule) {
    this.db.schedules.push(schedule);
    if (schedule.enabled) {
      this._startJob(schedule);
    }
    saveDb(this.db);
  }

  updateSchedule(scheduleId, updates) {
    const idx = this.db.schedules.findIndex(s => s.id === scheduleId);
    if (idx === -1) return null;

    // Stop existing job
    this._stopJob(scheduleId);

    // Apply updates
    Object.assign(this.db.schedules[idx], updates);
    const schedule = this.db.schedules[idx];

    // Restart if enabled
    if (schedule.enabled) {
      this._startJob(schedule);
    }

    saveDb(this.db);
    return schedule;
  }

  deleteSchedule(scheduleId) {
    this._stopJob(scheduleId);
    this.db.schedules = this.db.schedules.filter(s => s.id !== scheduleId);
    saveDb(this.db);
  }

  runNow(scriptId) {
    const script = this.db.scripts.find(s => s.id === scriptId);
    if (!script) return null;
    return this._executeScript(script, 'manual');
  }

  _startJob(schedule) {
    const script = this.db.scripts.find(s => s.id === schedule.scriptId);
    if (!script) {
      console.warn(`Schedule ${schedule.id}: script ${schedule.scriptId} not found`);
      return;
    }

    if (!cron.validate(schedule.cron)) {
      console.warn(`Schedule ${schedule.id}: invalid cron "${schedule.cron}"`);
      return;
    }

    const task = cron.schedule(schedule.cron, () => {
      this._executeScript(script, schedule.id);
    });

    this.jobs.set(schedule.id, task);
  }

  _stopJob(scheduleId) {
    const task = this.jobs.get(scheduleId);
    if (task) {
      task.stop();
      this.jobs.delete(scheduleId);
    }
  }

  _executeScript(script, triggeredBy) {
    const startTime = new Date().toISOString();
    const historyEntry = {
      id: Date.now().toString(36) + Math.random().toString(36).slice(2, 6),
      scriptId: script.id,
      scriptName: script.name,
      triggeredBy,
      startTime,
      endTime: null,
      status: 'running',
      output: '',
      error: ''
    };

    this.db.history.unshift(historyEntry);
    this._trimHistory();
    saveDb(this.db);

    // Fire-and-forget the async spawn; failures are recorded to history below.
    this._runWithSecrets(script, historyEntry).catch((err) => {
      const entry = this.db.history.find(h => h.id === historyEntry.id);
      if (entry && entry.status === 'running') {
        entry.endTime = new Date().toISOString();
        entry.error = err.message;
        entry.status = 'error';
        saveDb(this.db);
      }
    });

    return historyEntry;
  }

  async _runWithSecrets(script, historyEntry) {
    // Read script content to discover which secrets it references. If this
    // fails, bail out with an "error" status so PowerShell's own file-not-found
    // path isn't reached — we want a clear message in history.
    const content = await fs.promises.readFile(script.path, 'utf8');

    const referenced = new Set();
    for (const m of content.matchAll(SECRET_REF_RE)) {
      referenced.add(m[1]);
    }

    const resolved = referenced.size > 0
      ? await secrets.resolveMany([...referenced])
      : new Map();

    // Build $Secret hashtable and dot-source the user's script so $PSScriptRoot
    // and relative imports continue to work. Values are single-quoted with
    // apostrophes doubled, matching PS literal-string escaping rules.
    //
    // NOTE: the hashtable MUST be on a single line. PowerShell's stdin
    // ("-Command -") parser silently drops output when it sees multi-line
    // hashtable bodies — it treats them as incomplete expressions.
    const entries = [...resolved].map(([name, value]) => `${name} = ${psQuote(value)}`);
    const header = `$Secret = @{ ${entries.join('; ')} }`;
    const combined = `${header}\n. ${psQuote(script.path)}\n`;

    const args = ['-NoProfile', '-NonInteractive', '-ExecutionPolicy', 'Bypass', '-Command', '-'];
    const ps = spawn('powershell.exe', args, {
      windowsHide: true,
      timeout: script.timeoutSeconds ? script.timeoutSeconds * 1000 : 0,
      stdio: ['pipe', 'pipe', 'pipe'],
    });

    let stdout = '';
    let stderr = '';

    ps.stdout.on('data', (data) => { stdout += data.toString(); });
    ps.stderr.on('data', (data) => { stderr += data.toString(); });

    ps.on('close', (code) => {
      const entry = this.db.history.find(h => h.id === historyEntry.id);
      if (entry) {
        entry.endTime = new Date().toISOString();
        entry.output = stdout.slice(0, 50000); // Cap output size
        entry.error = stderr.slice(0, 50000);
        entry.exitCode = code;
        entry.status = (code !== 0 || stderr.trim().length > 0) ? 'failed' : 'success';
      }
      saveDb(this.db);
    });

    ps.on('error', (err) => {
      const entry = this.db.history.find(h => h.id === historyEntry.id);
      if (entry) {
        entry.endTime = new Date().toISOString();
        entry.error = err.message;
        entry.status = 'error';
      }
      saveDb(this.db);
    });

    ps.stdin.write(combined);
    ps.stdin.end();
  }

  _trimHistory() {
    const settings = this.db.settings || {};
    const raw = Number(settings.historyRetention);
    const configured = Number.isFinite(raw) && raw > 0 ? raw : DEFAULT_MAX_HISTORY;
    const cap = Math.min(configured, MAX_HISTORY_CAP);
    if (this.db.history.length > cap) {
      this.db.history = this.db.history.slice(0, cap);
    }
  }
}

module.exports = { SchedulerEngine };
