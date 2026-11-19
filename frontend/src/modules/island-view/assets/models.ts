/**
 * Code-built box models (MVP art, requirement.md §19.0/§19.4).
 * Each builder returns parts in local coordinates around the object's footprint
 * centre at ground level. The Art Pass can replace any of these per asset key.
 */
import type { ObjectOf } from '../layout';
import { ACCENTS, type MoodPalette, type VitalityMood } from '../mood';
import type { BuildingKind } from '../types';
import { asGhost, box, type BoxPart } from './boxes';

export interface BuildCtx {
  palette: MoodPalette;
  mood: VitalityMood;
}

const WALL = '#fbf3e4';
const WOOD = '#a7825f';
const DOOR = '#a77b5a';
const DARK_WINDOW = '#64748b';
const WARM_LIGHT = '#ffd98a';
const SNOW = '#f6f8fb';
const SILHOUETTE = '#c9c3e6';

export function house(item: ObjectOf<'house'>): BoxPart[] {
  const roof = ACCENTS[item.colorIndex % ACCENTS.length];
  const win = item.activeToday ? 'glow' : 'solid';
  const winColour = item.activeToday ? WARM_LIGHT : DARK_WINDOW;
  return [
    box('solid', 0, 0, 0, 0.72, 0.5, 0.72, WALL),
    box('solid', 0, 0.5, 0, 0.86, 0.14, 0.86, roof),
    box('solid', 0, 0.64, 0, 0.62, 0.13, 0.62, roof),
    box('solid', 0, 0.77, 0, 0.34, 0.1, 0.34, roof),
    box('solid', 0.2, 0.6, -0.18, 0.1, 0.34, 0.1, '#c9b8a6'),
    box('solid', 0.13, 0, 0.36, 0.16, 0.28, 0.03, DOOR),
    box(win, -0.16, 0.2, 0.365, 0.16, 0.14, 0.02, winColour),
    box(win, 0.365, 0.2, -0.15, 0.02, 0.14, 0.16, winColour),
    box(win, 0.365, 0.2, 0.15, 0.02, 0.14, 0.16, winColour),
  ];
}

/** Chimney top in local coordinates (smoke starts here). */
export const CHIMNEY_TOP: [number, number, number] = [0.2, 0.94, -0.18];

export function tree(item: ObjectOf<'tree'>, { palette, mood }: BuildCtx): BoxPart[] {
  const leaves = palette.leaves[item.variant % 2];
  const k = mood === 'gloomy' ? 0.85 : 1;
  const parts: BoxPart[] = [box('solid', 0, 0, 0, 0.14, 0.32, 0.14, palette.trunk)];
  let top: number;
  if (item.variant === 0) {
    parts.push(box('solid', 0, 0.3, 0, 0.62 * k, 0.5 * k, 0.62 * k, leaves));
    parts.push(box('solid', 0, 0.3 + 0.5 * k, 0, 0.4 * k, 0.3 * k, 0.4 * k, leaves));
    top = 0.3 + 0.8 * k;
  } else if (item.variant === 1) {
    parts.push(box('solid', 0, 0.3, 0, 0.48 * k, 0.75 * k, 0.48 * k, leaves));
    parts.push(box('solid', 0, 0.3 + 0.75 * k, 0, 0.3 * k, 0.28 * k, 0.3 * k, leaves));
    top = 0.3 + 1.03 * k;
  } else {
    parts.push(box('solid', 0, 0.3, 0, 0.7 * k, 0.55 * k, 0.7 * k, leaves));
    top = 0.3 + 0.55 * k;
  }
  if (mood === 'gloomy') parts.push(box('solid', 0, top, 0, 0.34, 0.07, 0.34, SNOW));
  return parts;
}

export function sign(): BoxPart[] {
  const z = 0.32;
  return [
    box('solid', -0.9, 0, z, 0.12, 1.3, 0.12, WOOD),
    box('solid', 0.9, 0, z, 0.12, 1.3, 0.12, WOOD),
    box('solid', 0, 1.3, z, 2.06, 0.12, 0.16, WOOD),
    box('solid', 0, 0.86, z, 1.5, 0.4, 0.08, '#fff6e3'),
  ];
}

export function lamp(_item: ObjectOf<'lamp'>, { palette }: BuildCtx): BoxPart[] {
  return [
    box('solid', 0, 0, 0, 0.07, 0.85, 0.07, '#5d6470'),
    box(palette.lampsLit ? 'glow' : 'solid', 0, 0.85, 0, 0.16, 0.14, 0.16, palette.lampsLit ? '#ffe7a3' : '#e6e2d6'),
  ];
}

const FLOWER_SPOTS = [
  [-0.25, -0.2],
  [0.2, -0.28],
  [0.05, 0.12],
  [-0.22, 0.26],
  [0.28, 0.22],
] as const;

