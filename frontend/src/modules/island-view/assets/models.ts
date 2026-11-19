/**
 * Code-built box models (MVP art, requirement.md §19.0/§19.4).
 * Each builder returns parts in local coordinates around the object's footprint centre at
 * ground level. Building models fit their lot (w × d tiles). The Art Pass can replace any
 * of them per asset key without touching game logic (§20.4).
 */
import type { BuildingObject, ObjectOf } from '../layout';
import { ACCENTS, type MoodPalette, type VitalityMood } from '../mood';
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
const ICE = '#d4ecf7';
const STONE = '#c9c2b8';
const GOLD = '#f2c94c';
const SILHOUETTE = '#c9c3e6';

/** Scale parts made for a 2×2 lot to another footprint. */
function fit(parts: BoxPart[], w: number, d: number): BoxPart[] {
  const sx = w / 2;
  const sz = d / 2;
  const sy = Math.min(sx, sz);
  return parts.map((b) => ({ ...b, p: [b.p[0] * sx, b.p[1] * sy, b.p[2] * sz], s: [b.s[0] * sx, b.s[1] * sy, b.s[2] * sz] }));
}

/** Upgrades (level 2+) add one gold marker per level at the front corner (max 4). */
function levelMarkers(level: number, w: number, d: number): BoxPart[] {
  const extra = Math.min(Math.max(level - 1, 0), 4);
  return Array.from({ length: extra }, (_, i) => box('glow', w / 2 - 0.15 - i * 0.14, 0, d / 2 - 0.12, 0.09, 0.22, 0.09, GOLD));
}

// --- Small things ----------------------------------------------------------------

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

export function lamp(): BoxPart[] {
  return [box('solid', 0.38, 0, 0.38, 0.07, 0.85, 0.07, '#5d6470'), box('glow', 0.38, 0.85, 0.38, 0.16, 0.14, 0.16, '#ffe7a3')];
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

// --- Lots without a building ---------------------------------------------------------

/** A reserved plot: corner stakes with little flags (orange: future building, blue: Main Street). */
export function reservedPlot(item: ObjectOf<'reserved-plot'>): BoxPart[] {
  const flag = item.lotKind === 'main-street' ? '#8ec5ea' : '#f39a52';
  const hx = item.w / 2 - 0.12;
  const hz = item.d / 2 - 0.12;
  const parts: BoxPart[] = [];
  for (const [x, z] of [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz]]) {
    parts.push(box('solid', x, 0, z, 0.06, 0.32, 0.06, WOOD));
    parts.push(box('solid', x + 0.06, 0.24, z, 0.1, 0.07, 0.02, flag));
  }
  return parts;
}

export function constructionSite(item: ObjectOf<'construction-site'>): BoxPart[] {
  const { w, d } = item;
  const pole = '#e0a96d';
  const hx = w / 2 - 0.35;
  const hz = d / 2 - 0.35;
  const parts: BoxPart[] = [
    box('solid', 0, 0, 0, w - 0.2, 0.03, d - 0.2, '#d9c7a5'),
    box('solid', 0, 0.03, 0, w - 0.7, 0.12, d - 0.7, STONE),
    box('solid', w / 2 - 0.22, 0.03, d / 2 - 0.22, 0.12, 0.2, 0.12, '#f39a52'),
  ];
  for (const [x, z] of [[-hx, -hz], [hx, -hz], [-hx, hz], [hx, hz]]) parts.push(box('solid', x, 0.03, z, 0.06, 1.05, 0.06, pole));
  for (const y of [0.5, 1.02]) {
    parts.push(box('solid', 0, y, -hz, hx * 2, 0.05, 0.06, pole), box('solid', 0, y, hz, hx * 2, 0.05, 0.06, pole));
    parts.push(box('solid', -hx, y, 0, 0.06, 0.05, hz * 2, pole), box('solid', hx, y, 0, 0.06, 0.05, hz * 2, pole));
  }
  if (item.progress >= 0.5) {
    const beam = '#b98b5e';
    const ix = hx - 0.17;
    const iz = hz - 0.17;
    for (const [x, z] of [[-ix, -iz], [ix, -iz], [-ix, iz], [ix, iz]]) parts.push(box('solid', x, 0.15, z, 0.1, 0.75, 0.1, beam));
    parts.push(box('solid', 0, 0.9, 0, ix * 2 + 0.1, 0.08, iz * 2 + 0.1, beam));
    parts.push(box('solid', 0, 0.15, -iz, ix * 2, 0.38, 0.06, WALL));
  } else {
    parts.push(box('solid', -0.2, 0.15, -0.15, 0.4, 0.14, 0.3, '#c8a27a'), box('solid', 0.25, 0.15, 0.2, 0.3, 0.2, 0.3, '#b9b2a6'));
  }
  return parts;
}

