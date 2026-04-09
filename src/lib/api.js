const express = require('express');
const fs = require('fs');
const path = require('path');
const os = require('os');
const { v4: uuidv4 } = require('uuid');
const { saveDb } = require('./db');
const cron = require('node-cron');

const router = express.Router();

// ── Helpers ─────────────────────────────────────────

function getQuickAccess() {
  const items = [{ name: 'Home', path: os.homedir() }];
  if (os.platform() === 'win32') {
    // Detect OneDrive folders on Windows
    const oneDrivePaths = new Set();
    for (const envVar of ['OneDrive', 'OneDriveConsumer', 'OneDriveCommercial']) {
      if (process.env[envVar]) oneDrivePaths.add(path.resolve(process.env[envVar]));
    }
    // Scan home directory for OneDrive folders — use statSync fallback for
    // cloud-only reparse points where dirent.isDirectory() returns false
    try {
      const homeEntries = fs.readdirSync(os.homedir(), { withFileTypes: true });
      for (const entry of homeEntries) {
        if (!entry.name.startsWith('OneDrive')) continue;
        const fullPath = path.join(os.homedir(), entry.name);
        if (entry.isDirectory()) {
          oneDrivePaths.add(fullPath);
        } else {
          try {
            if (fs.statSync(fullPath).isDirectory()) oneDrivePaths.add(fullPath);
          } catch { /* skip */ }
        }
      }
    } catch { /* ignore */ }
    // Also check Windows registry for OneDrive account paths
    try {
      const { execSync } = require('child_process');
      const regOutput = execSync(
        'reg query "HKCU\\Software\\Microsoft\\OneDrive\\Accounts" /s /v UserFolder 2>nul',
        { encoding: 'utf8', timeout: 3000 }
      );
      for (const line of regOutput.split('\n')) {
        const match = line.match(/UserFolder\s+REG_SZ\s+(.+)/i);
        if (match) oneDrivePaths.add(path.resolve(match[1].trim()));
      }
    } catch { /* registry not available */ }
    for (const odPath of oneDrivePaths) {
      try {
        fs.accessSync(odPath, fs.constants.R_OK);
        items.push({ name: path.basename(odPath), path: odPath });
      } catch { /* not accessible */ }
    }

    // Detect available drive letters on Windows
    for (let code = 65; code <= 90; code++) {
      const drive = String.fromCharCode(code) + ':\\';
      try {
        fs.accessSync(drive, fs.constants.R_OK);
        items.push({ name: drive, path: drive });
      } catch { /* drive not available */ }
    }
  } else {
    items.push({ name: '/', path: '/' });
  }
  return items;
}

// Check if a dirent is a directory, falling back to statSync for reparse
// points (e.g. OneDrive cloud-only folders where dirent.isDirectory() is false)
function isDir(entry, parentDir) {
  if (entry.isDirectory()) return true;
  if (entry.isFile() || entry.isSymbolicLink()) return false;
  try { return fs.statSync(path.join(parentDir, entry.name)).isDirectory(); } catch { return false; }
}

// ── Browse filesystem ───────────────────────────────

router.get('/browse', (req, res) => {
  const dirPath = path.resolve(req.query.path || os.homedir());

  try {
    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Directory not found' });
    if (err.code === 'EPERM' || err.code === 'EACCES') return res.status(403).json({ error: 'Access denied' });
    return res.status(500).json({ error: err.message });
  }

  const directories = [];
  const files = [];

  try {
    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
      try {
        const fullPath = path.join(dirPath, entry.name);
        if (isDir(entry, dirPath)) {
          directories.push({ name: entry.name, path: fullPath });
        } else if (entry.isFile() && entry.name.toLowerCase().endsWith('.ps1')) {
          files.push({ name: entry.name, path: fullPath });
        }
      } catch { /* skip broken symlinks / inaccessible entries */ }
    }
  } catch (err) {
    if (err.code === 'EPERM' || err.code === 'EACCES') return res.status(403).json({ error: 'Access denied' });
    return res.status(500).json({ error: err.message });
  }

  directories.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
  files.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));

  const parent = path.dirname(dirPath);

  res.json({
    current: dirPath,
    parent: parent === dirPath ? null : parent,
    directories,
    files,
    quickAccess: getQuickAccess(),
  });
});

// ── Settings ────────────────────────────────────────

router.get('/settings', (req, res) => {
  res.json(req.db.settings || {});
});

