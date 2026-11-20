/** Newspaper panel state: which community's paper is open and what it says. */
import type { SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';
import { fetchNewspaper, type Newspaper } from './api';

export interface NewsDeps {
  getClient: () => SupabaseClient | null;
}

export interface NewsState {
  open: boolean;
  loading: boolean;
  error: string | null;
  paper: Newspaper | null;
  show: (communityId: string) => Promise<void>;
  close: () => void;
}

export function createNewsStore(deps: NewsDeps) {
  return create<NewsState>((set) => ({
    open: false,
    loading: false,
    error: null,
    paper: null,
    async show(communityId) {
      set({ open: true, loading: true, error: null });
      try {
        const c = deps.getClient();
        if (!c) throw new Error('Supabase is not configured');
        set({ paper: await fetchNewspaper(c, communityId), loading: false });
      } catch (e) {
        set({ loading: false, error: e instanceof Error ? e.message : String(e) });
      }
    },
    close() {
      set({ open: false });
    },
  }));
}
