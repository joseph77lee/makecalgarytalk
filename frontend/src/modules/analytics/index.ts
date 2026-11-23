// Public API of the `analytics` module (M14). Other modules import ONLY from here.
import { getSupabaseClient, readSupabaseConfig } from '../common';
import { createTracker } from './track';

export { createTracker, type RpcClient, type ShareDetail } from './track';

/** The app's tracker, wired to Supabase. */
export const track = createTracker(() => {
  const cfg = readSupabaseConfig();
  return cfg.ok ? getSupabaseClient(cfg.config) : null;
});
