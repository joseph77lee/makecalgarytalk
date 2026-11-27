import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { AvatarLook } from '../common';
import { LOOK_HAIR_COLOURS, SCARF_COLOURS, SKIN_TONES } from '../island-view';
import { AvatarFace } from './AvatarFace';

const base: AvatarLook = { age: 0, skin: 3, hair: 0, hair_colour: 2, skirt: false, beard: false, glasses: false };
const svg = (look: AvatarLook) => renderToStaticMarkup(<AvatarFace look={look} shirt="#56ccf2" />).toLowerCase();

describe('the profile button face (requirement.md v1.52 §10.2)', () => {
  it('uses my skin, hair and shirt colours', () => {
    const s = svg(base);
    expect(s).toContain(SKIN_TONES[3].toLowerCase());
    expect(s).toContain(LOOK_HAIR_COLOURS[2]!.toLowerCase());
    expect(s).toContain('#56ccf2');
  });
  it('shows glasses and a beard only when chosen', () => {
    expect(svg(base)).not.toContain('stroke=');
    expect(svg({ ...base, glasses: true })).toContain('stroke=');
    const count = (s: string, c: string) => s.split(c).length - 1;
    const hair = LOOK_HAIR_COLOURS[2]!.toLowerCase();
    expect(count(svg({ ...base, beard: true }), hair)).toBe(count(svg(base), hair) + 1);
  });
  it('a headscarf takes the scarf colour, a bald head keeps little hair', () => {
    expect(svg({ ...base, hair: 6, hair_colour: 1 })).toContain(SCARF_COLOURS[1]!.toLowerCase());
    const hair = LOOK_HAIR_COLOURS[2]!.toLowerCase();
    expect(svg({ ...base, hair: 5 }).split(hair).length).toBeLessThan(svg({ ...base, hair: 1 }).split(hair).length);
  });
});
