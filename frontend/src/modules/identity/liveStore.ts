/** The app's identity store, wired to Supabase and Cloudflare Turnstile. */
import { getSupabaseClient, readSupabaseConfig } from '../common';
import { devUserFromSearch } from './devSession';
import { createIdentityStore } from './store';
import { getTurnstileToken } from './turnstile';

export const TURNSTILE_SITE_KEY: string = import.meta.env.VITE_TURNSTILE_SITE_KEY ?? '';
export const GOOGLE_LINKING = import.meta.env.VITE_GOOGLE_LINKING === 'true';

export const useIdentity = createIdentityStore({
  getClient: () => {
    const cfg = readSupabaseConfig();
    return cfg.ok ? getSupabaseClient(cfg.config) : null;
  },
  captcha: () => {
    if (!TURNSTILE_SITE_KEY) return Promise.reject(new Error('VITE_TURNSTILE_SITE_KEY is missing (see frontend/.env.example).'));
    return getTurnstileToken(TURNSTILE_SITE_KEY);
  },
  devUser: import.meta.env.DEV ? devUserFromSearch(window.location.search) : null,
  redirectTo: () => window.location.origin + window.location.pathname,
});
