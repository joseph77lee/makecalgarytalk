import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { parseCommunityViewState } from '../island-view';
import {
  MAX_BATCH,
  applyResult,
  batchFailed,
  canAct,
  energyShown,
  enqueue,
  initialQueue,
  syncEnergy,
  takeBatch,
  type QueueState,
} from './actionQueue';
import { ApiError, assertCommunityState, type ServerCommunityState, type ServerSubmitResult } from './api';
import { devUserFromSearch } from './devSession';
import { filterCommunities } from './filterCommunities';
import { ARRIVAL_TIMEOUT_MS, MIDNIGHT_GRACE_MS, RETRY_DELAYS, createDailyActionsStore, type DailyActionsDeps } from './store';
import { toViewState } from './toViewState';

const DAY = '2026-12-01';
const NEXT = '2026-12-02T06:00:00+00:00';

function serverState(patch: Partial<ServerCommunityState> = {}): ServerCommunityState {
  return {
    calgary_day: DAY,
    next_day_start: NEXT,
    community: { id: 'c1', code: 'MAH', name: 'Mahogany', sector: 'Southeast', population: 13860 },
    projects: [
      { id: 'p1', seq: 4, kind: 'snowman-garden', title: 'Build a snowman garden', level: 1, required: 20, progress: 12, stage: 'frame' },
      { id: 'p2', seq: 5, kind: 'lantern-street', title: 'Light up a lantern street', level: 1, required: 20, progress: 0, stage: 'scaffolding' },
      { id: 'p3', seq: 7, kind: 'ice-rink', title: 'Build an ice rink', level: 2, required: 25, progress: 30, stage: 'frame' },
    ],
    completed_projects: [
      { id: 'c-1', seq: 1, kind: 'ice-rink', title: 'Build an ice rink', level: 1, completed_on: '2026-11-20' },
      { id: 'c-2', seq: 2, kind: 'flower-path', title: 'Make a flower path', level: 1, completed_on: '2026-11-22' },
    ],
    me: { member: true, energy_max: 3, energy_left: 3 },
    ...patch,
  };
}

const result = (energyLeft: number, results: ServerSubmitResult['results'], day = DAY): ServerSubmitResult => ({
  calgary_day: day,
  next_day_start: NEXT,
  energy_max: 3,
  energy_left: energyLeft,
  results,
});

describe('toViewState', () => {
  it('maps server projects to island construction sites (progress as a fraction, capped)', () => {
    const v = toViewState(serverState());
    expect(v.projects.map((p) => [p.id, p.kind, p.stage, p.progress, p.level])).toEqual([
      ['p1', 'snowman-garden', 'frame', 0.6, 1],
      ['p2', 'lantern-street', 'scaffolding', 0, 1],
      ['p3', 'ice-rink', 'frame', 1, 2],
    ]);
  });

  it('shows one miniature per completed kind at its highest level', () => {
    const v = toViewState(
      serverState({
        completed_projects: [
          { id: 'a', seq: 1, kind: 'ice-rink', title: 'x', level: 1, completed_on: DAY },
          { id: 'b', seq: 7, kind: 'ice-rink', title: 'x', level: 2, completed_on: DAY },
          { id: 'c', seq: 2, kind: 'flower-path', title: 'x', level: 1, completed_on: DAY },
        ],
      }),
    );
    expect(v.showcase).toEqual([
      { kind: 'ice-rink', level: 2 },
      { kind: 'flower-path', level: 1 },
    ]);
  });

  it('uses neutral placeholders for what M5/M8 will provide (no fake numbers)', () => {
    const v = toViewState(serverState());
    expect(v.vitality).toBeNull();
    expect(v.houses).toEqual([]);
    expect(Object.values(v.buildings).every((b) => !b.unlocked && b.remaining === null)).toBe(true);
  });

  it('always produces a state the island accepts', () => {
    const r = parseCommunityViewState(toViewState(serverState()));
    expect(r.ok ? [] : r.errors).toEqual([]);
  });
});

describe('assertCommunityState', () => {
  it('accepts a valid state', () => {
    expect(() => assertCommunityState(serverState())).not.toThrow();
  });
  it('rejects unknown project kinds (frontend models missing)', () => {
    const bad = serverState();
    (bad.projects[0] as { kind: string }).kind = 'castle';
    expect(() => assertCommunityState(bad)).toThrow(/unknown project kind 'castle'/);
  });
  it('rejects broken numbers', () => {
    const bad = serverState();
    bad.projects[0].required = 0;
    expect(() => assertCommunityState(bad)).toThrow(ApiError);
  });
});

