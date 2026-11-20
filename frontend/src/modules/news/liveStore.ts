/** The app's newspaper store, wired to Supabase. */
import { getSupabaseClient, readSupabaseConfig } from '../common';
import { createNewsStore } from './store';

export const useNews = createNewsStore({
  getClient: () => {
    const cfg = readSupabaseConfig();
    return cfg.ok ? getSupabaseClient(cfg.config) : null;
  },
});
