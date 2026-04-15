import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { Modal } from '../components/Modal';
import { FolderTree } from '../components/FolderTree';
import type { Schedule, Script, TreeEntry } from '../types';
import {
  Clock,
  Plus,
  Trash2,
  Pencil,
  Search,
  FolderOpen,
  RefreshCw,
} from 'lucide-react';

const inputClass = 'cursor-text w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-500/50 transition-colors font-mono';
const dropDownClass = 'cursor-pointer w-full bg-white/5 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-500/50 transition-colors font-mono';

type Frequency = 'every-minutes' | 'every-hours' | 'daily' | 'weekly' | 'custom';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface CronPreset {
  frequency: Frequency;
  interval: number;
  hour: number;
  minute: number;
  dayOfWeek: number;
  raw: string;
}

function buildCron(p: CronPreset): string {
  switch (p.frequency) {
    case 'every-minutes': return `*/${Math.max(1, Math.min(59, p.interval))} * * * *`;
    case 'every-hours':   return `0 */${Math.max(1, Math.min(23, p.interval))} * * *`;
    case 'daily':         return `${p.minute} ${p.hour} * * *`;
    case 'weekly':        return `${p.minute} ${p.hour} * * ${p.dayOfWeek}`;
    case 'custom':        return p.raw;
  }
}

function parseCron(cron: string): CronPreset {
  const defaults: CronPreset = { frequency: 'custom', interval: 5, hour: 9, minute: 0, dayOfWeek: 1, raw: cron };
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return defaults;
  const [m, h, dom, mon, dow] = parts;

  // */N * * * *
  if (/^\*\/\d+$/.test(m) && h === '*' && dom === '*' && mon === '*' && dow === '*') {
    return { ...defaults, frequency: 'every-minutes', interval: parseInt(m.slice(2)) };
  }
  // 0 */N * * *
  if (m === '0' && /^\*\/\d+$/.test(h) && dom === '*' && mon === '*' && dow === '*') {
    return { ...defaults, frequency: 'every-hours', interval: parseInt(h.slice(2)) };
  }
  // M H * * D
  if (/^\d+$/.test(m) && /^\d+$/.test(h) && dom === '*' && mon === '*' && /^\d+$/.test(dow)) {
    return { ...defaults, frequency: 'weekly', minute: parseInt(m), hour: parseInt(h), dayOfWeek: parseInt(dow) };
  }
  // M H * * *
  if (/^\d+$/.test(m) && /^\d+$/.test(h) && dom === '*' && mon === '*' && dow === '*') {
    return { ...defaults, frequency: 'daily', minute: parseInt(m), hour: parseInt(h) };
  }
  return defaults;
}

function CronPicker({ value, onChange }: { value: string; onChange: (cron: string) => void }) {
  const [preset, setPreset] = useState<CronPreset>(() => parseCron(value));

  const update = (patch: Partial<CronPreset>) => {
    const next = { ...preset, ...patch };
    setPreset(next);
    onChange(buildCron(next));
  };

  const timeValue = `${String(preset.hour).padStart(2, '0')}:${String(preset.minute).padStart(2, '0')}`;

  const handleTimeChange = (val: string) => {
    const [h, m] = val.split(':').map(Number);
    update({ hour: h, minute: m });
  };

  return (
    <div className="space-y-3">
      <select
        className={dropDownClass}
        value={preset.frequency}
        onChange={e => update({ frequency: e.target.value as Frequency })}
      >
        
        <option value="every-minutes">Every N minutes</option>
        <option value="every-hours">Every N hours</option>
        <option value="daily">Daily at time</option>
        <option value="weekly">Weekly on day at time</option>
        <option value="custom">Custom cron</option>
      </select>

      {preset.frequency === 'every-minutes' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">Every</span>
          <input
            type="number" min={1} max={59}
            className={inputClass + ' !w-20'}
            value={preset.interval}
            onChange={e => update({ interval: parseInt(e.target.value) || 1 })}
          />
          <span className="text-xs text-stone-500">minutes</span>
        </div>
      )}

      {preset.frequency === 'every-hours' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">Every</span>
          <input
            type="number" min={1} max={23}
            className={inputClass + ' !w-20'}
            value={preset.interval}
            onChange={e => update({ interval: parseInt(e.target.value) || 1 })}
          />
          <span className="text-xs text-stone-500">hours</span>
        </div>
      )}

      {preset.frequency === 'daily' && (
        <div className="flex items-center gap-2">
          <span className="text-xs text-stone-500">At</span>
          <input
            type="time"
            className={inputClass + ' !w-36'}
            value={timeValue}
            onChange={e => handleTimeChange(e.target.value)}
          />
        </div>
      )}

      {preset.frequency === 'weekly' && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs text-stone-500">On</span>
          <select
            className={inputClass + ' !w-36'}
            value={preset.dayOfWeek}
            onChange={e => update({ dayOfWeek: parseInt(e.target.value) })}
          >
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
          <span className="text-xs text-stone-500">at</span>
          <input
            type="time"
            className={inputClass + ' !w-36'}
            value={timeValue}
            onChange={e => handleTimeChange(e.target.value)}
          />
        </div>
      )}

      {preset.frequency === 'custom' && (
        <input
          className={inputClass}
          placeholder="*/5 * * * *"
          value={preset.raw}
          onChange={e => update({ raw: e.target.value })}
        />
      )}

      <div className="text-xs text-stone-600 font-mono">Cron: {buildCron(preset)}</div>
    </div>
  );
}

