const isPwaEnabled = import.meta.env.VITE_ENABLE_PWA === 'true';

function injectManifest() {
  const existingManifest = document.querySelector('link[rel="manifest"]');
  if (existingManifest) return;

  const manifest = document.createElement('link');
  manifest.rel = 'manifest';
  manifest.href = '/manifest.webmanifest';
  document.head.appendChild(manifest);
}

function setThemeColor() {
  const existingTheme = document.querySelector('meta[name="theme-color"]');
  if (existingTheme) return;

  const theme = document.createElement('meta');
  theme.name = 'theme-color';
  theme.content = '#4F46E5';
  document.head.appendChild(theme);
}

export function registerPwa() {
  if (!isPwaEnabled) return;
  if (!('serviceWorker' in navigator)) return;

  injectManifest();
  setThemeColor();

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/service-worker.js').catch((error) => {
      console.warn('No se pudo activar el modo PWA.', error);
    });
  });
}
