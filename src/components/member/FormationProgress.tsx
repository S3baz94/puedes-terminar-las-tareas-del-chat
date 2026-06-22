import { formationSteps } from '../../constants/mockData';

export function FormationProgress() {
  return (
    <div className="space-y-4">
      {formationSteps.map((step) => (
        <div key={step.label}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="font-semibold text-ink">{step.label}</span>
            <span className="font-bold text-muted">{step.progress}%</span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full bg-success transition-all"
              style={{ width: `${step.progress}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}