// --- Buildings of the tree -------------------------------------------------------------

type Spec = { w: number; d: number; level: number };
type Builder = (s: Spec, ctx: BuildCtx) => BoxPart[];

const welcomeSign: Builder = () => [
  box('solid', -0.38, 0, 0.3, 0.08, 0.95, 0.08, WOOD),
  box('solid', 0.38, 0, 0.3, 0.08, 0.95, 0.08, WOOD),
  box('solid', 0, 0.55, 0.3, 0.9, 0.36, 0.07, '#fff6e3'),
  box('solid', 0, 0.91, 0.3, 0.98, 0.07, 0.1, WOOD),
];

const gatewayArch: Builder = () => [
  box('solid', -0.42, 0, 0.3, 0.14, 1.45, 0.14, '#8a6a52'),
  box('solid', 0.42, 0, 0.3, 0.14, 1.45, 0.14, '#8a6a52'),
  box('solid', 0, 1.45, 0.3, 1.12, 0.14, 0.2, '#8a6a52'),
  box('solid', 0, 1.0, 0.3, 0.8, 0.32, 0.08, '#fff6e3'),
  box('glow', -0.42, 1.59, 0.3, 0.12, 0.12, 0.12, WARM_LIGHT),
  box('glow', 0.42, 1.59, 0.3, 0.12, 0.12, 0.12, WARM_LIGHT),
];

const firePit: Builder = ({ w, d }) => {
  const parts: BoxPart[] = [box('solid', 0, 0, 0, w - 0.6, 0.03, d - 0.6, '#d9cdb5')];
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2;
    parts.push(box('solid', Math.cos(a) * 0.38, 0.03, Math.sin(a) * 0.38, 0.16, 0.12, 0.16, STONE));
  }
  parts.push(box('solid', 0, 0.05, 0, 0.36, 0.08, 0.1, '#8a6343', [0, 0.6, 0]), box('solid', 0, 0.05, 0, 0.36, 0.08, 0.1, '#8a6343', [0, -0.6, 0]));
  parts.push(box('glow', 0, 0.12, 0, 0.22, 0.24, 0.22, '#ffb054'), box('glow', 0, 0.3, 0, 0.12, 0.16, 0.12, '#ffe27a'));
  for (const [x, z, r] of [[-0.95, 0, 0], [0.95, 0, 0], [0, -0.95, Math.PI / 2]] as const) {
    parts.push(box('solid', x, 0, z, 0.24, 0.16, 0.8, WOOD, [0, r, 0]));
  }
  return parts;
};

