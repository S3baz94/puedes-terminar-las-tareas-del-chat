import { CheckCircle2 } from 'lucide-react';
import { Button } from '../common/Button';
import { UserAvatar } from '../common/UserAvatar';

interface AttendanceToggleProps {
  name: string;
  isPresent: boolean;
  onToggle: () => void;
}

export function AttendanceToggle({ name, isPresent, onToggle }: AttendanceToggleProps) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 bg-white px-4 py-3">
      <div className="flex items-center gap-3">
        <UserAvatar name={name} size="sm" />
        <span className="text-sm font-semibold text-ink">{name}</span>
      </div>
      <Button
        icon={<CheckCircle2 className="h-4 w-4" />}
        onClick={onToggle}
        size="sm"
        variant={isPresent ? 'success' : 'outline'}
      >
        {isPresent ? 'Presente' : 'Marcar'}
      </Button>
    </div>
  );
}
