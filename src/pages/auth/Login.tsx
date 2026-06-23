import { FormEvent, useState } from 'react';
import { CalendarDays, Lock, Mail, MessageCircle, ShieldCheck } from 'lucide-react';
import { Link, Navigate, useNavigate } from 'react-router-dom';
import { demoCredentials } from '../../constants/mockData';
import { getHomePath, roleLabels } from '../../constants/roles';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';
import { StatusPill } from '../../components/common/StatusPill';
import { useAuth } from '../../hooks/useAuth';
import { useAuthStore } from '../../store/authStore';

export function Login() {
  const navigate = useNavigate();
  const { user, login, status, error } = useAuth();
  const [email, setEmail] = useState(demoCredentials[0].email);
  const [password, setPassword] = useState(demoCredentials[0].password);
  const [localError, setLocalError] = useState<string | null>(null);

  if (user) {
    return <Navigate replace to={getHomePath(user.role)} />;
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();

    if (!email.trim() || !password.trim()) {
      setLocalError('Ingresa correo y contrasena.');
      return;
    }

    setLocalError(null);
    const ok = await login(email, password);
    if (ok) {
      const loggedUser = useAuthStore.getState().user;
      navigate(getHomePath(loggedUser?.role), { replace: true });
    }
  }

  return (
    <main className="min-h-screen bg-linen px-4 py-8 md:px-8">
      <div className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-6xl items-center gap-8 lg:grid-cols-[0.92fr_1.08fr]">
        <section className="rounded-lg border border-white/70 bg-white/90 p-6 shadow-app backdrop-blur sm:p-8">
          <div className="mb-8">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-muted">Congregacion Digital</p>
            <h1 className="mt-3 text-3xl font-extrabold tracking-normal text-ink sm:text-4xl">
              Los Invisibles de Jesus
            </h1>
            <p className="mt-3 max-w-md text-sm font-semibold leading-6 text-muted">
              Ingresa para ver tus mensajes, reuniones, peticiones y recursos segun tu rol.
            </p>
          </div>

          <form className="space-y-5" onSubmit={handleSubmit}>
            <Input
              autoComplete="email"
              icon={<Mail className="h-4 w-4" />}
              label="Correo"
              onChange={(event) => setEmail(event.currentTarget.value)}
              value={email}
            />
            <Input
              autoComplete="current-password"
              icon={<Lock className="h-4 w-4" />}
              label="Contrasena"
              onChange={(event) => setPassword(event.currentTarget.value)}
              type="password"
              value={password}
            />
            {localError || error ? (
              <p className="rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-danger">
                {localError ?? error}
              </p>
            ) : null}
            <Button className="w-full" loading={status === 'loading'} size="lg" type="submit">
              Entrar
            </Button>
          </form>

          <div className="mt-6 grid gap-3">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-muted">Accesos de prueba</p>
            {demoCredentials.map((credential) => (
              <button
                className="flex items-center justify-between rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-left transition hover:border-primary hover:bg-white hover:shadow-panel"
                key={credential.email}
                onClick={() => {
                  setEmail(credential.email);
                  setPassword(credential.password);
                }}
                type="button"
              >
                <span>
                  <span className="block text-sm font-bold text-ink">{credential.email}</span>
                  <span className="text-xs font-medium text-muted">{credential.password}</span>
                </span>
                <StatusPill tone="primary">{roleLabels[credential.role]}</StatusPill>
              </button>
            ))}
          </div>

          <div className="mt-6 flex flex-wrap gap-3 text-sm font-semibold">
            <Link className="text-primary hover:text-indigo-700" to="/registro">
              Crear cuenta
            </Link>
            <Link className="text-muted hover:text-ink" to="/olvide-contrasena">
              Olvide mi contrasena
            </Link>
          </div>
        </section>

        <section className="grid gap-4">
          <div className="rounded-lg border border-slate-200 bg-ink p-6 text-white shadow-app">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 items-center justify-center rounded-lg bg-white/12">
                <ShieldCheck className="h-5 w-5" />
              </span>
              <div>
                <p className="text-sm font-semibold text-white/65">Acceso privado</p>
                <h2 className="text-xl font-extrabold">Una app para coordinar la vida de la congregacion</h2>
              </div>
            </div>
            <div className="mt-6 grid gap-3 sm:grid-cols-3">
              {[
                [MessageCircle, 'Mensajes', 'Conversaciones por grupo y comunidad'],
                [CalendarDays, 'Agenda', 'Eventos, reuniones y asistencia'],
                [ShieldCheck, 'Roles', 'Permisos para admin, lider y miembro'],
              ].map(([Icon, label, description]) => (
                <div className="rounded-lg bg-white/8 p-4" key={String(label)}>
                  <Icon className="h-5 w-5 text-white/80" />
                  <p className="mt-3 text-base font-extrabold">{String(label)}</p>
                  <p className="mt-1 text-sm font-semibold text-white/60">{String(description)}</p>
                </div>
              ))}
            </div>
          </div>
          <section className="rounded-lg border border-white/70 bg-white/82 p-5 shadow-app backdrop-blur">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-muted">Primer acceso</p>
            <h2 className="mt-2 text-xl font-extrabold text-ink">Solicita tu cuenta y espera aprobacion</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              Las cuentas nuevas quedan pendientes hasta que un administrador las revise. Asi se mantiene el directorio limpio y seguro.
            </p>
          </section>
        </section>
      </div>
    </main>
  );
}
