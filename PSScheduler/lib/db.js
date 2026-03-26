const fs = require('fs');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'data', 'monadcode.json');

const DEFAULT_DB = {
  scripts: [],
  schedules: [],
  history: []
};

function loadDb() {
  try {
    if (fs.existsSync(DB_PATH)) {
      const raw = fs.readFileSync(DB_PATH, 'utf8');
      const data = JSON.parse(raw);
      return {
        scripts: data.scripts || [],
        schedules: data.schedules || [],
        history: data.history || []
      };
    }
  } catch (err) {
    console.error('Error loading database, starting fresh:', err.message);
  }
  return JSON.parse(JSON.stringify(DEFAULT_DB));
}

function saveDb(db) {
  const dir = path.dirname(DB_PATH);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(DB_PATH, JSON.stringify(db, null, 2), 'utf8');
}

module.exports = { loadDb, saveDb };
