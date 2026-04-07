import { useEffect, useState } from 'react';
import { api } from '../api';
import { Modal } from '../components/Modal';
import type { Schedule, Script } from '../types';

const tdClass = 'px-4 py-3 text-sm border-b border-border align-middle';
const btnBase = 'cursor-pointer ml-auto sm:ml-2 px-2.5 py-1 text-[11px] rounded bg-stone-900 border border-stone-800 text-stone-100 tracking-wider hover:bg-stone-800 hover:text-stone-100 transition-colors disabled:opacity-40';
const btnDanger = 'cursor-pointer ml-auto sm:ml-2 px-2.5 py-1 text-[11px] rounded bg-red-900 border border-stone-800 hover:border-red-400 text-stone-100 tracking-wider hover:bg-red-800 hover:text-stone-100 transition-colors disabled:opacity-40';
const btnPrimary = 'inline-flex items-center gap-1.5 px-4 py-2 rounded-md bg-primary border border-primary text-black text-sm font-medium cursor-pointer transition-all hover:bg-primary-hover hover:border-primary-hover disabled:opacity-50 disabled:cursor-not-allowed';
const inputClass = 'w-full px-3 py-2 rounded-md border border-border bg-bg text-text text-sm font-sans outline-none transition-colors focus:border-primary';

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
        className={inputClass}
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
          <span className="text-sm text-dim">Every</span>
          <input
            type="number" min={1} max={59}
            className={inputClass + ' !w-20'}
            value={preset.interval}
            onChange={e => update({ interval: parseInt(e.target.value) || 1 })}
          />
          <span className="text-sm text-dim">minutes</span>
        </div>
      )}

      {preset.frequency === 'every-hours' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-dim">Every</span>
          <input
            type="number" min={1} max={23}
            className={inputClass + ' !w-20'}
            value={preset.interval}
            onChange={e => update({ interval: parseInt(e.target.value) || 1 })}
          />
          <span className="text-sm text-dim">hours</span>
        </div>
      )}

      {preset.frequency === 'daily' && (
        <div className="flex items-center gap-2">
          <span className="text-sm text-dim">At</span>
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
          <span className="text-sm text-dim">On</span>
          <select
            className={inputClass + ' !w-36'}
            value={preset.dayOfWeek}
            onChange={e => update({ dayOfWeek: parseInt(e.target.value) })}
          >
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}
          </select>
          <span className="text-sm text-dim">at</span>
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

      <div className="text-xs text-dim font-mono">Cron: {buildCron(preset)}</div>
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
    <>
    <div className="h-full sm:h-[100dvh] sm:flex-1 sm:min-h-0 relative overflow-hidden flex flex-col p-4 pb-4">
      <div className="fixed inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900 -z-10">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-orange-800 opacity-25 rounded-full blur-[175px] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-orange-800 opacity-15 rounded-full blur-[200px] translate-y-1/3" />
      </div>

      <div className="relative flex-1 flex flex-col bg-black/50 border border-white/10 rounded-2xl p-4 sm:p-6 shadow-2xl min-h-0 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="flex items-center gap-2 mr-auto">
            <h2 className="ml-2 sm:ml-4 text-xl sm:text-2xl font-bold bg-gradient-to-r from-stone-600 via-stone-400 to-stone-600 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
              SCHEDULES
            </h2>
          </div>
          <div className="flex items-center gap-3 text-[11px] text-stone-400 ml-2 sm:ml-0">
            <button
              onClick={() => setShowAdd(true)}
              className="cursor-pointer ml-auto sm:ml-2 px-2.5 py-1 text-[11px] rounded bg-stone-900 border border-stone-800 text-stone-400 tracking-wider hover:bg-stone-800 hover:text-stone-300 transition-colors disabled:opacity-40"
            >
              + Create Schedule
            </button>
          </div>
        </div>

        <div className="mt-4 border-t border-white/10" />

        <div className="mt-6 border border-stone-800 rounded-lg backdrop-blur-md bg-stone-900/30 overflow-y-auto custom-scrollbar">
          <div className="bg-surface rounded-[10px] overflow-hidden">
            {isLoading ? (
              <div className="text-center py-12 text-dim">Loading...</div>
            ) : schedules.length === 0 ? (
              <div className="text-center py-12 text-dim">
                {scripts.length === 0 ? (
                  <p>Add a script first before creating schedules.</p>
                ) : (
                  <>
                    <p className="mb-4">No schedules yet.</p>
                    <button className={btnPrimary} onClick={() => setShowAdd(true)}>
                      Create your first schedule
                    </button>
                  </>
                )}
              </div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Enabled', 'Name', 'Script', 'Cron', 'Actions'].map(h => (
                    <th key={h} className="text-left px-4 py-3 uppercase text-[11px] tracking-wide transition-colors bg-stone-400 text-stone-700">{h}</th>
                  ))}
                  </tr>
                </thead>
                <tbody>
                  {schedules.map(s => (
                    <tr key={s.id} className="hover:bg-primary/[0.04]">
                      <td className={tdClass}>
                        <label className="toggle">
                          <input type="checkbox" checked={s.enabled} onChange={() => handleToggle(s)} />
                          <span className="slider"></span>
                        </label>
                      </td>
                      <td className={tdClass}>{s.name}</td>
                      <td className={`${tdClass} text-dim`}>{s.scriptName}</td>
                      <td className={tdClass}>
                        <code
                          className="font-mono text-xs cursor-pointer hover:text-primary transition-colors"
                          onClick={() => handleEditCron(s)}
                        >
                          {s.cron}
                        </code>
                      </td>
                      <td className={tdClass}>
                        <div className="flex gap-1.5">
                          <button className={btnBase} onClick={() => handleEditCron(s)}>Edit Cron</button>
                          <button className={btnDanger} onClick={() => handleDelete(s.id, s.name)}>Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {editingSchedule && (
          <Modal title="Edit Cron" onClose={() => setEditingSchedule(null)}>
            <div className="mb-4">
              <label className="block text-xs font-semibold text-dim mb-1">Schedule</label>
              <CronPicker value={editCron} onChange={setEditCron} />
            </div>
            {editError && <div className="text-danger text-sm mb-3">{editError}</div>}
            <button className={btnPrimary} onClick={handleSaveEditCron}>Save</button>
          </Modal>
        )}

        {showAdd && (
          <Modal title="Add Schedule" onClose={() => setShowAdd(false)}>
            <form onSubmit={handleAdd}>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-dim mb-1">Schedule Name</label>
                <input name="name" placeholder="Daily cleanup" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-dim mb-1">Script</label>
                <select name="scriptId" required className={inputClass}>
                  <option value="">Select a script...</option>
                  {scripts.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-xs font-semibold text-dim mb-1">Schedule</label>
                <CronPicker value={newCron} onChange={setNewCron} />
              </div>
              {error && <div className="text-danger text-sm mb-3">{error}</div>}
              <button type="submit" className={btnPrimary}>Create Schedule</button>
            </form>
          </Modal>
        )}
        </div>
      </div>
    </>
  );
}
