/** The app's ranking store, wired to Supabase. */
import { getSupabaseClient, readSupabaseConfig } from '../common';
import { createRankingStore } from './store';

export const useRanking = createRankingStore({
  getClient: () => {
    const cfg = readSupabaseConfig();
    return cfg.ok ? getSupabaseClient(cfg.config) : null;
  },
});
