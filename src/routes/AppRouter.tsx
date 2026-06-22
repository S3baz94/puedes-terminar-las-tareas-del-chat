import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { getHomePath } from '../constants/roles';
import { useAuth } from '../hooks/useAuth';
import { AdminDashboard } from '../pages/admin/Dashboard';
import { AdminModulePage } from '../pages/admin/AdminModulePage';
import { ForgotPassword } from '../pages/auth/ForgotPassword';
import { Login } from '../pages/auth/Login';
import { Onboarding } from '../pages/auth/Onboarding';
import { Register } from '../pages/auth/Register';
import { LeaderDashboard } from '../pages/leader/Dashboard';
import { LeaderModulePage } from '../pages/leader/LeaderModulePage';
import { MemberHome } from '../pages/member/Home';
import { MemberModulePage } from '../pages/member/MemberModulePage';
import { NotFound } from '../pages/shared/NotFound';
import { SharedModulePage } from '../pages/shared/SharedModulePage';
import { PrivateRoute } from './PrivateRoute';
import { RoleRoute } from './RoleRoute';

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate replace to={getHomePath(user?.role)} />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Routes>
        <Route element={<Login />} path="/login" />
        <Route element={<Register />} path="/registro" />
        <Route element={<ForgotPassword />} path="/olvide-contrasena" />

        <Route element={<PrivateRoute />}>
          <Route element={<Onboarding />} path="/onboarding" />
          <Route element={<AppLayout />}>
            <Route element={<HomeRedirect />} path="/" />

            <Route element={<RoleRoute roles={['super_admin', 'admin']} />}>
              <Route element={<AdminDashboard />} path="/admin" />
              <Route element={<AdminModulePage module="usuarios" />} path="/admin/usuarios" />
              <Route element={<AdminModulePage module="contenido" />} path="/admin/contenido" />
              <Route element={<AdminModulePage module="eventos" />} path="/admin/eventos" />
              <Route element={<AdminModulePage module="analiticas" />} path="/admin/analiticas" />
              <Route element={<AdminModulePage module="finanzas" />} path="/admin/finanzas" />
              <Route element={<AdminModulePage module="en-vivo" />} path="/admin/en-vivo" />
              <Route element={<AdminModulePage module="configuracion" />} path="/admin/configuracion" />
            </Route>

            <Route element={<RoleRoute roles={['leader']} />}>
              <Route element={<LeaderDashboard />} path="/leader" />
              <Route element={<LeaderModulePage module="mi-grupo" />} path="/leader/mi-grupo" />
              <Route element={<LeaderModulePage module="pastoral" />} path="/leader/pastoral" />
              <Route element={<LeaderModulePage module="reuniones" />} path="/leader/reuniones" />
              <Route element={<LeaderModulePage module="oracion" />} path="/leader/oracion" />
              <Route element={<LeaderModulePage module="recursos" />} path="/leader/recursos" />
              <Route element={<LeaderModulePage module="reportes" />} path="/leader/reportes" />
            </Route>

            <Route element={<RoleRoute roles={['member']} />}>
              <Route element={<MemberHome />} path="/member" />
              <Route element={<MemberModulePage module="biblia" />} path="/member/biblia" />
              <Route element={<MemberModulePage module="devocional" />} path="/member/devocional" />
              <Route element={<MemberModulePage module="oracion" />} path="/member/oracion" />
              <Route element={<MemberModulePage module="grupos" />} path="/member/grupos" />
              <Route element={<MemberModulePage module="en-vivo" />} path="/member/en-vivo" />
              <Route element={<MemberModulePage module="dar" />} path="/member/dar" />
              <Route element={<MemberModulePage module="perfil" />} path="/member/perfil" />
            </Route>

            <Route element={<RoleRoute roles={['super_admin', 'admin', 'leader', 'member']} />}>
              <Route element={<SharedModulePage module="mensajes" />} path="/shared/mensajes" />
              <Route element={<SharedModulePage module="calendario" />} path="/shared/calendario" />
              <Route element={<SharedModulePage module="directorio" />} path="/shared/directorio" />
              <Route element={<SharedModulePage module="testimonios" />} path="/shared/testimonios" />
              <Route element={<SharedModulePage module="notificaciones" />} path="/shared/notificaciones" />
            </Route>

            <Route element={<NotFound />} path="*" />
          </Route>
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
