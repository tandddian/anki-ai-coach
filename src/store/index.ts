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
