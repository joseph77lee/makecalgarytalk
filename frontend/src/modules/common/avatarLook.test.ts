import { describe, expect, it } from 'vitest';
import { AGE_CHILD, AGE_ELDER, FIRST_GREY, LOOK_MAX, fixLook, isAvatarLook, randomLook, type AvatarLook } from './avatarLook';

const look: AvatarLook = { age: 0, skin: 0, hair: 0, hair_colour: 0, skirt: false, beard: false, glasses: false };

describe('villager look (requirement.md v1.52 §10.2)', () => {
  it('accepts every value in range, like the server', () => {
    expect(isAvatarLook(look)).toBe(true);
    expect(isAvatarLook({ ...look, ...LOOK_MAX, skirt: true, beard: true, glasses: true })).toBe(true);
  });
  it('refuses values out of range, wrong types, missing parts and a child with a beard', () => {
    expect(isAvatarLook({ ...look, age: 3 })).toBe(false);
    expect(isAvatarLook({ ...look, skin: -1 })).toBe(false);
    expect(isAvatarLook({ ...look, hair: 1.5 })).toBe(false);
    expect(isAvatarLook({ ...look, hair_colour: 10 })).toBe(false);
    expect(isAvatarLook({ ...look, skirt: 1 })).toBe(false);
    const { glasses: _g, ...missing } = look;
    expect(isAvatarLook(missing)).toBe(false);
    expect(isAvatarLook({ ...look, age: AGE_CHILD, beard: true })).toBe(false);
    expect(isAvatarLook(null)).toBe(false);
    expect(isAvatarLook([])).toBe(false);
  });
  it('choosing Child takes the beard off', () => {
    expect(fixLook({ ...look, age: AGE_CHILD, beard: true }).beard).toBe(false);
    expect(fixLook({ ...look, beard: true }).beard).toBe(true);
  });
  it('the shuffle always gives a valid look and uses every part', () => {
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const seen = { age: new Set<number>(), skin: new Set<number>(), hair: new Set<number>(), hair_colour: new Set<number>() };
    for (let i = 0; i < 2000; i++) {
      const l = randomLook(rand);
      expect(isAvatarLook(l)).toBe(true);
      for (const k of Object.keys(seen) as (keyof typeof seen)[]) seen[k].add(l[k]);
    }
    expect(seen.age.size).toBe(3);
    expect(seen.skin.size).toBe(6);
    expect(seen.hair.size).toBe(7);
    expect(seen.hair_colour.size).toBe(10);
  });
  it('the shuffle is mostly adults, and elders are usually grey', () => {
    let seed = 11;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    const looks = Array.from({ length: 3000 }, () => randomLook(rand));
    expect(looks.filter((l) => l.age === 0).length / looks.length).toBeGreaterThan(0.6);
    const elders = looks.filter((l) => l.age === AGE_ELDER);
    expect(elders.filter((l) => l.hair_colour >= FIRST_GREY).length / elders.length).toBeGreaterThan(0.7);
    // and even a rand() of exactly 0.999… stays in range
    expect(isAvatarLook(randomLook(() => 0.9999999))).toBe(true);
  });
});
