interface StatusBadgeProps {
  status: string;
}

const classMap: Record<string, string> = {
  success: 'bg-success/15 text-success',
  failed: 'bg-danger/15 text-danger',
  error: 'bg-danger/15 text-danger',
  running: 'bg-primary/15 text-primary',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-semibold ${classMap[status] || 'bg-surface2 text-dim'}`}>
      {status}
    </span>
  );
}
