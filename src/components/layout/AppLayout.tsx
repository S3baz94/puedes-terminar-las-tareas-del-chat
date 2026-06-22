import { useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAppStore } from '../../store/appStore';

export function AppLayout() {
  const themeColor = useAppStore((state) => state.themeColor);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', themeColor);
  }, [themeColor]);

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
