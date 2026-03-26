import { useEffect, useState } from 'react';
import { api } from '../api';
import { StatusBadge } from '../components/StatusBadge';
import type { Stats, HistoryEntry } from '../types';

function StatCard({ label, value, color }: { label: string; value: string | number; color?: string }) {
  const colorClass = color === 'primary' ? 'text-primary'
    : color === 'success' ? 'text-success'
    : color === 'danger' ? 'text-danger'
    : 'text-text';

  return (
    <div className="bg-surface border border-border rounded-[10px] p-5">
      <div className="text-xs text-dim uppercase tracking-wide">{label}</div>
      <div className={`text-3xl font-bold mt-1 ${colorClass}`}>{value}</div>
    </div>

    
  );
}

export function Dashboard() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [recent, setRecent] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    api.getStats().then(setStats);
    api.getHistory(10).then(setRecent);
  }, []);

  return (
    <>
      <h2 className="text-xl font-semibold mb-4">Dashboard</h2>

      <div className="grid grid-cols-[repeat(auto-fit,minmax(160px,1fr))] gap-4 mb-6">
        <StatCard label="Scripts" value={stats?.totalScripts ?? '-'} color="primary" />
        <StatCard label="Active Schedules" value={stats?.activeSchedules ?? '-'} color="primary" />
        <StatCard label="Runs (24h)" value={stats?.runs24h ?? '-'} />
        <StatCard label="Successes (24h)" value={stats?.successes24h ?? '-'} color="success" />
        <StatCard label="Failures (24h)" value={stats?.failures24h ?? '-'} color="danger" />
      </div>

      <h2 className="text-xl font-semibold mb-4">Recent Runs</h2>
      <div className="bg-surface border border-border rounded-[10px] overflow-hidden">
        {recent.length === 0 ? (
          <div className="text-center py-12 text-dim">No recent runs</div>
        ) : (
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-dim bg-surface2 border-b border-border">Script</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-dim bg-surface2 border-b border-border">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-dim bg-surface2 border-b border-border">Started</th>
                <th className="text-left px-4 py-3 text-xs font-semibold uppercase tracking-wide text-dim bg-surface2 border-b border-border">Duration</th>
              </tr>
            </thead>
            <tbody>
              {recent.map(h => (
                <tr key={h.id} className="hover:bg-primary/[0.04]">
                  <td className="px-4 py-3 text-sm border-b border-border last:border-b-0">{h.scriptName}</td>
                  <td className="px-4 py-3 text-sm border-b border-border last:border-b-0"><StatusBadge status={h.status} /></td>
                  <td className="px-4 py-3 text-sm border-b border-border last:border-b-0 text-dim">{new Date(h.startTime).toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm border-b border-border last:border-b-0 text-dim font-mono text-xs">
                    {h.endTime
                      ? `${((new Date(h.endTime).getTime() - new Date(h.startTime).getTime()) / 1000).toFixed(1)}s`
                      : '...'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </>
  );
}
