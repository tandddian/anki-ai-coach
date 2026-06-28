import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { Tree, type NodeApi, type NodeRendererProps, type TreeApi } from 'react-arborist';
import { useStore } from '../../store';
import { Folder, FolderType } from '../../types';

interface TreeNode {
  id: string;
  name: string;
  folderId: number;
  folderType: FolderType;
  children?: TreeNode[];
}

interface FolderTreeProps {
  folderType: FolderType;
}

const ROW_HEIGHT = 24;

/**
 * Build a tree structure from the flat folders array, filtered by type.
 */
function buildTree(
  folders: Folder[],
  type: FolderType,
  parentId: number | null = null,
): TreeNode[] {
  return folders
    .filter(f => f.type === type && f.parentId === parentId)
    .map(f => ({
      id: String(f.id),
      name: f.name,
      folderId: f.id,
      folderType: f.type,
      children: buildTree(folders, type, f.id),
    }));
}

export function FolderTree({ folderType }: FolderTreeProps) {
  const folders = useStore(state => state.folders);
  const addFolder = useStore(state => state.addFolder);
  const removeFolder = useStore(state => state.removeFolder);
  const loadMaterials = useStore(state => state.loadMaterials);

  const [contextMenu, setContextMenu] = useState<{
    folderId: number;
    x: number;
    y: number;
  } | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState('');
  const [treeHeight, setTreeHeight] = useState(0);

  const treeRef = useRef<TreeApi<TreeNode> | null>(null);
  const pendingOpenRef = useRef<Set<string>>(new Set());

  const treeData = useMemo(
    () => buildTree(folders, folderType),
    [folders, folderType],
  );

  // Recalculate height whenever tree data changes (new/removed folders)
  useEffect(() => {
    const raf = requestAnimationFrame(() => {
      if (treeRef.current) {
        setTreeHeight(
          Math.max(treeRef.current.visibleNodes.length, 0) * ROW_HEIGHT,
        );

        // Open any pending nodes
        if (pendingOpenRef.current.size > 0) {
          pendingOpenRef.current.forEach(id => treeRef.current!.open(id));
          pendingOpenRef.current.clear();
          // Recalculate after opening
          requestAnimationFrame(() => {
            if (treeRef.current) {
              setTreeHeight(
                Math.max(treeRef.current.visibleNodes.length, 0) * ROW_HEIGHT,
              );
            }
          });
        }
      }
    });
    return () => cancelAnimationFrame(raf);
  }, [treeData]);

  // Close context menu on outside click
  useEffect(() => {
    const handler = () => setContextMenu(null);
    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, []);

  const handleToggle = useCallback(() => {
    // Recalculate height after toggle animation frame
    requestAnimationFrame(() => {
      if (treeRef.current) {
        setTreeHeight(
          Math.max(treeRef.current.visibleNodes.length, 0) * ROW_HEIGHT,
        );
      }
    });
  }, []);

  const handleActivate = useCallback(
    (node: NodeApi<TreeNode>) => {
      node.toggle();
      loadMaterials(node.data.folderId);
    },
    [loadMaterials],
  );

  const handleChevronClick = useCallback(
    (e: React.MouseEvent, node: NodeApi<TreeNode>) => {
      e.stopPropagation();
      node.toggle();
      // Recalculate height after toggle
      requestAnimationFrame(() => {
        if (treeRef.current) {
          setTreeHeight(
            Math.max(treeRef.current.visibleNodes.length, 0) * ROW_HEIGHT,
          );
        }
      });
    },
    [],
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
        setEditingId(String(folderId));
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

  const handleAddSubfolder = useCallback(
    async (parentId: number) => {
      pendingOpenRef.current.add(String(parentId));
      await addFolder('New Subfolder', folderType, parentId);
      setContextMenu(null);
    },
    [addFolder, folderType],
  );

  // Custom node renderer
  const NodeRenderer = useCallback(
    ({ node, style }: NodeRendererProps<TreeNode>) => {
      const data = node.data;
      const isOpen = node.isOpen;
      const isInternal = node.isInternal;
      const isEditing = editingId === node.id;

      return (
        <div style={style}>
          <div
            className="folder-tree-item flex items-center gap-1 py-0.5 px-1 rounded cursor-pointer group text-xs hover:bg-gray-50"
            onClick={() => handleActivate(node)}
            onContextMenu={e => handleContextMenu(e, data.folderId)}
          >
            {/* Expand/Collapse arrow */}
            <button
              onClick={e => handleChevronClick(e, node)}
              className="w-3 h-3 flex items-center justify-center text-gray-400 hover:text-gray-600 flex-shrink-0"
            >
              {isInternal && (
                <svg
                  className={`w-2.5 h-2.5 transition-transform ${
                    isOpen ? 'rotate-90' : ''
                  }`}
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
                data.folderType === 'material'
                  ? 'text-blue-400'
                  : 'text-green-400'
              }`}
              fill="currentColor"
              viewBox="0 0 20 20"
            >
              {isOpen ? (
                <path d="M2 6a2 2 0 012-2h5l2 2h5a2 2 0 012 2v6a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" />
              ) : (
                <path
                  fillRule="evenodd"
                  d="M2 6a2 2 0 012-2h4l2 2h4a2 2 0 012 2v1H8a3 3 0 00-3 3v1.468A2 2 0 013 14V6zm11.873 5.058l-3.916 3.916a1 1 0 01-.707.293H5.778a2 2 0 01-2-2V9.31a2 2 0 012-2h1.414a1 1 0 01.707.293l2.757 2.757 1.218-2.436a1 1 0 01.894-.553H16a1 1 0 011 1v4.27a1 1 0 01-.293.707l-1.834 1.834z"
                  clipRule="evenodd"
                />
              )}
            </svg>

            {/* Folder name */}
            {isEditing ? (
              <input
                className="flex-1 text-xs px-1 py-0 border border-blue-400 rounded outline-none"
                value={editName}
                onChange={e => setEditName(e.target.value)}
                onBlur={() => handleRenameSubmit(data.folderId)}
                onKeyDown={e => {
                  if (e.key === 'Enter') handleRenameSubmit(data.folderId);
                  if (e.key === 'Escape') setEditingId(null);
                }}
                autoFocus
                onClick={e => e.stopPropagation()}
              />
            ) : (
              <span className="flex-1 truncate text-gray-700 group-hover:text-gray-900">
                {data.name}
              </span>
            )}
          </div>
        </div>
      );
    },
    [
      editingId,
      editName,
      handleActivate,
      handleChevronClick,
      handleContextMenu,
      handleRenameSubmit,
    ],
  );

  if (treeData.length === 0) {
    return null;
  }

  return (
    <div>
      <Tree<TreeNode>
        ref={treeRef}
        data={treeData}
        rowHeight={ROW_HEIGHT}
        height={treeHeight || treeData.length * ROW_HEIGHT}
        width="100%"
        indent={12}
        disableDrag={true}
        disableDrop={true}
        disableEdit={true}
        disableMultiSelection={true}
        disableSelect={true}
        openByDefault={false}
        onToggle={handleToggle}
      >
        {NodeRenderer}
      </Tree>

      {/* Context Menu */}
      {contextMenu && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-lg py-1 z-50 min-w-[140px]"
          style={{ left: `${contextMenu.x}px`, top: `${contextMenu.y}px` }}
          onClick={e => e.stopPropagation()}
        >
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            onClick={() => handleAddSubfolder(contextMenu.folderId)}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
            Add Subfolder
          </button>
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-gray-700 hover:bg-gray-100 flex items-center gap-2"
            onClick={() => handleRename(contextMenu.folderId)}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
              />
            </svg>
            Rename
          </button>
          <hr className="my-1 border-gray-100" />
          <button
            className="w-full text-left px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 flex items-center gap-2"
            onClick={() => handleDelete(contextMenu.folderId)}
          >
            <svg
              className="w-3 h-3"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"
              />
            </svg>
            Delete
          </button>
        </div>
      )}
    </div>
  );
}
