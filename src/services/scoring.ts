import { TestQuestion, TestAttempt, Material } from '../types';
import { getQuestionsByTestId, getTestMaterialsByTestId, getMaterialsByIds, createAttempt } from '../database/queries';
import { calculateSM2, materialPerformanceToQuality } from './sm2';
import { updateMaterialSM2 } from '../database/queries';

export function scoreTest(
  testId: number,
  userAnswers: Record<number, string>
): TestAttempt {
  const questions = getQuestionsByTestId(testId);

  let totalCorrect = 0;
  const questionResults: Map<number, boolean> = new Map();

  for (const question of questions) {
    const userAnswer = userAnswers[question.id] || '';
    const isCorrect = checkAnswer(userAnswer.trim(), question.correctAnswer.trim(), question.options);
    questionResults.set(question.id, isCorrect);
    if (isCorrect) totalCorrect++;
  }

  const totalQuestions = questions.length;
  const score = totalQuestions > 0 ? Math.round((totalCorrect / totalQuestions) * 100) : 0;

  const attempt = createAttempt(testId, userAnswers, score);
  updateMaterialSchedules(testId, questions, questionResults);

  return attempt;
}

function updateMaterialSchedules(
  testId: number,
  questions: TestQuestion[],
  questionResults: Map<number, boolean>
): void {
  const testMaterials = getTestMaterialsByTestId(testId);
  const materialIds = testMaterials.map(tm => tm.materialId);
  const materials = getMaterialsByIds(materialIds);

  const materialPerformance: Map<number, { correct: number; total: number }> = new Map();
  for (const materialId of materialIds) {
    materialPerformance.set(materialId, { correct: 0, total: questions.length });
  }

  for (const question of questions) {
    const isCorrect = questionResults.get(question.id) || false;
    const increment = 1 / materialIds.length;
    for (const materialId of materialIds) {
      const current = materialPerformance.get(materialId)!;
      if (isCorrect) {
        current.correct += increment;
      }
    }
  }

  for (const material of materials) {
    const perf = materialPerformance.get(material.id);
    if (!perf) continue;

    const quality = materialPerformanceToQuality(
      Math.round(perf.correct),
      Math.round(perf.total)
    );

    const sm2Input = {
      quality,
      repetitions: material.repetitions,
      easeFactor: material.easeFactor,
      interval: material.interval,
    };

    const sm2Output = calculateSM2(sm2Input);

    updateMaterialSM2(
      material.id,
      sm2Output.interval,
      sm2Output.easeFactor,
      sm2Output.repetitions,
      sm2Output.nextReview.toISOString().split('T')[0]
    );
  }
}