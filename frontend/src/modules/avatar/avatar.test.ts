import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { buildIslandLayout, decodePlan, parseCommunityViewState, tileKey, type CommunityViewState, type IslandPlan, type Tile } from '../island-view';
import { moveTo, useAvatarStore } from './avatarStore';
import { stepCandidates, type MoveKey } from './keyboard';
import { canStep, findPath, nearestWalkable } from './pathfinding';
import { AvatarWalker, DETOUR_AFTER } from './walker';

/** Grid from ASCII: '.' walkable, '#' blocked. Row = z, column = x, origin top-left. */
function grid(rows: string[]): Set<string> {
  const s = new Set<string>();
  rows.forEach((row, z) => [...row].forEach((c, x) => c === '.' && s.add(`${x},${z}`)));
  return s;
}
const t = (x: number, z: number): Tile => ({ x, z });
const pathLength = (from: Tile, path: Tile[]) =>
  path.reduce((acc, p, i) => {
    const prev = i === 0 ? from : path[i - 1];
    return acc + Math.hypot(p.x - prev.x, p.z - prev.z);
  }, 0);

describe('findPath (A*, 8 directions, no corner cutting)', () => {
  it('returns [] when already there', () => {
    expect(findPath(grid(['...']), t(1, 0), t(1, 0))).toEqual([]);
  });

  it('walks straight and diagonally on open ground (shortest)', () => {
    const g = grid(['....', '....', '....', '....']);
    expect(findPath(g, t(0, 0), t(3, 0))).toEqual([t(1, 0), t(2, 0), t(3, 0)]);
    expect(findPath(g, t(0, 0), t(3, 3))).toEqual([t(1, 1), t(2, 2), t(3, 3)]);
  });

  it('goes around a wall', () => {
    const g = grid(['.#.', '.#.', '...']);
    const p = findPath(g, t(0, 0), t(2, 0));
    expect(p).not.toBeNull();
    expect(p?.at(-1)).toEqual(t(2, 0));
    for (const step of p ?? []) expect(g.has(tileKey(step))).toBe(true);
    // corners next to the wall cannot be cut, so the detour is all straight steps
    expect(pathLength(t(0, 0), p ?? [])).toBeCloseTo(6, 5);
  });

  it('never cuts a blocked corner diagonally', () => {
    // (0,0) → (1,1) diagonal is not allowed because (1,0) is blocked.
    const g = grid(['.#', '..']);
    expect(findPath(g, t(0, 0), t(1, 1))).toEqual([t(0, 1), t(1, 1)]);
    expect(canStep(g, t(0, 0), t(1, 1))).toBe(false);
  });

  it('returns null for a blocked or unreachable goal', () => {
    const g = grid(['.#.', '.#.', '.#.']);
    expect(findPath(g, t(0, 0), t(1, 1))).toBeNull(); // blocked goal
    expect(findPath(g, t(0, 0), t(2, 2))).toBeNull(); // walled off
  });

  it('can start from a blocked tile (e.g. a house just appeared under the avatar)', () => {
    const g = grid(['#..']);
    expect(findPath(g, t(0, 0), t(2, 0))).toEqual([t(1, 0), t(2, 0)]);
  });

  it('canStep rejects jumps longer than one tile and standing still', () => {
    const g = grid(['...']);
    expect(canStep(g, t(0, 0), t(2, 0))).toBe(false);
    expect(canStep(g, t(0, 0), t(0, 0))).toBe(false);
  });
});

describe('nearestWalkable (tapping a house or tree)', () => {
  it('picks the walkable tile closest to the tap, ties broken towards the avatar', () => {
    const tiles = [t(0, 0), t(2, 0), t(5, 5)];
    expect(nearestWalkable(tiles, t(1, 0), t(3, 0))).toEqual(t(2, 0));
    expect(nearestWalkable(tiles, t(1, 0), t(-1, 0))).toEqual(t(0, 0));
    expect(nearestWalkable([], t(1, 0), t(0, 0))).toBeNull();
  });
});

describe('keyboard directions follow the camera', () => {
  const ISO = Math.PI / 4; // default camera from +x/+z
  const keys = (...k: MoveKey[]) => new Set<MoveKey>(k);

  it('default view: up goes away from the camera (-x,-z), right goes (+x,-z)', () => {
    expect(stepCandidates(keys('up'), ISO)[0]).toEqual(t(-1, -1));
    expect(stepCandidates(keys('down'), ISO)[0]).toEqual(t(1, 1));
    expect(stepCandidates(keys('right'), ISO)[0]).toEqual(t(1, -1));
    expect(stepCandidates(keys('left'), ISO)[0]).toEqual(t(-1, 1));
  });

  it('up + right is a straight grid step', () => {
    expect(stepCandidates(keys('up', 'right'), ISO)[0]).toEqual(t(0, -1));
  });

  it('rotating the camera rotates the controls', () => {
    // Camera straight from +z (azimuth 0): up = -z.
    expect(stepCandidates(keys('up'), 0)[0]).toEqual(t(0, -1));
    expect(stepCandidates(keys('right'), 0)[0]).toEqual(t(1, 0));
  });

  it('offers neighbouring directions so the avatar slides along walls', () => {
    const c = stepCandidates(keys('up'), ISO);
    expect(c).toHaveLength(3);
    expect(c.slice(1)).toEqual(expect.arrayContaining([t(-1, 0), t(0, -1)]));
  });

  it('opposite keys cancel', () => {
    expect(stepCandidates(keys('up', 'down'), ISO)).toEqual([]);
    expect(stepCandidates(keys(), ISO)).toEqual([]);
  });
});

