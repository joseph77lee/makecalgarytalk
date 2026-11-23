/** The app's invites store, wired to Supabase, the page link and the phone's share sheet. */
import { getSupabaseClient, readSupabaseConfig } from '../common';
import { inviteCodeFromSearch, withoutInvite } from './inviteText';
import { createInvitesStore } from './store';

function safeStorage(): Storage | null {
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

const linkCode = inviteCodeFromSearch(window.location.search);
/** The page was opened from an invite link (analytics). */
export const arrivedByInvite = linkCode !== null;
// Keep the address bar clean (and avoid re-sharing someone else's code by copying it).
if (linkCode) window.history.replaceState(null, '', withoutInvite(window.location.href));

export const useInvites = createInvitesStore({
  getClient: () => {
    const cfg = readSupabaseConfig();
    return cfg.ok ? getSupabaseClient(cfg.config) : null;
  },
  storage: safeStorage(),
  linkCode,
  origin: window.location.origin,
  shareEnv: () => ({
    share: typeof navigator.share === 'function' ? (d) => navigator.share(d) : undefined,
    copy: navigator.clipboard ? (t) => navigator.clipboard.writeText(t) : undefined,
  }),
});
