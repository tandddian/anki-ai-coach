import React from 'react';
import { TestQuestion } from '../../types';

interface AnswerFormProps {
  question: TestQuestion;
  userAnswer: string;
  onAnswerChange: (answer: string) => void;
  disabled?: boolean;
  showResult?: boolean;
  correctAnswer?: string;
}

export function AnswerForm({
  question,
  userAnswer,
  onAnswerChange,
  disabled = false,
  showResult = false,
  correctAnswer,
}: AnswerFormProps) {
  const questionType = question.questionType || 'multiple_choice';
  const hasOptions = question.options && question.options.length > 0;

  // Essay question: large textarea (no options)
  if (questionType === 'essay' || (!hasOptions && questionType !== 'multiple_choice')) {
    return (
      <div>
        <textarea
          value={userAnswer}
          onChange={(e) => onAnswerChange(e.target.value)}
          disabled={disabled}
          placeholder="Write your answer here... (minimum a few sentences)"
          rows={6}
          className={`
            w-full px-3 py-2 text-sm border rounded-lg resize-none
            focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
            disabled:bg-gray-50 disabled:text-gray-500
            ${showResult && correctAnswer
              ? userAnswer.trim().toLowerCase().includes(correctAnswer.trim().toLowerCase()) ||
                correctAnswer.trim().toLowerCase().includes(userAnswer.trim().toLowerCase())
                ? 'border-green-500 bg-green-50'
                : 'border-red-500 bg-red-50'
              : 'border-gray-300'
            }
          `}
        />
        {showResult && correctAnswer && (
          <div className="mt-2">
            <p className="text-xs text-gray-500">Model answer:</p>
            <p className="text-sm text-gray-800 mt-1 p-2 bg-gray-50 rounded">{correctAnswer}</p>
          </div>
        )}
      </div>
    );
  }

  // Fill-in-blank: render question text with inline input
  if (questionType === 'fill_in_blank' && question.questionText.includes('___')) {
    const parts = question.questionText.split('___');
    return (
      <div className="space-y-3">
        <div className="text-sm text-gray-800 leading-relaxed">
          {parts[0]}
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => onAnswerChange(e.target.value)}
            disabled={disabled}
            placeholder="______"
            className={`inline-block min-w-[120px] px-2 py-0.5 text-sm border-b-2
              focus:outline-none focus:border-blue-500
              disabled:bg-gray-50 disabled:text-gray-500
              ${showResult && correctAnswer
                ? userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
                  ? 'border-green-500 bg-green-50'
                  : 'border-red-500 bg-red-50'
                : 'border-gray-300'
              }
            `}
          />
          {parts[1]}
        </div>

        {/* Clickable options for fill-in-blank */}
        <div className="space-y-2">
          {question.options.map((option, idx) => {
            const match = option.match(/^([A-D])[.)]\s*(.+)$/i);
            const label = match ? match[1] : String.fromCharCode(65 + idx);
            const text = match ? match[2] : option;
            const isSelected = userAnswer.toUpperCase() === label.toUpperCase();
            const isCorrectAnswer = correctAnswer?.toUpperCase() === label.toUpperCase();
            const showCorrect = showResult && isCorrectAnswer;
            const showWrong = showResult && isSelected && !isCorrectAnswer;
            return (
              <label
                key={idx}
                className={`flex items-start gap-3 p-3 rounded-lg border cursor-pointer
                  ${disabled ? 'cursor-not-allowed' : 'hover:border-blue-300'}
                  ${isSelected && !showResult ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                  ${showCorrect ? 'border-green-500 bg-green-50' : ''}
                  ${showWrong ? 'border-red-500 bg-red-50' : ''}
                `}
                onClick={() => { if (!disabled) onAnswerChange(label); }}
              >
                <input type="radio" name={`question-${question.id}`} value={label}
                  checked={isSelected} onChange={() => onAnswerChange(label)}
                  disabled={disabled} className="mt-0.5 text-blue-600 focus:ring-blue-500" />
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-semibold text-gray-500 w-5">{label}.</span>
                    <span className="text-sm text-gray-700">{text}</span>
                  </div>
                  {showCorrect && (
                    <span className="text-xs text-green-600 mt-1 inline-block">Correct answer</span>
                  )}
                  {showWrong && (
                    <span className="text-xs text-red-600 mt-1 inline-block">Your answer</span>
                  )}
                </div>
              </label>
            );
          })}
        </div>
      </div>
    );
  }

  // Multiple choice
  if (hasOptions) {
    return (
      <div className="space-y-2">
        {question.options.map((option, idx) => {
          const match = option.match(/^([A-D])[.)]\s*(.+)$/i);
          const label = match ? match[1] : String.fromCharCode(65 + idx);
          const text = match ? match[2] : option;

          const isSelected = userAnswer.toUpperCase() === label.toUpperCase();
          const isCorrectAnswer = correctAnswer?.toUpperCase() === label.toUpperCase();
          const showCorrect = showResult && isCorrectAnswer;
          const showWrong = showResult && isSelected && !isCorrectAnswer;

          return (
            <label
              key={idx}
              className={`
                flex items-start gap-3 p-3 rounded-lg border cursor-pointer transition-all
                ${disabled ? 'cursor-not-allowed' : 'cursor-pointer hover:border-blue-300'}
                ${isSelected && !showResult ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}
                ${showCorrect ? 'border-green-500 bg-green-50' : ''}
                ${showWrong ? 'border-red-500 bg-red-50' : ''}
              `}
            >
              <input
                type="radio"
                name={`question-${question.id}`}
                value={label}
                checked={isSelected}
                onChange={() => onAnswerChange(label)}
                disabled={disabled}
                className="mt-0.5 text-blue-600 focus:ring-blue-500"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-500 w-5">{label}.</span>
                  <span className="text-sm text-gray-700">{text}</span>
                </div>
                {showCorrect && (
                  <span className="text-xs text-green-600 mt-1 inline-block">
                    Correct answer
                  </span>
                )}
                {showWrong && (
                  <span className="text-xs text-red-600 mt-1 inline-block">
                    Your answer
                  </span>
                )}
              </div>
            </label>
          );
        })}
      </div>
    );
  }

  // Fallback: text input for any other case
  return (
    <div>
      <textarea
        value={userAnswer}
        onChange={(e) => onAnswerChange(e.target.value)}
        disabled={disabled}
        placeholder="Type your answer here..."
        rows={4}
        className={`
          w-full px-3 py-2 text-sm border rounded-lg resize-none
          focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
          disabled:bg-gray-50 disabled:text-gray-500
          ${showResult && correctAnswer
            ? userAnswer.trim().toLowerCase() === correctAnswer.trim().toLowerCase()
              ? 'border-green-500 bg-green-50'
              : 'border-red-500 bg-red-50'
            : 'border-gray-300'
          }
        `}
      />
      {showResult && correctAnswer && (
        <div className="mt-2">
          <p className="text-xs text-gray-500">Model answer:</p>
          <p className="text-sm text-gray-800 mt-1 p-2 bg-gray-50 rounded">{correctAnswer}</p>
        </div>
      )}
    </div>
  );
}
