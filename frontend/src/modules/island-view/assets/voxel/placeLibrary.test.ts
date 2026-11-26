import { describe, expect, it } from 'vitest';
import { extent } from './designFit';
import { PLACE_LIBRARY, personaTrack, type Persona, type PlaceKey } from './placeLibrary';
import { V } from './voxel';

const KEYS = Object.keys(PLACE_LIBRARY) as PlaceKey[];
/** Planks of the older lake pieces stick out a fraction of a voxel. */
const SLACK = 0.25;
const BUILT_PERSONAS: Persona[] = ['lake', 'river', 'downtown', 'historic_main_street', 'golf', 'new_suburb', 'hill_view', 'food_street', 'mature_suburb', 'special_district'];

describe('place library', () => {
  it.each(KEYS)('%s stays inside its footprint and stands on the ground', (key) => {
    const place = PLACE_LIBRARY[key];
    for (const seed of [1, 7, 23, 101]) {
      const parts = place.build(seed);
      expect(parts.length).toBeGreaterThan(5);
      const e = extent(parts);
      expect(e.w).toBeLessThanOrEqual(place.tiles[0] * V + SLACK);
      expect(e.d).toBeLessThanOrEqual(place.tiles[1] * V + SLACK);
      expect(Math.abs(e.cx)).toBeLessThan(1e-6);
      expect(Math.abs(e.cz)).toBeLessThan(1e-6);
      expect(e.h).toBeGreaterThan(0);
      for (const b of parts) for (const n of [...b.p, ...b.s]) expect(Number.isFinite(n)).toBe(true);
    }
  });

  it.each(KEYS)('%s fills most of the land it takes', (key) => {
    const place = PLACE_LIBRARY[key];
    const e = extent(place.build(7));
    expect((e.w * e.d) / (place.tiles[0] * place.tiles[1] * V * V)).toBeGreaterThanOrEqual(0.7);
  });

  it('is deterministic for a seed', () => {
    for (const key of KEYS) expect(PLACE_LIBRARY[key].build(5)).toEqual(PLACE_LIBRARY[key].build(5));
  });

  it.each(BUILT_PERSONAS)('the %s track has steps 1–4 in order, ending in its landmark', (persona) => {
    const track = personaTrack(persona);
    expect(track.map((k) => PLACE_LIBRARY[k].step)).toEqual([1, 2, 3, 4]);
  });

  it.each(BUILT_PERSONAS)('the %s landmark is the tallest step and lights up at night', (persona) => {
    const track = personaTrack(persona);
    const landmark = PLACE_LIBRARY[track[track.length - 1]].build(3);
    expect(landmark.some((b) => b.layer === 'glow')).toBe(true);
    const h = extent(landmark).h;
    for (const k of track.slice(0, -1)) expect(extent(PLACE_LIBRARY[k].build(3)).h).toBeLessThanOrEqual(h);
  });

  it('big grounds take real space (operator, 2026-11-26)', () => {
    const area = (k: PlaceKey) => PLACE_LIBRARY[k].tiles[0] * PLACE_LIBRARY[k].tiles[1];
    expect(area('place.mature-suburb.ball-diamond')).toBeGreaterThanOrEqual(25);
    expect(area('place.golf.golf-hole')).toBeGreaterThanOrEqual(15);
    expect(area('place.golf.driving-range')).toBeGreaterThanOrEqual(15);
    expect(area('place.mature-suburb.tennis-courts')).toBeGreaterThanOrEqual(6);
    for (const k of ['place.golf.clubhouse', 'place.special-district.hay-field', 'place.special-district.horse-corral', 'place.new-suburb.storm-pond', 'place.mature-suburb.leisure-centre', 'place.main-street.sandstone-school', 'place.downtown.signature-tower', 'place.food-street.food-hall'] as const) expect(area(k)).toBeGreaterThanOrEqual(9);
  });

  it('keys follow place.<persona>.<name>', () => {
    for (const key of KEYS) expect(key).toMatch(/^place\.[a-z-]+\.[a-z-]+$/);
  });
});
