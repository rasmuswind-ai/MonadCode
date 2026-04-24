import { useState, useEffect, useMemo, useRef } from 'react';
import { AreaChart, Area, CartesianGrid, Tooltip, YAxis } from 'recharts';
import { Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { api } from '../api';
import type { ChartDataPoint } from '../types';

const lines = [
  { key: 'failed' as const,  label: 'Failures',  color: '#ff6b7e' },
  { key: 'warning' as const, label: 'Warnings',  color: '#e0a94b' },
  { key: 'success' as const, label: 'Successes', color: '#4dd39a' },
];

export function Home() {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [visibleLines, setVisibleLines] = useState({ success: true, warning: true, failed: true });

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [chartDimensions, setChartDimensions] = useState({ width: 0, height: 0 });

  useEffect(() => {
    if (!chartContainerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width, height } = entry.contentRect;
        if (width > 0 && height > 0) {
          setChartDimensions({ width, height });
        }
      }
    });
    observer.observe(chartContainerRef.current);
    return () => observer.disconnect();
  }, []);

  useEffect(() => {
    api.getChartData()
      .then(setChartData)
      .finally(() => setIsLoading(false));
  }, []);

  const totals = useMemo(() => {
    return {
      runs: chartData.reduce((s, d) => s + d.success + d.warning + d.failed, 0),
      success: chartData.reduce((s, d) => s + d.success, 0),
      warning: chartData.reduce((s, d) => s + d.warning, 0),
      failed: chartData.reduce((s, d) => s + d.failed, 0),
    };
  }, [chartData]);

  const panels = [
    { label: 'Total Runs (42h)', value: totals.runs,    icon: Activity,       tone: 'default' as const },
    { label: 'Successes (42h)',  value: totals.success, icon: CheckCircle,    tone: 'ok' as const },
    { label: 'Warnings (42h)',   value: totals.warning, icon: AlertTriangle,  tone: 'warn' as const },
    { label: 'Failures (42h)',   value: totals.failed,  icon: XCircle,        tone: 'danger' as const },
  ];

  const toggleLine = (key: 'success' | 'warning' | 'failed') => {
    setVisibleLines((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const pillFor = (tone: 'default' | 'ok' | 'warn' | 'danger') => {
    switch (tone) {
      case 'ok':
        return 'bg-ok-soft text-ok-strong';
      case 'warn':
        return 'bg-warn-soft text-warn';
      case 'danger':
        return 'bg-danger-soft text-danger-strong';
      default:
        return 'bg-pill text-ink-2';
    }
  };

  return (
    <div className="flex flex-col gap-5 flex-1 min-h-0">
      {/* Stat panels */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 shrink-0">
        {panels.map((panel) => {
          const Icon = panel.icon;
          return (
            <div
              key={panel.label}
              className="bg-panel rounded-card shadow-card px-6 py-5 transition-transform hover:-translate-y-0.5"
            >
              <div className="flex justify-between items-center">
                <span className="text-muted text-[12.5px] font-medium">{panel.label}</span>
                <span
                  className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-medium ${pillFor(
                    panel.tone
                  )}`}
                >
                  live
                </span>
              </div>
              <div className="text-[34px] font-bold tracking-[-1px] mt-3.5 mb-1.5 text-ink tabular-nums">
                {isLoading ? '—' : panel.value.toLocaleString()}
              </div>
              <div className="flex items-center gap-1.5 text-[12px] text-ink-2">
                <Icon className="w-3 h-3" />
                <span>executions</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chart card */}
      <div className="bg-panel rounded-card shadow-card p-6 flex flex-col flex-1 min-h-[420px]">
        <div className="flex justify-between items-start mb-4 flex-wrap gap-3">
          <div>
            <h2 className="text-[17px] font-bold tracking-[-0.3px] text-ink">Activity</h2>
            <p className="text-muted text-[12.5px] mt-0.5">Executions across the last 42 hours</p>
          </div>
          <div className="flex items-center gap-2">
            {lines.map((line) => (
              <button
                key={line.key}
                type="button"
                onClick={() => toggleLine(line.key)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition-colors cursor-pointer ${
                  visibleLines[line.key]
                    ? 'border-line bg-panel text-ink-2'
                    : 'border-line bg-panel-soft text-muted'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: visibleLines[line.key] ? line.color : '#d7dae0' }}
                />
                {line.label}
              </button>
            ))}
          </div>
        </div>

        <div ref={chartContainerRef} className="flex-1 min-h-0 -ml-2">
          {isLoading ? (
            <p className="text-muted mt-28 text-center text-[13px]">Loading…</p>
          ) : (
            chartDimensions.width > 0 &&
            chartDimensions.height > 0 && (
              <AreaChart
                width={chartDimensions.width}
                height={chartDimensions.height}
                data={chartData}
                stackOffset="none"
              >
                <CartesianGrid
                  strokeDasharray=""
                  stroke="var(--chart-grid)"
                  horizontalCoordinatesGenerator={({ height }) => {
                    const step = 60;
                    const result: number[] = [];
                    for (let i = step; i < height; i += step) result.push(i);
                    return result;
                  }}
                  verticalCoordinatesGenerator={({ width }) => {
                    const step = 60;
                    const result: number[] = [];
                    for (let i = step; i < width; i += step) result.push(i);
                    return result;
                  }}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: 'var(--panel)',
                    border: '1px solid var(--line)',
                    borderRadius: '14px',
                    boxShadow: 'var(--shadow-card)',
                    fontSize: '12px',
                    color: 'var(--ink)',
                  }}
                  itemStyle={{ color: 'var(--ink-2)' }}
                  labelStyle={{ color: 'var(--muted)', marginBottom: 4 }}
                  cursor={{ stroke: 'var(--chart-axis)', strokeWidth: 1 }}
                  labelFormatter={(_, payload) => {
                    if (payload && payload.length > 0) {
                      const hour = (payload[0].payload as ChartDataPoint).hour;
                      const d = new Date(hour);
                      return d.toLocaleString(undefined, {
                        month: 'short',
                        day: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      });
                    }
                    return '';
                  }}
                />
                <defs>
                  {lines.map((line) => (
                    <linearGradient
                      key={line.key}
                      id={`gradient-${line.key}`}
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop offset="0%" stopColor={line.color} stopOpacity={0.35} />
                      <stop offset="100%" stopColor={line.color} stopOpacity={0} />
                    </linearGradient>
                  ))}
                </defs>
                {lines.map((line) => (
                  <Area
                    key={line.key}
                    type="monotone"
                    dataKey={line.key}
                    name={line.label}
                    stroke={visibleLines[line.key] ? line.color : 'transparent'}
                    strokeWidth={2.5}
                    fill={visibleLines[line.key] ? `url(#gradient-${line.key})` : 'transparent'}
                    dot={false}
                    connectNulls
                  />
                ))}
                <YAxis
                  tick={{ fill: 'var(--muted)', fontSize: 11 }}
                  axisLine={{ stroke: 'var(--chart-axis)' }}
                  tickLine={false}
                  allowDecimals={false}
                  domain={[0, (max: number) => Math.max(max, 5)]}
                  width={40}
                />
              </AreaChart>
            )
          )}
        </div>
      </div>
    </div>
  );
}
