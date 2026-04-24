import { useEffect, useState } from 'react';
import { Settings as SettingsIcon, X, Loader2, Check, FolderOpen } from 'lucide-react';
import { api } from '../api';
import type { Settings } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const inputClass =
  'w-full bg-panel-soft border border-line rounded-card-sm px-3 py-2 text-[13px] text-ink placeholder-muted focus:outline-none focus:border-ink-2 transition-colors font-mono';

export function SettingsPanel({ open, onClose }: Props) {
  const [settings, setSettings] = useState<Settings | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [savedTick, setSavedTick] = useState(false);
  const [error, setError] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const s = await api.getSettings();
      setSettings({
        scriptsFolder: s.scriptsFolder ?? '',
        historyRetention: s.historyRetention ?? 500,
        defaultTimeoutSeconds: s.defaultTimeoutSeconds ?? 300,
        autoUpdateCheck: s.autoUpdateCheck !== false,
      });
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setError('');
      setSavedTick(false);
      load();
    }
  }, [open]);

  const save = async (patch: Partial<Settings>) => {
    if (!settings) return;
    const next = { ...settings, ...patch };
    setSettings(next);
    setSaving(true);
    setError('');
    try {
      await api.updateSettings(patch);
      setSavedTick(true);
      setTimeout(() => setSavedTick(false), 1500);
    } catch (err: any) {
      setError(err.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  return (
    <aside
      aria-hidden={!open}
      className={`shrink-0 overflow-hidden transition-[width] duration-300 ease-out ${
        open ? 'w-[340px]' : 'w-0'
      }`}
    >
      <div className="w-[340px] h-screen sticky top-0 pt-5 pb-10 pl-5">
        <div className="bg-panel border border-line rounded-card shadow-card h-full flex flex-col overflow-hidden">
          <header className="px-5 py-4 border-b border-line flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold tracking-[-0.2px] text-ink flex items-center gap-2">
                <SettingsIcon className="w-3.5 h-3.5 text-ink-2" />
                Settings
              </h2>
              <p className="text-muted text-[11.5px] mt-0.5 flex items-center gap-1.5">
                {saving ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" /> Saving…
                  </>
                ) : savedTick ? (
                  <>
                    <Check className="w-3 h-3 text-ok-strong" /> Saved
                  </>
                ) : (
                  'Changes save automatically'
                )}
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full border border-line text-ink-2 grid place-items-center hover:bg-panel-soft cursor-pointer transition-colors shrink-0"
              title="Close"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </header>

          <div className="flex-1 overflow-y-auto px-5 py-4 flex flex-col gap-5">
            {loading || !settings ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-4 h-4 animate-spin text-muted" />
              </div>
            ) : (
              <>
                <Field label="Scripts folder" hint="Root folder scanned on the Scripts page.">
                  <div className="flex items-center gap-2 px-3 py-2 rounded-card-sm bg-panel-soft border border-line">
                    <FolderOpen className="w-3.5 h-3.5 text-muted shrink-0" />
                    <span className="text-[12px] font-mono text-ink-2 truncate flex-1">
                      {settings.scriptsFolder || 'Not set'}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted mt-1">
                    Change via the Scripts page folder picker.
                  </p>
                </Field>

                <Field
                  label="History retention"
                  hint="Max executions kept in history (capped at 5000)."
                >
                  <input
                    type="number"
                    min={10}
                    max={5000}
                    className={inputClass}
                    value={settings.historyRetention ?? 500}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setSettings({ ...settings, historyRetention: Number.isFinite(v) ? v : 500 });
                    }}
                    onBlur={(e) => {
                      const raw = parseInt(e.target.value, 10);
                      const v = Math.max(10, Math.min(5000, Number.isFinite(raw) ? raw : 500));
                      save({ historyRetention: v });
                    }}
                  />
                </Field>

                <Field
                  label="Default timeout (seconds)"
                  hint="Used when adding a new script. 0 = no timeout."
                >
                  <input
                    type="number"
                    min={0}
                    max={86400}
                    className={inputClass}
                    value={settings.defaultTimeoutSeconds ?? 300}
                    onChange={(e) => {
                      const v = parseInt(e.target.value, 10);
                      setSettings({
                        ...settings,
                        defaultTimeoutSeconds: Number.isFinite(v) ? v : 300,
                      });
                    }}
                    onBlur={(e) => {
                      const raw = parseInt(e.target.value, 10);
                      const v = Math.max(0, Math.min(86400, Number.isFinite(raw) ? raw : 300));
                      save({ defaultTimeoutSeconds: v });
                    }}
                  />
                </Field>

                <Field
                  label="Automatic update check"
                  hint="Check monad-code.com for new versions on startup."
                >
                  <label className="flex items-center gap-3 cursor-pointer select-none">
                    <span className="toggle">
                      <input
                        type="checkbox"
                        checked={settings.autoUpdateCheck !== false}
                        onChange={(e) => save({ autoUpdateCheck: e.target.checked })}
                      />
                      <span className="slider"></span>
                    </span>
                    <span className="text-[12.5px] text-ink-2">
                      {settings.autoUpdateCheck !== false ? 'Enabled' : 'Disabled'}
                    </span>
                  </label>
                </Field>

                {error && <div className="text-danger-strong text-[12px]">{error}</div>}
              </>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.6px] mb-1.5">
        {label}
      </label>
      {children}
      {hint && <p className="text-[11px] text-muted mt-1">{hint}</p>}
    </div>
  );
}
