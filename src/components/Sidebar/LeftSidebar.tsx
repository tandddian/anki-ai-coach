import React, { useState } from 'react';
import { Calendar } from './Calendar';
import { FolderTree } from './FolderTree';
import { useStore } from '../../store';

export function LeftSidebar() {
  const [calendarOpen, setCalendarOpen] = useState(true);
  const [materialTreeOpen, setMaterialTreeOpen] = useState(true);
  const [questionTreeOpen, setQuestionTreeOpen] = useState(true);

  const addFolder = useStore(state => state.addFolder);

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <h1 className="text-sm font-semibold text-gray-900 truncate">Anki AI Coach</h1>
      </div>

      {/* Calendar Section */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => setCalendarOpen(!calendarOpen)}
          className="w-full flex items-center justify-between p-2 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Calendar</span>
          </div>
          <svg
            className={`w-3 h-3 text-gray-400 transition-transform ${calendarOpen ? 'rotate-90' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        {calendarOpen && (
          <div className="p-2">
            <Calendar />
          </div>
        )}
      </div>

      {/* Material Folder Tree */}
      <div className="border-b border-gray-200">
        <button
          onClick={() => setMaterialTreeOpen(!materialTreeOpen)}
          className="w-full flex items-center justify-between p-2 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
            </svg>
            <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Materials</span>
          </div>
          <svg
            className={`w-3 h-3 text-gray-400 transition-transform ${materialTreeOpen ? 'rotate-90' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        {materialTreeOpen && (
          <div className="px-2 pb-2">
            <button
              onClick={() => addFolder('New Folder', 'material')}
              className="w-full text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded px-2 py-1 text-left transition-colors mb-1"
            >
              + Add Material Folder
            </button>
            <FolderTree folderType="material" />
          </div>
        )}
      </div>

      {/* Question Folder Tree */}
      <div className="flex-1">
        <button
          onClick={() => setQuestionTreeOpen(!questionTreeOpen)}
          className="w-full flex items-center justify-between p-2 hover:bg-gray-50 transition-colors"
        >
          <div className="flex items-center gap-2">
            <svg className="w-4 h-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
            </svg>
            <span className="text-xs font-medium text-gray-700 uppercase tracking-wider">Questions</span>
          </div>
          <svg
            className={`w-3 h-3 text-gray-400 transition-transform ${questionTreeOpen ? 'rotate-90' : ''}`}
            fill="currentColor"
            viewBox="0 0 20 20"
          >
            <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
          </svg>
        </button>
        {questionTreeOpen && (
          <div className="px-2 pb-2">
            <button
              onClick={() => addFolder('New Folder', 'question')}
              className="w-full text-xs text-green-600 hover:text-green-800 hover:bg-green-50 rounded px-2 py-1 text-left transition-colors mb-1"
            >
              + Add Question Folder
            </button>
            <FolderTree folderType="question" />
          </div>
        )}
      </div>
    </div>
  );
}
