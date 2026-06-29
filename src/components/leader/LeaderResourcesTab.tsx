import { useToastStore } from '../../store/toastStore';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { FileText } from 'lucide-react';

export function LeaderResourcesTab() {
  const notify = useToastStore((state) => state.notify);

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {['Guia de discipulado', 'Estudio Lucas', 'Plantilla reunion'].map((resource) => (
        <Card key={resource} title={resource}>
          <div className="flex items-center justify-between">
            <FileText className="h-8 w-8 text-primary" />
            <Button
              size="sm"
              variant="outline"
              disabled={true}
            >
              Próximamente
            </Button>
          </div>
        </Card>
      ))}
    </div>
  );
}
