import { useEffect, useState } from 'react';
import { KeyRound, Plus, Trash2, X, Loader2, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import { api } from '../api';
import type { SecretEntry } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const inputClass =
  'w-full bg-panel-soft border border-line rounded-card-sm px-3 py-2 text-[13px] text-ink placeholder-muted focus:outline-none focus:border-ink-2 transition-colors font-mono';

const NAME_RE = /^[A-Za-z_][A-Za-z0-9_]*$/;

function formatAge(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60_000) return 'just now';
  if (diff < 3_600_000) return `${Math.floor(diff / 60_000)}m ago`;
  if (diff < 86_400_000) return `${Math.floor(diff / 3_600_000)}h ago`;
  return `${Math.floor(diff / 86_400_000)}d ago`;
}

export function SecretsPanel({ open, onClose }: Props) {
  const [secrets, setSecrets] = useState<SecretEntry[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [name, setName] = useState('');
  const [value, setValue] = useState('');
  const [reveal, setReveal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const refresh = async () => {
    setLoading(true);
    try {
      const list = await api.listSecrets();
      setSecrets(list);
    } catch (err: any) {
      setError(err.message || 'Failed to load secrets');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (open) {
      setError('');
      refresh();
    } else {
      // Reset "add" form whenever the panel closes
      setAddOpen(false);
      setName('');
      setValue('');
      setReveal(false);
      setError('');
    }
  }, [open]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!NAME_RE.test(name)) {
      setError('Name must start with a letter or _ and contain only letters, digits, and _');
      return;
    }
    if (value.length === 0) {
      setError('Value cannot be empty');
      return;
    }
    setSaving(true);
    try {
      await api.setSecret(name, value);
      setName('');
      setValue('');
      setReveal(false);
      setAddOpen(false);
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to save secret');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (secretName: string) => {
    if (!confirm(`Delete secret "${secretName}"? This cannot be undone.`)) return;
    try {
      await api.deleteSecret(secretName);
      await refresh();
    } catch (err: any) {
      setError(err.message || 'Failed to delete secret');
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
                <KeyRound className="w-3.5 h-3.5 text-ink-2" />
                Secrets
              </h2>
              <p className="text-muted text-[11.5px] mt-0.5">
                Encrypted with Windows DPAPI · use as{' '}
                <span className="font-mono text-ink-2">$Secret.Name</span>
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

          <div className="px-5 py-3 border-b border-line shrink-0">
            {!addOpen ? (
              <button
                type="button"
                onClick={() => {
                  setError('');
                  setAddOpen(true);
                }}
                className="cursor-pointer w-full flex items-center justify-center gap-2 px-3 py-2 rounded-full bg-ink text-on-ink text-[13px] font-medium hover:brightness-110 transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add secret
              </button>
            ) : (
              <form onSubmit={handleSave} className="space-y-2">
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.6px] mb-1">
                    Name
                  </label>
                  <input
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="ApiKey"
                    className={inputClass}
                    autoFocus
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-semibold text-muted uppercase tracking-[0.6px] mb-1">
                    Value
                  </label>
                  <div className="relative">
                    <input
                      type={reveal ? 'text' : 'password'}
                      value={value}
                      onChange={(e) => setValue(e.target.value)}
                      placeholder="Paste secret value"
                      className={inputClass + ' !pr-9'}
                    />
                    <button
                      type="button"
                      onClick={() => setReveal((r) => !r)}
                      className="cursor-pointer absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 rounded-full text-muted hover:text-ink hover:bg-panel-soft grid place-items-center transition-colors"
                      title={reveal ? 'Hide' : 'Show'}
                      tabIndex={-1}
                    >
                      {reveal ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-muted mt-1">
                    Once saved, the value is unrecoverable from the UI.
                  </p>
                </div>
                {error && <div className="text-danger-strong text-[11.5px]">{error}</div>}
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="submit"
                    disabled={saving}
                    className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-full bg-ink text-on-ink text-[12px] font-medium hover:brightness-110 transition-all disabled:opacity-50"
                  >
                    {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <ShieldCheck className="w-3 h-3" />}
                    Save
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setAddOpen(false);
                      setName('');
                      setValue('');
                      setReveal(false);
                      setError('');
                    }}
                    className="cursor-pointer px-3 py-1.5 rounded-full border border-line text-ink-2 text-[12px] font-medium hover:bg-panel-soft hover:text-ink transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {loading && secrets === null ? (
              <div className="flex items-center justify-center py-10">
                <Loader2 className="w-4 h-4 animate-spin text-muted" />
              </div>
            ) : !secrets || secrets.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 px-5 text-center">
                <KeyRound className="w-5 h-5 text-muted" />
                <p className="text-muted text-[12px]">No secrets yet.</p>
                <p className="text-muted text-[11px]">
                  Add one above, then reference it in scripts as{' '}
                  <span className="font-mono text-ink-2">$Secret.Name</span>.
                </p>
              </div>
            ) : (
              <div className="px-3 py-2 flex flex-col gap-1">
                {secrets.map((s) => (
                  <div
                    key={s.name}
                    className="group flex items-center gap-3 px-3 py-2 rounded-card-sm hover:bg-panel-soft transition-colors"
                  >
                    <div className="w-7 h-7 rounded-full bg-panel-soft border border-line grid place-items-center shrink-0 group-hover:bg-panel">
                      <KeyRound className="w-3 h-3 text-ink-2" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-mono text-[12.5px] text-ink truncate">{s.name}</p>
                      <p className="text-muted text-[11px]">added {formatAge(s.createdAt)}</p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDelete(s.name)}
                      className="cursor-pointer w-7 h-7 rounded-full border border-line text-danger-strong grid place-items-center hover:border-danger hover:bg-danger-soft transition-colors opacity-0 group-hover:opacity-100"
                      title="Delete"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
