import React, { useState } from 'react';
import { ImportMaterialModal } from '../Modals/ImportMaterialModal';

export function ImportButton() {
  const [showImportModal, setShowImportModal] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowImportModal(true)}
        className="flex-1 px-2 py-1.5 text-xs bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center justify-center gap-1"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
        </svg>
        Import
      </button>
      {showImportModal && (
        <ImportMaterialModal onClose={() => setShowImportModal(false)} />
      )}
    </>
  );
}
