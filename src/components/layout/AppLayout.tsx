import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';

export function AppLayout() {
  const themeColor = useAppStore((state) => state.themeColor);
  const bootstrap = useAppStore((state) => state.bootstrap);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', themeColor);
  }, [themeColor]);

  useEffect(() => {
    if (token) {
      bootstrap();
    }
  }, [token, bootstrap]);

  return (
    <div className="app-shell min-h-screen lg:grid lg:grid-cols-[18rem_1fr]">
      <Sidebar />
      <div className="min-w-0">
        <TopBar />
        <main className="mx-auto w-full max-w-7xl px-4 py-6 md:px-6 lg:py-8">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
