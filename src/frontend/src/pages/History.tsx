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

  const load = () => { api.getHistory(100).then(setHistory); };
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
      (statusFilter === 'failed' ? (h.status === 'failed' || h.status === 'error') : h.status === statusFilter);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="lg:h-screen relative flex flex-col lg:overflow-hidden overflow-y-auto p-4">
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-white/50 opacity-25 rounded-full blur-[175px] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-pink-500 opacity-15 rounded-full blur-[200px] translate-y-1/3" />
      </div>

      <div className="relative flex-1 flex flex-col bg-black/70 border border-white/10 rounded-2xl p-6 shadow-2xl min-h-0 overflow-y-auto custom-scrollbar">
        <div className="shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="border border-white/10 ml-2 mr-2 py-4" />
              <h2 className="text-2xl font-bold bg-gradient-to-r from-stone-600 via-stone-400 to-stone-600 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                History
              </h2>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={load}
                className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/20 text-stone-400 hover:text-stone-300 hover:border-white/20 hover:bg-white/5 transition-all duration-200 text-xs"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh</span>
              </button>
              <button
                onClick={handleClear}
                disabled={history.length === 0}
                className="cursor-pointer flex items-center gap-2 px-3 py-1.5 rounded-lg border border-white/10 text-red-400 hover:border-red-500/30 hover:bg-red-500/10 transition-all duration-200 text-xs disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear</span>
              </button>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-col lg:flex-row gap-4 shrink-0">
          <div className="bg-white/5 border border-white/10 rounded-2xl p-2 shadow-2xl shrink-0">
            <div className="flex items-center gap-3 whitespace-nowrap">
              <HistoryIcon className="w-4 h-4 ml-2 text-stone-600" />
              <p className="text-stone-400 text-sm">Total executions:</p>
              <p className="mr-2 text-md font-bold text-gray-300">{history.length}</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-2 shadow-2xl shrink-0">
            <div className="flex items-center gap-3 whitespace-nowrap">
              <HistoryIcon className="w-4 h-4 ml-2 text-stone-600" />
              <p className="text-stone-400 text-sm">Successful:</p>
              <p className="mr-2 text-md font-bold text-green-400">{history.filter(h => h.status === 'success').length}</p>
            </div>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl p-2 shadow-2xl shrink-0">
            <div className="flex items-center gap-3 whitespace-nowrap">
              <HistoryIcon className="w-4 h-4 ml-2 text-stone-600" />
              <p className="text-stone-400 text-sm">Failed:</p>
              <p className="mr-2 text-md font-bold text-red-400">{history.filter(h => h.status === 'failed' || h.status === 'error').length}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex-1 min-h-0">
          <div className="bg-white/5 border border-white/10 backdrop-blur rounded-lg overflow-hidden flex flex-col h-full">
            <div className="shrink-0">
              <div className="flex items-center justify-between px-4 pt-3">
                <div className="ml-1">
                  <h2 className="text-stone-500">All Executions</h2>
                  <div className="mt-2 border border-white/10 px-1 rounded-lg" />
                </div>
                <div className="flex items-center gap-2">
                  <div className="relative">
                    <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-500" />
                    <input
                      type="text"
                      value={searchInput}
                      onChange={(e) => setSearchInput(e.target.value)}
                      placeholder="Search scripts..."
                      className="bg-black/40 border border-white/10 rounded-lg pl-8 pr-3 py-1.5 text-xs text-stone-300 placeholder-stone-600 focus:outline-none focus:border-stone-500/50 transition-colors font-mono w-48"
                    />
                  </div>
                  <div className="relative" ref={filterRef}>
                    <button
                      onClick={() => setShowFilterMenu((prev) => !prev)}
                      className={`cursor-pointer p-1.5 rounded-lg border transition-all duration-200 ${
                        statusFilter !== 'all'
                          ? 'border-stone-500/50 bg-white/10 text-stone-300'
                          : 'border-white/10 text-stone-600 hover:text-stone-400 hover:border-white/20'
                      }`}
                      title="Filter by status"
                    >
                      <Filter className="w-3.5 h-3.5" />
                    </button>
                    {showFilterMenu && (
                      <div className="absolute right-0 top-full mt-1 z-50 bg-[#1c1c1c] border border-white/10 rounded-lg overflow-hidden shadow-xl min-w-[120px]">
                        {([
                          { value: 'all', label: 'All' },
                          { value: 'success', label: 'Success' },
                          { value: 'failed', label: 'Failed' },
                          { value: 'running', label: 'Running' },
                        ] as { value: StatusFilter; label: string }[]).map((option) => (
                          <button
                            key={option.value}
                            onClick={() => {
                              setStatusFilter(option.value);
                              setShowFilterMenu(false);
                            }}
                            className={`w-full text-left px-3 py-1.5 text-xs transition-colors cursor-pointer ${
                              statusFilter === option.value
                                ? 'text-stone-200 bg-white/10'
                                : 'text-stone-500 hover:text-stone-300 hover:bg-white/5'
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
            </div>

            <div className="flex-1 overflow-y-auto custom-scrollbar min-h-0">
              {history.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <HistoryIcon className="w-5 h-5 text-stone-700" />
                  <p className="text-stone-600 text-xs">No execution history yet.</p>
                </div>
              ) : filteredHistory.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-12 gap-2">
                  <Search className="w-5 h-5 text-stone-700" />
                  <p className="text-stone-600 text-xs">No matching executions found.</p>
                </div>
              ) : (
                <div className="p-4">
                  {filteredHistory.map((h) => (
                    <div key={h.id}>
                      <div className="flex items-center justify-between py-2">
                        <div className="flex items-center gap-3">
                          <StatusBadge status={h.status} />
                          <div>
                            <p className="text-sm font-semibold text-stone-300">
                              {h.scriptName}
                            </p>
                            <p className="font-bold text-xs text-stone-500">
                              {h.triggeredBy === 'manual' ? 'Manual' : 'Scheduled'}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="border border-white/10 py-3 rounded-lg" />
                          <div className="ml-4 mr-4 text-xs flex items-center border border-white/10 backdrop-blur rounded-lg p-1 bg-black/40">
                            <div className="flex items-center gap-2 ml-2 mr-2">
                              <Clock className="w-3 h-3 text-stone-600" />
                              <span className="text-xs font-mono text-stone-400">
                                {new Date(h.startTime).toLocaleString()}
                              </span>
                            </div>
                          </div>
                          <div className="mr-4 text-xs flex items-center border border-white/10 backdrop-blur rounded-lg p-1 bg-black/40">
                            <div className="flex items-center gap-2 ml-2 mr-2">
                              <Hourglass className="w-3 h-3 text-stone-600" />
                              <span className="text-xs font-mono text-stone-400">
                                {h.endTime
                                  ? `${((new Date(h.endTime).getTime() - new Date(h.startTime).getTime()) / 1000).toFixed(1)}s`
                                  : '...'}
                              </span>
                            </div>
                          </div>
                          <div className="border border-white/10 py-3 rounded-lg" />
                          <button
                            onClick={() => setSelected(h)}
                            className="ml-3 cursor-pointer p-1 rounded-lg border border-white/10 text-stone-500 hover:text-stone-300 hover:border-white/20 hover:bg-white/5 transition-all duration-200"
                            title="View output"
                          >
                            <Terminal className="w-4 h-4"/>
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
        </div>

        {selected && (
          <Modal title={`${selected.scriptName} - ${selected.status}`} onClose={() => setSelected(null)}>
            <div className="mb-3 flex items-center gap-2">
              <StatusBadge status={selected.status} />
              {selected.exitCode !== undefined && (
                <span className="text-xs font-mono text-stone-500 ml-2">Exit code: {selected.exitCode}</span>
              )}
            </div>

            {selected.output && (
              <>
                <label className="text-xs font-semibold text-stone-500">Output</label>
                <pre className="mt-1 bg-white/5 border border-white/10 rounded-lg p-3 font-mono text-xs whitespace-pre-wrap break-all max-h-[400px] overflow-y-auto text-stone-400 custom-scrollbar">
                  {selected.output}
                </pre>
              </>
            )}

            {selected.error && (
              <div className="mt-3">
                <label className="text-xs font-semibold text-red-400">Errors</label>
                <pre className="mt-1 bg-red-500/5 border border-red-500/20 rounded-lg p-3 font-mono text-xs whitespace-pre-wrap break-all max-h-[400px] overflow-y-auto text-stone-400 custom-scrollbar">
                  {selected.error}
                </pre>
              </div>
            )}

            {!selected.output && !selected.error && (
              <div className="text-stone-600 text-xs font-mono">No output captured.</div>
            )}
          </Modal>
        )}
      </div>
    </div>
  );
}
