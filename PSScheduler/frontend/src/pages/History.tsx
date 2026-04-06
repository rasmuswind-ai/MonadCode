import { useEffect, useState } from 'react';
import { api } from '../api';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import type { HistoryEntry } from '../types';

const tdClass = 'px-4 py-3 text-sm border-b border-border align-middle';
const btnBase = 'cursor-pointer ml-auto sm:ml-2 px-2.5 py-1 text-[11px] rounded bg-stone-900 border border-stone-800 text-stone-100 tracking-wider hover:bg-stone-800 hover:text-stone-100 transition-colors disabled:opacity-40';
const btnDanger = 'cursor-pointer ml-auto sm:ml-2 px-2.5 py-1 text-[11px] rounded bg-red-900 border border-stone-800 hover:border-red-400 text-stone-100 tracking-wider hover:bg-red-800 hover:text-stone-100 transition-colors disabled:opacity-40';

export function History() {
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [selected, setSelected] = useState<HistoryEntry | null>(null);

  const load = () => { api.getHistory(100).then(setHistory); };
  useEffect(load, []);

  const handleClear = async () => {
    if (!confirm('Clear all execution history?')) return;
    await api.clearHistory();
    load();
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
                HISTORY
              </h2>
            </div>
            <div className="flex items-center gap-3 text-[11px] text-stone-400 ml-2 sm:ml-0">
              <button className={btnBase} onClick={load}>Refresh</button>
              <button className={btnDanger} onClick={handleClear} disabled={history.length === 0}>Clear</button>
            </div>
          </div>

          <div className="mt-4 border-t border-white/10" />

          <div className="mt-6 border border-stone-800 rounded-lg backdrop-blur-md bg-stone-900/30 overflow-y-auto custom-scrollbar">
            {history.length === 0 ? (
              <div className="text-center py-12 text-dim">No execution history yet.</div>
            ) : (
              <table className="w-full border-collapse">
                <thead>
                  <tr>
                    {['Script', 'Status', 'Trigger', 'Started', 'Duration', ''].map((h) => (
                  <th key={h} className="text-left px-4 py-3 uppercase text-[11px] tracking-wide transition-colors bg-stone-400 text-stone-700">{h}</th>
                ))}
                  </tr>
                </thead>
                <tbody>
                  {history.map(h => (
                    <tr key={h.id} className="hover:bg-primary/[0.04]">
                      <td className={tdClass}>{h.scriptName}</td>
                      <td className={tdClass}><StatusBadge status={h.status} /></td>
                      <td className={`${tdClass} text-dim text-xs`}>
                        {h.triggeredBy === 'manual' ? 'Manual' : 'Scheduled'}
                      </td>
                      <td className={`${tdClass} text-dim`}>{new Date(h.startTime).toLocaleString()}</td>
                      <td className={`${tdClass} text-dim font-mono text-xs`}>
                        {h.endTime
                          ? `${((new Date(h.endTime).getTime() - new Date(h.startTime).getTime()) / 1000).toFixed(1)}s`
                          : '...'}
                      </td>
                      <td className={tdClass}>
                        <button className={btnBase} onClick={() => setSelected(h)}>Output</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {selected && (
            <Modal title={`${selected.scriptName} - ${selected.status}`} onClose={() => setSelected(null)}>
              <div className="mb-3">
                <StatusBadge status={selected.status} />
                {selected.exitCode !== undefined && (
                  <span className="text-dim text-sm ml-2">Exit code: {selected.exitCode}</span>
                )}
              </div>

              {selected.output && (
                <>
                  <label className="text-xs font-semibold text-dim">Output</label>
                  <pre className="mt-1 bg-bg border border-border rounded-md p-3 font-mono text-xs whitespace-pre-wrap break-all max-h-[400px] overflow-y-auto text-dim">
                    {selected.output}
                  </pre>
                </>
              )}

              {selected.error && (
                <div className="mt-3">
                  <label className="text-xs font-semibold text-danger">Errors</label>
                  <pre className="mt-1 bg-bg border border-danger rounded-md p-3 font-mono text-xs whitespace-pre-wrap break-all max-h-[400px] overflow-y-auto text-dim">
                    {selected.error}
                  </pre>
                </div>
              )}

              {!selected.output && !selected.error && (
                <div className="text-dim">No output captured.</div>
              )}
            </Modal>
          )}
        </div>
      </div>
    </>
  );
}
