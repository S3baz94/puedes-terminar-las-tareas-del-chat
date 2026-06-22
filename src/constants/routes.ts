import type { Role } from '../types/models';

export interface NavItem {
  label: string;
  to: string;
  icon: string;
  roles: Role[];
}

export const adminNav: NavItem[] = [
  { label: 'Dashboard', to: '/admin', icon: 'dashboard', roles: ['super_admin', 'admin'] },
  { label: 'Usuarios', to: '/admin/usuarios', icon: 'users', roles: ['super_admin', 'admin'] },
  { label: 'Contenido', to: '/admin/contenido', icon: 'content', roles: ['super_admin', 'admin'] },
  { label: 'Eventos', to: '/admin/eventos', icon: 'calendar', roles: ['super_admin', 'admin'] },
  { label: 'Analiticas', to: '/admin/analiticas', icon: 'analytics', roles: ['super_admin', 'admin'] },
  { label: 'Finanzas', to: '/admin/finanzas', icon: 'finance', roles: ['super_admin', 'admin'] },
  { label: 'En vivo', to: '/admin/en-vivo', icon: 'live', roles: ['super_admin', 'admin'] },
  { label: 'Ajustes', to: '/admin/configuracion', icon: 'settings', roles: ['super_admin', 'admin'] },
];

export const leaderNav: NavItem[] = [
  { label: 'Dashboard', to: '/leader', icon: 'dashboard', roles: ['leader'] },
  { label: 'Mi grupo', to: '/leader/mi-grupo', icon: 'users', roles: ['leader'] },
  { label: 'Pastoral', to: '/leader/pastoral', icon: 'heart', roles: ['leader'] },
  { label: 'Reuniones', to: '/leader/reuniones', icon: 'checklist', roles: ['leader'] },
  { label: 'Oracion', to: '/leader/oracion', icon: 'prayer', roles: ['leader'] },
  { label: 'Recursos', to: '/leader/recursos', icon: 'library', roles: ['leader'] },
  { label: 'Reportes', to: '/leader/reportes', icon: 'analytics', roles: ['leader'] },
];

export const memberNav: NavItem[] = [
  { label: 'Home', to: '/member', icon: 'home', roles: ['member'] },
  { label: 'Biblia', to: '/member/biblia', icon: 'book', roles: ['member'] },
  { label: 'Devocional', to: '/member/devocional', icon: 'content', roles: ['member'] },
  { label: 'Oracion', to: '/member/oracion', icon: 'prayer', roles: ['member'] },
  { label: 'Mis grupos', to: '/member/grupos', icon: 'users', roles: ['member'] },
  { label: 'En vivo', to: '/member/en-vivo', icon: 'live', roles: ['member'] },
  { label: 'Dar', to: '/member/dar', icon: 'finance', roles: ['member'] },
  { label: 'Perfil', to: '/member/perfil', icon: 'profile', roles: ['member'] },
];

export const sharedNav: NavItem[] = [
  { label: 'Mensajes', to: '/shared/mensajes', icon: 'message', roles: ['super_admin', 'admin', 'leader', 'member'] },
  { label: 'Calendario', to: '/shared/calendario', icon: 'calendar', roles: ['super_admin', 'admin', 'leader', 'member'] },
  { label: 'Directorio', to: '/shared/directorio', icon: 'directory', roles: ['super_admin', 'admin', 'leader', 'member'] },
  { label: 'Testimonios', to: '/shared/testimonios', icon: 'spark', roles: ['super_admin', 'admin', 'leader', 'member'] },
  { label: 'Alertas', to: '/shared/notificaciones', icon: 'bell', roles: ['super_admin', 'admin', 'leader', 'member'] },
];

export const allNavItems = [...adminNav, ...leaderNav, ...memberNav, ...sharedNav];
