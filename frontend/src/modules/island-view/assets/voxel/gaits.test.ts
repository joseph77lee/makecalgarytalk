import { describe, expect, it } from 'vitest';
import { ANIMAL_STYLE, PERSON_STRIDE, advancePhase, animalPose, personPose, personStride } from './gaits';

const Q = Math.PI / 2; // a quarter cycle: the swing is at its widest

describe('person gait', () => {
  it('legs swing opposite each other and each arm swings with the opposite leg', () => {
    const p = personPose(Q, { speed: 0.6 }, 0);
    expect(p.legL).toBeGreaterThan(0.3);
    expect(p.legR).toBeCloseTo(-p.legL);
    expect(Math.sign(p.armL)).toBe(-Math.sign(p.legL));
    expect(p.armR).toBeCloseTo(-p.armL);
    expect(Math.sign(p.armR)).toBe(Math.sign(p.legL)); // right arm forward with the left leg
  });

  it('standing still keeps the limbs at rest; a slow stroll swings less than a walk', () => {
    expect(personPose(Q, { speed: 0 }, 0)).toEqual({ legL: 0, legR: -0, armL: -0, armR: 0 });
    expect(Math.abs(personPose(Q, { speed: 0.2 }, 0).legL)).toBeLessThan(Math.abs(personPose(Q, { speed: 0.6 }, 0).legL));
  });

  it('sits with both legs forward, cheers with both arms up, hammers with the right arm', () => {
    const sit = personPose(Q, { speed: 0, sit: true }, 0);
    expect(sit.legL).toBeLessThan(-1.2);
    expect(sit.legR).toBeLessThan(-1.2);
    const cheer = personPose(0, { speed: 0, cheer: true }, 1);
    expect(cheer.armL).toBeLessThan(-2.2);
    expect(cheer.armR).toBeLessThan(-2.2);
    const hammer = personPose(0, { speed: 0, hammer: true }, 0.2);
    expect(hammer.armR).toBeLessThan(-1.2);
    expect(hammer.armL).toBeCloseTo(0);
  });

  it('faster walkers take longer steps, so the brisk avatar jogs instead of blurring its legs', () => {
    expect(personStride(0.5)).toBe(PERSON_STRIDE);
    expect(personStride(2.2)).toBeGreaterThan(PERSON_STRIDE * 1.5);
    const stepsPerSecond = (speed: number) => (speed / personStride(speed)) * 2;
    expect(stepsPerSecond(2.2)).toBeLessThan(9);
  });
});

describe('animal gaits', () => {
  it('deer and cougars walk with diagonal legs together', () => {
    for (const kind of ['deer', 'cougar'] as const) {
      const { limbs } = animalPose(kind, ANIMAL_STYLE[kind].gait, Q, true, 0);
      expect(limbs.fl.z).toBeCloseTo(limbs.br.z!);
      expect(limbs.fr.z).toBeCloseTo(limbs.bl.z!);
      expect(limbs.fl.z).toBeCloseTo(-limbs.fr.z!);
      expect(Math.abs(limbs.fl.z!)).toBeGreaterThan(0.2);
    }
  });

  it('a cougar stalks low with its head down; deer and cougars can run, rabbits and geese never do', () => {
    const stalk = animalPose('cougar', 'stalk', Q, true, 0);
    expect(stalk.lift).toBeLessThan(0);
    expect(stalk.limbs.head.z).toBeLessThan(0);
    expect(ANIMAL_STYLE.deer.run?.gait).toBe('run');
    expect(ANIMAL_STYLE.cougar.run?.gait).toBe('run');
    expect(ANIMAL_STYLE.jackrabbit.run).toBeUndefined();
    expect(ANIMAL_STYLE.goose.run).toBeUndefined();
    expect(ANIMAL_STYLE.jackrabbit.gait).toBe('hop');
    expect(ANIMAL_STYLE.goose.gait).toBe('waddle');
  });

  it('running bounds: front legs together, back legs together, the body leaves the ground', () => {
    const run = animalPose('deer', 'run', Q, true, 0);
    expect(Math.sign(run.limbs.fl.z!)).toBe(Math.sign(run.limbs.fr.z!));
    expect(Math.sign(run.limbs.bl.z!)).toBe(Math.sign(run.limbs.br.z!));
    expect(Math.sign(run.limbs.fl.z!)).toBe(-Math.sign(run.limbs.bl.z!));
    expect(run.lift).toBeGreaterThan(0.08);
    expect(animalPose('deer', 'run', Q, true, 0).limbs.fl.z!).toBeGreaterThan(animalPose('deer', 'walk', Q, true, 0).limbs.fl.z!);
  });

  it('a jackrabbit hops: in the air it kicks back with the hind legs and reaches with the front; it lands each cycle', () => {
    const air = animalPose('jackrabbit', 'hop', Q, true, 0);
    expect(air.lift).toBeGreaterThan(0.1);
    expect(air.limbs.hind.z).toBeLessThan(-0.5);
    expect(air.limbs.front.z).toBeGreaterThan(0.3);
    expect(animalPose('jackrabbit', 'hop', Math.PI * 1.5, true, 0).lift).toBe(0);
  });

  it('a goose waddles: legs alternate and the body rolls side to side with each step', () => {
    const a = animalPose('goose', 'waddle', Q, true, 0);
    const b = animalPose('goose', 'waddle', Math.PI * 1.5, true, 0);
    expect(a.limbs.legL.z).toBeCloseTo(-a.limbs.legR.z!);
    expect(Math.sign(a.roll)).toBe(-Math.sign(b.roll));
    expect(Math.abs(a.roll)).toBeGreaterThan(0.1);
  });

  it('resting: deer and geese graze with the head down for part of the time; nobody lifts off', () => {
    for (const kind of ['deer', 'goose'] as const) {
      const heads = Array.from({ length: 40 }, (_, i) => animalPose(kind, 'walk', 0, false, i * 0.5).limbs.head.z!);
      expect(Math.min(...heads), kind).toBeLessThan(-0.8);
      expect(Math.max(...heads), kind).toBeGreaterThan(-0.2);
    }
    for (const kind of ['deer', 'buck', 'cougar', 'jackrabbit', 'goose'] as const) {
      const rest = animalPose(kind, ANIMAL_STYLE[kind].gait, Q, false, 3);
      expect(rest.lift).toBe(0);
      expect(rest.limbs.fl ?? rest.limbs.legL ?? rest.limbs.hind).toBeUndefined(); // legs at rest
    }
  });

  it('the step phase follows the distance walked and wraps around', () => {
    expect(advancePhase(0, 0.25, 0.5)).toBeCloseTo(Math.PI);
    expect(advancePhase(0, 0.5, 0.5)).toBeCloseTo(0);
    expect(advancePhase(6, 0.1, 0.5)).toBeLessThan(Math.PI * 2);
  });
});
