/**
 * Unique landmarks of the priority communities (community-identity build map, 2026-11-26), first
 * batch. Voxel reinterpretations of the real places' shapes, colours and materials, drawn from the
 * operator's reference photos: no logos, sign text or business names. Each replaces its persona's
 * pattern landmark as the last step of that community's track. Voxels (12 per tile), front +z, centred.
 */
import { asSway, type BoxPart } from '../boxes';
import { bench, fence, flowerBed, IRON, LAMP, lamp, PAVING, smallTree, STONE, WOOD, WOOD_DARK } from './placeParts';
import { ART } from './samples';
import { hipRoof, pick, rnd, shade, vb, windowZ } from './voxel';

const G = ART.glass;
const WHITE = '#f4f1ea';

/** 3 × 5 pixel digits for stone numerals. */
const DIGITS: Record<string, string[]> = {
  '1': ['.#.', '##.', '.#.', '.#.', '###'],
  '3': ['##.', '..#', '.#.', '..#', '##.'],
  '5': ['###', '#..', '##.', '..#', '##.'],
  '7': ['###', '..#', '.#.', '.#.', '.#.'],
};

/**
 * SIG — stone numbers on the hillside (4 × 3 tiles): a grassy slope rising to the back, regiment
 * numbers laid out in white stones, a zig-zag path up with lamps, a flagpole and a bench on top.
 */
export function signalHillStones(seed: number): BoxPart[] {
  const parts: BoxPart[] = [];
  const h = (z: number) => Math.max(0, Math.min(8, (8 - z) / 3));
  for (let z = -18; z < 18; z += 2) parts.push(vb(-24, 0, z, 24, h(z + 1) + 0.3, z + 2, ((z + 18) / 2) % 2 ? '#a6cf7c' : '#9fc874'));
  const numeral = (text: string, x0: number, z0: number) =>
    [...text].forEach((ch, i) => {
      if (ch === ' ') return;
      DIGITS[ch].forEach((row, r) =>
        [...row].forEach((c, k) => {
          if (c !== '#') return;
          const x = x0 + i * 5.6 + k * 1.5;
          const z = z0 + r * 1.5;
          parts.push(vb(x, h(z + 0.7) + 0.3, z, x + 1.3, h(z + 0.7) + 0.75, z + 1.3, shade(WHITE, (rnd(seed, x, z) - 0.5) * 0.08)));
        }),
      );
    });
  numeral('113  51', -21, -12);
  numeral('151 137', -20, 0);
  // the path zig-zags up the right side with lamps
  const path: [number, number][] = [[14, 17], [14, 9], [20, 9], [20, 1], [14, 1], [14, -7], [20, -7], [20, -15]];
  for (let i = 0; i < path.length - 1; i++) {
    const [ax, az] = path[i];
    const [bx, bz] = path[i + 1];
    for (let t = 0; t <= 1; t += 0.1) {
      const x = ax + (bx - ax) * t;
      const z = az + (bz - az) * t;
      parts.push(vb(x - 1, h(z) + 0.3, z - 1, x + 1, h(z) + 0.4, z + 1, '#d6cdb8'));
    }
  }
  for (const [x, z] of [[16.5, 9], [16.5, -7]]) parts.push(...lamp(x, z, 8).map((b) => ({ ...b, p: [b.p[0], b.p[1] + (h(z) + 0.3) / 12, b.p[2]] as [number, number, number] })));
  // flagpole and bench on the top
  const top = h(-16) + 0.3;
  parts.push(vb(8, top, -16, 8.4, top + 18, -15.6, '#9aa1ab'), ...asSway([vb(8.4, top + 14.5, -15.9, 12.4, top + 17.4, -15.7, '#e0453c'), vb(9.6, top + 15.2, -15.95, 11.2, top + 16.7, -15.65, '#ffffff')]));
  parts.push(...bench(0, -16).map((b) => ({ ...b, p: [b.p[0], b.p[1] + top / 12, b.p[2]] as [number, number, number] })));
  parts.push(vb(-23, 0.3, 14, -18, 3.4, 15, WOOD_DARK), vb(-22.6, 1.4, 15, -18.4, 3.2, 15.1, '#e9dccb'));
  return parts;
}

