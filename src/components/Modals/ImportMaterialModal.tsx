import React, { useState, useRef } from 'react';
import { useStore } from '../../store';
import { createMaterial, getAllMaterials } from '../../database/queries';
import { Folder, FolderType } from '../../types';
import { parseFile } from '../../utils/fileParser';

interface ImportMaterialModalProps {
  onClose: () => void;
  initialFolderId?: number | null;
}

export function ImportMaterialModal({ onClose, initialFolderId = null }: ImportMaterialModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [selectedFolderId, setSelectedFolderId] = useState<number | null>(initialFolderId);
  const [isParsing, setIsParsing] = useState(false);
  const [parseProgress, setParseProgress] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [parsedText, setParsedText] = useState('');
  const [importComplete, setImportComplete] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const folders = useStore(state => state.folders);
  const refreshMaterials = useStore(state => state.refreshMaterials);

  const materialFolders = folders.filter(f => f.type === 'material');

  const acceptedFileTypes = '.pdf,.docx,.pptx,.md,.markdown,.txt,.csv,.tsv,.apkg';
  const acceptedMimeTypes = [
    'application/pdf',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    'text/markdown',
    'text/plain',
    'text/csv',
    'text/tab-separated-values',
  ].join(',');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      const file = files[0];
      setSelectedFile(file);
      setError(null);
      setParsedText('');
      setImportComplete(false);
    }
  };

  const handleParseFile = async () => {
    if (!selectedFile) {
      setError('Please select a file first');
      return;
    }

    setIsParsing(true);
    setParseProgress('Reading file...');
    setError(null);

    try {
      const buffer = await selectedFile.arrayBuffer();
      const bufferObj = new Uint8Array(buffer);

      setParseProgress(`Parsing ${selectedFile.type || selectedFile.name.split('.').pop()} file...`);
      const result = await parseFile(selectedFile.name, bufferObj, selectedFile.type);

      setParsedText(result.text);
      setParseProgress(`Extracted ${result.text.length} characters of text.`);
    } catch (err: any) {
      setError(`Failed to parse file: ${err.message}`);
    } finally {
      setIsParsing(false);
    }
  };

  const handleImport = async () => {
    if (!selectedFile) return;

    try {
      const fileType = getMaterialType(selectedFile.name);

      createMaterial(
        selectedFile.name,
        selectedFile.name,
        fileType,
        selectedFolderId,
        parsedText
      );

      setImportComplete(true);
      await refreshMaterials();

      // Auto-close after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (err: any) {
      setError(`Failed to import: ${err.message}`);
    }
  };

  const getMaterialType = (fileName: string): 'pdf' | 'docx' | 'pptx' | 'md' | 'anki' => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    switch (ext) {
      case 'pdf': return 'pdf';
      case 'docx': return 'docx';
      case 'pptx': return 'pptx';
      case 'md':
      case 'markdown': return 'md';
      default: return 'anki';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="modal-overlay absolute inset-0" onClick={importComplete ? undefined : onClose} />
      <div className="relative bg-white rounded-xl shadow-xl p-6 max-w-md w-full mx-4 max-h-[80vh] flex flex-col z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Import Material</h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
          >
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
            <p className="text-sm text-green-700 font-medium">Material imported successfully!</p>
          </div>
        )}

        {/* File picker */}
        <div className="mb-4">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Select File
          </label>
          <div
            className="border-2 border-dashed border-gray-300 rounded-lg p-4 text-center hover:border-blue-400 transition-colors cursor-pointer"
            onClick={() => fileInputRef.current?.click()}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept={acceptedFileTypes}
              onChange={handleFileSelect}
              className="hidden"
            />
            {selectedFile ? (
              <div>
                <svg className="w-8 h-8 text-blue-500 mx-auto mb-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                </svg>
                <p className="text-sm font-medium text-gray-900">{selectedFile.name}</p>
                <p className="text-xs text-gray-500">
                  {(selectedFile.size / 1024).toFixed(1)} KB
                </p>
              </div>
            ) : (
              <div>
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-sm text-gray-600">Click to select a file</p>
                <p className="text-xs text-gray-400 mt-1">PDF, DOCX, PPTX, MD, TXT, CSV, APKG</p>
              </div>
            )}
          </div>
        </div>

        {/* Parse button */}
        {selectedFile && !parsedText && (
          <button
            onClick={handleParseFile}
            disabled={isParsing}
            className="w-full mb-4 px-4 py-2 text-sm bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
          >
            {isParsing ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent" />
                {parseProgress}
              </>
            ) : (
              'Parse File Content'
            )}
          </button>
        )}

        {/* Folder selection */}
        {parsedText && (
          <div className="flex-1 overflow-y-auto space-y-3">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Target Folder
              </label>
              <select
                value={selectedFolderId || ''}
                onChange={(e) => setSelectedFolderId(e.target.value ? Number(e.target.value) : null)}
                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">No folder (root)</option>
                {materialFolders.map(folder => (
                  <option key={folder.id} value={folder.id}>
                    {folder.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Text preview */}
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Extracted Text Preview
              </label>
              <div className="max-h-32 overflow-y-auto bg-gray-50 rounded-lg p-2 border border-gray-200">
                <p className="text-xs text-gray-600 leading-relaxed whitespace-pre-wrap">
                  {parsedText.substring(0, 500)}
                  {parsedText.length > 500 && '...'}
                </p>
              </div>
              <p className="text-[10px] text-gray-400 mt-1">
                {parsedText.length.toLocaleString()} characters extracted
              </p>
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
          {parsedText && (
            <button
              onClick={handleImport}
              className="px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Import Material
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
