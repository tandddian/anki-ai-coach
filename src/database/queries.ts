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

// ============ MATERIAL QUERIES ============

export function createMaterial(
  name: string,
  filePath: string,
  type: 'pdf' | 'docx' | 'pptx' | 'md' | 'anki',
  folderId: number | null,
  contentText: string = ''
): Material {
  const today = getDateString(new Date());
  const result = runSql(
    `INSERT INTO materials (name, path, type, folder_id, content_text, due_date, interval, ease_factor, repetitions, next_review)
     VALUES (?, ?, ?, ?, ?, ?, 0, 2.5, 0, ?)`,
    [name, filePath, type, folderId, contentText, today, today]
  );
  return getMaterialById(result.lastInsertRowid)!;
}