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
import * as D from '../assets/voxel/designs';
import * as C from '../assets/voxel/designsCivic';
import * as S from '../assets/voxel/designsStreet';
import { ART, apartment, artDecoTower, bench, brickMidrise, bungalow, car, communityHall, condoTower, flowerBed, infill, lampPost, leafyTree, loft, mailbox, officeTower, semiDetached, spruce, townhouses, twoStoreyGarage } from '../assets/voxel/samples';
import { rnd, shade } from '../assets/voxel/voxel';

interface Pair {
  /** The closest model the game draws now (null when there is none to compare with). */
  now: BoxPart[] | null;
  label: string;
  voxel: BoxPart[];
  /** Cell size in tiles (the larger of the two models). */
  size: number;
  /** Label height in tiles. */
  h: number;
}

const CTX = { palette: MOOD_PALETTES.lively, snow: false };
/** A building of the tree as drawn now, on its lot (w × d tiles). */
const lot = (key: string, variant: number, w: number, d: number): BoxPart[] => BUILDING_VOXELS[key]({ w, d, level: 1, variant }, CTX);
const p = (now: BoxPart[] | null, label: string, voxel: BoxPart[], size = 1, h = 1.3): Pair => ({ now, label, voxel, size, h });

const PAIRS: Record<Exclude<DesignSection, 'New people'>, { perRow: number; pairs: Pair[] }> = {
  'New houses': {
    perRow: 5,
    pairs: [
      p(bungalow(3), 'porch cottage', D.porchCottage(3)),
      p(bungalow(5), 'ranch house', D.ranchHouse(5)),
      p(semiDetached(7), 'split level', D.splitLevel(7)),
      p(twoStoreyGarage(9), 'family house', D.familyHouse(9)),
      p(townhouses(11), 'row units', D.rowUnits(11)),
      p(infill(13), 'modern cube', D.modernCube(13)),
      p(infill(15), 'modern gable', D.modernGable(15)),
      p(bungalow(17), 'lighthouse cottage', D.lighthouseCottage(17), 1, 1.6),
      p(bungalow(19), 'keeper cottage', D.keeperCottage(19)),
      p(bungalow(21), 'thatched cottage', D.thatchedCottage(21)),
      p(bungalow(23), 'porch log cabin', D.porchLogCabin(23)),
      p(bungalow(25), 'A-frame cabin', D.aFrameCabin(25)),
      p(bungalow(27), 'log cabin', D.logCabin(27)),
    ],
  },
  'New downtown': {
    perRow: 5,
    pairs: [
      p(brickMidrise(1), 'brownstone', D.brownstone(3), 1, 2),
      p(apartment(3), 'prewar apartment', D.prewarApartment(5), 1, 2.8),
      p(condoTower(1), 'postwar slab', D.postwarSlab(7), 1, 3.2),
      p(apartment(5), 'apartment block', D.apartmentBlock(9), 1, 1.5),
      p(brickMidrise(2), 'tenement', D.tenement(11), 1, 2.5),
      p(loft(2), 'slab tower', D.slabTower(13), 1, 2.8),
      p(officeTower(1), 'glass office', D.glassOffice(15), 1, 3.6),
      p(artDecoTower(), 'deco setback', D.decoSetback(17), 1, 3.8),
      p(officeTower(2), 'monolith', D.monolithTower(19), 1, 2.8),
    ],
  },
  'New buildings': {
    perRow: 4,
    pairs: [
      p(lot('welcome-sign', 0, 1, 1), 'welcome arch', C.welcomeArch(1)),
      p(lot('gateway-arch', 0, 1, 1), 'lodge gate', C.lodgeGate(2)),
      p(lot('gateway-arch', 1, 1, 1), 'fun arch', C.funArch(3), 1, 1.6),
      p(null, 'picnic shelter', C.picnicShelter(4)),
      p(lot('warming-hut', 0, 3, 3), 'patrol hut', C.patrolHut(), 3, 2.2),
      p(lot('warming-hut', 1, 3, 3), 'refuge hut', C.refugeHut(5), 3, 1.6),
      p(lot('community-hall', 0, 3, 3), 'station hall', C.stationHall(6), 3, 1.8),
      p(lot('community-hall', 2, 3, 3), 'grand hall', C.grandHall(7), 3, 1.8),
      p(lot('community-hall', 1, 3, 3), 'toy-block hall', C.toyBlockHall(8), 3, 1.9),
      p(communityHall(1), 'workshop hall', C.workshopHall(), 3, 2.2),
      p(FEATURE_VOXELS.school(0, CTX), 'brick school', C.brickSchool(9), 2, 1.3),
      p(FEATURE_VOXELS.school(1, CTX), 'schoolhouse', C.schoolhouse(), 2, 1.6),
      p(null, 'movie theatre', C.movieTheatre(10), 2, 1.6),
      p(lot('fire-pit', 0, 3, 3), 'fire pit 1', S.firePitRing(0), 3),
      p(null, 'fire pit 2', S.firePitRing(1)),
      p(null, 'fire pit 3', S.firePitRing(2)),
      p(null, 'garden shed', C.gardenShed(11)),
      p(flowerBed(12), 'garden bed', S.gardenBed(12), 1, 0.6),
    ],
  },
  'New street & trees': {
    perRow: 6,
    pairs: [
      p(spruce(1), 'tall pine', S.tallPine(1), 1, 1.6),
      p(spruce(2), 'young pine', S.youngPine(2)),
      p(spruce(3), 'fir', S.firTree(3), 1, 1.3),
      p(leafyTree(4), 'shade tree', S.shadeTree(4)),
      p(leafyTree(5), 'ornamental tree', S.ornamentalTree(5)),
      p(spruce(6), 'column shrub', S.columnShrub(6)),
      p(leafyTree(7), 'olive tree', S.oliveTree(7)),
      p(leafyTree(8), 'lollipop tree', S.lollipopTree(8)),
      p(spruce(9), 'cone tree', S.coneTree(9)),
      p(car(1), 'SUV', S.suv(1), 1, 0.7),
      p(car(2), 'minivan', S.minivan(2), 1, 0.7),
      p(car(3, true), 'pickup', S.pickupTruck(3), 1, 0.7),
      p(car(4), 'hatchback', S.hatchback(4), 1, 0.7),
      p(car(5), 'town car', S.townCar(5), 1, 0.7),
      p(null, 'school bus', S.schoolBus(), 1.5, 0.8),
      p(null, 'city tram', S.cityTram(), 2, 1),
      p(bench(), 'park bench', S.parkBench(), 1, 0.6),
      p(bench(), 'log bench', S.logBench(), 1, 0.6),
      p(lampPost(), 'arm lamp', S.armLamp()),
      p(lampPost(), 'garland lamp', S.garlandLamp()),
      p(lampPost(), 'cobra light', S.cobraLight(), 1, 1.2),
      p(mailbox(), 'mailbox', S.curbMailbox(1), 1, 0.7),
      p(null, 'snowman', S.snowman(2), 1, 0.9),
      p(null, 'drinking fountain', S.drinkingFountain(), 1, 0.6),
      p(null, 'slide', S.slide('#ef9b7f', '#e9c46a'), 1, 0.7),
      p(null, 'roundabout', S.roundabout('#9fd0bd', '#b9a6e2'), 1, 0.5),
      p(null, 'spring rider', S.springRider('#e9c46a'), 1, 0.6),
      p(null, 'seesaw', S.teeterTotter('#ef9b7f', '#5b8fd6'), 1, 0.5),
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

/** Lays out every pair (Polyfork reference, then our design) row by row inside its section. */
export function buildDesignScene(): DesignScene {
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
      if (pair.now) {
        parts.push(...translate(pair.now, refX, cz));
        labels.push({ section, text: 'now', at: [refX, 0.05, cz + cell / 2 + 0.25], now: true });
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
  return { parts, labels, plates };
}

/** Varied people shown: columns × rows (one tile apart, rows 2.2 tiles apart). */
export const PEOPLE_COLS = 12;
export const PEOPLE_ROWS = 3;
