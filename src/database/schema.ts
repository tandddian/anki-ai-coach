import { execSql } from './connection';

export function createTables(): void {
  execSql(`
    CREATE TABLE IF NOT EXISTS folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('material', 'question')),
      parent_id INTEGER,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (parent_id) REFERENCES folders(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      path TEXT NOT NULL,
      type TEXT NOT NULL CHECK(type IN ('pdf', 'docx', 'pptx', 'md', 'anki')),
      folder_id INTEGER,
      content_text TEXT DEFAULT '',
      due_date TEXT NOT NULL DEFAULT (date('now')),
      interval INTEGER NOT NULL DEFAULT 0,
      ease_factor REAL NOT NULL DEFAULT 2.5,
      repetitions INTEGER NOT NULL DEFAULT 0,
      next_review TEXT NOT NULL DEFAULT (date('now')),
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (folder_id) REFERENCES folders(id) ON DELETE SET NULL
    );
  `);
}