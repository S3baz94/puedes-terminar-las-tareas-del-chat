import type { Role } from '../types/models';

export const roleLabels: Record<Role, string> = {
  super_admin: 'Super admin',
  admin: 'Admin',
  leader: 'Lider',
  member: 'Miembro',
  visitor: 'Visitante',
};

export const roleHomePaths: Record<Role, string> = {
  super_admin: '/admin',
  admin: '/admin',
  leader: '/leader',
  member: '/member',
  visitor: '/publico',
};

export const roleAccent: Record<Role, string> = {
  super_admin: 'bg-ink text-white',
  admin: 'bg-primary text-white',
  leader: 'bg-olive text-white',
  member: 'bg-success text-white',
  visitor: 'bg-warning text-ink',
};

export function getHomePath(role?: Role | null) {
  return role ? roleHomePaths[role] : '/login';
}
