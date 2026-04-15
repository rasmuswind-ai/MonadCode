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

const inputClass = 'cursor-text w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-500/50 transition-colors font-mono';

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

  const load = () => { api.getScripts().then(setScripts); };

  useEffect(() => {
    load();
    api.getSettings().then((settings) => {
      if (settings.scriptsFolder) {
        setScriptsFolder(settings.scriptsFolder);
        loadTree(settings.scriptsFolder);
      }
      setSettingsLoaded(true);
    });
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
        timeoutSeconds: Number.isNaN(parseInt(form.get('timeoutSeconds') as string)) ? 300 : parseInt(form.get('timeoutSeconds') as string),
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
        timeoutSeconds: Number.isNaN(parseInt(form.get('timeoutSeconds') as string)) ? 300 : parseInt(form.get('timeoutSeconds') as string),
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

  // Show loading while settings are being fetched
  if (!settingsLoaded) {
    return (
      <div className="lg:h-screen relative flex flex-col lg:overflow-hidden overflow-y-auto p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-white/50 opacity-25 rounded-full blur-[175px] -translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-pink-500 opacity-15 rounded-full blur-[200px] translate-y-1/3" />
        </div>
        <div className="relative flex-1 flex items-center justify-center bg-black/70 border border-white/10 rounded-2xl p-6 shadow-2xl">
          <div className="flex flex-col items-center gap-2">
            <FileCode className="w-5 h-5 text-stone-700 animate-pulse" />
            <p className="text-stone-600 text-xs">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  // State A: No scripts folder set — show folder picker prompt
  if (!scriptsFolder) {
    return (
      <div className="lg:h-screen relative flex flex-col lg:overflow-hidden overflow-y-auto p-4">
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
          <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-white/50 opacity-25 rounded-full blur-[175px] -translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-pink-500 opacity-15 rounded-full blur-[200px] translate-y-1/3" />
        </div>
        <div className="relative flex-1 flex flex-col bg-black/70 border border-white/10 rounded-2xl p-6 shadow-2xl min-h-0 overflow-y-auto custom-scrollbar">
          <div className="shrink-0">
            <div className="flex items-center gap-2">
              <div className="border border-white/10 ml-2 mr-2 py-4" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-stone-600 via-stone-400 to-stone-600 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                Scripts
              </h2>
            </div>
          </div>

          {!showFolderPicker ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="flex flex-col items-center gap-4">
                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                  <FolderSearch className="w-8 h-8 text-stone-600" />
                </div>
                <div className="text-center">
                  <p className="text-stone-300 text-sm font-semibold">Choose a scripts folder</p>
                  <p className="text-stone-600 text-xs mt-1 max-w-[300px]">
                    Select the root folder where your PowerShell scripts are located. The folder structure will appear as a navigation tree.
                  </p>
                </div>
                <button
                  onClick={() => setShowFolderPicker(true)}
                  className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-white/10 text-stone-400 hover:text-stone-300 hover:border-white/20 hover:bg-white/5 transition-all duration-200 text-xs"
                >
                  <FolderOpen className="w-4 h-4" />
                  <span>Browse for folder</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="mt-6 flex-1">
              <FolderPicker
                onSelect={handlePickFolder}
                onCancel={() => setShowFolderPicker(false)}
              />
            </div>
          )}
        </div>
      </div>
    );
  }

  // State B: Scripts folder is set — show sidebar + content
  return (
    <div className="lg:h-screen relative flex flex-col lg:overflow-hidden overflow-y-auto p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-white/50 opacity-25 rounded-full blur-[175px] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-pink-500 opacity-15 rounded-full blur-[200px] translate-y-1/3" />
      </div>

      <div className="relative flex-1 flex bg-black/70 border border-white/10 rounded-2xl shadow-2xl min-h-0 overflow-hidden">
        {/* Left sidebar — folder tree */}
        <div className="w-[220px] shrink-0 border-r border-white/10 flex flex-col">
          <div className="px-3 py-3 border-b border-white/10 shrink-0">
            <div className="flex items-center justify-between">
              <p className="text-stone-500 text-[11px] uppercase tracking-wider font-medium">Explorer</p>
              <button
                onClick={() => loadTree(scriptsFolder)}
                className="cursor-pointer p-1 rounded text-stone-600 hover:text-stone-400 transition-colors"
                title="Refresh tree"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
            {treeLoading ? (
              <div className="flex items-center justify-center py-8">
                <p className="text-stone-600 text-xs">Scanning...</p>
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
          <div className="px-3 py-2 border-t border-white/10 shrink-0">
            <button
              onClick={handleChangeFolder}
              className="cursor-pointer w-full flex items-center justify-center gap-1.5 px-2 py-1 rounded-lg border border-white/10 text-stone-600 hover:text-stone-400 hover:border-white/20 hover:bg-white/5 transition-all duration-200 text-[11px]"
            >
              <FolderOpen className="w-3 h-3" />
              <span>Change folder</span>
            </button>
          </div>
        </div>

        {/* Right content — script list */}
        <div className="flex-1 flex flex-col p-6 min-w-0 overflow-y-auto custom-scrollbar">
          <div className="shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="border border-white/10 ml-2 mr-2 py-4" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-stone-600 via-stone-400 to-stone-600 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                  Scripts
                </h2>
              </div>
              <button
                onClick={() => setShowAdd(true)}
                className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 text-stone-400 hover:text-stone-300 hover:border-white/20 hover:bg-white/5 transition-all duration-200 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Script</span>
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col lg:flex-row gap-4 shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2 shadow-2xl shrink-0">
              <div className="flex items-center gap-3 whitespace-nowrap">
                <FileCode className="w-4 h-4 ml-2 text-stone-600" />
                <p className="text-stone-400 text-sm">
                  {selectedFolder ? 'Scripts in folder:' : 'Total scripts:'}
                </p>
                <p className="mr-2 text-md font-bold text-gray-300">{filteredScripts.length}</p>
              </div>
            </div>
            {selectedFolder && (
              <div className="bg-white/5 border border-white/10 rounded-2xl p-2 shadow-2xl shrink-0">
                <div className="flex items-center gap-3 whitespace-nowrap">
                  <FolderOpen className="w-4 h-4 ml-2 text-stone-600" />
                  <p className="mr-2 text-stone-400 text-sm truncate max-w-[300px]">
                    {selectedFolder.split(/[/\\]/).pop()}
                  </p>
                </div>
              </div>
            )}
          </div>

          <div className="mt-6 flex-1 min-h-0">
            <div className="bg-white/5 border border-white/10 backdrop-blur rounded-lg overflow-y-auto custom-scrollbar h-full">
              <div className="shrink-0">
                <div className="ml-3 w-fit">
                  <h2 className="text-stone-500 mt-3 ml-3">
                    {selectedFolder ? selectedFolder.split(/[/\\]/).pop() : 'All Scripts'}
                  </h2>
                  <div className="ml-2 mt-2 border border-white/10 px-1 rounded-lg" />
                </div>
              </div>

              {filteredScripts.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <FileCode className="w-5 h-5 text-stone-700" />
                  <p className="text-stone-600 text-xs">
                    {selectedFolder ? 'No scripts in this folder.' : 'No scripts registered yet.'}
                  </p>
                  <button
                    onClick={() => setShowAdd(true)}
                    className="cursor-pointer mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-stone-500 bg-white/5 hover:text-stone-300 hover:border-white/20 hover:bg-white/5 transition-all duration-200 text-xs"
                  >
                    <Plus className="w-3 h-3" />
                    <span>Add a script</span>
                  </button>
                </div>
              ) : (
                <div className="p-4">
                  {filteredScripts.map((s) => (
                    <div key={s.id}>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <FileCode className="w-4 h-4 text-stone-600 shrink-0" />
                          <div>
                            <p className="text-sm font-semibold text-stone-300">
                              {s.name}
                            </p>
                            {s.description && (
                              <p className="text-xs text-stone-500 italic">{s.description}</p>
                            )}
                            <p className="text-xs text-stone-600 font-mono mt-0.5">{s.path}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="border border-white/10 py-3 rounded-lg" />
                          <div className="ml-4 mr-4 text-xs flex items-center border border-white/10 backdrop-blur rounded-lg p-1 bg-black/40">
                            <div className="flex items-center gap-2 ml-2 mr-2">
                              <Clock className="w-3 h-3 text-stone-600" />
                              <span className="text-xs font-mono text-stone-400">{s.timeoutSeconds ? `${s.timeoutSeconds}s` : 'No timeout'}</span>
                            </div>
                          </div>
                          <div className="border border-white/10 py-3 rounded-lg" />
                          <button
                            onClick={() => handleRun(s.id)}
                            className="cursor-pointer p-2 rounded-lg border border-white/10 text-stone-500 hover:text-green-400 hover:border-green-500/30 hover:bg-green-500/10 transition-all duration-200"
                            title="Run script"
                          >
                            <Play className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleView(s)}
                            className="cursor-pointer p-2 rounded-lg border border-white/10 text-stone-500 hover:text-stone-300 hover:border-white/20 hover:bg-white/5 transition-all duration-200"
                            title="View content"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => { setError(''); setEditScript(s); }}
                            className="cursor-pointer p-2 rounded-lg border border-white/10 text-stone-500 hover:text-stone-300 hover:border-white/20 hover:bg-white/5 transition-all duration-200"
                            title="Edit script"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.name)}
                            className="cursor-pointer p-2 rounded-lg border border-white/10 text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all duration-200"
                            title="Delete script"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <div className="border border-white/5" />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {showAdd && (
            <Modal title="Add Script" onClose={() => setShowAdd(false)}>
              <ScriptForm onSubmit={handleAdd} error={error} currentFolder={selectedFolder || scriptsFolder || ''} />
            </Modal>
          )}

          {editScript && (
            <Modal title="Edit Script" onClose={() => setEditScript(null)}>
              <ScriptForm onSubmit={handleEdit} error={error} initial={editScript} currentFolder={selectedFolder || scriptsFolder || ''} />
            </Modal>
          )}

          {viewContent && (
            <Modal title={viewContent.name} onClose={() => setViewContent(null)}>
              <pre className="bg-white/5 border border-white/10 rounded-lg p-3 font-mono text-xs whitespace-pre-wrap break-all max-h-[400px] overflow-y-auto text-stone-400 custom-scrollbar">
                {viewContent.content}
              </pre>
            </Modal>
          )}

          {showFolderPicker && (
            <Modal title="Change Scripts Folder" onClose={() => setShowFolderPicker(false)}>
              <FolderPicker
                onSelect={handlePickFolder}
                onCancel={() => setShowFolderPicker(false)}
                initialPath={scriptsFolder}
              />
            </Modal>
          )}
        </div>
      </div>
    </div>
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

    api.browse(currentPath || undefined).then((result) => {
      if (cancelled) return;
      setCurrentPath(result.current);
      setParent(result.parent);
      setDirectories(result.directories);
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
      <div className="flex items-center gap-2 mb-3">
        {quickAccess.map((qa) => (
          <button
            key={qa.path}
            type="button"
            onClick={() => setCurrentPath(qa.path)}
            className="cursor-pointer px-2.5 py-1 text-[11px] rounded-lg border border-white/10 text-stone-400 hover:text-stone-300 hover:border-white/20 hover:bg-white/5 transition-all duration-200 flex items-center gap-1.5"
          >
            <FolderOpen className="w-3 h-3" />
            {qa.name}
          </button>
        ))}
      </div>

      <div className="px-3 py-2 rounded-lg border border-white/10 bg-white/5 font-mono text-xs text-stone-400 break-all mb-3">
        {currentPath || '...'}
      </div>

      {error && <div className="text-red-400 text-xs mb-3">{error}</div>}

      <div className="border border-white/10 rounded-lg bg-white/5 max-h-[350px] overflow-y-auto custom-scrollbar">
        {loading ? (
          <div className="text-center py-8 text-stone-600 text-xs">Loading...</div>
        ) : (
          <div>
            {parent && (
              <button
                type="button"
                className="cursor-pointer flex items-center gap-2.5 w-full px-3 py-2.5 text-xs text-stone-400 hover:bg-white/5 transition-colors border-b border-white/5 font-mono"
                onClick={() => setCurrentPath(parent)}
              >
                <FolderOpen className="w-3.5 h-3.5 text-stone-500" />
                <span>..</span>
              </button>
            )}

            {directories.map((dir) => (
              <button
                key={dir.path}
                type="button"
                className="cursor-pointer flex items-center gap-2.5 w-full px-3 py-2.5 text-xs text-stone-300 hover:bg-white/5 transition-colors border-b border-white/5 font-mono"
                onClick={() => setCurrentPath(dir.path)}
              >
                <FolderOpen className="w-3.5 h-3.5 text-stone-500 shrink-0" />
                <span className="truncate">{dir.name}</span>
              </button>
            ))}

            {directories.length === 0 && !parent && (
              <div className="text-center py-8 text-stone-600 text-xs">
                No subfolders found.
              </div>
            )}
          </div>
        )}
      </div>

      <div className="mt-4 flex items-center justify-between">
        <button
          type="button"
          onClick={onCancel}
          className="cursor-pointer px-3 py-1.5 rounded-lg border border-white/10 text-stone-500 hover:text-stone-300 hover:border-white/20 hover:bg-white/5 transition-all duration-200 text-xs"
        >
          Cancel
        </button>
        <button
          type="button"
          onClick={() => onSelect(currentPath)}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-green-800 text-stone-300 text-xs font-medium transition-all duration-200 hover:bg-green-600 hover:border-white/20 hover:text-stone-200"
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
}: {
  onSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  error: string;
  initial?: Script;
  currentFolder: string;
}) {
  const initialFilename = initial?.path ? initial.path.split(/[/\\]/).pop() || '' : '';
  const [filename, setFilename] = useState(initialFilename);

  // For editing, keep the full original path; for adding, build from folder + filename
  const fullPath = initial
    ? (filename === initialFilename ? initial.path : (currentFolder ? currentFolder + '\\' + filename : filename))
    : (currentFolder ? currentFolder + '\\' + filename : filename);

  return (
    <form onSubmit={onSubmit}>
      <div className="mb-4">
        <label className="block text-xs font-semibold text-stone-500 mb-1">Name</label>
        <input name="name" required defaultValue={initial?.name} placeholder="Cleanup Temp Files" className={inputClass} />
      </div>
      <div className="mb-4">
        <label className="block text-xs font-semibold text-stone-500 mb-1">Script File</label>
        {currentFolder && (
          <div className="flex items-center gap-2 mb-2 px-3 py-1.5 rounded-lg bg-white/5 border border-white/10">
            <FolderOpen className="w-3 h-3 text-stone-600 shrink-0" />
            <span className="text-[11px] font-mono text-stone-500 truncate">{currentFolder}</span>
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
        <div className="text-xs text-stone-600 mt-1 font-mono">
          {currentFolder ? 'Filename inside the selected folder' : 'Full path to a .ps1 file'}
        </div>
      </div>
      <div className="mb-4">
        <label className="block text-xs font-semibold text-stone-500 mb-1">Description</label>
        <input name="description" defaultValue={initial?.description} placeholder="Optional description" className={inputClass} />
      </div>
      <div className="mb-4">
        <label className="block text-xs font-semibold text-stone-500 mb-1">Timeout (seconds)</label>
        <div className="flex items-center gap-3">
          <input name="timeoutSeconds" type="number" defaultValue={initial?.timeoutSeconds ?? 300} min={0} className={inputClass} />
        </div>
        <p className="text-[11px] text-stone-600 mt-1">Set to 0 for no timeout</p>
      </div>
      {error && <div className="text-red-400 text-xs mb-3">{error}</div>}
      <button
        type="submit"
        className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-green-800 text-stone-300 text-xs font-medium transition-all duration-200 hover:bg-green-600 hover:border-white/20 hover:text-stone-200"
      >
        {initial ? 'Save' : 'Add Script'}
      </button>
    </form>
  );
}
