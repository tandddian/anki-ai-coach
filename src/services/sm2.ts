export interface SM2Input {
  quality: number; // 0-5
  repetitions: number;
  easeFactor: number;
  interval: number;
}

export interface SM2Output {
  repetitions: number;
  easeFactor: number;
  interval: number;
  nextReview: Date;
}

/**
 * Pure implementation of the SM-2 spaced repetition algorithm.
 * Quality: 5=perfect, 4=correct after hesitation, 3=correct with difficulty,
 * 2=incorrect, easy recall, 1=incorrect, remembered, 0=complete blackout
 */
export function calculateSM2(input: SM2Input, reviewDate: Date = new Date()): SM2Output {
  const { quality, repetitions, easeFactor, interval } = input;

  let newRepetitions: number;
  let newEaseFactor: number;
  let newInterval: number;

  const q = Math.max(0, Math.min(5, Math.round(quality)));

  if (q >= 3) {
    if (repetitions === 0) {
      newInterval = 1;
    } else if (repetitions === 1) {
      newInterval = 6;
    } else {
      newInterval = Math.round(interval * easeFactor);
    }
    newRepetitions = repetitions + 1;
  } else {
    newRepetitions = 0;
    newInterval = 1;
  }

  // Update ease factor
  newEaseFactor = easeFactor + (0.1 - (5 - q) * (0.08 + (5 - q) * 0.02));
  if (newEaseFactor < 1.3) {
    newEaseFactor = 1.3;
  }

  // Calculate next review date
  const nextReview = new Date(reviewDate);
  nextReview.setDate(nextReview.getDate() + newInterval);
  nextReview.setHours(0, 0, 0, 0);

  return {
    repetitions: newRepetitions,
    easeFactor: Math.round(newEaseFactor * 100) / 100,
    interval: newInterval,
    nextReview,
  };
}
