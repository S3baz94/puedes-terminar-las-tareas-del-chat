import type { ReactNode } from 'react';
import { Inbox } from 'lucide-react';

interface EmptyStateProps {
  title: string;
  children?: ReactNode;
}

export function EmptyState({ title, children }: EmptyStateProps) {
  return (
    <div className="flex min-h-52 flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
      <Inbox className="h-8 w-8 text-muted" />
      <p className="mt-3 font-bold text-ink">{title}</p>
      {children ? <div className="mt-2 max-w-sm text-sm text-muted">{children}</div> : null}
    </div>
  );
}
