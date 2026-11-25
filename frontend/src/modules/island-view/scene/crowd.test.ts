import { describe, expect, it } from 'vitest';
import { Crowd } from './crowd';
import { claimedTiles, freeSteps } from './steps';

describe('crowd (tiles claimed by walkers)', () => {
  it('a claimed tile is taken for everybody else but not for its owner', () => {
    const c = new Crowd();
    c.claim('villager:1', ['2,3', '3,3']);
    expect(c.takenByOther('2,3', 'avatar')).toBe(true);
    expect(c.takenByOther('3,3', 'animal:deer:1')).toBe(true);
    expect(c.takenByOther('2,3', 'villager:1')).toBe(false);
    expect(c.takenByOther('4,4', 'avatar')).toBe(false);
  });

  it('a new claim replaces the old one; release frees the tiles', () => {
    const c = new Crowd();
    c.claim('a', ['1,1', '1,2']);
    c.claim('a', ['1,2']);
    expect(c.takenByOther('1,1', 'b')).toBe(false);
    expect(c.othersTiles('b')).toEqual(new Set(['1,2']));
    c.release('a');
    expect(c.takenByOther('1,2', 'b')).toBe(false);
  });
});

describe('wandering steps (villagers and animals)', () => {
  const walk = new Set(['0,0', '1,0', '-1,0', '0,1', '0,-1', '5,5']);

  it('only offers walkable neighbours nobody else has claimed', () => {
    const c = new Crowd();
    expect(freeSteps({ x: 0, z: 0 }, walk, c, 'villager:1')).toHaveLength(4);
    c.claim('avatar', ['1,0']);
    c.claim('animal:deer:23', claimedTiles({ x: -1, z: 0 }, { x: 0, z: 1 }, true)); // stepping between two tiles
    const steps = freeSteps({ x: 0, z: 0 }, walk, c, 'villager:1').map((t) => `${t.x},${t.z}`);
    expect(steps).toEqual(['0,-1']);
  });

  it("a walker's own claim never blocks it; a boxed-in walker gets no step", () => {
    const c = new Crowd();
    c.claim('villager:1', ['1,0', '0,1']);
    expect(freeSteps({ x: 0, z: 0 }, walk, c, 'villager:1')).toHaveLength(4);
    c.claim('villager:2', ['1,0', '-1,0', '0,1', '0,-1']);
    expect(freeSteps({ x: 0, z: 0 }, walk, c, 'villager:1')).toEqual([]);
  });

  it('claims the standing tile, plus the next one while moving', () => {
    expect(claimedTiles({ x: 1, z: 2 }, { x: 2, z: 2 }, true)).toEqual(['1,2', '2,2']);
    expect(claimedTiles({ x: 1, z: 2 }, { x: 2, z: 2 }, false)).toEqual(['2,2']);
  });
});

describe('tapping walkers (requirement v1.44 §10.5)', () => {
  it('whoAt lists everyone on a tile', async () => {
    const { Crowd } = await import('./crowd');
    const c = new Crowd();
    c.claim('villager:1', ['2,3']);
    c.claim('animal:deer:7', ['2,3', '3,3']);
    expect(c.whoAt('2,3').sort()).toEqual(['animal:deer:7', 'villager:1']);
    expect(c.whoAt('3,3')).toEqual(['animal:deer:7']);
    expect(c.whoAt('9,9')).toEqual([]);
  });

  it('each walker has its sound; the avatar has none', async () => {
    const { walkerSound } = await import('./islandContext');
    expect(['villager-hello-female', 'villager-hello-male']).toContain(walkerSound('villager:4'));
    expect(walkerSound('villager:4')).toBe(walkerSound('villager:4')); // the same villager keeps its voice
    const voices = Array.from({ length: 20 }, (_, i) => walkerSound(`villager:${i}`));
    const female = voices.filter((v) => v === 'villager-hello-female').length;
    expect(female).toBeGreaterThanOrEqual(6); // both voices are heard among the villagers
    expect(female).toBeLessThanOrEqual(14);
    expect(walkerSound('animal:goose:41')).toBe('geese-honk');
    expect(walkerSound('animal:deer:3')).toBe('deer-call');
    expect(walkerSound('animal:cougar:37')).toBe('cougar-growl');
    expect(walkerSound('animal:jackrabbit:11')).toBe('rabbit-hop');
    expect(walkerSound('avatar')).toBeNull();
  });

  it('a poked walker hops once and lands', async () => {
    const { pokeHop, pokeWalker } = await import('./islandContext');
    const t0 = performance.now();
    pokeWalker('villager:9');
    expect(pokeHop('villager:9', t0 + 225)).toBeGreaterThan(0.2);
    expect(pokeHop('villager:9', t0 + 500)).toBe(0);
    expect(pokeHop('villager:9', t0 + 100)).toBe(0); // landed: forgotten
    expect(pokeHop('nobody')).toBe(0);
  });
});
