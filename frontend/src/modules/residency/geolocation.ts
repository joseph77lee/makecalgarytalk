/**
 * Browser location for the residency check (requirement.md §6.2). The position goes straight to
 * the server, which finds the community and forgets it; nothing is kept in the browser.
 */

export interface Position {
  lat: number;
  lon: number;
  /** Metres (radius of the browser's uncertainty). */
  accuracy: number;
}

export type LocationProblem = 'denied' | 'unavailable' | 'timeout' | 'unsupported' | 'insecure';

export type LocationResult = { ok: true; position: Position } | { ok: false; problem: LocationProblem };

/**
 * Rounds to 4 decimals (about 11 m): enough to find the community, less precise in transit.
 * Accuracy is rounded up so a rounded point is never reported as more precise than it is.
 */
export function roundPosition(p: Position): Position {
  const r = (v: number) => Math.round(v * 1e4) / 1e4;
  return { lat: r(p.lat), lon: r(p.lon), accuracy: Math.ceil(p.accuracy) + 11 };
}

export interface GeoEnv {
  isSecureContext: boolean;
  geolocation: Pick<Geolocation, 'getCurrentPosition'> | undefined;
}

export function getPosition(env: GeoEnv): Promise<LocationResult> {
  if (!env.isSecureContext) return Promise.resolve({ ok: false, problem: 'insecure' });
  if (!env.geolocation) return Promise.resolve({ ok: false, problem: 'unsupported' });
  return new Promise((resolve) => {
    env.geolocation!.getCurrentPosition(
      (pos) =>
        resolve({
          ok: true,
          position: roundPosition({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy }),
        }),
      (err) => resolve({ ok: false, problem: err.code === 1 ? 'denied' : err.code === 3 ? 'timeout' : 'unavailable' }),
      // Always a fresh fix: a cached one could be from another place (e.g. work an hour ago).
      { enableHighAccuracy: true, timeout: 15_000, maximumAge: 0 },
    );
  });
}

/** Whether location permission is already granted (so the check can run without a prompt). */
export async function locationGranted(): Promise<boolean> {
  try {
    const p = await navigator.permissions?.query({ name: 'geolocation' as PermissionName });
    return p?.state === 'granted';
  } catch {
    return false;
  }
}

/** Phones and tablets have GPS; desktops locate by Wi-Fi and are often off (§6.2 hint). */
export function looksLikeDesktop(): boolean {
  try {
    return window.matchMedia('(pointer: fine)').matches && !/Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  } catch {
    return false;
  }
}
