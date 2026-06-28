export type MaterialType = 'pdf' | 'docx' | 'pptx' | 'md' | 'anki';

export type Difficulty = 'easy' | 'medium' | 'hard';

export type QuestionType = 'multiple_choice' | 'fill_in_blank' | 'essay';

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

export interface AITest {
  id: number;
  name: string;
  testDate: string;
  createdAt: string;
}

export interface TestQuestion {
  id: number;
  testId: number;
  difficulty: Difficulty;
  questionType: QuestionType;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
}

export interface TestMaterial {
  id: number;
  testId: number;
  materialId: number;
}

export interface TestAttempt {
  id: number;
  testId: number;
  answers: Record<number, string>;
  score: number;
  completedAt: string;
}

export interface MaterialCorrelation {
  id: number;
  material1Id: number;
  material2Id: number;
  correlationScore: number;
}

export interface AIGeneratedQuestion {
  difficulty: Difficulty;
  questionType: QuestionType;
  questionText: string;
  options: string[];
  correctAnswer: string;
  explanation: string;
  sourceMaterialIds: number[];
}

export interface AIGeneratedTest {
  name: string;
  questions: AIGeneratedQuestion[];
  correlations: { material1Id: number; material2Id: number; score: number }[];
}

export interface CalendarDay {
  date: Date;
  isCurrentMonth: boolean;
  isToday: boolean;
  isSelected: boolean;
  hasDueMaterials: boolean;
}

export interface ElectronAPI {
  openFileDialog: () => Promise<string[]>;
  readFile: (path: string) => Promise<Buffer>;
  saveFile: (path: string, data: string) => Promise<void>;
  dbOperation: (operation: string, params: any) => Promise<any>;
  getAppPath: () => Promise<string>;
  readDbFile: () => Promise<ArrayBuffer | null>;
  saveDbFile: (data: ArrayBuffer) => Promise<void>;
  loadWasm: () => Promise<ArrayBuffer | null>;
}
export interface Folder {
  id: number;
  name: string;
  type: FolderType;
  parentId: number | null;
  createdAt: string;
}
