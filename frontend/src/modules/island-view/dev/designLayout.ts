/**
 * Layout of the gallery's "New voxel designs" (M23 rework): every new voxel design next to the
 * Polyfork model it was drawn from (left: reference, right: ours), row by row on grass plates
 * sized to what stands on them. Pure (no React), so the camera presets can use the plate sizes.
 */
import { translate, type BoxPart } from '../assets/boxes';
import type { LpName } from '../assets/lowpoly/catalogue';
import type { LpPlacement } from '../assets/lowpoly/placement';
import * as D from '../assets/voxel/designs';
import * as C from '../assets/voxel/designsCivic';
import * as S from '../assets/voxel/designsStreet';
import { ART } from '../assets/voxel/samples';
import { rnd, shade } from '../assets/voxel/voxel';

interface Pair {
  /** The Polyfork model the design was drawn from (null when it is not in our catalogue). */
  ref: LpName | null;
  label: string;
  voxel: BoxPart[];
  /** Footprint in tiles (cell size). */
  size: number;
  /** Label height in tiles. */
  h: number;
}

const p = (ref: LpName | null, label: string, voxel: BoxPart[], size = 1, h = 1.3): Pair => ({ ref, label, voxel, size, h });

const PAIRS: Record<Exclude<DesignSection, 'New people'>, { perRow: number; pairs: Pair[] }> = {
  'New houses': {
    perRow: 5,
    pairs: [
      p('porchCottage', 'porch cottage', D.porchCottage(3)),
      p('ranch', 'ranch house', D.ranchHouse(5)),
      p('splitLevel', 'split level', D.splitLevel(7)),
      p('twoStorey', 'family house', D.familyHouse(9)),
      p('townhouse', 'row units', D.rowUnits(11)),
      p('cubeHouse', 'modern cube', D.modernCube(13)),
      p('gableHouse', 'modern gable', D.modernGable(15)),
      p('lighthouseCottage', 'lighthouse cottage', D.lighthouseCottage(17), 1, 1.6),
      p('crossingCottage', 'keeper cottage', D.keeperCottage(19)),
      p('thatchedCottage', 'thatched cottage', D.thatchedCottage(21)),
      p('porchLogCabin', 'porch log cabin', D.porchLogCabin(23)),
      p('aFrame', 'A-frame cabin', D.aFrameCabin(25)),
      p('logCabin', 'log cabin', D.logCabin(27)),
    ],
  },
  'New downtown': {
    perRow: 5,
    pairs: [
      p('brownstone', 'brownstone', D.brownstone(3), 1, 2),
      p('prewarApartment', 'prewar apartment', D.prewarApartment(5), 1, 2.8),
      p('postwarSlab', 'postwar slab', D.postwarSlab(7), 1, 3.2),
      p('apartmentBlock', 'apartment block', D.apartmentBlock(9), 1, 1.5),
      p('tenement', 'tenement', D.tenement(11), 1, 2.5),
      p('slabBlock', 'slab tower', D.slabTower(13), 1, 2.8),
      p('officeTower', 'glass office', D.glassOffice(15), 1, 3.6),
      p('artDecoTower', 'deco setback', D.decoSetback(17), 1, 3.8),
      p('monolithTower', 'monolith', D.monolithTower(19), 1, 2.8),
    ],
  },
  'New buildings': {
    perRow: 4,
    pairs: [
      p('townArch', 'welcome arch', C.welcomeArch(1)),
      p('gateArch', 'lodge gate', C.lodgeGate(2)),
      p('parkArch', 'fun arch', C.funArch(3), 1, 1.6),
      p('picnicShelter', 'picnic shelter', C.picnicShelter(4)),
      p('pisteHut', 'patrol hut', C.patrolHut(), 2, 2.2),
      p('refugeHut', 'refuge hut', C.refugeHut(5), 2, 1.6),
      p('countryStation', 'station hall', C.stationHall(6), 2.5, 1.8),
      p('audienceHall', 'grand hall', C.grandHall(7), 2.5, 1.8),
      p('toyTownSchool', 'toy-block hall', C.toyBlockHall(8), 2.5, 1.9),
      p('santasWorkshop', 'workshop hall', C.workshopHall(), 2.5, 2.2),
      p('publicSchool', 'brick school', C.brickSchool(9), 2, 1.3),
      p('oneRoomSchool', 'schoolhouse', C.schoolhouse(), 2, 1.6),
      p(null, 'movie theatre (no reference loaded)', C.movieTheatre(10), 2, 1.6),
      p('stoneFirePit', 'fire pit 1', S.firePitRing(0)),
      p('ringCampfire', 'fire pit 2', S.firePitRing(1)),
      p('clearedFirePit', 'fire pit 3', S.firePitRing(2)),
      p('gardenShed', 'garden shed', C.gardenShed(11)),
      p('gardenBed', 'garden bed', S.gardenBed(12), 1, 0.6),
    ],
  },
  'New street & trees': {
    perRow: 6,
    pairs: [
      p('tallPine', 'tall pine', S.tallPine(1), 1, 1.6),
      p('youngPine', 'young pine', S.youngPine(2)),
      p('fir', 'fir', S.firTree(3), 1, 1.3),
      p('shadeTree', 'shade tree', S.shadeTree(4)),
      p('ornamentalTree', 'ornamental tree', S.ornamentalTree(5)),
      p('evergreenShrub', 'column shrub', S.columnShrub(6)),
      p('oliveTree', 'olive tree', S.oliveTree(7)),
      p('lollipopTree', 'lollipop tree', S.lollipopTree(8)),
      p('coneTree', 'cone tree', S.coneTree(9)),
      p('suv', 'SUV', S.suv(1), 1, 0.7),
      p('minivan', 'minivan', S.minivan(2), 1, 0.7),
      p('pickup', 'pickup', S.pickupTruck(3), 1, 0.7),
      p('hatchback', 'hatchback', S.hatchback(4), 1, 0.7),
      p('townCar', 'town car', S.townCar(5), 1, 0.7),
      p(null, 'school bus', S.schoolBus(), 1.5, 0.8),
      p(null, 'city tram', S.cityTram(), 2, 1),
      p('parkBench', 'park bench', S.parkBench(), 1, 0.6),
      p('alpineBench', 'log bench', S.logBench(), 1, 0.6),
      p('streetLamp', 'arm lamp', S.armLamp()),
      p('garlandLamp', 'garland lamp', S.garlandLamp()),
      p('cobraLight', 'cobra light', S.cobraLight(), 1, 1.2),
      p('mailbox', 'mailbox', S.curbMailbox(1), 1, 0.7),
      p('snowman', 'snowman', S.snowman(2), 1, 0.9),
      p('drinkingFountain', 'drinking fountain', S.drinkingFountain(), 1, 0.6),
      p('playgroundSlide', 'slide', S.slide('#ef9b7f', '#e9c46a'), 1, 0.7),
      p('roundabout', 'roundabout', S.roundabout('#9fd0bd', '#b9a6e2'), 1, 0.5),
      p('springRider', 'spring rider', S.springRider('#e9c46a'), 1, 0.6),
      p('teeterTotter', 'seesaw', S.teeterTotter('#ef9b7f', '#5b8fd6'), 1, 0.5),
    ],
  },
};

