interface StatusBadgeProps {
  status: string;
}

const classMap: Record<string, string> = {
  success: 'bg-ok-soft text-ok-strong',
  failed: 'bg-danger-soft text-danger-strong',
  error: 'bg-danger-soft text-danger-strong',
  running: 'bg-pill text-ink-2',
};

const dotMap: Record<string, string> = {
  success: 'bg-ok-strong',
  failed: 'bg-danger-strong',
  error: 'bg-danger-strong',
  running: 'bg-info',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const pill = classMap[status] || 'bg-pill text-ink-2';
  const dot = dotMap[status] || 'bg-muted';
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${pill}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot} ${status === 'running' ? 'animate-pulse' : ''}`} />
      {status}
    </span>
  );
}
