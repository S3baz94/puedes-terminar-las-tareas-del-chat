import { AlertCircle, CheckCircle2, Info, X, AlertTriangle } from 'lucide-react';
import { useToastStore, type ToastTone } from '../../store/toastStore';

const toneClass: Record<ToastTone, string> = {
  success: 'border-emerald-200 bg-emerald-50 text-emerald-950',
  error: 'border-red-200 bg-red-50 text-red-950',
  info: 'border-indigo-200 bg-indigo-50 text-indigo-950',
  warning: 'border-amber-200 bg-amber-50 text-amber-950',
};

const iconMap = {
  success: CheckCircle2,
  error: AlertCircle,
  info: Info,
  warning: AlertTriangle,
};

export function ToastViewport() {
  const messages = useToastStore((state) => state.messages);
  const dismiss = useToastStore((state) => state.dismiss);

  if (!messages.length) return null;

  return (
    <div className="fixed inset-x-3 top-3 z-50 grid gap-2 sm:left-auto sm:right-5 sm:top-5 sm:w-96">
      {messages.map((message) => {
        const Icon = iconMap[message.tone];

        return (
          <section
            aria-live="polite"
            className={[
              'flex items-start gap-3 rounded-lg border p-4 shadow-app backdrop-blur',
              toneClass[message.tone],
            ].join(' ')}
            key={message.id}
          >
            <Icon className="mt-0.5 h-5 w-5 shrink-0" />
            <div className="min-w-0 flex-1">
              <p className="text-sm font-extrabold">{message.title}</p>
              {message.description ? <p className="mt-1 text-sm opacity-75">{message.description}</p> : null}
            </div>
            <button
              aria-label="Cerrar aviso"
              className="rounded-md p-1 opacity-70 transition hover:bg-white/70 hover:opacity-100"
              onClick={() => dismiss(message.id)}
              type="button"
            >
              <X className="h-4 w-4" />
            </button>
          </section>
        );
      })}
    </div>
  );
}
