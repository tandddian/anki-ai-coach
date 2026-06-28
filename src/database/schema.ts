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

    CREATE TABLE IF NOT EXISTS ai_tests (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      test_date TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS test_questions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL,
      difficulty TEXT NOT NULL CHECK(difficulty IN ('easy', 'medium', 'hard')),
      question_text TEXT NOT NULL,
      options TEXT NOT NULL DEFAULT '[]',
      correct_answer TEXT NOT NULL,
      explanation TEXT NOT NULL DEFAULT '',
      FOREIGN KEY (test_id) REFERENCES ai_tests(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS test_materials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL,
      material_id INTEGER NOT NULL,
      FOREIGN KEY (test_id) REFERENCES ai_tests(id) ON DELETE CASCADE,
      FOREIGN KEY (material_id) REFERENCES materials(id) ON DELETE CASCADE,
      UNIQUE(test_id, material_id)
    );

    CREATE TABLE IF NOT EXISTS test_attempts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      test_id INTEGER NOT NULL,
      answers TEXT NOT NULL DEFAULT '{}',
      score REAL NOT NULL DEFAULT 0,
      completed_at TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (test_id) REFERENCES ai_tests(id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS material_correlations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      material1_id INTEGER NOT NULL,
      material2_id INTEGER NOT NULL,
      correlation_score REAL NOT NULL DEFAULT 0,
      FOREIGN KEY (material1_id) REFERENCES materials(id) ON DELETE CASCADE,
      FOREIGN KEY (material2_id) REFERENCES materials(id) ON DELETE CASCADE,
      UNIQUE(material1_id, material2_id),
      CHECK(material1_id < material2_id)
    );
  `);

  execSql(`
    CREATE INDEX IF NOT EXISTS idx_materials_folder ON materials(folder_id);
    CREATE INDEX IF NOT EXISTS idx_materials_next_review ON materials(next_review);
    CREATE INDEX IF NOT EXISTS idx_materials_due_date ON materials(due_date);
    CREATE INDEX IF NOT EXISTS idx_test_questions_test ON test_questions(test_id);
    CREATE INDEX IF NOT EXISTS idx_test_materials_test ON test_materials(test_id);
    CREATE INDEX IF NOT EXISTS idx_test_materials_material ON test_materials(material_id);
    CREATE INDEX IF NOT EXISTS idx_test_attempts_test ON test_attempts(test_id);
    CREATE INDEX IF NOT EXISTS idx_correlations_m1 ON material_correlations(material1_id);
    CREATE INDEX IF NOT EXISTS idx_correlations_m2 ON material_correlations(material2_id);
    CREATE INDEX IF NOT EXISTS idx_ai_tests_date ON ai_tests(test_date);
    CREATE INDEX IF NOT EXISTS idx_folders_parent ON folders(parent_id);
    CREATE INDEX IF NOT EXISTS idx_folders_type ON folders(type);
  `);
}