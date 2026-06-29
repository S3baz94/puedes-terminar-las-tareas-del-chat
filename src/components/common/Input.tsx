import { useId, type InputHTMLAttributes, ReactNode } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: ReactNode;
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  const generatedId = useId();
  const inputId = props.id || generatedId;
  const errorId = `${inputId}-error`;

  return (
    <label className="block">
      <span className="mb-2 block text-sm font-semibold text-ink">{label}</span>
      <span className="relative block">
        {icon ? (
          <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
            {icon}
          </span>
        ) : null}
        <input
          id={inputId}
          aria-invalid={!!error}
          aria-describedby={error ? errorId : undefined}
          className={[
            'h-11 w-full rounded-lg border bg-white px-3 text-sm text-ink shadow-panel transition placeholder:text-slate-400',
            icon ? 'pl-10' : '',
            error ? 'border-danger' : 'border-slate-200 focus:border-primary',
            className,
          ].join(' ')}
          {...props}
        />
      </span>
      {error ? <span id={errorId} className="mt-2 block text-sm font-medium text-danger">{error}</span> : null}
    </label>
  );
}
