import { useEffect, useRef, useState } from 'react';
import { Terminal, X, Pause, Play, Trash2, ArrowDown } from 'lucide-react';
import { api } from '../api';
import type { LogEntry } from '../types';

interface Props {
  open: boolean;
  onClose: () => void;
}

const POLL_MS = 1500;

const LEVEL_STYLES: Record<LogEntry['level'], { dot: string; text: string }> = {
  info: { dot: 'bg-info', text: 'text-ink-2' },
  warn: { dot: 'bg-warn', text: 'text-warn' },
  error: { dot: 'bg-danger-strong', text: 'text-danger-strong' },
};

function formatTime(iso: string): string {
  const d = new Date(iso);
  return (
    String(d.getHours()).padStart(2, '0') +
    ':' +
    String(d.getMinutes()).padStart(2, '0') +
    ':' +
    String(d.getSeconds()).padStart(2, '0')
  );
}

export function LogsPanel({ open, onClose }: Props) {
  const [entries, setEntries] = useState<LogEntry[]>([]);
  const [paused, setPaused] = useState(false);
  const [autoScroll, setAutoScroll] = useState(true);
  const cursorRef = useRef(0);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open || paused) return;

    let cancelled = false;
    const tick = async () => {
      try {
        const res = await api.getLogs(cursorRef.current);
        if (cancelled) return;
        if (res.entries.length > 0) {
          cursorRef.current = res.cursor;
          setEntries((prev) => {
            const merged = [...prev, ...res.entries];
            // Keep at most 1000 entries on the client (matches server cap)
            return merged.length > 1000 ? merged.slice(-1000) : merged;
          });
        }
      } catch {
        /* network hiccup — try again next tick */
      }
    };

    tick();
    const id = window.setInterval(tick, POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [open, paused]);

  // Auto-scroll to bottom on new entries (unless the user scrolled up)
  useEffect(() => {
    if (!autoScroll || !listRef.current) return;
    listRef.current.scrollTop = listRef.current.scrollHeight;
  }, [entries, autoScroll]);

  // Detect user scroll-up to disable auto-scroll; re-enable when near bottom
  const onScroll = () => {
    const el = listRef.current;
    if (!el) return;
    const atBottom = el.scrollHeight - el.scrollTop - el.clientHeight < 30;
    setAutoScroll(atBottom);
  };

  const handleClear = async () => {
    try {
      await api.clearLogs();
      setEntries([]);
      cursorRef.current = 0;
    } catch {
      /* ignore */
    }
  };

  const scrollToBottom = () => {
    const el = listRef.current;
    if (!el) return;
    el.scrollTop = el.scrollHeight;
    setAutoScroll(true);
  };

  return (
    <aside
      aria-hidden={!open}
      className={`shrink-0 overflow-hidden transition-[width] duration-300 ease-out ${
        open ? 'w-[420px]' : 'w-0'
      }`}
    >
      <div className="w-[420px] h-screen sticky top-0 pt-5 pb-10 pl-5">
        <div className="bg-panel border border-line rounded-card shadow-card h-full flex flex-col overflow-hidden">
          <header className="px-5 py-4 border-b border-line flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h2 className="text-[15px] font-bold tracking-[-0.2px] text-ink flex items-center gap-2">
                <Terminal className="w-3.5 h-3.5 text-ink-2" />
                Daemon logs
              </h2>
              <p className="text-muted text-[11.5px] mt-0.5">
                {paused ? 'Paused' : `Tailing · ${entries.length} line${entries.length === 1 ? '' : 's'}`}
              </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setPaused((p) => !p)}
                className="w-8 h-8 rounded-full border border-line text-ink-2 grid place-items-center hover:bg-panel-soft cursor-pointer transition-colors"
                title={paused ? 'Resume' : 'Pause'}
              >
                {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <button
                type="button"
                onClick={handleClear}
                className="w-8 h-8 rounded-full border border-line text-danger-strong grid place-items-center hover:border-danger hover:bg-danger-soft cursor-pointer transition-colors"
                title="Clear"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-8 h-8 rounded-full border border-line text-ink-2 grid place-items-center hover:bg-panel-soft cursor-pointer transition-colors"
                title="Close"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </header>

          <div
            ref={listRef}
            onScroll={onScroll}
            className="flex-1 overflow-y-auto font-mono text-[11.5px] bg-panel-soft"
          >
            {entries.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-10 gap-2 px-5 text-center">
                <Terminal className="w-5 h-5 text-muted" />
                <p className="text-muted text-[12px]">No log output yet.</p>
              </div>
            ) : (
              <div className="py-2">
                {entries.map((e) => {
                  const style = LEVEL_STYLES[e.level];
                  return (
                    <div
                      key={e.id}
                      className={`grid grid-cols-[auto_auto_1fr] gap-2 px-4 py-1 hover:bg-panel transition-colors ${style.text}`}
                    >
                      <span className="text-muted tabular-nums">{formatTime(e.timestamp)}</span>
                      <span className="flex items-center">
                        <span className={`w-1.5 h-1.5 rounded-full ${style.dot}`} />
                      </span>
                      <span className="whitespace-pre-wrap break-all">{e.message}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {!autoScroll && entries.length > 0 && (
            <button
              type="button"
              onClick={scrollToBottom}
              className="cursor-pointer absolute bottom-14 right-6 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-ink text-on-ink text-[12px] font-medium shadow-card hover:brightness-110 transition-all"
            >
              <ArrowDown className="w-3 h-3" />
              Jump to latest
            </button>
          )}
        </div>
      </div>
    </aside>
  );
}
