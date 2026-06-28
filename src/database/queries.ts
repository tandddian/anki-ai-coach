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

export function getAllMaterials(): Material[] {
  return queryAll<Material>('SELECT * FROM materials ORDER BY created_at DESC');
}

export function getMaterialById(id: number): Material | undefined {
  return queryOne<Material>('SELECT * FROM materials WHERE id = ?', [id]);
}

export function getMaterialsByFolderId(folderId: number): Material[] {
  return queryAll<Material>('SELECT * FROM materials WHERE folder_id = ? ORDER BY name', [folderId]);
}

export function getDueMaterials(date?: string): Material[] {
  const today = date || getDateString(new Date());
  return queryAll<Material>('SELECT * FROM materials WHERE next_review <= ? ORDER BY next_review', [today]);
}

export function updateMaterial(id: number, updates: Partial<Material>): Material | undefined {
  const allowedFields = ['name', 'path', 'type', 'folder_id', 'content_text', 'due_date', 'interval', 'ease_factor', 'repetitions', 'next_review'];
  const setClauses: string[] = [];
  const values: (string | number | null)[] = [];

  for (const [key, value] of Object.entries(updates)) {
    if (allowedFields.includes(key)) {
      setClauses.push(`${key} = ?`);
      values.push(value as string | number | null);
    }
  }

  if (setClauses.length === 0) return getMaterialById(id);

  values.push(id);
  runSql(`UPDATE materials SET ${setClauses.join(', ')} WHERE id = ?`, values);
  return getMaterialById(id);
}

export function updateMaterialSM2(
  id: number,
  interval: number,
  easeFactor: number,
  repetitions: number,
  nextReview: string
): Material | undefined {
  runSql(
    'UPDATE materials SET interval = ?, ease_factor = ?, repetitions = ?, next_review = ? WHERE id = ?',
    [interval, easeFactor, repetitions, nextReview, id]
  );
  return getMaterialById(id);
}

export function deleteMaterial(id: number): void {
  runSql('DELETE FROM materials WHERE id = ?', [id]);
}

export function getMaterialsByIds(ids: number[]): Material[] {
  if (ids.length === 0) return [];
  const placeholders = ids.map(() => '?').join(',');
  return queryAll<Material>(`SELECT * FROM materials WHERE id IN (${placeholders})`, ids);
}

// ============ TEST QUERIES ============

export function createTest(name: string, testDate: string): AITest {
  const result = runSql('INSERT INTO ai_tests (name, test_date) VALUES (?, ?)', [name, testDate]);
  return getTestById(result.lastInsertRowid)!;
}

export function getAllTests(): AITest[] {
  return queryAll<AITest>('SELECT * FROM ai_tests ORDER BY created_at DESC');
}

export function getTestById(id: number): AITest | undefined {
  return queryOne<AITest>('SELECT * FROM ai_tests WHERE id = ?', [id]);
}

export function getTestsByDate(date: string): AITest[] {
  return queryAll<AITest>('SELECT * FROM ai_tests WHERE test_date = ? ORDER BY created_at DESC', [date]);
}

export function deleteTest(id: number): void {
  runSql('DELETE FROM ai_tests WHERE id = ?', [id]);
}