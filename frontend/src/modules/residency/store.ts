/**
 * Residency session (requirement.md v1.23 §6.2–§6.4): status from the server, location check-ins,
 * moving. Dependencies are injected so the flow can be tested with fakes.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';
import { residencyApi, type ServerResidency } from './api';
import type { LocationResult } from './geolocation';
import { checkResultMessage, locationProblemMessage, type Message } from './text';

export type ResidencyPhase = 'loading' | 'no-config' | 'ready' | 'error';

export interface ResidencyDeps {
  getClient: () => SupabaseClient | null;
  getPosition: () => Promise<LocationResult>;
  /** Whether location permission is already granted (then the app checks in on open). */
  locationGranted: () => Promise<boolean>;
}

export interface ResidencyState {
  phase: ResidencyPhase;
  error: string | null;
  status: ServerResidency | null;
  checking: boolean;
  message: Message | null;
  init: () => Promise<void>;
  checkIn: () => Promise<void>;
  startMove: () => Promise<void>;
  cancelMove: () => Promise<void>;
  clearMessage: () => void;
}

/** Statuses that still need location check-ins. */
export function needsCheckIn(s: ServerResidency | null): boolean {
  return s?.status === 'new' || s?.status === 'verifying' || s?.status === 'moving';
}

export function createResidencyStore(deps: ResidencyDeps) {
  const client = (): SupabaseClient => {
    const c = deps.getClient();
    if (!c) throw new Error('Supabase is not configured');
    return c;
  };
  const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e));

  return create<ResidencyState>((set, get) => ({
    phase: 'loading',
    error: null,
    status: null,
    checking: false,
    message: null,

    async init() {
      try {
        const c = deps.getClient();
        if (!c) return set({ phase: 'no-config' });
        const status = await residencyApi.getStatus(c);
        set({ status, phase: 'ready', error: null });
        // A player who still needs check-ins and already allowed location is checked on every
        // app open (a visit from home later the same day counts, §6.3).
        if (needsCheckIn(status) && (await deps.locationGranted())) await get().checkIn();
      } catch (e) {
        set({ phase: 'error', error: errorText(e) });
      }
    },

    async checkIn() {
      if (get().checking) return;
      set({ checking: true, message: null });
      try {
        const loc = await deps.getPosition();
        if (!loc.ok) return set({ message: locationProblemMessage(loc.problem) });
        const { lat, lon, accuracy } = loc.position;
        const res = await residencyApi.checkLocation(client(), lat, lon, accuracy);
        set({ status: res, message: checkResultMessage(res) });
      } catch (e) {
        set({ message: { tone: 'warn', text: `Could not check your location: ${errorText(e)}` } });
      } finally {
        set({ checking: false });
      }
    },

    async startMove() {
      try {
        const res = await residencyApi.startMove(client());
        set({
          status: res,
          message: res.ok
            ? { tone: 'ok', text: 'Move started. Check in from your new home on 3 different days within 7 days.' }
            : { tone: 'warn', text: 'You cannot move right now.' },
        });
      } catch (e) {
        set({ message: { tone: 'warn', text: `Could not start the move: ${errorText(e)}` } });
      }
    },

    async cancelMove() {
      try {
        const res = await residencyApi.cancelMove(client());
        set({ status: res, message: res.ok ? { tone: 'ok', text: 'Move cancelled. Nothing was lost.' } : null });
      } catch (e) {
        set({ message: { tone: 'warn', text: `Could not cancel the move: ${errorText(e)}` } });
      }
    },

    clearMessage() {
      set({ message: null });
    },
  }));
}
