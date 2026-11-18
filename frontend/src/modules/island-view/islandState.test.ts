import { describe, expect, it } from 'vitest';
import mock from './mockCommunityState.json';
import { vitalityMood } from './mood';
import { parseCommunityViewState } from './parseState';

describe('vitalityMood (requirement.md §7.4)', () => {
  it.each([
    [0, 'gloomy'],
    [29, 'gloomy'],
    [29.99, 'gloomy'],
    [30, 'normal'],
    [59, 'normal'],
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

describe('parseCommunityViewState', () => {
  it('accepts the mock state', () => {
    const r = parseCommunityViewState(mock);
    expect(r.ok).toBe(true);
  });

  it('rejects non-objects', () => {
    expect(errorsOf(null)).toEqual(['state must be an object']);
    expect(errorsOf([])).toEqual(['state must be an object']);
  });

  it.each([7, 10, 33, 0, '12'])('rejects island size %s (only §7.8 tiers)', (size) => {
    expect(errorsOf({ ...valid(), islandSize: size }).join()).toMatch(/islandSize/);
  });

  it.each([8, 12, 16, 20, 26, 32])('accepts island size %s', (size) => {
    expect(errorsOf({ ...valid(), islandSize: size })).toEqual([]);
  });

  it.each([-1, 100.01, Number.NaN, Infinity, '50'])('rejects vitality %s', (v) => {
    expect(errorsOf({ ...valid(), vitality: v }).join()).toMatch(/vitality/);
  });

  it('accepts vitality at both ends', () => {
    expect(errorsOf({ ...valid(), vitality: 0 })).toEqual([]);
    expect(errorsOf({ ...valid(), vitality: 100 })).toEqual([]);
  });

  it('caps mini villagers at 20 and rejects non-integers', () => {
    expect(errorsOf({ ...valid(), miniVillagerCount: 20 })).toEqual([]);
    expect(errorsOf({ ...valid(), miniVillagerCount: 21 }).join()).toMatch(/miniVillagerCount/);
    expect(errorsOf({ ...valid(), miniVillagerCount: 2.5 }).join()).toMatch(/miniVillagerCount/);
  });

  it('allows an empty community (no houses, no villagers, no bubbles)', () => {
    expect(errorsOf({ ...valid(), houses: [], miniVillagerCount: 0, speechBubbles: [] })).toEqual([]);
  });

  it('rejects duplicate house ids and incomplete houses', () => {
    const s = valid();
    s.houses = [
      { id: 'a', nickname: 'A', activeToday: true },
      { id: 'a', nickname: 'B', activeToday: false },
      { id: 'c', nickname: 'C' },
    ];
    s.speechBubbles = [];
    const errors = errorsOf(s).join('\n');
    expect(errors).toMatch(/duplicate id 'a'/);
    expect(errors).toMatch(/houses\[2\]/);
  });

  it('requires every unlock building and rejects unknown ones', () => {
    const s = valid();
    s.buildings = { playground: { unlocked: true }, park: { unlocked: false }, castle: { unlocked: true } };
    const errors = errorsOf(s).join('\n');
    expect(errors).toMatch(/community-centre/);
    expect(errors).toMatch(/buildings\.park/);
    expect(errors).toMatch(/castle/);
  });

  it('allows at most 3 projects with progress 0..1 and a known kind', () => {
    const p = { id: 'x', kind: 'ice-rink', title: 'T', stage: 'frame', progress: 0.5 };
    expect(errorsOf({ ...valid(), projects: [p, { ...p, id: 'y' }, { ...p, id: 'z' }] })).toEqual([]);
    expect(errorsOf({ ...valid(), projects: [p, { ...p, id: 'y' }, { ...p, id: 'z' }, { ...p, id: 'w' }] }).join()).toMatch(/at most 3/);
    expect(errorsOf({ ...valid(), projects: [{ ...p, progress: 1.2 }] }).join()).toMatch(/projects\[0\]/);
    expect(errorsOf({ ...valid(), projects: [{ ...p, kind: 'castle' }] }).join()).toMatch(/projects\[0\]/);
    expect(errorsOf({ ...valid(), projects: [{ ...p, stage: 'done' }] }).join()).toMatch(/projects\[0\]/);
    expect(errorsOf({ ...valid(), projects: [p, p] }).join()).toMatch(/duplicate id 'x'/);
  });

  it('rejects speech bubbles pointing at missing houses or villagers', () => {
    const errors = errorsOf({
      ...valid(),
      miniVillagerCount: 2,
      speechBubbles: [
        { anchor: { kind: 'house', id: 'nobody' }, text: 'hi' },
        { anchor: { kind: 'villager', index: 2 }, text: 'hi' },
        { anchor: { kind: 'villager', index: 1 }, text: '' },
      ],
    }).join('\n');
    expect(errors).toMatch(/unknown house 'nobody'/);
    expect(errors).toMatch(/villager 2, but there are only 2/);
    expect(errors).toMatch(/speechBubbles\[2\]/);
  });
});
