import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import type { ServerIdentity } from './api';
import { devUserFromSearch } from './devSession';
import { cleanNickname, nicknameHint, suggestNickname } from './nickname';
import { SHIRT_COLORS, shirtColor } from './shirts';
import { createIdentityStore, type IdentityDeps } from './store';

const me = (patch: Partial<ServerIdentity> = {}): ServerIdentity => ({
  calgary_day: '2026-12-01',
  is_anonymous: true,
  profile: null,
  changes_seen_today: false,
  ...patch,
});

function setup(opts: { session?: { user: { email?: string } } | null; identity?: ServerIdentity; save?: unknown; devUser?: IdentityDeps['devUser']; linkError?: string } = {}) {
  let session = opts.session ?? null;
  let identity = opts.identity ?? me();
  const auth = {
    getSession: vi.fn(async () => ({ data: { session } })),
    signInAnonymously: vi.fn(async (...args: unknown[]) => {
      void args;
      session = { user: {} };
      return { error: null };
    }),
    signInWithPassword: vi.fn(async (a: { email: string }) => {
      session = { user: { email: a.email } };
      return { error: null };
    }),
    signOut: vi.fn(async () => ({ error: null })),
    linkIdentity: vi.fn(async () => ({ error: opts.linkError ? { message: opts.linkError } : null })),
    signInWithOAuth: vi.fn(async () => ({ error: null })),
  };
  const rpc = vi.fn(async (fn: string, args: Record<string, unknown>) => {
    if (fn === 'identity_get_profile') return { data: identity, error: null };
    if (fn === 'identity_save_profile') {
      if (opts.save) return { data: opts.save, error: null };
      identity = me({ profile: { nickname: args.p_nickname as string, shirt: args.p_shirt as number } });
      return { data: { ok: true, ...identity }, error: null };
    }
    if (fn === 'identity_mark_changes_seen') return { data: me({ ...identity, changes_seen_today: true }), error: null };
    throw new Error(`unexpected rpc ${fn}`);
  });
  const captcha = vi.fn(async () => 'token-1');
  const useStore = createIdentityStore({
    getClient: () => ({ auth, rpc }) as unknown as SupabaseClient,
    captcha,
    devUser: opts.devUser ?? null,
    redirectTo: () => 'http://localhost:5180/',
  });
  return { useStore, auth, rpc, captcha };
}

describe('sign-in (requirement.md §6.1)', () => {
  it('a first visit creates an anonymous account after the bot check, without any form', async () => {
    const t = setup();
    await t.useStore.getState().init();
    expect(t.captcha).toHaveBeenCalledTimes(1);
    expect(t.auth.signInAnonymously).toHaveBeenCalledWith({ options: { captchaToken: 'token-1' } });
    expect(t.useStore.getState().status).toBe('example'); // no profile yet → first-visit example
  });

  it('a returning visitor keeps their session: no new account, no bot check', async () => {
    const t = setup({ session: { user: {} }, identity: me({ profile: { nickname: 'Snowy Moose', shirt: 3 } }) });
    await t.useStore.getState().init();
    expect(t.auth.signInAnonymously).not.toHaveBeenCalled();
    expect(t.captcha).not.toHaveBeenCalled();
    expect(t.useStore.getState()).toMatchObject({ status: 'ready', profile: { nickname: 'Snowy Moose', shirt: 3 } });
  });

  it('a failed bot check shows an error with retry', async () => {
    const t = setup();
    t.captcha.mockRejectedValueOnce(new Error('The bot check failed. Please try again.'));
    await t.useStore.getState().init();
    expect(t.useStore.getState()).toMatchObject({ status: 'error', error: 'The bot check failed. Please try again.' });
    await t.useStore.getState().init();
    expect(t.useStore.getState().status).toBe('example');
  });

  it('dev builds sign in as a seeded dev user only when asked (?devuser=1|2)', async () => {
    expect(devUserFromSearch('')).toBeNull();
    expect(devUserFromSearch('?devuser=2')).toBe('2');
    expect(devUserFromSearch('?devuser=7')).toBeNull();
    const t = setup({ devUser: '2' });
    await t.useStore.getState().init();
    expect(t.auth.signInWithPassword).toHaveBeenCalledWith(expect.objectContaining({ email: 'dev2@makecalgarytalk.local', options: { captchaToken: 'token-1' } }));
    expect(t.auth.signInAnonymously).not.toHaveBeenCalled();
  });
});

