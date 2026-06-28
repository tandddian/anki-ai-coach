import React from 'react';
import { TestQuestion } from '../../types';
import { AnswerForm } from './AnswerForm';

interface QuestionCardProps {
  question: TestQuestion;
  questionNumber: number;
  totalQuestions: number;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled?: boolean;
  showResult?: boolean;
  isCorrect?: boolean;
  correctAnswer?: string;
  explanation?: string;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  userAnswer,
  onAnswerChange,
  disabled = false,
  showResult = false,
  isCorrect,
  correctAnswer,
  explanation,
}: QuestionCardProps) {
  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Easy';
      case 'medium': return 'Medium';
      case 'hard': return 'Hard';
      default: return difficulty;
    }
  };

  const getDifficultyClass = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'difficulty-easy';
      case 'medium': return 'difficulty-medium';
      case 'hard': return 'difficulty-hard';
      default: return 'bg-gray-500 text-white';
    }
  };

  const getDifficultyIcon = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
        );
      case 'medium':
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
          </svg>
        );
      case 'hard':
        return (
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z" />
          </svg>
        );
      default:
        return null;
    }
  };

  return (
    <div className="question-card p-4">
      {/* Question header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xs font-medium text-gray-400">
            Q{questionNumber}
            {totalQuestions > 0 && `/${totalQuestions}`}
          </span>
          <span className={`inline-flex items-center gap-1 text-[10px] px-2 py-0.5 rounded-full font-medium ${getDifficultyClass(question.difficulty)}`}>
            {getDifficultyIcon(question.difficulty)}
            {getDifficultyLabel(question.difficulty)}
          </span>
        </div>

        {showResult && (
          <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${
            isCorrect ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
          }`}>
            {isCorrect ? 'Correct' : 'Incorrect'}
          </span>
        )}
      </div>

      {/* Question text */}
      <div className="mb-4">
        <p className="text-sm text-gray-800 leading-relaxed whitespace-pre-wrap">
          {question.questionText}
        </p>
      </div>

      {/* Answer area */}
      <AnswerForm
        question={question}
        userAnswer={userAnswer}
        onAnswerChange={onAnswerChange}
        disabled={disabled}
        showResult={showResult}
        correctAnswer={correctAnswer}
      />

      {/* Result explanation */}
      {showResult && explanation && (
        <div className={`mt-3 p-3 rounded-lg text-xs ${
          isCorrect ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'
        }`}>
          <p className={`font-medium mb-1 ${isCorrect ? 'text-green-800' : 'text-red-800'}`}>
            {isCorrect ? 'Great job!' : 'Explanation:'}
          </p>
          <p className={isCorrect ? 'text-green-700' : 'text-red-700'}>
            {explanation}
          </p>
          {!isCorrect && correctAnswer && (
            <p className="mt-1 text-red-700">
              <strong>Correct answer:</strong> {correctAnswer}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
