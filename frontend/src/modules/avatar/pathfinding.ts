/**
 * Grid pathfinding for the avatar (requirement.md §10.2): A* over the island's
 * walkable tiles, 8 directions, no corner cutting (a diagonal step needs both
 * side tiles free), so the avatar never clips a building or tree corner.
 */
import type { Tile } from '../island-view';

const key = (x: number, z: number) => `${x},${z}`;

export const DIRECTIONS: Tile[] = [
  { x: 1, z: 0 },
  { x: -1, z: 0 },
  { x: 0, z: 1 },
  { x: 0, z: -1 },
  { x: 1, z: 1 },
  { x: 1, z: -1 },
  { x: -1, z: 1 },
  { x: -1, z: -1 },
];

/** Whether one step `d` from `from` is allowed (target free; diagonals need both side tiles free). */
export function canStep(walkable: ReadonlySet<string>, from: Tile, d: Tile): boolean {
  if (Math.abs(d.x) > 1 || Math.abs(d.z) > 1 || (d.x === 0 && d.z === 0)) return false;
  if (!walkable.has(key(from.x + d.x, from.z + d.z))) return false;
  if (d.x !== 0 && d.z !== 0) {
    return walkable.has(key(from.x + d.x, from.z)) && walkable.has(key(from.x, from.z + d.z));
  }
  return true;
}

const octile = (a: Tile, b: Tile) => {
  const dx = Math.abs(a.x - b.x);
  const dz = Math.abs(a.z - b.z);
  return Math.max(dx, dz) + (Math.SQRT2 - 1) * Math.min(dx, dz);
};

/**
 * Shortest path from `from` to `to`. Returns the tiles to walk through
 * (excluding `from`, including `to`), [] when already there, or null when
 * `to` is blocked or unreachable. `from` itself need not be walkable.
 */
export function findPath(walkable: ReadonlySet<string>, from: Tile, to: Tile): Tile[] | null {
  if (from.x === to.x && from.z === to.z) return [];
  if (!walkable.has(key(to.x, to.z))) return null;

  const startKey = key(from.x, from.z);
  const g = new Map<string, number>([[startKey, 0]]);
  const cameFrom = new Map<string, string>();
  const tiles = new Map<string, Tile>([[startKey, from]]);
  const closed = new Set<string>();
  // Binary heap of [f, tieBreak, key].
  const heap: [number, number, string][] = [];
  let counter = 0;
  const push = (f: number, k: string) => {
    heap.push([f, counter++, k]);
    let i = heap.length - 1;
    while (i > 0) {
      const p = (i - 1) >> 1;
      if (heap[p][0] < heap[i][0] || (heap[p][0] === heap[i][0] && heap[p][1] < heap[i][1])) break;
      [heap[p], heap[i]] = [heap[i], heap[p]];
      i = p;
    }
  };
  const pop = () => {
    const top = heap[0];
    const last = heap.pop() as [number, number, string];
    if (heap.length > 0) {
      heap[0] = last;
      let i = 0;
      for (;;) {
        const l = 2 * i + 1;
        const r = l + 1;
        let m = i;
        const less = (a: number, b: number) => heap[a][0] < heap[b][0] || (heap[a][0] === heap[b][0] && heap[a][1] < heap[b][1]);
        if (l < heap.length && less(l, m)) m = l;
        if (r < heap.length && less(r, m)) m = r;
        if (m === i) break;
        [heap[m], heap[i]] = [heap[i], heap[m]];
        i = m;
      }
    }
    return top;
  };

  push(octile(from, to), startKey);
  const goalKey = key(to.x, to.z);
  while (heap.length > 0) {
    const [, , k] = pop();
    if (closed.has(k)) continue;
    if (k === goalKey) {
      const path: Tile[] = [];
      for (let c: string | undefined = k; c && c !== startKey; c = cameFrom.get(c)) path.push(tiles.get(c) as Tile);
      return path.reverse();
    }
    closed.add(k);
    const cur = tiles.get(k) as Tile;
    const gCur = g.get(k) as number;
    for (const d of DIRECTIONS) {
      if (!canStep(walkable, cur, d)) continue;
      const n = { x: cur.x + d.x, z: cur.z + d.z };
      const nk = key(n.x, n.z);
      if (closed.has(nk)) continue;
      const cost = gCur + (d.x !== 0 && d.z !== 0 ? Math.SQRT2 : 1);
      if (cost < (g.get(nk) ?? Infinity)) {
        g.set(nk, cost);
        cameFrom.set(nk, k);
        tiles.set(nk, n);
        push(cost + octile(n, to), nk);
      }
    }
  }
  return null;
}

/**
 * Where to go when the player taps a blocked tile (house, tree, building):
 * the walkable tile closest to the tap; ties go to the one closest to the avatar.
 */
export function nearestWalkable(walkable: readonly Tile[], target: Tile, avatar: Tile): Tile | null {
  let best: Tile | null = null;
  let bestD = Infinity;
  let bestA = Infinity;
  for (const t of walkable) {
    const d = Math.hypot(t.x - target.x, t.z - target.z);
    const a = Math.hypot(t.x - avatar.x, t.z - avatar.z);
    if (d < bestD - 1e-9 || (Math.abs(d - bestD) < 1e-9 && a < bestA)) {
      best = t;
      bestD = d;
      bestA = a;
    }
  }
  return best;
}
