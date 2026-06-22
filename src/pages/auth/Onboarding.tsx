import { useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { Toggle } from '../../components/common/Toggle';
import { getHomePath } from '../../constants/roles';
import { useAuth } from '../../hooks/useAuth';

export function Onboarding() {
  const navigate = useNavigate();
  const { user, completeOnboarding } = useAuth();
  const [showPhone, setShowPhone] = useState(user?.privacySettings.showPhone ?? false);
  const [showCity, setShowCity] = useState(user?.privacySettings.showCity ?? true);
  const [phone, setPhone] = useState(user?.phone ?? '');
  const [favoriteVerse, setFavoriteVerse] = useState(user?.favoriteVerse ?? '');
  const [testimony, setTestimony] = useState(user?.testimony ?? '');

  if (!user) return <Navigate replace to="/login" />;

  return (
    <main className="flex min-h-screen items-center justify-center bg-linen px-4 py-8">
      <Card className="w-full max-w-2xl" eyebrow="Bienvenida" title="Completa tu perfil">
        <div className="grid gap-4">
          <Input
            label="Telefono"
            placeholder={user.phone}
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
          <Input
            label="Versiculo favorito"
            placeholder={user.favoriteVerse ?? 'Juan 3:16'}
            value={favoriteVerse}
            onChange={(e) => setFavoriteVerse(e.target.value)}
          />
          <label className="block">
            <span className="mb-2 block text-sm font-semibold text-ink">Testimonio</span>
            <textarea
              className="min-h-28 w-full rounded-lg border border-slate-200 bg-white p-3 text-sm shadow-panel focus:border-primary"
              placeholder="Comparte una version breve"
              value={testimony}
              onChange={(e) => setTestimony(e.target.value)}
            />
          </label>
          <div className="grid gap-3 sm:grid-cols-2">
            <Toggle checked={showPhone} label="Mostrar telefono" onChange={setShowPhone} />
            <Toggle checked={showCity} label="Mostrar ciudad" onChange={setShowCity} />
          </div>
          <Button
            onClick={() => {
              completeOnboarding({
                phone,
                favoriteVerse,
                testimony,
                privacySettings: {
                  showPhone,
                  showCity,
                  showEmail: user.privacySettings.showEmail,
                },
              });
              navigate(getHomePath(user.role), { replace: true });
            }}
          >
            Guardar perfil
          </Button>
        </div>
      </Card>
    </main>
  );
}
