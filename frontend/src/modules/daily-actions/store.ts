/**
 * Daily actions session: loads the player's community from the server, runs the
 * optimistic action queue and refreshes when the Calgary day rolls over.
 * Dependencies are injected so the whole flow can be tested with fakes.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';
import { formatCountdown, msUntil } from '../common';
import type { CommunityViewState, Tile } from '../island-view';
import {
  REJECT_MESSAGES,
  applyResult,
  batchFailed,
  canAct,
  enqueue,
  initialQueue,
  syncEnergy,
  takeBatch,
  type QueueState,
} from './actionQueue';
import { api, type CommunityListItem, type ServerCommunityState } from './api';
import { toViewState } from './toViewState';

export type SessionStatus = 'loading' | 'no-config' | 'signed-out' | 'pick-community' | 'ready' | 'error';

export interface DailyActionsDeps {
  /** Resolves the Supabase client, or null when the app has no configuration. */
  getClient: () => SupabaseClient | null;
  /** Makes sure someone is signed in; returns false if nobody can be (production before M6). */
  ensureSession: (client: SupabaseClient) => Promise<boolean>;
  moveTo: (tile: Tile) => { seq: number };
  /** Calls back once the avatar arrived for `seq`, or after `timeoutMs` (whichever first). */
  whenArrived: (seq: number, cb: () => void, timeoutMs: number) => void;
  siteTile: (projectIndex: number) => Tile;
  onHelped: (site: Tile) => void;
  randomId: () => string;
  now: () => Date;
  setTimer: (fn: () => void, ms: number) => unknown;
  clearTimer: (handle: unknown) => void;
  storage: Pick<Storage, 'getItem' | 'setItem'> | null;
}

export interface DailyActionsState {
  status: SessionStatus;
  error: string | null;
  communities: CommunityListItem[] | null;
  server: ServerCommunityState | null;
  view: CommunityViewState | null;
  queue: QueueState | null;
  toast: { id: number; text: string } | null;
  init: () => Promise<void>;
  chooseCommunity: (communityId: string) => Promise<void>;
  openCommunityPicker: () => Promise<void>;
  refresh: () => Promise<void>;
  act: (projectIndex: number) => void;
  flush: () => Promise<void>;
  showToast: (text: string) => void;
}

const PENDING_KEY = 'mct.pendingActions.v1';
const TODAY_KEY = 'mct.todayHelp.v1';
/** Retry delays after a network failure (ms). */
export const RETRY_DELAYS = [2000, 5000, 15000, 30000];
/** If the avatar never arrives (tapped elsewhere), send anyway after this. */
export const ARRIVAL_TIMEOUT_MS = 4000;
/** Refresh shortly after Calgary midnight so the new progress shows. */
export const MIDNIGHT_GRACE_MS = 1500;

