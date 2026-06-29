import { useAppStore } from '../../store/appStore';
import { Card } from '../common/Card';
import { Button } from '../common/Button';
import { FileText } from 'lucide-react';

export function LeaderReportsTab() {
  const prayerRequests = useAppStore((state) => state.prayerRequests);

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <Card eyebrow="Semanal" title="Resumen automatico">
        <div className="space-y-3 text-sm text-muted">
          <p>
            Asistencia del grupo: <strong className="text-ink">72%</strong>
          </p>
          <p>
            Peticiones activas: <strong className="text-ink">{prayerRequests.filter((p) => p.status === 'active').length}</strong>
          </p>
          <p>
            Miembros inactivos: <strong className="text-ink">1</strong>
          </p>
        </div>
      </Card>
      <Card eyebrow="Exportar" title="Reporte">
        <Button icon={<FileText className="h-4 w-4" />} variant="secondary" disabled={true}>
          Generar reporte semanal (Próximamente)
        </Button>
      </Card>
    </div>
  );
}
