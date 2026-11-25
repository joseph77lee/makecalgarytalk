/**
 * Polyfork pieces for buildings of the tree and signature features (M23, requirement.md v1.45
 * §19.1). The main structure (arch, hut, hall, school, play equipment, park shelter, trees,
 * benches, shed) is a Polyfork model; the ground, flames, flags, fences and flowers stay our box
 * parts (`buildingSurroundings` / `featureSurroundings`). Rinks, the pond, the sledding hill, the
 * dog park and the CTrain stay ours entirely (null here).
 *
 * Pieces are written in the lot's canonical frame (wide side along x, front towards +z, tiles from
 * the lot centre) and turned with the lot like the box models.
 */
import type { BuildingObject, ObjectOf } from '../../layout';
import { ART } from '../voxel/samples';
import { rnd } from '../voxel/voxel';
import type { LpName } from './catalogue';
import type { LpPlacement } from './placement';

/** A piece in the lot's canonical frame. */
interface Piece {
  model: LpName;
  x: number;
  z: number;
  /** Own turn in the canonical frame (radians). */
  turn?: number;
  scale?: number;
  mirror?: boolean;
  lit?: 0 | 1 | 2;
  roof?: string;
  wall?: string;
}

const V = 1 / 12; // one voxel of the box models, in tiles
const pick = <T,>(list: readonly T[], r: number): T => list[Math.min(list.length - 1, Math.floor(r * list.length))];
/** One design per community, spread evenly over the list (`variant` is already a hash). */
const design = <T,>(list: readonly T[], variant: number): T => list[((variant % list.length) + list.length) % list.length];
/** Bright playground colour sets (the same as the box playground's). */
const PLAY = [
  ['#ef9b7f', '#e9c46a', '#9fd0bd', '#b9a6e2'],
  ['#e0453c', '#ffcc2e', '#3d8bfd', '#6fbf8a'],
];

/** Pieces of a building of the tree, or null to keep its box model. */
export function buildingPieces(key: string, variant: number): Piece[] | null {
  const colours = { roof: pick(ART.roofs, rnd(variant, 6)), wall: pick(ART.walls, rnd(variant, 5)) };
  switch (key) {
    case 'gateway-arch':
      return [{ model: design<LpName>(['townArch', 'gateArch', 'parkArch'], variant), x: 0, z: 0 }];
    case 'fire-pit':
      // the stone ring under our flames; flames, benches and string lights stay box parts
      return [{ model: design<LpName>(['stoneFirePit', 'ringCampfire', 'clearedFirePit'], variant), x: 0, z: 0, scale: 0.9 }];
    case 'warming-hut':
      return [{ model: design<LpName>(['pisteHut', 'refugeHut', 'logCabinHut'], variant), x: -1 * V, z: -2 * V, lit: 1, ...colours }];
    case 'community-hall':
      return [{ model: design<LpName>(['countryStation', 'audienceHall', 'toyTownSchool', 'santasWorkshop'], variant), x: -1 * V, z: -2 * V, lit: 1, ...colours }];
    case 'playground': {
      const [a, b, c, d] = PLAY[variant % 2];
      return [
        { model: 'playgroundSlide', x: -5.5 * V, z: -5 * V, turn: Math.PI / 2, roof: a, wall: b },
        { model: 'roundabout', x: 6 * V, z: 5.5 * V, roof: c, wall: d },
        { model: 'springRider', x: -6.5 * V, z: 6 * V, turn: rnd(variant, 85) * Math.PI, roof: d, wall: a },
        { model: 'teeterTotter', x: -0.5 * V, z: 1.5 * V, turn: Math.PI / 4, roof: b, wall: c },
      ];
    }
    case 'community-garden':
      return [
        { model: 'gardenShed', x: 8.5 * V, z: -8 * V, roof: colours.roof },
        { model: 'gardenBed', x: 3 * V, z: 8.7 * V },
      ];
    case 'neighbourhood-park': {
      const trees: LpName[] = ['shadeTree', 'ornamentalTree', 'fir', 'shadeTree'];
      const pieces: Piece[] = [
        ...([[-11, -11], [11, -11], [-11, 11], [12, 12]] as const).map(([x, z], i): Piece => ({ model: trees[(i + variant) % trees.length], x: x * V, z: z * V, turn: rnd(variant, 86 + i) * Math.PI * 2 })),
        { model: 'parkBench', x: -7 * V, z: 3.6 * V, turn: Math.PI },
        { model: 'parkBench', x: 8 * V, z: -3.9 * V },
        { model: 'parkBench', x: 3.6 * V, z: 11 * V, turn: -Math.PI / 2 },
        { model: 'drinkingFountain', x: 3 * V, z: -3 * V },
      ];
      // the shelter replaces the gazebo; the fountain design keeps our fountain
      if (variant % 2 === 0) pieces.push({ model: 'picnicShelter', x: 0, z: 0, roof: colours.roof });
      return pieces;
    }
    default:
      return null;
  }
}

/** Pieces of a signature feature, or null to keep its box model. */
export function featurePieces(key: ObjectOf<'feature'>['featureKey'], variant: number): Piece[] | null {
  if (key === 'school') {
    const model = design<LpName>(['publicSchool', 'oneRoomSchool', 'toyTownSchool'], variant);
    return [{ model, x: -3 * V, z: -6.5 * V, lit: 1, scale: model === 'toyTownSchool' ? 0.6 : 1, roof: pick(ART.roofs, rnd(variant, 92)), wall: pick(ART.walls, rnd(variant, 93)) }];
  }
  if (key === 'big-park') {
    const spots: [number, number, boolean][] = variant % 2 === 0 ? [[-7, -7, false], [0, -8, true], [7, -6, false], [-8, 8, true], [8, 8, false]] : [[-6, -6, true], [6, -6.5, true], [-1, -7.5, false], [-7.5, 7, false], [7, 7, true]];
    const leafy: LpName[] = ['shadeTree', 'ornamentalTree', 'oliveTree'];
    const evergreen: LpName[] = ['tallPine', 'fir', 'coneTree'];
    return spots.map(([x, z, conifer], i) => ({ model: pick(conifer ? evergreen : leafy, rnd(variant, 94 + i)), x: x * V, z: z * V, turn: rnd(variant, 99 + i) * Math.PI * 2, scale: 0.85 }));
  }
  return null;
}

/** Canonical pieces turned and moved onto the island with their lot. */
export function placePieces(pieces: Piece[] | null, item: { x: number; z: number; facing: number }): LpPlacement[] | null {
  if (!pieces) return null;
  const t = (item.facing * Math.PI) / 2;
  const c = Math.cos(t);
  const s = Math.sin(t);
  return pieces.map(({ x, z, turn = 0, ...rest }) => ({ ...rest, x: item.x + x * c + z * s, z: item.z - x * s + z * c, turn: t + turn }));
}

export const placeBuilding = (item: BuildingObject): LpPlacement[] | null => placePieces(buildingPieces(item.buildingKey, item.variant), item);
export const placeFeature = (item: ObjectOf<'feature'>): LpPlacement[] | null => placePieces(featurePieces(item.featureKey, item.variant), item);
