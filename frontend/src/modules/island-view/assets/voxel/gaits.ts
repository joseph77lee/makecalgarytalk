/**
 * Gaits: joint angles for people and animals, as pure functions of the step phase (radians,
 * one full cycle = two steps) so they can be tested. Angles are in radians around each part's
 * joint (see `rigs.ts`). People face +z and swing parts around x (negative = forward); animals
 * face +x and swing legs around z (positive = forward).
 */
import type { AnimalKind } from './rigs';

const TAU = Math.PI * 2;

// --- People ------------------------------------------------------------------------------

/** What a person is doing this frame; `speed` in tiles per second (0 = standing). */
export interface PersonMotion {
  speed: number;
  sit?: boolean;
  cheer?: boolean;
  hammer?: boolean;
}

/** Tiles covered by one full step cycle of the scaled voxel person (two steps) at a stroll. */
export const PERSON_STRIDE = 0.34;

/** Faster walkers take longer steps (the avatar's brisk pace is a jog, not a blur of legs). */
export function personStride(speed: number): number {
  return PERSON_STRIDE * Math.max(1, Math.sqrt(speed / 0.8));
}

export interface PersonPose {
  legL: number;
  legR: number;
  armL: number;
  armR: number;
}

/** Legs swing opposite each other and each arm swings with the opposite leg. */
export function personPose(phase: number, m: PersonMotion, time: number): PersonPose {
  if (m.sit) return { legL: -1.4, legR: -1.4, armL: -0.25, armR: -0.25 };
  const walk = Math.min(1, m.speed / 0.5);
  const s = Math.sin(phase) * walk;
  const pose = { legL: s * 0.6, legR: -s * 0.6, armL: -s * 0.5, armR: s * 0.5 };
  if (m.cheer) {
    const wave = Math.sin(time * 9) * 0.25;
    pose.armL = -2.7 + wave;
    pose.armR = -2.7 - wave;
  } else if (m.hammer) {
    pose.armR = -1.3 - Math.max(0, Math.sin(time * 9)) * 0.9;
  }
  return pose;
}

// --- Animals -----------------------------------------------------------------------------

/** How an animal moves: deer and cougars walk and sometimes run, rabbits hop, geese waddle. */
export type Gait = 'walk' | 'run' | 'stalk' | 'hop' | 'waddle';

export interface AnimalStyle {
  /** Gait while moving at normal pace, and when it breaks into a run (if it ever does). */
  gait: Gait;
  run?: { gait: Gait; chance: number; speedUp: number };
  /** Tiles per full cycle for the normal gait and for the run. */
  stride: number;
  runStride?: number;
}

export const ANIMAL_STYLE: Record<AnimalKind, AnimalStyle> = {
  deer: { gait: 'walk', run: { gait: 'run', chance: 0.2, speedUp: 3 }, stride: 0.5, runStride: 1.1 },
  buck: { gait: 'walk', run: { gait: 'run', chance: 0.2, speedUp: 3 }, stride: 0.5, runStride: 1.1 },
  cougar: { gait: 'stalk', run: { gait: 'run', chance: 0.12, speedUp: 3.5 }, stride: 0.45, runStride: 1.2 },
  jackrabbit: { gait: 'hop', stride: 0.55 },
  goose: { gait: 'waddle', stride: 0.2 },
};

/** Part angles plus the body's lift (tiles), pitch (around z, nose up = +) and roll (around x). */
export interface AnimalPose {
  limbs: Record<string, { x?: number; y?: number; z?: number }>;
  lift: number;
  pitch: number;
  roll: number;
}

/**
 * The pose for one frame. `moving` false gives the resting pose: deer and geese graze (head down
 * most of the time), cougars watch with a swaying tail, rabbits sit with twitching ears.
 * `time` drives the resting motions; `seed` keeps animals out of step with each other.
 */
export function animalPose(kind: AnimalKind, gait: Gait, phase: number, moving: boolean, time: number, seed = 0): AnimalPose {
  const pose: AnimalPose = { limbs: {}, lift: 0, pitch: 0, roll: 0 };
  const L = pose.limbs;
  const s = Math.sin(phase);
  if (!moving) {
    const graze = 0.5 + 0.5 * Math.sin(time * 0.35 + seed);
    if (kind === 'deer' || kind === 'buck') {
      L.head = { z: -1.1 * graze };
      L.tail = { y: Math.sin(time * 9 + seed) * 0.25 * (graze > 0.8 ? 1 : 0) };
    } else if (kind === 'goose') {
      L.head = { z: -1.2 * graze };
    } else if (kind === 'cougar') {
      L.tail = { y: Math.sin(time * 1.2 + seed) * 0.35 };
      L.head = { y: Math.sin(time * 0.4 + seed) * 0.3 };
    } else {
      L.head = { z: Math.sin(time * 5 + seed) > 0.95 ? 0.15 : 0 }; // ear twitch
    }
    return pose;
  }
  switch (gait) {
    case 'walk':
    case 'stalk': {
      // diagonal pairs move together (front-left with back-right)
      const a = gait === 'stalk' ? 0.35 : 0.45;
      L.fl = { z: s * a };
      L.br = { z: s * a };
      L.fr = { z: -s * a };
      L.bl = { z: -s * a };
      L.head = { z: gait === 'stalk' ? -0.25 : Math.sin(phase * 2) * 0.06 };
      L.tail = { y: Math.sin(phase * 0.5) * (gait === 'stalk' ? 0.35 : 0.1) };
      pose.lift = gait === 'stalk' ? -0.03 : Math.abs(Math.sin(phase)) * 0.015;
      break;
    }
    case 'run': {
      // bounding: front legs together, back legs together, half a cycle apart; the body rocks
      L.fl = { z: s * 0.8 };
      L.fr = { z: Math.sin(phase - 0.3) * 0.8 };
      L.bl = { z: -s * 0.8 };
      L.br = { z: -Math.sin(phase - 0.3) * 0.8 };
      L.head = { z: 0.1 };
      L.tail = { z: 0.3 };
      pose.lift = Math.max(0, Math.sin(phase)) * 0.12;
      pose.pitch = Math.cos(phase) * 0.12;
      break;
    }
    case 'hop': {
      // one hop per cycle: push off with the hind legs, reach with the front, nose up then down
      const air = Math.max(0, s);
      L.hind = { z: -1.0 * air };
      L.front = { z: 0.7 * air };
      L.head = { z: -0.15 * air };
      pose.lift = air * 0.16;
      pose.pitch = Math.cos(phase) * 0.25;
      break;
    }
    case 'waddle': {
      L.legL = { z: s * 0.5 };
      L.legR = { z: -s * 0.5 };
      L.head = { z: -Math.abs(s) * 0.2 }; // the neck pumps with each step
      pose.roll = s * 0.14;
      break;
    }
  }
  return pose;
}

/** Advances a step phase by the distance walked this frame. */
export function advancePhase(phase: number, distance: number, stride: number): number {
  return (phase + (TAU * distance) / stride) % TAU;
}