/** A sitting stone lion facing +x (about 4 voxels long). */
function lion(x: number, y: number, z: number, dir: 1 | -1): BoxPart[] {
  const c = '#b9b2a6';
  const m = shade(c, -0.12);
  return [
    vb(x - 2, y, z - 1.2, x + 2, y + 1.2, z + 1.2, shade(c, -0.05)),
    vb(x - 1.6 * dir, y + 1.2, z - 1, x + 0.4 * dir, y + 2.6, z + 1, c),
    vb(x + 0.2 * dir, y + 1.2, z - 1.5, x + 2.2 * dir, y + 4.4, z + 1.5, m),
    vb(x + 1.4 * dir, y + 2, z - 0.8, x + 2.8 * dir, y + 3.6, z + 0.8, c),
  ];
}

/**
 * CRE — lion arch bridge (5 × 1 tiles, spanning along x): a pale concrete bridge on three arches,
 * a balustrade on both sides, globe lamps, and at each end a kiosk with an arch and a stone lion on top.
 */
export function lionArchBridge(_seed: number): BoxPart[] {
  const parts: BoxPart[] = [];
  const C = '#e2ddd2';
  parts.push(vb(-30, 6, -5, 30, 7.4, 5, C));
  for (const s of [-1, 1]) {
    parts.push(vb(-30, 7.4, s * 4.6 - 0.4, 30, 8, s * 4.6 + 0.4, C), vb(-30, 10, s * 4.6 - 0.5, 30, 10.6, s * 4.6 + 0.5, C));
    for (let x = -29; x < 29.4; x += 1.2) parts.push(vb(x, 8, s * 4.6 - 0.3, x + 0.6, 10, s * 4.6 + 0.3, shade(C, -0.05)));
  }
  // arches: piers and stepped arch rings under the deck
  for (const px of [-22, 0, 22]) parts.push(vb(px - 2, -4, -4.5, px + 2, 6, 4.5, shade(C, -0.06)));
  for (const [a, b] of [[-20, -2], [2, 20]]) {
    const mid = (a + b) / 2;
    const half = (b - a) / 2;
    for (let x = a; x < b; x += 1) {
      const t = (x + 0.5 - mid) / half;
      const y = 6 - Math.sqrt(Math.max(0, 1 - t * t)) * 5;
      parts.push(vb(x, y, -4.5, x + 1, 6, -3.5, shade(C, -0.04)), vb(x, y, 3.5, x + 1, 6, 4.5, shade(C, -0.04)));
    }
  }
  // kiosks at both ends with an arch through them and a lion on top
  for (const s of [-1, 1] as const) {
    const x = s * 26;
    parts.push(vb(x - 3.5, 7.4, -6, x + 3.5, 17, -2.5, C), vb(x - 3.5, 7.4, 2.5, x + 3.5, 17, 6, C), vb(x - 3.5, 13, -6, x + 3.5, 17, 6, C));
    parts.push(vb(x - 3.8, 17, -6, x + 3.8, 18, 6, shade(C, -0.08)), vb(x - 2.5, 18, -2.5, x + 2.5, 19, 2.5, shade(C, -0.12)));
    parts.push(...lion(x, 19, 0, s === 1 ? -1 : 1));
  }
  // globe lamps along the rails
  for (const x of [-15, -6, 6, 15]) for (const z of [-4.6, 4.6]) parts.push(vb(x - 0.2, 10.6, z - 0.2, x + 0.2, 14, z + 0.2, IRON), vb(x - 0.9, 14, z - 0.9, x + 0.9, 15.6, z + 0.9, LAMP, 'glow'));
  return parts;
}

/**
 * EAU — red spiral footbridge (5 × 1 tiles, along x): a deck wrapped in a helix of red steel ribs,
 * glass parapets and a lit strip along the deck.
 */
