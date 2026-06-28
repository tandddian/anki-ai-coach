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

  testListRefreshKey: number;

  setSelectedDate: (date: Date) => void;
  selectTest: (test: AITest | null) => void;
  selectTestFromList: (test: AITest) => void;
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

  testListRefreshKey: 0,

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

  selectTestFromList: (test: AITest) => {
    const testDate = new Date(test.testDate);
    const dateStr = getDateString(testDate);
    const questions = getQuestionsByTestId(test.id);
    const testMaterials = getTestMaterialsByTestId(test.id);
    const materialIds = testMaterials.map(tm => tm.materialId);
    const materials = getMaterialsByIds(materialIds);
    const tests = getTestsByDate(dateStr);
    const dueMaterials = getDueMaterials(dateStr);
    set({
      selectedDate: testDate,
      selectedTest: test,
      currentQuestions: questions,
      currentMaterials: materials,
      tests,
      materials: dueMaterials,
      testResults: null,
      showTestResults: false,
    });
  },

  loadFolders: async () => {
    set({ isLoadingFolders: true });
    try {
      const folders = getAllFolders();
      set({ folders, isLoadingFolders: false });
    } catch (error) {
      console.error('Error loading folders:', error);
      set({ isLoadingFolders: false });
    }
  },

  loadMaterials: async (folderId?: number) => {
    set({ isLoadingMaterials: true });
    try {
      if (folderId) {
        const materials = getMaterialsByFolderId(folderId);
        set({ materials, isLoadingMaterials: false });
      } else {
        const materials = getAllMaterials();
        set({ materials, isLoadingMaterials: false });
      }
    } catch (error) {
      console.error('Error loading materials:', error);
      set({ isLoadingMaterials: false });
    }
  },

  loadDueMaterials: async (date: Date) => {
    try {
      const dateStr = getDateString(date);
      const materials = getDueMaterials(dateStr);
      set({ materials });
    } catch (error) {
      console.error('Error loading due materials:', error);
    }
  },

  loadTests: async (date: Date) => {
    set({ isLoadingTests: true });
    try {
      const dateStr = getDateString(date);
      const tests = getTestsByDate(dateStr);
      set({ tests, isLoadingTests: false });
      if (tests.length > 0) {
        get().selectTest(tests[0]);
      } else {
        set({ selectedTest: null, currentQuestions: [], currentMaterials: [] });
      }
    } catch (error) {
      console.error('Error loading tests:', error);
      set({ isLoadingTests: false });
    }
  },

  generateTest: async (date: Date) => {
    set({ isGenerating: true, generationError: null });
    try {
      const dateStr = getDateString(date);
      const test = await generateTestForDate(dateStr);
      if (test) {
        set({ isGenerating: false });
        await get().loadTests(date);
        get().selectTest(test);
        set(state => ({ testListRefreshKey: state.testListRefreshKey + 1 }));
      } else {
        set({
          isGenerating: false,
          generationError: 'No due materials available for this date. Import materials to get started.',
        });
      }
    } catch (error: any) {
      console.error('Error generating test:', error);
      set({
        isGenerating: false,
        generationError: error.message || 'Failed to generate test. Please try again.',
      });
    }
  },

  submitAnswers: async (answers: Record<number, string>) => {
    const { selectedTest } = get();
    if (!selectedTest) return null;
    try {
      const attempt = scoreTest(selectedTest.id, answers);
      const breakdown = getTestResultBreakdown(selectedTest.id, answers);
      set({ testResults: breakdown, showTestResults: true });
      return attempt;
    } catch (error) {
      console.error('Error submitting answers:', error);
      return null;
    }
  },

  addFolder: async (name: string, type: FolderType, parentId: number | null = null) => {
    try {
      const folder = createFolder(name, type, parentId);
      await get().loadFolders();
      return folder;
    } catch (error) {
      console.error('Error adding folder:', error);
      return null;
    }
  },

  removeFolder: async (id: number) => {
    try {
      deleteFolder(id);
      await get().loadFolders();
    } catch (error) {
      console.error('Error removing folder:', error);
    }
  },

  loadMaterialById: async (id: number) => {
    try {
      return getMaterialById(id);
    } catch (error) {
      console.error('Error loading material:', error);
      return undefined;
    }
  },

  refreshMaterials: async () => {
    await get().loadMaterials();
    await get().loadFolders();
  },

  clearTestResults: () => {
    set({ testResults: null, showTestResults: false });
  },
}));