export function Schedules() {
  const [schedules, setSchedules] = useState<Schedule[]>([]);
  const [scripts, setScripts] = useState<Script[]>([]);
  const [showAdd, setShowAdd] = useState(false);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [newCron, setNewCron] = useState('*/5 * * * *');
  const [editingSchedule, setEditingSchedule] = useState<Schedule | null>(null);
  const [editCron, setEditCron] = useState('');
  const [editError, setEditError] = useState('');
  const [scriptSearch, setScriptSearch] = useState('');
  const [selectedScriptId, setSelectedScriptId] = useState('');
  const [scriptDropdownOpen, setScriptDropdownOpen] = useState(false);
  const scriptDropdownRef = useRef<HTMLDivElement>(null);

  // Folder tree state
  const [scriptsFolder, setScriptsFolder] = useState<string | null>(null);
  const [folderTree, setFolderTree] = useState<TreeEntry[]>([]);
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  const [treeLoading, setTreeLoading] = useState(false);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (scriptDropdownRef.current && !scriptDropdownRef.current.contains(e.target as Node)) {
        setScriptDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredScripts = scripts.filter(s =>
    s.name.toLowerCase().includes(scriptSearch.toLowerCase())
  );

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

  const load = async () => {
    await Promise.all([
      api.getSchedules().then(setSchedules),
      api.getScripts().then(setScripts),
    ]);
  };
  useEffect(() => {
    let mounted = true;
    const start = Date.now();

    (async () => {
      try {
        await load();
        const settings = await api.getSettings();
        if (settings.scriptsFolder) {
          setScriptsFolder(settings.scriptsFolder);
          loadTree(settings.scriptsFolder);
        }
      } finally {
        const elapsed = Date.now() - start;
        const remaining = Math.max(0, 500 - elapsed);
        window.setTimeout(() => {
          if (mounted) setIsLoading(false);
        }, remaining);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  // Filter schedules by selected folder (via associated script path)
  const filteredSchedules = selectedFolder
    ? schedules.filter(s => {
        const script = scripts.find(sc => sc.id === s.scriptId);
        if (!script) return false;
        const normalizedPath = script.path.replace(/\//g, '\\');
        const normalizedFolder = selectedFolder.replace(/\//g, '\\');
        return normalizedPath.startsWith(normalizedFolder + '\\');
      })
    : schedules;

  const handleAdd = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    const form = new FormData(e.currentTarget);
    try {
      await api.createSchedule({
        scriptId: form.get('scriptId') as string,
        cron: newCron,
        name: form.get('name') as string,
        enabled: true,
      });
      setShowAdd(false);
      setNewCron('*/5 * * * *');
      setSelectedScriptId('');
      setScriptSearch('');
      load();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleToggle = async (sched: Schedule) => {
    await api.updateSchedule(sched.id, { enabled: !sched.enabled });
    load();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!confirm(`Delete schedule "${name}"?`)) return;
    await api.deleteSchedule(id);
    load();
  };

  const handleEditCron = (sched: Schedule) => {
    setEditingSchedule(sched);
    setEditCron(sched.cron);
    setEditError('');
  };

  const handleSaveEditCron = async () => {
    if (!editingSchedule) return;
    try {
      await api.updateSchedule(editingSchedule.id, { cron: editCron });
      setEditingSchedule(null);
      load();
    } catch (err: any) {
      setEditError(err.message);
    }
  };

  return (
    <div className="lg:h-screen relative flex flex-col lg:overflow-hidden overflow-y-auto p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-white/50 opacity-25 rounded-full blur-[175px] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-pink-500 opacity-15 rounded-full blur-[200px] translate-y-1/3" />
      </div>

      <div className="relative flex-1 flex bg-black/70 border border-white/10 rounded-2xl shadow-2xl min-h-0 overflow-hidden">
        {/* Left sidebar — folder tree */}
        {scriptsFolder && (
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
          </div>
        )}

        {/* Right content — schedule list */}
        <div className="flex-1 flex flex-col p-6 min-w-0 overflow-y-auto custom-scrollbar">
          <div className="shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="border border-white/10 ml-2 mr-2 py-4" />
                <h2 className="text-2xl font-bold bg-gradient-to-r from-stone-600 via-stone-400 to-stone-600 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                  Schedules
                </h2>
              </div>
              <button
                onClick={() => setShowAdd(true)}
                className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 text-stone-400 hover:text-stone-300 hover:border-white/20 hover:bg-white/5 transition-all duration-200 text-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Create Schedule</span>
              </button>
            </div>
          </div>

          <div className="mt-6 flex flex-col lg:flex-row gap-4 shrink-0">
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2 shadow-2xl shrink-0">
              <div className="flex items-center gap-3 whitespace-nowrap">
                <Clock className="w-4 h-4 ml-2 text-stone-600" />
                <p className="text-stone-400 text-sm">
                  {selectedFolder ? 'Schedules in folder:' : 'Total schedules:'}
                </p>
                <p className="mr-2 text-md font-bold text-gray-300">{filteredSchedules.length}</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2 shadow-2xl shrink-0">
              <div className="flex items-center gap-3 whitespace-nowrap">
                <Clock className="w-4 h-4 ml-2 text-stone-600" />
                <p className="text-stone-400 text-sm">Active:</p>
                <p className="mr-2 text-md font-bold text-green-400">{filteredSchedules.filter(s => s.enabled).length}</p>
              </div>
            </div>
            <div className="bg-white/5 border border-white/10 rounded-2xl p-2 shadow-2xl shrink-0">
              <div className="flex items-center gap-3 whitespace-nowrap">
                <Clock className="w-4 h-4 ml-2 text-stone-600" />
                <p className="text-stone-400 text-sm">Disabled:</p>
                <p className="mr-2 text-md font-bold text-stone-500">{filteredSchedules.filter(s => !s.enabled).length}</p>
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
                    {selectedFolder ? selectedFolder.split(/[/\\]/).pop() : 'All Schedules'}
                  </h2>
                  <div className="ml-2 mt-2 border border-white/10 px-1 rounded-lg" />
                </div>
              </div>

              {isLoading ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Clock className="w-5 h-5 text-stone-700 animate-pulse" />
                  <p className="text-stone-600 text-xs">Loading schedules...</p>
                </div>
              ) : filteredSchedules.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Clock className="w-5 h-5 text-stone-700" />
                  <p className="text-stone-600 text-xs">
                    {scripts.length === 0
                      ? 'Add a script first before creating schedules.'
                      : selectedFolder
                        ? 'No schedules for scripts in this folder.'
                        : 'No schedules yet'}
                  </p>
                  {scripts.length > 0 && !selectedFolder && (
                    <button
                      onClick={() => setShowAdd(true)}
                      className="cursor-pointer mt-2 flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-stone-500 hover:text-stone-300 hover:border-white/20 hover:bg-white/5 transition-all duration-200 text-xs"
                    >
                      <Plus className="w-3 h-3" />
                      <span>Create your first schedule</span>
                    </button>
                  )}
                </div>
              ) : (
                <div className="p-4">
                  {filteredSchedules.map((s) => (
                    <div key={s.id}>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <label className="toggle">
                            <input type="checkbox" checked={s.enabled} onChange={() => handleToggle(s)} />
                            <span className="slider"></span>
                          </label>
                          <div>
                            <p className={`text-sm font-semibold ${s.enabled ? 'text-stone-300' : 'text-stone-600'}`}>
                              {s.name}
                            </p>
                            <p className="text-xs text-stone-500 italic">Script:</p>
                            <p className='font-bold text-xs text-stone-500'> {s.scriptName}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="border border-white/10 py-3 rounded-lg" />
                          <div className="ml-4 mr-4 text-xs flex items-center border border-white/10 backdrop-blur rounded-lg p-1 bg-black/40">
                            <div className="flex items-center gap-2 ml-2 mr-2">
                              <Clock className="w-3 h-3 text-stone-600" />
                              <code
                                className="text-xs font-mono text-stone-400 cursor-pointer hover:text-stone-200 transition-all duration-200"
                                onClick={() => handleEditCron(s)}
                              >
                                {s.cron}
                              </code>
                            </div>
                          </div>
                          <div className="border border-white/10 py-3 rounded-lg" />
                          <button
                            onClick={() => handleEditCron(s)}
                            className="cursor-pointer p-2 rounded-lg border border-white/10 text-stone-500 hover:text-stone-300 hover:border-white/20 hover:bg-white/5 transition-all duration-200"
                            title="Edit cron"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => handleDelete(s.id, s.name)}
                            className="cursor-pointer p-2 rounded-lg border border-white/10 text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all duration-200"
                            title="Delete schedule"
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

          {editingSchedule && (
          <Modal title="Edit Cron" onClose={() => setEditingSchedule(null)}>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-stone-500 mb-1">Schedule</label>
              <CronPicker value={editCron} onChange={setEditCron} />
            </div>
            {editError && <div className="text-red-400 text-xs mb-3">{editError}</div>}
            <button
              className="flex items-center gap-2 px-4 py-2 rounded-lg border border-green-800 text-stone-300 text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-green-600 hover:border-white/20 hover:text-stone-200"
              onClick={handleSaveEditCron}
            >
              Save
            </button>
          </Modal>
        )}

        {showAdd && (
          <Modal title="Add Schedule" onClose={() => setShowAdd(false)}>
            <form onSubmit={handleAdd}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-stone-500 mb-1">Schedule Name</label>
                <input name="name" placeholder="Daily cleanup" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-stone-500 mb-1">Script</label>
                <input type="hidden" name="scriptId" value={selectedScriptId} required />
                <div className="relative" ref={scriptDropdownRef}>
                  <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
                  <input
                    type="text"
                    value={scriptDropdownOpen ? scriptSearch : (scripts.find(s => s.id === selectedScriptId)?.name ?? '')}
                    onChange={(e) => {
                      setScriptSearch(e.target.value);
                      setSelectedScriptId('');
                      if (!scriptDropdownOpen) setScriptDropdownOpen(true);
                    }}
                    onFocus={() => {
                      setScriptDropdownOpen(true);
                      setScriptSearch('');
                    }}
                    placeholder="Search scripts..."
                    className={inputClass + ' !pl-8'}
                    autoComplete="off"
                  />
                  <svg className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                  </svg>
                  {scriptDropdownOpen && (
                    <div className="absolute z-50 mt-1 w-full rounded-lg border border-white/10 bg-[#1c1c1c] shadow-2xl max-h-48 overflow-y-auto custom-scrollbar">
                      {filteredScripts.length === 0 ? (
                        <div className="px-3 py-2 text-xs text-stone-600 font-mono">No scripts found</div>
                      ) : (
                        filteredScripts.map(s => (
                          <div
                            key={s.id}
                            onClick={() => {
                              setSelectedScriptId(s.id);
                              setScriptSearch(s.name);
                              setScriptDropdownOpen(false);
                            }}
                            className={`px-3 py-1.5 text-xs font-mono cursor-pointer transition-all duration-200 hover:bg-white/5 ${s.id === selectedScriptId ? 'text-stone-200' : 'text-stone-400 hover:text-stone-300'}`}
                          >
                            {s.name}
                          </div>
                        ))
                      )}
                    </div>
                  )}
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-stone-500 mb-1">Schedule</label>
                <CronPicker value={newCron} onChange={setNewCron} />
              </div>
              {error && <div className="text-red-400 text-xs mb-3">{error}</div>}
              <button
                type="submit"
                className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-lg border border-green-800 text-stone-300 text-xs font-medium cursor-pointer transition-all duration-200 hover:bg-green-600 hover:border-white/20 hover:text-stone-200"
              >
                Create Schedule
              </button>
            </form>
          </Modal>
        )}
        </div>
      </div>
    </div>
  );
}
