/** The app's daily-actions store, wired to Supabase, the avatar and the island. */
import { getSupabaseClient, readSupabaseConfig } from '../common';
import { moveTo, playWork, useAvatarStore } from '../avatar';
import { buildIslandLayout, buildingSiteTile, celebrateIsland, loadIslandPlan } from '../island-view';
import { playSound, workSound } from '../sound';
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
  // Identity (M6) signs the player in before this store starts.
  ensureSession: async (client) => {
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
  loadPlan: loadIslandPlan,
  siteTile: (plan, view, key) => buildingSiteTile(buildIslandLayout(plan, view), key),
  onHelped: (site, buildingKey) => {
    playWork(site);
    celebrateIsland(1200);
    // the work sound for what is built, then the success chime (§10.5)
    const work = workSound(buildingKey);
    playSound(work, work === 'construction-hammer-roof' ? { offset: 2, duration: 1.1 } : {});
    playSound('ui-confirm', { delay: 0.9 });
  },
  feedback: (kind) => playSound(kind === 'tap' ? 'ui-select' : 'ui-error'),
  randomId: () => crypto.randomUUID(),
  now: () => new Date(),
  setTimer: (fn, ms) => setTimeout(fn, ms),
  clearTimer: (h) => clearTimeout(h as ReturnType<typeof setTimeout>),
  storage: safeStorage(),
});
