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
