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

export interface ChartDataPoint {
  hour: string;
  success: number;
  warning: number;
  failed: number;
}

export interface BrowseEntry {
  name: string;
  path: string;
}

export interface BrowseResult {
  current: string;
  parent: string | null;
  directories: BrowseEntry[];
  files: BrowseEntry[];
  quickAccess: BrowseEntry[];
}

export interface Settings {
  scriptsFolder?: string;
}

export interface TreeEntry {
  name: string;
  path: string;
  type: 'directory';
  children?: TreeEntry[];
}

export type Page = 'dashboard' | 'scripts' | 'schedules' | 'history' | 'fat_fingers';