router.put('/settings', (req, res) => {
  req.db.settings = { ...(req.db.settings || {}), ...req.body };
  saveDb(req.db);
  res.json(req.db.settings);
});

// ── Browse directory tree (folders only, recursive) ─

router.get('/browse/tree', (req, res) => {
  const dirPath = path.resolve(req.query.path || os.homedir());
  const maxDepth = 5;

  function scanDir(dir, depth) {
    if (depth > maxDepth) return [];
    let entries;
    try {
      entries = fs.readdirSync(dir, { withFileTypes: true });
    } catch {
      return [];
    }

    const result = [];
    for (const entry of entries) {
      if (!isDir(entry, dir)) continue;
      // Skip hidden/system folders
      if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
      try {
        const fullPath = path.join(dir, entry.name);
        const children = scanDir(fullPath, depth + 1);
        result.push({
          name: entry.name,
          path: fullPath,
          type: 'directory',
          children,
        });
      } catch { /* skip inaccessible */ }
    }
    result.sort((a, b) => a.name.localeCompare(b.name, undefined, { sensitivity: 'base' }));
    return result;
  }

  try {
    const stat = fs.statSync(dirPath);
    if (!stat.isDirectory()) {
      return res.status(400).json({ error: 'Path is not a directory' });
    }
  } catch (err) {
    if (err.code === 'ENOENT') return res.status(404).json({ error: 'Directory not found' });
    return res.status(500).json({ error: err.message });
  }

  const tree = scanDir(dirPath, 0);
  res.json(tree);
});

// ── Scripts ──────────────────────────────────────────

router.get('/scripts', (req, res) => {
  res.json(req.db.scripts);
});

router.get('/scripts/:id', (req, res) => {
  const script = req.db.scripts.find(s => s.id === req.params.id);
  if (!script) return res.status(404).json({ error: 'Script not found' });
  res.json(script);
});

router.post('/scripts', (req, res) => {
  const { name, path: scriptPath, description, timeoutSeconds } = req.body;

  if (!name || !scriptPath) {
    return res.status(400).json({ error: 'name and path are required' });
  }

  // Validate path exists and is a .ps1 file
  const resolvedPath = path.resolve(scriptPath);
  if (!resolvedPath.toLowerCase().endsWith('.ps1')) {
    return res.status(400).json({ error: 'Script must be a .ps1 file' });
  }

  if (!fs.existsSync(resolvedPath)) {
    return res.status(400).json({ error: 'Script file not found at specified path' });
  }

  const script = {
    id: uuidv4(),
    name,
    path: resolvedPath,
    description: description || '',
    timeoutSeconds: timeoutSeconds || 300,
    createdAt: new Date().toISOString()
  };

  req.db.scripts.push(script);
  saveDb(req.db);
  res.status(201).json(script);
});

router.put('/scripts/:id', (req, res) => {
  const idx = req.db.scripts.findIndex(s => s.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: 'Script not found' });

  const { name, path: scriptPath, description, timeoutSeconds } = req.body;

  if (scriptPath) {
    const resolvedPath = path.resolve(scriptPath);
    if (!resolvedPath.toLowerCase().endsWith('.ps1')) {
      return res.status(400).json({ error: 'Script must be a .ps1 file' });
    }
    if (!fs.existsSync(resolvedPath)) {
      return res.status(400).json({ error: 'Script file not found at specified path' });
    }
    req.db.scripts[idx].path = resolvedPath;
  }

  if (name) req.db.scripts[idx].name = name;
  if (description !== undefined) req.db.scripts[idx].description = description;
  if (timeoutSeconds) req.db.scripts[idx].timeoutSeconds = timeoutSeconds;

  saveDb(req.db);
  res.json(req.db.scripts[idx]);
});

router.delete('/scripts/:id', (req, res) => {
  const script = req.db.scripts.find(s => s.id === req.params.id);
  if (!script) return res.status(404).json({ error: 'Script not found' });

  // Remove related schedules
  const relatedSchedules = req.db.schedules.filter(s => s.scriptId === req.params.id);
  for (const sched of relatedSchedules) {
    req.scheduler.deleteSchedule(sched.id);
  }

  req.db.scripts = req.db.scripts.filter(s => s.id !== req.params.id);
  saveDb(req.db);
  res.json({ ok: true });
});

// Run a script immediately
router.post('/scripts/:id/run', (req, res) => {
  const result = req.scheduler.runNow(req.params.id);
  if (!result) return res.status(404).json({ error: 'Script not found' });
  res.json(result);
});

