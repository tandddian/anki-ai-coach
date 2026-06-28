import { AITest, Material } from '../types';
import { getDueMaterials, createTest, createQuestion, createTestMaterial, getTestsByDate } from '../database/queries';
import { analyzeCorrelations } from './correlation';
import { generateTest as generateAITest } from './ai';

export async function generateTestForDate(date: string): Promise<AITest | null> {
  const dueMaterials = getDueMaterials(date);

  if (dueMaterials.length === 0) {
    console.log('No due materials for date:', date);
    return null;
  }

  const correlations = await analyzeCorrelations(dueMaterials);

  const generatedTest = await generateAITest(dueMaterials, correlations.map(c => ({
    material1Id: c.material1Id,
    material2Id: c.material2Id,
    score: c.correlationScore,
  })));