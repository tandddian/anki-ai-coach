import React, { useState } from 'react';
import { useStore } from '../../store';
import { QuestionCard } from './QuestionCard';
import { AnswerForm } from './AnswerForm';

export function TestViewer() {
  const selectedTest = useStore(state => state.selectedTest);
  const currentQuestions = useStore(state => state.currentQuestions);
  const submitAnswers = useStore(state => state.submitAnswers);
  const clearTestResults = useStore(state => state.clearTestResults);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [showAllQuestions, setShowAllQuestions] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!selectedTest || currentQuestions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20">
        <p className="text-gray-500">No questions available for this test.</p>
      </div>
    );
  }

  const currentQuestion = currentQuestions[currentQuestionIndex];
  const totalQuestions = currentQuestions.length;
  const answeredCount = Object.keys(answers).length;

  const handleAnswerChange = (questionId: number, answer: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: answer }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < totalQuestions - 1) {
      setCurrentQuestionIndex(currentQuestionIndex + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(currentQuestionIndex - 1);
    }
  };

  const handleSubmitAll = async () => {
    // Check all questions are answered
    const unanswered = currentQuestions.filter(q => !answers[q.id]);
    if (unanswered.length > 0) {
      const proceed = confirm(
        `You have ${unanswered.length} unanswered question${unanswered.length > 1 ? 's' : ''}. Submit anyway?`
      );
      if (!proceed) return;
    }

    setIsSubmitting(true);
    try {
      await submitAnswers(answers);
      setSubmitted(true);
    } catch (error) {
      console.error('Error submitting answers:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReset = () => {
    setAnswers({});
    setCurrentQuestionIndex(0);
    setSubmitted(false);
    clearTestResults();
  };

  const handleToggleView = () => {
    setShowAllQuestions(!showAllQuestions);
  };

  const getDifficultyLabel = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'Easy';
      case 'medium': return 'Medium';
      case 'hard': return 'Hard';
      default: return difficulty;
    }
  };

  const getDifficultyBadgeClass = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'difficulty-easy';
      case 'medium': return 'difficulty-medium';
      case 'hard': return 'difficulty-hard';
      default: return 'bg-gray-500 text-white';
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      {/* Test Header */}
      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">{selectedTest.name}</h3>
        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-sm text-gray-500">
            {totalQuestions} question{totalQuestions !== 1 ? 's' : ''}
          </span>
          {!submitted && (
            <span className="text-sm text-gray-500">
              {answeredCount} answered
            </span>
          )}

          {/* Difficulty breakdown */}
          <div className="flex items-center gap-1.5 ml-auto">
            {['easy', 'medium', 'hard'].map(diff => {
              const count = currentQuestions.filter(q => q.difficulty === diff).length;
              if (count === 0) return null;
              return (
                <span
                  key={diff}
                  className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${getDifficultyBadgeClass(diff)}`}
                >
                  {count} {getDifficultyLabel(diff)}
                </span>
              );
            })}
          </div>

          {/* View toggle */}
          <button
            onClick={handleToggleView}
            className="text-xs text-blue-600 hover:text-blue-800 transition-colors"
          >
            {showAllQuestions ? 'Show one at a time' : 'Show all questions'}
          </button>
        </div>
      </div>

      {/* Questions */}
      {showAllQuestions ? (
        // Show all questions at once
        <div className="space-y-4">
          {currentQuestions.map((question, idx) => (
            <div key={question.id} className="bg-white rounded-lg border border-gray-200 overflow-hidden">
              <QuestionCard
                question={question}
                questionNumber={idx + 1}
                totalQuestions={totalQuestions}
                userAnswer={answers[question.id] || ''}
                onAnswerChange={(answer) => handleAnswerChange(question.id, answer)}
                disabled={submitted}
              />
            </div>
          ))}

          {!submitted && (
            <div className="flex justify-center py-4">
              <button
                onClick={handleSubmitAll}
                disabled={isSubmitting}
                className="px-6 py-2.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : `Submit All Answers (${answeredCount}/${totalQuestions})`}
              </button>
            </div>
          )}
        </div>
      ) : (
        // Show one question at a time
        <div>
          {/* Progress bar */}
          <div className="bg-gray-200 rounded-full h-1.5 mb-4">
            <div
              className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
              style={{ width: `${((currentQuestionIndex + 1) / totalQuestions) * 100}%` }}
            />
          </div>

          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-4">
            <QuestionCard
              question={currentQuestion}
              questionNumber={currentQuestionIndex + 1}
              totalQuestions={totalQuestions}
              userAnswer={answers[currentQuestion.id] || ''}
              onAnswerChange={(answer) => handleAnswerChange(currentQuestion.id, answer)}
              disabled={submitted}
            />
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button
              onClick={handlePrevious}
              disabled={currentQuestionIndex === 0}
              className="px-4 py-2 text-sm text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Previous
            </button>

            <span className="text-sm text-gray-500">
              {currentQuestionIndex + 1} of {totalQuestions}
            </span>

            {currentQuestionIndex < totalQuestions - 1 ? (
              <button
                onClick={handleNext}
                className="px-4 py-2 text-sm text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                onClick={handleSubmitAll}
                disabled={isSubmitting}
                className="px-4 py-2 text-sm text-white bg-green-600 rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {isSubmitting ? 'Submitting...' : 'Submit All'}
              </button>
            )}
          </div>
        </div>
      )}

      {/* Submitted state */}
      {submitted && (
        <div className="mt-4 bg-green-50 border border-green-200 rounded-lg p-4 text-center">
          <p className="text-green-800 font-medium">Answers submitted successfully!</p>
          <p className="text-green-600 text-sm mt-1">Check the results below.</p>
          <button
            onClick={handleReset}
            className="mt-3 px-4 py-2 text-sm text-green-700 bg-white border border-green-300 rounded-lg hover:bg-green-100 transition-colors"
          >
            Retake Test
          </button>
        </div>
      )}
    </div>
  );
}
