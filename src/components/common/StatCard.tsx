import type { ReactNode } from 'react';

interface StatCardProps {
  label: string;
  value: string;
  detail: string;
  icon: ReactNode;
  tone?: 'indigo' | 'green' | 'amber' | 'red' | 'ink';
}

const toneClass = {
  indigo: 'bg-indigo-50 text-primary',
  green: 'bg-emerald-50 text-success',
  amber: 'bg-amber-50 text-warning',
  red: 'bg-red-50 text-danger',
  ink: 'bg-slate-100 text-ink',
};

export function StatCard({ label, value, detail, icon, tone = 'indigo' }: StatCardProps) {
  return (
    <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-panel">
      <div className="flex items-start justify-between gap-4">
        <div>
          <p className="text-sm font-semibold text-muted">{label}</p>
          <p className="mt-2 text-2xl font-extrabold text-ink">{value}</p>
        </div>
        <div className={`flex h-11 w-11 items-center justify-center rounded-lg ${toneClass[tone]}`}>
          {icon}
        </div>
      </div>
      <p className="mt-4 text-sm font-medium text-muted">{detail}</p>
    </section>
  );
}