/** Where each section starts and how close the camera comes (plates are sized below). */
export const DESIGN_SECTIONS = {
  'New houses': { x0: 40, z0: 0, zoom: 62 },
  'New downtown': { x0: 40, z0: 12, zoom: 46 },
  'New street & trees': { x0: 40, z0: 22, zoom: 52 },
  'New buildings': { x0: 66, z0: 0, zoom: 36 },
  'New people': { x0: 66, z0: 22, zoom: 105 },
} as const;
export type DesignSection = keyof typeof DESIGN_SECTIONS;

export interface Label {
  section: DesignSection;
  text: string;
  at: [number, number, number];
  ref?: boolean;
}

function plate(x0: number, z0: number, w: number, d: number): BoxPart[] {
  const parts: BoxPart[] = [];
  for (let x = 0; x < w; x++)
    for (let z = 0; z < d; z++) parts.push({ layer: 'solid', p: [x0 + x + 0.5, -0.25, z0 + z + 0.5], s: [1, 0.5, 1], c: shade(ART.grass[(x + z) & 1], (rnd(x0 + x, z0 + z, 1) - 0.5) * 0.08) });
  for (let x = 0; x < w; x++) parts.push({ layer: 'solid', p: [x0 + x + 0.5, -1.0, z0 + d - 0.5], s: [1, 1, 1], c: x % 2 ? '#9b7653' : '#8d6b4b' });
  for (let z = 0; z < d; z++) parts.push({ layer: 'solid', p: [x0 + w - 0.5, -1.0, z0 + z + 0.5], s: [1, 1, 1], c: z % 2 ? '#8d6b4b' : '#9b7653' });
  return parts;
}

