const express = require('express');
const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const { saveDb } = require('./db');
const cron = require('node-cron');

const router = express.Router();

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