export function redSpiralBridge(_seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-30, 2, -4, 30, 3, 4, '#d6d0c4')];
  for (const s of [-1, 1]) parts.push(vb(-30, 3, s * 3.8 - 0.2, 30, 5, s * 3.8 + 0.2, '#c8e6f4'));
  const RED = '#d0332f';
  // three ribs wound around the deck in opposite pairs, so they cross like the real lattice
  for (let x = -29.4; x < 29.4; x += 0.35)
    for (let k = 0; k < 4; k++) {
      const dir = k < 2 ? 1 : -1;
      const a = dir * x * 0.26 + (k % 2) * Math.PI;
      const y = 6.5 + Math.sin(a) * 5.2;
      const z = Math.cos(a) * 5.2;
      if (y < 2.6) continue;
      parts.push(vb(x - 0.5, y - 0.5, z - 0.5, x + 0.5, y + 0.5, z + 0.5, dir > 0 ? RED : shade(RED, -0.12)));
    }
  // top chords that tie the ribs together
  for (const z of [-2.6, 2.6]) parts.push(vb(-29.4, 10.6, z - 0.4, 29.4, 11.2, z + 0.4, shade(RED, -0.05)));
  for (const s of [-1, 1]) parts.push(vb(s * 30 - (s > 0 ? 3 : -3) - 1.5, -3, -5.5, s * 30 - (s > 0 ? 3 : -3) + 1.5, 2, 5.5, '#bfb8aa'));
  parts.push(vb(-29, 3, -0.3, 29, 3.15, 0.3, LAMP, 'glow'));
  return parts;
}

/**
 * WSP — ski jump tower (3 × 5 tiles): a tall white tower with a wider top cabin and antennas, the
 * in-run ramp sloping down on trusses to a take-off, a grassy landing hill and golden aspens.
 */
export function skiJumpTower(seed: number): BoxPart[] {
  const parts: BoxPart[] = [];
  // hillside: higher at the back
  for (let z = -30; z < 30; z += 2) {
    const h = Math.max(0, (12 - z) / 4);
    parts.push(vb(-18, 0, z, 18, h + 0.3, z + 2, ((z + 30) / 2) % 2 ? '#a6c870' : '#9cc068'));
  }
  const ground = (z: number) => Math.max(0, (12 - z) / 4) + 0.3;
  // the tower
  const tx = 8;
  const tz = -20;
  parts.push(vb(tx - 4, ground(tz), tz - 4, tx + 4, 62, tz + 4, '#eeeae2'));
  for (let y = 18; y < 60; y += 6) parts.push(...windowZ(tx - 2, tx + 2, y, y + 2, tz + 4, G));
  parts.push(vb(tx - 6, 56, tz - 5, tx + 6, 66, tz + 5, WHITE), vb(tx - 6, 59, tz + 5, tx + 6, 63, tz + 5.3, G), vb(tx - 6.4, 66, tz - 5.4, tx + 6.4, 67, tz + 5.4, '#9aa1ab'));
  parts.push(vb(tx - 1, 67, tz - 1, tx - 0.5, 76, tz - 0.5, '#9aa1ab'), vb(tx + 2, 67, tz + 1, tx + 2.4, 72, tz + 1.4, '#9aa1ab'), vb(tx - 1.2, 76, tz - 1.2, tx - 0.3, 77, tz - 0.3, '#ff6b5b', 'glow'));
  parts.push(vb(tx - 5, 61, tz + 5, tx + 5, 61.6, tz + 5.4, LAMP, 'glow'));
  // the in-run: a ramp from the tower top down towards the front, on trusses
  for (let i = 0; i < 26; i++) {
    const z = tz + 4 + i * 1.3;
    const y = 58 - i * 1.9;
    parts.push(vb(-4, y, z, 0, y + 1.4, z + 1.3, '#e8e4dc'), vb(-4.2, y + 1.4, z, -3.8, y + 2.6, z + 1.3, '#c9c2b4'), vb(-0.2, y + 1.4, z, 0.2, y + 2.6, z + 1.3, '#c9c2b4'));
    if (i % 5 === 2) parts.push(vb(-2.6, ground(z), z, -1.4, y, z + 1, '#d6d0c4'));
  }
  // landing hill: a smooth white-lined slope out to the front
  for (let z = 14; z < 30; z += 2) parts.push(vb(-5, ground(z + 1), z, 1, ground(z + 1) + 0.15, z + 2, '#dfe9d2'));
  // golden aspens on the hillside
  for (let i = 0; i < 14; i++) {
    const x = -16 + rnd(seed, i, 1) * 32;
    const z = -28 + rnd(seed, i, 2) * 56;
    if (x > -7 && x < 14 && z < 28) continue;
    const leaf = pick(['#f2c14e', '#e9a93a', '#8cc867'], rnd(seed, i, 3));
    parts.push(vb(x - 0.4, ground(z), z - 0.4, x + 0.4, ground(z) + 4, z + 0.4, '#e9e4d6'), ...asSway([vb(x - 1.8, ground(z) + 3, z - 1.8, x + 1.8, ground(z) + 7, z + 1.8, leaf)]));
  }
  return parts;
}

