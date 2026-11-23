import { hash01, tileKey, type IslandLayout } from '../layout';

const MAX_PATCHES = 90;

/** Free grass tiles for revival flowers: not paths/water, not under objects; stable order. */
export function bloomTiles(layout: IslandLayout, max = MAX_PATCHES): { x: number; z: number; variant: number }[] {
  const used = new Set(layout.objects.map((o) => `${Math.floor(o.x)},${Math.floor(o.z)}`));
  return layout.tiles
    .filter((t) => t.kind === 'grass' && !used.has(tileKey(t)))
    .map((t) => ({ t, h: hash01(t.x, t.z, 7) }))
    .sort((a, b) => a.h - b.h)
    .slice(0, max)
    .map(({ t, h }) => ({ x: t.x, z: t.z, variant: Math.floor(h * 1000) % 4 }));
}
