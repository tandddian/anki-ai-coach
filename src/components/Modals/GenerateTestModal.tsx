import React, { useState } from 'react';
import { useStore } from '../../store';
import { formatDate, getDateString } from '../../utils/dateUtils';
import { getDueMaterials } from '../../database/queries';
import { Material } from '../../types';

interface GenerateTestModalProps {
  onClose: () => void;
  date: Date;
}

export function GenerateTestModal({ onClose, date }: GenerateTestModalProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState('');
  const [generatedPreview, setGeneratedPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const generateTest = useStore(state => state.generateTest);
  const dateStr = getDateString(date);
  const dueMaterials = getDueMaterials(dateStr);

  const handleGenerate = async () => {
    if (dueMaterials.length === 0) {
      setError('No materials are due for this date.');
      return;
    }

    setIsGenerating(true);
    setError(null);
    setProgress('Analyzing due materials...');

    try {
      setProgress('Running correlation analysis...');
      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress('Generating AI test questions...');
      await new Promise(resolve => setTimeout(resolve, 500));

      setProgress('Saving test...');
      await generateTest(date);

      setProgress('Complete!');
      setGeneratedPreview(true);

      setTimeout(() => onClose(), 1000);
    } catch (err: any) {
      setError(err.message || 'Generation failed');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="modal-overlay absolute inset-0" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Generate AI Test</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Date info */}
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-xs text-blue-800 font-medium">Test Date</p>
          <p className="text-sm font-semibold text-blue-900">{formatDate(date)}</p>
        </div>

        {/* Due materials list */}
        {dueMaterials.length > 0 ? (
          <div className="mb-4">
            <p className="text-xs font-medium text-gray-700 mb-2">
              {dueMaterials.length} material{dueMaterials.length !== 1 ? 's' : ''} due for review:
            </p>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {dueMaterials.map(material => (
                <div key={material.id} className="flex items-center gap-2 p-1.5 bg-gray-50 rounded">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  <span className="text-xs text-gray-700">{material.name}</span>
                  <span className="text-[10px] text-gray-400 ml-auto">{material.type}</span>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="mb-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <p className="text-xs text-yellow-800">
              No materials are due for this date. Import materials first or select a different date.
            </p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Progress */}
        {isGenerating && (
          <div className="mb-4 flex flex-col items-center py-4">
            <div className="animate-spin rounded-full h-8 w-8 border-3 border-blue-600 border-t-transparent mb-2" />
            <p className="text-sm text-gray-700">{progress}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleGenerate}
            disabled={isGenerating || dueMaterials.length === 0}
            className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            Generate Test
          </button>
        </div>
      </div>
    </div>
  );
}