/**
 * DNE — curved library (4 × 3 tiles): a long low building with rounded ends, a white facade broken
 * by an offset pattern of glass cells, a warm wooden arch over the entrance and a plaza in front.
 */
export function curvedLibrary(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-24, 0, -18, 24, 0.3, 18, PAVING)];
  const half = (z: number) => 19 - Math.max(0, Math.abs(z + 4) - 5) ** 2 / 6;
  for (let z = -14; z < 6; z += 1) {
    const w = half(z + 0.5);
    parts.push(vb(-w, 0.3, z, w, 18, z + 1, WHITE));
  }
  parts.push(vb(-17, 18, -12, 17, 18.8, 4, '#d6d2ca'));
  // offset glass cells on the front and the ends
  for (let row = 0; row < 5; row++) {
    const y = 2 + row * 3.2;
    for (let x = -17 + (row % 2) * 1.8; x < 16; x += 3.6) if (rnd(seed, row, Math.round(x)) < 0.8) parts.push(vb(x, y, 5.95, x + 2.4, y + 2.2, 6.3, row % 2 ? G : '#9fc6e0'));
  }
  // the wooden arch at the entrance, lit underneath
  for (let i = 0; i < 14; i++) {
    const t = (i + 0.5) / 14;
    const x = -7 + t * 14;
    const y = 2 + Math.sin(t * Math.PI) * 9;
    parts.push(vb(x - 0.6, y, 6, x + 0.6, y + 1.6, 12, i % 2 ? '#c98a4b' : '#d69a5a'));
  }
  parts.push(vb(-5, 0.3, 6, 5, 2, 6.3, ART.glassDark), vb(-5.5, 6.5, 8.5, 5.5, 7, 9, LAMP, 'glow'));
  parts.push(...bench(-15, 12), ...bench(15, 12), ...lamp(-21, 15, 9), ...lamp(21, 15, 9), ...smallTree(-19, -15.5, seed, 10), ...smallTree(19, -15.5, seed + 1, 10));
  return parts;
}

/** A rough disc of boxes (two crossed slabs and a square) for round domes. */
const disc = (y0: number, y1: number, r: number, c: string): BoxPart[] => [vb(-r, y0, -r * 0.42, r, y1, r * 0.42, c), vb(-r * 0.42, y0, -r, r * 0.42, y1, r, c), vb(-r * 0.72, y0, -r * 0.72, r * 0.72, y1, r * 0.72, c)];

/**
 * CHN — domed cultural centre (3 × 3 tiles): a salmon-red hall with tall red columns at the
 * entrance, a drum with a band of windows and a tiered round dome in deep blue with a gold finial.
 */
