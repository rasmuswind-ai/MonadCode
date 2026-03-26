const express = require('express');
const path = require('path');
const { loadDb, saveDb } = require('./lib/db');
const { SchedulerEngine } = require('./lib/scheduler');
const apiRoutes = require('./lib/api');

const PORT = process.env.MONADCODE_PORT || 5088;
const app = express();

app.use(express.json());
app.use(express.static(path.join(__dirname, 'wwwroot')));

// Make db and scheduler available to routes
const db = loadDb();
const scheduler = new SchedulerEngine(db);

app.use((req, res, next) => {
  req.db = db;
  req.scheduler = scheduler;
  next();
});

app.use('/api', apiRoutes);

// SPA fallback
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'wwwroot', 'index.html'));
});

const server = app.listen(PORT, '127.0.0.1', () => {
  console.log(`Monad Code running at http://127.0.0.1:${PORT}`);
  scheduler.startAll();
});

// Graceful shutdown
function shutdown() {
  console.log('Shutting down Monad Code...');
  scheduler.stopAll();
  server.close(() => process.exit(0));
}

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);
