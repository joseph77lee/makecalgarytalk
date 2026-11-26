import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { BUILDING_TREE, decodePlan, parseCommunityViewState } from '../island-view';
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
import { filterCommunities } from './filterCommunities';
import { ARRIVAL_TIMEOUT_MS, MIDNIGHT_GRACE_MS, RETRY_DELAYS, createDailyActionsStore, type DailyActionsDeps } from './store';
import { toViewState } from './toViewState';

const PLAN = decodePlan(JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../public/islands/MAH.json'), 'utf8')));
const DAY = '2026-12-01';
const NEXT = '2026-12-02T06:00:00+00:00';

/** Build-map fields the mapping does not use (requirement v1.48 §7.6). */
const STEP = { track: 'community' as const, step: 1, landmark_order: null, tiles: [3, 3] as [number, number], site: 'plaza' };

function serverState(patch: Partial<ServerCommunityState> = {}): ServerCommunityState {
  return {
    calgary_day: DAY,
    next_day_start: NEXT,
    community: { id: 'c1', code: 'MAH', name: 'Mahogany', sector: 'Southeast', population: 13860, residents: 4, land_stage: 1, settled: true, level: 1, persona: 'lake', vitality: 64, mini_villagers: 5, next_land_residents: 2 },
    buildings: [
      { ...STEP, key: 'welcome-sign', name: 'Welcome sign', stage: 1, status: 'built', level: 2, progress: 1, remaining: null },
      { ...STEP, key: 'fire-pit', name: 'Fire pit', stage: 1, status: 'building', level: 1, progress: 0.6, remaining: null },
      { ...STEP, key: 'frozen-pond', name: 'Frozen pond', stage: 1, status: 'building', level: 1, progress: 0, remaining: null },
      { ...STEP, key: 'gateway-arch', name: 'Gateway arch', stage: 2, status: 'building', level: 1, progress: 0.4, remaining: null },
      { ...STEP, key: 'playground', name: 'Playground', stage: 2, status: 'locked', level: 1, progress: 0, remaining: { residents: 0, streak_days: 3, land_residents: 0, requires: [] } },
      { ...STEP, key: 'warming-hut', name: 'Warming hut', stage: 2, status: 'locked', level: 1, progress: 0, remaining: { residents: 0, streak_days: 3, land_residents: 0, requires: ['fire-pit'] } },
    ],
    projects: [
      { id: 'p1', building_key: 'fire-pit', title: 'Fire pit', level: 1, required: 20, progress: 12, stage: 'frame' },
      { id: 'p2', building_key: 'frozen-pond', title: 'Frozen pond', level: 1, required: 20, progress: 0, stage: 'scaffolding' },
      { id: 'p3', building_key: 'gateway-arch', title: 'Gateway arch', level: 1, required: 25, progress: 10, stage: 'scaffolding' },
    ],
    streak: { days: 2, today: { acted: 1, active_residents: 4, needed: 2, attended: false } },
    changes: { actions: 0, progress: [], built: [], opened: [], new_residents: 0, land_grew: false, vitality_before: null },
    houses: [],
    hidden_houses: 0,
    today_actions: [],
    me: { member: true, pending: false, energy_max: 3, energy_left: 3, house_slot: null },
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

describe('toViewState (the server owns the building tree)', () => {
  it('copies each building\'s status, level and progress from the server', () => {
    const v = toViewState(serverState());
    const b = (key: string) => v.buildings.find((x) => x.key === key);
    expect(b('welcome-sign')).toMatchObject({ status: 'built', level: 2, progress: 1, title: 'Welcome sign', remaining: null });
    expect(b('fire-pit')).toMatchObject({ status: 'building', level: 1, progress: 0.6 });
    expect(v.buildings).toHaveLength(6); // nothing invented on the client
  });

  it('maps what a locked building is still missing (snake_case → camelCase)', () => {
    const v = toViewState(serverState());
    expect(v.buildings.find((x) => x.key === 'warming-hut')?.remaining).toEqual({ residents: 0, streakDays: 3, requires: ['fire-pit'] });
  });

  it('takes the land stage from the server and clamps it to the tiers this build knows', () => {
    expect(toViewState(serverState()).landStage).toBe(1);
    const big = serverState();
    big.community.land_stage = 99;
    expect(toViewState(big).landStage).toBe(BUILDING_TREE.landTiers.length - 1);
  });

  it('takes houses on their fixed lots, my house, the replay and overflow from the server', () => {
    const v = toViewState(
      serverState({
        houses: [
          { slot: 0, nickname: 'Dev One', active_today: false, founding: true },
          { slot: 3, nickname: 'Maple Fox', active_today: true, founding: false },
        ],
        hidden_houses: 2,
        today_actions: [{ nickname: 'Maple Fox', building_key: 'fire-pit', title: 'Fire pit' }],
        me: { member: true, pending: false, energy_max: 3, energy_left: 3, house_slot: 0 },
      }),
    );
    expect(v.houses).toEqual([
      { id: 'slot-0', slot: 0, nickname: 'Dev One', activeToday: false, founding: true, mine: true },
      { id: 'slot-3', slot: 3, nickname: 'Maple Fox', activeToday: true, founding: false, mine: false },
    ]);
    expect(v.extraResidents).toBe(2);
    expect(v.replay).toEqual([{ nickname: 'Maple Fox', title: 'Fire pit' }]);
    // I helped today: my window lights up before the next snapshot says so
    const lit = toViewState(serverState({ houses: [{ slot: 0, nickname: 'Dev One', active_today: false, founding: true }], me: { member: true, pending: false, energy_max: 3, energy_left: 2, house_slot: 0 } }), true);
    expect(lit.houses[0].activeToday).toBe(true);
  });

  it('takes Vitality and the villager count from the server', () => {
    const v = toViewState(serverState());
    expect(v.vitality).toBe(64);
    expect(v.miniVillagerCount).toBe(5);
    expect(v.houses).toEqual([]);
    const fresh = serverState();
    fresh.community.vitality = null;
    expect(toViewState(fresh).vitality).toBeNull(); // before the first finished day: normal mood
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
  it('accepts unknown building keys (drawn as placeholders) but not empty ones', () => {
    const odd = serverState();
    odd.buildings[0].key = 'castle';
    expect(() => assertCommunityState(odd)).not.toThrow();
    odd.buildings[0].key = '';
    expect(() => assertCommunityState(odd)).toThrow(/building key/);
  });
  it('rejects broken numbers and statuses', () => {
    const cases: ((s: ServerCommunityState) => void)[] = [
      (s) => (s.projects[0].required = 0),
      (s) => (s.projects[0].building_key = ''),
      (s) => (s.buildings[1].progress = 1.5),
      (s) => (s.buildings[1].level = 0),
      (s) => ((s.buildings[1] as { status: string }).status = 'ruined'),
      (s) => ((s.buildings[4].remaining as { streak_days: unknown }).streak_days = '3'),
      (s) => (s.community.land_stage = -1),
      (s) => (s.community.vitality = 101),
      (s) => (s.community.mini_villagers = -1),
      (s) => ((s.streak.today as { attended: unknown }).attended = 'yes'),
      (s) => delete (s as Partial<ServerCommunityState>).changes,
      (s) => ((s.changes as { built: unknown }).built = null),
      (s) => delete (s as Partial<ServerCommunityState>).buildings,
    ];
    for (const breakIt of cases) {
      const bad = serverState();
      breakIt(bad);
      expect(() => assertCommunityState(bad)).toThrow(ApiError);
    }
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



// --- Store flow with fakes ----------------------------------------------------------

function setup(opts: { me?: { community_id: string | null }; submit?: (actions: unknown) => Promise<ServerSubmitResult>; state?: ServerCommunityState } = {}) {
  let state = opts.state ?? serverState();
  let meCommunity: string | null = opts.me ? opts.me.community_id : 'c1';
  const rpc = vi.fn(async (fn: string, args: Record<string, unknown>) => {
    switch (fn) {
      case 'gamecore_get_me':
        return { data: { calgary_day: DAY, next_day_start: NEXT, community_id: meCommunity, pending: false, energy_max: 3, energy_left: 3, house_slot: null }, error: null };
      case 'gamecore_list_communities':
        return { data: [{ id: 'c1', code: 'MAH', name: 'Mahogany', sector: 'Southeast', population: 1 }], error: null };
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
    loadPlan: async () => PLAN,
    // site x = the project's position in the server list (enough to check the wiring)
    siteTile: (_plan, _view, key) => ({ x: ['fire-pit', 'frozen-pond', 'gateway-arch'].indexOf(key), z: 0 }),
    onHelped: (site) => helped.push(site),
    randomId: () => `id-${++ids}`,
    now: () => new Date('2026-12-01T20:00:00Z'),
    setTimer: (fn, ms) => timers.push({ fn, ms }),
    clearTimer: () => {},
    storage: { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => void store.set(k, v) },
  };
  const useStore = createDailyActionsStore(deps);
  return { useStore, rpc, timers, arrivals, helped, deps, storage: store, setState: (s: ServerCommunityState) => (state = s), setMe: (id: string | null) => (meCommunity = id) };
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

  it('without a community it waits for Residency, and can look around view-only', async () => {
    const t = setup({ me: { community_id: null } });
    await t.useStore.getState().init();
    expect(t.useStore.getState().status).toBe('no-community');
    await t.useStore.getState().openLookAround();
    expect(t.useStore.getState().pickerOpen).toBe(true);
    t.setState({ ...serverState(), me: { member: false, pending: false, energy_max: 3, energy_left: 3, house_slot: null } });
    await t.useStore.getState().viewCommunity('c1');
    expect(t.useStore.getState().status).toBe('ready');
    expect(t.useStore.getState().pickerOpen).toBe(false);
    // looking around: tapping a project does not spend energy
    t.useStore.getState().act(0);
    expect(energyShown(t.useStore.getState().queue!)).toBe(3);
    expect(t.useStore.getState().toast?.text).toMatch(/Find your community/);
    expect(t.rpc.mock.calls.some(([fn]) => fn === 'gamecore_choose_community')).toBe(false);
  });

  it('reload follows where Residency says the player plays', async () => {
    const t = setup({ me: { community_id: null } });
    await t.useStore.getState().init();
    expect(t.useStore.getState().status).toBe('no-community');
    t.setMe('c1');
    await t.useStore.getState().reload();
    expect(t.useStore.getState().status).toBe('ready');
    expect(t.useStore.getState().view?.communityName).toBe('Mahogany');
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
    const t = setup({ state: serverState({ me: { member: true, pending: false, energy_max: 3, energy_left: 0, house_slot: null } }) });
    await t.useStore.getState().init();
    t.useStore.getState().act(0);
    expect(t.deps.moveTo).not.toHaveBeenCalled();
    expect(t.useStore.getState().toast?.text).toBe('No energy left today. New energy in 10h 00m.');
  });

  it('the midnight refresh shows yesterday\'s help as progress and restores energy', async () => {
    const t = setup({ state: serverState({ me: { member: true, pending: false, energy_max: 3, energy_left: 0, house_slot: null } }) });
    await t.useStore.getState().init();
    const next = serverState({
      calgary_day: '2026-12-02',
      next_day_start: '2026-12-03T06:00:00+00:00',
      me: { member: true, pending: false, energy_max: 3, energy_left: 3, house_slot: null },
    });
    next.projects[0].progress = 15;
    next.buildings[1].progress = 0.75;
    t.setState(next);
    t.timers.at(-1)!.fn();
    await settle();
    expect(t.useStore.getState().view?.buildings.find((b) => b.key === 'fire-pit')?.progress).toBe(0.75);
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

  it('the first accepted help of the day refreshes once, so the streak bar counts it', async () => {
    const t = setup({ submit: async (a) => result(2, (a as { id: string }[]).map((x) => ({ id: x.id, status: 'accepted' as const }))) });
    await t.useStore.getState().init();
    const reads = () => t.rpc.mock.calls.filter((c) => c[0] === 'gamecore_get_community_state').length;
    const before = reads();
    t.useStore.getState().act(0);
    t.arrivals[0]();
    await settle();
    await settle();
    expect(reads()).toBe(before + 1);
    t.useStore.getState().act(1);
    t.arrivals[1]();
    await settle();
    await settle();
    expect(reads()).toBe(before + 1); // not again the same day
  });

  it('exposes the arrival timeout used when the avatar never arrives', () => {
    expect(ARRIVAL_TIMEOUT_MS).toBeGreaterThan(0);
  });
});
