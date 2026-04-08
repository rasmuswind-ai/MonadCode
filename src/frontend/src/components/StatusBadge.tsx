interface StatusBadgeProps {
  status: string;
}

const classMap: Record<string, string> = {
  success: 'bg-green-500/10 text-green-400 border-green-500/20',
  failed: 'bg-red-500/10 text-red-400 border-red-500/20',
  error: 'bg-red-500/10 text-red-400 border-red-500/20',
  running: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
};

export function StatusBadge({ status }: StatusBadgeProps) {
  return (
    <span className={`inline-block px-2.5 py-0.5 rounded-full text-[11px] font-mono border ${classMap[status] || 'bg-white/5 text-stone-500 border-white/10'}`}>
      {status}
    </span>
  );
}
