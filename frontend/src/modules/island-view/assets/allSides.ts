/**
 * Every model finished on all sides (requirement v1.48 §10.1, §19.1): the camera turns all the way
 * round, so a wall's windows and doors on the front (+z) and side (+x) are mirrored onto the
 * opposite wall (−z, −x) when that wall has none of its own. Models already finished on a side
 * keep theirs. Works on any box model (tile units), before it is turned to its facing.
 */
import type { BoxPart } from './boxes';
import { ART } from './voxel/samples';

const GLASS = new Set<string>([ART.glass, ART.glassDark]);
const FRAME = ART.trim;
/** A part this thin (tiles) along one axis is a surface detail, not a wall. */
const THIN = 0.07;
/** How close (tiles) a detail must sit to a wall face to belong to it. */
const NEAR = 0.07;

const isWindow = (b: BoxPart) => GLASS.has(b.c) || b.tag === 'village-window';
const isDoor = (b: BoxPart) => b.c === ART.door;

interface Face {
  axis: 0 | 2;
  /** The wall box. */
  wall: BoxPart;
}

/** Which wall (if any) a thin detail sits on, on its front (+) face along `axis`. */
function wallOf(d: BoxPart, axis: 0 | 2, walls: BoxPart[]): BoxPart | null {
  const other = axis === 0 ? 2 : 0;
  let best: BoxPart | null = null;
  for (const w of walls) {
    const face = w.p[axis] + w.s[axis] / 2;
    if (Math.abs(d.p[axis] - face) > NEAR + d.s[axis] / 2) continue;
    const inside = (k: 0 | 1 | 2) => Math.abs(d.p[k] - w.p[k]) <= w.s[k] / 2 + 0.01;
    if (!inside(1) || !inside(other)) continue;
    if (!best || w.s[0] * w.s[1] * w.s[2] > best.s[0] * best.s[1] * best.s[2]) best = w;
  }
  return best;
}

/** Details already on the back face of a wall. */
function hasBackDetail(wall: BoxPart, axis: 0 | 2, details: BoxPart[]): boolean {
  const back = wall.p[axis] - wall.s[axis] / 2;
  const other = axis === 0 ? 2 : 0;
  return details.some(
    (d) => Math.abs(d.p[axis] - back) <= NEAR + d.s[axis] / 2 && Math.abs(d.p[other] - wall.p[other]) <= wall.s[other] / 2 && Math.abs(d.p[1] - wall.p[1]) <= wall.s[1] / 2,
  );
}

/** Adds the mirrored windows and doors; the input parts are returned unchanged first. */
export function finishAllSides(parts: BoxPart[]): BoxPart[] {
  const walls = parts.filter((b) => b.layer === 'solid' && !isWindow(b) && !isDoor(b) && Math.min(b.s[0], b.s[2]) > 0.2 && b.s[1] > 0.15 && !b.r);
  const details = parts.filter((b) => (isWindow(b) || isDoor(b)) && !b.r && (b.layer === 'solid' || b.layer === 'glow'));
  if (walls.length === 0 || details.length === 0) return parts;
  const added: BoxPart[] = [];
  const faces: Face[] = [];
  for (const axis of [0, 2] as const) {
    const thin = details.filter((d) => d.s[axis] <= THIN);
    const byWall = new Map<BoxPart, BoxPart[]>();
    for (const d of thin) {
      const w = wallOf(d, axis, walls);
      if (!w || d.p[axis] < w.p[axis]) continue; // only details on the front (+) face
      byWall.set(w, [...(byWall.get(w) ?? []), d]);
    }
    for (const [wall, ds] of byWall) {
      if (hasBackDetail(wall, axis, thin)) continue;
      faces.push({ axis, wall });
      const front = wall.p[axis] + wall.s[axis] / 2;
      const back = wall.p[axis] - wall.s[axis] / 2;
      for (const d of ds) {
        const out = d.p[axis] - front; // how far the detail stands out of the front face
        // a face hidden by another wall (the shared wall of a semi-detached pair, a wing): carry
        // on to the outer face of the building
        let outer = back;
        const probe: [number, number, number] = [...d.p];
        for (let hop = 0; hop < 5; hop++) {
          probe[axis] = outer - 0.05;
          const next = walls.find((w) => w !== wall && [0, 1, 2].every((k) => Math.abs(probe[k] - w.p[k]) < w.s[k] / 2));
          if (!next) break;
          outer = next.p[axis] - next.s[axis] / 2;
        }
        const p: [number, number, number] = [...d.p];
        p[axis] = outer - out;
        added.push({ ...d, p });
        if (isWindow(d)) {
          // a frame around the mirrored window, just behind the glass
          const s: [number, number, number] = [d.s[0] + 0.08, d.s[1] + 0.08, d.s[2] + 0.08];
          s[axis] = 0.02;
          const fp: [number, number, number] = [...p];
          fp[axis] = outer - 0.01;
          added.push({ layer: 'solid', p: fp, s, c: FRAME });
        }
      }
    }
  }
  return faces.length === 0 ? parts : [...parts, ...added];
}

/** Counts window and door details facing each side (+z, −z, +x, −x) of the model (for tests). */
export function detailSides(parts: BoxPart[]): { pz: number; nz: number; px: number; nx: number } {
  const walls = parts.filter((b) => b.layer === 'solid' && !isWindow(b) && !isDoor(b) && Math.min(b.s[0], b.s[2]) > 0.2 && b.s[1] > 0.15 && !b.r);
  const out = { pz: 0, nz: 0, px: 0, nx: 0 };
  for (const d of parts.filter((b) => (isWindow(b) || isDoor(b)) && !b.r)) {
    for (const axis of [0, 2] as const) {
      if (d.s[axis] > THIN) continue;
      for (const w of walls) {
        const other = axis === 0 ? 2 : 0;
        if (Math.abs(d.p[1] - w.p[1]) > w.s[1] / 2 || Math.abs(d.p[other] - w.p[other]) > w.s[other] / 2 + 0.01) continue;
        if (Math.abs(d.p[axis] - (w.p[axis] + w.s[axis] / 2)) <= NEAR + d.s[axis] / 2) out[axis === 0 ? 'px' : 'pz']++;
        else if (Math.abs(d.p[axis] - (w.p[axis] - w.s[axis] / 2)) <= NEAR + d.s[axis] / 2) out[axis === 0 ? 'nx' : 'nz']++;
        else continue;
        break;
      }
    }
  }
  return out;
}
