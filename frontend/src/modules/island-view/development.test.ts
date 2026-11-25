import { describe, expect, it } from 'vitest';
import { developmentLevel } from './development';

const b = (key: string, status: 'built' | 'building' | 'locked' = 'built', level = 1) => ({ key, status, level });

describe('developmentLevel (same rule as gamecore.world_map, requirement v1.41 §7.4)', () => {
  it('follows the building tree', () => {
    expect(developmentLevel([])).toBe(0);
    expect(developmentLevel([b('welcome-sign', 'building')])).toBe(0);
    expect(developmentLevel([b('welcome-sign')])).toBe(1);
    expect(developmentLevel([b('welcome-sign'), b('skating-rink')])).toBe(2);
    expect(developmentLevel([b('welcome-sign'), b('playground')])).toBe(2);
    expect(developmentLevel([b('welcome-sign'), b('community-hall')])).toBe(3);
    expect(developmentLevel([b('welcome-sign'), b('neighbourhood-park')])).toBe(4);
  });

  it('a building being upgraded past level 1 still counts', () => {
    expect(developmentLevel([b('welcome-sign', 'building', 2)])).toBe(1);
  });

  it('without a Welcome sign nothing else counts', () => {
    expect(developmentLevel([b('community-hall'), b('neighbourhood-park')])).toBe(0);
  });
});
