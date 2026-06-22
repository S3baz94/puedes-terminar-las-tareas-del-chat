type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'primary';

interface StatusPillProps {
  children: string;
  tone?: StatusTone;
}

const toneClass: Record<StatusTone, string> = {
  neutral: 'bg-slate-100 text-slate-700',
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-red-50 text-red-700',
  primary: 'bg-indigo-50 text-indigo-700',
};

export function StatusPill({ children, tone = 'neutral' }: StatusPillProps) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold ${toneClass[tone]}`}>
      {children}
    </span>
  );
}