export function domedCulturalCentre(seed: number): BoxPart[] {
  const WALL = '#d98276';
  const parts: BoxPart[] = [vb(-18, 0, -18, 18, 0.3, 18, PAVING)];
  parts.push(vb(-16, 0, -14, 16, 12, 8, WALL), vb(-16.4, 12, -14.4, 16.4, 13, 8.4, shade(WALL, -0.15)));
  for (let x = -14; x < 14; x += 3) parts.push(...windowZ(x, x + 2, 6, 10, 8, G));
  parts.push(vb(-4, 0, 8, 4, 5, 8.4, ART.glassDark), vb(-6, 0, 8, 6, 0.8, 11, '#c9c2b4'));
  for (const x of [-7, 7]) parts.push(vb(x - 0.9, 0, 8.5, x + 0.9, 12, 10.3, '#c0392b'), vb(x - 1.2, 12, 8.2, x + 1.2, 12.6, 10.6, '#e9c46a'));
  // drum with a window band, then the dome in stacked discs
  parts.push(...disc(13, 19, 10, shade(WALL, 0.05)));
  for (let x = -7; x < 7; x += 2) parts.push(vb(x, 15, 9.7, x + 1.4, 18, 10.1, G));
  parts.push(...disc(19, 20, 12.5, '#c0392b'), ...disc(20, 21, 12, '#e9c46a'));
  const blue = '#2c3f87';
  [[21, 11], [22.5, 10], [24, 8.6], [25.5, 7], [27, 5.4], [28.5, 3.8], [30, 2.4]].forEach(([y, r], i) => parts.push(...disc(y, y + 1.5, r, i % 2 ? shade(blue, 0.08) : blue)));
  parts.push(vb(-1.2, 31.5, -1.2, 1.2, 33, 1.2, '#e9c46a'), vb(-0.7, 33, -0.7, 0.7, 36, 0.7, '#3a3f4c'), vb(-1, 36, -1, 1, 37, 1, '#e9c46a'));
  // red lanterns at the entrance and lamps
  for (const x of [-10, 10]) parts.push(vb(x - 0.2, 0, 11, x + 0.2, 8, 11.4, IRON), vb(x - 0.9, 6, 10.3, x + 0.9, 8, 12.1, '#e0453c', 'glow'));
  parts.push(...lamp(-16, 16, 10), ...lamp(16, 16, 10), ...smallTree(-14, 14, seed, 9), ...smallTree(14, 14, seed + 1, 9));
  return parts;
}

/**
 * LEG — stone arches and clock-tower gate (3 × 2 tiles): a ruin-like wall of three stone arches, a
 * square stone clock tower with an archway, a low stone wall with a blank bronze plaque, boulders and flowers.
 */
