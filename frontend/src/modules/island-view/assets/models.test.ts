import { describe, expect, it } from 'vitest';
import { FIXED_ASSET_KEYS, type BuildingObject, type ObjectOf } from '../layout';
import { MOOD_PALETTES, scenePalette } from '../mood';
import { BUILDING_TREE } from '../plan/buildingTree';
import { fitZoom } from '../scene/camera';
import { remainingText } from '../scene/labelText';
import { futureLandParts, terrainParts } from '../scene/terrainParts';
import { asGhost, box } from './boxes';
import { building, constructionSite, house, reservedPlot, silhouette, tree, type BuildCtx } from './models';
import { BUILDING_VARIANTS, BUILDING_VOXELS } from './voxel/buildings';

/** Scenery context: 'sleepy' kept as the old name for snow on the ground. */
const ctx = (look: 'lively' | 'normal' | 'sleepy'): BuildCtx => ({ snow: look === 'sleepy', palette: scenePalette(look === 'sleepy') });
const houseItem = (activeToday: boolean): ObjectOf<'house'> => ({
  assetKey: 'house',
  id: 'house:a',
  houseId: 'a',
  x: 0.5,
  z: 0.5,
  stage: 0,
  nickname: 'A',
  activeToday,
  colorIndex: 0,
  founding: false,
  mine: false,
  houseType: 'bungalow',
  facing: 0,
  height: 0.9,
});

describe('box helpers', () => {
  it('box() puts the bottom at y', () => {
    expect(box('solid', 1, 2, 3, 1, 4, 1, '#fff').p).toEqual([1, 4, 3]);
  });
  it('asGhost() turns every part into the silhouette layer', () => {
    expect(asGhost([box('glow', 0, 0, 0, 1, 1, 1, '#fff')], '#ccc')).toEqual([
      { layer: 'ghost', p: [0, 0.5, 0], s: [1, 1, 1], c: '#ccc' },
    ]);
  });
});

