import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { assertResidency, type CheckResponse, type ServerResidency } from './api';
import { devLocationFromSearch, pointInside } from './devLocation';
import { getPosition, roundPosition, type LocationResult } from './geolocation';
import { createResidencyStore, needsCheckIn } from './store';
import { checkResultMessage, chipLabel, formatDay, moveAvailability, progressText } from './text';

const MAH = { id: 'c-mah', name: 'Mahogany' };
const DNC = { id: 'c-dnc', name: 'Downtown Commercial Core' };

const status = (patch: Partial<ServerResidency> = {}): ServerResidency => ({
  calgary_day: '2026-12-01',
  status: 'new',
  community: null,
  candidate: null,
  play_community: null,
  pending: false,
  move: null,
  can_move: { allowed: false, reason: 'not_verified' },
  checks_left: 20,
  ...patch,
});
const verifying = (days: number, patch: Partial<ServerResidency> = {}) =>
  status({ status: 'verifying', candidate: { ...MAH, days, needed: 3, checked_today: true }, play_community: MAH, pending: true, ...patch });
const check = (result: CheckResponse['result'], s: ServerResidency, checked: CheckResponse['checked_community'] = MAH): CheckResponse => ({
  ...s,
  result,
  checked_community: checked,
});

describe('residency API checks', () => {
  it('accepts every status shape the server sends', () => {
    expect(() => assertResidency(status())).not.toThrow();
    expect(() => assertResidency(verifying(2))).not.toThrow();
    expect(() =>
      assertResidency(
        status({
          status: 'moving',
          community: { ...MAH, verified_on: '2026-11-01' },
          candidate: { ...DNC, days: 1, needed: 3, checked_today: false },
          move: { started_on: '2026-12-01', last_day: '2026-12-07', free_correction: false },
          can_move: { allowed: false, reason: 'moving' },
        }),
      ),
    ).not.toThrow();
  });
  it('rejects broken responses', () => {
    expect(() => assertResidency(null)).toThrow(/residency/);
    expect(() => assertResidency({ ...status(), status: 'resident' })).toThrow();
    expect(() => assertResidency({ ...status(), candidate: { ...MAH, days: '1', needed: 3, checked_today: true } })).toThrow();
    expect(() => assertResidency({ ...status(), can_move: {} })).toThrow();
    expect(() => assertResidency({ ...status(), checks_left: 1.5 })).toThrow();
  });
});

describe('geolocation', () => {
  it('rounds the position to about 11 m and never claims more precision', () => {
    expect(roundPosition({ lat: 50.8951812, lon: -113.9289934, accuracy: 7.2 })).toEqual({ lat: 50.8952, lon: -113.929, accuracy: 19 });
  });
  it('needs a secure page and a browser that can locate', async () => {
    expect(await getPosition({ isSecureContext: false, geolocation: undefined })).toEqual({ ok: false, problem: 'insecure' });
    expect(await getPosition({ isSecureContext: true, geolocation: undefined })).toEqual({ ok: false, problem: 'unsupported' });
  });
  it('maps browser errors', async () => {
    const failing = (code: number) => ({
      getCurrentPosition: (_ok: PositionCallback, err?: PositionErrorCallback | null) => err?.({ code } as GeolocationPositionError),
    });
    expect(await getPosition({ isSecureContext: true, geolocation: failing(1) })).toEqual({ ok: false, problem: 'denied' });
    expect(await getPosition({ isSecureContext: true, geolocation: failing(2) })).toEqual({ ok: false, problem: 'unavailable' });
    expect(await getPosition({ isSecureContext: true, geolocation: failing(3) })).toEqual({ ok: false, problem: 'timeout' });
  });
  it('returns the rounded position', async () => {
    const geo = {
      getCurrentPosition: (ok: PositionCallback) => ok({ coords: { latitude: 51.04471, longitude: -114.07194, accuracy: 30 } } as GeolocationPosition),
    };
    expect(await getPosition({ isSecureContext: true, geolocation: geo })).toEqual({ ok: true, position: { lat: 51.0447, lon: -114.0719, accuracy: 41 } });
  });
});

