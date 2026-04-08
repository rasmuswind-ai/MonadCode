import type { Script, Schedule, HistoryEntry, Stats, ChartDataPoint, BrowseResult } from './types';

const BASE = '/api';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export const api = {
  // Stats
  getStats: () => request<Stats>('/stats'),

  // Scripts
  getScripts: () => request<Script[]>('/scripts'),
  createScript: (data: { name: string; path: string; description?: string; timeoutSeconds?: number }) =>
    request<Script>('/scripts', { method: 'POST', body: JSON.stringify(data) }),
  updateScript: (id: string, data: Partial<Script>) =>
    request<Script>(`/scripts/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteScript: (id: string) =>
    request<{ ok: boolean }>(`/scripts/${id}`, { method: 'DELETE' }),
  runScript: (id: string) =>
    request<HistoryEntry>(`/scripts/${id}/run`, { method: 'POST' }),
  getScriptContent: (id: string) =>
    request<{ content: string }>(`/scripts/${id}/content`),

  // Schedules
  getSchedules: () => request<Schedule[]>('/schedules'),
  createSchedule: (data: { scriptId: string; cron: string; name?: string; enabled?: boolean }) =>
    request<Schedule>('/schedules', { method: 'POST', body: JSON.stringify(data) }),
  updateSchedule: (id: string, data: Partial<Schedule>) =>
    request<Schedule>(`/schedules/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deleteSchedule: (id: string) =>
    request<{ ok: boolean }>(`/schedules/${id}`, { method: 'DELETE' }),

  // History
  getHistory: (limit = 50, scriptId?: string) => {
    const params = new URLSearchParams({ limit: String(limit) });
    if (scriptId) params.set('scriptId', scriptId);
    return request<HistoryEntry[]>(`/history?${params}`);
  },
  clearHistory: () =>
    request<{ ok: boolean }>('/history', { method: 'DELETE' }),

  // Chart
  getChartData: () => request<ChartDataPoint[]>('/history/chart'),

  // Browse filesystem
  browse: (dirPath?: string) => {
    const params = dirPath ? `?path=${encodeURIComponent(dirPath)}` : '';
    return request<BrowseResult>(`/browse${params}`);
  },
};