// Read script file content
router.get('/scripts/:id/content', (req, res) => {
  const script = req.db.scripts.find(s => s.id === req.params.id);
  if (!script) return res.status(404).json({ error: 'Script not found' });

  try {
    const content = fs.readFileSync(script.path, 'utf8');
    res.json({ content });
  } catch (err) {
    res.status(500).json({ error: 'Could not read script file: ' + err.message });
  }
});

// ── Schedules ────────────────────────────────────────

router.get('/schedules', (req, res) => {
  res.json(req.db.schedules);
});

router.post('/schedules', (req, res) => {
  const { scriptId, cron: cronExpr, name, enabled } = req.body;

  if (!scriptId || !cronExpr) {
    return res.status(400).json({ error: 'scriptId and cron are required' });
  }

  if (!cron.validate(cronExpr)) {
    return res.status(400).json({ error: 'Invalid cron expression' });
  }

  const script = req.db.scripts.find(s => s.id === scriptId);
  if (!script) return res.status(400).json({ error: 'Script not found' });

  const schedule = {
    id: uuidv4(),
    scriptId,
    scriptName: script.name,
    name: name || `${script.name} schedule`,
    cron: cronExpr,
    enabled: enabled !== false,
    createdAt: new Date().toISOString()
  };

  req.scheduler.addSchedule(schedule);
  res.status(201).json(schedule);
});

router.put('/schedules/:id', (req, res) => {
  const { cron: cronExpr, name, enabled } = req.body;

  if (cronExpr && !cron.validate(cronExpr)) {
    return res.status(400).json({ error: 'Invalid cron expression' });
  }

  const updates = {};
  if (cronExpr !== undefined) updates.cron = cronExpr;
  if (name !== undefined) updates.name = name;
  if (enabled !== undefined) updates.enabled = enabled;

  const result = req.scheduler.updateSchedule(req.params.id, updates);
  if (!result) return res.status(404).json({ error: 'Schedule not found' });
  res.json(result);
});

router.delete('/schedules/:id', (req, res) => {
  req.scheduler.deleteSchedule(req.params.id);
  res.json({ ok: true });
});

// ── History ──────────────────────────────────────────

router.get('/history', (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 50, 200);
  const scriptId = req.query.scriptId;
  let history = req.db.history;
  if (scriptId) {
    history = history.filter(h => h.scriptId === scriptId);
  }
  res.json(history.slice(0, limit));
});

router.delete('/history', (req, res) => {
  req.db.history = [];
  saveDb(req.db);
  res.json({ ok: true });
});

// ── Chart data (last 42 hours, hourly buckets) ──────

router.get('/history/chart', (req, res) => {
  const now = new Date();
  const hoursBack = 42;
  const cutoff = new Date(now.getTime() - hoursBack * 60 * 60 * 1000);

  // Create 42 hourly buckets
  const buckets = [];
  for (let i = hoursBack - 1; i >= 0; i--) {
    const bucketTime = new Date(now.getTime() - i * 60 * 60 * 1000);
    bucketTime.setMinutes(0, 0, 0);
    buckets.push({
      hour: bucketTime.toISOString().slice(0, 16),
      success: 0,
      warning: 0,
      failed: 0
    });
  }

  // Fill buckets from history
  const recentHistory = req.db.history.filter(h => new Date(h.startTime) > cutoff);
  for (const entry of recentHistory) {
    const entryTime = new Date(entry.startTime);
    entryTime.setMinutes(0, 0, 0);
    const entryHour = entryTime.toISOString().slice(0, 16);
    const bucket = buckets.find(b => b.hour === entryHour);
    if (!bucket) continue;

    if (entry.status === 'success') bucket.success++;
    else if (entry.status === 'error') bucket.warning++;
    else if (entry.status === 'failed') bucket.failed++;
  }

  res.json(buckets);
});

// ── Dashboard stats ──────────────────────────────────

router.get('/stats', (req, res) => {
  const now = new Date();
  const last24h = new Date(now - 24 * 60 * 60 * 1000);
  const recentHistory = req.db.history.filter(h => new Date(h.startTime) > last24h);

  res.json({
    totalScripts: req.db.scripts.length,
    totalSchedules: req.db.schedules.length,
    activeSchedules: req.db.schedules.filter(s => s.enabled).length,
    runs24h: recentHistory.length,
    successes24h: recentHistory.filter(h => h.status === 'success').length,
    failures24h: recentHistory.filter(h => h.status === 'failed' || h.status === 'error').length
  });
});

module.exports = router;
