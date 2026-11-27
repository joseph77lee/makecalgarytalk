/** The app's today's-question store, wired to Supabase and this device's storage. */
import { getSupabaseClient, readSupabaseConfig } from '../common';
import { createQuestionStore } from './store';

const KEY = 'mct.question.closedDay';

export const useQuestion = createQuestionStore({
  getClient: () => {
    const cfg = readSupabaseConfig();
    return cfg.ok ? getSupabaseClient(cfg.config) : null;
  },
  readClosedDay: () => {
    try {
      return window.localStorage.getItem(KEY);
    } catch {
      return null;
    }
  },
  writeClosedDay: (day) => {
    try {
      window.localStorage.setItem(KEY, day);
    } catch {
      // storage blocked: the card may pop up again today, which is harmless
    }
  },
});
