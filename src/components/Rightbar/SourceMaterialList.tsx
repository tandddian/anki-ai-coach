import React, { useState } from 'react';
import { Material } from '../../types';
import { getCorrelationsByMaterialId } from '../../database/queries';

interface SourceMaterialListProps {
  materials: Material[];
}

export function SourceMaterialList({ materials }: SourceMaterialListProps) {
  const [expandedMaterial, setExpandedMaterial] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');

  const filteredMaterials = searchQuery.trim()
    ? materials.filter(m =>
        m.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.type.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : materials;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'pdf':
        return (
          <svg className="w-4 h-4 text-red-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
      case 'docx':
        return (
          <svg className="w-4 h-4 text-blue-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
      case 'pptx':
        return (
          <svg className="w-4 h-4 text-orange-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
      case 'md':
        return (
          <svg className="w-4 h-4 text-purple-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-4 h-4 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  const getCorrelationBadge = (materialId: number) => {
    try {
      const correlations = getCorrelationsByMaterialId(materialId);
      if (correlations.length === 0) return null;

      const avgScore = correlations.reduce((sum, c) => sum + c.correlationScore, 0) / correlations.length;
      const color = avgScore >= 7 ? 'bg-purple-100 text-purple-700' :
                     avgScore >= 5 ? 'bg-blue-100 text-blue-700' :
                     'bg-gray-100 text-gray-600';

      return (
        <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${color}`}>
          {correlations.length} link{correlations.length !== 1 ? 's' : ''}
        </span>
      );
    } catch {
      return null;
    }
  };

  if (materials.length === 0) {
    return (
      <div className="p-4 text-center">
        <p className="text-xs text-gray-500">No materials loaded for this test</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Search */}
      <div className="p-2">
        <div className="relative">
          <svg className="w-3 h-3 text-gray-400 absolute left-2 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Filter materials..."
            className="w-full text-xs pl-7 pr-3 py-1.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Material list */}
      <div className="flex-1 overflow-y-auto px-2">
        {filteredMaterials.map(material => {
          const isExpanded = expandedMaterial === material.id;
          const contentPreview = material.contentText
            ? material.contentText.substring(0, 200) + (material.contentText.length > 200 ? '...' : '')
            : 'No content extracted yet.';

          return (
            <div key={material.id} className="mb-1">
              <button
                onClick={() => setExpandedMaterial(isExpanded ? null : material.id)}
                className="w-full p-2 rounded-lg hover:bg-gray-50 transition-colors text-left"
              >
                <div className="flex items-start gap-2">
                  {getTypeIcon(material.type)}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-1 flex-wrap">
                      <span className="text-xs font-medium text-gray-900 truncate">
                        {material.name}
                      </span>
                      <span className="text-[9px] text-gray-400 uppercase">{material.type}</span>
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-[10px] text-gray-500">
                        Due: {material.nextReview || 'Today'}
                      </span>
                      {getCorrelationBadge(material.id)}
                    </div>
                    {/* SM-2 stats */}
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-[9px] text-gray-400">
                        EF: {material.easeFactor.toFixed(1)}
                      </span>
                      <span className="text-[9px] text-gray-400">
                        Int: {material.interval}d
                      </span>
                      <span className="text-[9px] text-gray-400">
                        Rep: {material.repetitions}
                      </span>
                    </div>
                  </div>
                  <svg
                    className={`w-3 h-3 text-gray-400 mt-1 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="currentColor"
                    viewBox="0 0 20 20"
                  >
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              </button>

              {/* Expanded content preview */}
              {isExpanded && (
                <div className="ml-6 mb-2 p-2 bg-gray-50 rounded-lg">
                  <p className="text-[10px] font-medium text-gray-500 uppercase mb-1">Content Preview</p>
                  <p className="text-[10px] text-gray-600 leading-relaxed whitespace-pre-wrap max-h-32 overflow-y-auto">
                    {contentPreview}
                  </p>
                  <p className="text-[9px] text-gray-400 mt-1">
                    {material.contentText ? material.contentText.length : 0} characters total
                  </p>
                </div>
              )}
            </div>
          );
        })}

        {filteredMaterials.length === 0 && searchQuery && (
          <p className="text-xs text-gray-500 text-center py-4">
            No materials match "{searchQuery}"
          </p>
        )}
      </div>
    </div>
  );
}
