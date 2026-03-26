export interface Script {
  id: string;
  name: string;
  path: string;
  description: string;
  timeoutSeconds: number;
  createdAt: string;
}

export interface Schedule {
  id: string;
  scriptId: string;
  scriptName: string;
  name: string;
  cron: string;
  enabled: boolean;
  createdAt: string;
}

export interface HistoryEntry {
  id: string;
  scriptId: string;
  scriptName: string;
  triggeredBy: string;
  startTime: string;
  endTime: string | null;
  status: 'running' | 'success' | 'failed' | 'error';
  output: string;
  error: string;
  exitCode?: number;
}

export interface Stats {
  totalScripts: number;
  totalSchedules: number;
  activeSchedules: number;
  runs24h: number;
  successes24h: number;
  failures24h: number;
}

export type Page = 'dashboard' | 'scripts' | 'schedules' | 'history' | 'fat_fingers';
