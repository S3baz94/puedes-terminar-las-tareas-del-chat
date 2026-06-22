import type { Role } from '../types/models';

export interface NavItem {
  label: string;
  to: string;
  icon: string;
  roles: Role[];
  category: 'general' | 'crecimiento' | 'gestion';
}

export const allNavItems: NavItem[] = [
  // CATEGORÍA: GENERAL
  { label: 'Inicio', to: '/admin', icon: 'dashboard', roles: ['super_admin', 'admin'], category: 'general' },
  { label: 'Inicio', to: '/leader', icon: 'dashboard', roles: ['leader'], category: 'general' },
  { label: 'Inicio', to: '/member', icon: 'home', roles: ['member'], category: 'general' },
  { label: 'Mensajes', to: '/shared/mensajes', icon: 'message', roles: ['super_admin', 'admin', 'leader', 'member'], category: 'general' },
  { label: 'Calendario', to: '/shared/calendario', icon: 'calendar', roles: ['super_admin', 'admin', 'leader', 'member'], category: 'general' },
  { label: 'Directorio', to: '/shared/directorio', icon: 'directory', roles: ['super_admin', 'admin', 'leader', 'member'], category: 'general' },
  { label: 'Testimonios', to: '/shared/testimonios', icon: 'spark', roles: ['super_admin', 'admin', 'leader', 'member'], category: 'general' },
  { label: 'Alertas', to: '/shared/notificaciones', icon: 'bell', roles: ['super_admin', 'admin', 'leader', 'member'], category: 'general' },
  { label: 'Perfil', to: '/leader/perfil', icon: 'profile', roles: ['leader'], category: 'general' },
  { label: 'Perfil', to: '/member/perfil', icon: 'profile', roles: ['member'], category: 'general' },

  // CATEGORÍA: VIDA ESPIRITUAL (CRECIMIENTO)
  { label: 'Devocional', to: '/member/devocional', icon: 'content', roles: ['member'], category: 'crecimiento' },
  { label: 'Biblia', to: '/member/biblia', icon: 'book', roles: ['member'], category: 'crecimiento' },
  { label: 'Oracion', to: '/member/oracion', icon: 'prayer', roles: ['member'], category: 'crecimiento' },
  { label: 'Oracion', to: '/leader/oracion', icon: 'prayer', roles: ['leader'], category: 'crecimiento' },
  { label: 'Recursos', to: '/leader/recursos', icon: 'library', roles: ['leader'], category: 'crecimiento' },
  { label: 'Dar / Ofrendar', to: '/member/dar', icon: 'finance', roles: ['member'], category: 'crecimiento' },

  // CATEGORÍA: GESTIÓN & MINISTERIO
  { label: 'Usuarios', to: '/admin/usuarios', icon: 'users', roles: ['super_admin', 'admin'], category: 'gestion' },
  { label: 'Contenido', to: '/admin/contenido', icon: 'content', roles: ['super_admin', 'admin'], category: 'gestion' },
  { label: 'Eventos', to: '/admin/eventos', icon: 'calendar', roles: ['super_admin', 'admin'], category: 'gestion' },
  { label: 'Analiticas', to: '/admin/analiticas', icon: 'analytics', roles: ['super_admin', 'admin'], category: 'gestion' },
  { label: 'Finanzas', to: '/admin/finanzas', icon: 'finance', roles: ['super_admin', 'admin'], category: 'gestion' },
  { label: 'En vivo', to: '/admin/en-vivo', icon: 'live', roles: ['super_admin', 'admin'], category: 'gestion' },
  { label: 'Ajustes', to: '/admin/configuracion', icon: 'settings', roles: ['super_admin', 'admin'], category: 'gestion' },

  { label: 'Mi grupo', to: '/leader/mi-grupo', icon: 'users', roles: ['leader'], category: 'gestion' },
  { label: 'Pastoral', to: '/leader/pastoral', icon: 'heart', roles: ['leader'], category: 'gestion' },
  { label: 'Reuniones', to: '/leader/reuniones', icon: 'checklist', roles: ['leader'], category: 'gestion' },
  { label: 'Reportes', to: '/leader/reportes', icon: 'analytics', roles: ['leader'], category: 'gestion' },

  { label: 'Mis grupos', to: '/member/grupos', icon: 'users', roles: ['member'], category: 'gestion' },
  { label: 'En vivo', to: '/member/en-vivo', icon: 'live', roles: ['member'], category: 'crecimiento' },
];