const warmingHut: Builder = ({ w, d }) => [
  box('solid', 0, 0, 0, w - 0.5, 0.03, d - 0.5, '#d9cdb5'),
  box('solid', -0.2, 0, -0.2, 1.5, 0.75, 1.3, '#c7926b'),
  box('solid', -0.2, 0.75, -0.2, 1.7, 0.16, 1.5, '#8f5f45'),
  box('solid', -0.2, 0.91, -0.2, 1.2, 0.16, 1.0, '#8f5f45'),
  box('solid', 0.25, 0.85, -0.5, 0.16, 0.5, 0.16, STONE),
  box('solid', 0.1, 0, 0.46, 0.28, 0.45, 0.03, DOOR),
  box('glow', -0.45, 0.3, 0.46, 0.22, 0.18, 0.02, WARM_LIGHT),
  box('glow', 0.56, 0.3, -0.2, 0.02, 0.18, 0.24, WARM_LIGHT),
  // community board beside the hut
  box('solid', 0.95, 0, 0.95, 0.06, 0.7, 0.06, WOOD),
  box('solid', 1.21, 0, 0.95, 0.06, 0.7, 0.06, WOOD),
  box('solid', 1.08, 0.38, 0.95, 0.42, 0.3, 0.05, '#fff6e3'),
];

