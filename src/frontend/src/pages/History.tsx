import { useEffect, useRef, useState } from 'react';
import { api } from '../api';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import type { HistoryEntry } from '../types';
import {
  History as HistoryIcon,
  RefreshCw,
  Trash2,
  Terminal,
  Clock,
  Hourglass,
  Search,
  Filter,
} from 'lucide-react';

type StatusFilter = 'all' | 'success' | 'failed' | 'running';

export function History() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selected, setSelected] = useState<HistoryEntry | null>(null);
  const [searchInput, setSearchInput] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [showFilterMenu, setShowFilterMenu] = useState(false);
  const filterRef = useRef<HTMLDivElement>(null);

  const load = () => {
    api.getHistory(100).then(setHistory);
  };
  useEffect(load, []);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (filterRef.current && !filterRef.current.contains(e.target as Node)) {
        setShowFilterMenu(false);
      }
    }
    if (showFilterMenu) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [showFilterMenu]);

  const handleClear = async () => {
    if (!confirm('Clear all execution history?')) return;
    await api.clearHistory();
    load();
  };

  const filteredHistory = history.filter((h) => {
    const matchesSearch = h.scriptName.toLowerCase().includes(searchInput.toLowerCase());
    const matchesStatus =
      statusFilter === 'all' ||
      (statusFilter === 'failed'
        ? h.status === 'failed' || h.status === 'error'
        : h.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  const successCount = history.filter((h) => h.status === 'success').length;
  const failCount = history.filter((h) => h.status === 'failed' || h.status === 'error').length;

  return (
    <div className="flex flex-col gap-5 flex-1 min-h-0">
      <div className="flex items-center justify-between flex-wrap gap-3 shrink-0">
        <div>
          <h1 className="text-[32px] font-bold tracking-[-0.8px] text-ink">History</h1>
          <p className="text-muted text-[12.5px] mt-0.5">
            {history.length} execution{history.length === 1 ? '' : 's'} ·{' '}
            <span className="text-ok-strong">{successCount} successful</span> ·{' '}
            <span className="text-danger-strong">{failCount} failed</span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={load}
            className="cursor-pointer flex items-center gap-2 px-3.5 py-2 rounded-full border border-line text-ink-2 hover:bg-panel-soft hover:text-ink transition-colors text-[12.5px]"
          >
            <RefreshCw className="w-3.5 h-3.5" />
            <span>Refresh</span>
          </button>
          <button
            type="button"
            onClick={handleClear}
            disabled={history.length === 0}
            className="cursor-pointer flex items-center gap-2 px-3.5 py-2 rounded-full border border-line text-danger-strong hover:border-danger hover:bg-danger-soft transition-colors text-[12.5px] disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear</span>
          </button>
        </div>
      </div>

      <div className="bg-panel rounded-card shadow-card flex flex-col flex-1 min-h-0 overflow-hidden">
        <div className="px-6 py-4 border-b border-line flex items-center justify-between gap-3 shrink-0 flex-wrap">
          <h2 className="text-[15px] font-bold tracking-[-0.2px] text-ink">All Executions</h2>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
              <input
                type="text"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder="Search scripts…"
                className="bg-panel-soft border border-line rounded-full pl-8 pr-3 py-1.5 text-[12.5px] text-ink placeholder-muted focus:outline-none focus:border-ink-2 transition-colors font-mono w-56"
              />
            </div>
            <div className="relative" ref={filterRef}>
              <button
                type="button"
                onClick={() => setShowFilterMenu((prev) => !prev)}
                className={`cursor-pointer w-8 h-8 rounded-full border grid place-items-center transition-colors ${
                  statusFilter !== 'all'
                    ? 'border-ink bg-ink text-on-ink'
                    : 'border-line text-ink-2 hover:bg-panel-soft'
                }`}
                title="Filter by status"
              >
                <Filter className="w-3.5 h-3.5" />
              </button>
              {showFilterMenu && (
                <div className="absolute right-0 top-full mt-1 z-50 bg-panel border border-line rounded-card-sm overflow-hidden shadow-card min-w-[140px]">
                  {(
                    [
                      { value: 'all', label: 'All' },
                      { value: 'success', label: 'Success' },
                      { value: 'failed', label: 'Failed' },
                      { value: 'running', label: 'Running' },
                    ] as { value: StatusFilter; label: string }[]
                  ).map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setStatusFilter(option.value);
                        setShowFilterMenu(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-[12px] transition-colors cursor-pointer ${
                        statusFilter === option.value
                          ? 'text-ink bg-panel-soft font-medium'
                          : 'text-ink-2 hover:text-ink hover:bg-panel-soft'
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto min-h-0">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <HistoryIcon className="w-6 h-6 text-muted" />
              <p className="text-muted text-[13px]">No execution history yet.</p>
            </div>
          ) : filteredHistory.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 gap-3">
              <Search className="w-6 h-6 text-muted" />
              <p className="text-muted text-[13px]">No matching executions found.</p>
            </div>
          ) : (
            <div>
              {filteredHistory.map((h) => (
                <div
                  key={h.id}
                  className="grid grid-cols-12 gap-3 px-6 py-4 items-center border-b border-line last:border-0 hover:bg-panel-soft transition-colors"
                >
                  <div className="col-span-1 flex items-center">
                    <StatusBadge status={h.status} />
                  </div>

                  <div className="col-span-4 min-w-0">
                    <p className="text-[13.5px] font-semibold text-ink truncate">{h.scriptName}</p>
                    <p className="text-[11.5px] text-muted">
                      {h.triggeredBy === 'manual' ? 'Manual' : 'Scheduled'}
                    </p>
                  </div>

                  <div className="col-span-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pill text-ink-2 text-[11px] font-medium font-mono">
                      <Clock className="w-3 h-3" />
                      {new Date(h.startTime).toLocaleString()}
                    </span>
                  </div>

                  <div className="col-span-2">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pill text-ink-2 text-[11px] font-medium font-mono">
                      <Hourglass className="w-3 h-3" />
                      {h.endTime
                        ? `${((new Date(h.endTime).getTime() - new Date(h.startTime).getTime()) / 1000).toFixed(1)}s`
                        : '…'}
                    </span>
                  </div>

                  <div className="col-span-2 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => setSelected(h)}
                      className="cursor-pointer w-8 h-8 rounded-full border border-line text-ink-2 grid place-items-center hover:bg-panel-soft hover:text-ink transition-colors"
                      title="View output"
                    >
                      <Terminal className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {selected && (
        <Modal title={`${selected.scriptName} — ${selected.status}`} onClose={() => setSelected(null)}>
          <div className="mb-3 flex items-center gap-2">
            <StatusBadge status={selected.status} />
            {selected.exitCode !== undefined && (
              <span className="text-[11.5px] font-mono text-muted">
                Exit code: {selected.exitCode}
              </span>
            )}
          </div>

          {selected.output && (
            <>
              <label className="text-[11px] font-semibold text-muted uppercase tracking-[0.6px]">
                Output
              </label>
              <pre className="mt-1 bg-panel-soft border border-line rounded-card-sm p-3 font-mono text-[12px] whitespace-pre-wrap break-all max-h-[400px] overflow-y-auto text-ink-2">
                {selected.output}
              </pre>
            </>
          )}

          {selected.error && (
            <div className="mt-3">
              <label className="text-[11px] font-semibold text-danger-strong uppercase tracking-[0.6px]">
                Errors
              </label>
              <pre className="mt-1 bg-danger-soft border border-danger/40 rounded-card-sm p-3 font-mono text-[12px] whitespace-pre-wrap break-all max-h-[400px] overflow-y-auto text-ink-2">
                {selected.error}
              </pre>
            </div>
          )}

          {!selected.output && !selected.error && (
            <div className="text-muted text-[12px] font-mono">No output captured.</div>
          )}
        </Modal>
      )}
    </div>
  );
}
