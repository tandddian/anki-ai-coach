import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useStore } from '../../store';
import { Folder, FolderType } from '../../types';
import { ImportMaterialModal } from '../Modals/ImportMaterialModal';

interface FolderTreeProps {
  folderType: FolderType;
}

function buildTree(
  folders: Folder[],
  type: FolderType,
  parentId: number | null = null,
): Folder[] {
  return folders
    .filter(f => f.type === type && f.parentId === parentId)
    .map(f => f);
}

function getChildren(folders: Folder[], parentId: number): Folder[] {
  return folders.filter(f => f.parentId === parentId);
}

export function FolderTree({ folderType }: FolderTreeProps) {
  const folders = useStore(state => state.folders);
  const addFolder = useStore(state => state.addFolder);
  const removeFolder = useStore(state => state.removeFolder);
  const loadMaterials = useStore(state => state.loadMaterials);

  const [openIds, setOpenIds] = useState<Set<number>>(new Set());
  const [contextMenu, setContextMenu] = useState<{
    folderId: number;
    x: number;
    y: number;
  } | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [importModalFolderId, setImportModalFolderId] = useState<number | null>(null);

  const rootFolders = useMemo(
    () => buildTree(folders, folderType),
    [folders, folderType],
  );

  // Close context menu on outside click
  useEffect(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const toggleOpen = useCallback((folderId: number) => {
    setOpenIds(prev => {
      const next = new Set(prev);
      if (next.has(folderId)) {
        next.delete(folderId);
      } else {
        next.add(folderId);
      }
      return next;
    });
  }, []);

  const handleClick = useCallback(
    (folderId: number) => {
      toggleOpen(folderId);
      loadMaterials(folderId);
    },
    [toggleOpen, loadMaterials],
  );

  const handleContextMenu = useCallback(
    (e: React.MouseEvent, folderId: number) => {
      e.preventDefault();
      e.stopPropagation();
      setContextMenu({ folderId, x: e.clientX, y: e.clientY });
    },
    [],
  );

  const handleRename = useCallback(
    (folderId: number) => {
      const folder = folders.find(f => f.id === folderId);
      if (folder) {
        setEditingId(folderId);
        setEditName(folder.name);
        setContextMenu(null);
      }
    },
    [folders],
  );

  const handleRenameSubmit = useCallback(
    (folderId: number) => {
      if (editName.trim()) {
        // TODO: store doesn't have updateFolder yet
        setEditingId(null);
      }
    },
    [editName],
  );

  const handleDelete = useCallback(
    (folderId: number) => {
      if (confirm('Delete this folder and all its contents?')) {
        removeFolder(folderId);
      }
      setContextMenu(null);
    },
    [removeFolder],
  );

  const handleImportClick = useCallback((folderId: number) => {
    setImportModalFolderId(folderId);
    setContextMenu(null);
  }, []);

  const handleAddSubfolder = useCallback(
    async (parentId: number) => {
      setOpenIds(prev => new Set(prev).add(parentId));
      await addFolder('New Subfolder', folderType, parentId);
      setContextMenu(null);
    },
    [addFolder, folderType],
  );

  if (rootFolders.length === 0) {
    return null;
  }

  return (
    <div>
      {rootFolders.map(folder => (
        <FolderNode
          key={folder.id}
          folder={folder}
          depth={0}
          openIds={openIds}
          editingId={editingId}
          editName={editName}
          setEditName={setEditName}
          onClick={handleClick}
          onToggle={toggleOpen}
          onContextMenu={handleContextMenu}
          onRenameSubmit={handleRenameSubmit}
          onAddSubfolder={handleAddSubfolder}
          onImportClick={handleImportClick}
          allFolders={folders}
        />
      ))}

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            onClick={() => handleImportClick(contextMenu.folderId)}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
            Import File
          </button>
          <hr className="my-1 border-gray-100" />
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

      {/* Import Material Modal */}
      {importModalFolderId !== null && (
        <ImportMaterialModal
          initialFolderId={importModalFolderId}
          onClose={() => setImportModalFolderId(null)}
        />
      )}
    </div>
  );
}

// ---- Recursive folder node ----

interface FolderNodeProps {
  folder: Folder;
  depth: number;
  openIds: Set<number>;
  editingId: number | null;
  editName: string;
  setEditName: (name: string) => void;
  onClick: (folderId: number) => void;
  onToggle: (folderId: number) => void;
  onContextMenu: (e: React.MouseEvent, folderId: number) => void;
  onRenameSubmit: (folderId: number) => void;
  onAddSubfolder: (parentId: number) => void;
  onImportClick: (folderId: number) => void;
  allFolders: Folder[];
}

function FolderNode({
  folder,
  depth,
  openIds,
  editingId,
  editName,
  setEditName,
  onClick,
  onToggle,
  onContextMenu,
  onRenameSubmit,
  onAddSubfolder,
  onImportClick,
  allFolders,
}: FolderNodeProps) {
  const children = getChildren(allFolders, folder.id);
  const isOpen = openIds.has(folder.id);
  const isEditing = editingId === folder.id;
  const hasChildren = children.length > 0;

  return (
    <div>
      <div
        className="folder-tree-item flex items-center gap-1 py-0.5 px-1 rounded cursor-pointer text-xs group hover:bg-gray-50"
        style={{ paddingLeft: `${depth * 12 + 4}px` }}
        onClick={() => onClick(folder.id)}
        onContextMenu={e => onContextMenu(e, folder.id)}
      >
        {/* Expand/Collapse arrow */}
        <button
          onClick={e => {
            e.stopPropagation();
            onToggle(folder.id);
          }}
          className="w-3 h-3 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0"
        >
          {hasChildren && (
            <svg
              className={`w-2.5 h-2.5 transition-transform ${isOpen ? 'rotate-90' : ''}`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              <path
                fillRule="evenodd"
                d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z"
                clipRule="evenodd"
              />
            </svg>
          )}
        </button>

        {/* Folder icon */}
        <svg
          className={`w-3.5 h-3.5 flex-shrink-0 ${
            folder.type === 'material' ? 'text-blue-400' : 'text-green-400'
          }`}
          fill="currentColor"
          viewBox="0 0 20 20"
        >
          {isOpen ? (
            <path
              fillRule="evenodd"
              d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.468A2 2 0 013 14V6zm11.873 5.058l-3.916 3.916a1 1 0 01-.707.293H5.778a2 2 0 01-2-2V9.31a2 2 0 012-2h1.414a1 1 0 01.707.293l2.757 2.757 1.218-2.436a1 1 0 01.894-.553H16a1 1 0 011 1v4.27a1 1 0 01-.293.707l-1.834 1.834z"
              clipRule="evenodd"
            />
          ) : (
            <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
          )}
        </svg>

        {/* Folder name */}
        {isEditing ? (
          <input
            className="flex-1 text-xs px-1 py-0 border border-blue-400 rounded outline-none"
            value={editName}
            onChange={e => setEditName(e.target.value)}
            onBlur={() => onRenameSubmit(folder.id)}
            onKeyDown={e => {
              if (e.key === 'Enter') onRenameSubmit(folder.id);
              if (e.key === 'Escape') setEditName(folder.name);
            }}
            autoFocus
            onClick={e => e.stopPropagation()}
          />
        ) : (
          <span className="flex-1 truncate text-gray-700 group-hover:text-gray-900">
            {folder.name}
          </span>
        )}

        {/* Hover action icons */}
        <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
            title="Add Subfolder"
            onClick={e => {
              e.stopPropagation();
              onAddSubfolder(folder.id);
            }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          <button
            className="w-4 h-4 flex items-center justify-center text-gray-400 hover:text-blue-500 hover:bg-blue-50 rounded"
            title="Import File"
            onClick={e => {
              e.stopPropagation();
              onImportClick(folder.id);
            }}
          >
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </button>
        </div>
      </div>

      {/* Children */}
      {isOpen &&
        children.map(child => (
          <FolderNode
            key={child.id}
            folder={child}
            depth={depth + 1}
            openIds={openIds}
            editingId={editingId}
            editName={editName}
            setEditName={setEditName}
            onClick={onClick}
            onToggle={onToggle}
            onContextMenu={onContextMenu}
            onRenameSubmit={onRenameSubmit}
            onAddSubfolder={onAddSubfolder}
            onImportClick={onImportClick}
            allFolders={allFolders}
          />
        ))}
    </div>
  );
}
