/** The app's daily-actions store, wired to Supabase, the avatar and the island. */
import { getSupabaseClient, readSupabaseConfig } from '../common';
import { moveTo, playWork, useAvatarStore } from '../avatar';
import { celebrateIsland, projectSiteTile } from '../island-view';
import { ensureDevSession } from './devSession';
import { playHelpSound } from './sound';
import { createDailyActionsStore } from './store';

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export const useDailyActions = createDailyActionsStore({
  getClient: () => {
    const cfg = readSupabaseConfig();
    return cfg.ok ? getSupabaseClient(cfg.config) : null;
  },
  ensureSession: async (client) => {
    if (import.meta.env.DEV) {
      await ensureDevSession(client, window.location.search);
      return true;
    }
    // Production sign-in arrives with Identity (M6).
    const { data } = await client.auth.getSession();
    return data.session !== null;
  },
  moveTo,
  whenArrived: (seq, cb, timeoutMs) => {
    let done = false;
    const finish = () => {
      if (done) return;
      done = true;
      unsubscribe();
      clearTimeout(timer);
      cb();
    };
    const unsubscribe = useAvatarStore.subscribe((s) => {
      if (s.arrival?.seq === seq) finish();
    });
    const timer = setTimeout(finish, timeoutMs);
  },
  siteTile: projectSiteTile,
  onHelped: (site) => {
    playWork(site);
    celebrateIsland(1200);
    playHelpSound();
  },
  randomId: () => crypto.randomUUID(),
  now: () => new Date(),
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
  storage: safeStorage(),
});
