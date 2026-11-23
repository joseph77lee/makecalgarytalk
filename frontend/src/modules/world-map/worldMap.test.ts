import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { isStatusList } from './api';
import { bbox, communityAt, fitView, frameBox, iconPlan, iconSpots, inCommunity, isShapes, type MapCommunity } from './geometry';
import { levelText, searchCommunities } from './mapText';

const FILE = join(dirname(fileURLToPath(import.meta.url)), '../../../public/worldmap/calgary.json');
const shapes: unknown = JSON.parse(readFileSync(FILE, 'utf8'));

const square: MapCommunity = { code: 'SQR', name: 'Square', area: 4e6, label: [1000, 1000], rings: [[0, 0, 2000, 0, 2000, 2000, 0, 2000]] };

describe('the stored map shapes', () => {
  it('has all 223 residential communities, valid and small', () => {
    expect(isShapes(shapes)).toBe(true);
    if (!isShapes(shapes)) return;
    expect(shapes.communities).toHaveLength(223);
    expect(readFileSync(FILE).length).toBeLessThan(200 * 1024);
  });
  it('every label point lies inside its community', () => {
    if (!isShapes(shapes)) return;
    for (const c of shapes.communities) expect(inCommunity(c, c.label[0], c.label[1]), c.code).toBe(true);
  });
  it('every community can be tapped at its label point', () => {
    if (!isShapes(shapes)) return;
    const list = shapes.communities.map((c) => ({ c, box: bbox(c) }));
    for (const c of shapes.communities) expect(communityAt(list, c.label[0], c.label[1])?.code, c.code).toBe(c.code);
  });
});

describe('map geometry', () => {
  it('point in community and hit test', () => {
    expect(inCommunity(square, 10, 10)).toBe(true);
    expect(inCommunity(square, -10, 10)).toBe(false);
    expect(communityAt([{ c: square, box: bbox(square) }], 2500, 100)).toBeNull();
  });
  it('icon spots stay inside, away from the edge, label first, stable', () => {
    const spots = iconSpots(square, 200, 100);
    expect(spots[0]).toEqual([1000, 1000]);
    for (const [x, y] of spots.slice(1)) {
      expect(x).toBeGreaterThanOrEqual(100);
      expect(y).toBeLessThanOrEqual(1900);
    }
    expect(iconSpots(square, 200, 100)).toEqual(spots);
  });
  it('icons: a cloud when unsettled, the main building first, more when zoomed in and with a higher level', () => {
    expect(iconPlan(0, 4e6, 50, 1)).toEqual(['cloud']);
    expect(iconPlan(1, 4e6, 1, 1)).toEqual(['sign']);
    expect(iconPlan(3, 4e6, 2, 1)).toEqual(['hall', 'house']);
    expect(iconPlan(4, 4e6, 3, 1).slice(0, 2)).toEqual(['park', 'hall']);
    expect(iconPlan(2, 4e6, 1, 0)[0]).toBe('playground');
    expect(iconPlan(2, 4e6, 1, 1)[0]).toBe('rink');
    expect(iconPlan(1, 4e6, 100, 1).length).toBeLessThan(iconPlan(4, 4e6, 100, 1).length);
    expect(iconPlan(4, 1e6, 100, 1).length).toBeLessThan(iconPlan(4, 8e6, 100, 1).length);
  });
  it('fit and frame views', () => {
    const v = fitView(30000, 40000, 390, 700);
    expect(30000 * v.scale).toBeLessThanOrEqual(390);
    expect(40000 * v.scale).toBeLessThanOrEqual(700);
    const f = frameBox(bbox(square), 390, 700, 1);
    expect(1000 * f.scale + f.ox).toBeCloseTo(195);
  });
});

describe('map texts and data', () => {
  it('levels', () => {
    expect(levelText(0)).toBe('Not settled yet');
    expect(levelText(4)).toBe('Flourishing');
    expect(levelText(9)).toBe('Flourishing');
  });
  it('search by name, name starts first', () => {
    const list = [
      { code: 'MAH', name: 'Mahogany' },
      { code: 'MKT', name: 'McKenzie Towne' },
      { code: 'CRA', name: 'Cranston' },
    ];
    expect(searchCommunities(list, 'mah').map((c) => c.code)).toEqual(['MAH']);
    expect(searchCommunities(list, 'n').map((c) => c.code)).toEqual(['CRA', 'MAH', 'MKT']);
    expect(searchCommunities(list, '  ')).toEqual([]);
  });
  it('status list checks', () => {
    expect(isStatusList([{ code: 'MAH', id: 'x', level: 2, vitality: 60, residents: 4 }])).toBe(true);
    expect(isStatusList([{ code: 'MAH', id: 'x', level: 7, vitality: null, residents: 4 }])).toBe(false);
    expect(isStatusList(null)).toBe(false);
  });
});