export function stoneArchGate(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-18, 0, -12, 18, 0.3, 12, '#93cb6c')];
  const stone = (i: number) => shade('#c9b79a', (rnd(seed, i, 7) - 0.5) * 0.18);
  // the arch wall
  for (let y = 0, i = 0; y < 14; y += 1.4, i++) {
    for (let x = -17, k = 0; x < -1; x += 2.2, k++) {
      const cx = x + 1.1;
      const inArch = [-14, -9, -4].some((ax) => Math.abs(cx - ax) < 1.8 && y < 7 + Math.sqrt(Math.max(0, 1 - ((cx - ax) / 2) ** 2)) * 2);
      if (!inArch) parts.push(vb(x, y, -5, x + 2.2, y + 1.4, -1.5, stone(i * 13 + k)));
    }
  }
  parts.push(vb(-17.4, 14, -5.4, -1.6, 15, -1.1, shade('#c9b79a', -0.15)));
  // clock tower
  const tx = 10;
  for (let y = 0, i = 0; y < 22; y += 1.4, i++) {
    for (const [x0, x1] of [[tx - 4, tx - 1.6], [tx + 1.6, tx + 4]]) parts.push(vb(x0, y, -4, x1, y + 1.4, 2, stone(i * 7 + x0)));
    if (y >= 8) parts.push(vb(tx - 1.6, y, -4, tx + 1.6, y + 1.4, 2, stone(i * 5 + 3)));
  }
  parts.push(vb(tx - 4.6, 22, -4.6, tx + 4.6, 23, 2.6, shade('#c9b79a', -0.15)), vb(tx - 3.6, 23, -3.6, tx + 3.6, 24.4, 1.6, '#8f8778'));
  parts.push(vb(tx - 2, 15, 2, tx + 2, 19, 2.3, WHITE), vb(tx - 0.15, 17, 2.3, tx + 0.15, 18.8, 2.45, '#2b2f3a'), vb(tx - 0.15, 16.85, 2.3, tx + 1.4, 17.15, 2.45, '#2b2f3a'), vb(tx - 1.6, 15.4, 2.2, tx + 1.6, 15.6, 2.4, LAMP, 'glow'));
  // low sign wall with a blank plaque, boulders, flowers, lamps
  for (let x = -16, i = 0; x < -4; x += 2.4, i++) parts.push(vb(x, 0, 2, x + 2.4, 4 + (i % 2) * 0.3, 4.4, stone(i + 90)));
  parts.push(vb(-14, 1.2, 4.4, -6, 3.4, 4.8, '#8a6a3c'));
  for (const [x, z, s] of [[-15.5, 8, 2.2], [-2, 6, 1.8], [4, 8, 2.2], [15.5, 6, 2]]) parts.push(vb(x - s, 0, z - s * 0.7, x + s, s * 1.1, z + s * 0.7, shade(STONE, (rnd(seed, x, z) - 0.5) * 0.2)));
  parts.push(...flowerBed(-12, 7, 7, 3, seed), ...flowerBed(6, 4, 6, 3, seed + 1), ...lamp(-1, 10, 9), ...lamp(16, -9, 9));
  return parts;
}

/**
 * OGD — caboose park (3 × 2 tiles): a red caboose on a short display track on a ballast bed, a rail
 * fence, two flagpoles, a memorial stone and flower beds.
 */
export function caboosePark(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-18, 0, -12, 18, 0.3, 12, '#93cb6c'), vb(-14, 0.3, -6, 14, 1.4, 2, '#a99c88')];
  for (let x = -13.5; x < 14; x += 2) parts.push(vb(x, 1.4, -5, x + 0.9, 1.7, 1, WOOD_DARK));
  parts.push(vb(-14, 1.7, -3.6, 14, 2, -3.2, '#7a7f8a'), vb(-14, 1.7, -0.8, 14, 2, -0.4, '#7a7f8a'));
  const RED = '#b5332d';
  parts.push(vb(-9, 3.2, -4.4, 9, 10, 0.4, RED), vb(-9.6, 10, -4.8, 9.6, 10.6, 0.8, '#5a2f2a'), vb(-3, 10.6, -3.8, 3, 13, -0.2, RED), vb(-3.4, 13, -4.2, 3.4, 13.6, 0.2, '#5a2f2a'));
  for (const x of [-6.5, -2, 2.5]) parts.push(vb(x, 5.8, 0.4, x + 2, 8, 0.6, G));
  parts.push(vb(-9.2, 3.6, 0.4, 9.2, 4, 0.6, '#f2c14e'));
  for (const x of [-7, 5]) parts.push(vb(x, 1.7, -4.6, x + 3, 3.2, 0.6, '#2b2f3a'));
  for (const s of [-1, 1]) parts.push(vb(s * 9.6 - 0.8, 3.2, -4.4, s * 9.6 + 0.8, 7, 0.4, '#3a3f4c'));
  parts.push(...fence(-16, 4, -3, 4, WOOD, 3), ...fence(3, 4, 16, 4, WOOD, 3));
  for (const x of [-15, -11]) parts.push(vb(x, 0, -10, x + 0.4, 18, -9.6, '#9aa1ab'), ...asSway([vb(x + 0.4, 14.5, -9.9, x + 4, 17.2, -9.7, '#e0453c'), vb(x + 1.4, 15, -9.95, x + 3, 16.7, -9.65, '#ffffff')]));
  parts.push(vb(12, 0.3, -11, 16, 4, -9, '#8f8778'), vb(12.4, 2, -9, 15.6, 3.6, -8.9, '#c9a66b'));
  parts.push(...flowerBed(-16, 6, 8, 4, seed), ...flowerBed(8, 6, 8, 4, seed + 1), ...lamp(0, 9, 9), ...bench(-6, 10));
  return parts;
}

