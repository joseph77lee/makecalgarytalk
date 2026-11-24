import { describe, expect, it } from 'vitest';
import type { BoxPart } from '../boxes';
import { animalRig, personRig, type AnimalKind, type Rig } from './rigs';
import { cougar, deer, gooseStanding, jackrabbit, person } from './samples';
import { V } from './voxel';

/** Puts every part back where it was (part offset + joint) so nothing is lost or moved. */
function rebuilt(rig: Rig): BoxPart[] {
  return [
    ...rig.body,
    ...Object.values(rig.limbs).flatMap((l) => l.parts.map((b) => ({ ...b, p: [b.p[0] + l.pivot[0], b.p[1] + l.pivot[1], b.p[2] + l.pivot[2]] as [number, number, number] }))),
  ];
}
const key = (b: BoxPart) => `${b.c}:${b.p.map((v) => v.toFixed(4)).join(',')}:${b.s.join(',')}`;

describe('rigs', () => {
  it('splits the voxel person into head, two arms and two legs without losing a box', () => {
    for (const seed of [1, 2, 3, 4, 5, 6]) {
      const rig = personRig(seed);
      expect(rebuilt(rig).map(key).sort()).toEqual(person(seed).map(key).sort());
      for (const name of ['head', 'armL', 'armR', 'legL', 'legR']) expect(rig.limbs[name].parts.length, `${seed} ${name}`).toBeGreaterThan(0);
      // each arm has its sleeve and its hand, each leg its trouser and shoe
      for (const name of ['armL', 'armR', 'legL', 'legR']) expect(rig.limbs[name].parts).toHaveLength(2);
      // legs hang below the hip, arms below the shoulder
      for (const name of ['legL', 'legR', 'armL', 'armR']) for (const b of rig.limbs[name].parts) expect(b.p[1]).toBeLessThan(0);
      expect(rig.limbs.legL.pivot[0]).toBeLessThan(0);
      expect(rig.limbs.legR.pivot[0]).toBeGreaterThan(0);
    }
  });

  const models: Record<AnimalKind, BoxPart[]> = { deer: deer(false), buck: deer(true), cougar: cougar(), jackrabbit: jackrabbit(false), goose: gooseStanding() };
  const parts: Record<AnimalKind, string[]> = {
    deer: ['fl', 'fr', 'bl', 'br', 'head', 'tail'],
    buck: ['fl', 'fr', 'bl', 'br', 'head', 'tail'],
    cougar: ['fl', 'fr', 'bl', 'br', 'head', 'tail'],
    jackrabbit: ['hind', 'front', 'head'],
    goose: ['legL', 'legR', 'head'],
  };

  it.each(Object.keys(models) as AnimalKind[])('splits the %s into its moving parts without losing a box', (kind) => {
    const rig = animalRig(kind);
    expect(rebuilt(rig).map(key).sort()).toEqual(models[kind].map(key).sort());
    for (const name of parts[kind]) expect(rig.limbs[name].parts.length, name).toBeGreaterThan(0);
    expect(rig.body.length).toBeGreaterThan(0);
    // legs hang from their joint down to the ground
    for (const name of parts[kind].filter((n) => n !== 'head' && n !== 'tail')) {
      const limb = rig.limbs[name];
      const bottom = Math.min(...limb.parts.map((b) => b.p[1] - b.s[1] / 2 + limb.pivot[1]));
      expect(bottom * V, name).toBeCloseTo(0, 3);
    }
  });

  it('four-legged animals have one leg in each corner (left is -z, front is +x)', () => {
    for (const kind of ['deer', 'cougar'] as const) {
      const L = animalRig(kind).limbs;
      expect(L.fl.pivot[0]).toBeGreaterThan(L.bl.pivot[0]);
      expect(L.fl.pivot[2]).toBeLessThan(L.fr.pivot[2]);
      expect(L.bl.pivot[2]).toBeLessThan(L.br.pivot[2]);
      for (const n of ['fl', 'fr', 'bl', 'br']) expect(L[n].parts, `${kind} ${n}`).toHaveLength(1);
    }
  });
});