export interface DesignScene {
  placements: LpPlacement[];
  parts: BoxPart[];
  labels: Label[];
  /** Plate of each section (x0, z0, w, d in tiles), sized to what stands on it. */
  plates: Record<DesignSection, { x0: number; z0: number; w: number; d: number }>;
}

/** Lays out every pair (Polyfork reference, then our design) row by row inside its section. */
export function buildDesignScene(): DesignScene {
  const placements: LpPlacement[] = [];
  const parts: BoxPart[] = [];
  const labels: Label[] = [];
  const plates = {} as DesignScene['plates'];
  for (const [section, { perRow, pairs }] of Object.entries(PAIRS) as [Exclude<DesignSection, 'New people'>, (typeof PAIRS)[keyof typeof PAIRS]][]) {
    const s = DESIGN_SECTIONS[section];
    let x = s.x0 + 1;
    let z = s.z0 + 1.2;
    let rowDepth = 0;
    let maxX = x;
    pairs.forEach((pair, i) => {
      if (i > 0 && i % perRow === 0) {
        x = s.x0 + 1;
        z += rowDepth + 1.2;
        rowDepth = 0;
      }
      const cell = pair.size;
      const refX = x + cell / 2;
      const voxX = refX + cell + 0.3;
      const cz = z + cell / 2;
      if (pair.ref) {
        placements.push({ model: pair.ref, x: refX, z: cz, turn: 0, lit: 1, roof: ART.roofs[(i * 3) % ART.roofs.length], wall: ART.walls[(i * 5) % ART.walls.length] });
        labels.push({ section, text: 'ref', at: [refX, 0.05, cz + cell / 2 + 0.25], ref: true });
      }
      parts.push(...translate(pair.voxel, voxX, cz));
      labels.push({ section, text: pair.label, at: [voxX, pair.h + 0.25, cz] });
      x += cell * 2 + 1.3;
      maxX = Math.max(maxX, voxX + cell / 2);
      rowDepth = Math.max(rowDepth, cell);
    });
    plates[section] = { x0: s.x0, z0: s.z0, w: Math.ceil(maxX - s.x0 + 1), d: Math.ceil(z + rowDepth + 0.8 - s.z0) };
  }
  const people = DESIGN_SECTIONS['New people'];
  plates['New people'] = { x0: people.x0, z0: people.z0, w: PEOPLE_COLS + 2, d: Math.ceil(PEOPLE_ROWS * 2.2 + 1) };
  for (const pl of Object.values(plates)) parts.push(...plate(pl.x0, pl.z0, pl.w, pl.d));
  return { placements, parts, labels, plates };
}

/** Varied people shown: columns × rows (one tile apart, rows 2.2 tiles apart). */
export const PEOPLE_COLS = 12;
export const PEOPLE_ROWS = 3;