describe('first visit and profile', () => {
  it('example → setup → saved profile → ready', async () => {
    const t = setup();
    await t.useStore.getState().init();
    t.useStore.getState().continueToSetup();
    expect(t.useStore.getState().status).toBe('setup');
    expect(await t.useStore.getState().saveProfile('Snowy Moose 42', 4)).toBeNull();
    expect(t.useStore.getState()).toMatchObject({ status: 'ready', profile: { nickname: 'Snowy Moose 42', shirt: 4 } });
  });

  it('shows the server\'s reason when a nickname is not allowed', async () => {
    const t = setup({ save: { ok: false, problem: 'blocked' } });
    await t.useStore.getState().init();
    t.useStore.getState().continueToSetup();
    expect(await t.useStore.getState().saveProfile('Admin', 1)).toBe('Please choose a different nickname.');
    expect(t.useStore.getState().status).toBe('setup');
  });

  it('"What changed since yesterday" is marked seen once per account per day', async () => {
    const t = setup({ session: { user: {} }, identity: me({ profile: { nickname: 'Jo', shirt: 0 } }) });
    await t.useStore.getState().init();
    t.useStore.getState().markChangesSeen();
    t.useStore.getState().markChangesSeen();
    expect(t.useStore.getState().changesSeenToday).toBe(true);
    expect(t.rpc.mock.calls.filter((c) => c[0] === 'identity_mark_changes_seen')).toHaveLength(1);
  });
});

describe('Google linking (optional)', () => {
  it('links Google to the same account', async () => {
    const t = setup({ session: { user: {} } });
    expect(await t.useStore.getState().linkGoogle()).toBeNull();
    expect(t.auth.linkIdentity).toHaveBeenCalledWith({ provider: 'google', options: { redirectTo: 'http://localhost:5180/' } });
  });
  it('a Google account that already has a record suggests signing in with it instead', async () => {
    const t = setup({ session: { user: {} }, linkError: 'Identity is already linked to another user' });
    expect(await t.useStore.getState().linkGoogle()).toMatch(/Sign in with Google/);
  });
});

describe('nickname and shirt helpers', () => {
  it('suggested nicknames always fit the server rules', () => {
    for (let i = 0; i < 500; i++) {
      const n = suggestNickname();
      expect(nicknameHint(n)).toBeNull();
    }
    expect(suggestNickname(() => 0.999)).toMatch(/^\S+ \S+ \d{2}$/);
  });
  it('instant hints mirror the server length and character rules', () => {
    expect(cleanNickname('  Snowy   Moose ')).toBe('Snowy Moose');
    expect(nicknameHint('A')).toBe('length');
    expect(nicknameHint('Abcdefghijklmnopq')).toBe('length');
    expect(nicknameHint('눈사람')).toBeNull();
    expect(nicknameHint("Zoë O'Neil-B")).toBeNull();
    expect(nicknameHint('<b>hi</b>')).toBe('characters');
    expect(nicknameHint('...')).toBe('characters');
  });
  it('shirt colours: 8 like the server range, unknown → default', () => {
    expect(SHIRT_COLORS).toHaveLength(8);
    expect(shirtColor(3)).toBe(SHIRT_COLORS[3]);
    expect(shirtColor(null)).toBe(SHIRT_COLORS[0]);
    expect(shirtColor(42)).toBe(SHIRT_COLORS[0]);
  });
});
