const path = require('path');

// Detect if running inside a pkg-bundled executable
const isPkg = typeof process.pkg !== 'undefined';

// Real filesystem directory where the exe (or cli.js) lives
// In pkg mode:  C:\SomeServer\monadcode.exe  → C:\SomeServer\
// In dev mode:  node cli.js                   → D:\CLAUDE_CODE\PSScheduler\
function getExeDir() {
  if (isPkg) {
    return path.dirname(process.execPath);
  }
  return path.join(__dirname, '..');
}

// Path to the exe itself (for service registration)
function getExePath() {
  return process.execPath;
}

// wwwroot path — bundled inside the pkg snapshot (read-only)
// In pkg mode: __dirname resolves inside the virtual snapshot, which is correct
//              because pkg bundles wwwroot/** as assets in the snapshot
// In dev mode: same __dirname-relative resolution as before
function getWwwrootPath() {
  return path.join(__dirname, '..', 'wwwroot');
}

// Data directory — MUST be on the real filesystem (read-write)
// Always lives next to the exe, never inside the snapshot
function getDataDir() {
  return path.join(getExeDir(), 'data');
}

// Full path to the JSON database file
function getDbPath() {
  return path.join(getDataDir(), 'monadcode.json');
}

module.exports = { isPkg, getExeDir, getExePath, getWwwrootPath, getDataDir, getDbPath };