export function flowers(item: ObjectOf<'flowers'>): BoxPart[] {
  return FLOWER_SPOTS.slice(0, 3 + (item.variant % 3)).map(([x, z], i) =>
    box('solid', x, 0, z, 0.1, 0.12, 0.1, ACCENTS[(item.variant + i) % ACCENTS.length]),
  );
}

export function snowPile(item: ObjectOf<'snow-pile'>): BoxPart[] {
  const dx = item.variant % 2 === 0 ? 0.1 : -0.1;
  return [box('solid', dx, 0, 0, 0.5, 0.15, 0.4, SNOW), box('solid', dx - 0.05, 0.15, 0.03, 0.28, 0.11, 0.22, SNOW)];
}

// --- Unlock buildings (2×2 footprint) ---------------------------------------

function playgroundParts(): BoxPart[] {
  const post = '#e9a46a';
  return [
    box('solid', 0, 0, 0, 1.8, 0.04, 1.8, '#f1dfb6'),
    // swing set
    box('solid', -0.75, 0.04, -0.45, 0.07, 0.9, 0.07, post),
    box('solid', 0.15, 0.04, -0.45, 0.07, 0.9, 0.07, post),
    box('solid', -0.3, 0.94, -0.45, 1.0, 0.07, 0.07, post),
    box('solid', -0.52, 0.42, -0.45, 0.02, 0.52, 0.02, '#8a8f99'),
    box('solid', -0.08, 0.42, -0.45, 0.02, 0.52, 0.02, '#8a8f99'),
    box('solid', -0.52, 0.38, -0.45, 0.2, 0.04, 0.12, ACCENTS[1]),
    box('solid', -0.08, 0.38, -0.45, 0.2, 0.04, 0.12, ACCENTS[2]),
    // slide tower + ramp
    box('solid', 0.5, 0.04, 0.35, 0.42, 0.62, 0.42, ACCENTS[0]),
    box('solid', 0.5, 0.66, 0.35, 0.48, 0.06, 0.48, '#fff6e3'),
    box('solid', 0.5, 0.05, -0.12, 0.3, 0.05, 0.85, ACCENTS[4], [0.62, 0, 0]),
    // seesaw
    box('solid', -0.45, 0.04, 0.45, 0.1, 0.16, 0.1, post),
    box('solid', -0.45, 0.2, 0.45, 0.9, 0.05, 0.12, ACCENTS[3], [0, 0, 0.12]),
  ];
}

function communityCentreParts(): BoxPart[] {
  const roof = '#8ec5ea';
  return [
    box('solid', 0, 0, 0, 1.7, 0.9, 1.4, '#f3e6cf'),
    box('solid', 0, 0.9, 0, 1.9, 0.16, 1.6, roof),
    box('solid', 0, 1.06, 0, 1.4, 0.16, 1.1, roof),
    box('solid', 0, 1.22, 0, 0.8, 0.14, 0.6, roof),
    box('solid', 0, 0, 0.71, 0.34, 0.48, 0.03, DOOR),
    box('solid', 0, 0.56, 0.715, 0.7, 0.2, 0.03, '#fff6e3'),
    ...[-0.6, -0.35, 0.35, 0.6].map((x) => box('glow', x, 0.3, 0.715, 0.16, 0.2, 0.02, WARM_LIGHT)),
    ...[-0.4, 0, 0.4].map((z) => box('glow', 0.855, 0.3, z, 0.02, 0.2, 0.16, WARM_LIGHT)),
    box('solid', -0.7, 1.06, -0.5, 0.04, 0.6, 0.04, '#8a8f99'),
    box('solid', -0.6, 1.46, -0.5, 0.18, 0.12, 0.02, ACCENTS[0]),
  ];
}

function parkParts({ palette }: BuildCtx): BoxPart[] {
  return [
    box('solid', 0, 0, 0, 1.9, 0.05, 1.9, palette.leaves[1]),
    box('solid', 0.35, 0.05, 0.35, 0.8, 0.04, 0.6, '#8ec5ea'),
    box('solid', 0.35, 0.05, 0.35, 0.92, 0.02, 0.72, '#d9cdb5'),
    box('solid', -0.45, 0.05, 0.55, 0.5, 0.06, 0.16, '#b88a64'),
    box('solid', -0.45, 0.11, 0.48, 0.5, 0.16, 0.04, '#b88a64'),
    box('solid', -0.5, 0.05, -0.45, 0.12, 0.3, 0.12, palette.trunk),
    box('solid', -0.5, 0.33, -0.45, 0.56, 0.5, 0.56, palette.leaves[0]),
    box('solid', 0.45, 0.05, -0.5, 0.1, 0.26, 0.1, palette.trunk),
    box('solid', 0.45, 0.29, -0.5, 0.44, 0.6, 0.44, palette.leaves[0]),
    ...[-0.1, 0.1, 0.0].map((x, i) => box('solid', x - 0.1, 0.05, -0.05 + i * 0.12, 0.1, 0.1, 0.1, ACCENTS[i])),
  ];
}

