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
