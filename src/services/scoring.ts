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