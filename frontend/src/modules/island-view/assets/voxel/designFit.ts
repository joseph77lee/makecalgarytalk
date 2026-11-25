/**
 * The new voxel designs sized like the voxel models the game draws now (M23 rework, operator
 * decision 2026-11-25: "match every volume to the current voxel designs"). Each design is fitted
 * to a target box (width × depth × height in voxels): where the game has a matching model the
 * target is measured from it (bungalow, two-storey house, apartment, loft, trees, car, bench,
 * lamp, mailbox), otherwise it is the size of the matching part of a current lot model (written
 * next to it). `VOXEL_DESIGNS` is what the gallery shows and what the islands will use.
 */
import type { BoxPart } from '../boxes';
import * as D from './designs';
import * as C from './designsCivic';
import * as S from './designsStreet';
import { apartment, bench, bungalow, car, lampPost, leafyTree, loft, mailbox, spruce, twoStoreyGarage } from './samples';
import { V } from './voxel';

export interface Extent {
  w: number;
  d: number;
  h: number;
}

/** Outer size of parts in voxels (faint `mist` parts such as light pools are ignored). */
export function extent(parts: BoxPart[]): Extent & { cx: number; cz: number } {
  let x0 = Infinity;
  let x1 = -Infinity;
  let z0 = Infinity;
  let z1 = -Infinity;
  let h = 0;
  for (const b of parts) {
    if (b.layer === 'mist') continue;
    x0 = Math.min(x0, b.p[0] - b.s[0] / 2);
    x1 = Math.max(x1, b.p[0] + b.s[0] / 2);
    z0 = Math.min(z0, b.p[2] - b.s[2] / 2);
    z1 = Math.max(z1, b.p[2] + b.s[2] / 2);
    h = Math.max(h, b.p[1] + b.s[1] / 2);
  }
  return { w: (x1 - x0) * V, d: (z1 - z0) * V, h: h * V, cx: ((x0 + x1) / 2) * V, cz: ((z0 + z1) / 2) * V };
}

/**
 * Stretches parts to the target size along each axis, around their footprint centre (which stays
 * where it was) and standing on the ground. Boxes stay boxes; only their proportions change.
 */
export function fitTo(parts: BoxPart[], target: Extent): BoxPart[] {
  const e = extent(parts);
  const kx = target.w / e.w;
  const kz = target.d / e.d;
  const ky = target.h / e.h;
  const cx = e.cx / V;
  const cz = e.cz / V;
  return parts.map((b) => ({
    ...b,
    p: [cx + (b.p[0] - cx) * kx, b.p[1] * ky, cz + (b.p[2] - cz) * kz],
    s: [b.s[0] * kx, b.s[1] * ky, b.s[2] * kz],
  }));
}

const of = (parts: BoxPart[]): Extent => {
  const { w, d, h } = extent(parts);
  return { w, d, h };
};
const box = (w: number, d: number, h: number): Extent => ({ w, d, h });
const withH = (e: Extent, h: number): Extent => ({ ...e, h });

// Targets measured from the models the game draws now
const HOUSE_LOW = of(bungalow(3)); // one storey, about 12 × 11 × 10
const HOUSE_TALL = of(twoStoreyGarage(9)); // two storeys, about 12.6 × 11.5 × 14
const DOWNTOWN_TALL = of(apartment(3)); // about 10.8 × 11.6 × 24
const DOWNTOWN_LOW = of(loft(2)); // about 10.8 × 10.2 × 13
const LEAFY = of(leafyTree(4));
const EVERGREEN = of(spruce(1));
const CAR = of(car(1));
const BENCH = of(bench());
const LAMP = of(lampPost());
const MAILBOX = of(mailbox());

export interface VoxelDesign {
  label: string;
  build: (seed: number) => BoxPart[];
  /** The size it is fitted to (voxels). */
  target: Extent;
}

const d = (label: string, build: (seed: number) => BoxPart[], target: Extent): VoxelDesign => ({ label, build: (seed) => fitTo(build(seed), target), target });

