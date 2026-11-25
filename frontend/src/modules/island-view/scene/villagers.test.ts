import { describe, expect, it } from 'vitest';
import { pickPostBubbles, seededRandom, villagerCount, villagersOutside } from './villagers';

// Walkable tiles per land stage measured on Mahogany, Beltline, Tuscany, Diamond Cove: ≈ 40, 114, 214, 348, 609, 860.
const STAGES = [40, 114, 214, 348, 609, 860];

describe('villagerCount (operator feedback 2026-11-24: 3 on a stage-1 island looked like too many)', () => {
  it('the smallest islands get 0–1 villagers, the next 1–3', () => {
    for (let i = 0; i < 200; i++) {
      const r = seededRandom((i + 1) / 211);
      expect(villagerCount(STAGES[0], r)).toBeLessThanOrEqual(1);
      expect(villagerCount(STAGES[1], r)).toBeGreaterThanOrEqual(1);
      expect(villagerCount(STAGES[1], r)).toBeLessThanOrEqual(3);
    }
  });

  it('grows with the land and never passes 20', () => {
    const mid = () => 0.5;
    const counts = STAGES.map((w) => villagerCount(w, mid));
    for (let i = 1; i < counts.length; i++) expect(counts[i]).toBeGreaterThanOrEqual(counts[i - 1]);
    expect(counts[5]).toBeGreaterThan(10);
    expect(villagerCount(5000, () => 0.99)).toBe(20);
  });

  it('keeps one villager per real story: action replay, today\'s posts', () => {
    expect(villagerCount(STAGES[0], () => 0)).toBe(0);
    expect(villagerCount(STAGES[0], () => 0, 1)).toBe(1);
    expect(villagerCount(STAGES[0], () => 0, 2)).toBe(2);
  });

  it('is random per visit but steady for one seed', () => {
    const a = villagerCount(609, seededRandom(0.123));
    expect(villagerCount(609, seededRandom(0.123))).toBe(a);
    const seen = new Set(Array.from({ length: 50 }, (_, i) => villagerCount(609, seededRandom((i + 1) / 53))));
    expect(seen.size).toBeGreaterThan(2);
  });
});

describe('villagersOutside', () => {
  it('fewer at night and in rain or snow; never more than there are', () => {
    expect(villagersOutside(10, { weather: 'clear', nightness: 0 })).toBe(10);
    expect(villagersOutside(10, { weather: 'clear', nightness: 1 })).toBe(4);
    expect(villagersOutside(10, { weather: 'rain', nightness: 0 })).toBe(5);
    expect(villagersOutside(10, { weather: 'snow', nightness: 1 })).toBe(2);
    expect(villagersOutside(1, { weather: 'snow', nightness: 1 })).toBe(0);
    expect(villagersOutside(1, { weather: 'snow', nightness: 1 }, 1)).toBe(1);
    expect(villagersOutside(2, { weather: 'snow', nightness: 1 }, 2)).toBe(2);
  });
});

describe('pickPostBubbles', () => {
  it('every post comes round, even with one free villager', () => {
    const seen = new Set<string>();
    for (let tick = 0; tick < 4; tick++) for (const p of pickPostBubbles(['a', 'b', 'c'], 2, new Set([0]), tick, 2)) seen.add(p.post);
    expect([...seen].sort()).toEqual(['a', 'b', 'c']);
  });

  it('at most `max` at once, never on a busy villager, never twice on one villager', () => {
    for (let tick = 0; tick < 10; tick++) {
      const picks = pickPostBubbles(['a', 'b', 'c', 'd'], 5, new Set([1, 3]), tick, 2);
      expect(picks.length).toBe(2);
      for (const p of picks) expect([1, 3]).not.toContain(p.villager);
      expect(new Set(picks.map((p) => p.villager)).size).toBe(picks.length);
    }
  });

  it('nothing without posts, villagers or free villagers', () => {
    expect(pickPostBubbles([], 3, new Set(), 0, 2)).toEqual([]);
    expect(pickPostBubbles(['a'], 0, new Set(), 0, 2)).toEqual([]);
    expect(pickPostBubbles(['a'], 1, new Set([0]), 0, 2)).toEqual([]);
  });
});
