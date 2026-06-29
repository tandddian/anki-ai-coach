import React, { useState } from 'react';
import { useStore } from '../../store';
import { createMaterial, createTest } from '../../database/queries';
import { Folder } from '../../types';
import { parseFile } from '../../utils/fileParser';
import { summarizeToTutorial, FileContent, TutorialResult } from '../../services/ai';

interface ImportMaterialModalProps {
  onClose: () => void;
  initialFolderId?: number | null;
}

interface SelectedFile {
  name: string;
  path: string;
  text: string;
}

type ImportStep = 'select' | 'summarize' | 'preview';

export function ImportMaterialModal({ onClose, initialFolderId = null }: ImportMaterialModalProps) {
  const [selectedFiles, setSelectedFiles] = useState<SelectedFile[]>([]);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(initialFolderId);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [importComplete, setImportComplete] = useState(false);
  const [mode, setMode] = useState<'merge' | 'separate'>('merge');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [tutorials, setTutorials] = useState<TutorialResult[]>([]);

  const folders = useStore(state => state.folders);
  const refreshMaterials = useStore(state => state.refreshMaterials);
  const materialFolders = folders.filter(f => f.type === 'material');

  const step: ImportStep = tutorials.length > 0 ? 'preview'
    : selectedFiles.length > 0 ? 'summarize' : 'select';

  const handleSelectFiles = async () => {
    try {
      const paths = await window.electronAPI.openFileDialog();
      if (!paths || paths.length === 0) return;
      setIsParsing(true);
      setError(null);
      const files: SelectedFile[] = [];
      const errors: string[] = [];
      for (let i = 0; i < paths.length; i++) {
        const path = paths[i];
        setParseProgress(`Reading file ${i + 1}/${paths.length}...`);
        try {
          const raw = await window.electronAPI.readFile(path);
          if (!raw) { errors.push(`Could not read: ${path}`); continue; }
          const buffer = new Uint8Array(raw as unknown as ArrayBuffer);
          const name = path.split('/').pop() || path;
          const result = await parseFile(name, buffer, '');
          files.push({ name, path, text: result.text });
        } catch (e: any) {
          errors.push(`${path}: ${e.message}`);
        }
      }
      if (errors.length > 0) setError(errors.join('; '));
      setSelectedFiles(files);
    } catch (err: any) {
      setError(`Failed: ${err.message}`);
    } finally {
      setIsParsing(false);
      setParseProgress('');
    }
  };

  const handleSummarize = async () => {
    setIsSummarizing(true);
    setError(null);
    try {
      const fileContents: FileContent[] = selectedFiles.map(f => ({ name: f.name, content: f.text }));
      const results = await summarizeToTutorial(fileContents, mode);
      setTutorials(results);
    } catch (err: any) {
      setError(`AI summarization failed: ${err.message}`);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleImport = async () => {
    try {
      const today = new Date().toISOString().split('T')[0];
      for (const tutorial of tutorials) {
        createMaterial(tutorial.name, tutorial.name, 'md', selectedFolderId, tutorial.content);
        createTest(tutorial.name, today, 'imported');
      }
      setImportComplete(true);
      await refreshMaterials();
      useStore.setState(s => ({ testListRefreshKey: s.testListRefreshKey + 1 }));
      setTimeout(() => onClose(), 1500);
    } catch (err: any) {
      setError(`Failed to import: ${err.message}`);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="modal-overlay absolute inset-0" onClick={importComplete ? undefined : onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 max-h-[80vh] flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Import Materials</h3>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 rounded transition-colors">
            <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Error */}
        {error && (
          <div className="mb-3 p-2 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-xs text-red-700">{error}</p>
          </div>
        )}

        {/* Success */}
        {importComplete && (
          <div className="mb-3 p-3 bg-green-50 border border-green-200 rounded-lg text-center">
            <svg className="w-8 h-8 text-green-500 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-sm text-green-700 font-medium">
              {tutorials.length} tutorial(s) imported successfully!
            </p>
          </div>
        )}

        {/* Step 1: File Selection */}
        {step === 'select' && (
          <div className="mb-4">
            <label className="block text-xs font-medium text-gray-700 mb-1">Select Files</label>
            <button
              onClick={handleSelectFiles}
              disabled={isParsing}
              className="w-full border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors disabled:opacity-50"
            >
              {isParsing ? (
                <div className="flex items-center justify-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-600 border-t-transparent" />
                  <span className="text-sm text-gray-600">{parseProgress}</span>
                </div>
              ) : (
                <div>
                  <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  <p className="text-sm text-gray-600">Click to select files</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, DOCX, PPTX, MD, TXT, CSV</p>
                </div>
              )}
            </button>
          </div>
        )}

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-medium text-gray-700 mb-1">
              {selectedFiles.length} file(s) selected:
            </p>
            <div className="max-h-24 overflow-y-auto bg-gray-50 rounded p-2">
              {selectedFiles.map((f, i) => (
                <p key={i} className="text-xs text-gray-600 truncate">{f.name}</p>
              ))}
            </div>
          </div>
        )}

        {/* Step 2: Mode + Summarize */}
        {step === 'summarize' && (
          <div className="space-y-3 mb-4">
            {selectedFiles.length > 1 && (
              <div className="flex gap-2">
                <button
                  onClick={() => setMode('merge')}
                  className={`flex-1 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    mode === 'merge' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Merge into One
                </button>
                <button
                  onClick={() => setMode('separate')}
                  className={`flex-1 px-3 py-1.5 text-xs rounded-lg border transition-colors ${
                    mode === 'separate' ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600 hover:border-gray-300'
                  }`}
                >
                  Separate Tutorials
                </button>
              </div>
            )}
            <button
              onClick={handleSummarize}
              disabled={isSummarizing}
              className="w-full px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors flex items-center justify-center gap-2"
            >
              {isSummarizing ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                  AI is generating tutorial...
                </>
              ) : (
                'Summarize with AI'
              )}
            </button>
          </div>
        )}

        {/* Step 3: Preview + Import */}
        {step === 'preview' && (
          <div className="flex-1 overflow-y-auto space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Target Folder</label>
              <select
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No folder (root)</option>
                {materialFolders.map(folder => (
                  <option key={folder.id} value={folder.id}>{folder.name}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                {tutorials.length} tutorial(s) generated
              </label>
              {tutorials.map((t, i) => (
                <div key={i} className="mb-2">
                  <p className="text-xs font-medium text-gray-800">{t.name}</p>
                  <div className="max-h-24 overflow-y-auto bg-gray-50 rounded-lg p-2 border border-gray-200 mt-1">
                    <p className="text-xs text-gray-600 whitespace-pre-wrap">
                      {t.content.substring(0, 300)}{t.content.length > 300 ? '...' : ''}
                    </p>
                  </div>
                  <p className="text-[10px] text-gray-400 mt-0.5">
                    {t.content.length.toLocaleString()} characters
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-gray-100">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-lg transition-colors"
          >
            Cancel
          </button>
          {step === 'preview' && (
            <button
              onClick={handleImport}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Import {tutorials.length} Tutorial(s)
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
