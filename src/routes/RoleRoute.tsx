import { Navigate, Outlet } from 'react-router-dom';
import { getHomePath } from '../constants/roles';
import { useAuth } from '../hooks/useAuth';
import type { Role } from '../types/models';

export function RoleRoute({ roles }: { roles: Role[] }) {
  const { user } = useAuth();

  if (!user) {
    return <Navigate replace to="/login" />;
  }

  if (!roles.includes(user.role)) {
    return <Navigate replace to={getHomePath(user.role)} />;
  }

  return <Outlet />;
}
