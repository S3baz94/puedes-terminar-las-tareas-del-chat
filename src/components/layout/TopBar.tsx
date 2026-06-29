import { useState } from 'react';
import { Bell, Menu, ShieldCheck, User, LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { roleAccent, roleLabels } from '../../constants/roles';
import { useAuth } from '../../hooks/useAuth';
import { useNotifications } from '../../hooks/useNotifications';
import { useUiStore } from '../../store/uiStore';
import { UserAvatar } from '../common/UserAvatar';

export function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const { toggleSidebar } = useUiStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  if (!user) return null;

  return (
    <header className="sticky top-0 z-20 border-b border-white/70 bg-white/82 px-4 py-3 shadow-[0_10px_30px_rgba(24,32,50,0.05)] backdrop-blur-xl md:px-6">
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <button
            aria-label="Abrir menu"
            className="rounded-2xl border border-slate-200 bg-white p-2 text-muted shadow-panel hover:text-ink lg:hidden"
            onClick={toggleSidebar}
            title="Abrir menu"
            type="button"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.18em] text-muted">Congregacion Digital</p>
            <h1 className="truncate text-lg font-black text-ink sm:text-xl">Hola, {user.displayName.split(' ')[0]}</h1>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <button
            aria-label="Ver notificaciones"
            className="relative rounded-2xl border border-slate-200 bg-white p-2.5 text-muted shadow-panel transition hover:-translate-y-0.5 hover:text-ink"
            onClick={() => navigate('/shared/notificaciones')}
            title="Notificaciones"
            type="button"
          >
            <Bell className="h-5 w-5" />
            {unreadCount ? (
              <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-danger px-1 text-[10px] font-bold text-white">
                {unreadCount}
              </span>
            ) : null}
          </button>
          <span
            className={`hidden items-center gap-1 rounded-full px-3 py-1.5 text-xs font-bold sm:inline-flex ${roleAccent[user.role]}`}
          >
            <ShieldCheck className="h-3.5 w-3.5" />
            {roleLabels[user.role]}
          </span>
          <div className="relative">
            <button
              onClick={() => setIsDropdownOpen(!isDropdownOpen)}
              className="flex items-center gap-3 rounded-2xl border border-slate-200 bg-white p-1.5 shadow-panel hover:bg-slate-50 transition text-left"
              type="button"
              title="Menu de usuario"
            >
              <UserAvatar name={user.displayName} size="sm" src={user.photoURL} />
              <div className="hidden max-w-36 text-left sm:block pr-2">
                <p className="truncate text-sm font-bold text-ink">{user.displayName}</p>
                <p className="truncate text-xs text-muted">{user.email}</p>
              </div>
            </button>

            {isDropdownOpen && (
              <>
                <div
                  className="fixed inset-0 z-30"
                  onClick={() => setIsDropdownOpen(false)}
                />
                <div className="absolute right-0 mt-2 w-48 rounded-2xl border border-slate-200 bg-white p-2 shadow-app animate-fade-in z-40">
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      const profilePath =
                        user.role === 'super_admin' || user.role === 'admin'
                          ? '/admin/perfil'
                          : user.role === 'leader'
                          ? '/leader/perfil'
                          : '/member/perfil';
                      navigate(profilePath);
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-ink hover:bg-slate-50 transition"
                    type="button"
                  >
                    <User className="h-4 w-4" />
                    <span>Mi Perfil</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsDropdownOpen(false);
                      logout();
                      navigate('/login', { replace: true });
                    }}
                    className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-left text-sm font-semibold text-danger hover:bg-danger/5 transition"
                    type="button"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Cerrar sesión</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
