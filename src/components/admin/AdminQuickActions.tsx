import { FileText, Plus, Upload, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';

interface AdminQuickActionsProps {
  onScrollToPending?: () => void;
}

export function AdminQuickActions({ onScrollToPending }: AdminQuickActionsProps) {
  const navigate = useNavigate();

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
      <Button
        icon={<Plus className="h-4 w-4" />}
        variant="primary"
        onClick={() => navigate('/admin/eventos')}
      >
        Nuevo evento
      </Button>
      <Button
        icon={<FileText className="h-4 w-4" />}
        variant="outline"
        onClick={() => navigate('/admin/contenido')}
      >
        Publicar contenido
      </Button>
      <Button
        icon={<Upload className="h-4 w-4" />}
        variant="outline"
        disabled={true}
      >
        Importar CSV (Próximamente)
      </Button>
      <Button
        icon={<Users className="h-4 w-4" />}
        variant="secondary"
        onClick={onScrollToPending}
      >
        Aprobar usuarios
      </Button>
    </div>
  );
}
