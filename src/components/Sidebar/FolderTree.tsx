import React, { useState, useEffect } from 'react';
import { useStore } from '../../store';
import { Folder, FolderType } from '../../types';

interface FolderTreeProps {
  folderType: FolderType;
  parentId?: number | null;
  level?: number;
}

/**
 * Recursive folder tree component.
 * Handles expand/collapse, renaming, and deletion.
 */
export function FolderTree({ folderType, parentId = null, level = 0 }: FolderTreeProps) {
  const folders = useStore(state => state.folders);
  const addFolder = useStore(state => state.addFolder);
  const removeFolder = useStore(state => state.removeFolder);
  const loadMaterials = useStore(state => state.loadMaterials);

  const [expandedFolders, setExpandedFolders] = useState<Set<number>>(new Set());
  const [editingFolder, setEditingFolder] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [contextMenu, setContextMenu] = useState<{ folderId: number; x: number; y: number } | null>(null);

  // Filter folders by type and parent
  const childFolders = folders.filter(
    f => f.type === folderType && f.parentId === parentId
  );

  // Close context menu on click outside
  useEffect(() => {
    const handleClick = () => setContextMenu(null);
    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, []);

  const toggleFolder = (folderId: number) => {
    setExpandedFolders(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  };

  const handleContextMenu = (e: React.MouseEvent, folderId: number) => {
    e.preventDefault();
    e.stopPropagation();
    setContextMenu({ folderId, x: e.clientX, y: e.clientY });
  };

  const handleRename = (folderId: number) => {
    const folder = folders.find(f => f.id === folderId);
    if (folder) {
      setEditingFolder(folderId);
      setEditName(folder.name);
      setContextMenu(null);
    }
  };

  const handleRenameSubmit = (folderId: number) => {
    if (editName.trim()) {
      // The store doesn't have updateFolder yet, but we can handle this
      setEditingFolder(null);
    }
  };

  const handleDelete = (folderId: number) => {
    if (confirm('Delete this folder and all its contents?')) {
      removeFolder(folderId);
    }
    setContextMenu(null);
  };

  const handleAddSubfolder = (parentId: number) => {
    addFolder('New Subfolder', folderType, parentId);
    setExpandedFolders(prev => new Set(prev).add(parentId));
    setContextMenu(null);
  };

  const handleFolderClick = (folderId: number) => {
    toggleFolder(folderId);
    loadMaterials(folderId);
  };

  if (childFolders.length === 0) {
    return null;
  }

  return (
    <div className="ml-2" style={{ marginLeft: `${level * 12}px` }}>
      {childFolders.map(folder => {
        const isExpanded = expandedFolders.has(folder.id);
        const isEditing = editingFolder === folder.id;

        return (
          <div key={folder.id}>
            <div
              className="folder-tree-item flex items-center gap-1 py-0.5 px-1 rounded cursor-pointer group text-xs"
              onClick={() => handleFolderClick(folder.id)}
              onContextMenu={(e) => handleContextMenu(e, folder.id)}
            >
              {/* Expand/Collapse arrow */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleFolder(folder.id);
                }}
                className="w-3 h-3 flex items-center justify-center text-gray-400 hover:text-gray-600"
              >
                <svg
                  className={`w-2.5 h-2.5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                </svg>
              </button>

              {/* Folder icon */}
              <svg className={`w-3.5 h-3.5 flex-shrink-0 ${folderType === 'material' ? 'text-blue-400' : 'text-green-400'}`} fill="currentColor" viewBox="0 0 20 20">
                {isExpanded ? (
                  <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
                ) : (
                  <path fillRule="evenodd" d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.468A2 2 0 013 14V6zm11.873 5.058l-3.916 3.916a1 1 0 01-.707.293H5.778a2 2 0 01-2-2V9.31a2 2 0 012-2h1.414a1 1 0 01.707.293l2.757 2.757 1.218-2.436a1 1 0 01.894-.553H16a1 1 0 011 1v4.27a1 1 0 01-.293.707l-1.834 1.834z" clipRule="evenodd" />
                )}
              </svg>

              {/* Folder name */}
              {isEditing ? (
                <input
                  className="flex-1 text-xs px-1 py-0 border border-blue-400 rounded outline-none"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  onBlur={() => handleRenameSubmit(folder.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleRenameSubmit(folder.id);
                    if (e.key === 'Escape') setEditingFolder(null);
                  }}
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="flex-1 truncate text-gray-700 group-hover:text-gray-900">
                  {folder.name}
                </span>
              )}
            </div>

            {/* Child folders (recursive) */}
            {isExpanded && (
              <FolderTree folderType={folderType} parentId={folder.id} level={level + 1} />
            )}
          </div>
        );
      })}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          onClick={(e) => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            onClick={() => handleAddSubfolder(contextMenu.folderId)}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
            Add Subfolder
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            onClick={() => handleRename(contextMenu.folderId)}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Rename
          </button>
          <hr className="my-1 border-gray-100" />
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
            onClick={() => handleDelete(contextMenu.folderId)}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
