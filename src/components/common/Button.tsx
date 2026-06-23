import type { ButtonHTMLAttributes, ReactNode } from 'react';
import { Loader2 } from 'lucide-react';

type ButtonVariant = 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
type ButtonSize = 'sm' | 'md' | 'lg' | 'icon';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  icon?: ReactNode;
}

const variantClass: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-white hover:bg-indigo-700 border-transparent',
  secondary: 'bg-ink text-white hover:bg-slate-900 border-transparent',
  outline: 'bg-white text-ink border-slate-200 hover:border-primary hover:text-primary',
  ghost: 'bg-transparent text-muted border-transparent hover:bg-white hover:text-ink',
  danger: 'bg-danger text-white hover:bg-red-600 border-transparent',
  success: 'bg-success text-white hover:bg-emerald-600 border-transparent',
};

const sizeClass: Record<ButtonSize, string> = {
  sm: 'h-9 px-3 text-sm',
  md: 'h-10 px-4 text-sm',
  lg: 'h-12 px-5 text-base',
  icon: 'h-10 w-10 p-0',
};

export function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  className = '',
  disabled,
  ...props
}: ButtonProps) {
  const iconNode = loading ? <Loader2 className="h-4 w-4 animate-spin" /> : icon;

  return (
    <button
      className={[
        'inline-flex shrink-0 items-center justify-center gap-2 rounded-lg border font-semibold shadow-panel transition duration-150 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:translate-y-0',
        variantClass[variant],
        sizeClass[size],
        className,
      ].join(' ')}
      disabled={disabled || loading}
      {...props}
    >
      {iconNode}
      {size !== 'icon' ? children : <span className="sr-only">{children}</span>}
    </button>
  );
}