describe('models', () => {
  it('no house glows by day, active or not: houses light up at night only (requirement v1.48 §7.2)', () => {
    expect(house(houseItem(true)).filter((p) => p.layer === 'glow')).toHaveLength(0);
    expect(house(houseItem(false)).filter((p) => p.layer === 'glow')).toHaveLength(0);
  });

  it('sleepy trees carry snow, others do not', () => {
    const t: ObjectOf<'tree'> = { assetKey: 'tree', id: 't', x: 0, z: 0, stage: 0, variant: 0 };
    const snow = (mood: 'lively' | 'sleepy') => tree(t, ctx(mood)).filter((p) => p.c === '#f6f8fb');
    expect(snow('sleepy').length).toBeGreaterThan(0);
    expect(snow('lively')).toHaveLength(0);
  });

  /** Build map steps drawn by the tree models (persona places and landmarks have their own tests). */
  const LOT_MODELS = BUILDING_TREE.buildings.filter((b) => b.tiles[0] > 0 && BUILDING_VOXELS[b.key]).map((b) => [b.key, b.tiles] as const);

  const built = (buildingKey: string, w: number, d: number, level = 1): BuildingObject => ({
    assetKey: `building.${buildingKey}`, id: 'b', x: 0, z: 0, stage: 0, w, d, facing: 0, variant: 0, buildingKey, title: buildingKey, level, next: null, upgrade: null,
  });

  it.each(LOT_MODELS)(
    '%s has a model that stays inside its lot',
    (key, [w, d]) => {
      const parts = building(built(key, w, d), ctx('normal'));
      expect(parts.length).toBeGreaterThan(2);
      for (const p of parts) {
        expect(Math.abs(p.p[0]) + p.s[0] / 2, `${key} x`).toBeLessThanOrEqual(w / 2 + 0.75);
        expect(Math.abs(p.p[2]) + p.s[2] / 2, `${key} z`).toBeLessThanOrEqual(d / 2 + 0.75);
      }
    },
  );

  it.each(LOT_MODELS)(
    '%s: every design fits its lot in every allowed facing (also a turned lot)',
    (key, [w, d]) => {
      const shapes: [number, number, number[]][] = w === d ? [[w, d, [0, 1, 2, 3]]] : [[w, d, [0, 2]], [d, w, [1, 3]]];
      for (const [lw, ld, facings] of shapes) {
        for (const facing of facings) {
          for (let variant = 0; variant < (BUILDING_VARIANTS[key] ?? 1); variant++) {
            const parts = building({ ...built(key, lw, ld), facing, variant }, ctx('normal'));
            for (const p of parts) {
              expect(Math.abs(p.p[0]) + p.s[0] / 2, `${key} ${lw}x${ld} f${facing} v${variant} x`).toBeLessThanOrEqual(lw / 2 + 0.1);
              expect(Math.abs(p.p[2]) + p.s[2] / 2, `${key} ${lw}x${ld} f${facing} v${variant} z`).toBeLessThanOrEqual(ld / 2 + 0.1);
            }
          }
        }
      }
    },
  );

  it('buildings with several designs really look different per design', () => {
    for (const [key, n] of Object.entries(BUILDING_VARIANTS)) {
      if (n < 2) continue;
      const size = BUILDING_TREE.buildings.find((b) => b.key === key)?.tiles ?? [3, 3];
      const looks = new Set(Array.from({ length: n }, (_, v) => JSON.stringify(building({ ...built(key, size[0], size[1]), variant: v }, ctx('normal')))));
      expect(looks.size, key).toBe(n);
    }
  });

  it('upgrades add one gold marker per level (max 4)', () => {
    const markers = (level: number) => building(built('fire-pit', 3, 3, level), ctx('normal')).filter((p) => p.c === '#f2c94c').length;
    expect([markers(1), markers(2), markers(3), markers(9)]).toEqual([0, 1, 2, 4]);
  });

  it('an upgrade adds a small scaffold inside the lot without hiding the building', () => {
    const plain = built('fire-pit', 3, 3, 1);
    const upgrading: BuildingObject = { ...plain, upgrade: { level: 2, progress: 0.4 } };
    const before = building(plain, ctx('normal'));
    const after = building(upgrading, ctx('normal'));
    expect(after.slice(0, before.length)).toEqual(before);
    const extra = after.slice(before.length);
    expect(extra.length).toBeGreaterThan(0);
    for (const p of extra) {
      expect(Math.abs(p.p[0]) + p.s[0] / 2).toBeLessThanOrEqual(1.5);
      expect(Math.abs(p.p[2]) + p.s[2] / 2).toBeLessThanOrEqual(1.5);
    }
  });

  it('unknown buildings get the placeholder model', () => {
    expect(building(built('pickleball-court', 2, 2), ctx('normal')).length).toBeGreaterThan(0);
  });

  it('silhouettes are translucent ghosts of the real building', () => {
    const parts = silhouette(
      { assetKey: 'silhouette', id: 's', x: 0, z: 0, stage: 0, w: 3, d: 3, facing: 0, variant: 0, buildingKey: 'fire-pit', title: 'Fire pit', ready: false, remaining: null },
      ctx('normal'),
    );
    expect(parts.length).toBeGreaterThan(5);
    expect(parts.every((p) => p.layer === 'ghost')).toBe(true);
  });

  it('construction sites fit their lot and add a frame from half progress', () => {
    const site = (progress: number): ObjectOf<'construction-site'> => ({
      assetKey: 'construction-site', id: 'c', x: 0, z: 0, stage: 0, w: 3, d: 2, facing: 0, variant: 0, buildingKey: 'frozen-pond', title: 'T', progress, level: 1,
    });
    expect(constructionSite(site(0.6)).length).toBeGreaterThan(constructionSite(site(0.2)).length);
    for (const [w, d] of [[1, 1], [2, 2], [3, 2], [2, 3], [3, 3]]) {
      for (const progress of [0.2, 0.8]) {
        for (const variant of [0, 1, 2]) {
          for (const p of constructionSite({ ...site(progress), w, d, variant })) {
            expect(Math.abs(p.p[0]) + p.s[0] / 2, `${w}x${d} v${variant} x`).toBeLessThanOrEqual(w / 2 + 0.01);
            expect(Math.abs(p.p[2]) + p.s[2] / 2, `${w}x${d} v${variant} z`).toBeLessThanOrEqual(d / 2 + 0.01);
          }
        }
      }
    }
  });

  it('construction sites stay calm: a low soft fence, orange only on the gate, three scaffold shapes', () => {
    const site = (variant: number): ObjectOf<'construction-site'> => ({
      assetKey: 'construction-site', id: 'c', x: 0, z: 0, stage: 0, w: 2, d: 2, facing: 0, variant, buildingKey: 'frozen-pond', title: 'T', progress: 0.2, level: 1,
    });
    const fence = constructionSite(site(0)).filter((p) => p.c === '#e6b896' || p.c === '#f1e7d6');
    expect(fence.length).toBeGreaterThan(0);
    for (const p of fence) expect(p.p[1] + p.s[1] / 2).toBeLessThanOrEqual(2 / 12 + 0.001); // at most two voxels tall
    expect(constructionSite(site(0)).filter((p) => p.c === '#f39a52')).toHaveLength(4); // two gate cones
    expect(constructionSite(site(0)).some((p) => p.c === '#ffffff')).toBe(false);
    const shapes = new Set([0, 1, 2].map((v) => JSON.stringify(constructionSite(site(v)))));
    expect(shapes.size).toBe(3);
  });

  it('reserved plots mark Main Street in blue and future buildings in orange', () => {
    const plot = (lotKind: string) => reservedPlot({ assetKey: 'reserved-plot', id: 'p', x: 0, z: 0, stage: 0, w: 2, d: 1, lotKind });
    expect(plot('main-street').some((p) => p.c === '#8ec5ea')).toBe(true);
    expect(plot('spare').some((p) => p.c === '#f39a52')).toBe(true);
  });
});

