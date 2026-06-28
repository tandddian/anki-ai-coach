import initSqlJs, { Database as SqlJsDatabase, SqlJsStatic } from 'sql.js';
import path from 'path';

let SQL: SqlJsStatic | null = null;
let db: SqlJsDatabase | null = null;
let dbPath: string = '';

// Detect if running in Node.js (has filesystem) vs browser
const isNode = typeof process !== 'undefined' && process.versions && process.versions.node;
