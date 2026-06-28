import React, { useState } from 'react';
import { useStore } from '../../store';
import { TestViewer } from './TestViewer';
import { TestResult } from './TestResult';
import { formatDate, getDateString } from '../../utils/dateUtils';
import { getDueMaterials } from '../../database/queries';

export function MainContent() {
  const selectedDate = useStore(state => state.selectedDate);
  const selectedTest = useStore(state => state.selectedTest);
  const isGenerating = useStore(state => state.isGenerating);
  const generationError = useStore(state => state.generationError);
  const showTestResults = useStore(state => state.showTestResults);
  const testResults = useStore(state => state.testResults);
  const generateTest = useStore(state => state.generateTest);
  const loadTests = useStore(state => state.loadTests);

  const [showGenerateConfirm, setShowGenerateConfirm] = useState(false);

  const dateStr = getDateString(selectedDate);
  const dueMaterials = getDueMaterials(dateStr);

  const handleGenerateTest = () => {
    setShowGenerateConfirm(false);
    generateTest(selectedDate);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-white">
        <div>
          <h2 className="text-lg font-semibold text-gray-900">
            {formatDate(selectedDate)}
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            {dueMaterials.length} material{dueMaterials.length !== 1 ? 's' : ''} due for review
          </p>
        </div>
        <div className="flex items-center gap-2">
          {!selectedTest && !isGenerating && (
            <button
              onClick={() => {
                if (dueMaterials.length === 0) {
                  alert('No due materials for this date. Import materials first.');
                  return;
                }
                setShowGenerateConfirm(true);
              }}
              className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate Test
            </button>
          )}
          {selectedTest && (
            <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded">
              Test loaded
            </span>
          )}
        </div>
      </div>

      {/* Content area */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Generation loading state */}
        {isGenerating && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-4 border-blue-600 border-t-transparent mb-4"></div>
            <p className="text-gray-700 font-medium">Generating your test...</p>
            <p className="text-gray-500 text-sm mt-1">Analyzing materials and creating questions</p>
          </div>
        )}

        {/* Error state */}
        {!isGenerating && generationError && !showTestResults && (
          <div className="flex flex-col items-center justify-center py-20">
            <div className="w-12 h-12 rounded-full bg-orange-100 flex items-center justify-center mb-4">
              <svg className="w-6 h-6 text-orange-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <p className="text-gray-700 font-medium mb-2">{generationError}</p>
            <button
              onClick={handleGenerateTest}
              className="px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors"
            >
              Try Again
            </button>
          </div>
        )}

        {/* Test Results */}
        {!isGenerating && showTestResults && testResults && (
          <TestResult
            results={testResults}
            totalQuestions={testResults.length}
            correctCount={testResults.filter(r => r.isCorrect).length}
          />
        )}

        {/* Test Viewer */}
        {!isGenerating && !showTestResults && selectedTest && !generationError && (
          <TestViewer />
        )}

        {/* Empty state */}
        {!isGenerating && !selectedTest && !generationError && !showTestResults && (
          <div className="flex flex-col items-center justify-center py-20 text-center">
            <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-1">No Test Available</h3>
            <p className="text-sm text-gray-500 max-w-md mb-4">
              {dueMaterials.length > 0
                ? `You have ${dueMaterials.length} material${dueMaterials.length !== 1 ? 's' : ''} due for review. Generate a test to get started.`
                : 'No materials are due for review on this date. Select a different date or import materials.'}
            </p>
            {dueMaterials.length > 0 && (
              <button
                onClick={() => setShowGenerateConfirm(true)}
                className="px-4 py-2 bg-blue-600 text-white text-sm font-medium rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate AI Test
              </button>
            )}
          </div>
        )}
      </div>

      {/* Generate Test Confirmation Modal */}
      {showGenerateConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div className="modal-overlay absolute inset-0" onClick={() => setShowGenerateConfirm(false)} />
          <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 z-10">
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Generate Test</h3>
            <p className="text-sm text-gray-600 mb-2">
              Generate an AI-powered test for <strong>{formatDate(selectedDate)}</strong>.
            </p>
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-xs text-blue-800">
                <strong>{dueMaterials.length}</strong> material{dueMaterials.length !== 1 ? 's' : ''} due for review:
              </p>
              <ul className="mt-1 space-y-0.5">
                {dueMaterials.slice(0, 5).map(m => (
                  <li key={m.id} className="text-xs text-blue-700 flex items-center gap-1">
                    <span className="w-1 h-1 bg-blue-400 rounded-full inline-block"></span>
                    {m.name}
                  </li>
                ))}
                {dueMaterials.length > 5 && (
                  <li className="text-xs text-blue-500">...and {dueMaterials.length - 5} more</li>
                )}
              </ul>
            </div>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowGenerateConfirm(false)}
                className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleGenerateTest}
                className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Generate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
