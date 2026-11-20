/// <reference types="vitest/config" />
import tailwindcss from '@tailwindcss/vite';
import basicSsl from '@vitejs/plugin-basic-ssl';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

// `npm run dev:phone` (mode "phone", dev only): HTTPS with a self-signed certificate on the local
// network so a phone on the same Wi-Fi can use its GPS (browsers allow location only on https).
// Supabase is reached through this server (/supabase → local API; the npm script sets
// VITE_SUPABASE_URL=/supabase), so the page stays https.
const LOCAL_SUPABASE = 'http://127.0.0.1:55421';

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(mode === 'phone' ? [basicSsl()] : [])],
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
