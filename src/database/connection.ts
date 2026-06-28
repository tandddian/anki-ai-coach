import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js';
import path from 'path';

let SQL: SqlJsStatic | null = null;
let db: SqlJsDatabase | null = null;
let dbPath: string = '';

// Detect if running in Node.js (has filesystem) vs browser
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;

async function loadWasmBinary(): Promise<ArrayBuffer> {
  if (typeof window !== 'undefined' && window.electronAPI) {
    const data = await window.electronAPI.loadWasm();
    if (data) return data;
  }
  const resp = await fetch('/sql-wasm.wasm');
  if (!resp.ok) throw new Error(`Failed to fetch WASM: ${resp.status}`);
  return resp.arrayBuffer();
}

function getDbPath(): string {
  if (dbPath) return dbPath;
  dbPath = path.join(process.cwd(), 'anki-ai-coach.db');
  return dbPath;
}

export function setDbPath(p: string): void {
  dbPath = p;
}

export function getDb(): SqlJsDatabase {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

export async function initDatabase(filePath?: string): Promise<void> {
  if (filePath) {
    dbPath = filePath;
  }

  if (!SQL) {
    if (isNode) {
      SQL = await initSqlJs();
    } else {
      const wasmData = await loadWasmBinary();
      SQL = await initSqlJs({
        wasmBinary: wasmData,
      });
    }
  }

  // Try to load existing database
  let loaded = false;

  if (isNode) {
    const fs = await import('fs');
    const finalPath = filePath || getDbPath();
    if (fs.existsSync(finalPath)) {
      const buffer = fs.readFileSync(finalPath);
      db = new SQL.Database(buffer);
      loaded = true;
    }
  } else if (typeof window !== 'undefined' && window.electronAPI) {
    try {
      const data = await window.electronAPI.readDbFile();
      if (data) {
        db = new SQL.Database(new Uint8Array(data));
        loaded = true;
      }
    } catch {
      // File doesn't exist yet
    }
  }

  if (!loaded) {
    db = new SQL.Database();
  }

  db.run('PRAGMA foreign_keys = ON');
}

export async function saveDatabase(): Promise<void> {
  if (!db) throw new Error('Database not initialized.');
  const data = db.export();
  const buffer = Buffer.from(data);

  if (isNode) {
    const fs = await import('fs');
    fs.writeFileSync(getDbPath(), buffer);
  } else if (typeof window !== 'undefined' && window.electronAPI) {
    await window.electronAPI.saveDbFile(buffer);
  }
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    await saveDatabase();
    db.close();
    db = null;
  }
}

// Helper: run INSERT/UPDATE/DELETE and return lastInsertRowid
export function runSql(sql: string, params: SqlParams = []): { lastInsertRowid: number; changes: number } {
  const database = getDb();
  database.run(sql, params);
  const changes = database.getRowsModified();
  const result = database.exec('SELECT last_insert_rowid() as id');
  const lastInsertRowid = result.length > 0 && result[0].values.length > 0
    ? Number(result[0].values[0][0])
    : 0;
  return { lastInsertRowid, changes };
}

// Helper: run SELECT and return typed rows
type SqlParams = (string | number | null)[];

function toCamelCase(str: string): string {
  return str.replace(/_([a-z])/g, (_, letter) => letter.toUpperCase());
}

function mapRowKeys<T>(row: Record<string, unknown>): T {
  const mapped: Record<string, unknown> = {};
  for (const key of Object.keys(row)) {
    mapped[toCamelCase(key)] = row[key];
  }
  return mapped as unknown as T;
}

export function queryAll<T = Record<string, unknown>>(sql: string, params: SqlParams = []): T[] {
  const database = getDb();
  const stmt = database.prepare(sql);
  stmt.bind(params);
  const rows: T[] = [];
  while (stmt.step()) {
    rows.push(mapRowKeys<T>(stmt.getAsObject() as Record<string, unknown>));
  }
  stmt.free();
  return rows;
}

export function queryOne<T = Record<string, unknown>>(sql: string, params: SqlParams = []): T | undefined {
  const rows = queryAll<T>(sql, params);
  return rows.length > 0 ? rows[0] : undefined;
}

export function execSql(sql: string): void {
  const database = getDb();
  database.run(sql);
}
