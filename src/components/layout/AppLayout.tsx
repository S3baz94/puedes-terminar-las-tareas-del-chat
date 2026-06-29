import { useEffect, Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import { MobileDock } from './MobileDock';
import { Sidebar } from './Sidebar';
import { TopBar } from './TopBar';
import { useAppStore } from '../../store/appStore';
import { useAuthStore } from '../../store/authStore';
import { PageSpinner } from '../common/PageSpinner';

export function AppLayout() {
  const themeColor = useAppStore((state) => state.themeColor);
  const bootstrap = useAppStore((state) => state.bootstrap);
  const token = useAuthStore((state) => state.token);

  useEffect(() => {
    document.documentElement.style.setProperty('--color-primary', themeColor);
    
    // Calculate relative luminance to determine high-contrast text color
    const cleanHex = themeColor.replace('#', '');
    const r = parseInt(cleanHex.substring(0, 2), 16);
    const g = parseInt(cleanHex.substring(2, 4), 16);
    const b = parseInt(cleanHex.substring(4, 6), 16);
    
    const a = [r, g, b].map((v) => {
      v /= 255;
      return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
    });
    const luminance = 0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2];
    const textColor = luminance > 0.179 ? '#111827' : '#ffffff';
    
    document.documentElement.style.setProperty('--color-primary-text', textColor);
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
            <Suspense fallback={<PageSpinner />}>
              <Outlet />
            </Suspense>
          </div>
        </main>
        <MobileDock />
      </div>
    </div>
  );
}

