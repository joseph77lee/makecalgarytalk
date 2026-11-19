import { describe, expect, it } from 'vitest';
import mock from './mockCommunityState.json';
import { vitalityMood } from './mood';
import { parseCommunityViewState } from './parseState';

describe('vitalityMood (requirement.md §7.4)', () => {
  it.each([
    [0, 'gloomy'],
    [29.99, 'gloomy'],
    [30, 'normal'],
    [59.99, 'normal'],
    [60, 'lively'],
    [100, 'lively'],
  ] as const)('%s → %s', (v, mood) => {
    expect(vitalityMood(v)).toBe(mood);
  });
});

const valid = () => structuredClone(mock) as Record<string, unknown>;
const errorsOf = (input: unknown) => {
  const r = parseCommunityViewState(input);
  return r.ok ? [] : r.errors;
};
const building = (patch: Record<string, unknown> = {}) => ({
  key: 'fire-pit', status: 'built', level: 1, progress: 1, title: 'Fire pit', remaining: null, ...patch,
});

describe('parseCommunityViewState', () => {
  it('accepts the mock state', () => {
    expect(errorsOf(mock)).toEqual([]);
  });

  it('rejects non-objects', () => {
    expect(errorsOf(null)).toEqual(['state must be an object']);
  });

  it.each([-1, 6, 1.5, '1'])('rejects land stage %s (0–5 only)', (v) => {
    expect(errorsOf({ ...valid(), landStage: v }).join()).toMatch(/landStage/);
  });

  it.each([0, 5])('accepts land stage %s', (v) => {
    expect(errorsOf({ ...valid(), landStage: v })).toEqual([]);
  });

  it('accepts vitality null or 0..100 and rejects the rest', () => {
    expect(errorsOf({ ...valid(), vitality: null })).toEqual([]);
    expect(errorsOf({ ...valid(), vitality: 100 })).toEqual([]);
    expect(errorsOf({ ...valid(), vitality: -1 }).join()).toMatch(/vitality/);
    expect(errorsOf({ ...valid(), vitality: Number.NaN }).join()).toMatch(/vitality/);
  });

  it('caps mini villagers at 20', () => {
    expect(errorsOf({ ...valid(), miniVillagerCount: 20 })).toEqual([]);
    expect(errorsOf({ ...valid(), miniVillagerCount: 21 }).join()).toMatch(/miniVillagerCount/);
  });

  it('accepts unknown building keys (drawn as placeholders) but rejects broken entries', () => {
    expect(errorsOf({ ...valid(), buildings: [building({ key: 'pickleball-court', title: 'Pickleball' })] })).toEqual([]);
    expect(errorsOf({ ...valid(), buildings: [building({ status: 'done' })] }).join()).toMatch(/buildings\[0\]/);
    expect(errorsOf({ ...valid(), buildings: [building({ level: 0 })] }).join()).toMatch(/buildings\[0\]/);
    expect(errorsOf({ ...valid(), buildings: [building({ progress: 1.5 })] }).join()).toMatch(/buildings\[0\]/);
    expect(errorsOf({ ...valid(), buildings: [building({ remaining: { residents: 1 } })] }).join()).toMatch(/buildings\[0\]/);
    expect(errorsOf({ ...valid(), buildings: [building(), building()] }).join()).toMatch(/duplicate key 'fire-pit'/);
  });

  it('accepts remaining conditions with prerequisites', () => {
    const remaining = { residents: 2, streakDays: 1, requires: ['frozen-pond'] };
    expect(errorsOf({ ...valid(), buildings: [building({ status: 'locked', remaining })] })).toEqual([]);
  });

  it('rejects speech bubbles pointing at missing houses or villagers', () => {
    const errors = errorsOf({
      ...valid(),
      miniVillagerCount: 2,
      speechBubbles: [
        { anchor: { kind: 'house', id: 'nobody' }, text: 'hi' },
        { anchor: { kind: 'villager', index: 2 }, text: 'hi' },
      ],
    }).join('\n');
    expect(errors).toMatch(/unknown house 'nobody'/);
    expect(errors).toMatch(/villager 2, but there are only 2/);
  });
});
