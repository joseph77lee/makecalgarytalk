import { BoxGeometry, BufferAttribute, Box3, Matrix4, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { clusterColours, colourDistance, fitScale, frontYaw, isGlassColour, normalise } from './normalise';
import { groupPlacements, placementMatrix } from './placement';

const coloured = (w: number, h: number, d: number, rgb: [number, number, number], at = new Matrix4()) => {
  const g = new BoxGeometry(w, h, d);
  const n = g.getAttribute('position').count;
  const c = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) c.set(rgb, i * 3);
  g.setAttribute('color', new BufferAttribute(c, 3));
  return { geometry: g, matrix: at, door: false };
};

describe('colour helpers', () => {
  it('measures distance in sRGB, so dark shades of different colours stay apart', () => {
    expect(colourDistance('#000000', '#ffffff')).toBeCloseTo(Math.sqrt(3));
    // a dark brown roof and a dark slate base (split-level house) must not merge
    expect(colourDistance('#4a3927', '#3e4a52')).toBeGreaterThan(0.09);
  });
  it('groups shades of one colour, largest first', () => {
    const groups = clusterColours(new Map([['#45545e', 7], ['#404d55', 6], ['#e0d1b2', 3], ['#3e4a52', 2]]));
    expect(groups.get('#404d55')).toBe('#45545e');
    expect(groups.get('#3e4a52')).toBe('#45545e');
    expect(groups.get('#e0d1b2')).toBe('#e0d1b2');
  });
  it('tells window glass by sRGB colour and share', () => {
    expect(isGlassColour('#2f3f52', 0.07)).toBe(true);
    expect(isGlassColour('#2f3f52', 0.5)).toBe(false); // too much of the model
    expect(isGlassColour('#8e3a2e', 0.02)).toBe(false); // brick
    expect(isGlassColour('#f4f7fa', 0.02)).toBe(false); // white
  });
});

describe('fitting', () => {
  it('turns the door side to +z', () => {
    const c = new Vector3();
    const door = (x: number, z: number) => new Box3(new Vector3(x - 0.1, 0, z - 0.1), new Vector3(x + 0.1, 1, z + 0.1));
    expect(frontYaw(door(0, 2), c)).toBe(0);
    expect(frontYaw(door(0, -2), c)).toBe(Math.PI);
    expect(frontYaw(door(2, 0), c)).toBe(-Math.PI / 2);
    expect(frontYaw(door(-2, 0), c)).toBe(Math.PI / 2);
    expect(frontYaw(null, c)).toBe(0);
  });
  it('scales by footprint, height or real metres', () => {
    const size = new Vector3(10, 5, 20);
    expect(fitScale({ footprint: 1 }, size)).toBeCloseTo(0.05);
    expect(fitScale({ height: 1 }, size)).toBeCloseTo(0.2);
    expect(fitScale({ metres: true }, size)).toBeCloseTo(0.1);
  });
  it('normalises a house: centred, on the ground, front to +z, roof and wall flagged', () => {
    const wall = coloured(10, 4, 8, [0.8, 0.7, 0.5], new Matrix4().makeTranslation(5, 2, 3));
    const roof = coloured(10, 0.5, 8, [0.3, 0.05, 0.03], new Matrix4().makeTranslation(5, 4.25, 3));
    const door = { ...coloured(1, 2, 0.2, [0.2, 0.1, 0.05], new Matrix4().makeTranslation(9.9, 1, 3)), door: true };
    const m = normalise([wall, roof, door], 'house', { footprint: 1 });
    const box = m.geometry.boundingBox!;
    expect(box.min.y).toBeCloseTo(0);
    expect(Math.max(m.size.x, m.size.z)).toBeCloseTo(1);
    // the door was on +x; after turning it is on +z, so the long side (10) now runs along z
    expect(m.size.z).toBeGreaterThan(m.size.x);
    const sum = (k: string) => Array.from(m.geometry.getAttribute(k).array as Float32Array).reduce((a, b) => a + b, 0);
    expect(sum('aRoof')).toBeGreaterThan(0);
    expect(sum('aWall')).toBeGreaterThan(0);
  });
  it('lays cars along x', () => {
    const m = normalise([coloured(2, 1.5, 4.5, [0.5, 0.1, 0.1])], 'car', { metres: true });
    expect(m.size.x).toBeCloseTo(0.45);
    expect(m.size.z).toBeCloseTo(0.2);
  });
});

describe('placements', () => {
  it('builds turn, mirror and scale into the instance matrix', () => {
    const p = new Vector3(1, 0, 0).applyMatrix4(placementMatrix({ model: 'ranch', x: 3, z: 4, turn: Math.PI / 2, mirror: true, scale: 2 }));
    // mirrored (x → −2), then turned a quarter (−x → +z), then moved
    expect(p.x).toBeCloseTo(3);
    expect(p.z).toBeCloseTo(6);
  });
  it('groups by model and mirroring (mirrored copies need their own mesh)', () => {
    const g = groupPlacements([
      { model: 'ranch', x: 0, z: 0, turn: 0 },
      { model: 'ranch', x: 1, z: 0, turn: 0, mirror: true },
      { model: 'ranch', x: 2, z: 0, turn: 0 },
      { model: 'suv', x: 0, z: 1, turn: 0 },
    ]);
    expect([...g.keys()].sort()).toEqual(['ranch', 'ranch:m', 'suv']);
    expect(g.get('ranch')!.list).toHaveLength(2);
  });
});
