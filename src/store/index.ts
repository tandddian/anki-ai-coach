import { create } from 'zustand';
import {
  Folder, Material, AITest, TestQuestion, TestMaterial, TestAttempt, FolderType,
} from '../types';
import {
  getAllFolders, createFolder, deleteFolder,
  getMaterialsByFolderId, getDueMaterials, getMaterialById, getAllMaterials,
  getTestsByDate, getQuestionsByTestId, getTestMaterialsByTestId, getTestById, getMaterialsByIds,
} from '../database/queries';
import { generateTestForDate } from '../services/testGenerator';
import { scoreTest, getTestResultBreakdown } from '../services/scoring';
import { getDateString } from '../utils/dateUtils';

interface TestResultItem {
  questionId: number;
  difficulty: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  isCorrect: boolean;
}

interface AppState {
  selectedDate: Date;
  selectedTest: AITest | null;
  isGenerating: boolean;
  generationError: string | null;
  testResults: TestResultItem[] | null;
  showTestResults: boolean;

  materials: Material[];
  folders: Folder[];
  tests: AITest[];
  currentQuestions: TestQuestion[];
  currentMaterials: Material[];

  isLoadingFolders: boolean;
  isLoadingMaterials: boolean;
  isLoadingTests: boolean;

  setSelectedDate: (date: Date) => void;
  selectTest: (test: AITest | null) => void;
  loadFolders: () => Promise<void>;
  loadMaterials: (folderId?: number) => Promise<void>;
  loadDueMaterials: (date: Date) => Promise<void>;
  loadTests: (date: Date) => Promise<void>;
  generateTest: (date: Date) => Promise<void>;
  submitAnswers: (answers: Record<number, string>) => Promise<TestAttempt | null>;
  addFolder: (name: string, type: FolderType, parentId?: number | null) => Promise<Folder | null>;
  removeFolder: (id: number) => Promise<void>;
  loadMaterialById: (id: number) => Promise<Material | undefined>;
  refreshMaterials: () => Promise<void>;
  clearTestResults: () => void;
}

export const useStore = create<AppState>((set, get) => ({
  selectedDate: new Date(),
  selectedTest: null,
  isGenerating: false,
  generationError: null,
  testResults: null,
  showTestResults: false,

  materials: [],
  folders: [],
  tests: [],
  currentQuestions: [],
  currentMaterials: [],

  isLoadingFolders: false,
  isLoadingMaterials: false,
  isLoadingTests: false,

  setSelectedDate: (date: Date) => {
    set({ selectedDate: date, selectedTest: null, testResults: null, showTestResults: false });
    get().loadTests(date);
    get().loadDueMaterials(date);
  },

  selectTest: (test: AITest | null) => {
    set({ selectedTest: test, testResults: null, showTestResults: false });
    if (test) {
      try {
        const questions = getQuestionsByTestId(test.id);
        const testMaterials = getTestMaterialsByTestId(test.id);
        const materialIds = testMaterials.map(tm => tm.materialId);
        const materials = getMaterialsByIds(materialIds);
        set({ currentQuestions: questions, currentMaterials: materials });
      } catch (error) {
        console.error('Error loading test details:', error);
        set({ currentQuestions: [], currentMaterials: [] });
      }
    } else {
      set({ currentQuestions: [], currentMaterials: [] });
    }
  },
