import { useEffect, useState } from 'react';
import { api } from '../api';
import { Modal } from '../components/Modal';
import { FolderTree } from '../components/FolderTree';
import type { Script, TreeEntry } from '../types';
import {
  FileCode,
  Plus,
  Trash2,
  Pencil,
  Play,
  Eye,
  FolderOpen,
  Clock,
  RefreshCw,
  FolderSearch,
} from 'lucide-react';

const inputClass =
  'w-full bg-panel-soft border border-line rounded-card-sm px-3 py-2 text-[13px] text-ink placeholder-muted focus:outline-none focus:border-ink-2 transition-colors font-mono';

export function Scripts() {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [editScript, setEditScript] = useState<Script | null>(null);
  const [viewContent, setViewContent] = useState<{ name: string; content: string } | null>(null);
  const [error, setError] = useState('');

  // Folder tree state
  const [scriptsFolder, setScriptsFolder] = useState<string | null>(null);
  const [settingsLoaded, setSettingsLoaded] = useState(false);
  const [folderTree, setFolderTree] = useState<TreeEntry[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [showFolderPicker, setShowFolderPicker] = useState(false);
  const [treeLoading, setTreeLoading] = useState(false);
  const [defaultTimeoutSeconds, setDefaultTimeoutSeconds] = useState(300);

  const load = () => {
    api.getScripts().then(setScripts);
  };

  const refreshSettings = () =>
    api.getSettings().then((settings) => {
      if (settings.scriptsFolder) {
        setScriptsFolder(settings.scriptsFolder);
        loadTree(settings.scriptsFolder);
      }
      if (Number.isFinite(settings.defaultTimeoutSeconds)) {
        setDefaultTimeoutSeconds(settings.defaultTimeoutSeconds as number);
      }
      setSettingsLoaded(true);
    });

  useEffect(() => {
    load();
    refreshSettings();
  }, []);

  const loadTree = async (folder: string) => {
    setTreeLoading(true);
    try {
      const tree = await api.browseTree(folder);
      setFolderTree(tree);
    } catch {
      setFolderTree([]);
    }
    setTreeLoading(false);
  };

  const handlePickFolder = async (folderPath: string) => {
    setShowFolderPicker(false);
    setScriptsFolder(folderPath);
    setSelectedFolder(null);
    await api.updateSettings({ scriptsFolder: folderPath });
    loadTree(folderPath);
  };

  const handleChangeFolder = () => {
    setShowFolderPicker(true);
  };

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await api.createScript({
        name: form.get('name') as string,
        path: form.get('path') as string,
        description: form.get('description') as string,
        timeoutSeconds: Number.isNaN(parseInt(form.get('timeoutSeconds') as string))
          ? 300
          : parseInt(form.get('timeoutSeconds') as string),
      });
      setShowAdd(false);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleEdit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!editScript) return;
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await api.updateScript(editScript.id, {
        name: form.get('name') as string,
        path: form.get('path') as string,
        description: form.get('description') as string,
        timeoutSeconds: Number.isNaN(parseInt(form.get('timeoutSeconds') as string))
          ? 300
          : parseInt(form.get('timeoutSeconds') as string),
      });
      setEditScript(null);
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete script "${name}" and all its schedules?`)) return;
    await api.deleteScript(id);
    load();
  };

  const handleRun = async (id: string) => {
    await api.runScript(id);
    alert('Script execution started. Check History for results.');
  };

  const handleView = async (script: Script) => {
    try {
      const { content } = await api.getScriptContent(script.id);
      setViewContent({ name: script.name, content });
    } catch (err: any) {
      setError(err.message);
    }
  };

  // Filter scripts based on selected folder
  const filteredScripts = selectedFolder
    ? scripts.filter((s) => {
        const normalizedPath = s.path.replace(/\//g, '\\');
        const normalizedFolder = selectedFolder.replace(/\//g, '\\');
        return normalizedPath.startsWith(normalizedFolder + '\\');
      })
    : scripts;

  // Loading state
  if (!settingsLoaded) {
    return (
      <div className="bg-panel rounded-card shadow-card p-10 flex items-center justify-center flex-1 min-h-0">
        <div className="flex flex-col items-center gap-2">
          <FileCode className="w-5 h-5 text-muted animate-pulse" />
          <p className="text-muted text-[12px]">Loading…</p>
        </div>
      </div>
    );
  }

  // State A: No scripts folder set — show folder picker prompt
  if (!scriptsFolder) {
    return (
      <div className="flex flex-col gap-5 flex-1 min-h-0">
        <div className="flex items-center justify-between shrink-0">
          <div>
            <h1 className="text-[32px] font-bold tracking-[-0.8px] text-ink">Scripts</h1>
            <p className="text-muted text-[12.5px] mt-0.5">
              Browse and manage your PowerShell scripts
            </p>
          </div>
        </div>

        {!showFolderPicker ? (
          <div className="bg-panel rounded-card shadow-card p-10 flex items-center justify-center flex-1 min-h-0">
            <div className="flex flex-col items-center gap-4">
              <div className="p-4 rounded-full bg-panel-soft border border-line">
                <FolderSearch className="w-8 h-8 text-ink-2" />
              </div>
              <div className="text-center">
                <p className="text-ink text-[15px] font-semibold">Choose a scripts folder</p>
                <p className="text-muted text-[12.5px] mt-1 max-w-[320px]">
                  Select the root folder where your PowerShell scripts live. The folder structure
                  will appear as a navigation tree.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowFolderPicker(true)}
                className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-on-ink text-[13px] font-medium hover:brightness-110 transition-all"
              >
                <FolderOpen className="w-4 h-4" />
                <span>Browse for folder</span>
              </button>
            </div>
          </div>
        ) : (
          <div className="bg-panel rounded-card shadow-card p-6 flex-1 min-h-0 overflow-y-auto">
            <FolderPicker onSelect={handlePickFolder} onCancel={() => setShowFolderPicker(false)} />
          </div>
        )}
      </div>
    );
  }

  // State B: Scripts folder is set — show sidebar + content
  return (
    <div className="flex flex-col gap-5 flex-1 min-h-0">
      <div className="flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.8px] text-ink">Scripts</h1>
          <p className="text-muted text-[12.5px] mt-0.5">
            {filteredScripts.length} script{filteredScripts.length === 1 ? '' : 's'}
            {selectedFolder ? ` in ${selectedFolder.split(/[/\\]/).pop()}` : ' total'}
          </p>
        </div>
        <button
          type="button"
          onClick={() => { refreshSettings(); setShowAdd(true); }}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-on-ink text-[13px] font-medium hover:brightness-110 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Script</span>
        </button>
      </div>

      <div className="bg-panel rounded-card shadow-card flex flex-1 min-h-0 overflow-hidden">
        {/* Left sidebar — folder tree */}
        <div className="w-[240px] shrink-0 border-r border-line flex flex-col">
          <div className="px-4 py-3 border-b border-line flex items-center justify-between">
            <p className="text-muted text-[11px] uppercase tracking-[0.6px] font-medium">
              Explorer
            </p>
            <button
              type="button"
              onClick={() => loadTree(scriptsFolder)}
              className="cursor-pointer w-7 h-7 rounded-full border border-line text-ink-2 grid place-items-center hover:bg-panel-soft transition-colors"
              title="Refresh tree"
            >
              <RefreshCw className="w-3 h-3" />
            </button>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {treeLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-muted text-[12px]">Scanning…</p>
              </div>
            ) : (
              <FolderTree
                tree={folderTree}
                selectedPath={selectedFolder}
                rootPath={scriptsFolder}
                onSelect={setSelectedFolder}
              />
            )}
          </div>
          <div className="px-3 py-2 border-t border-line">
            <button
              type="button"
              onClick={handleChangeFolder}
              className="cursor-pointer w-full flex items-center justify-center gap-1.5 px-2.5 py-1.5 rounded-full border border-line text-ink-2 hover:bg-panel-soft hover:text-ink transition-colors text-[11px]"
            >
              <FolderOpen className="w-3 h-3" />
              <span>Change folder</span>
            </button>
          </div>
        </div>

        {/* Right content — script list */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="px-6 py-4 border-b border-line flex items-center justify-between shrink-0">
            <h2 className="text-[15px] font-bold tracking-[-0.2px] text-ink">
              {selectedFolder ? selectedFolder.split(/[/\\]/).pop() : 'All Scripts'}
            </h2>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-pill text-ink-2 text-[11px] font-medium">
              {filteredScripts.length}
            </span>
          </div>

          {filteredScripts.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 flex-1">
              <FileCode className="w-6 h-6 text-muted" />
              <p className="text-muted text-[13px]">
                {selectedFolder ? 'No scripts in this folder.' : 'No scripts registered yet.'}
              </p>
              <button
                type="button"
                onClick={() => { refreshSettings(); setShowAdd(true); }}
                className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full border border-line text-ink-2 hover:bg-panel-soft hover:text-ink transition-colors text-[12px]"
              >
                <Plus className="w-3 h-3" />
                <span>Add a script</span>
              </button>
            </div>
          ) : (
            <div>
              {filteredScripts.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-4 px-6 py-4 border-b border-line last:border-0 hover:bg-panel-soft transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-8 h-8 rounded-full bg-panel-soft border border-line grid place-items-center shrink-0">
                      <FileCode className="w-3.5 h-3.5 text-ink-2" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[13.5px] font-semibold text-ink truncate">{s.name}</p>
                      {s.description && (
                        <p className="text-[11.5px] text-muted italic truncate">{s.description}</p>
                      )}
                      <p className="text-[11.5px] text-muted font-mono truncate">{s.path}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pill text-ink-2 text-[11px] font-medium">
                      <Clock className="w-3 h-3" />
                      {s.timeoutSeconds ? `${s.timeoutSeconds}s` : 'No timeout'}
                    </span>

                    <div className="flex items-center gap-1.5">
                      <IconBtn title="Run script" onClick={() => handleRun(s.id)} tone="ok">
                        <Play className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn title="View content" onClick={() => handleView(s)}>
                        <Eye className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn
                        title="Edit script"
                        onClick={() => {
                          setError('');
                          setEditScript(s);
                        }}
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </IconBtn>
                      <IconBtn
                        title="Delete script"
                        onClick={() => handleDelete(s.id, s.name)}
                        tone="danger"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </IconBtn>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showAdd && (
        <Modal title="Add Script" onClose={() => setShowAdd(false)}>
          <ScriptForm
            onSubmit={handleAdd}
            error={error}
            currentFolder={selectedFolder || scriptsFolder || ''}
            defaultTimeoutSeconds={defaultTimeoutSeconds}
          />
        </Modal>
      )}

      {editScript && (
        <Modal title="Edit Script" onClose={() => setEditScript(null)}>
          <ScriptForm
            onSubmit={handleEdit}
            error={error}
            initial={editScript}
            currentFolder={selectedFolder || scriptsFolder || ''}
            defaultTimeoutSeconds={defaultTimeoutSeconds}
          />
        </Modal>
      )}

      {viewContent && (
        <Modal title={viewContent.name} onClose={() => setViewContent(null)}>
          <pre className="bg-panel-soft border border-line rounded-card-sm p-3 font-mono text-[12px] whitespace-pre-wrap break-all max-h-[400px] overflow-y-auto text-ink-2">
            {viewContent.content}
          </pre>
        </Modal>
      )}

      {showFolderPicker && scriptsFolder && (
        <Modal title="Change Scripts Folder" onClose={() => setShowFolderPicker(false)}>
          <FolderPicker
            onSelect={handlePickFolder}
            onCancel={() => setShowFolderPicker(false)}
            initialPath={scriptsFolder}
          />
        </Modal>
      )}
    </div>
  );
}

// ── Icon button ──

function IconBtn({
  children,
  onClick,
  title,
  tone,
}: {
  children: React.ReactNode;
  onClick: () => void;
  title: string;
  tone?: 'ok' | 'danger';
}) {
  let toneCls = 'border-line text-ink-2 hover:bg-panel-soft hover:text-ink';
  if (tone === 'ok') toneCls = 'border-line text-ink-2 hover:border-ok hover:bg-ok-soft hover:text-ok-strong';
  if (tone === 'danger')
    toneCls = 'border-line text-danger-strong hover:border-danger hover:bg-danger-soft';
  return (
    <button
      type="button"
      onClick={onClick}
      title={title}
      className={`w-8 h-8 rounded-full border grid place-items-center cursor-pointer transition-colors ${toneCls}`}
    >
      {children}
    </button>
  );
}

// ── Folder Picker (reuses browse API but only selects directories) ──

function FolderPicker({
  onSelect,
  onCancel,
  initialPath,
}: {
  onSelect: (folderPath: string) => void;
  onCancel: () => void;
  initialPath?: string;
}) {
  const [currentPath, setCurrentPath] = useState(initialPath || '');
  const [parent, setParent] = useState<string | null>(null);
  const [directories, setDirectories] = useState<{ name: string; path: string }[]>([]);
  const [quickAccess, setQuickAccess] = useState<{ name: string; path: string }[]>([]);
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
          <button
            key={qa.path}
            type="button"
            onClick={() => setCurrentPath(qa.path)}
            className="cursor-pointer px-2.5 py-1 text-[11px] rounded-full border border-line bg-panel text-ink-2 hover:bg-panel-soft hover:text-ink transition-colors flex items-center gap-1.5"
          >
            <FolderOpen className="w-3 h-3" />
            {qa.name}
          </button>
        ))}
      </div>

      <div className="px-3 py-2 rounded-card-sm border border-line bg-panel-soft font-mono text-[12px] text-ink-2 break-all mb-3">
        {currentPath || '...'}
      </div>

      {error && <div className="text-danger-strong text-[12px] mb-3">{error}</div>}

      <div className="border border-line rounded-card-sm bg-panel max-h-[350px] overflow-y-auto">
        {loading ? (
          <div className="text-center py-8 text-muted text-[12px]">Loading…</div>
        ) : (
          <div>
            {parent && (
              <button
                type="button"
                className="cursor-pointer flex items-center gap-2.5 w-full px-3 py-2.5 text-[12px] text-ink-2 hover:bg-panel-soft transition-colors border-b border-line font-mono"
                onClick={() => setCurrentPath(parent)}
              >
                <FolderOpen className="w-3.5 h-3.5 text-muted" />
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
                <FolderOpen className="w-3.5 h-3.5 text-muted shrink-0" />
                <span className="truncate">{dir.name}</span>
              </button>
            ))}

            {directories.length === 0 && !parent && (
              <div className="text-center py-8 text-muted text-[12px]">No subfolders found.</div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer px-4 py-2 rounded-full border border-line text-ink-2 hover:bg-panel-soft hover:text-ink transition-colors text-[12px]"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSelect(currentPath)}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-on-ink text-[12px] font-medium hover:brightness-110 transition-all"
        >
          <FolderOpen className="w-3.5 h-3.5" />
          Select this folder
        </button>
      </div>
    </div>
  );
}

// ── Script Form (add/edit) ──

function ScriptForm({
  onSubmit,
  error,
  initial,
  currentFolder,
  defaultTimeoutSeconds = 300,
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  error: string;
  initial?: Script;
  currentFolder: string;
  defaultTimeoutSeconds?: number;
}) {
  const initialFilename = initial?.path ? initial.path.split(/[/\\]/).pop() || '' : '';
  const [filename, setFilename] = useState(initialFilename);

  const fullPath = initial
    ? filename === initialFilename
      ? initial.path
      : currentFolder
      ? currentFolder + '\\' + filename
      : filename
    : currentFolder
    ? currentFolder + '\\' + filename
    : filename;

  return (
    <form onSubmit={onSubmit}>
      <div className="mb-4">
        <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.6px] mb-1.5">
          Name
        </label>
        <input
          name="name"
          required
          defaultValue={initial?.name}
          placeholder="Cleanup Temp Files"
          className={inputClass}
        />
      </div>
      <div className="mb-4">
        <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.6px] mb-1.5">
          Script File
        </label>
        {currentFolder && (
          <div className="flex items-center gap-2 mb-2 px-3 py-2 rounded-card-sm bg-panel-soft border border-line">
            <FolderOpen className="w-3 h-3 text-muted shrink-0" />
            <span className="text-[11.5px] font-mono text-ink-2 truncate">{currentFolder}</span>
          </div>
        )}
        <input
          type="text"
          value={filename}
          onChange={(e) => setFilename(e.target.value)}
          placeholder="script-name.ps1"
          className={inputClass}
          required
        />
        <input type="hidden" name="path" value={fullPath} />
        <div className="text-[11px] text-muted mt-1 font-mono">
          {currentFolder ? 'Filename inside the selected folder' : 'Full path to a .ps1 file'}
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.6px] mb-1.5">
          Description
        </label>
        <input
          name="description"
          defaultValue={initial?.description}
          placeholder="Optional description"
          className={inputClass}
        />
      </div>
      <div className="mb-4">
        <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.6px] mb-1.5">
          Timeout (seconds)
        </label>
        <input
          name="timeoutSeconds"
          type="number"
          defaultValue={initial?.timeoutSeconds ?? defaultTimeoutSeconds}
          min={0}
          className={inputClass}
        />
        <p className="text-[11px] text-muted mt-1">Set to 0 for no timeout</p>
      </div>
      {error && <div className="text-danger-strong text-[12px] mb-3">{error}</div>}
      <button
        type="submit"
        className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-on-ink text-[13px] font-medium hover:brightness-110 transition-all"
      >
        {initial ? 'Save Changes' : 'Add Script'}
      </button>
    </form>
  );
}
