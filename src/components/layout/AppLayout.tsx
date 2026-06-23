import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { MobileDock } from './MobileDock';
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
        <main className="mx-auto w-full max-w-7xl px-4 pb-28 pt-5 md:px-6 lg:px-8 lg:pb-10 lg:pt-8">
          <div className="app-content">
            <Outlet />
          </div>
        </main>
        <MobileDock />
      </div>
    </div>
  );
}
