/**
 * Layout of the gallery's "New voxel designs" (M23 rework): every new voxel design next to the
 * closest model the game draws now (left: now, right: new), so size and volume can be compared,
 * row by row on grass plates sized to what stands on them. Pure (no React), so the camera presets
 * can use the plate sizes.
 */
import { translate, type BoxPart } from '../assets/boxes';
import { BUILDING_VOXELS } from '../assets/voxel/buildings';
import { FEATURE_VOXELS } from '../assets/voxel/features';
import { MOOD_PALETTES } from '../mood';
import { extent, VOXEL_DESIGNS, type VoxelDesignName } from '../assets/voxel/designFit';
import { ART, apartment, bench, bungalow, car, communityHall, flowerBed, infill, lampPost, leafyTree, loft, mailbox, semiDetached, spruce, townhouses, twoStoreyGarage } from '../assets/voxel/samples';
import { rnd, shade } from '../assets/voxel/voxel';

interface Pair {
  /** The closest model the game draws now (null when there is none to compare with). */
  now: BoxPart[] | null;
  label: string;
  voxel: BoxPart[];
  /** Cell size in tiles (the larger of the two models). */
  size: number;
}

const CTX = { palette: MOOD_PALETTES.lively, snow: false };
/** A building of the tree as drawn now, on its lot (w × d tiles). */
const lot = (key: string, variant: number, w: number, d: number): BoxPart[] => BUILDING_VOXELS[key]({ w, d, level: 1, variant }, CTX);
/** A design from the fitted set, built with a fixed seed. */
const v = (name: VoxelDesignName, seed = 3): { label: string; parts: BoxPart[] } => ({ label: VOXEL_DESIGNS[name].label, parts: VOXEL_DESIGNS[name].build(seed) });
const p = (now: BoxPart[] | null, design: { label: string; parts: BoxPart[] }, size = 1): Pair => ({ now, label: design.label, voxel: design.parts, size });

