import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/common/Button';
import { Card } from '../../components/common/Card';
import { Input } from '../../components/common/Input';

export function ForgotPassword() {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!email.trim() || !email.includes('@')) {
      setError('Por favor ingresa un correo válido.');
      return;
    }
    setError(null);
    setSuccess(true);
    setTimeout(() => {
      navigate('/login');
    }, 3000);
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-linen px-4 py-8">
      <Card className="w-full max-w-lg" eyebrow="Cuenta" title="Recuperar acceso">
        {success ? (
          <div className="space-y-4 text-center">
            <div className="rounded-lg bg-green-50 p-4 text-sm font-semibold text-green-800 animate-scale-up">
              ¡Enlace de recuperación enviado! Revisa tu correo para continuar con la restauración de acceso. Redirigiendo al login...
            </div>
            <Link className="block text-sm font-semibold text-primary" to="/login">
              Ir al ingreso inmediatamente
            </Link>
          </div>
        ) : (
          <form className="space-y-4" onSubmit={handleSubmit}>
            <Input
              label="Correo"
              placeholder="correo@dominio.com"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />
            {error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger">
                {error}
              </p>
            ) : null}
            <Button className="w-full" type="submit">
              Enviar enlace
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
