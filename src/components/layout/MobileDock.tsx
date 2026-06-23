import { NavLink } from 'react-router-dom';
import {
  Bell,
  CalendarDays,
  HandHeart,
  Home,
  MessageCircle,
  Radio,
  User,
  Users,
} from 'lucide-react';
import { allNavItems, type NavItem } from '../../constants/routes';
import { useAuth } from '../../hooks/useAuth';

const iconMap = {
  bell: Bell,
  calendar: CalendarDays,
  content: HandHeart,
  dashboard: Home,
  home: Home,
  live: Radio,
  message: MessageCircle,
  prayer: HandHeart,
  profile: User,
  users: Users,
};

const preferredLabels = ['Inicio', 'Mensajes', 'Calendario', 'Perfil', 'Alertas'];

function getIcon(item: NavItem) {
  return iconMap[item.icon as keyof typeof iconMap] ?? Home;
}

function getDockItems(items: NavItem[]) {
  const selected = preferredLabels
    .map((label) => items.find((item) => item.label === label))
    .filter(Boolean) as NavItem[];

  if (selected.length >= 5) return selected.slice(0, 5);

  const rest = items.filter((item) => !selected.some((selectedItem) => selectedItem.to === item.to));
  return [...selected, ...rest].slice(0, 5);
}

export function MobileDock() {
  const { user } = useAuth();
  if (!user) return null;

  const items = getDockItems(allNavItems.filter((item) => item.roles.includes(user.role)));

  return (
    <nav className="mobile-dock fixed inset-x-3 bottom-3 z-30 rounded-[1.35rem] border border-white/70 bg-white/92 px-2 py-2 shadow-app backdrop-blur-xl lg:hidden">
      <div className="grid grid-cols-5 gap-1">
        {items.map((item) => {
          const Icon = getIcon(item);

          return (
            <NavLink
              className={({ isActive }) =>
                [
                  'flex min-h-[3.35rem] flex-col items-center justify-center gap-1 rounded-2xl px-1 text-[11px] font-extrabold transition',
                  isActive
                    ? 'bg-ink text-white shadow-panel'
                    : 'text-slate-500 hover:bg-slate-100 hover:text-ink',
                ].join(' ')
              }
              end={item.to === '/admin' || item.to === '/leader' || item.to === '/member'}
              key={item.to}
              to={item.to}
            >
              <Icon className="h-4 w-4" />
              <span className="max-w-full truncate">{item.label}</span>
            </NavLink>
          );
        })}
      </div>
    </nav>
  );
}