export const DESIGN_PAIRS: Record<Exclude<DesignSection, 'New people'>, { perRow: number; pairs: Pair[] }> = {
  'New houses': {
    perRow: 5,
    pairs: [
      p(bungalow(3), v('porchCottage', 3)),
      p(bungalow(5), v('ranchHouse', 5)),
      p(semiDetached(7), v('splitLevel', 7)),
      p(twoStoreyGarage(9), v('familyHouse', 9)),
      p(townhouses(11), v('rowUnits', 11)),
      p(infill(13), v('modernCube', 13)),
      p(infill(15), v('modernGable', 15)),
      p(bungalow(17), v('lighthouseCottage', 17)),
      p(bungalow(19), v('keeperCottage', 19)),
      p(bungalow(21), v('thatchedCottage', 21)),
      p(bungalow(23), v('porchLogCabin', 23)),
      p(bungalow(25), v('aFrameCabin', 25)),
      p(bungalow(27), v('logCabin', 27)),
    ],
  },
  'New downtown': {
    perRow: 5,
    pairs: [
      p(loft(1), v('brownstone', 3)),
      p(apartment(3), v('prewarApartment', 5)),
      p(apartment(4), v('postwarSlab', 7)),
      p(loft(5), v('apartmentBlock', 9)),
      p(apartment(6), v('tenement', 11)),
      p(apartment(7), v('slabTower', 13)),
      p(apartment(8), v('glassOffice', 15)),
      p(apartment(9), v('decoSetback', 17)),
      p(apartment(10), v('monolithTower', 19)),
    ],
  },
  'New buildings': {
    perRow: 4,
    pairs: [
      p(lot('welcome-sign', 0, 1, 1), v('welcomeArch', 1)),
      p(lot('gateway-arch', 0, 1, 1), v('lodgeGate', 2)),
      p(lot('gateway-arch', 1, 1, 1), v('funArch', 3)),
      p(null, v('picnicShelter', 4)),
      p(lot('warming-hut', 0, 3, 3), v('patrolHut'), 3),
      p(lot('warming-hut', 1, 3, 3), v('refugeHut', 5), 3),
      p(lot('community-hall', 0, 3, 3), v('stationHall', 6), 3),
      p(lot('community-hall', 2, 3, 3), v('grandHall', 7), 3),
      p(lot('community-hall', 1, 3, 3), v('toyBlockHall', 8), 3),
      p(communityHall(1), v('workshopHall'), 3),
      p(FEATURE_VOXELS.school(0, CTX), v('brickSchool', 9), 2),
      p(FEATURE_VOXELS.school(1, CTX), v('schoolhouse'), 2),
      p(null, v('movieTheatre', 10), 2),
      p(lot('fire-pit', 0, 3, 3), v('firePit1'), 3),
      p(null, v('firePit2')),
      p(null, v('firePit3')),
      p(null, v('gardenShed', 11)),
      p(flowerBed(12), v('gardenBed', 12)),
    ],
  },
  'New street & trees': {
    perRow: 6,
    pairs: [
      p(spruce(1), v('tallPine', 1)),
      p(spruce(2), v('youngPine', 2)),
      p(spruce(3), v('firTree', 3)),
      p(leafyTree(4), v('shadeTree', 4)),
      p(leafyTree(5), v('ornamentalTree', 5)),
      p(spruce(6), v('columnShrub', 6)),
      p(leafyTree(7), v('oliveTree', 7)),
      p(leafyTree(8), v('lollipopTree', 8)),
      p(spruce(9), v('coneTree', 9)),
      p(car(1), v('suv', 1)),
      p(car(2), v('minivan', 2)),
      p(car(3, true), v('pickupTruck', 3)),
      p(car(4), v('hatchback', 4)),
      p(car(5), v('townCar', 5)),
      p(null, v('schoolBus'), 1.5),
      p(null, v('cityTram'), 2),
      p(bench(), v('parkBench')),
      p(bench(), v('logBench')),
      p(lampPost(), v('armLamp')),
      p(lampPost(), v('garlandLamp')),
      p(lampPost(), v('cobraLight')),
      p(mailbox(), v('curbMailbox', 1)),
      p(null, v('snowman', 2)),
      p(null, v('drinkingFountain')),
      p(null, v('slide')),
      p(null, v('roundabout')),
      p(null, v('springRider')),
      p(null, v('teeterTotter')),
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
  /** The label under the model drawn now (grey). */
  now?: boolean;
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
  parts: BoxPart[];
  labels: Label[];
  /** Plate of each section (x0, z0, w, d in tiles), sized to what stands on it. */
  plates: Record<DesignSection, { x0: number; z0: number; w: number; d: number }>;
}

/** Lays out every pair (the model drawn now, then the new design) row by row inside its section. */
export function buildDesignScene(): DesignScene {
  const parts: BoxPart[] = [];
  const labels: Label[] = [];
  const plates = {} as DesignScene['plates'];
  for (const [section, { perRow, pairs }] of Object.entries(DESIGN_PAIRS) as [Exclude<DesignSection, 'New people'>, (typeof DESIGN_PAIRS)[keyof typeof DESIGN_PAIRS]][]) {
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
      if (pair.now) {
        parts.push(...translate(pair.now, refX, cz));
        labels.push({ section, text: 'now', at: [refX, 0.05, cz + cell / 2 + 0.25], now: true });
      }
      parts.push(...translate(pair.voxel, voxX, cz));
      labels.push({ section, text: pair.label, at: [voxX, extent(pair.voxel).h / 12 + 0.25, cz] });
      x += cell * 2 + 1.3;
      maxX = Math.max(maxX, voxX + cell / 2);
      rowDepth = Math.max(rowDepth, cell);
    });
    plates[section] = { x0: s.x0, z0: s.z0, w: Math.ceil(maxX - s.x0 + 1), d: Math.ceil(z + rowDepth + 0.8 - s.z0) };
  }
  const people = DESIGN_SECTIONS['New people'];
  plates['New people'] = { x0: people.x0, z0: people.z0, w: PEOPLE_COLS + 2, d: Math.ceil(PEOPLE_ROWS * 2.2 + 1) };
  for (const pl of Object.values(plates)) parts.push(...plate(pl.x0, pl.z0, pl.w, pl.d));
  return { parts, labels, plates };
}

/** Varied people shown: columns × rows (one tile apart, rows 2.2 tiles apart). */
export const PEOPLE_COLS = 12;
export const PEOPLE_ROWS = 3;
