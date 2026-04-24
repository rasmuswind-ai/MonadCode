import { useEffect, useMemo, useRef, useState } from 'react';
import { Search, Play, FileCode, Loader2 } from 'lucide-react';
import { api } from '../api';
import type { Script } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: Props) {
  const [scripts, setScripts] = useState<Script[]>([]);
  const [query, setQuery] = useState('');
  const [index, setIndex] = useState(0);
  const [running, setRunning] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ name: string; kind: 'ok' | 'err' } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load scripts whenever the palette opens; also refocus the input.
  useEffect(() => {
    if (!open) {
      setQuery('');
      setIndex(0);
      setFeedback(null);
      return;
    }
    api.getScripts().then(setScripts).catch(() => setScripts([]));
    setTimeout(() => inputRef.current?.focus(), 0);
  }, [open]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return scripts.slice(0, 50);
    return scripts
      .filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          s.path.toLowerCase().includes(q)
      )
      .slice(0, 50);
  }, [scripts, query]);

  useEffect(() => {
    if (index >= filtered.length) setIndex(Math.max(0, filtered.length - 1));
  }, [filtered.length, index]);

  const handleKey = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setIndex((i) => Math.min(filtered.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setIndex((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filtered[index];
      if (target) runScript(target);
    } else if (e.key === 'Escape') {
      e.preventDefault();
      onClose();
    }
  };

  const runScript = async (s: Script) => {
    setRunning(s.id);
    setFeedback(null);
    try {
      await api.runScript(s.id);
      setFeedback({ name: s.name, kind: 'ok' });
      setTimeout(onClose, 600);
    } catch (err: any) {
      setFeedback({ name: err?.message || 'Failed to run', kind: 'err' });
    } finally {
      setRunning(null);
    }
  };

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 bg-black/40 dark:bg-black/60 z-50 flex items-start justify-center pt-[14vh] backdrop-blur-sm"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-panel border border-line rounded-card shadow-card w-[90%] max-w-[560px] overflow-hidden">
        <div className="relative border-b border-line">
          <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-muted pointer-events-none" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setIndex(0);
            }}
            onKeyDown={handleKey}
            placeholder="Search scripts to run…"
            className="w-full bg-transparent pl-11 pr-4 py-3.5 text-[14px] text-ink placeholder-muted focus:outline-none"
          />
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="px-4 py-10 text-center text-muted text-[13px]">
              {scripts.length === 0 ? 'No scripts registered yet.' : 'No matches.'}
            </div>
          ) : (
            <div className="py-1">
              {filtered.map((s, i) => {
                const active = i === index;
                const isRunning = running === s.id;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onMouseEnter={() => setIndex(i)}
                    onClick={() => runScript(s)}
                    className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors cursor-pointer ${
                      active ? 'bg-panel-soft' : ''
                    }`}
                  >
                    <div className="w-7 h-7 rounded-full bg-panel-soft border border-line grid place-items-center shrink-0">
                      <FileCode className="w-3 h-3 text-ink-2" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-semibold text-ink truncate">{s.name}</p>
                      <p className="text-[11.5px] text-muted font-mono truncate">{s.path}</p>
                    </div>
                    <span
                      className={`w-7 h-7 rounded-full border grid place-items-center transition-colors ${
                        active
                          ? 'border-ink bg-ink text-on-ink'
                          : 'border-line text-muted'
                      }`}
                    >
                      {isRunning ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : (
                        <Play className="w-3 h-3" />
                      )}
                    </span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="px-4 py-2 border-t border-line bg-panel-soft flex items-center justify-between text-[11px] text-muted">
          {feedback ? (
            <span
              className={
                feedback.kind === 'ok' ? 'text-ok-strong font-medium' : 'text-danger-strong font-medium'
              }
            >
              {feedback.kind === 'ok' ? `Started: ${feedback.name}` : feedback.name}
            </span>
          ) : (
            <span>
              <kbd className="px-1.5 py-0.5 rounded border border-line bg-panel text-ink-2 font-mono">↑</kbd>{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-line bg-panel text-ink-2 font-mono">↓</kbd>{' '}
              navigate ·{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-line bg-panel text-ink-2 font-mono">↵</kbd>{' '}
              run ·{' '}
              <kbd className="px-1.5 py-0.5 rounded border border-line bg-panel text-ink-2 font-mono">esc</kbd>{' '}
              close
            </span>
          )}
          <span className="font-mono">
            <kbd className="px-1.5 py-0.5 rounded border border-line bg-panel text-ink-2">Ctrl</kbd>+
            <kbd className="px-1.5 py-0.5 rounded border border-line bg-panel text-ink-2">K</kbd>
          </span>
        </div>
      </div>
    </div>
  );
}