describe('action queue (optimistic energy)', () => {
  it('shows server energy minus unconfirmed actions and stops at 0', () => {
    let q = initialQueue(3, 3, DAY);
    q = enqueue(q, 'a', 'p1');
    q = enqueue(q, 'b', 'p1');
    expect(energyShown(q)).toBe(1);
    q = enqueue(q, 'c', 'p2');
    expect(canAct(q)).toBe(false);
    expect(enqueue(q, 'd', 'p2')).toBe(q); // a 4th tap does nothing
  });

  it('accepted and duplicate count as today\'s help; rejected rolls back', () => {
    let q = initialQueue(3, 3, DAY);
    q = enqueue(enqueue(enqueue(q, 'a', 'p1'), 'b', 'p1'), 'c', 'p2');
    const { q: sending, batch } = takeBatch(q);
    expect(batch.map((b) => b.id)).toEqual(['a', 'b', 'c']);
    const { q: done, feedback } = applyResult(
      sending,
      batch,
      result(1, [
        { id: 'a', status: 'accepted' },
        { id: 'b', status: 'duplicate' },
        { id: 'c', status: 'rejected', reason: 'project_not_active' },
      ]),
    );
    expect(done.today).toEqual({ p1: 2 });
    expect(done.pending).toEqual([]);
    expect(energyShown(done)).toBe(1); // server truth
    expect(feedback.rejected).toEqual([{ id: 'c', projectId: 'p2', reason: 'project_not_active' }]);
  });

  it('a network failure keeps the same ids for the retry', () => {
    let q = enqueue(initialQueue(3, 3, DAY), 'a', 'p1');
    const first = takeBatch(q);
    q = batchFailed(first.q, first.batch);
    expect(energyShown(q)).toBe(2); // still optimistic
    const second = takeBatch(q);
    expect(second.batch.map((b) => b.id)).toEqual(['a']);
  });

  it('never sends more than the server batch limit at once', () => {
    let q = initialQueue(50, 50, DAY);
    for (let i = 0; i < 15; i++) q = enqueue(q, `id${i}`, 'p1');
    expect(takeBatch(q).batch).toHaveLength(MAX_BATCH);
  });

  it('actions already sending are not sent twice', () => {
    const q = enqueue(enqueue(initialQueue(3, 3, DAY), 'a', 'p1'), 'b', 'p1');
    const first = takeBatch(q);
    expect(takeBatch(first.q).batch).toEqual([]);
  });

  it('a new Calgary day resets today\'s counts', () => {
    let q: QueueState = { ...initialQueue(3, 3, DAY), today: { p1: 2 } };
    q = syncEnergy(q, 3, 3, '2026-12-02');
    expect(q.today).toEqual({});
    const same = syncEnergy({ ...initialQueue(1, 3, DAY), today: { p1: 2 } }, 1, 3, DAY);
    expect(same.today).toEqual({ p1: 2 });
    const { q: after } = applyResult(
      { ...takeBatch(enqueue({ ...initialQueue(3, 3, DAY), today: { p9: 1 } }, 'x', 'p1')).q },
      [{ id: 'x', projectId: 'p1', sending: true }],
      result(2, [{ id: 'x', status: 'accepted' }], '2026-12-02'),
    );
    expect(after.today).toEqual({ p1: 1 }); // the action counted for the new day only
  });
});

describe('filterCommunities', () => {
  const list = [
    { id: '1', code: 'MAH', name: 'Mahogany', sector: 'Southeast', population: 1 },
    { id: '2', code: 'MKT', name: 'McKenzie Towne', sector: 'Southeast', population: 1 },
    { id: '3', code: 'BEL', name: 'Bel-Aire', sector: 'Centre', population: 1 },
  ];
  it('matches name parts case-insensitively, or the exact code', () => {
    expect(filterCommunities(list, 'mck').map((c) => c.code)).toEqual(['MKT']);
    expect(filterCommunities(list, 'MAH').map((c) => c.code)).toEqual(['MAH']);
    expect(filterCommunities(list, '  ')).toHaveLength(3);
    expect(filterCommunities(list, 'zzz')).toEqual([]);
  });
});

describe('dev session', () => {
  it('picks the second dev user only with ?devuser=2', () => {
    expect(devUserFromSearch('')).toBe('1');
    expect(devUserFromSearch('?devuser=2')).toBe('2');
    expect(devUserFromSearch('?devuser=7')).toBe('1');
  });
});

