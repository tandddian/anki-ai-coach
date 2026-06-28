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

  const test = createTest(generatedTest.name, date);

  generatedTest.questions.map(q =>
    createQuestion(test.id, q.difficulty, q.questionType, q.questionText, q.options, q.correctAnswer, q.explanation)
  );

  const materialIdSet = new Set<number>();
  for (const question of generatedTest.questions) {
    for (const materialId of question.sourceMaterialIds) {
      materialIdSet.add(materialId);
    }
  }
  for (const materialId of materialIdSet) {
    createTestMaterial(test.id, materialId);
  }

  return test;
}

export async function getOrGenerateTest(date: string): Promise<AITest | null> {
  const existingTests = getTestsByDate(date);
  if (existingTests.length > 0) {
    return existingTests[0];
  }
  return generateTestForDate(date);
}