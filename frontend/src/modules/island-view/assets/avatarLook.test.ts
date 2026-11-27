import { describe, expect, it } from 'vitest';
import { isAvatarLook } from '../../common';
import { LOOK_HAIR_COLOURS, LOOK_HAIR_STYLES, SCARF_COLOURS, SKIN_TONES, avatarLookFromSeed, personLook, personLookFrom } from './voxel/samples';

describe('a chosen look drawn as a voxel person (requirement.md v1.52 §10.2)', () => {
  it('uses every chosen part and the shirt; no coat or hat', () => {
    const p = personLookFrom({ age: 2, skin: 5, hair: 6, hair_colour: 9, skirt: true, beard: true, glasses: true }, '#123456');
    expect(p).toEqual({
      age: 'elder',
      skin: SKIN_TONES[5],
      hair: LOOK_HAIR_COLOURS[9],
      style: 'headscarf',
      top: '#123456',
      bottom: expect.any(String),
      skirt: true,
      coat: false,
      hat: 'none',
      glasses: true,
      beard: true,
      scarf: SCARF_COLOURS[9 % 5],
    });
    expect(personLookFrom({ age: 1, skin: 0, hair: 0, hair_colour: 0, skirt: false, beard: true, glasses: false }, '#fff').beard).toBe(false);
  });
  it('lists 3 ages, 7 hair styles and 10 hair colours (the ranges the server checks)', () => {
    expect(LOOK_HAIR_STYLES).toHaveLength(7);
    expect(LOOK_HAIR_COLOURS).toHaveLength(10);
    expect(new Set(LOOK_HAIR_COLOURS).size).toBe(10);
    expect(SKIN_TONES).toHaveLength(6);
  });
  it('with a headscarf the colour choice picks the scarf colour', () => {
    const scarf = (hair_colour: number) => personLookFrom({ age: 0, skin: 0, hair: 6, hair_colour, skirt: false, beard: false, glasses: false }, '#fff').scarf;
    expect(scarf(0)).toBe(SCARF_COLOURS[0]);
    expect(scarf(4)).toBe(SCARF_COLOURS[4]);
    expect(scarf(7)).toBe(SCARF_COLOURS[2]);
  });
  it('a player without a saved look starts from the look their nickname gave them', () => {
    for (let seed = 1; seed < 400; seed += 7) {
      const before = personLook(seed, '#abcdef');
      const look = avatarLookFromSeed(seed);
      expect(isAvatarLook(look)).toBe(true);
      const after = personLookFrom(look, '#abcdef');
      expect({ age: after.age, skin: after.skin, hair: after.hair, skirt: after.skirt, glasses: after.glasses }).toEqual({
        age: before.age,
        skin: before.skin,
        hair: before.hair,
        skirt: before.skirt,
        glasses: before.glasses,
      });
      // the old child "bald" became short hair; styles match otherwise
      expect(after.style).toBe(before.style);
    }
  });
});
