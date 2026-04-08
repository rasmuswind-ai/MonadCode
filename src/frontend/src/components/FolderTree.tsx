import { useState } from 'react';
import { ChevronRight, Folder, FolderOpen } from 'lucide-react';
import type { TreeEntry } from '../types';

interface FolderTreeNodeProps {
  entry: TreeEntry;
  depth: number;
  selectedPath: string | null;
  onSelect: (path: string) => void;
}

function FolderTreeNode({ entry, depth, selectedPath, onSelect }: FolderTreeNodeProps) {
  const [expanded, setExpanded] = useState(depth === 0);
  const isSelected = selectedPath === entry.path;
  const hasChildren = entry.children && entry.children.length > 0;

  return (
    <div>
      <button
        onClick={() => {
          onSelect(entry.path);
          if (hasChildren) setExpanded((prev) => !prev);
        }}
        className={`cursor-pointer w-full flex items-center gap-1.5 py-1 px-2 text-xs transition-all duration-150 rounded-md group ${
          isSelected
            ? 'bg-white/10 text-stone-200'
            : 'text-stone-400 hover:bg-white/5 hover:text-stone-300'
        }`}
        style={{ paddingLeft: `${depth * 12 + 8}px` }}
      >
        <ChevronRight
          className={`w-3 h-3 shrink-0 transition-transform duration-200 ${
            hasChildren ? 'text-stone-500' : 'text-transparent'
          } ${expanded && hasChildren ? 'rotate-90' : ''}`}
        />
        {expanded ? (
          <FolderOpen className="w-3.5 h-3.5 shrink-0 text-stone-500" />
        ) : (
          <Folder className="w-3.5 h-3.5 shrink-0 text-stone-500" />
        )}
        <span className="truncate font-mono">{entry.name}</span>
      </button>
      {expanded && hasChildren && (
        <div>
          {entry.children!.map((child) => (
            <FolderTreeNode
              key={child.path}
              entry={child}
              depth={depth + 1}
              selectedPath={selectedPath}
              onSelect={onSelect}
            />
          ))}
        </div>
      )}
    </div>
  );
}

interface FolderTreeProps {
  tree: TreeEntry[];
  selectedPath: string | null;
  rootPath: string;
  onSelect: (path: string | null) => void;
}

export function FolderTree({ tree, selectedPath, rootPath, onSelect }: FolderTreeProps) {
  const rootName = rootPath.split(/[/\\]/).filter(Boolean).pop() || rootPath;

  return (
    <div className="space-y-0.5">
      <button
        onClick={() => onSelect(null)}
        className={`cursor-pointer w-full flex items-center gap-1.5 py-1 px-2 text-xs transition-all duration-150 rounded-md ${
          selectedPath === null
            ? 'bg-white/10 text-stone-200'
            : 'text-stone-400 hover:bg-white/5 hover:text-stone-300'
        }`}
      >
        <FolderOpen className="w-3.5 h-3.5 shrink-0 text-stone-500" />
        <span className="truncate font-mono font-semibold">{rootName}</span>
        <span className="ml-auto text-[10px] text-stone-600">All</span>
      </button>
      {tree.map((entry) => (
        <FolderTreeNode
          key={entry.path}
          entry={entry}
          depth={1}
          selectedPath={selectedPath}
          onSelect={onSelect}
        />
      ))}
    </div>
  );
}
