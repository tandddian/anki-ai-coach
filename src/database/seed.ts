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

  console.log('Creating materials...');

  const calculusMaterial = createMaterial(
    'Introduction to Calculus',
    '/sample/calculus_intro.pdf',
    'pdf',
    mathFolder.id,
    `Calculus is the mathematical study of continuous change. It has two major branches:
    differential calculus and integral calculus. Differential calculus concerns rates of change
    and slopes of curves, while integral calculus concerns accumulation of quantities and areas
    under curves. The fundamental theorem of calculus relates differentiation and integration,
    showing that these two operations are essentially inverses of each other.

    Key concepts:
    1. Limits: The foundation of calculus, defining how functions behave as they approach a point.
    2. Derivatives: Measure the rate of change of a function. Notation: f'(x) or dy/dx.
    3. Integrals: Represent the area under a curve. Notation: ∫f(x)dx.
    4. The Fundamental Theorem of Calculus: ∫_a^b f(x)dx = F(b) - F(a) where F'(x) = f(x).
    5. Applications: Optimization, related rates, area and volume calculations.

    Important rules:
    - Power Rule: d/dx(x^n) = nx^(n-1)
    - Product Rule: d/dx[f(x)g(x)] = f'(x)g(x) + f(x)g'(x)
    - Chain Rule: d/dx[f(g(x))] = f'(g(x)) * g'(x)`
  );