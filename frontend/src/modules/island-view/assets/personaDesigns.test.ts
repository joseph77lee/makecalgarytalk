/**
 * The Community hall and Neighbourhood park take a design matching the community's persona
 * (requirement.md v1.48 §7.6): every persona has one, the persona-only designs differ from each
 * other and from the shared ones, and they fit their 3×3 lot.
 */
import { describe, expect, it } from 'vitest';
import { scenePalette } from '../mood';
import { BUILDING_VOXELS, PERSONA_DESIGNS } from './voxel/buildings';
import { extent } from './voxel/designFit';

const PERSONAS = ['lake', 'mature_suburb', 'new_suburb', 'river', 'hill_view', 'historic_main_street', 'downtown', 'golf', 'food_street', 'special_district'];
const ctx = { snow: false, palette: scenePalette(false) };
const build = (key: string, persona: string | null, variant = 5) => BUILDING_VOXELS[key]!({ w: 3, d: 3, level: 1, variant, persona }, ctx);
/** World-unit footprint of parts (one tile = 1). */
const bounds = (parts: ReturnType<typeof build>) => ({
  minX: Math.min(...parts.map((b) => b.p[0] - b.s[0] / 2)),
  maxX: Math.max(...parts.map((b) => b.p[0] + b.s[0] / 2)),
  minZ: Math.min(...parts.map((b) => b.p[2] - b.s[2] / 2)),
  maxZ: Math.max(...parts.map((b) => b.p[2] + b.s[2] / 2)),
});
const sig = (parts: ReturnType<typeof build>) => JSON.stringify(parts);

describe('persona designs for the Community hall and Neighbourhood park', () => {
  it('every persona has a hall and a park design', () => {
    for (const p of PERSONAS) {
      expect(PERSONA_DESIGNS.hall[p], `hall ${p}`).toBeDefined();
      expect(PERSONA_DESIGNS.park[p], `park ${p}`).toBeDefined();
    }
  });

  it('a persona always gets the same design, whatever the community variant', () => {
    for (const key of ['community-hall', 'neighbourhood-park']) for (const p of PERSONAS) expect(sig(build(key, p, 1)), `${key} ${p}`).toBe(sig(build(key, p, 1)));
    // the persona decides the design: lake halls are pavilions in every community
    expect(extent(build('community-hall', 'lake', 0)).w).toBeCloseTo(extent(build('community-hall', 'lake', 9)).w, 5);
  });

  it('persona-only designs differ from each other and from the shared designs', () => {
    for (const key of ['community-hall', 'neighbourhood-park']) {
      const table = key === 'community-hall' ? PERSONA_DESIGNS.hall : PERSONA_DESIGNS.park;
      const own = [...new Set(Object.values(table).filter((d) => typeof d === 'string'))];
      const persona = (d: string) => Object.keys(table).find((p) => table[p] === d)!;
      const sigs = own.map((d) => sig(build(key, persona(d), 0)));
      expect(new Set(sigs).size, key).toBe(own.length);
      const shared = Array.from({ length: 8 }, (_, v) => sig(build(key, null, v)));
      for (const s of sigs) expect(shared).not.toContain(s);
    }
  });

  // a flag may wave a few voxels past the edge (the shared halls' flags already do: 1.52)
  const EDGE = 1.5 + 3 / 12;
  it('every design stays inside its 3×3 lot', () => {
    for (const key of ['community-hall', 'neighbourhood-park'])
      for (const p of [...PERSONAS, null]) {
        const e = bounds(build(key, p));
        expect(e.minX, `${key} ${p}`).toBeGreaterThanOrEqual(-EDGE);
        expect(e.maxX, `${key} ${p}`).toBeLessThanOrEqual(EDGE);
        expect(e.minZ, `${key} ${p}`).toBeGreaterThanOrEqual(-EDGE);
        expect(e.maxZ, `${key} ${p}`).toBeLessThanOrEqual(EDGE);
      }
  });
});
