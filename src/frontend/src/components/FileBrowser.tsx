import { useEffect, useState } from 'react';
import { Folder, FileCode, ArrowUp, Home, HardDrive } from 'lucide-react';
import { api } from '../api';
import type { BrowseEntry } from '../types';

const quickBtn =
  'cursor-pointer flex items-center gap-1.5 px-2.5 py-1 text-[11px] rounded-full border border-line bg-panel text-ink-2 hover:bg-panel-soft hover:text-ink transition-colors';

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

    api
      .browse(currentPath || undefined)
      .then((result) => {
        if (cancelled) return;
        setCurrentPath(result.current);
        setParent(result.parent);
        setDirectories(result.directories);
        setFiles(result.files);
        setQuickAccess(result.quickAccess);
        setLoading(false);
      })
      .catch((err) => {
        if (cancelled) return;
        setError(err.message);
        setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [currentPath]);

  return (
    <div>
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        {quickAccess.map((qa) => (
          <button key={qa.path} type="button" className={quickBtn} onClick={() => setCurrentPath(qa.path)}>
            {qa.name === 'Home' ? <Home className="w-3 h-3" /> : <HardDrive className="w-3 h-3" />}
            {qa.name}
          </button>
        ))}
      </div>

      <div className="px-3 py-2 rounded-card-sm border border-line bg-panel-soft font-mono text-[12px] text-ink-2 break-all mb-3">
        {currentPath || '...'}
      </div>

      {error && <div className="text-danger-strong text-[12px] mb-3">{error}</div>}

      <div className="border border-line rounded-card-sm bg-panel max-h-[400px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-muted text-[12px]">Loading…</div>
        ) : (
          <div>
            {parent && (
              <button
                type="button"
                className="cursor-pointer flex items-center gap-2.5 w-full px-3 py-2.5 text-[12px] text-ink-2 hover:bg-panel-soft transition-colors border-b border-line"
                onClick={() => setCurrentPath(parent)}
              >
                <ArrowUp className="w-4 h-4 text-muted" />
                <span>..</span>
              </button>
            )}

            {directories.map((dir) => (
              <button
                key={dir.path}
                type="button"
                className="cursor-pointer flex items-center gap-2.5 w-full px-3 py-2.5 text-[12px] text-ink hover:bg-panel-soft transition-colors border-b border-line font-mono"
                onClick={() => setCurrentPath(dir.path)}
              >
                <Folder className="w-4 h-4 text-muted shrink-0" />
                <span className="truncate">{dir.name}</span>
              </button>
            ))}

            {files.map((file) => (
              <button
                key={file.path}
                type="button"
                className="cursor-pointer flex items-center gap-2.5 w-full px-3 py-2.5 text-[12px] text-ink hover:bg-panel-soft transition-colors border-b border-line font-mono group"
                onClick={() => onSelect(file.path)}
              >
                <FileCode className="w-4 h-4 text-muted shrink-0 group-hover:text-ink" />
                <span className="truncate">{file.name}</span>
                <span className="ml-auto text-[11px] text-muted group-hover:text-ink shrink-0">Select</span>
              </button>
            ))}

            {!loading && directories.length === 0 && files.length === 0 && (
              <div className="text-center py-8 text-muted text-[12px]">
                No folders or .ps1 files in this directory.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex justify-end">
        <button type="button" className={quickBtn} onClick={onClose}>
          Cancel
        </button>
      </div>
    </div>
  );
}