describe('dev location', () => {
  it('reads ?devloc=CODE only for plausible codes', () => {
    expect(devLocationFromSearch('?devloc=MAH')).toBe('MAH');
    expect(devLocationFromSearch('?devloc=<x>')).toBeNull();
    expect(devLocationFromSearch('')).toBeNull();
  });
  it('finds a point inside a concave shape (not its centre)', () => {
    // A "U": the centroid of the ring lies in the empty middle.
    const u: [number, number][] = [
      [0, 0], [3, 0], [3, 3], [2, 3], [2, 1], [1, 1], [1, 3], [0, 3], [0, 0],
    ];
    const p = pointInside(u)!;
    const inLeft = p.lon < 1 && p.lat < 3;
    const inRight = p.lon > 2 && p.lat < 3;
    const inBottom = p.lat < 1;
    expect(inLeft || inRight || inBottom).toBe(true);
  });
});

describe('residency texts', () => {
  it('formats Calgary days without time zone math', () => {
    expect(formatDay('2026-12-07')).toBe('Dec 7');
    expect(formatDay('2027-01-31')).toBe('Jan 31');
  });
  it('describes verification and move progress', () => {
    expect(progressText(verifying(1))).toBe('Mahogany: day 1 of 3. Open the app there on 2 more days within a week.');
    expect(progressText(verifying(2))).toMatch(/on 1 more day within a week/);
    expect(
      progressText(
        status({
          status: 'moving',
          candidate: { ...DNC, days: 2, needed: 3, checked_today: true },
          move: { started_on: '2026-12-01', last_day: '2026-12-07', free_correction: false },
        }),
      ),
    ).toBe('Downtown Commercial Core: day 2 of 3. Check in on 1 more day by Dec 7.');
    expect(progressText(status())).toBeNull();
  });
  it('explains every check result', () => {
    expect(checkResultMessage(check('counted', verifying(1))).text).toBe(
      'Checked in from Mahogany: day 1 of 3. 2 more days to become a Verified Resident.',
    );
    expect(checkResultMessage(check('counted', verifying(2), DNC)).text).toBe(
      'Checked in from Downtown Commercial Core. Mahogany has more days, so you keep playing there.',
    );
    expect(checkResultMessage(check('verified', status({ status: 'verified', community: { ...MAH, verified_on: '2026-12-01' } }))).text).toMatch(
      /Verified Resident of Mahogany/,
    );
    for (const r of ['not_needed', 'limit', 'inaccurate', 'no_community', 'current_community'] as const) {
      const m = checkResultMessage(check(r, status(), null));
      expect(m.text.length).toBeGreaterThan(10);
      expect(m.tone).toBe(r === 'not_needed' ? 'ok' : 'warn');
    }
    expect(checkResultMessage(check('inaccurate', status(), null)).text).toMatch(/phone/);
  });
  it('says when a move is possible', () => {
    expect(moveAvailability({ allowed: true, free_correction: false })).toBe('You can move to another community.');
    expect(moveAvailability({ allowed: true, free_correction: true, correction_until: '2026-12-14' })).toMatch(/Free correction.*Dec 14/);
    expect(moveAvailability({ allowed: false, reason: 'cooldown', available_on: '2027-03-01' })).toBe('You can move again on Mar 1.');
    expect(moveAvailability({ allowed: false, reason: 'moving' })).toMatch(/already moving/);
  });
  it('chip labels', () => {
    expect(chipLabel(verifying(2))).toBe('Verifying 2/3');
    expect(chipLabel(status())).toBe('Find my community');
    expect(chipLabel(status({ status: 'moving' }))).toBe('Moving');
    expect(chipLabel(status({ status: 'verified', community: { ...MAH, verified_on: '2026-12-01' } }))).toBeNull();
    expect(needsCheckIn(status({ status: 'verified' }))).toBe(false);
    expect(needsCheckIn(verifying(1))).toBe(true);
  });
});

// --- Store flow with fakes ----------------------------------------------------------

