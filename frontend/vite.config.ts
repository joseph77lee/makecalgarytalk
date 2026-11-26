/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { mkdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { defineConfig, type Plugin } from 'vite';

/**
 * Dev server only: saves the build map pictures printed at `?pictures` (requirement v1.48 §7.6a)
 * into public/. Only `places/<key>.png` and `islands/finished/<CODE>.webp` paths are accepted.
 */
function savePictures(): Plugin {
  const allowed = /^(places\/[a-z0-9.-]+\.png|islands\/finished\/[A-Z0-9]{2,4}\.webp)$/;
  return {
    name: 'save-pictures',
    apply: 'serve',
    configureServer(server) {
      server.middlewares.use('/__dev/save-picture', (req, res) => {
        let body = '';
        req.on('data', (c: Buffer) => (body += c.toString()));
        req.on('end', () => {
          try {
            const { path, dataUrl } = JSON.parse(body) as { path: string; dataUrl: string };
            if (req.method !== 'POST' || !allowed.test(path)) throw new Error(`refused: ${path}`);
            const out = resolve(__dirname, 'public', path);
            mkdirSync(dirname(out), { recursive: true });
            writeFileSync(out, Buffer.from(dataUrl.split(',')[1] ?? '', 'base64'));
            res.end('ok');
          } catch (e) {
            res.statusCode = 400;
            res.end(String(e));
          }
        });
      });
    },
  };
}

// `npm run dev:phone` (mode "phone", dev only): HTTPS with a self-signed certificate on the local
// network so a phone on the same Wi-Fi can use its GPS (browsers allow location only on https).
// Supabase is reached through this server (/supabase → local API; the npm script sets
// VITE_SUPABASE_URL=/supabase), so the page stays https.
const LOCAL_SUPABASE = 'http://127.0.0.1:55421';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), savePictures(), ...(mode === 'phone' ? [basicSsl()] : [])],
  server: {
    // The building tree is shared data in supabase/data (single source with the gamecore seed).
    fs: { allow: ['..'] },
    ...(mode === 'phone'
      ? {
          host: true,
          proxy: { '/supabase': { target: LOCAL_SUPABASE, changeOrigin: true, rewrite: (path: string) => path.replace(/^\/supabase/, '') } },
        }
      : {}),
  },
  test: {
    environment: 'node',
    include: ['src/**/*.test.{ts,tsx}'],
  },
}));
