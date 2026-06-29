import { lazy, Suspense } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { getHomePath } from '../constants/roles';
import { useAuth } from '../hooks/useAuth';
import { PrivateRoute } from './PrivateRoute';
import { RoleRoute } from './RoleRoute';
import { PageSpinner } from '../components/common/PageSpinner';

// Lazy load named exports
const AdminDashboard = lazy(() => import('../pages/admin/Dashboard').then(m => ({ default: m.AdminDashboard })));
const AdminModulePage = lazy(() => import('../pages/admin/AdminModulePage').then(m => ({ default: m.AdminModulePage })));
const ForgotPassword = lazy(() => import('../pages/auth/ForgotPassword').then(m => ({ default: m.ForgotPassword })));
const Login = lazy(() => import('../pages/auth/Login').then(m => ({ default: m.Login })));
const Onboarding = lazy(() => import('../pages/auth/Onboarding').then(m => ({ default: m.Onboarding })));
const Register = lazy(() => import('../pages/auth/Register').then(m => ({ default: m.Register })));
const LeaderDashboard = lazy(() => import('../pages/leader/Dashboard').then(m => ({ default: m.LeaderDashboard })));
const LeaderModulePage = lazy(() => import('../pages/leader/LeaderModulePage').then(m => ({ default: m.LeaderModulePage })));
const MemberHome = lazy(() => import('../pages/member/Home').then(m => ({ default: m.MemberHome })));
const MemberModulePage = lazy(() => import('../pages/member/MemberModulePage').then(m => ({ default: m.MemberModulePage })));
const NotFound = lazy(() => import('../pages/shared/NotFound').then(m => ({ default: m.NotFound })));
const SharedModulePage = lazy(() => import('../pages/shared/SharedModulePage').then(m => ({ default: m.SharedModulePage })));

function HomeRedirect() {
  const { user } = useAuth();
  return <Navigate replace to={getHomePath(user?.role)} />;
}

export function AppRouter() {
  return (
    <BrowserRouter>
      <Suspense fallback={<PageSpinner />}>
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
                <Route element={<AdminModulePage module="perfil" />} path="/admin/perfil" />
              </Route>

              <Route element={<RoleRoute roles={['leader']} />}>
                <Route element={<LeaderDashboard />} path="/leader" />
                <Route element={<LeaderModulePage module="mi-grupo" />} path="/leader/mi-grupo" />
                <Route element={<LeaderModulePage module="pastoral" />} path="/leader/pastoral" />
                <Route element={<LeaderModulePage module="reuniones" />} path="/leader/reuniones" />
                <Route element={<LeaderModulePage module="oracion" />} path="/leader/oracion" />
                <Route element={<LeaderModulePage module="recursos" />} path="/leader/recursos" />
                <Route element={<LeaderModulePage module="reportes" />} path="/leader/reportes" />
                <Route element={<LeaderModulePage module="perfil" />} path="/leader/perfil" />
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
      </Suspense>
    </BrowserRouter>
  );
}

