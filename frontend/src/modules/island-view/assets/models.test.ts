import { describe, expect, it } from 'vitest';
import { ASSET_KEYS, buildIslandLayout, type ObjectOf } from '../layout';
import mock from '../mockCommunityState.json';
import { MOOD_PALETTES } from '../mood';
import { parseCommunityViewState } from '../parseState';
import { fitZoom } from '../scene/camera';
import { remainingText } from '../scene/labelText';
import { terrainParts } from '../scene/terrainParts';
import { asGhost, box } from './boxes';
import { constructionSite, house, lamp, silhouette, tree, type BuildCtx } from './models';

const ctx = (mood: 'lively' | 'normal' | 'gloomy'): BuildCtx => ({ mood, palette: MOOD_PALETTES[mood] });
const houseItem = (activeToday: boolean): ObjectOf<'house'> => ({
  assetKey: 'house',
  id: 'house:a',
  houseId: 'a',
  x: 0.5,
  z: 0.5,
  ring: 0,
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

  it('silhouettes are entirely translucent ghosts of the real building', () => {
    const parts = silhouette(
      { assetKey: 'silhouette', id: 's', x: 0, z: 0, ring: 0, target: 'community-centre', remaining: { streakDays: 1, residents: 0 } },
      ctx('normal'),
    );
    expect(parts.length).toBeGreaterThan(5);
    expect(parts.every((p) => p.layer === 'ghost')).toBe(true);
  });

  it('gloomy trees carry snow, others do not', () => {
    const t: ObjectOf<'tree'> = { assetKey: 'tree', id: 't', x: 0, z: 0, ring: 0, variant: 0 };
    const snow = (mood: 'lively' | 'gloomy') => tree(t, ctx(mood)).filter((p) => p.c === '#f6f8fb');
    expect(snow('gloomy')).toHaveLength(1);
    expect(snow('lively')).toHaveLength(0);
  });

  it('lamps glow only when lively', () => {
    const l: ObjectOf<'lamp'> = { assetKey: 'lamp', id: 'l', x: 0, z: 0, ring: 0 };
    expect(lamp(l, ctx('lively')).some((p) => p.layer === 'glow')).toBe(true);
    expect(lamp(l, ctx('normal')).some((p) => p.layer === 'glow')).toBe(false);
  });

  it('the frame stage adds a frame on top of the scaffolding', () => {
    const site = (stage: 'scaffolding' | 'frame'): ObjectOf<'construction-site'> => ({
      assetKey: 'construction-site', id: 'c', x: 0, z: 0, ring: 0, stage, progress: 0.5, title: 'T',
    });
    expect(constructionSite(site('frame')).length).toBeGreaterThan(constructionSite(site('scaffolding')).length);
  });
});

describe('registry', () => {
  it('has a model for every asset key the layout can emit', async () => {
    // Imported lazily: the registry pulls in React Three Fiber components.
    const { ASSET_REGISTRY } = await import('./registry');
    for (const key of ASSET_KEYS) expect(ASSET_REGISTRY[key], key).toBeTypeOf('function');
  });
});

describe('terrain', () => {
  it('draws one top tile per tile and dirt only from the given ring', () => {
    const r = parseCommunityViewState(mock);
    if (!r.ok) throw new Error('mock invalid');
    const l = buildIslandLayout({ ...r.state, islandSize: 8 });
    const parts = terrainParts(l.tiles, MOOD_PALETTES.normal, 3);
    const edgeTiles = l.tiles.filter((t) => t.ring === 3).length;
    expect(parts).toHaveLength(64 + edgeTiles * 2);
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
    [{ streakDays: 1, residents: 0 }, '1 more streak day'],
    [{ streakDays: 4, residents: 1 }, '4 more streak days · 1 more resident'],
    [{ streakDays: 0, residents: 2 }, '2 more residents'],
    [{ streakDays: 0, residents: 0 }, 'Unlocks tomorrow'],
  ])('%o → %s', (remaining, text) => {
    expect(remainingText(remaining)).toBe(text);
  });
});
