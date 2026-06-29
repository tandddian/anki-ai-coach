import React, { useState, useEffect } from 'react';
import { getTestsBySource } from '../../database/queries';
import { useStore } from '../../store';
import { AITest } from '../../types';

export function TestList({ source }: { source: 'generated' | 'imported' }) {
  const selectedTest = useStore(state => state.selectedTest);
  const selectTestFromList = useStore(state => state.selectTestFromList);
  const testListRefreshKey = useStore(state => state.testListRefreshKey);

  const [tests, setTests] = useState<AITest[]>([]);

  useEffect(() => {
    setTests(getTestsBySource(source));
  }, [testListRefreshKey]);

  if (tests.length === 0) {
    return (
      <div className="px-3 py-4 text-xs text-gray-400 text-center leading-relaxed">
        No tests yet. Generate a test to get started.
      </div>
    );
  }

  return (
    <div className="overflow-y-auto" style={{ maxHeight: '300px' }}>
      {tests.map(test => {
        const isSelected = selectedTest?.id === test.id;
        return (
          <div
            key={test.id}
            className={`flex items-center gap-2 py-1 px-2 mx-1 rounded cursor-pointer text-xs transition-colors ${
              isSelected
                ? 'bg-green-100 text-green-800 font-medium'
                : 'text-gray-700 hover:bg-gray-50'
            }`}
            onClick={() => selectTestFromList(test)}
          >
            <svg
              className={`w-3.5 h-3.5 flex-shrink-0 ${
                isSelected ? 'text-green-500' : 'text-green-400'
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"
              />
            </svg>
            <span className="flex-1 truncate">{test.name}</span>
          </div>
        );
      })}
    </div>
  );
}
