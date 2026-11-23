/** Weekly ranking, fetched on demand and kept for a few minutes (the server caches it too). */
import type { SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';
import { fetchWeeklyRanking, type WeeklyRanking } from './api';

const KEEP_MS = 3 * 60 * 1000;

export interface RankingState {
  data: WeeklyRanking | null;
  loading: boolean;
  error: string | null;
  loadedAt: number;
  load: (opts?: { force?: boolean }) => Promise<void>;
}

export function createRankingStore(deps: { getClient: () => SupabaseClient | null; now?: () => number }) {
  const now = deps.now ?? (() => Date.now());
  return create<RankingState>((set, get) => ({
    data: null,
    loading: false,
    error: null,
    loadedAt: 0,
    async load(opts) {
      const s = get();
      if (s.loading || (!opts?.force && s.data && now() - s.loadedAt < KEEP_MS)) return;
      set({ loading: true, error: null });
      try {
        const c = deps.getClient();
        if (!c) throw new Error('Supabase is not configured');
        set({ data: await fetchWeeklyRanking(c), loading: false, loadedAt: now() });
      } catch (e) {
        set({ loading: false, error: e instanceof Error ? e.message : String(e) });
      }
    },
  }));
}
