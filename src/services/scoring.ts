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

function checkAnswer(userAnswer: string, correctAnswer: string, options: string[]): boolean {
  const normalizedUser = userAnswer.toUpperCase().trim();
  const normalizedCorrect = correctAnswer.toUpperCase().trim();

  // Direct letter match (e.g., both user and correct are "A")
  if (normalizedUser === normalizedCorrect) return true;

  // Check if user answered with the full option text
  for (const option of options) {
    const match = option.match(/^([A-D])[.)]?\s*(.+)$/i);
    if (match) {
      const letter = match[1].toUpperCase();
      const text = match[2].trim();
      // User typed full text matching correct answer text
      if (letter === normalizedCorrect && normalizedUser === text.toUpperCase()) {
        return true;
      }
      // User typed letter, and the option text matches the correct answer word/phrase
      if (letter === normalizedUser && text.toUpperCase() === normalizedCorrect.toUpperCase()) {
        return true;
      }
    }
  }

  // Fill-in-blank / word-level matching (case-insensitive, trimmed)
  // This handles cases where the correctAnswer is a word/phrase (not a letter)
  // and the user typed the word directly, or selected a letter whose option text contains the word
  if (options.length > 0) {
    const cleanUser = userAnswer.trim();
    const cleanCorrect = correctAnswer.trim();
    if (cleanUser.toLowerCase() === cleanCorrect.toLowerCase()) {
      return true;
    }
    // Also check if user selected a letter that corresponds to the correct word
    const userLetter = cleanUser.toUpperCase();
    if (/^[A-D]$/.test(userLetter)) {
      const idx = userLetter.charCodeAt(0) - 65;
      if (idx < options.length) {
        const optMatch = options[idx].match(/^[A-D][.)]?\s*(.+)$/i);
        if (optMatch) {
          const optText = optMatch[1].trim();
          if (optText.toLowerCase() === cleanCorrect.toLowerCase()) {
            return true;
          }
        }
      }
    }
  }

  // Open-ended / essay question matching (no options)
  if (options.length === 0) {
    return normalizedUser.includes(normalizedCorrect) ||
           normalizedCorrect.includes(normalizedUser);
  }

  return false;
}

export function getTestResultBreakdown(
  testId: number,
  userAnswers: Record<number, string>
): {
  questionId: number;
  difficulty: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  isCorrect: boolean;
}[] {
  const questions = getQuestionsByTestId(testId);

  return questions.map(q => {
    const userAnswer = userAnswers[q.id] || '';
    const isCorrect = checkAnswer(userAnswer.trim(), q.correctAnswer.trim(), q.options);

    return {
      questionId: q.id,
      difficulty: q.difficulty,
      questionText: q.questionText,
      userAnswer,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      isCorrect,
    };
  });
}