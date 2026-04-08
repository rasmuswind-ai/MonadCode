import { useEffect, useState } from 'react';
import { Folder, FileCode, ArrowUp, Home, HardDrive } from 'lucide-react';
import { api } from '../api';
import type { BrowseEntry } from '../types';

const btnQuick =
  'cursor-pointer px-2.5 py-1 text-[11px] rounded bg-stone-900 border border-stone-800 text-stone-400 tracking-wider hover:bg-stone-800 hover:text-stone-300 transition-colors flex items-center gap-1.5';

interface FileBrowserProps {
  onSelect: (filePath: string) => void;
  onClose: () => void;
  initialPath?: string;
}

export function FileBrowser({ onSelect, onClose, initialPath }: FileBrowserProps) {
  const [currentPath, setCurrentPath] = useState(initialPath || '');
  const [parent, setParent] = useState<string | null>(null);
  const [directories, setDirectories] = useState<BrowseEntry[]>([]);
  const [files, setFiles] = useState<BrowseEntry[]>([]);
  const [quickAccess, setQuickAccess] = useState<BrowseEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');

    api.browse(currentPath || undefined).then((result) => {
      if (cancelled) return;
      setCurrentPath(result.current);
      setParent(result.parent);
      setDirectories(result.directories);
      setFiles(result.files);
      setQuickAccess(result.quickAccess);
      setLoading(false);
    }).catch((err) => {
      if (cancelled) return;
      setError(err.message);
      setLoading(false);
    });

    return () => { cancelled = true; };
  }, [currentPath]);

  return (
    <div>
      {/* Quick access */}
      <div className="flex items-center gap-2 mb-3">
        {quickAccess.map((qa) => (
          <button
            key={qa.path}
            type="button"
            className={btnQuick}
            onClick={() => setCurrentPath(qa.path)}
          >
            {qa.name === 'Home' ? <Home className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
            {qa.name}
          </button>
        ))}
      </div>

      {/* Current path */}
      <div className="px-3 py-2 rounded-md border border-border bg-bg font-mono text-xs text-dim break-all mb-3">
        {currentPath || '...'}
      </div>

      {/* Error */}
      {error && <div className="text-danger text-sm mb-3">{error}</div>}

      {/* File list */}
      <div className="border border-stone-800 rounded-lg backdrop-blur-md bg-stone-900/30 max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-dim text-sm">Loading...</div>
        ) : (
          <div>
            {/* Go up */}
            {parent && (
              <button
                type="button"
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-stone-400 hover:bg-white/[0.08] transition-colors cursor-pointer border-b border-border"
                onClick={() => setCurrentPath(parent)}
              >
                <ArrowUp className="w-4 h-4 text-stone-500" />
                <span>..</span>
              </button>
            )}

            {/* Directories */}
            {directories.map((dir) => (
              <button
                key={dir.path}
                type="button"
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-text hover:bg-white/[0.08] transition-colors cursor-pointer border-b border-border"
                onClick={() => setCurrentPath(dir.path)}
              >
                <Folder className="w-4 h-4 text-stone-500 shrink-0" />
                <span className="truncate">{dir.name}</span>
              </button>
            ))}

            {/* Files */}
            {files.map((file) => (
              <button
                key={file.path}
                type="button"
                className="flex items-center gap-2.5 w-full px-3 py-2.5 text-sm text-text hover:bg-primary/[0.08] transition-colors cursor-pointer border-b border-border group"
                onClick={() => onSelect(file.path)}
              >
                <FileCode className="w-4 h-4 text-stone-500 shrink-0 group-hover:text-primary" />
                <span className="truncate">{file.name}</span>
                <span className="ml-auto text-[11px] text-stone-600 group-hover:text-primary shrink-0">Select</span>
              </button>
            ))}

            {/* Empty state */}
            {!loading && directories.length === 0 && files.length === 0 && (
              <div className="text-center py-8 text-dim text-sm">
                No folders or .ps1 files in this directory.
              </div>
            )}
          </div>
        )}
      </div>

      {/* Cancel */}
      <div className="mt-4 flex justify-end">
        <button
          type="button"
          className={btnQuick}
          onClick={onClose}
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