describe('destination events (requirement.md §10.2)', () => {
  it('moveTo emits an event with avatar id, integer tile and increasing seq', () => {
    const a = moveTo({ x: 3, z: -2 });
    const b = moveTo({ x: 3, z: -2 });
    expect(a).toMatchObject({ avatarId: 'local', to: { x: 3, z: -2 } });
    expect(b.seq).toBe(a.seq + 1);
    expect(useAvatarStore.getState().lastEvent).toEqual(b);
    expect(Object.keys(a).sort()).toEqual(['at', 'avatarId', 'seq', 'to']); // no positions, only destinations
  });
});

const ISLANDS = join(dirname(fileURLToPath(import.meta.url)), '../../../public/islands');
const planOf = (code: string): IslandPlan => decodePlan(JSON.parse(readFileSync(join(ISLANDS, `${code}.json`), 'utf8')));

const BASE_STATE = {
  communityName: 'Testville',
  landStage: 1,
  vitality: 50,
  houses: [
    { id: 'a', nickname: 'A', activeToday: true },
    { id: 'b', nickname: 'B', activeToday: false },
  ],
  buildings: [{ key: 'fire-pit', status: 'built', level: 1, progress: 1, title: 'Fire pit', remaining: null }],
  miniVillagerCount: 3,
  speechBubbles: [],
};

function layoutState(patch: Partial<CommunityViewState> = {}): CommunityViewState {
  const r = parseCommunityViewState(BASE_STATE);
  if (!r.ok) throw new Error('mock invalid');
  return { ...r.state, ...patch };
}

/** Simulate walking until arrival; returns every tile the avatar stood on or stepped through. */
function walk(w: AvatarWalker, maxSeconds = 60): { visited: Tile[]; arrived: number | null } {
  const visited: Tile[] = [w.tile];
  let arrived: number | null = null;
  for (let i = 0; i < maxSeconds * 60; i++) {
    const f = w.update(1 / 60, 2.2);
    const last = visited[visited.length - 1];
    if (w.tile.x !== last.x || w.tile.z !== last.z) visited.push(w.tile);
    if (f.arrivedSeq !== null) {
      arrived = f.arrivedSeq;
      break;
    }
  }
  return { visited, arrived };
}

