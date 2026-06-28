import React, { useEffect } from 'react';
import { DoubleWingLayout } from './components/Layout/DoubleWingLayout';
import { useStore } from './store';
import { useDatabaseInit } from './hooks/useDatabaseInit';

export default function App() {
  const { initComplete, error } = useDatabaseInit();
  const loadFolders = useStore(state => state.loadFolders);
  const loadTests = useStore(state => state.loadTests);
  const selectedDate = useStore(state => state.selectedDate);

  useEffect(() => {
    if (initComplete) {
      loadFolders();
      loadTests(selectedDate);
    }
  }, [initComplete, loadFolders, loadTests, selectedDate]);

  if (error) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center p-8 max-w-md">
          <div className="text-red-500 text-5xl mb-4">!</div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Database Error</h1>
          <p className="text-gray-600">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="mt-4 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  if (!initComplete) {
    return (
      <div className="h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent mb-4"></div>
          <p className="text-gray-600">Initializing database...</p>
        </div>
      </div>
    );
  }

  return <DoubleWingLayout />;
}