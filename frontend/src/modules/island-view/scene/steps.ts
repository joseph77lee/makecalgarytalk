import type { Tile } from '../layout';
import type { Crowd } from './crowd';

const N4: Tile[] = [
  { x: 1, z: 0 },
  { x: -1, z: 0 },
  { x: 0, z: 1 },
  { x: 0, z: -1 },
];

/**
 * The tiles a wandering walker (villager or animal) may step onto from `at`: walkable, and not
 * claimed by anybody else (avatar, villagers, animals), so nobody walks through anybody.
 */
export function freeSteps(at: Tile, walkableKeys: ReadonlySet<string>, crowd: Crowd, id: string): Tile[] {
  return N4.map((d) => ({ x: at.x + d.x, z: at.z + d.z })).filter((n) => {
    const k = `${n.x},${n.z}`;
    return walkableKeys.has(k) && !crowd.takenByOther(k, id);
  });
}

/** What a walker claims: the tile it stands on, plus the tile it is stepping onto while moving. */
export function claimedTiles(from: Tile, to: Tile, moving: boolean): string[] {
  return moving ? [`${from.x},${from.z}`, `${to.x},${to.z}`] : [`${to.x},${to.z}`];
}
