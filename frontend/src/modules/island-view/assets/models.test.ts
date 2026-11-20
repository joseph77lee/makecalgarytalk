import { describe, expect, it } from 'vitest';
import { FIXED_ASSET_KEYS, type BuildingObject, type ObjectOf } from '../layout';
import { MOOD_PALETTES } from '../mood';
import { BUILDING_TREE } from '../plan/buildingTree';
import { fitZoom } from '../scene/camera';
import { remainingText } from '../scene/labelText';
import { futureLandParts, terrainParts } from '../scene/terrainParts';
import { asGhost, box } from './boxes';
import { building, constructionSite, house, reservedPlot, silhouette, tree, type BuildCtx } from './models';

const ctx = (mood: 'lively' | 'normal' | 'gloomy'): BuildCtx => ({ mood, palette: MOOD_PALETTES[mood] });
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
  it('active houses have lit windows; inactive houses have none (requirement.md §7.2)', () => {
    expect(house(houseItem(true)).filter((p) => p.layer === 'glow')).toHaveLength(3);
    expect(house(houseItem(false)).filter((p) => p.layer === 'glow')).toHaveLength(0);
  });

  it('gloomy trees carry snow, others do not', () => {
    const t: ObjectOf<'tree'> = { assetKey: 'tree', id: 't', x: 0, z: 0, stage: 0, variant: 0 };
    const snow = (mood: 'lively' | 'gloomy') => tree(t, ctx(mood)).filter((p) => p.c === '#f6f8fb');
    expect(snow('gloomy')).toHaveLength(1);
    expect(snow('lively')).toHaveLength(0);
  });

  const built = (buildingKey: string, w: number, d: number, level = 1): BuildingObject => ({
    assetKey: `building.${buildingKey}`, id: 'b', x: 0, z: 0, stage: 0, w, d, buildingKey, title: buildingKey, level, next: null, upgrade: null,
  });

  it.each(BUILDING_TREE.buildings.filter((b) => b.lot).map((b) => [b.key, BUILDING_TREE.lots[b.lot as string].size] as const))(
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
      { assetKey: 'silhouette', id: 's', x: 0, z: 0, stage: 0, w: 3, d: 3, buildingKey: 'fire-pit', title: 'Fire pit', ready: false, remaining: null },
      ctx('normal'),
    );
    expect(parts.length).toBeGreaterThan(5);
    expect(parts.every((p) => p.layer === 'ghost')).toBe(true);
  });

  it('construction sites fit their lot and add a frame from half progress', () => {
    const site = (progress: number): ObjectOf<'construction-site'> => ({
      assetKey: 'construction-site', id: 'c', x: 0, z: 0, stage: 0, w: 3, d: 2, buildingKey: 'frozen-pond', title: 'T', progress, level: 1,
    });
    expect(constructionSite(site(0.6)).length).toBeGreaterThan(constructionSite(site(0.2)).length);
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
    const parts = terrainParts(tiles, new Set(['0,0', '1,0']), MOOD_PALETTES.normal);
    expect(parts).toHaveLength(2 + 2 * 2); // both are edge tiles
    expect(terrainParts(tiles, null, MOOD_PALETTES.normal)).toHaveLength(6);
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
    [{ streakDays: 0, residents: 2, requires: ['frozen-pond'] }, 'Build the Frozen pond first · 2 more neighbours'],
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

describe('screen azimuth', () => {
  it('keeps the stored angle on portrait screens and for compact shapes; turns 90° on landscape', async () => {
    const { screenAzimuth } = await import('../scene/camera');
    expect(screenAzimuth(1.4, false)).toBe(1.4);
    expect(screenAzimuth(Math.PI / 4, true)).toBe(Math.PI / 4);
    expect(screenAzimuth(1.4, true)).toBeCloseTo(1.4 - Math.PI / 2);
  });
});