const communityHall: Builder = ({ w, d }) => {
  const roof = '#8ec5ea';
  const base: BoxPart[] = [
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
  return fit(base, w, d);
};

const frozenPond: Builder = ({ w, d }) => [
  box('solid', 0, 0, 0, w - 0.3, 0.05, d - 0.3, SNOW),
  box('solid', 0, 0.01, 0, w - 0.7, 0.06, d - 0.6, ICE),
  box('solid', 0.3, 0.02, -0.1, w - 1.4, 0.06, d - 0.4, ICE),
  box('solid', -0.6, 0.07, 0.1, 0.5, 0.01, 0.04, '#b3d8ec'),
  box('solid', 0.5, 0.07, -0.2, 0.04, 0.01, 0.4, '#b3d8ec'),
];

function rink({ w, d }: Spec, extra: BoxPart[]): BoxPart[] {
  const iw = w - 0.4;
  const id = d - 0.4;
  return [
    box('solid', 0, 0, 0, iw, 0.05, id, ICE),
    box('solid', 0, 0, -id / 2, iw + 0.1, 0.14, 0.06, '#ffffff'),
    box('solid', 0, 0, id / 2, iw + 0.1, 0.14, 0.06, '#ffffff'),
    box('solid', -iw / 2, 0, 0, 0.06, 0.14, id, '#ffffff'),
    box('solid', iw / 2, 0, 0, 0.06, 0.14, id, '#ffffff'),
    box('solid', -0.4, 0.05, 0.1, 0.6, 0.01, 0.04, '#b3d8ec'),
    ...extra,
  ];
}

const skatingRink: Builder = (s) => rink(s, []);

const hockeyRink: Builder = (s) => {
  const iw = s.w - 0.4;
  const id = s.d - 0.4;
  return rink(s, [
    box('solid', 0, 0.05, 0, 0.04, 0.01, id - 0.1, '#e57373'),
    box('solid', -iw / 2 + 0.25, 0.05, 0, 0.12, 0.2, 0.36, '#e57373'),
    box('solid', iw / 2 - 0.25, 0.05, 0, 0.12, 0.2, 0.36, '#e57373'),
    ...[[-iw / 2, -id / 2], [iw / 2, -id / 2], [-iw / 2, id / 2], [iw / 2, id / 2]].flatMap(([x, z]) => [
      box('solid', x, 0.14, z, 0.05, 0.85, 0.05, '#5d6470'),
      box('glow', x, 0.99, z, 0.14, 0.1, 0.14, '#ffe7a3'),
    ]),
    box('solid', 0, 0, id / 2 + 0.12, iw * 0.6, 0.18, 0.16, '#9aa5b1'),
  ]);
};

const playground: Builder = ({ w, d }) => {
  const post = '#e9a46a';
  return fit(
    [
      box('solid', 0, 0, 0, 1.8, 0.04, 1.8, '#f1dfb6'),
      box('solid', -0.75, 0.04, -0.45, 0.07, 0.9, 0.07, post),
      box('solid', 0.15, 0.04, -0.45, 0.07, 0.9, 0.07, post),
      box('solid', -0.3, 0.94, -0.45, 1.0, 0.07, 0.07, post),
      box('solid', -0.52, 0.42, -0.45, 0.02, 0.52, 0.02, '#8a8f99'),
      box('solid', -0.08, 0.42, -0.45, 0.02, 0.52, 0.02, '#8a8f99'),
      box('solid', -0.52, 0.38, -0.45, 0.2, 0.04, 0.12, ACCENTS[1]),
      box('solid', -0.08, 0.38, -0.45, 0.2, 0.04, 0.12, ACCENTS[2]),
      box('solid', 0.5, 0.04, 0.35, 0.42, 0.62, 0.42, ACCENTS[0]),
      box('solid', 0.5, 0.66, 0.35, 0.48, 0.06, 0.48, '#fff6e3'),
      box('solid', 0.5, 0.05, -0.12, 0.3, 0.05, 0.85, ACCENTS[4], [0.62, 0, 0]),
      box('solid', -0.45, 0.04, 0.45, 0.1, 0.16, 0.1, post),
      box('solid', -0.45, 0.2, 0.45, 0.9, 0.05, 0.12, ACCENTS[3], [0, 0, 0.12]),
    ],
    w,
    d,
  );
};

const sleddingHill: Builder = ({ w, d }) =>
  fit(
    [
      box('solid', 0, 0, 0, 1.8, 0.2, 1.8, SNOW),
      box('solid', -0.2, 0.2, -0.2, 1.3, 0.2, 1.3, SNOW),
      box('solid', -0.4, 0.4, -0.4, 0.8, 0.2, 0.8, SNOW),
      box('solid', -0.5, 0.6, -0.5, 0.4, 0.14, 0.4, SNOW),
      box('solid', 0.55, 0.2, 0.5, 0.22, 0.05, 0.36, '#e57373'),
      box('solid', 0.55, 0.25, 0.5, 0.12, 0.16, 0.1, ACCENTS[2]),
      box('solid', 0.55, 0.41, 0.5, 0.1, 0.1, 0.1, '#f5d3b5'),
    ],
    w,
    d,
  );

const dogPark: Builder = ({ w, d }, { palette }) => {
  const hx = w / 2 - 0.08;
  const hz = d / 2 - 0.08;
  return [
    box('solid', 0, 0, 0, w - 0.1, 0.03, d - 0.1, palette.grass[0]),
    box('solid', 0, 0, -hz, w - 0.1, 0.22, 0.04, WOOD),
    box('solid', -hx, 0, 0, 0.04, 0.22, d - 0.1, WOOD),
    box('solid', hx, 0, 0, 0.04, 0.22, d - 0.1, WOOD),
    box('solid', -0.35, 0, d / 2 - 0.08, w - 1.0, 0.22, 0.04, WOOD),
    box('solid', -0.45, 0.03, -0.45, 0.4, 0.3, 0.36, '#d9a066'),
    box('solid', -0.45, 0.33, -0.45, 0.46, 0.1, 0.42, ACCENTS[0]),
    box('solid', 0.3, 0.03, 0.2, 0.26, 0.12, 0.1, '#8a6343'),
    box('solid', 0.45, 0.07, 0.2, 0.1, 0.1, 0.1, '#8a6343'),
    box('solid', -0.1, 0.03, 0.5, 0.22, 0.1, 0.09, '#f5f0e6'),
    box('solid', 0.02, 0.06, 0.5, 0.08, 0.08, 0.08, '#f5f0e6'),
    box('solid', 0.5, 0.03, -0.5, 0.1, 0.08, 0.1, '#f2c94c'),
  ];
};

const communityGarden: Builder = ({ w, d }, { palette }) => {
  const parts: BoxPart[] = [box('solid', 0, 0, 0, w - 0.2, 0.03, d - 0.2, palette.path[0])];
  const beds = [[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]];
  beds.forEach(([x, z], i) => {
    parts.push(box('solid', x, 0.03, z, 0.7, 0.12, 0.7, WOOD), box('solid', x, 0.15, z, 0.6, 0.03, 0.6, '#7a5a3c'));
    for (const dx of [-0.17, 0.17]) parts.push(box('solid', x + dx, 0.18, z, 0.14, 0.14, 0.5, i % 2 ? '#7cc46a' : ACCENTS[(i + 4) % ACCENTS.length]));
  });
  return parts;
};

const neighbourhoodPark: Builder = ({ w, d }, { palette }) =>
  fit(
    [
      box('solid', 0, 0, 0, 1.9, 0.05, 1.9, palette.leaves[1]),
      box('solid', 0.35, 0.05, 0.35, 0.8, 0.04, 0.6, '#8ec5ea'),
      box('solid', 0.35, 0.05, 0.35, 0.92, 0.02, 0.72, '#d9cdb5'),
      box('solid', -0.45, 0.05, 0.55, 0.5, 0.06, 0.16, '#b88a64'),
      box('solid', -0.45, 0.11, 0.48, 0.5, 0.16, 0.04, '#b88a64'),
      box('solid', -0.5, 0.05, -0.45, 0.12, 0.3, 0.12, palette.trunk),
      box('solid', -0.5, 0.33, -0.45, 0.56, 0.5, 0.56, palette.leaves[0]),
      box('solid', 0.45, 0.05, -0.5, 0.1, 0.26, 0.1, palette.trunk),
      box('solid', 0.45, 0.29, -0.5, 0.44, 0.6, 0.44, palette.leaves[0]),
      box('solid', 0.0, 0.05, -0.1, 0.5, 0.04, 0.4, '#f4978e'),
      ...[-0.1, 0.1, 0.0].map((x, i) => box('solid', x - 0.1, 0.05, -0.05 + i * 0.12, 0.1, 0.1, 0.1, ACCENTS[i])),
    ],
    w,
    d,
  );

/** Generic model for buildings the client does not know yet (requirement.md §7.6b, §20.4). */
const placeholder: Builder = ({ w, d }) => [
  box('solid', 0, 0, 0, w - 0.3, 0.03, d - 0.3, '#d9cdb5'),
  box('solid', 0, 0, 0, Math.min(1.2, w - 0.6), 0.7, Math.min(1.2, d - 0.6), '#e7dcc8'),
  box('solid', 0, 0.7, 0, Math.min(1.4, w - 0.4), 0.14, Math.min(1.4, d - 0.4), '#b8a9e8'),
  box('solid', 0, 0.3, Math.min(1.2, d - 0.6) / 2 + 0.01, 0.5, 0.22, 0.03, '#fff6e3'),
];

export const BUILDING_MODELS: Record<string, Builder> = {
  'welcome-sign': welcomeSign,
  'gateway-arch': gatewayArch,
  'fire-pit': firePit,
  'warming-hut': warmingHut,
  'community-hall': communityHall,
  'frozen-pond': frozenPond,
  'skating-rink': skatingRink,
  'hockey-rink': hockeyRink,
  playground,
  'sledding-hill': sleddingHill,
  'dog-park': dogPark,
  'community-garden': communityGarden,
  'neighbourhood-park': neighbourhoodPark,
};

/** A built building of the tree (placeholder for unknown keys), with upgrade markers. */
export function building(item: BuildingObject, ctx: BuildCtx): BoxPart[] {
  const make = BUILDING_MODELS[item.buildingKey] ?? placeholder;
  return [...make(item, ctx), ...levelMarkers(item.level, item.w, item.d)];
}

/** A locked (or ready) building: its model as a translucent ghost on its lot. */
export function silhouette(item: ObjectOf<'silhouette'>, ctx: BuildCtx): BoxPart[] {
  const make = BUILDING_MODELS[item.buildingKey] ?? placeholder;
  return asGhost(make({ w: item.w, d: item.d, level: 1 }, ctx), SILHOUETTE);
}
