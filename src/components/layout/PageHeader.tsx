import type { ReactNode } from 'react';

interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  action?: ReactNode;
}

export function PageHeader({ eyebrow, title, description, action }: PageHeaderProps) {
  return (
    <div className="mb-6 flex flex-col justify-between gap-4 md:flex-row md:items-end">
      <div className="max-w-3xl">
        {eyebrow ? (
          <p className="text-xs font-extrabold uppercase tracking-[0.2em] text-muted">{eyebrow}</p>
        ) : null}
        <h1 className="mt-2 text-2xl font-extrabold tracking-normal text-ink md:text-3xl">{title}</h1>
        {description ? <p className="mt-2 text-sm leading-6 text-muted md:text-base">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}
