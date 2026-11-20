import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { assertInvites, type ServerInvites } from './api';
import {
  badgeText,
  inviteCodeFromSearch,
  inviteMessage,
  inviteNudge,
  inviteUrl,
  landingText,
  shareOutcomeText,
  welcomeGoal,
  withoutInvite,
} from './inviteText';
import { createInvitesStore, type ShareEnv } from './store';

const mine = (patch: Partial<ServerInvites> = {}): ServerInvites => ({
  code: 'K7QM2XPA',
  invited: 0,
  joined: 0,
  invited_by: null,
  badges: [],
  ...patch,
});

describe('invite texts', () => {
  it('reads plausible codes from the link only', () => {
    expect(inviteCodeFromSearch('?invite=k7qm-2xpa')).toBe('K7QM2XPA');
    expect(inviteCodeFromSearch('?devuser=1&invite=K7QM2XPA')).toBe('K7QM2XPA');
    expect(inviteCodeFromSearch('?invite=K7QM2XP0')).toBeNull(); // 0 is never used
    expect(inviteCodeFromSearch('?invite=<script>')).toBeNull();
    expect(inviteCodeFromSearch('')).toBeNull();
  });
  it('drops only the invite parameter from the address', () => {
    expect(withoutInvite('https://x.test/?invite=K7QM2XPA')).toBe('/');
    expect(withoutInvite('https://x.test/?devuser=1&invite=K7QM2XPA#a')).toBe('/?devuser=1#a');
  });
  it('builds links and share texts that name the community', () => {
    expect(inviteUrl('https://makecalgarytalk.com', 'K7QM2XPA')).toBe('https://makecalgarytalk.com/?invite=K7QM2XPA');
    expect(inviteMessage('Mahogany')).toMatch(/^Help me build Mahogany on MakeCalgaryTalk!/);
    expect(inviteMessage(null)).toMatch(/your Calgary community/);
  });
  it('landing banner', () => {
    expect(landingText({ nickname: 'Snowy Moose', community: 'Mahogany' })).toBe('Snowy Moose invited you to build Mahogany together');
    expect(landingText({ nickname: 'Snowy Moose', community: null })).toBe('Snowy Moose invited you to build your community together');
    expect(landingText({ nickname: null, community: 'Mahogany' })).toBe('A neighbour invited you to build Mahogany together');
  });
  it('badges', () => {
    expect(badgeText({ key: 'founding_resident', community: 'Acadia' })).toEqual({ icon: '🏅', title: 'Founding Resident', detail: 'First resident of Acadia' });
    expect(badgeText({ key: 'good_neighbour', count: 1 }).title).toBe('Good Neighbour');
    expect(badgeText({ key: 'good_neighbour', count: 3 }).title).toBe('Good Neighbour ×3');
    expect(badgeText({ key: 'pioneer_sponsor', count: 2 }).title).toBe('Pioneer Sponsor ×2');
  });
  it('welcome goal and share results', () => {
    expect(welcomeGoal(3)).toBe('3 more neighbours and the island grows.');
    expect(welcomeGoal(1)).toBe('One more neighbour and the island grows!');
    expect(welcomeGoal(null)).toMatch(/finish it together/);
    expect(shareOutcomeText('cancelled')).toBeNull();
    expect(shareOutcomeText('copied')).toMatch(/copied/);
  });
});

describe('invite nudges', () => {
  const none = { nextLandResidents: 5, closestBuildingResidents: null, closestBuildingTitle: null, builtSinceYesterday: null, landGrew: false };
  it('nudges only at good moments, the closest goal first', () => {
    expect(inviteNudge(none)).toBeNull();
    expect(inviteNudge({ ...none, nextLandResidents: 1 })).toBe('1 more neighbour and the island grows! Invite someone nearby.');
    expect(inviteNudge({ ...none, nextLandResidents: 2, closestBuildingResidents: 1, closestBuildingTitle: 'Skating rink' })).toMatch(/island grows/);
    expect(inviteNudge({ ...none, closestBuildingResidents: 2, closestBuildingTitle: 'Skating rink' })).toBe(
      '2 more neighbours and the Skating rink opens! Invite someone nearby.',
    );
    expect(inviteNudge({ ...none, closestBuildingResidents: 3, closestBuildingTitle: 'Skating rink' })).toBeNull();
    expect(inviteNudge({ ...none, landGrew: true, builtSinceYesterday: 'Fire pit' })).toMatch(/island grew/);
    expect(inviteNudge({ ...none, builtSinceYesterday: 'Fire pit' })).toBe('The Fire pit is built! Share it with your neighbours.');
    expect(inviteNudge({ ...none, nextLandResidents: null })).toBeNull();
  });
});

describe('invites API checks', () => {
  it('accepts valid data and rejects broken data', () => {
    expect(() => assertInvites(mine({ badges: [{ key: 'good_neighbour', count: 2 }, { key: 'founding_resident', community: 'Acadia' }] }))).not.toThrow();
    expect(() => assertInvites({ ...mine(), code: 'short' })).toThrow();
    expect(() => assertInvites({ ...mine(), badges: [{ key: 'mayor' }] })).toThrow();
    expect(() => assertInvites({ ...mine(), badges: [{ key: 'good_neighbour', count: 0 }] })).toThrow();
    expect(() => assertInvites({ ...mine(), invited: -1 })).toThrow();
  });
});