describe('AvatarWalker on real islands', () => {
  for (const [code, stage] of [['MAH', 0], ['MAH', 2], ['DIA', 3], ['LMR', 5]] as const) {
    it(`${code} land stage ${stage}: walking to every 7th walkable tile never enters a blocked tile`, () => {
      const houses = Array.from({ length: 40 }, (_, i) => ({ id: `h${i}`, nickname: 'x', activeToday: true }));
      const l = buildIslandLayout(planOf(code), layoutState({ landStage: stage, houses, speechBubbles: [] }));
      const keys = new Set(l.walkable.map(tileKey));
      const w = new AvatarWalker(t(0, 0));
      w.setWalkable(keys, l.walkable);
      for (let i = 0; i < l.walkable.length; i += 7) {
        const goal = l.walkable[i];
        expect(w.plan(goal, i + 1)).toEqual(goal);
        const { visited, arrived } = walk(w);
        expect(arrived).toBe(i + 1);
        expect(w.tile).toEqual(goal);
        for (let j = 1; j < visited.length; j++) {
          expect(keys.has(tileKey(visited[j])), `stepped on ${tileKey(visited[j])}`).toBe(true);
          expect(canStep(keys, visited[j - 1], { x: visited[j].x - visited[j - 1].x, z: visited[j].z - visited[j - 1].z })).toBe(true);
        }
      }
    });
  }

  it('tapping a house walks to the nearest free tile next to it', () => {
    const l = buildIslandLayout(planOf('MAH'), layoutState());
    const keys = new Set(l.walkable.map(tileKey));
    const house = l.objects.find((o) => o.assetKey === 'house');
    if (!house) throw new Error('no house');
    const houseTile = t(house.x - 0.5, house.z - 0.5);
    expect(keys.has(tileKey(houseTile))).toBe(false);
    const w = new AvatarWalker(t(0, 0));
    w.setWalkable(keys, l.walkable);
    const goal = w.plan(houseTile, 1);
    expect(goal).not.toBeNull();
    expect(Math.max(Math.abs((goal as Tile).x - houseTile.x), Math.abs((goal as Tile).z - houseTile.z))).toBe(1);
  });

  it('finishes the current step before turning to a new destination', () => {
    const g = grid(['.....']);
    const list = [...g].map((k) => {
      const [x, z] = k.split(',').map(Number);
      return t(x, z);
    });
    const w = new AvatarWalker(t(0, 0));
    w.setWalkable(g, list);
    w.plan(t(4, 0), 1);
    w.update(0.2, 2.2); // mid-step towards (1,0)
    expect(w.t).toBeGreaterThan(0);
    expect(w.t).toBeLessThan(1);
    w.plan(t(0, 0), 2);
    expect(w.tile).toEqual(t(1, 0)); // still heading to (1,0)
    const { arrived } = walk(w);
    expect(arrived).toBe(2);
    expect(w.tile).toEqual(t(0, 0));
  });

  it('is rescued when its tile becomes blocked, and re-plans around new obstacles', () => {
    const open = grid(['...', '...', '...']);
    const listOf = (s: Set<string>) =>
      [...s].map((k) => {
        const [x, z] = k.split(',').map(Number);
        return t(x, z);
      });
    const w = new AvatarWalker(t(1, 1));
    w.setWalkable(open, listOf(open));
    const blocked = grid(['...', '.#.', '...']);
    w.setWalkable(blocked, listOf(blocked));
    expect(blocked.has(tileKey(w.tile))).toBe(true);

    w.plan(t(2, 2), 5);
    const wall = grid(['...', '.#.', '..#']);
    w.setWalkable(wall, listOf(wall));
    // (2,2) is now blocked: it goes to the nearest free tile instead.
    const { arrived } = walk(w);
    expect(arrived).toBe(5);
    expect(wall.has(tileKey(w.tile))).toBe(true);
  });

  it('keyboard steps only move to allowed neighbours and only when idle', () => {
    const g = grid(['.#', '..']);
    const list = [t(0, 0), t(0, 1), t(1, 1)];
    const w = new AvatarWalker(t(0, 0));
    w.setWalkable(g, list);
    expect(w.tryStep([t(1, 0)], 1)).toBeNull(); // blocked
    expect(w.tryStep([t(1, 1)], 1)).toBeNull(); // corner cut
    expect(w.tryStep([t(1, 1), t(0, 1)], 1)).toEqual(t(0, 1)); // slides to the next candidate
    expect(w.tryStep([t(1, 0)], 2)).toBeNull(); // busy walking
  });

  it('reports arrival once per destination', () => {
    const g = grid(['..']);
    const w = new AvatarWalker(t(0, 0));
    w.setWalkable(g, [t(0, 0), t(1, 0)]);
    w.plan(t(1, 0), 9);
    expect(walk(w).arrived).toBe(9);
    expect(w.update(1, 2.2).arrivedSeq).toBeNull();
  });
});

describe('AvatarWalker and other walkers (nobody walks through anybody)', () => {
  // an open 5×3 field: rows z = 0..2, columns x = 0..4
  const field: Tile[] = [];
  for (let x = 0; x < 5; x++) for (let z = 0; z < 3; z++) field.push(t(x, z));
  const keys = new Set(field.map(tileKey));

  it('waits while someone stands on the next tile, then walks on once it clears', () => {
    const w = new AvatarWalker(t(0, 1));
    w.setWalkable(keys, field);
    w.plan(t(4, 1), 1);
    let taken = true;
    const isTaken = (k: string) => taken && k === '1,1';
    for (let i = 0; i < 5; i++) w.update(0.1, 2, isTaken); // 0.5 s: shorter than DETOUR_AFTER
    expect(w.tile).toEqual(t(0, 1));
    taken = false;
    for (let i = 0; i < 40; i++) w.update(0.1, 2, isTaken);
    expect(w.tile).toEqual(t(4, 1));
  });

  it('walks around someone who stays put after waiting DETOUR_AFTER seconds', () => {
    const w = new AvatarWalker(t(0, 1));
    w.setWalkable(keys, field);
    w.plan(t(4, 1), 1);
    const isTaken = (k: string) => k === '1,1';
    const visited: string[] = [];
    for (let i = 0; i < 80; i++) {
      w.update(0.1, 2, isTaken);
      visited.push(tileKey(w.tile));
    }
    expect(w.tile).toEqual(t(4, 1));
    expect(visited).not.toContain('1,1');
    expect(DETOUR_AFTER).toBeGreaterThan(0.5);
  });

  it('keeps waiting when the destination itself is taken (no way around it)', () => {
    const w = new AvatarWalker(t(3, 1));
    w.setWalkable(keys, field);
    w.plan(t(4, 1), 1);
    for (let i = 0; i < 40; i++) w.update(0.1, 2, (k) => k === '4,1');
    expect(w.tile).toEqual(t(3, 1));
  });
});
