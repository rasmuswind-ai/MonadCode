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
  RefreshCw,
  ChevronDown,
} from 'lucide-react';

const inputClass =
  'w-full bg-panel-soft border border-line rounded-card-sm px-3 py-2 text-[13px] text-ink placeholder-muted focus:outline-none focus:border-ink-2 transition-colors font-mono';

const dropDownClass = inputClass + ' cursor-pointer';

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
    case 'every-minutes':
      return `*/${Math.max(1, Math.min(59, p.interval))} * * * *`;
    case 'every-hours':
      return `0 */${Math.max(1, Math.min(23, p.interval))} * * *`;
    case 'daily':
      return `${p.minute} ${p.hour} * * *`;
    case 'weekly':
      return `${p.minute} ${p.hour} * * ${p.dayOfWeek}`;
    case 'custom':
      return p.raw;
  }
}

function parseCron(cron: string): CronPreset {
  const defaults: CronPreset = {
    frequency: 'custom',
    interval: 5,
    hour: 9,
    minute: 0,
    dayOfWeek: 1,
    raw: cron,
  };
  const parts = cron.trim().split(/\s+/);
  if (parts.length !== 5) return defaults;
  const [m, h, dom, mon, dow] = parts;

  if (/^\*\/\d+$/.test(m) && h === '*' && dom === '*' && mon === '*' && dow === '*') {
    return { ...defaults, frequency: 'every-minutes', interval: parseInt(m.slice(2)) };
  }
  if (m === '0' && /^\*\/\d+$/.test(h) && dom === '*' && mon === '*' && dow === '*') {
    return { ...defaults, frequency: 'every-hours', interval: parseInt(h.slice(2)) };
  }
  if (/^\d+$/.test(m) && /^\d+$/.test(h) && dom === '*' && mon === '*' && /^\d+$/.test(dow)) {
    return {
      ...defaults,
      frequency: 'weekly',
      minute: parseInt(m),
      hour: parseInt(h),
      dayOfWeek: parseInt(dow),
    };
  }
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
        onChange={(e) => update({ frequency: e.target.value as Frequency })}
      >
        <option value="every-minutes">Every N minutes</option>
        <option value="every-hours">Every N hours</option>
        <option value="daily">Daily at time</option>
        <option value="weekly">Weekly on day at time</option>
        <option value="custom">Custom cron</option>
      </select>

      {preset.frequency === 'every-minutes' && (
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted">Every</span>
          <input
            type="number"
            min={1}
            max={59}
            className={inputClass + ' !w-20'}
            value={preset.interval}
            onChange={(e) => update({ interval: parseInt(e.target.value) || 1 })}
          />
          <span className="text-[12px] text-muted">minutes</span>
        </div>
      )}

      {preset.frequency === 'every-hours' && (
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted">Every</span>
          <input
            type="number"
            min={1}
            max={23}
            className={inputClass + ' !w-20'}
            value={preset.interval}
            onChange={(e) => update({ interval: parseInt(e.target.value) || 1 })}
          />
          <span className="text-[12px] text-muted">hours</span>
        </div>
      )}

      {preset.frequency === 'daily' && (
        <div className="flex items-center gap-2">
          <span className="text-[12px] text-muted">At</span>
          <input
            type="time"
            className={inputClass + ' !w-36'}
            value={timeValue}
            onChange={(e) => handleTimeChange(e.target.value)}
          />
        </div>
      )}

      {preset.frequency === 'weekly' && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[12px] text-muted">On</span>
          <select
            className={inputClass + ' !w-36'}
            value={preset.dayOfWeek}
            onChange={(e) => update({ dayOfWeek: parseInt(e.target.value) })}
          >
            {DAYS.map((d, i) => (
              <option key={i} value={i}>
                {d}
              </option>
            ))}
          </select>
          <span className="text-[12px] text-muted">at</span>
          <input
            type="time"
            className={inputClass + ' !w-36'}
            value={timeValue}
            onChange={(e) => handleTimeChange(e.target.value)}
          />
        </div>
      )}

      {preset.frequency === 'custom' && (
        <input
          className={inputClass}
          placeholder="*/5 * * * *"
          value={preset.raw}
          onChange={(e) => update({ raw: e.target.value })}
        />
      )}

      <div className="text-[11.5px] text-muted font-mono">Cron: {buildCron(preset)}</div>
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

  const filteredScripts = scripts.filter((s) =>
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
    await Promise.all([api.getSchedules().then(setSchedules), api.getScripts().then(setScripts)]);
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

  const filteredSchedules = selectedFolder
    ? schedules.filter((s) => {
        const script = scripts.find((sc) => sc.id === s.scriptId);
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

  const activeCount = filteredSchedules.filter((s) => s.enabled).length;
  const disabledCount = filteredSchedules.filter((s) => !s.enabled).length;

  return (
    <div className="flex flex-col gap-5 flex-1 min-h-0">
      <div className="flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.8px] text-ink">Schedules</h1>
          <p className="text-muted text-[12.5px] mt-0.5">
            {filteredSchedules.length} schedule{filteredSchedules.length === 1 ? '' : 's'} ·{' '}
            <span className="text-ok-strong">{activeCount} active</span> ·{' '}
            <span>{disabledCount} disabled</span>
          </p>
        </div>
        <button
          type="button"
          onClick={() => setShowAdd(true)}
          className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-on-ink text-[13px] font-medium hover:brightness-110 transition-all"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Create Schedule</span>
        </button>
      </div>

      <div className="bg-panel rounded-card shadow-card flex flex-1 min-h-0 overflow-hidden">
        {/* Left sidebar — folder tree */}
        {scriptsFolder && (
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
          </div>
        )}

        {/* Right content — schedule list */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
          <div className="px-6 py-4 border-b border-line flex items-center justify-between shrink-0">
            <h2 className="text-[15px] font-bold tracking-[-0.2px] text-ink">
              {selectedFolder ? selectedFolder.split(/[/\\]/).pop() : 'All Schedules'}
            </h2>
            <span className="inline-flex items-center px-2.5 py-1 rounded-full bg-pill text-ink-2 text-[11px] font-medium">
              {filteredSchedules.length}
            </span>
          </div>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 flex-1">
              <Clock className="w-5 h-5 text-muted animate-pulse" />
              <p className="text-muted text-[13px]">Loading schedules…</p>
            </div>
          ) : filteredSchedules.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3 flex-1">
              <Clock className="w-6 h-6 text-muted" />
              <p className="text-muted text-[13px]">
                {scripts.length === 0
                  ? 'Add a script first before creating schedules.'
                  : selectedFolder
                  ? 'No schedules for scripts in this folder.'
                  : 'No schedules yet'}
              </p>
              {scripts.length > 0 && !selectedFolder && (
                <button
                  type="button"
                  onClick={() => setShowAdd(true)}
                  className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full border border-line text-ink-2 hover:bg-panel-soft hover:text-ink transition-colors text-[12px]"
                >
                  <Plus className="w-3 h-3" />
                  <span>Create your first schedule</span>
                </button>
              )}
            </div>
          ) : (
            <div>
              {filteredSchedules.map((s) => (
                <div
                  key={s.id}
                  className="flex items-center justify-between gap-4 px-6 py-4 border-b border-line last:border-0 hover:bg-panel-soft transition-colors"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <label className="toggle shrink-0">
                      <input type="checkbox" checked={s.enabled} onChange={() => handleToggle(s)} />
                      <span className="slider"></span>
                    </label>
                    <div className="min-w-0">
                      <p
                        className={`text-[13.5px] font-semibold truncate ${
                          s.enabled ? 'text-ink' : 'text-muted'
                        }`}
                      >
                        {s.name}
                      </p>
                      <p className="text-[11.5px] text-muted truncate">
                        <span className="italic">Script:</span>{' '}
                        <span className="font-semibold">{s.scriptName}</span>
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      type="button"
                      onClick={() => handleEditCron(s)}
                      className="cursor-pointer inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pill text-ink-2 text-[11px] font-medium hover:bg-panel-soft transition-colors font-mono"
                      title="Edit cron"
                    >
                      <Clock className="w-3 h-3" />
                      {s.cron}
                    </button>

                    <div className="flex items-center gap-1.5">
                      <button
                        type="button"
                        onClick={() => handleEditCron(s)}
                        className="cursor-pointer w-8 h-8 rounded-full border border-line text-ink-2 grid place-items-center hover:bg-panel-soft hover:text-ink transition-colors"
                        title="Edit cron"
                      >
                        <Pencil className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDelete(s.id, s.name)}
                        className="cursor-pointer w-8 h-8 rounded-full border border-line text-danger-strong grid place-items-center hover:border-danger hover:bg-danger-soft transition-colors"
                        title="Delete schedule"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {editingSchedule && (
        <Modal title="Edit Cron" onClose={() => setEditingSchedule(null)}>
          <div className="mb-4">
            <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.6px] mb-1.5">
              Schedule
            </label>
            <CronPicker value={editCron} onChange={setEditCron} />
          </div>
          {editError && <div className="text-danger-strong text-[12px] mb-3">{editError}</div>}
          <button
            type="button"
            className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-on-ink text-[13px] font-medium hover:brightness-110 transition-all"
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
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.6px] mb-1.5">
                Schedule Name
              </label>
              <input name="name" placeholder="Daily cleanup" className={inputClass} />
            </div>
            <div className="mb-4">
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.6px] mb-1.5">
                Script
              </label>
              <input type="hidden" name="scriptId" value={selectedScriptId} required />
              <div className="relative" ref={scriptDropdownRef}>
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
                <input
                  type="text"
                  value={
                    scriptDropdownOpen
                      ? scriptSearch
                      : scripts.find((s) => s.id === selectedScriptId)?.name ?? ''
                  }
                  onChange={(e) => {
                    setScriptSearch(e.target.value);
                    setSelectedScriptId('');
                    if (!scriptDropdownOpen) setScriptDropdownOpen(true);
                  }}
                  onFocus={() => {
                    setScriptDropdownOpen(true);
                    setScriptSearch('');
                  }}
                  placeholder="Search scripts…"
                  className={inputClass + ' !pl-8'}
                  autoComplete="off"
                />
                <ChevronDown className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted" />
                {scriptDropdownOpen && (
                  <div className="absolute z-50 mt-1 w-full rounded-card-sm border border-line bg-panel shadow-card max-h-48 overflow-y-auto">
                    {filteredScripts.length === 0 ? (
                      <div className="px-3 py-2 text-[12px] text-muted font-mono">
                        No scripts found
                      </div>
                    ) : (
                      filteredScripts.map((s) => (
                        <div
                          key={s.id}
                          onClick={() => {
                            setSelectedScriptId(s.id);
                            setScriptSearch(s.name);
                            setScriptDropdownOpen(false);
                          }}
                          className={`px-3 py-2 text-[12px] font-mono cursor-pointer transition-colors hover:bg-panel-soft ${
                            s.id === selectedScriptId ? 'text-ink' : 'text-ink-2 hover:text-ink'
                          }`}
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
              <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.6px] mb-1.5">
                Schedule
              </label>
              <CronPicker value={newCron} onChange={setNewCron} />
            </div>
            {error && <div className="text-danger-strong text-[12px] mb-3">{error}</div>}
            <button
              type="submit"
              className="cursor-pointer flex items-center gap-2 px-4 py-2 rounded-full bg-ink text-on-ink text-[13px] font-medium hover:brightness-110 transition-all"
            >
              Create Schedule
            </button>
          </form>
        </Modal>
      )}
    </div>
  );
}
