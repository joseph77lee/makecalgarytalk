/**
 * Invites session (requirement.md v1.25 §5.1, §12.3): remembers the invite code from the link,
 * accepts it once the player is signed in, loads my code, counts and badges, and shares links.
 * Dependencies are injected so the flow can be tested with fakes.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';
import { invitesApi, type InviteLanding, type ServerInvites } from './api';
import { inviteMessage, inviteUrl, startCommunityMessage, type ShareOutcome } from './inviteText';

export interface ShareEnv {
  share?: (data: { title: string; text: string; url: string }) => Promise<void>;
  copy?: (text: string) => Promise<void>;
}

export interface InvitesDeps {
  getClient: () => SupabaseClient | null;
  storage: Pick<Storage, 'getItem' | 'setItem' | 'removeItem'> | null;
  /** The code from this page's link (`?invite=`), already normalized, or null. */
  linkCode: string | null;
  origin: string;
  shareEnv: () => ShareEnv;
}

export interface InvitesState {
  mine: ServerInvites | null;
  landing: InviteLanding | null;
  /** Looks up who sent the link (works before sign-in). */
  loadLanding: () => Promise<void>;
  /** Signed in: accepts a remembered invite (once), then loads my invite data. */
  init: () => Promise<void>;
  reload: () => Promise<void>;
  /** Shares my invite link for my community, or (`start`) for a friend to start another community. */
  invite: (communityName: string | null, mode?: 'mine' | 'start') => Promise<ShareOutcome>;
  /** Communities whose welcome card was seen on this device (once per community). */
  welcomedIds: string[];
  markWelcomed: (communityId: string) => void;
  /** Calgary day on which the floating Invite button was hidden (×), shown again the next day. */
  hiddenDay: string | null;
  hideForDay: (calgaryDay: string) => void;
  /** Calgary day of the last nudge (at most one a day). */
  nudgedDay: string | null;
  markNudged: (calgaryDay: string) => void;
}

const PENDING_KEY = 'mct.inviteCode.v1';
const WELCOMED_KEY = 'mct.welcomed.v1';
const HIDDEN_KEY = 'mct.inviteHiddenDay.v1';
const NUDGED_KEY = 'mct.inviteNudgedDay.v1';

export function createInvitesStore(deps: InvitesDeps) {
  const read = (k: string): string | null => {
    try {
      return deps.storage?.getItem(k) ?? null;
    } catch {
      return null;
    }
  };
  const write = (k: string, v: string | null) => {
    try {
      if (v === null) deps.storage?.removeItem(k);
      else deps.storage?.setItem(k, v);
    } catch {
      // storage may be unavailable (private mode): then the invite lasts only for this page
    }
  };
  // Remember the link's code at once, so it survives the first-visit steps and reloads.
  if (deps.linkCode) write(PENDING_KEY, deps.linkCode);
  const pendingCode = () => deps.linkCode ?? read(PENDING_KEY);

  return create<InvitesState>((set, get) => ({
    mine: null,
    landing: null,
    welcomedIds: (read(WELCOMED_KEY) ?? '').split(',').filter(Boolean),
    hiddenDay: read(HIDDEN_KEY),
    nudgedDay: read(NUDGED_KEY),

    async loadLanding() {
      const code = pendingCode();
      const c = deps.getClient();
      if (!code || !c) return;
      try {
        set({ landing: await invitesApi.lookup(c, code) });
      } catch {
        // the banner is a nicety; the invite itself still works
      }
    },

    async init() {
      const c = deps.getClient();
      if (!c) return;
      const code = pendingCode();
      if (code) {
        try {
          await invitesApi.accept(c, code);
          // Accepted or refused for good (own code, already invited, too late): forget it either way.
          write(PENDING_KEY, null);
        } catch {
          // network problem: keep it and try again on the next start
        }
      }
      await get().reload();
    },

    async reload() {
      const c = deps.getClient();
      if (!c) return;
      try {
        set({ mine: await invitesApi.getMine(c) });
      } catch {
        // invite data is optional for playing; the profile shows nothing until it loads
      }
    },

    async invite(communityName, mode = 'mine') {
      if (!get().mine) await get().reload();
      const code = get().mine?.code;
      if (!code) return 'failed';
      const url = inviteUrl(deps.origin, code);
      const text = mode === 'start' && communityName ? startCommunityMessage(communityName) : inviteMessage(communityName);
      const env = deps.shareEnv();
      if (env.share) {
        try {
          await env.share({ title: 'MakeCalgaryTalk', text, url });
          return 'shared';
        } catch (e) {
          if ((e as { name?: string })?.name === 'AbortError') return 'cancelled';
          // fall back to copying
        }
      }
      if (env.copy) {
        try {
          await env.copy(`${text} ${url}`);
          return 'copied';
        } catch {
          return 'failed';
        }
      }
      return 'failed';
    },

    hideForDay(calgaryDay) {
      write(HIDDEN_KEY, calgaryDay);
      set({ hiddenDay: calgaryDay });
    },

    markNudged(calgaryDay) {
      write(NUDGED_KEY, calgaryDay);
      set({ nudgedDay: calgaryDay });
    },

    markWelcomed(communityId) {
      const list = get().welcomedIds;
      if (list.includes(communityId)) return;
      const next = [...list, communityId];
      write(WELCOMED_KEY, next.join(','));
      set({ welcomedIds: next });
    },
  }));
}
