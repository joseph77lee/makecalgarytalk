/**
 * Dev builds only: `?devloc=MAH` pretends the browser is inside that community, so the residency
 * flow can be tried on a computer. The server still checks the point against its boundaries.
 */
import type { LocationResult } from './geolocation';

type Ring = [number, number][];

export function devLocationFromSearch(search: string): string | null {
  const code = new URLSearchParams(search).get('devloc');
  return code && /^[A-Z0-9]{2,4}$/.test(code) ? code : null;
}

function inside(ring: Ring, x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i]!;
    const [xj, yj] = ring[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** A point well inside the ring: the grid point inside it that is closest to the ring's centre. */
export function pointInside(ring: Ring): { lat: number; lon: number } | null {
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  const cx = xs.reduce((a, b) => a + b, 0) / xs.length;
  const cy = ys.reduce((a, b) => a + b, 0) / ys.length;
  let best: { lat: number; lon: number; d: number } | null = null;
  const n = 24;
  for (let i = 1; i < n; i++) {
    for (let j = 1; j < n; j++) {
      const x = x0 + ((x1 - x0) * i) / n;
      const y = y0 + ((y1 - y0) * j) / n;
      if (!inside(ring, x, y)) continue;
      const d = (x - cx) ** 2 + (y - cy) ** 2;
      if (!best || d < best.d) best = { lat: y, lon: x, d };
    }
  }
  return best && { lat: best.lat, lon: best.lon };
}

export async function devPosition(code: string): Promise<LocationResult> {
  const data = (await import('../../../../supabase/data/calgary_boundaries.json')).default as unknown as { communities: Record<string, Ring[]> };
  const ring = data.communities[code]?.[0];
  const p = ring && pointInside(ring);
  return p ? { ok: true, position: { ...p, accuracy: 10 } } : { ok: false, problem: 'unavailable' };
}