// --- Store flow with fakes ----------------------------------------------------------

function setup(opts: { me?: { community_id: string | null }; submit?: (actions: unknown) => Promise<ServerSubmitResult>; state?: ServerCommunityState } = {}) {
  let state = opts.state ?? serverState();
  const rpc = vi.fn(async (fn: string, args: Record<string, unknown>) => {
    switch (fn) {
      case 'gamecore_get_me':
        return { data: { calgary_day: DAY, next_day_start: NEXT, community_id: opts.me ? opts.me.community_id : 'c1', energy_max: 3, energy_left: 3 }, error: null };
      case 'gamecore_list_communities':
        return { data: [{ id: 'c1', code: 'MAH', name: 'Mahogany', sector: 'Southeast', population: 1 }], error: null };
      case 'gamecore_choose_community':
        return { data: { community_id: args.p_community_id }, error: null };
      case 'gamecore_get_community_state':
        return { data: state, error: null };
      case 'gamecore_submit_actions':
        try {
          return { data: await (opts.submit ?? (async () => result(2, [])))(args.p_actions), error: null };
        } catch (e) {
          return { data: null, error: { message: (e as Error).message, code: 'NET' } };
        }
      default:
        throw new Error(`unexpected rpc ${fn}`);
    }
  });
  const timers: { fn: () => void; ms: number }[] = [];
  const arrivals: (() => void)[] = [];
  const helped: unknown[] = [];
  let ids = 0;
  const store: Map<string, string> = new Map();
  const deps: DailyActionsDeps = {
    getClient: () => ({ rpc }) as unknown as SupabaseClient,
    ensureSession: async () => true,
    moveTo: vi.fn(() => ({ seq: 1 })),
    whenArrived: (_seq, cb) => arrivals.push(cb),
    siteTile: (i) => ({ x: i, z: 0 }),
    onHelped: (site) => helped.push(site),
    randomId: () => `id-${++ids}`,
    now: () => new Date('2026-12-01T20:00:00Z'),
    setTimer: (fn, ms) => timers.push({ fn, ms }),
    clearTimer: () => {},
    storage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => void store.set(k, v) },
  };
  const useStore = createDailyActionsStore(deps);
  return { useStore, rpc, timers, arrivals, helped, deps, storage: store, setState: (s: ServerCommunityState) => (state = s) };
}

const settle = () => new Promise((r) => setTimeout(r, 0));