const BUILDINGS: Record<BuildingKind, (ctx: BuildCtx) => BoxPart[]> = {
  playground: playgroundParts,
  'community-centre': communityCentreParts,
  park: parkParts,
};

export const building =
  (kind: BuildingKind) =>
  (_item: unknown, ctx: BuildCtx): BoxPart[] =>
    BUILDINGS[kind](ctx);

export function silhouette(item: ObjectOf<'silhouette'>, ctx: BuildCtx): BoxPart[] {
  return asGhost(BUILDINGS[item.target](ctx), SILHOUETTE);
}

// --- Projects ----------------------------------------------------------------

export function constructionSite(item: ObjectOf<'construction-site'>): BoxPart[] {
  const pole = '#e0a96d';
  const parts: BoxPart[] = [
    box('solid', 0, 0, 0, 1.8, 0.03, 1.8, '#d9c7a5'),
    box('solid', 0, 0.03, 0, 1.3, 0.12, 1.3, '#c9c2b8'),
    box('solid', 0.78, 0.03, 0.78, 0.12, 0.2, 0.12, '#f39a52'),
    box('solid', -0.78, 0.03, 0.78, 0.12, 0.2, 0.12, '#f39a52'),
  ];
  for (const [x, z] of [[-0.62, -0.62], [0.62, -0.62], [-0.62, 0.62], [0.62, 0.62]]) {
    parts.push(box('solid', x, 0.03, z, 0.06, 1.05, 0.06, pole));
  }
  for (const y of [0.5, 1.02]) {
    parts.push(box('solid', 0, y, -0.62, 1.3, 0.05, 0.06, pole));
    parts.push(box('solid', 0, y, 0.62, 1.3, 0.05, 0.06, pole));
    parts.push(box('solid', -0.62, y, 0, 0.06, 0.05, 1.3, pole));
    parts.push(box('solid', 0.62, y, 0, 0.06, 0.05, 1.3, pole));
  }
  if (item.stage === 'frame') {
    const beam = '#b98b5e';
    for (const [x, z] of [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]]) {
      parts.push(box('solid', x, 0.15, z, 0.1, 0.75, 0.1, beam));
    }
    parts.push(box('solid', 0, 0.9, 0, 1.0, 0.08, 1.0, beam));
    parts.push(box('solid', 0, 0.15, -0.45, 0.9, 0.38, 0.06, WALL));
    parts.push(box('solid', -0.45, 0.15, 0, 0.06, 0.38, 0.9, WALL));
  } else {
    parts.push(box('solid', -0.2, 0.15, -0.15, 0.4, 0.14, 0.3, '#c8a27a'));
    parts.push(box('solid', 0.25, 0.15, 0.2, 0.3, 0.2, 0.3, '#b9b2a6'));
  }
  return parts;
}

// --- Showcase miniatures (completed projects, 1×1 tile) -------------------------

const GOLD = '#f2c94c';

/** Small stone pedestal; level 2+ adds one gold marker per extra level (max 4). */
function pedestal(level: number): BoxPart[] {
  const parts: BoxPart[] = [box('solid', 0, 0, 0, 0.86, 0.06, 0.86, '#e9e3d6')];
  const extra = Math.min(Math.max(level - 1, 0), 4);
  for (let i = 0; i < extra; i++) {
    parts.push(box('glow', -0.3 + i * 0.13, 0.06, 0.4, 0.08, 0.08, 0.04, GOLD));
  }
  return parts;
}

type Showcase = { level: number };

export function showcaseIceRink(item: Showcase): BoxPart[] {
  return [
    ...pedestal(item.level),
    box('solid', 0, 0.06, -0.02, 0.7, 0.04, 0.6, '#d4ecf7'),
    box('solid', 0, 0.06, -0.33, 0.74, 0.08, 0.04, '#ffffff'),
    box('solid', 0, 0.06, 0.29, 0.74, 0.08, 0.04, '#ffffff'),
    box('solid', -0.36, 0.06, -0.02, 0.04, 0.08, 0.6, '#ffffff'),
    box('solid', 0.36, 0.06, -0.02, 0.04, 0.08, 0.6, '#ffffff'),
    box('solid', 0.1, 0.1, -0.05, 0.1, 0.16, 0.08, ACCENTS[0]),
    box('solid', 0.1, 0.26, -0.05, 0.08, 0.08, 0.08, '#f5d3b5'),
  ];
}

