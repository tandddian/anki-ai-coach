/**
 * Seed script to populate the database with sample data for testing.
 * Run with: pnpm seed
 */

import { initDatabase, closeDatabase } from './connection';
import { createTables } from './schema';
import {
  createFolder,
  createMaterial,
  createTest,
  createQuestion,
  createTestMaterial,
  createCorrelation,
  updateMaterialSM2,
} from './queries';

function getDateString(date: Date): string {
  return date.toISOString().split('T')[0];
}

function getDateOffset(daysFromNow: number): string {
  const date = new Date();
  date.setDate(date.getDate() + daysFromNow);
  return getDateString(date);
}

async function seed(): Promise<void> {
  console.log('Initializing database...');

  await initDatabase();
  createTables();

  console.log('Creating folders...');

  const mathFolder = createFolder('Mathematics', 'material');
  const historyFolder = createFolder('History', 'material');
  const scienceFolder = createFolder('Science', 'material');
  const programmingFolder = createFolder('Programming', 'material');
  const languagesFolder = createFolder('Languages', 'material');

  const mathReview = createFolder('Math Review', 'question');
  const historyReview = createFolder('History Review', 'question');
  const scienceReview = createFolder('Science Review', 'question');