function setup(opts: { status?: ServerResidency; granted?: boolean; position?: LocationResult; check?: CheckResponse } = {}) {
  let current = opts.status ?? status();
  const rpc = vi.fn(async (fn: string, args: Record<string, unknown>) => {
    void args;
    switch (fn) {
      case 'residency_get_status':
        return { data: current, error: null };
      case 'residency_check_location':
        current = opts.check ?? check('counted', verifying(1));
        return { data: current, error: null };
      case 'residency_start_move':
        current = { ...status({ status: 'moving', community: { ...MAH, verified_on: '2026-11-01' } }), ok: true } as ServerResidency;
        return { data: current, error: null };
      case 'residency_cancel_move':
        current = { ...status({ status: 'verified', community: { ...MAH, verified_on: '2026-11-01' } }), ok: true } as ServerResidency;
        return { data: current, error: null };
      default:
        throw new Error(`unexpected rpc ${fn}`);
    }
  });
  const getPosition = vi.fn(async (): Promise<LocationResult> => opts.position ?? { ok: true, position: { lat: 50.8952, lon: -113.929, accuracy: 20 } });
  const useStore = createResidencyStore({
    getClient: () => ({ rpc }) as unknown as SupabaseClient,
    getPosition,
    locationGranted: async () => opts.granted ?? false,
  });
  return { useStore, rpc, getPosition };
}

describe('residency store', () => {
  it('loads the status without asking for location when permission is not granted yet', async () => {
    const t = setup();
    await t.useStore.getState().init();
    expect(t.useStore.getState().phase).toBe('ready');
    expect(t.useStore.getState().status?.status).toBe('new');
    expect(t.getPosition).not.toHaveBeenCalled();
  });
  it('checks in on open when location is already allowed and checks are still needed', async () => {
    const t = setup({ status: verifying(1), granted: true, check: check('counted', verifying(2)) });
    await t.useStore.getState().init();
    expect(t.getPosition).toHaveBeenCalledTimes(1);
    expect(t.rpc).toHaveBeenCalledWith('residency_check_location', { p_lat: 50.8952, p_lon: -113.929, p_accuracy: 20 });
    expect(t.useStore.getState().status?.candidate?.days).toBe(2);
    expect(t.useStore.getState().message?.tone).toBe('ok');
  });
  it('never asks a Verified Resident for location', async () => {
    const t = setup({ status: status({ status: 'verified', community: { ...MAH, verified_on: '2026-11-01' } }), granted: true });
    await t.useStore.getState().init();
    expect(t.getPosition).not.toHaveBeenCalled();
  });
  it('a blocked location shows how to fix it and sends nothing', async () => {
    const t = setup({ position: { ok: false, problem: 'denied' } });
    await t.useStore.getState().init();
    await t.useStore.getState().checkIn();
    expect(t.useStore.getState().message?.text).toMatch(/blocked/);
    expect(t.rpc).not.toHaveBeenCalledWith('residency_check_location', expect.anything());
    expect(t.useStore.getState().checking).toBe(false);
  });
  it('a server error is shown, not thrown', async () => {
    const t = setup();
    t.rpc.mockImplementationOnce(async () => ({ data: status(), error: null }));
    await t.useStore.getState().init();
    t.rpc.mockImplementationOnce(async () => ({ data: null, error: { message: 'boom' } }) as never);
    await t.useStore.getState().checkIn();
    expect(t.useStore.getState().message?.text).toMatch(/boom/);
  });
  it('starts and cancels a move', async () => {
    const t = setup({ status: status({ status: 'verified', community: { ...MAH, verified_on: '2026-11-01' } }) });
    await t.useStore.getState().init();
    await t.useStore.getState().startMove();
    expect(t.useStore.getState().status?.status).toBe('moving');
    expect(t.useStore.getState().message?.text).toMatch(/Move started/);
    await t.useStore.getState().cancelMove();
    expect(t.useStore.getState().status?.status).toBe('verified');
    expect(t.useStore.getState().message?.text).toMatch(/cancelled/);
  });
});