describe('daily actions store', () => {
  it('loads the player community and schedules a refresh just after Calgary midnight', async () => {
    const t = setup();
    await t.useStore.getState().init();
    expect(t.useStore.getState().status).toBe('ready');
    expect(t.useStore.getState().view?.communityName).toBe('Mahogany');
    // now = 20:00Z, next day starts 06:00Z → 10 h later (+ grace)
    expect(t.timers.at(-1)?.ms).toBe(10 * 3600_000 + MIDNIGHT_GRACE_MS);
  });

  it('asks to choose a community when the player has none', async () => {
    const t = setup({ me: { community_id: null } });
    await t.useStore.getState().init();
    expect(t.useStore.getState().status).toBe('pick-community');
    await t.useStore.getState().chooseCommunity('c1');
    expect(t.useStore.getState().status).toBe('ready');
  });

  it('a tap spends energy at once, walks the avatar, and sends after arrival', async () => {
    const sent: unknown[] = [];
    const t = setup({ submit: async (a) => (sent.push(a), result(2, [{ id: 'id-1', status: 'accepted' }])) });
    await t.useStore.getState().init();
    t.useStore.getState().act(1);
    expect(energyShown(t.useStore.getState().queue!)).toBe(2);
    expect(t.deps.moveTo).toHaveBeenCalledWith({ x: 1, z: 0 });
    expect(sent).toEqual([]); // not before arrival
    t.arrivals[0]();
    await settle();
    expect(sent).toEqual([[{ id: 'id-1', project_id: 'p2' }]]);
    expect(t.helped).toEqual([{ x: 1, z: 0 }]);
    expect(t.useStore.getState().queue?.today).toEqual({ p2: 1 });
  });

  it('a rejected action rolls back and tells the player why', async () => {
    const t = setup({ submit: async () => result(3, [{ id: 'id-1', status: 'rejected', reason: 'no_energy' }]) });
    await t.useStore.getState().init();
    t.useStore.getState().act(0);
    t.arrivals[0]();
    await settle();
    expect(energyShown(t.useStore.getState().queue!)).toBe(3);
    expect(t.useStore.getState().toast?.text).toBe("You're out of energy for today.");
  });

  it('a network failure retries later with the same id', async () => {
    let calls = 0;
    const seen: string[] = [];
    const t = setup({
      submit: async (a) => {
        seen.push((a as { id: string }[])[0].id);
        calls += 1;
        if (calls === 1) throw new Error('offline');
        return result(2, [{ id: 'id-1', status: 'accepted' }]);
      },
    });
    await t.useStore.getState().init();
    t.useStore.getState().act(0);
    t.arrivals[0]();
    await settle();
    expect(energyShown(t.useStore.getState().queue!)).toBe(2); // still shown as spent
    const retry = t.timers.find((x) => x.ms === RETRY_DELAYS[0]);
    expect(retry).toBeDefined();
    retry!.fn();
    await settle();
    expect(seen).toEqual(['id-1', 'id-1']);
    expect(t.useStore.getState().queue?.pending).toEqual([]);
  });

  it('unsent actions survive a reload and are sent again', async () => {
    const t = setup({ submit: async () => { throw new Error('offline'); } });
    await t.useStore.getState().init();
    t.useStore.getState().act(0);
    expect(JSON.parse(t.storage.get('mct.pendingActions.v1') ?? '[]')).toEqual([{ id: 'id-1', projectId: 'p1' }]);

    // "Reload": a new store reading the same storage.
    const sent: unknown[] = [];
    const t2 = setup({ submit: async (a) => (sent.push(a), result(2, [{ id: 'id-1', status: 'accepted' }])) });
    t2.storage.set('mct.pendingActions.v1', t.storage.get('mct.pendingActions.v1')!);
    await t2.useStore.getState().init();
    await settle();
    expect(sent).toEqual([[{ id: 'id-1', project_id: 'p1' }]]);
  });

  it('"+N today" survives a reload on the same Calgary day, but not the next day', async () => {
    const t = setup({ submit: async () => result(2, [{ id: 'id-1', status: 'accepted' }]) });
    await t.useStore.getState().init();
    t.useStore.getState().act(0);
    t.arrivals[0]();
    await settle();
    const saved = t.storage.get('mct.todayHelp.v1')!;

    const sameDay = setup();
    sameDay.storage.set('mct.todayHelp.v1', saved);
    await sameDay.useStore.getState().init();
    expect(sameDay.useStore.getState().queue?.today).toEqual({ p1: 1 });

    const nextDay = setup({ state: serverState({ calgary_day: '2026-12-02' }) });
    nextDay.storage.set('mct.todayHelp.v1', saved);
    await nextDay.useStore.getState().init();
    expect(nextDay.useStore.getState().queue?.today).toEqual({});
  });

  it('without energy a tap only explains when energy returns', async () => {
    const t = setup({ state: serverState({ me: { member: true, energy_max: 3, energy_left: 0 } }) });
    await t.useStore.getState().init();
    t.useStore.getState().act(0);
    expect(t.deps.moveTo).not.toHaveBeenCalled();
    expect(t.useStore.getState().toast?.text).toBe('No energy left today. New energy in 10h 00m.');
  });

  it('the midnight refresh shows yesterday\'s help as progress and restores energy', async () => {
    const t = setup({ state: serverState({ me: { member: true, energy_max: 3, energy_left: 0 } }) });
    await t.useStore.getState().init();
    const next = serverState({
      calgary_day: '2026-12-02',
      next_day_start: '2026-12-03T06:00:00+00:00',
      me: { member: true, energy_max: 3, energy_left: 3 },
    });
    next.projects[0].progress = 15;
    t.setState(next);
    t.timers.at(-1)!.fn();
    await settle();
    expect(t.useStore.getState().view?.projects[0].progress).toBe(0.75);
    expect(energyShown(t.useStore.getState().queue!)).toBe(3);
  });

  it('a finished project triggers a refresh so the next project appears', async () => {
    const t = setup({ submit: async () => result(3, [{ id: 'id-1', status: 'rejected', reason: 'project_not_active' }]) });
    await t.useStore.getState().init();
    const before = t.rpc.mock.calls.filter((c) => c[0] === 'gamecore_get_community_state').length;
    t.useStore.getState().act(2);
    t.arrivals[0]();
    await settle();
    await settle();
    expect(t.rpc.mock.calls.filter((c) => c[0] === 'gamecore_get_community_state').length).toBe(before + 1);
  });

  it('exposes the arrival timeout used when the avatar never arrives', () => {
    expect(ARRIVAL_TIMEOUT_MS).toBeGreaterThan(0);
  });
});