export const VOXEL_DESIGNS = {
  // Suburb houses: one-storey ones like the bungalow, two-storey ones like the two-storey house
  porchCottage: d('porch cottage', D.porchCottage, HOUSE_LOW),
  ranchHouse: d('ranch house', D.ranchHouse, HOUSE_LOW),
  splitLevel: d('split level', D.splitLevel, HOUSE_TALL),
  familyHouse: d('family house', D.familyHouse, HOUSE_TALL),
  rowUnits: d('row units', D.rowUnits, HOUSE_TALL),
  modernCube: d('modern cube', D.modernCube, HOUSE_LOW),
  modernGable: d('modern gable', D.modernGable, withH(HOUSE_LOW, HOUSE_TALL.h)),
  lighthouseCottage: d('lighthouse cottage', D.lighthouseCottage, withH(HOUSE_LOW, HOUSE_TALL.h)),
  keeperCottage: d('keeper cottage', D.keeperCottage, HOUSE_LOW),
  thatchedCottage: d('thatched cottage', D.thatchedCottage, HOUSE_LOW),
  porchLogCabin: d('porch log cabin', D.porchLogCabin, HOUSE_LOW),
  aFrameCabin: d('A-frame cabin', D.aFrameCabin, HOUSE_LOW),
  logCabin: d('log cabin', D.logCabin, HOUSE_LOW),
  // Downtown (one tile each): tall ones like the apartment, low ones like the loft; heights vary a little around them
  brownstone: d('brownstone', D.brownstone, withH(DOWNTOWN_LOW, DOWNTOWN_LOW.h + 3)),
  prewarApartment: d('prewar apartment', D.prewarApartment, DOWNTOWN_TALL),
  postwarSlab: d('postwar slab', D.postwarSlab, withH(DOWNTOWN_TALL, DOWNTOWN_TALL.h + 2)),
  apartmentBlock: d('apartment block', D.apartmentBlock, DOWNTOWN_LOW),
  tenement: d('tenement', D.tenement, withH(DOWNTOWN_TALL, DOWNTOWN_TALL.h - 3)),
  slabTower: d('slab tower', D.slabTower, withH(DOWNTOWN_TALL, DOWNTOWN_TALL.h - 1)),
  glassOffice: d('glass office', D.glassOffice, withH(DOWNTOWN_TALL, DOWNTOWN_TALL.h + 4)),
  decoSetback: d('deco setback', D.decoSetback, withH(DOWNTOWN_TALL, DOWNTOWN_TALL.h + 4)),
  monolithTower: d('monolith', D.monolithTower, withH(DOWNTOWN_TALL, DOWNTOWN_TALL.h + 1)),
  // Community buildings: sizes of the matching structures in today's lot models
  welcomeArch: d('welcome arch', C.welcomeArch, box(11, 3.5, 10)), // welcome sign: 11 × 3.5 × 9
  lodgeGate: d('lodge gate', C.lodgeGate, box(12.6, 4.9, 16)), // gateway arch: 12.6 × 4.9 × 19.4 incl. lamps
  funArch: d('fun arch', C.funArch, box(12.6, 3, 17)),
  picnicShelter: d('picnic shelter', C.picnicShelter, box(12, 12, 14)), // park gazebo: 12 × 12 × 15.5
  patrolHut: d('patrol hut', () => C.patrolHut(), box(22, 18, 19)), // warming hut body: about 20–22 × 18 × 19–21
  refugeHut: d('refuge hut', C.refugeHut, box(21, 18, 15)),
  stationHall: d('station hall', C.stationHall, box(30, 18, 18)), // community hall body: about 31 × 18 × 13–22
  grandHall: d('grand hall', C.grandHall, box(30, 18, 19)),
  toyBlockHall: d('toy-block hall', C.toyBlockHall, box(29, 16, 19)),
  workshopHall: d('workshop hall', () => C.workshopHall(), box(28, 17, 18)),
  brickSchool: d('brick school', C.brickSchool, box(16, 9, 13.6)), // school feature building: 16 × 9 × 13.6
  schoolhouse: d('schoolhouse', () => C.schoolhouse(), box(12, 9, 14)),
  movieTheatre: d('movie theatre', C.movieTheatre, box(20, 14, 14)),
  firePit1: d('fire pit 1', () => S.firePitRing(0), box(11, 11, 6.8)), // today's stone ring with its flames
  firePit2: d('fire pit 2', () => S.firePitRing(1), box(11, 11, 6.8)),
  firePit3: d('fire pit 3', () => S.firePitRing(2), box(11, 11, 6.8)),
  gardenShed: d('garden shed', C.gardenShed, box(5, 6, 8.6)), // the community garden's shed
  gardenBed: d('garden bed', S.gardenBed, box(8, 4, 3.6)),
  // Trees like today's leafy tree and spruce
  tallPine: d('tall pine', S.tallPine, withH(EVERGREEN, EVERGREEN.h + 1.5)),
  youngPine: d('young pine', S.youngPine, { w: EVERGREEN.w * 0.85, d: EVERGREEN.d * 0.85, h: EVERGREEN.h * 0.75 }),
  firTree: d('fir', S.firTree, EVERGREEN),
  shadeTree: d('shade tree', S.shadeTree, { ...LEAFY, w: LEAFY.w * 1.15 }),
  ornamentalTree: d('ornamental tree', S.ornamentalTree, LEAFY),
  columnShrub: d('column shrub', S.columnShrub, { w: 3.5, d: 3.5, h: EVERGREEN.h }),
  oliveTree: d('olive tree', S.oliveTree, { ...LEAFY, d: LEAFY.d * 0.85 }),
  lollipopTree: d('lollipop tree', S.lollipopTree, LEAFY),
  coneTree: d('cone tree', S.coneTree, { w: EVERGREEN.w * 0.85, d: EVERGREEN.d * 0.85, h: EVERGREEN.h }),
  // Cars like today's car (taller ones a little taller), transit in proportion
  suv: d('SUV', S.suv, withH(CAR, CAR.h + 0.6)),
  minivan: d('minivan', S.minivan, withH(CAR, CAR.h + 0.6)),
  pickupTruck: d('pickup', S.pickupTruck, withH(CAR, CAR.h + 0.2)),
  hatchback: d('hatchback', S.hatchback, { ...CAR, w: CAR.w * 0.9 }),
  townCar: d('town car', S.townCar, { ...CAR, w: CAR.w * 1.05, h: CAR.h - 0.2 }),
  schoolBus: d('school bus', () => S.schoolBus(), box(13, CAR.d, CAR.h + 1.2)),
  cityTram: d('city tram', () => S.cityTram(), box(20, CAR.d, 7)),
  // Street props like today's bench, lamp and mailbox
  parkBench: d('park bench', () => S.parkBench(), BENCH),
  logBench: d('log bench', () => S.logBench(), { ...BENCH, d: BENCH.d + 0.4, h: BENCH.h * 0.75 }),
  armLamp: d('arm lamp', () => S.armLamp(), { ...LAMP, w: LAMP.w + 1.6 }),
  garlandLamp: d('garland lamp', () => S.garlandLamp(), LAMP),
  cobraLight: d('cobra light', () => S.cobraLight(), { ...LAMP, w: LAMP.w + 2.4, h: LAMP.h + 0.6 }),
  curbMailbox: d('mailbox', S.curbMailbox, { ...MAILBOX, d: MAILBOX.d + 1 }),
  snowman: d('snowman', S.snowman, box(5, 3.4, 7)), // about as tall as a person
  drinkingFountain: d('drinking fountain', () => S.drinkingFountain(), box(2.4, 2.4, 4.4)),
  slide: d('slide', () => S.slide('#ef9b7f', '#e9c46a'), box(8.5, 2.6, 7)), // today's playground tower: 9 tall
  roundabout: d('roundabout', () => S.roundabout('#9fd0bd', '#b9a6e2'), box(5.2, 5.2, 2.8)),
  springRider: d('spring rider', () => S.springRider('#e9c46a'), box(4.8, 1.8, 4.8)), // today's spring rider: 4.8 tall
  teeterTotter: d('seesaw', () => S.teeterTotter('#ef9b7f', '#5b8fd6'), box(8, 1.2, 3.4)),
} as const satisfies Record<string, VoxelDesign>;

export type VoxelDesignName = keyof typeof VOXEL_DESIGNS;
