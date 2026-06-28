export type MaterialType = 'pdf' | 'docx' | 'pptx' | 'md' | 'anki';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type FolderType = 'material' | 'question';

export interface Material {
  id: number;
  name: string;
  path: string;
  type: MaterialType;
  folderId: number | null;
  contentText: string;
  dueDate: string;
  interval: number;
  easeFactor: number;
  repetitions: number;
  nextReview: string;
  createdAt: string;
}
