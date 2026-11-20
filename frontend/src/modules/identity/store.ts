/**
 * Identity session (requirement.md §6.1): an anonymous account on the first visit (after a
 * Turnstile check), the first-visit example and profile setup, optional Google linking.
 * Dependencies are injected so the flow can be tested with fakes.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';
import { identityApi, type Profile, type ServerIdentity } from './api';
import { isDevSession, signInDevUser, type DevUser } from './devSession';
import { NICKNAME_MESSAGES } from './nickname';

export type IdentityStatus = 'loading' | 'no-config' | 'example' | 'setup' | 'ready' | 'error';

export interface IdentityDeps {
  getClient: () => SupabaseClient | null;
  /** One Turnstile token (single use). */
  captcha: () => Promise<string>;
  /** Dev builds only: sign in as a seeded dev user instead of anonymously. */
  devUser: DevUser | null;
  /** Where Google sends the player back (the app's URL). */
  redirectTo: () => string;
}

export interface IdentityState {
  status: IdentityStatus;
  error: string | null;
  isAnonymous: boolean;
  profile: Profile | null;
  changesSeenToday: boolean;
  init: () => Promise<void>;
  /** First visit: example seen → profile setup. */
  continueToSetup: () => void;
  /** Returns an error message to show, or null when saved. */
  saveProfile: (nickname: string, shirt: number) => Promise<string | null>;
  markChangesSeen: () => void;
  linkGoogle: () => Promise<string | null>;
  signInWithGoogle: () => Promise<string | null>;
}

const SAVE_MESSAGES = { ...NICKNAME_MESSAGES, shirt: 'Please pick a shirt colour.' } as const;

export function createIdentityStore(deps: IdentityDeps) {
  const client = (): SupabaseClient => {
    const c = deps.getClient();
    if (!c) throw new Error('Supabase is not configured');
    return c;
  };

  return create<IdentityState>((set, get) => {
    const apply = (s: ServerIdentity) =>
      set({ isAnonymous: s.is_anonymous, profile: s.profile, changesSeenToday: s.changes_seen_today });

    return {
      status: 'loading',
      error: null,
      isAnonymous: true,
      profile: null,
      changesSeenToday: false,

      async init() {
        try {
          const c = deps.getClient();
          if (!c) return set({ status: 'no-config' });
          set({ status: 'loading', error: null });
          if (deps.devUser) {
            if (!(await isDevSession(c, deps.devUser))) await signInDevUser(c, deps.devUser, await deps.captcha());
          } else {
            const { data } = await c.auth.getSession();
            if (!data.session) {
              const { error } = await c.auth.signInAnonymously({ options: { captchaToken: await deps.captcha() } });
              if (error) throw new Error(error.message);
            }
          }
          const me = await identityApi.getProfile(c);
          apply(me);
          // No profile yet = first visit: the finished example, then setup (§5.1).
          set({ status: me.profile ? 'ready' : 'example' });
        } catch (e) {
          set({ status: 'error', error: e instanceof Error ? e.message : String(e) });
        }
      },

      continueToSetup() {
        if (get().status === 'example') set({ status: 'setup' });
      },

      async saveProfile(nickname, shirt) {
        try {
          const r = await identityApi.saveProfile(client(), nickname, shirt);
          if (!r.ok) return SAVE_MESSAGES[r.problem];
          apply(r);
          set({ status: 'ready' });
          return null;
        } catch (e) {
          return e instanceof Error ? e.message : String(e);
        }
      },

      markChangesSeen() {
        if (get().changesSeenToday) return;
        set({ changesSeenToday: true });
        identityApi.markChangesSeen(client()).catch(() => {
          // Not critical: the panel may show once more on the next visit.
        });
      },

      async linkGoogle() {
        const { error } = await client().auth.linkIdentity({ provider: 'google', options: { redirectTo: deps.redirectTo() } });
        if (!error) return null;
        return /already|exists/i.test(error.message)
          ? 'This Google account already has a MakeCalgaryTalk record. Use "Sign in with Google" to continue with it.'
          : error.message;
      },

      async signInWithGoogle() {
        const { error } = await client().auth.signInWithOAuth({ provider: 'google', options: { redirectTo: deps.redirectTo() } });
        return error ? error.message : null;
      },
    };
  });
}
