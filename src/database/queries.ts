import { runSql, queryAll, queryOne } from './connection';
import { Folder, Material, AITest, TestQuestion, TestMaterial, TestAttempt, MaterialCorrelation } from '../types';

// ============ FOLDER QUERIES ============

export function createFolder(name: string, type: 'material' | 'question', parentId: number | null = null): Folder {
  const result = runSql('INSERT INTO folders (name, type, parent_id) VALUES (?, ?, ?)', [name, type, parentId]);
  return getFolderById(result.lastInsertRowid)!;
}

export function getAllFolders(): Folder[] {
  return queryAll<Folder>('SELECT * FROM folders ORDER BY type, name');
}

export function getFolderById(id: number): Folder | undefined {
  return queryOne<Folder>('SELECT * FROM folders WHERE id = ?', [id]);
}