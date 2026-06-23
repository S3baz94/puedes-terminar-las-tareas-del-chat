import { FileText, Plus, Upload, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../common/Button';

export function AdminQuickActions() {
  const navigate = useNavigate();

  return (
    <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
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
        onClick={() => navigate('/admin/usuarios')}
      >
        Importar CSV
      </Button>
      <Button
        icon={<Users className="h-4 w-4" />}
        variant="secondary"
        onClick={() => {
          const cards = document.querySelectorAll('section');
          cards.forEach((card) => {
            if (card.textContent?.includes('Registros pendientes')) {
              card.scrollIntoView({ behavior: 'smooth' });
            }
          });
        }}
      >
        Aprobar usuarios
      </Button>
    </div>
  );
}
