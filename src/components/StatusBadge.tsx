import type { StatusLabel } from '@/types/domain';

interface StatusBadgeProps {
  status: StatusLabel;
}

const STATUS_STYLES: Record<
  StatusLabel,
  { classes: string; symbol: string }
> = {
  Active: {
    classes: 'border-emerald-200 bg-emerald-50 text-emerald-800',
    symbol: '●',
  },
  Upcoming: {
    classes: 'border-sky-200 bg-sky-50 text-sky-800',
    symbol: '◷',
  },
  'Due soon': {
    classes: 'border-amber-300 bg-amber-50 text-amber-900',
    symbol: '▲',
  },
  'Due today': {
    classes: 'border-orange-300 bg-orange-50 text-orange-900',
    symbol: '◆',
  },
  Overdue: {
    classes: 'border-rose-300 bg-rose-50 text-rose-900',
    symbol: '!',
  },
  'Warranty expired': {
    classes: 'border-slate-300 bg-slate-100 text-slate-700',
    symbol: '✕',
  },
  'Estimated replacement date passed': {
    classes: 'border-purple-200 bg-purple-50 text-purple-900',
    symbol: '◷',
  },
  Replaced: {
    classes: 'border-slate-200 bg-slate-100 text-slate-700',
    symbol: '↻',
  },
  Removed: {
    classes: 'border-slate-200 bg-slate-100 text-slate-600',
    symbol: '—',
  },
};

export function StatusBadge({ status }: StatusBadgeProps) {
  const style = STATUS_STYLES[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-xs font-medium ${style.classes}`}
    >
      <span aria-hidden="true" className="text-[10px] leading-none">
        {style.symbol}
      </span>
      <span>{status}</span>
    </span>
  );
}