// --- Store flow with fakes ----------------------------------------------------------

function setup(opts: { linkCode?: string | null; stored?: Record<string, string>; acceptFails?: boolean; shareEnv?: ShareEnv } = {}) {
  const store = new Map(Object.entries(opts.stored ?? {}));
  const rpc = vi.fn(async (fn: string, args: Record<string, unknown>) => {
    switch (fn) {
      case 'invites_accept':
        if (opts.acceptFails) return { data: null, error: { message: 'offline' } };
        return { data: { ok: true }, error: null };
      case 'invites_get_mine':
        return { data: mine(), error: null };
      case 'invites_lookup':
        return { data: args.p_code === 'K7QM2XPA' ? { nickname: 'Snowy Moose', community: 'Mahogany' } : null, error: null };
      default:
        throw new Error(`unexpected rpc ${fn}`);
    }
  });
  const useStore = createInvitesStore({
    getClient: () => ({ rpc }) as unknown as SupabaseClient,
    storage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => void store.set(k, v), removeItem: (k) => void store.delete(k) },
    linkCode: opts.linkCode ?? null,
    origin: 'https://mct.test',
    shareEnv: () => opts.shareEnv ?? {},
  });
  return { useStore, rpc, store };
}

describe('invites store', () => {
  it('remembers the link code through the first visit, accepts it once signed in, then forgets it', async () => {
    const t = setup({ linkCode: 'K7QM2XPA' });
    expect(t.store.get('mct.inviteCode.v1')).toBe('K7QM2XPA');
    await t.useStore.getState().loadLanding();
    expect(t.useStore.getState().landing).toEqual({ nickname: 'Snowy Moose', community: 'Mahogany' });
    await t.useStore.getState().init();
    expect(t.rpc).toHaveBeenCalledWith('invites_accept', { p_code: 'K7QM2XPA' });
    expect(t.store.has('mct.inviteCode.v1')).toBe(false);
    expect(t.useStore.getState().mine?.code).toBe('K7QM2XPA');
  });
  it('a code saved earlier (reload during the first visit) is still accepted', async () => {
    const t = setup({ stored: { 'mct.inviteCode.v1': 'K7QM2XPA' } });
    await t.useStore.getState().init();
    expect(t.rpc).toHaveBeenCalledWith('invites_accept', { p_code: 'K7QM2XPA' });
  });
  it('keeps the code to retry when accepting fails (network)', async () => {
    const t = setup({ linkCode: 'K7QM2XPA', acceptFails: true });
    await t.useStore.getState().init();
    expect(t.store.get('mct.inviteCode.v1')).toBe('K7QM2XPA');
  });
  it('without an invite nothing is accepted', async () => {
    const t = setup();
    await t.useStore.getState().init();
    expect(t.rpc).not.toHaveBeenCalledWith('invites_accept', expect.anything());
  });
  it('shares with the share sheet, falls back to copying, and notices a cancel', async () => {
    const share = vi.fn(async () => {});
    const t1 = setup({ shareEnv: { share } });
    expect(await t1.useStore.getState().invite('Mahogany')).toBe('shared');
    expect(share).toHaveBeenCalledWith({ title: 'MakeCalgaryTalk', text: expect.stringContaining('Mahogany'), url: 'https://mct.test/?invite=K7QM2XPA' });

    const copy = vi.fn(async () => {});
    const t2 = setup({ shareEnv: { copy } });
    expect(await t2.useStore.getState().invite('Mahogany')).toBe('copied');
    expect(copy).toHaveBeenCalledWith(expect.stringContaining('https://mct.test/?invite=K7QM2XPA'));

    const abort = Object.assign(new Error('cancel'), { name: 'AbortError' });
    const t3 = setup({ shareEnv: { share: async () => Promise.reject(abort), copy } });
    expect(await t3.useStore.getState().invite('Mahogany')).toBe('cancelled');

    const t4 = setup({ shareEnv: {} });
    expect(await t4.useStore.getState().invite('Mahogany')).toBe('failed');
  });
  it('the × hides the invite button for one Calgary day; nudges once a day', () => {
    const t = setup({ stored: { 'mct.inviteHiddenDay.v1': '2026-12-01' } });
    expect(t.useStore.getState().hiddenDay).toBe('2026-12-01');
    t.useStore.getState().hideForDay('2026-12-02');
    expect(t.store.get('mct.inviteHiddenDay.v1')).toBe('2026-12-02');
    t.useStore.getState().markNudged('2026-12-02');
    expect(t.useStore.getState().nudgedDay).toBe('2026-12-02');
    expect(t.store.get('mct.inviteNudgedDay.v1')).toBe('2026-12-02');
  });
  it('the welcome card is remembered per community', () => {
    const t = setup({ stored: { 'mct.welcomed.v1': 'c-old' } });
    expect(t.useStore.getState().welcomedIds).toEqual(['c-old']);
    t.useStore.getState().markWelcomed('c-mah');
    t.useStore.getState().markWelcomed('c-mah');
    expect(t.useStore.getState().welcomedIds).toEqual(['c-old', 'c-mah']);
    expect(t.store.get('mct.welcomed.v1')).toBe('c-old,c-mah');
  });
});
