import React from 'react';
import { useStore } from '../../store';

interface TestResultItem {
  questionId: number;
  difficulty: string;
  questionText: string;
  userAnswer: string;
  correctAnswer: string;
  explanation: string;
  isCorrect: boolean;
}

interface TestResultProps {
  results: TestResultItem[];
  totalQuestions: number;
  correctCount: number;
}

export function TestResult({ results, totalQuestions, correctCount }: TestResultProps) {
  const currentQuestions = useStore(state => state.currentQuestions);
  const score = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getScoreBg = (score: number) => {
    if (score >= 80) return 'bg-green-50 border-green-200';
    if (score >= 60) return 'bg-yellow-50 border-yellow-200';
    return 'bg-red-50 border-red-200';
  };

  const getDifficultyBadgeClass = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'difficulty-easy';
      case 'medium': return 'difficulty-medium';
      case 'hard': return 'difficulty-hard';
      default: return 'bg-gray-500 text-white';
    }
  };

  const difficultyBreakdown = ['easy', 'medium', 'hard'].map(diff => {
    const diffResults = results.filter(r => r.difficulty === diff);
    const diffTotal = diffResults.length;
    const diffCorrect = diffResults.filter(r => r.isCorrect).length;
    return { difficulty: diff, total: diffTotal, correct: diffCorrect };
  }).filter(d => d.total > 0);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Score Summary */}
      <div className={`rounded-xl border p-6 ${getScoreBg(score)}`}>
        <div className="text-center">
          <h2 className="text-3xl font-bold mb-1">
            <span className={getScoreColor(score)}>{score}%</span>
          </h2>
          <p className="text-sm text-gray-600">
            {correctCount} of {totalQuestions} correct
          </p>
        </div>

        {/* Difficulty breakdown */}
        <div className="grid grid-cols-3 gap-3 mt-4">
          {difficultyBreakdown.map(diff => (
            <div key={diff.difficulty} className="text-center">
              <span className={`inline-block text-[10px] px-2 py-0.5 rounded-full font-medium mb-1 ${getDifficultyBadgeClass(diff.difficulty)}`}>
                {diff.difficulty}
              </span>
              <p className="text-sm font-semibold text-gray-900">
                {diff.total > 0 ? Math.round((diff.correct / diff.total) * 100) : 0}%
              </p>
              <p className="text-xs text-gray-500">
                {diff.correct}/{diff.total}
              </p>
            </div>
          ))}
        </div>

        {/* Score bar */}
        <div className="mt-4">
          <div className="bg-gray-200 rounded-full h-2.5">
            <div
              className={`h-2.5 rounded-full transition-all duration-500 ${
                score >= 80 ? 'bg-green-500' : score >= 60 ? 'bg-yellow-500' : 'bg-red-500'
              }`}
              style={{ width: `${score}%` }}
            />
          </div>
          <div className="flex justify-between mt-1 text-[10px] text-gray-400">
            <span>0%</span>
            <span>50%</span>
            <span>100%</span>
          </div>
        </div>
      </div>

      {/* Per-question breakdown */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Detailed Results</h3>
        <div className="space-y-3">
          {results.map((result, idx) => (
            <div
              key={result.questionId}
              className={`bg-white rounded-lg border p-4 ${
                result.isCorrect ? 'border-l-4 border-l-green-500' : 'border-l-4 border-l-red-500'
              }`}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-gray-900">Q{idx + 1}</span>
                  <span className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getDifficultyBadgeClass(result.difficulty)}`}>
                    {result.difficulty}
                  </span>
                </div>
                <span className={`text-xs font-medium ${
                  result.isCorrect ? 'text-green-600' : 'text-red-600'
                }`}>
                  {result.isCorrect ? 'Correct' : 'Incorrect'}
                </span>
              </div>

              <p className="text-sm text-gray-700 mb-3">{result.questionText}</p>

              {/* Answer comparison */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <p className="text-gray-500 font-medium mb-1">Your Answer:</p>
                  <p className={`${result.isCorrect ? 'text-green-700' : 'text-red-700'}`}>
                    {result.userAnswer || '(no answer)'}
                  </p>
                </div>
                <div>
                  <p className="text-gray-500 font-medium mb-1">Correct Answer:</p>
                  <p className="text-green-700">{result.correctAnswer}</p>
                </div>
              </div>

              {result.explanation && (
                <div className="mt-3 p-2 bg-gray-50 rounded text-xs text-gray-600">
                  {result.explanation}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* SM-2 Schedule Preview */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h4 className="text-sm font-semibold text-blue-900 mb-2">Review Schedule Updated</h4>
        <p className="text-xs text-blue-700">
          Based on your performance, the SM-2 spaced repetition algorithm has updated the review schedule
          for all materials in this test. Your next review dates have been adjusted based on your performance.
        </p>
        <div className="mt-2 space-y-1 text-xs text-blue-600">
          <p>- Questions answered correctly will be reviewed less frequently</p>
          <p>- Questions answered incorrectly will be reviewed more frequently</p>
          <p>- Ease factors have been adjusted based on performance</p>
        </div>
      </div>
    </div>
  );
}