export function createDailyActionsStore(deps: DailyActionsDeps) {
  let flushing = false;
  let retryIndex = 0;
  let retryTimer: unknown = null;
  let dayTimer: unknown = null;
  let toastId = 0;

  const client = (): SupabaseClient => {
    const c = deps.getClient();
    if (!c) throw new Error('Supabase is not configured');
    return c;
  };

  const savePending = (q: QueueState | null) => {
    try {
      deps.storage?.setItem(PENDING_KEY, JSON.stringify((q?.pending ?? []).map((p) => ({ id: p.id, projectId: p.projectId }))));
      if (q) deps.storage?.setItem(TODAY_KEY, JSON.stringify({ day: q.day, today: q.today }));
    } catch {
      // storage may be unavailable (private mode); retries then last only for this page
    }
  };
  /** "+N today" counts saved on this device for the given Calgary day (a convenience only). */
  const loadToday = (day: string): Record<string, number> => {
    try {
      const raw = deps.storage?.getItem(TODAY_KEY);
      const v: unknown = raw ? JSON.parse(raw) : null;
      if (typeof v === 'object' && v !== null && (v as { day?: unknown }).day === day) {
        const today = (v as { today?: unknown }).today;
        if (typeof today === 'object' && today !== null) {
          return Object.fromEntries(Object.entries(today).filter(([, n]) => Number.isInteger(n) && (n as number) > 0)) as Record<string, number>;
        }
      }
    } catch {
      // ignore unreadable storage
    }
    return {};
  };
  const loadPending = (): { id: string; projectId: string }[] => {
    try {
      const raw = deps.storage?.getItem(PENDING_KEY);
      const list: unknown = raw ? JSON.parse(raw) : [];
      return Array.isArray(list)
        ? list.filter((x): x is { id: string; projectId: string } => typeof x?.id === 'string' && typeof x?.projectId === 'string')
        : [];
    } catch {
      return [];
    }
  };

  return create<DailyActionsState>((set, get) => {
    const setQueue = (q: QueueState) => {
      set({ queue: q });
      savePending(q);
    };

    const scheduleDayRefresh = (nextDayStart: string) => {
      if (dayTimer !== null) deps.clearTimer(dayTimer);
      const wait = msUntil(new Date(nextDayStart), deps.now()) + MIDNIGHT_GRACE_MS;
      dayTimer = deps.setTimer(() => {
        dayTimer = null;
        void get().refresh();
      }, wait);
    };

    const loadState = async (communityId: string) => {
      const server = await api.getCommunityState(client(), communityId);
      const prev = get().queue;
      const energyLeft = server.me?.energy_left ?? 0;
      const energyMax = server.me?.energy_max ?? 3;
      let queue = prev ? syncEnergy(prev, energyLeft, energyMax, server.calgary_day) : initialQueue(energyLeft, energyMax, server.calgary_day);
      if (!prev) {
        queue = { ...queue, today: loadToday(server.calgary_day) };
        for (const p of loadPending()) queue = { ...queue, pending: [...queue.pending, { ...p, sending: false }] };
      }
      set({ server, view: toViewState(server), queue, status: 'ready', error: null });
      scheduleDayRefresh(server.next_day_start);
      if (queue.pending.length > 0) void get().flush();
    };

    return {
      status: 'loading',
      error: null,
      communities: null,
      server: null,
      view: null,
      queue: null,
      toast: null,

      async init() {
        try {
          const c = deps.getClient();
          if (!c) return set({ status: 'no-config' });
          if (!(await deps.ensureSession(c))) return set({ status: 'signed-out' });
          const me = await api.getMe(c);
          if (!me.community_id) {
            set({ communities: await api.listCommunities(c), status: 'pick-community' });
            return;
          }
          await loadState(me.community_id);
        } catch (e) {
          set({ status: 'error', error: e instanceof Error ? e.message : String(e) });
        }
      },

      async openCommunityPicker() {
        try {
          set({ communities: get().communities ?? (await api.listCommunities(client())), status: 'pick-community' });
        } catch (e) {
          set({ status: 'error', error: e instanceof Error ? e.message : String(e) });
        }
      },

      async chooseCommunity(communityId) {
        try {
          set({ status: 'loading' });
          await api.chooseCommunity(client(), communityId);
          await loadState(communityId);
        } catch (e) {
          set({ status: 'error', error: e instanceof Error ? e.message : String(e) });
        }
      },

      async refresh() {
        const id = get().server?.community.id;
        if (!id) return;
        try {
          await loadState(id);
        } catch (e) {
          get().showToast(`Could not refresh: ${e instanceof Error ? e.message : String(e)}`);
        }
      },

      act(projectIndex) {
        const { server, queue } = get();
        const project = server?.projects[projectIndex];
        if (!server || !queue || !project) return;
        if (!canAct(queue)) {
          const wait = formatCountdown(msUntil(new Date(server.next_day_start), deps.now()));
          get().showToast(`No energy left today. New energy in ${wait}.`);
          return;
        }
        setQueue(enqueue(queue, deps.randomId(), project.id));
        const site = deps.siteTile(projectIndex);
        const { seq } = deps.moveTo(site);
        deps.whenArrived(
          seq,
          () => {
            deps.onHelped(site);
            void get().flush();
          },
          ARRIVAL_TIMEOUT_MS,
        );
      },

      async flush() {
        if (flushing) return;
        flushing = true;
        try {
          for (;;) {
            const q = get().queue;
            if (!q) break;
            const { q: sending, batch } = takeBatch(q);
            if (batch.length === 0) break;
            setQueue(sending);
            try {
              const result = await api.submitActions(client(), batch.map((b) => ({ id: b.id, project_id: b.projectId })));
              const { q: next, feedback } = applyResult(get().queue as QueueState, batch, result);
              setQueue(next);
              retryIndex = 0;
              for (const r of feedback.rejected) get().showToast(REJECT_MESSAGES[r.reason]);
              if (feedback.rejected.some((r) => r.reason === 'project_not_active')) void get().refresh();
            } catch {
              setQueue(batchFailed(get().queue as QueueState, batch));
              const delay = RETRY_DELAYS[Math.min(retryIndex, RETRY_DELAYS.length - 1)];
              retryIndex += 1;
              if (retryTimer !== null) deps.clearTimer(retryTimer);
              retryTimer = deps.setTimer(() => {
                retryTimer = null;
                void get().flush();
              }, delay);
              break;
            }
          }
        } finally {
          flushing = false;
        }
      },

      showToast(text) {
        toastId += 1;
        set({ toast: { id: toastId, text } });
      },
    };
  });
}
