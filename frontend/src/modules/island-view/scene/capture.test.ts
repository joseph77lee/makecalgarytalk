import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { finishedExampleState } from '../example';
import { buildIslandLayout } from '../layout';
import { decodePlan } from '../plan/islandPlan';
import { opaqueBox } from './capture';
import { bloomTiles } from './bloomTiles';

describe('island picture crop', () => {
  it('finds the box of visible pixels', () => {
    const w = 4, h = 3;
    const data = new Uint8ClampedArray(w * h * 4);
    data[(1 * w + 1) * 4 + 3] = 255;
    data[(2 * w + 2) * 4 + 3] = 255;
    expect(opaqueBox(data, w, h)).toEqual({ x: 1, y: 1, w: 2, h: 2 });
  });
  it('nothing visible → null; nearly transparent pixels are ignored', () => {
    const data = new Uint8ClampedArray(2 * 2 * 4);
    data[3] = 5;
    expect(opaqueBox(data, 2, 2)).toBeNull();
  });
});

describe('revival flowers', () => {
  const DIR = join(dirname(fileURLToPath(import.meta.url)), '../../../../public/islands');
  const plan = decodePlan(JSON.parse(readFileSync(join(DIR, 'MAH.json'), 'utf8')));
  const layout = buildIslandLayout(plan, finishedExampleState('Mahogany'));
  it('only on free grass (no paths, water or objects), capped and stable', () => {
    const tiles = bloomTiles(layout, 40);
    expect(tiles.length).toBe(40);
    const grass = new Set(layout.tiles.filter((t) => t.kind === 'grass').map((t) => `${t.x},${t.z}`));
    const used = new Set(layout.objects.map((o) => `${Math.floor(o.x)},${Math.floor(o.z)}`));
    for (const t of tiles) {
      expect(grass.has(`${t.x},${t.z}`)).toBe(true);
      expect(used.has(`${t.x},${t.z}`)).toBe(false);
    }
    expect(bloomTiles(layout, 40)).toEqual(tiles);
  });
});
