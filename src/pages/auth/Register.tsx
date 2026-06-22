import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';
import { useAppStore } from '../../store/appStore';

export function Register() {
  const navigate = useNavigate();
  const registerUser = useAppStore((state) => state.registerUser);

  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!displayName.trim() || !email.trim() || !city.trim()) {
      setError('Por favor rellenar todos los campos.');
      return;
    }
    setError(null);
    registerUser({
      displayName,
      email,
      city,
      country: 'Colombia',
      phone: '',
      spiritualStatus: 'new_believer',
    });
    setSuccess(true);
    setTimeout(() => {
      navigate('/login');
    }, 3000);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-linen px-4 py-8">
      <Card className="w-full max-w-xl" eyebrow="Registro" title="Solicitud de acceso">
        {success ? (
          <div className="space-y-4 text-center">
            <div className="rounded-lg bg-green-50 p-4 text-sm font-semibold text-green-800 animate-scale-up">
              ¡Solicitud de registro creada! El administrador de la congregación revisará tu solicitud de acceso en el panel de aprobaciones. Redirigiendo al login...
            </div>
            <Link className="block text-sm font-semibold text-primary" to="/login">
              Ir al ingreso inmediatamente
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Nombre completo"
              placeholder="Tu nombre"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Input
              label="Correo"
              placeholder="correo@dominio.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            <Input
              label="Ciudad"
              placeholder="Ciudad"
              value={city}
              onChange={(e) => setCity(e.target.value)}
            />
            {error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger">
                {error}
              </p>
            ) : null}
            <Button className="w-full" type="submit">
              Enviar solicitud
            </Button>
            <Link className="block text-center text-sm font-semibold text-primary" to="/login">
              Volver al ingreso
            </Link>
          </form>
        )}
      </Card>
    </main>
  );
}
