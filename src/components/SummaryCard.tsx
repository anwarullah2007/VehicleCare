import type { ReactNode } from 'react';

interface SummaryCardProps {
  label: string;
  value: string | number;
  helperText?: string;
  icon?: ReactNode;
  onClick?: () => void;
}

export function SummaryCard({
  label,
  value,
  helperText,
  icon,
  onClick,
}: SummaryCardProps) {
  const baseClasses =
    'flex flex-col justify-between rounded-xl border border-slate-200 bg-white p-5 shadow-xs transition-colors';

  if (onClick) {
    return (
      <button
        type="button"
        onClick={onClick}
        className={`${baseClasses} w-full text-left hover:border-blue-300 hover:bg-blue-50/30 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600`}
      >
        <div className="flex items-center justify-between gap-3">
          <span className="text-sm font-medium text-slate-600">{label}</span>
          {icon ? (
            <span className="rounded-lg bg-slate-100 p-2 text-slate-700">
              {icon}
            </span>
          ) : null}
        </div>
        <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
          {value}
        </div>
        {helperText ? (
          <p className="mt-1 text-xs text-slate-500">{helperText}</p>
        ) : null}
      </button>
    );
  }

  return (
    <div className={baseClasses}>
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-600">{label}</span>
        {icon ? (
          <span className="rounded-lg bg-slate-100 p-2 text-slate-700">
            {icon}
          </span>
        ) : null}
      </div>
      <div className="mt-3 text-3xl font-bold tracking-tight text-slate-900">
        {value}
      </div>
      {helperText ? (
        <p className="mt-1 text-xs text-slate-500">{helperText}</p>
      ) : null}
    </div>
  );
}
