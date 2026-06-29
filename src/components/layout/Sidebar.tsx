import { NavLink } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  BookOpen,
  CalendarDays,
  ClipboardList,
  FileText,
  Gift,
  HandHeart,
  HeartHandshake,
  Home,
  LayoutDashboard,
  Library,
  MessageCircle,
  Radio,
  Search,
  Settings,
  Sparkles,
  User,
  Users,
  Wallet,
  X,
} from 'lucide-react';
import { allNavItems, type NavItem } from '../../constants/routes';
import { roleLabels } from '../../constants/roles';
import { useAuth } from '../../hooks/useAuth';
import { useUiStore } from '../../store/uiStore';
import { useAppStore } from '../../store/appStore';
import type { Role } from '../../types/models';

const iconMap = {
  analytics: BarChart3,
  bell: Bell,
  book: BookOpen,
  calendar: CalendarDays,
  checklist: ClipboardList,
  content: FileText,
  dashboard: LayoutDashboard,
  directory: Search,
  finance: Wallet,
  gift: Gift,
  heart: HeartHandshake,
  home: Home,
  library: Library,
  live: Radio,
  message: MessageCircle,
  prayer: HandHeart,
  profile: User,
  settings: Settings,
  spark: Sparkles,
  users: Users,
};

function getIcon(icon: string) {
  return iconMap[icon as keyof typeof iconMap] ?? LayoutDashboard;
}

function groupByCategory(items: NavItem[], role: Role) {
  const filtered = items.filter((item) => item.roles.includes(role));
  return {
    general: filtered.filter((item) => item.category === 'general'),
    crecimiento: filtered.filter((item) => item.category === 'crecimiento'),
    gestion: filtered.filter((item) => item.category === 'gestion'),
  };
}

export function Sidebar() {
  const { user } = useAuth();
  const { sidebarOpen, closeSidebar } = useUiStore();
  const organizationName = useAppStore((state) => state.organizationName);

  if (!user) return null;

  const grouped = groupByCategory(allNavItems, user.role);

  return (
    <>
      <div
        className={`fixed inset-0 z-30 bg-ink/40 transition lg:hidden ${
          sidebarOpen ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={closeSidebar}
      />
      <aside
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col border-r border-white/70 bg-white/90 shadow-app backdrop-blur-xl transition duration-200 lg:sticky lg:top-0 lg:h-screen lg:bg-white/92 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'
        }`}
      >
        <div className="flex min-h-20 items-center justify-between border-b border-slate-100 px-5">
          <div className="min-w-0">
            <p className="text-xs font-extrabold uppercase tracking-[0.22em] text-muted">App</p>
            <p className="truncate text-lg font-black text-ink">{organizationName}</p>
            <p className="mt-0.5 text-xs font-semibold text-muted">{roleLabels[user.role]}</p>
          </div>
          <button
            aria-label="Cerrar menu"
            className="rounded-lg p-2 text-muted hover:bg-slate-100 lg:hidden"
            onClick={closeSidebar}
            title="Cerrar menu"
            type="button"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <nav className="scrollbar-soft flex-1 space-y-7 overflow-y-auto px-4 py-5">
          <NavSection items={grouped.general} label="General" onNavigate={closeSidebar} />
          <NavSection items={grouped.crecimiento} label="Vida Espiritual" onNavigate={closeSidebar} />
          <NavSection items={grouped.gestion} label="Gestión y Ministerio" onNavigate={closeSidebar} />
        </nav>
      </aside>
    </>
  );
}

function NavSection({
  items,
  label,
  onNavigate,
}: {
  items: NavItem[];
  label: string;
  onNavigate: () => void;
}) {
  if (!items.length) return null;

  return (
    <div>
      <p className="px-3 text-xs font-bold uppercase tracking-[0.18em] text-muted">{label}</p>
      <div className="mt-2 space-y-1">
        {items.map((item) => {
          const Icon = getIcon(item.icon);

          return (
            <NavLink
              className={({ isActive }) =>
                [
                  'flex items-center gap-3 rounded-2xl px-3 py-2.5 text-sm font-semibold transition',
                  isActive
                    ? 'bg-ink text-white shadow-soft'
                    : 'text-slate-600 hover:bg-white hover:text-ink hover:shadow-panel',
                ].join(' ')
              }
              end={item.to === '/admin' || item.to === '/leader' || item.to === '/member'}
              key={item.to}
              onClick={onNavigate}
              to={item.to}
            >
              <Icon className="h-4 w-4" />
              <span>{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </div>
  );
}
