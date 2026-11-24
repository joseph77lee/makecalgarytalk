/**
 * House generator (M19, requirement.md v1.38 §7.2, §19): every resident's house gets a type that
 * fits the community (downtown: apartments and lofts; inner-city: bungalows, infills, duplexes;
 * suburbs: two-storey homes with garages, townhouses), colours from the warm pastel palette, and
 * faces the nearest path. Deterministic from the house id, so a house never changes.
 */
import communitiesCsv from '../../../../../../supabase/data/calgary_communities.csv?raw';
import type { BoxPart } from '../boxes';
import { apartment, ART, bungalow, infill, loft, semiDetached, townhouses, twoStoreyGarage } from './samples';
import { rnd, vturn } from './voxel';

export const HOUSE_TYPES = ['bungalow', 'twoStoreyGarage', 'semiDetached', 'townhouses', 'infill', 'apartment', 'loft'] as const;
export type HouseType = (typeof HOUSE_TYPES)[number];
export type HouseStyle = 'downtown' | 'inner' | 'suburb';

const BUILDERS: Record<HouseType, (seed: number) => BoxPart[]> = {
  bungalow,
  twoStoreyGarage,
  semiDetached,
  townhouses,
  infill,
  apartment,
  loft,
};

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
export function houseParts(type: HouseType, seed: number, facing: number, active: boolean): BoxPart[] {
  const parts = BUILDERS[type](seed).map((b) => (active && WINDOWS.has(b.c) ? { ...b, layer: 'glow' as const, c: '#ffd98a' } : b));
  return vturn(parts, facing);
}

const heights = new Map<HouseType, number>();
/** Height of the type's tallest variant in tiles (labels and tap boxes sit above it). */
export function houseHeight(type: HouseType): number {
  let h = heights.get(type);
  if (h === undefined) {
    h = 0;
    for (let s = 0; s < 12; s++) for (const b of BUILDERS[type](s)) h = Math.max(h, b.p[1] + b.s[1] / 2);
    heights.set(type, h);
  }
  return h;
}
