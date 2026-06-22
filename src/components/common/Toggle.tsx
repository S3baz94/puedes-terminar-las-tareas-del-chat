interface ToggleProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Toggle({ checked, onChange, label }: ToggleProps) {
  return (
    <label className="flex cursor-pointer items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <span className="text-sm font-semibold text-ink">{label}</span>
      <input
        checked={checked}
        className="peer sr-only"
        onChange={(event) => onChange(event.currentTarget.checked)}
        type="checkbox"
      />
      <span className={`relative h-6 w-11 rounded-full transition ${checked ? 'bg-primary' : 'bg-slate-300'}`}>
        <span
          className={`absolute left-1 top-1 h-4 w-4 rounded-full bg-white transition ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </span>
    </label>
  );
}
