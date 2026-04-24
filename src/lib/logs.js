// Circular in-memory log buffer + console patch. Captures console.log/info/
// warn/error so the frontend can tail the daemon's own output (not per-script
// stdout). Each entry has a monotonically-increasing id so the UI can poll
// with ?after=<id> and pick up only what's new.

const MAX_ENTRIES = 1000;

const buffer = [];
let nextId = 1;

function record(level, args) {
  const message = args
    .map((a) => {
      if (a instanceof Error) return a.stack || a.message;
      if (typeof a === 'string') return a;
      try { return JSON.stringify(a); } catch { return String(a); }
    })
    .join(' ');

  const entry = {
    id: nextId++,
    timestamp: new Date().toISOString(),
    level,
    message,
  };
  buffer.push(entry);
  if (buffer.length > MAX_ENTRIES) {
    buffer.splice(0, buffer.length - MAX_ENTRIES);
  }
}

let patched = false;
function install() {
  if (patched) return;
  patched = true;

  const orig = {
    log: console.log.bind(console),
    info: console.info.bind(console),
    warn: console.warn.bind(console),
    error: console.error.bind(console),
  };

  console.log = (...args) => { record('info', args); orig.log(...args); };
  console.info = (...args) => { record('info', args); orig.info(...args); };
  console.warn = (...args) => { record('warn', args); orig.warn(...args); };
  console.error = (...args) => { record('error', args); orig.error(...args); };
}

// Return entries with id > after. If after is omitted, return the tail of the
// buffer (most recent MAX_ENTRIES).
function read(after = 0) {
  const cursor = Number.isFinite(after) ? after : 0;
  return buffer.filter((e) => e.id > cursor);
}

function clear() {
  buffer.length = 0;
}

module.exports = { install, read, clear };
