import { Bone, Group, Vector3 } from 'three';
import { describe, expect, it } from 'vitest';
import { AVATAR_MODELS, RIGGED, VILLAGER_MODELS, animalModel, avatarModel, boneRests, poseBone, villagerModel } from './rigged';

/** A figure with a hip bone turned oddly (like real rigs) and a leg pointing down from it. */
function figure() {
  const root = new Group();
  const hips = new Bone();
  hips.name = 'Hips';
  hips.rotation.set(0.7, -1.1, 0.4); // the rig's own axes are not the figure's
  const leg = new Bone();
  leg.name = 'Leg';
  const foot = new Bone();
  foot.name = 'Foot';
  root.add(hips);
  hips.add(leg);
  leg.add(foot);
  root.updateMatrixWorld(true);
  // place the foot one unit straight below the leg joint in the figure's frame
  const below = leg.worldToLocal(leg.getWorldPosition(new Vector3()).add(new Vector3(0, -1, 0)));
  foot.position.copy(below);
  root.updateMatrixWorld(true);
  return { root, leg, foot };
}
const footDir = (f: ReturnType<typeof figure>) => {
  f.root.updateMatrixWorld(true);
  return f.foot.getWorldPosition(new Vector3()).sub(f.leg.getWorldPosition(new Vector3())).normalize();
};

describe('posing rigs in the figure frame', () => {
  it('swings a leg forward (+z) for a negative x angle, whatever the rig axes', () => {
    const f = figure();
    const rest = boneRests(f.root, ['Leg']).get('Leg')!;
    expect(footDir(f).y).toBeCloseTo(-1);
    poseBone(rest, -Math.PI / 2);
    const d = footDir(f);
    expect(d.z).toBeCloseTo(1);
    expect(d.y).toBeCloseTo(0);
    poseBone(rest, 0); // back to rest
    expect(footDir(f).y).toBeCloseTo(-1);
  });
  it('applies the pre-turn around z first (lowering a T-pose arm), then the swing', () => {
    const f = figure();
    const rest = boneRests(f.root, ['Leg']).get('Leg')!;
    poseBone(rest, 0, 0, 0, Math.PI / 2); // down → +x after a quarter turn around z
    expect(footDir(f).x).toBeCloseTo(1);
  });
});

describe('figure choices', () => {
  it('spreads villagers over all seven people and keeps avatars grown-up', () => {
    expect(new Set(Array.from({ length: 7 }, (_, i) => villagerModel(i)))).toEqual(new Set(VILLAGER_MODELS));
    for (let s = -5; s < 50; s++) expect(AVATAR_MODELS).toContain(avatarModel(s));
    for (const m of [...VILLAGER_MODELS, ...AVATAR_MODELS]) expect(RIGGED[m].kind).toBe('person');
  });
  it('draws deer, bucks and jackrabbits with Polyfork figures; cougars and geese stay ours', () => {
    expect(animalModel('deer', 0)).toBe('deer');
    expect(animalModel('buck', 0)).toBe('reindeer');
    expect(new Set([animalModel('jackrabbit', 0), animalModel('jackrabbit', 1)])).toEqual(new Set(['rabbit', 'hare']));
    expect(animalModel('cougar', 0)).toBeNull();
    expect(animalModel('goose', 0)).toBeNull();
  });
});
