const path = require('path');
const Database = require('better-sqlite3');

const db = new Database(path.join(__dirname, '..', 'tasks.db'));

db.pragma('journal_mode = WAL');

db.exec(`
  CREATE TABLE IF NOT EXISTS tasks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    description TEXT NOT NULL DEFAULT '',
    is_completed INTEGER NOT NULL DEFAULT 0,
    due_date TEXT,
    priority TEXT,
    tags TEXT NOT NULL DEFAULT '[]',
    estimated_hours REAL,
    created_at TEXT NOT NULL
  )
`);

const existingColumns = db.prepare('PRAGMA table_info(tasks)').all().map((column) => column.name);
if (!existingColumns.includes('estimated_hours')) {
  db.exec('ALTER TABLE tasks ADD COLUMN estimated_hours REAL');
}

module.exports = db;