/**
 * SHN — 1915 red barn (3 × 3 tiles): a big red gambrel barn with white trim and a ventilator
 * cupola, standing in a park with autumn trees, picnic tables and a path.
 */
export function heritageRedBarn(seed: number): BoxPart[] {
  const RED = '#b23b31';
  const parts: BoxPart[] = [vb(-18, 0, -18, 18, 0.3, 18, '#9fc874')];
  parts.push(vb(-11, 0, -14, 11, 12, 4, RED));
  const roof: [number, number][] = [[12, 0], [13.6, 1.2], [15.2, 2.4], [16.8, 4.2], [18, 6.2], [18.8, 8.2]];
  roof.forEach(([y, inset], i) => parts.push({ ...vb(-11.6, y, -14.6 + inset, 11.6, y + 1.6, 4.6 - inset, i % 2 ? '#4f545f' : '#5a5f6a'), tag: 'roof' }));
  for (let i = 0; i < 6; i++) {
    const inset = roof[i][1];
    parts.push(vb(-11, roof[i][0], -14 + inset + 0.6, -10.9, roof[i][0] + 1.6, 4 - inset - 0.6, RED), vb(10.9, roof[i][0], -14 + inset + 0.6, 11, roof[i][0] + 1.6, 4 - inset - 0.6, RED));
  }
  // white trim, X doors, loft door, small windows
  parts.push(vb(-11.2, 0, 4, 11.2, 0.6, 4.4, WHITE), vb(-11.2, 11.4, 4, 11.2, 12, 4.4, WHITE), vb(-11.2, 0, 4, -10.6, 12, 4.4, WHITE), vb(10.6, 0, 4, 11.2, 12, 4.4, WHITE));
  parts.push(vb(-4, 0, 4.2, 4, 8, 4.5, shade(RED, -0.1)));
  for (const [x0, x1] of [[-4.2, -3.6], [3.6, 4.2], [-0.3, 0.3]]) parts.push(vb(x0, 0, 4.4, x1, 8, 4.7, WHITE));
  parts.push(vb(-4.2, 7.6, 4.4, 4.2, 8.2, 4.7, WHITE), vb(-2, 13, 4, 2, 16.4, 4.4, WHITE), vb(-1.6, 13.4, 4.3, 1.6, 16, 4.5, shade(RED, -0.2)));
  for (const x of [-8, 7]) parts.push(...windowZ(x - 1, x + 1, 4, 6, 4.2, G));
  parts.push(vb(-1.6, 20.4, -6.6, 1.6, 23, -3.4, WHITE), vb(-2.2, 23, -7.2, 2.2, 23.8, -2.8, '#4f545f'), vb(-0.2, 23.8, -5.2, 0.2, 26, -4.8, '#9aa1ab'), vb(-1.6, 25.2, -5.1, 1.6, 25.5, -4.9, '#9aa1ab'));
  parts.push(vb(-9, 9, 4.4, -7.6, 10, 5, LAMP, 'glow'));
  // park: path, picnic tables, autumn trees
  for (let z = 5; z < 17; z += 2) parts.push(vb(-2, 0.3, z, 2, 0.38, z + 2, '#d6cdb8'));
  const table = (x: number, z: number) => [vb(x - 2.4, 2.4, z - 1, x + 2.4, 2.8, z + 1, ART.wood), vb(x - 2.4, 1.2, z - 2.2, x + 2.4, 1.6, z - 1.6, ART.wood), vb(x - 2.4, 1.2, z + 1.6, x + 2.4, 1.6, z + 2.2, ART.wood)];
  parts.push(...table(-10, 11), ...table(10, 12));
  for (const [x, z] of [[-15, -15], [15, -15], [-15, 0], [15, 2], [-14, 14.5], [14, 14.5]]) {
    const leaf = pick(['#e9a93a', '#f2c14e', '#d9663a', '#8cc867'], rnd(seed, x, z));
    parts.push(vb(x - 0.5, 0.3, z - 0.5, x + 0.5, 5, z + 0.5, ART.trunk), ...asSway([vb(x - 2.6, 4, z - 2.6, x + 2.6, 9, z + 2.6, leaf), vb(x - 1.6, 9, z - 1.6, x + 1.6, 10.4, z + 1.6, shade(leaf, 0.08))]));
  }
  parts.push(...lamp(4, 16, 9));
  return parts;
}

