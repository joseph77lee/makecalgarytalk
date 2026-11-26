/**
 * House generator (M19, requirement.md v1.38 §7.2, §19): every resident's house gets a type that
 * fits the community (downtown: apartments and lofts; inner-city: bungalows, infills, duplexes;
 * suburbs: two-storey homes with garages, townhouses), colours from the warm pastel palette, and
 * faces the nearest path. Deterministic from the house id, so a house never changes.
 */
import communitiesCsv from '../../../../../../supabase/data/calgary_communities.csv?raw';
import type { BoxPart } from '../boxes';
import { apartment, ART, bungalow, infill, loft, semiDetached, townhouses, twoStoreyGarage } from './samples';
import { VOXEL_DESIGNS as N } from './designFit';
import { rnd, vmirrorX, vturn } from './voxel';

export const HOUSE_TYPES = ['bungalow', 'twoStoreyGarage', 'semiDetached', 'townhouses', 'infill', 'apartment', 'loft'] as const;
export type HouseType = (typeof HOUSE_TYPES)[number];
export type HouseStyle = 'downtown' | 'inner' | 'suburb';

/**
 * The models of each house type: the first M19 design plus the M23 voxel designs (drawn after
 * Polyfork shapes, fitted to the same size), so a grown community mixes many houses.
 */
export const HOUSE_DESIGNS: Record<HouseType, ((seed: number) => BoxPart[])[]> = {
  bungalow: [bungalow, bungalow, N.porchCottage.build, N.ranchHouse.build, N.keeperCottage.build, N.thatchedCottage.build, N.porchLogCabin.build, N.aFrameCabin.build, N.logCabin.build, N.lighthouseCottage.build],
  twoStoreyGarage: [twoStoreyGarage, twoStoreyGarage, N.familyHouse.build, N.splitLevel.build, N.modernGable.build],
  semiDetached: [semiDetached, semiDetached, N.splitLevel.build],
  townhouses: [townhouses, N.rowUnits.build],
  infill: [infill, N.modernCube.build, N.modernGable.build],
  apartment: [apartment, apartment, N.prewarApartment.build, N.postwarSlab.build, N.tenement.build, N.slabTower.build, N.glassOffice.build, N.decoSetback.build, N.monolithTower.build],
  loft: [loft, loft, N.brownstone.build, N.apartmentBlock.build],
};

/** The house model for this seed: one of its type's designs, mirrored for half of the houses. */
function houseModel(type: HouseType, seed: number): BoxPart[] {
  const pool = HOUSE_DESIGNS[type];
  const parts = withRoofTag(pool[Math.floor(rnd(seed, 41) * pool.length) % pool.length](seed));
  return rnd(seed, 42) < 0.5 ? vmirrorX(parts) : parts;
}

/**
 * Flat-roofed designs mark no roof: their topmost boxes become the roof, so snow settles on them
 * like on every other house (§10.4). Models that already tag a roof are left alone.
 */
function withRoofTag(parts: BoxPart[]): BoxPart[] {
  if (parts.some((b) => b.tag === 'roof')) return parts;
  const top = Math.max(...parts.map((b) => b.p[1] + b.s[1] / 2));
  return parts.map((b) => (b.layer === 'solid' && !WINDOWS.has(b.c) && b.p[1] + b.s[1] / 2 > top - 0.08 ? { ...b, tag: 'roof' } : b));
}

/** Downtown communities get buildings instead of detached houses (operator decision 2026-11-24). */
const DOWNTOWN = new Set(['DNC', 'DNE', 'DNW', 'EAU', 'CHN', 'BLN']);

const SECTORS: Record<string, string> = Object.fromEntries(
  communitiesCsv
    .trim()
    .split('\n')
    .slice(1)
    .map((line) => line.split(','))
    .map((c) => [c[0], c[3]]),
);

/** The City's sector of a community (Centre, North, Northeast, …), or '' when unknown. */
export const sectorOf = (code: string): string => SECTORS[code] ?? '';

/** Downtown, inner-city (the City's Centre sector) or suburb. */
export function houseStyleFor(code: string): HouseStyle {
  if (DOWNTOWN.has(code)) return 'downtown';
  return SECTORS[code] === 'Centre' ? 'inner' : 'suburb';
}

/** Share of each house type per community style. */
export const HOUSE_MIX: Record<HouseStyle, [HouseType, number][]> = {
  downtown: [['apartment', 0.55], ['loft', 0.35], ['infill', 0.1]],
  inner: [['bungalow', 0.3], ['infill', 0.25], ['semiDetached', 0.25], ['twoStoreyGarage', 0.1], ['townhouses', 0.1]],
  suburb: [['twoStoreyGarage', 0.45], ['semiDetached', 0.2], ['townhouses', 0.2], ['bungalow', 0.1], ['infill', 0.05]],
};

export function houseTypeFor(style: HouseStyle, seed: number): HouseType {
  const r = rnd(seed, 77);
  let acc = 0;
  for (const [type, share] of HOUSE_MIX[style]) {
    acc += share;
    if (r < acc) return type;
  }
  return HOUSE_MIX[style][0][0];
}

const WINDOWS = new Set<string>([ART.glass, ART.glassDark]);

/**
 * The house model: `facing` 0 = front towards +z, 1 = +x, 2 = −z, 3 = −x. Active-today houses
 * light their windows warm (§7.2).
 */
export function houseParts(type: HouseType, seed: number, facing: number, active: boolean, village = false): BoxPart[] {
  // about half of the village houses light up at night (§7.2); residents' only when active
  const nightTag = village && rnd(seed, 91) < 0.5 ? 'village-window' : 'house-window';
  const parts = houseModel(type, seed).map((b): BoxPart =>
    !WINDOWS.has(b.c) ? b : active ? { ...b, layer: 'glow', c: '#ffd98a' } : { ...b, tag: nightTag },
  );
  return vturn(parts, facing);
}

const top = (parts: BoxPart[]) => parts.reduce((h, b) => Math.max(h, b.p[1] + b.s[1] / 2), 0);

const heights = new Map<HouseType, number>();
/** Height of the type's tallest design in tiles (an upper bound for any house of the type). */
export function houseHeight(type: HouseType): number {
  let h = heights.get(type);
  if (h === undefined) {
    h = 0;
    for (const build of HOUSE_DESIGNS[type]) for (let s = 0; s < 12; s++) h = Math.max(h, top(build(s)));
    heights.set(type, h);
  }
  return h;
}

/** Height of this house's own model in tiles (its label and tap box sit just above it). */
export function houseModelHeight(type: HouseType, seed: number): number {
  return top(houseModel(type, seed));
}
