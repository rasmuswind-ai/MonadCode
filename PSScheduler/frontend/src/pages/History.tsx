import { useEffect, useState } from 'react';
import { api } from '../api';
import { Modal } from '../components/Modal';
import { StatusBadge } from '../components/StatusBadge';
import type { HistoryEntry } from '../types';

const thClass = 'text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-dim bg-surface2 border-b border-border';
const tdClass = 'px-4 py-3 text-sm border-b border-border align-middle';
const btnBase = 'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md border border-border bg-surface2 text-text text-sm font-medium cursor-pointer transition-all hover:border-primary hover:text-primary';
const btnDanger = 'inline-flex items-center gap-1.5 px-4 py-2 rounded-md border border-danger text-danger text-sm font-medium cursor-pointer transition-all hover:bg-danger hover:text-white disabled:opacity-50 disabled:cursor-not-allowed';

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
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <h2 className="text-xl font-semibold flex-1 mb-0">Execution History</h2>
        <button className={btnBase} onClick={load}>Refresh</button>
        <button className={btnDanger} onClick={handleClear} disabled={history.length === 0}>Clear</button>
      </div>

      <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
        {history.length === 0 ? (
          <div className="text-center py-12 text-dim">No execution history yet.</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Script', 'Status', 'Trigger', 'Started', 'Duration', ''].map((h, i) => (
                  <th key={i} className={thClass}>{h}</th>
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
    </>
  );
}
