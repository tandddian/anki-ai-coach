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

export function getFoldersByType(type: 'material' | 'question'): Folder[] {
  return queryAll<Folder>('SELECT * FROM folders WHERE type = ? ORDER BY name', [type]);
}

export function getFoldersByParent(parentId: number | null): Folder[] {
  if (parentId === null) {
    return queryAll<Folder>('SELECT * FROM folders WHERE parent_id IS NULL ORDER BY type, name');
  }
  return queryAll<Folder>('SELECT * FROM folders WHERE parent_id = ? ORDER BY name', [parentId]);
}

export function updateFolder(id: number, name: string): Folder | undefined {
  runSql('UPDATE folders SET name = ? WHERE id = ?', [name, id]);
  return getFolderById(id);
}

export function deleteFolder(id: number): void {
  runSql('DELETE FROM folders WHERE id = ?', [id]);
}