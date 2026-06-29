import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const projectRoot = dirname(fileURLToPath(import.meta.url));

// Ensure apple-touch-icon.png exists in public folder
const appleTouchIconPath = resolve(projectRoot, 'public/apple-touch-icon.png');
if (!fs.existsSync(appleTouchIconPath)) {
  const base64Data = 'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=';
  fs.writeFileSync(appleTouchIconPath, Buffer.from(base64Data, 'base64'));
}

const serviceWorkerVersionPlugin = () => {
  return {
    name: 'service-worker-version',
    closeBundle() {
      const swPath = resolve(projectRoot, 'dist/service-worker.js');
      if (fs.existsSync(swPath)) {
        let content = fs.readFileSync(swPath, 'utf8');
        const timestamp = Date.now().toString();
        content = content.replace('__BUILD_VERSION__', timestamp);
        fs.writeFileSync(swPath, content, 'utf8');
        console.log(`[service-worker-version-plugin] Replaced __BUILD_VERSION__ with ${timestamp}`);
      }
    }
  };
};

export default defineConfig(({ command }) => {
  const isServe = command === 'serve';

  return {
    root: projectRoot,
    cacheDir: resolve(projectRoot, '.vite-cache'),
    plugins: [react(), serviceWorkerVersionPlugin()],
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
      proxy: {
        '/api': {
          target: 'http://127.0.0.1:3001',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    preview: {
      host: '127.0.0.1',
      port: 4173,
    },
  };
});
