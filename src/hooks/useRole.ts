import type { Role } from '../types/models';
import { useAuth } from './useAuth';

export function useRole() {
  const { user } = useAuth();

  return {
    role: user?.role ?? null,
    hasRole: (roles: Role[]) => Boolean(user?.role && roles.includes(user.role)),
  };
}
