import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ command }) => {
  const isServe = command === 'serve';

  return {
    root: projectRoot,
    cacheDir: resolve(projectRoot, '.vite-cache'),
    plugins: [react()],
    resolve: isServe
      ? {
          alias: [
            { find: /^react$/, replacement: resolve(projectRoot, 'node_modules/react/cjs/react.development.js') },
            {
              find: /^react\/jsx-runtime$/,
              replacement: resolve(projectRoot, 'node_modules/react/cjs/react-jsx-runtime.development.js'),
            },
            {
              find: /^react\/jsx-dev-runtime$/,
              replacement: resolve(projectRoot, 'node_modules/react/cjs/react-jsx-dev-runtime.development.js'),
            },
            { find: /^react-dom$/, replacement: resolve(projectRoot, 'node_modules/react-dom/cjs/react-dom.development.js') },
            { find: /^react-dom\/client$/, replacement: resolve(projectRoot, 'node_modules/react-dom/client.js') },
            { find: /^scheduler$/, replacement: resolve(projectRoot, 'node_modules/scheduler/cjs/scheduler.development.js') },
          ],
        }
      : undefined,
    optimizeDeps: isServe
      ? {
          exclude: ['@stripe/stripe-js', 'firebase', 'lucide-react', 'react-router-dom', 'zustand'],
          esbuildOptions: {
            absWorkingDir: projectRoot,
          },
        }
      : undefined,
    server: {
      host: '127.0.0.1',
      port: 5173,
      fs: {
        allow: [projectRoot],
        strict: true,
      },
    },
    preview: {
      host: '127.0.0.1',
      port: 4173,
    },
  };
});
