import { Link } from 'react-router-dom';
import { Card } from '../../components/common/Card';
import { getHomePath } from '../../constants/roles';
import { useAuth } from '../../hooks/useAuth';

export function NotFound() {
  const { user } = useAuth();

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Card className="max-w-lg text-center" eyebrow="404" title="Pantalla no encontrada">
        <p className="mb-5 text-sm leading-6 text-muted">La ruta solicitada no existe en este prototipo.</p>
        <Link
          className="inline-flex h-10 items-center justify-center rounded-lg bg-primary px-4 text-sm font-semibold text-white shadow-panel transition hover:bg-indigo-700"
          to={getHomePath(user?.role)}
        >
          Volver
        </Link>
      </Card>
    </div>
  );
}