describe('registry', () => {
  it('has a component for every fixed asset key and one for buildings', async () => {
    const { ASSET_REGISTRY, BuildingAsset } = await import('./registry');
    for (const key of FIXED_ASSET_KEYS) expect(ASSET_REGISTRY[key], key).toBeTypeOf('function');
    expect(BuildingAsset).toBeTypeOf('function');
  });
});

describe('terrain', () => {
  it('draws one top tile per tile and dirt only under edge tiles', () => {
    const tiles = [
      { x: 0, z: 0, kind: 'grass' as const },
      { x: 1, z: 0, kind: 'path' as const },
    ];
    // full-size boxes only: one top tile per tile, four dirt layers under each edge tile
    const full = (parts: ReturnType<typeof terrainParts>) => parts.filter((p) => p.s[0] === 1 && p.s[2] === 1);
    const parts = terrainParts(tiles, new Set(['0,0', '1,0']), MOOD_PALETTES.normal);
    expect(full(parts)).toHaveLength(2 + 2 * 4); // both are edge tiles
    expect(full(terrainParts(tiles, null, MOOD_PALETTES.normal))).toHaveLength(10);
    // the detail (tufts, stones) stays on top of its own tile
    for (const p of parts.filter((q) => q.s[0] < 1)) expect(p.p[1]).toBeGreaterThanOrEqual(0);
  });

  it('keeps the ground calm: faint checker, few readable clumps and stones', () => {
    const lum = (hex: string) => {
      const n = parseInt(hex.slice(1), 16);
      return 0.2126 * (n >> 16) + 0.7152 * ((n >> 8) & 255) + 0.0722 * (n & 255);
    };
    for (const palette of Object.values(MOOD_PALETTES)) {
      expect(Math.abs(lum(palette.grass[0]) - lum(palette.grass[1]))).toBeLessThan(5);
      expect(Math.abs(lum(palette.path[0]) - lum(palette.path[1]))).toBeLessThan(5);
    }
    const field = (kind: 'grass' | 'path') => {
      const tiles = [];
      for (let x = 0; x < 20; x++) for (let z = 0; z < 20; z++) tiles.push({ x, z, kind });
      const land = new Set(tiles.map((t) => `${t.x},${t.z}`));
      return terrainParts(tiles, land, MOOD_PALETTES.normal).filter((p) => p.s[0] < 1);
    };
    const clumps = field('grass').filter((p) => p.s[0] > 0.15);
    expect(clumps.length / 400).toBeGreaterThan(0.05);
    expect(clumps.length / 400).toBeLessThan(0.2);
    for (const p of field('grass')) expect(p.s[0]).toBeGreaterThanOrEqual(1 / 12); // no sub-voxel specks
    expect(field('path').length / 400).toBeLessThan(0.3);
  });

  it('future land is a faint mist layer', () => {
    expect(futureLandParts([{ x: 3, z: 4 }]).every((p) => p.layer === 'mist')).toBe(true);
  });
});

describe('camera fit', () => {
  it('a bigger island needs a smaller zoom', () => {
    expect(fitZoom(32, 390, 844)).toBeLessThan(fitZoom(8, 390, 844));
  });
  it('the island diagonal fits the phone width', () => {
    for (const n of [8, 12, 16, 20, 26, 32]) expect(fitZoom(n, 390, 844) * n * Math.SQRT2).toBeLessThanOrEqual(390);
  });
  it('handles a zero-size viewport', () => {
    expect(fitZoom(12, 0, 0)).toBe(1);
  });
});

describe('remainingText (requirement.md §7.6)', () => {
  it.each([
    [{ streakDays: 1, residents: 0, requires: [] }, '1 more streak day'],
    [{ streakDays: 4, residents: 1, requires: [] }, '1 more neighbour · 4 more streak days'],
    [{ streakDays: 0, residents: 2, requires: ['warming-hut'] }, 'Build the Warming hut first · 2 more neighbours'],
    [{ streakDays: 0, residents: 0, requires: [] }, 'Opens tomorrow'],
  ])('%o → %s', (remaining, text) => {
    expect(remainingText(remaining)).toBe(text);
  });
});

