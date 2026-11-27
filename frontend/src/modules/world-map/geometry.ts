/**
 * World Map geometry (pure, tested): shapes in metres (x east, y south), point-in-polygon, icon
 * placement inside each community and the screen transform.
 */

export interface MapCommunity {
  code: string;
  name: string;
  /** m² */
  area: number;
  /** A point well inside the community (labels, the main icon). */
  label: [number, number];
  /** Flat [x0, y0, x1, y1, …] rings in metres. */
  rings: number[][];
}

/** CTrain lines and stations in the same metres (requirement.md §7.9). */
export interface MapCtrain {
  lines: { line: string; colour: string; points: number[] }[];
  stations: { name: string; at: [number, number]; lines: string[] }[];
}

export interface MapShapes {
  width: number;
  height: number;
  communities: MapCommunity[];
  ctrain?: MapCtrain;
}

/** The CTrain part of the map file, or none when it is missing or malformed (the map still works). */
export function mapCtrain(v: unknown): MapCtrain | null {
  const c = (v as { ctrain?: unknown } | null)?.ctrain as Record<string, unknown> | undefined;
  if (!c || !Array.isArray(c.lines) || !Array.isArray(c.stations)) return null;
  const linesOk = c.lines.every(
    (l) => typeof l?.line === 'string' && typeof l?.colour === 'string' && Array.isArray(l?.points) && l.points.length >= 4 && l.points.length % 2 === 0,
  );
  const stationsOk = c.stations.every((st) => typeof st?.name === 'string' && Array.isArray(st?.at) && st.at.length === 2 && Array.isArray(st?.lines));
  return linesOk && stationsOk ? (c as unknown as MapCtrain) : null;
}

export function isShapes(v: unknown): v is MapShapes {
  const o = v as Record<string, unknown> | null;
  return (
    !!o &&
    typeof o.width === 'number' &&
    typeof o.height === 'number' &&
    Array.isArray(o.communities) &&
    o.communities.every(
      (c) =>
        typeof c?.code === 'string' &&
        typeof c?.name === 'string' &&
        typeof c?.area === 'number' &&
        Array.isArray(c?.label) &&
        Array.isArray(c?.rings) &&
        (c.rings as unknown[]).every((r) => Array.isArray(r) && (r as unknown[]).length >= 6),
    )
  );
}