/**
 * STA — football stadium (6 × 5 tiles): a striped field with end zones and posts, stands on both
 * long sides in red and blue, a scoreboard at one end and four tall light towers.
 */
export function footballStadium(_seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-36, 0, -30, 36, 0.3, 30, '#c9c2b4'), vb(-30, 0.3, -12, 30, 0.5, 12, '#6fb84f')];
  for (let x = -22; x <= 22; x += 4) parts.push(vb(x - 0.2, 0.5, -11, x + 0.2, 0.55, 11, '#fbf8f2'));
  for (let x = -21; x < 21; x += 4) parts.push(vb(x, 0.5, -12, x + 2, 0.52, 12, '#78c158'));
  parts.push(vb(-30, 0.5, -12, -24, 0.56, 12, '#c0392b'), vb(24, 0.5, -12, 30, 0.56, 12, '#2e5aa8'));
  for (const s of [-1, 1]) parts.push(vb(s * 29 - 0.3, 0.5, -0.3, s * 29 + 0.3, 6, 0.3, '#f2c14e'), vb(s * 29 - 0.3, 6, -3, s * 29 + 0.3, 6.4, 3, '#f2c14e'), vb(s * 29 - 0.3, 6.4, -3, s * 29 + 0.3, 11, -2.6, '#f2c14e'), vb(s * 29 - 0.3, 6.4, 2.6, s * 29 + 0.3, 11, 3, '#f2c14e'));
  // stands: stepped rows on both long sides, lower bowl red, upper blue
  for (const s of [-1, 1]) {
    for (let r = 0; r < 9; r++) {
      const z0 = s * (13 + r * 1.6);
      const z1 = s * (14.6 + r * 1.6);
      parts.push(vb(-28, 0, Math.min(z0, z1), 28, 1 + r * 1.4, Math.max(z0, z1), r < 5 ? (r % 2 ? '#c0392b' : '#d0453c') : r % 2 ? '#2e5aa8' : '#3a6ac0'));
    }
    parts.push(vb(-28, 13.6, s * 27.4 - 0.6, 28, 15, s * 27.4 + 0.6, '#3a3f4c'));
  }
  // scoreboard at the east end, light towers at the corners
  parts.push(vb(32, 0, -1, 33, 10, 1, IRON), vb(31.5, 10, -8, 33.5, 17, 8, '#2b2f3a'));
  for (let z = -6; z < 6; z += 1.5) parts.push(vb(31.4, 12, z, 31.5, 13, z + 0.8, LAMP, 'glow'));
  for (const [x, z] of [[-33, -27], [33, -27], [-33, 27], [33, 27]]) parts.push(vb(x - 0.6, 0, z - 0.6, x + 0.6, 32, z + 0.6, '#9aa1ab'), vb(x - 2.4, 32, z - 1, x + 2.4, 35, z + 1, LAMP, 'glow'));
  parts.push(...flowerBed(-35, 20, 4, 8, 1), ...lamp(-34, -16, 9), ...lamp(34, 16, 9), ...hipRoof(-6, 6, 27.6, 29.4, 6, '#3a3f4c', 0.4, 2), vb(-6, 0, 27.6, 6, 5, 29.4, '#e9dccb'));
  return parts;
}