export function showcaseFlowerPath(item: Showcase, { palette }: BuildCtx): BoxPart[] {
  const parts: BoxPart[] = [...pedestal(item.level), box('solid', 0, 0.06, 0, 0.24, 0.03, 0.8, palette.path[0])];
  [-0.3, -0.1, 0.1, 0.3].forEach((z, i) => {
    parts.push(box('solid', -0.25, 0.06, z, 0.12, 0.14, 0.12, ACCENTS[i % ACCENTS.length]));
    parts.push(box('solid', 0.25, 0.06, z, 0.12, 0.14, 0.12, ACCENTS[(i + 3) % ACCENTS.length]));
  });
  return parts;
}

export function showcaseHolidayDecorations(item: Showcase): BoxPart[] {
  const pine = '#5fae7a';
  return [
    ...pedestal(item.level),
    box('solid', 0, 0.06, 0, 0.1, 0.14, 0.1, '#8a6343'),
    box('solid', 0, 0.2, 0, 0.56, 0.24, 0.56, pine),
    box('solid', 0, 0.44, 0, 0.4, 0.22, 0.4, pine),
    box('solid', 0, 0.66, 0, 0.24, 0.2, 0.24, pine),
    box('glow', 0, 0.86, 0, 0.1, 0.1, 0.1, '#ffe27a'),
    box('glow', 0.28, 0.3, 0.1, 0.06, 0.06, 0.06, '#ff8b8b'),
    box('glow', -0.1, 0.52, 0.2, 0.06, 0.06, 0.06, '#8ec5ea'),
    box('glow', 0.12, 0.7, -0.12, 0.06, 0.06, 0.06, '#b8a9e8'),
    box('solid', 0.3, 0.06, 0.3, 0.14, 0.12, 0.14, ACCENTS[0]),
  ];
}

export function showcaseSnowmanGarden(item: Showcase): BoxPart[] {
  return [
    ...pedestal(item.level),
    box('solid', -0.15, 0.06, 0, 0.34, 0.3, 0.34, SNOW),
    box('solid', -0.15, 0.36, 0, 0.24, 0.22, 0.24, SNOW),
    box('solid', -0.15, 0.4, 0.125, 0.05, 0.05, 0.08, '#f39a52'),
    box('solid', -0.15, 0.58, 0, 0.2, 0.06, 0.2, '#3f4a5c'),
    box('solid', -0.15, 0.32, 0, 0.27, 0.05, 0.27, ACCENTS[0]),
    box('solid', 0.22, 0.06, 0.15, 0.2, 0.18, 0.2, SNOW),
    box('solid', 0.22, 0.24, 0.15, 0.14, 0.13, 0.14, SNOW),
    box('solid', 0.22, 0.37, 0.15, 0.12, 0.04, 0.12, ACCENTS[2]),
  ];
}

export function showcaseLanternStreet(item: Showcase): BoxPart[] {
  const parts: BoxPart[] = [...pedestal(item.level)];
  for (const [x, z] of [[-0.25, -0.25], [0.25, 0.25]] as const) {
    parts.push(box('solid', x, 0.06, z, 0.06, 0.55, 0.06, '#5d6470'));
    parts.push(box('glow', x, 0.6, z, 0.16, 0.16, 0.16, '#ffd98a'));
    parts.push(box('solid', x, 0.76, z, 0.2, 0.04, 0.2, '#5d6470'));
  }
  parts.push(box('solid', 0, 0.62, 0, 0.62, 0.02, 0.02, '#8a8f99', [0, Math.PI / 4, 0]));
  [-0.12, 0, 0.12].forEach((d, i) => parts.push(box('glow', d, 0.56, d, 0.05, 0.05, 0.05, ACCENTS[i])));
  return parts;
}

export function showcaseBirdFeeders(item: Showcase, { palette }: BuildCtx): BoxPart[] {
  return [
    ...pedestal(item.level),
    box('solid', 0, 0.06, 0, 0.08, 0.5, 0.08, palette.trunk),
    box('solid', 0, 0.56, 0, 0.3, 0.18, 0.24, '#d9a066'),
    box('solid', 0, 0.74, 0, 0.38, 0.06, 0.32, ACCENTS[0]),
    box('solid', 0, 0.62, 0.125, 0.08, 0.08, 0.02, '#3f4a5c'),
    box('solid', 0.18, 0.5, 0.05, 0.12, 0.03, 0.04, '#b88a64'),
    box('solid', 0.22, 0.53, 0.05, 0.07, 0.07, 0.07, ACCENTS[2]),
    box('solid', -0.24, 0.06, 0.25, 0.08, 0.08, 0.08, ACCENTS[4]),
  ];
}
