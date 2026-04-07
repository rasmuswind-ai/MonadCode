import { useState, useEffect, useMemo, useRef } from 'react';
import { AreaChart, Area, CartesianGrid, Tooltip, YAxis } from 'recharts';
import { Activity, CheckCircle, AlertTriangle, XCircle } from 'lucide-react';
import { api } from '../api';
import type { ChartDataPoint } from '../types';

const lines = [
  { key: 'failed' as const, label: 'Failures', color: '#ef4444', gradientColor: '#dc2626' },
  { key: 'warning' as const, label: 'Warnings', color: '#eab308', gradientColor: '#ca8a04' },
  { key: 'success' as const, label: 'Successes', color: '#22c55e', gradientColor: '#16a34a' },
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
    { label: 'Total Runs (42h)', value: totals.runs, color: '#a78bfa', icon: Activity },
    { label: 'Successes (42h)', value: totals.success, color: '#22c55e', icon: CheckCircle },
    { label: 'Warnings (42h)', value: totals.warning, color: '#eab308', icon: AlertTriangle },
    { label: 'Failures (42h)', value: totals.failed, color: '#ef4444', icon: XCircle },
  ];

  const toggleLine = (key: 'success' | 'warning' | 'failed') => {
    setVisibleLines(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="h-screen relative overflow-hidden flex flex-col p-4">
      {/* Background gradient blobs */}
      <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-black to-gray-900">
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-white/50 opacity-25 rounded-full blur-[175px] -translate-x-1/3 -translate-y-1/3" />
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-pink-500 opacity-15 rounded-full blur-[200px] translate-y-1/3" />
      </div>

      {/* Main glassmorphism container */}
      <div className="relative flex-1 flex flex-col bg-black/50 border border-white/10 rounded-2xl p-6 shadow-2xl min-h-0">
        <div className="flex-1 flex flex-col min-h-0">

          {/* Stat panels */}
          <div className="flex flex-col md:flex-row gap-4 shrink-0">
            {panels.map((panel) => (
              <div
                key={panel.label}
                className="flex-1 bg-white/5 border border-white/10 rounded-lg p-4 shadow-2xl hover:bg-white/[0.08] transition-colors"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: panel.color }} />
                  <h1 className="text-md font-semibold bg-gradient-to-r from-stone-500 via-stone-300 to-stone-500 bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]">
                    {panel.label}
                  </h1>
                </div>
                <div className="flex flex-wrap gap-3">
                  <div className="bg-white/5 border border-white/10 rounded-xl p-2 shrink-0">
                    <div className="flex items-center gap-2 whitespace-nowrap">
                      <panel.icon className="w-3 h-3 text-stone-600" />
                      <p className="text-stone-400 text-xs">Count:</p>
                      <span
                        className="text-xs font-semibold inline-block bg-clip-text text-transparent animate-shimmer bg-[length:200%_100%]"
                        style={{
                          backgroundImage: `linear-gradient(to right, ${panel.color}, ${panel.color}dd, ${panel.color})`,
                        }}
                      >
                        {isLoading ? '...' : panel.value.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Toggle buttons */}
          <div className="flex items-center gap-3 mt-5 shrink-0">
            {lines.map((line) => (
              <button
                key={line.key}
                onClick={() => toggleLine(line.key)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs transition-all duration-200 cursor-pointer ${
                  visibleLines[line.key]
                    ? 'border-white/15 bg-white/[0.08] text-stone-300'
                    : 'border-white/5 bg-transparent text-stone-600'
                }`}
              >
                <div
                  className={`w-2 h-2 rounded-full transition-opacity ${
                    visibleLines[line.key] ? 'opacity-100' : 'opacity-30'
                  }`}
                  style={{ backgroundColor: line.color }}
                />
                {line.label}
              </button>
            ))}
          </div>

          {/* Chart */}
          <div ref={chartContainerRef} className="flex-1 flex flex-col mt-4 min-h-0">
            {isLoading ? (
              <p className="text-gray-400 mt-28 text-center">Loading...</p>
            ) : (
              <div className="flex-1 min-h-0 p-4 -ml-6">
                {chartDimensions.width > 0 && chartDimensions.height > 0 && (
                  <AreaChart
                    width={chartDimensions.width}
                    height={chartDimensions.height}
                    data={chartData}
                    stackOffset="none"
                  >
                    <CartesianGrid
                      strokeDasharray=""
                      stroke="rgba(255,255,255,0.05)"
                      horizontalCoordinatesGenerator={({ height }) => {
                        const step = 60;
                        const result = [];
                        for (let i = step; i < height; i += step) result.push(i);
                        return result;
                      }}
                      verticalCoordinatesGenerator={({ width }) => {
                        const step = 60;
                        const result = [];
                        for (let i = step; i < width; i += step) result.push(i);
                        return result;
                      }}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'rgba(0,0,0,0.8)',
                        border: '1px solid rgba(255,255,255,0.1)',
                        borderRadius: '8px',
                        fontSize: '12px',
                      }}
                      itemStyle={{ color: '#a8a29e' }}
                      labelStyle={{ color: '#78716c' }}
                      labelFormatter={(_, payload) => {
                        if (payload && payload.length > 0) {
                          const hour = (payload[0].payload as ChartDataPoint).hour;
                          const d = new Date(hour);
                          return d.toLocaleString(undefined, {
                            month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
                          });
                        }
                        return '';
                      }}
                    />
                    <defs>
                      {lines.map((line) => (
                        <linearGradient key={line.key} id={`gradient-${line.key}`} x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor={line.gradientColor} stopOpacity={0.4} />
                          <stop offset="100%" stopColor={line.gradientColor} stopOpacity={0.05} />
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
                      tick={{ fill: '#78716c', fontSize: 11 }}
                      axisLine={{ stroke: 'rgba(255,255,255,0.05)' }}
                      tickLine={false}
                      allowDecimals={false}
                      domain={[0, (max: number) => Math.max(max, 5)]}
                      width={40}
                    />
                  </AreaChart>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