describe('villager personalities', () => {
  it('are deterministic and stay in range', async () => {
    const { villagerPersonality } = await import('./villagerPersonality');
    expect(villagerPersonality(3)).toEqual(villagerPersonality(3));
    for (let i = 0; i < 20; i++) {
      const p = villagerPersonality(i);
      expect(p.speedFactor).toBeGreaterThanOrEqual(0.65);
      expect(p.speedFactor).toBeLessThanOrEqual(1.25);
      expect(p.restFactor).toBeGreaterThanOrEqual(0.6);
      expect(p.restFactor).toBeLessThanOrEqual(1.6);
    }
  });

  it('differ between villagers (not in lockstep), and only some hop', async () => {
    const { villagerPersonality } = await import('./villagerPersonality');
    const all = Array.from({ length: 20 }, (_, i) => villagerPersonality(i));
    expect(new Set(all.map((p) => p.speedFactor.toFixed(3))).size).toBeGreaterThan(15);
    const hoppers = all.filter((p) => p.hops).length;
    expect(hoppers).toBeGreaterThan(0);
    expect(hoppers).toBeLessThan(20);
  });

  it('even the fastest villager walks slower than one tile per second', () => {
    expect(MOOD_PALETTES.lively.villagerSpeed * 1.25).toBeLessThan(1);
  });
});

describe('camera frame', () => {
  it('aims at the centre of the tiles and measures them on screen', async () => {
    const { viewFrame, zoomForFrame } = await import('../scene/camera');
    const tiles = Array.from({ length: 10 }, (_, i) => ({ x: i + 20, z: 0 }));
    const f = viewFrame(tiles, 0); // camera from +z: x runs across the screen
    expect(f.cx).toBeCloseTo(25);
    expect(f.cz).toBeCloseTo(0.5);
    expect(f.width).toBeCloseTo(10);
    expect(zoomForFrame(f, 390, 844)).toBeCloseTo((390 * 0.88) / 10);
    expect(viewFrame([], 0)).toEqual({ cx: 0, cz: 0, width: 8, height: 8 });
  });
});

describe('island orientation (World Map)', () => {
  it('every island uses the same diagonal angle', async () => {
    const { ISLAND_AZIMUTH } = await import('../scene/camera');
    expect(ISLAND_AZIMUTH).toBeCloseTo(Math.PI / 4);
  });
  it('east runs to the lower right and north to the upper right in the default view', async () => {
    const { ISLAND_AZIMUTH, viewFrame } = await import('../scene/camera');
    // A strip running east (like Bayview) is wider than tall on screen.
    const eastWest = Array.from({ length: 20 }, (_, i) => ({ x: i, z: 0 }));
    const f = viewFrame(eastWest, ISLAND_AZIMUTH);
    expect(f.width).toBeGreaterThan(10);
    // Screen axes for the camera: right = (cos a, -sin a), up = (-sin a, -cos a) in x/z.
    const a = ISLAND_AZIMUTH;
    const right = (x: number, z: number) => x * Math.cos(a) - z * Math.sin(a);
    const up = (x: number, z: number) => -x * Math.sin(a) - z * Math.cos(a);
    expect(right(1, 0)).toBeGreaterThan(0); // east → right
    expect(up(1, 0)).toBeLessThan(0); // east → down
    expect(right(0, -1)).toBeGreaterThan(0); // north → right
    expect(up(0, -1)).toBeGreaterThan(0); // north → up
  });
  it('land extent follows the real edge in each screen direction (clouds tuck beside it)', async () => {
    const { landExtent } = await import('../scene/camera');
    // a long strip along +x from the origin: from a camera due south (azimuth 0), right = +x
    const strip = Array.from({ length: 10 }, (_, i) => ({ x: i, z: 0 }));
    const e = landExtent(strip, 0);
    expect(e.right).toBe(10);
    expect(e.left).toBe(0);
    expect(e.front).toBe(1);
    expect(e.back).toBe(0);
    // the camera moved a quarter turn to the east (+x): the strip now runs towards the camera
    const q = landExtent(strip, Math.PI / 2);
    expect(q.front).toBeCloseTo(10);
    expect(q.left).toBeCloseTo(1);
  });

  it('north arrow angle follows the camera', async () => {
    const { ISLAND_AZIMUTH, northScreenAngle } = await import('../scene/camera');
    expect(northScreenAngle(0, -1)).toBeCloseTo(0); // looking north: north is up
    expect(Math.abs(northScreenAngle(0, 1))).toBeCloseTo(Math.PI); // looking south: north is down
    expect(northScreenAngle(1, 0)).toBeCloseTo(-Math.PI / 2); // looking east: north is left
    const a = ISLAND_AZIMUTH; // default camera looks along (-sin a, -cos a)
    expect(northScreenAngle(-Math.sin(a), -Math.cos(a))).toBeCloseTo(Math.PI / 4); // upper right
  });
});
