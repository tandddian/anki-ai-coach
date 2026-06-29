import React, { useState } from 'react';
import { useStore } from '../../store';
import { SourceMaterialList } from './SourceMaterialList';
import { ImportButton } from '../Main/ImportButton';
import { setAIKey, getAIKey } from '../../services/ai';

export function RightSidebar() {
  const selectedTest = useStore(state => state.selectedTest);
  const selectedDate = useStore(state => state.selectedDate);
  const currentMaterials = useStore(state => state.currentMaterials);
  const currentQuestions = useStore(state => state.currentQuestions);
  const materials = useStore(state => state.materials);

  const [activeTab, setActiveTab] = useState<'materials' | 'info'>('materials');
  const [showApiKeyInput, setShowApiKeyInput] = useState(false);
  const [apiKeyValue, setApiKeyValue] = useState(getAIKey() || '');

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-3 border-b border-gray-200 bg-gray-50">
        <h2 className="text-sm font-semibold text-gray-700">Details</h2>
      </div>

      {/* Action buttons */}
      <div className="p-2 border-b border-gray-200 flex gap-1">
        <ImportButton />
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab('materials')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            activeTab === 'materials'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Materials ({currentMaterials.length})
        </button>
        <button
          onClick={() => setActiveTab('info')}
          className={`flex-1 py-2 text-xs font-medium transition-colors ${
            activeTab === 'info'
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          Info
        </button>
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'materials' && (
          selectedTest ? (
            <SourceMaterialList materials={currentMaterials} />
          ) : (
            <div className="p-4 text-center">
              <svg className="w-10 h-10 text-gray-300 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-xs text-gray-500">Select a test to view source materials</p>
            </div>
          )
        )}

        {activeTab === 'info' && (
          <div className="p-3 space-y-3">
            {selectedTest ? (
              <>
                <div className="bg-gray-50 rounded-lg p-3">
                  <p className="text-[10px] font-medium text-gray-500 uppercase mb-1">Current Test</p>
                  <p className="text-xs text-gray-900 font-medium">{selectedTest.name}</p>
                  <p className="text-[10px] text-gray-500 mt-1">
                    {currentQuestions.length} questions
                  </p>
                </div>

                {currentMaterials.length > 0 && (
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p className="text-[10px] font-medium text-gray-500 uppercase mb-1">Source Materials</p>
                    <div className="space-y-1">
                      {currentMaterials.map(m => (
                        <p key={m.id} className="text-xs text-gray-700">{m.name}</p>
                      ))}
                    </div>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-8">
                <p className="text-xs text-gray-500">No test selected</p>
                <p className="text-[10px] text-gray-400 mt-1">
                  Generate a test from the center panel
                </p>
              </div>
            )}

            <div className="bg-gray-50 rounded-lg p-3">
              <p className="text-[10px] font-medium text-gray-500 uppercase mb-2">Quick Stats</p>
              <div className="space-y-1 text-xs">
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Materials</span>
                  <span className="text-gray-900 font-medium">
                    {materials.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Total Folders</span>
                  <span className="text-gray-900 font-medium">
                    {useStore.getState().folders.length}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500">Tests Today</span>
                  <span className="text-gray-900 font-medium">
                    {useStore.getState().tests.length}
                  </span>
                </div>
              </div>
            </div>

            <div className="bg-blue-50 rounded-lg p-3">
              <p className="text-[10px] font-medium text-blue-600 uppercase mb-2">AI Settings</p>
              <p className="text-xs text-blue-800">
                To enable AI-powered test generation, set your DeepSeek API key in the configuration.
              </p>
              {showApiKeyInput ? (
                <div className="mt-2 space-y-2">
                  <input
                    type="password"
                    value={apiKeyValue}
                    onChange={(e) => setApiKeyValue(e.target.value)}
                    placeholder="sk-..."
                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    autoFocus
                  />
                  <div className="flex gap-1">
                    <button
                      onClick={() => {
                        setAIKey(apiKeyValue.trim());
                        setShowApiKeyInput(false);
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-green-600 text-white rounded hover:bg-green-700 transition-colors"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => {
                        setApiKeyValue(getAIKey() || '');
                        setShowApiKeyInput(false);
                      }}
                      className="flex-1 px-2 py-1 text-xs bg-gray-400 text-white rounded hover:bg-gray-500 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="mt-2 w-full text-xs bg-blue-600 text-white py-1 rounded hover:bg-blue-700 transition-colors"
                  onClick={() => {
                    setApiKeyValue(getAIKey() || '');
                    setShowApiKeyInput(true);
                  }}
                >
                  {getAIKey() ? 'Change API Key' : 'Configure API Key'}
                </button>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
}