export function inRing(ring: number[], x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const xi = ring[i]!, yi = ring[i + 1]!, xj = ring[j]!, yj = ring[j + 1]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

export function inCommunity(c: MapCommunity, x: number, y: number): boolean {
  return c.rings.some((r) => inRing(r, x, y));
}

export interface Box {
  minX: number;
  minY: number;
  maxX: number;
  maxY: number;
}

export function bbox(c: MapCommunity): Box {
  const b = { minX: Infinity, minY: Infinity, maxX: -Infinity, maxY: -Infinity };
  for (const r of c.rings)
    for (let i = 0; i < r.length; i += 2) {
      b.minX = Math.min(b.minX, r[i]!);
      b.maxX = Math.max(b.maxX, r[i]!);
      b.minY = Math.min(b.minY, r[i + 1]!);
      b.maxY = Math.max(b.maxY, r[i + 1]!);
    }
  return b;
}

/** The community under a map point, or null (smallest first if outlines overlap). */
export function communityAt(list: { c: MapCommunity; box: Box }[], x: number, y: number): MapCommunity | null {
  let best: MapCommunity | null = null;
  for (const { c, box } of list) {
    if (x < box.minX || x > box.maxX || y < box.minY || y > box.maxY) continue;
    if (inCommunity(c, x, y) && (!best || c.area < best.area)) best = c;
  }
  return best;
}

function edgeDistance(ring: number[], x: number, y: number): number {
  let best = Infinity;
  for (let i = 0, j = ring.length - 2; i < ring.length; j = i, i += 2) {
    const x1 = ring[j]!, y1 = ring[j + 1]!, x2 = ring[i]!, y2 = ring[i + 1]!;
    const dx = x2 - x1, dy = y2 - y1;
    const t = Math.max(0, Math.min(1, ((x - x1) * dx + (y - y1) * dy) / (dx * dx + dy * dy || 1e-9)));
    best = Math.min(best, Math.hypot(x - (x1 + t * dx), y - (y1 + t * dy)));
  }
  return best;
}

/** Deterministic 0..1 from integers (stable icon layout). */
function hash01(a: number, b: number, seed: number): number {
  let h = (a * 374761393 + b * 668265263 + seed * 1442695041) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

/**
 * Candidate icon spots inside a community: a grid every `step` metres, at least `margin` from the
 * edge, in a stable shuffled order (so taking the first N spreads icons out). The label point first.
 */
export function iconSpots(c: MapCommunity, step = 140, margin = 70): [number, number][] {
  const b = bbox(c);
  const spots: { p: [number, number]; k: number }[] = [];
  for (let x = b.minX + step / 2; x < b.maxX; x += step)
    for (let y = b.minY + step / 2; y < b.maxY; y += step) {
      if (!inCommunity(c, x, y)) continue;
      if (Math.min(...c.rings.map((r) => edgeDistance(r, x, y))) < margin) continue;
      if (Math.hypot(x - c.label[0], y - c.label[1]) < step) continue;
      spots.push({ p: [x, y], k: hash01(Math.round(x), Math.round(y), 7) });
    }
  spots.sort((a, b2) => a.k - b2.k);
  return [c.label, ...spots.map((s) => s.p)];
}

export type IconKind = 'house' | 'sign' | 'playground' | 'rink' | 'hall' | 'park' | 'landmark' | 'cloud';

/** Icons per km² at full detail by level (requirement §9: denser as the community develops). */
const DENSITY = [0, 2, 4, 6, 9];

/**
 * What to draw in a community: the main building at the label point, then houses. `room` is how
 * many icons fit on screen right now (zoom-dependent detail); level 0 shows a cloud only.
 */
export function iconPlan(level: number, areaM2: number, room: number, codeSeed: number): IconKind[] {
  if (level <= 0) return ['cloud'];
  const main: IconKind[] =
    level >= 4 ? ['landmark', 'hall', 'park'] : level === 3 ? ['hall'] : level === 2 ? [codeSeed % 2 === 0 ? 'playground' : 'rink', 'sign'] : ['sign'];
  const full = Math.max(main.length + 1, Math.round(DENSITY[Math.min(level, 4)]! * (areaM2 / 1e6)) + main.length);
  const n = Math.max(1, Math.min(full, room));
  return Array.from({ length: n }, (_, i) => (i < main.length ? main[i]! : 'house'));
}

export interface View {
  scale: number;
  ox: number;
  oy: number;
}

/** Fits the whole map in a w×h screen with a margin. */
export function fitView(width: number, height: number, w: number, h: number, margin = 16): View {
  const scale = Math.min((w - margin * 2) / width, (h - margin * 2) / height);
  return { scale, ox: (w - width * scale) / 2, oy: (h - height * scale) / 2 };
}

/** View that frames a box (a community) in the screen. */
export function frameBox(b: Box, w: number, h: number, maxScale: number): View {
  const bw = Math.max(400, b.maxX - b.minX), bh = Math.max(400, b.maxY - b.minY);
  const scale = Math.min(maxScale, (w * 0.7) / bw, (h * 0.5) / bh);
  const cx = (b.minX + b.maxX) / 2, cy = (b.minY + b.maxY) / 2;
  return { scale, ox: w / 2 - cx * scale, oy: h * 0.4 - cy * scale };
}

export function codeSeed(code: string): number {
  let s = 0;
  for (const ch of code) s = (s * 31 + ch.charCodeAt(0)) >>> 0;
  return s;
}
