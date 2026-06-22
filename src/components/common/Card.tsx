import type { ReactNode } from 'react';

interface CardProps {
  title?: string;
  eyebrow?: string;
  action?: ReactNode;
  children: ReactNode;
  className?: string;
}

export function Card({ title, eyebrow, action, children, className = '' }: CardProps) {
  return (
    <section className={`rounded-xl border border-slate-200 bg-white shadow-panel ${className}`}>
      {(title || eyebrow || action) && (
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 px-5 py-4">
          <div>
            {eyebrow ? (
              <p className="text-xs font-bold uppercase tracking-[0.18em] text-muted">{eyebrow}</p>
            ) : null}
            {title ? <h2 className="mt-1 text-base font-bold text-ink">{title}</h2> : null}
          </div>
          {action}
        </div>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}
