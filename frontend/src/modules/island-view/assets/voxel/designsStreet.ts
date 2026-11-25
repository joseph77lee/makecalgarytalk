/**
 * More voxel street props, trees, cars and play equipment (M23 rework: Polyfork shapes as
 * reference only; see designs.ts). Props stand on the origin, front towards +z; cars lie along x
 * like `car()`. Sizes match our existing props (bench about 0.5 tile wide, lamp 0.9 tall).
 */
import { asSway, type BoxPart } from '../boxes';
import { ART } from './samples';
import { hipRoof, pick, rnd, shade, vb } from './voxel';

const IRON = '#3f4552';
const LAMP = '#ffe7a3';

// --- Street props -----------------------------------------------------------------------------

/** After Polyfork "Park Bench": slatted wooden seat and back on curly iron ends. */
export function parkBench(): BoxPart[] {
  const parts: BoxPart[] = [];
  for (let i = 0; i < 3; i++) parts.push(vb(-3, 1.6, -0.9 + i * 0.6, 3, 1.9, -0.5 + i * 0.6, ART.wood));
  for (let i = 0; i < 2; i++) parts.push(vb(-3, 2.3 + i * 0.7, -1.05, 3, 2.8 + i * 0.7, -0.8, ART.wood));
  for (const x of [-2.9, 2.5]) parts.push(vb(x, 0, -1.1, x + 0.4, 1.6, 0.9, IRON), vb(x, 1.6, -1.1, x + 0.4, 3.6, -0.7, IRON), vb(x, 2, -0.6, x + 0.4, 2.3, 0.7, IRON));
  return parts;
}

/** After Polyfork "Alpine Bench": a split log on two stumps, tufts of grass around it. */
export function logBench(): BoxPart[] {
  const log = '#a67b55';
  return [
    vb(-2.6, 0, -0.6, -1.4, 1.4, 0.6, shade(log, -0.15)),
    vb(1.4, 0, -0.6, 2.6, 1.4, 0.6, shade(log, -0.15)),
    vb(-3.2, 1.4, -0.8, 3.2, 2.2, 0.8, log),
    vb(-3.2, 2.2, -0.8, 3.2, 2.3, 0.8, '#d9b38a'),
    vb(-3.6, 0, 0.8, -3, 0.8, 1.3, '#79b85a'),
    vb(3, 0, -1.2, 3.5, 0.9, -0.7, '#8cc867'),
  ];
}

/** After Polyfork "Street Lamp": a post with a curved arm and a hanging lantern. */
export function armLamp(): BoxPart[] {
  return [
    vb(-0.6, 0, -0.6, 0.6, 0.8, 0.6, IRON),
    vb(-0.3, 0.8, -0.3, 0.3, 10, 0.3, IRON),
    vb(-0.3, 10, -0.3, 2.6, 10.5, 0.3, IRON),
    vb(2.2, 9.2, -0.2, 2.5, 10, 0.2, IRON),
    vb(1.6, 7.8, -0.6, 3.1, 9.2, 0.6, LAMP, 'glow'),
    vb(1.4, 9.2, -0.8, 3.3, 9.5, 0.8, IRON),
  ];
}

/** After Polyfork "Garland Lamp Post": a Victorian lantern post wrapped in a garland with a red bow (winter). */
export function garlandLamp(): BoxPart[] {
  const parts: BoxPart[] = [vb(-0.8, 0, -0.8, 0.8, 1, 0.8, IRON), vb(-0.35, 1, -0.35, 0.35, 8.4, 0.35, IRON)];
  for (let y = 1.6; y < 8; y += 1.2) parts.push(vb(-0.6, y, -0.6, 0.6, y + 0.6, 0.6, (y * 10) % 24 < 12 ? '#4f8a5b' : '#5f9a66'));
  parts.push(vb(-0.6, 6.6, 0.4, 0.6, 7.4, 0.8, '#e0453c'), vb(-1.1, 8.4, -1.1, 1.1, 8.8, 1.1, IRON), vb(-0.9, 8.8, -0.9, 0.9, 10.4, 0.9, LAMP, 'glow'), ...hipRoof(-0.9, 0.9, -0.9, 0.9, 11, IRON, 0.3, 2));
  return parts;
}

/** After Polyfork "Cobra-Head Street Light": a tall grey pole bending over the road with a flat head. */
export function cobraLight(): BoxPart[] {
  return [
    vb(-0.5, 0, -0.5, 0.5, 0.6, 0.5, '#9aa1ab'),
    vb(-0.3, 0.6, -0.3, 0.3, 11, 0.3, '#9aa1ab'),
    vb(-0.25, 11, -0.25, 3, 11.4, 0.25, '#9aa1ab'),
    vb(2.4, 10.6, -0.7, 4.6, 11.4, 0.7, '#9aa1ab'),
    vb(2.6, 10.4, -0.5, 4.4, 10.6, 0.5, LAMP, 'glow'),
  ];
}

/** After Polyfork "Curbside Mailbox": a rounded-top box on a post with a red flag. */
export function curbMailbox(seed: number): BoxPart[] {
  const box = pick(['#9aa1ab', '#5b8fd6', '#3b4260', '#e9dccb'], rnd(seed, 1));
  return [
    vb(-0.25, 0, -0.25, 0.25, 3, 0.25, ART.wood),
    vb(-0.7, 3, -1.2, 0.7, 4.1, 1.2, box),
    vb(-0.5, 4.1, -1.2, 0.5, 4.5, 1.2, box),
    vb(-0.6, 3.1, 1.2, 0.6, 4.2, 1.35, shade(box, -0.15)),
    vb(0.7, 3.6, -0.6, 0.85, 5, -0.4, '#e0453c'),
    vb(0.7, 4.6, -0.4, 0.85, 5, 0.3, '#e0453c'),
  ];
}

/** After Polyfork "Snowman": three snowballs, coal eyes, a carrot nose, a scarf and twig arms. */
export function snowman(seed: number): BoxPart[] {
  const scarf = pick(['#e0453c', '#5b8fd6', '#6fbf8a', '#f2c14e'], rnd(seed, 2));
  const snow = '#f6f8fb';
  return [
    vb(-1.8, 0, -1.8, 1.8, 3, 1.8, snow),
    vb(-1.3, 3, -1.3, 1.3, 5.2, 1.3, snow),
    vb(-0.9, 5.2, -0.9, 0.9, 6.8, 0.9, snow),
    vb(-1.4, 5, -1.4, 1.4, 5.5, 1.4, scarf),
    vb(0.6, 3.6, 1.2, 1.2, 5.4, 1.5, scarf),
    vb(-0.5, 6, 0.85, -0.2, 6.3, 1, '#2a2d36'),
    vb(0.2, 6, 0.85, 0.5, 6.3, 1, '#2a2d36'),
    vb(-0.15, 5.7, 0.9, 0.15, 6, 1.7, '#f39a52'),
    vb(1.3, 4.2, -0.1, 2.8, 4.4, 0.1, '#7a5538'),
    vb(-2.8, 4.2, -0.1, -1.3, 4.4, 0.1, '#7a5538'),
    vb(-1, 6.8, -1, 1, 7.1, 1, '#2a2d36'),
    vb(-0.7, 7.1, -0.7, 0.7, 8.4, 0.7, '#2a2d36'),
  ];
}

/** Fire pits after Polyfork "Stone Fire Pit", "Stone-Ring Campfire" and "Cleared Fire Pit" (variant 0–2); flames glow. */
export function firePitRing(variant: number): BoxPart[] {
  const v = variant % 3;
  const stone = v === 1 ? '#a9a39a' : '#cfc6b8';
  const parts: BoxPart[] = [];
  if (v === 2) parts.push(vb(-4.5, 0, -4.5, 4.5, 0.2, 4.5, '#b8a48c'));
  const n = v === 0 ? 8 : 12;
  const r = v === 0 ? 2.6 : 3.2;
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    const s = v === 0 ? 1.3 : 0.9;
    parts.push(vb(Math.cos(a) * r - s / 2, 0, Math.sin(a) * r - s / 2, Math.cos(a) * r + s / 2, v === 0 ? 1.6 : 1, Math.sin(a) * r + s / 2, i % 2 ? stone : shade(stone, -0.12)));
  }
  parts.push(vb(-1.6, 0.2, -0.3, 1.6, 0.8, 0.3, '#7a5538'), vb(-0.3, 0.2, -1.6, 0.3, 0.8, 1.6, '#8a6343'));
  parts.push(vb(-1, 0.8, -1, 1, 2.2, 1, '#ff9a3d', 'glow'), vb(-0.5, 2.2, -0.5, 0.5, 3.4, 0.5, '#ffd23f', 'glow'));
  return parts;
}

/** After Polyfork "Park Drinking Fountain": a stone pillar with a basin and a little spout. */
export function drinkingFountain(): BoxPart[] {
  return [vb(-0.8, 0, -0.8, 0.8, 3, 0.8, '#cfc6b8'), vb(-1.2, 3, -1.2, 1.2, 3.6, 1.2, '#b8b0a4'), vb(-0.8, 3.5, -0.8, 0.8, 3.65, 0.8, '#8ec5ea'), vb(-0.15, 3.6, 0.2, 0.15, 4.4, 0.5, '#9aa1ab')];
}

/** After Polyfork "Station Garden Bed": a raised timber bed full of flowers. */
export function gardenBed(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-3, 0, -1.5, 3, 1.2, 1.5, ART.wood), vb(-2.6, 0.2, -1.1, 2.6, 1.3, 1.1, '#7a5a3c')];
  const cs = ['#ef9b7f', '#e9c46a', '#e3a1a6', '#b9a6e2', '#ffffff'];
  for (let x = -2.2; x < 2.4; x += 1.1) for (const z of [-0.6, 0.4]) parts.push(vb(x, 1.3, z, x + 0.6, 1.9, z + 0.5, '#6fae4f'), vb(x + 0.1, 1.9, z + 0.05, x + 0.5, 2.3, z + 0.45, pick(cs, rnd(seed, x * 10, z * 10))));
  return parts;
}

// --- Play equipment -----------------------------------------------------------------------

/** After Polyfork "Playground Slide": a ladder up to a small deck and a long sloped slide. */
export function slide(a: string, b: string): BoxPart[] {
  const parts: BoxPart[] = [];
  for (const [x, z] of [[-3, -1], [-1.4, -1], [-3, 0.6], [-1.4, 0.6]]) parts.push(vb(x, 0, z, x + 0.4, 5, z + 0.4, '#efe2c2'));
  parts.push(vb(-3.2, 4.4, -1.2, -1, 4.8, 1.2, a));
  for (let y = 0.8; y < 4.4; y += 0.9) parts.push(vb(-3.6, y, -0.9, -3.2, y + 0.2, 0.9, b));
  for (let i = 0; i < 7; i++) parts.push(vb(-1 + i * 0.75, 4.4 - i * 0.62, -0.7, -0.25 + i * 0.75, 4.8 - i * 0.62, 0.7, b));
  parts.push(vb(-1, 4.8, -0.8, 4.3, 5.1, -0.7, b), vb(-1, 4.8, 0.7, 4.3, 5.1, 0.8, b));
  return parts;
}

/** After Polyfork "Playground Roundabout": a low spinning disc with handles. */
export function roundabout(a: string, b: string): BoxPart[] {
  const parts: BoxPart[] = [vb(-0.4, 0, -0.4, 0.4, 0.8, 0.4, '#9aa1ab')];
  for (let i = 0; i < 4; i++) parts.push(vb(-2.6 + i * 0.4, 0.8, -2.6 + i * 0.4, 2.6 - i * 0.4, 1.1, 2.6 - i * 0.4, i % 2 ? a : b));
  for (const [x, z] of [[-1.8, 0], [1.8, 0], [0, -1.8], [0, 1.8]]) parts.push(vb(x - 0.15, 1.1, z - 0.15, x + 0.15, 2.6, z + 0.15, '#9aa1ab'));
  parts.push(vb(-1.95, 2.4, -0.15, 1.95, 2.6, 0.15, '#9aa1ab'), vb(-0.15, 2.4, -1.95, 0.15, 2.6, 1.95, '#9aa1ab'));
  return parts;
}

/** After Polyfork "Spring Rider": a horse on a coiled spring. */
export function springRider(c: string): BoxPart[] {
  return [
    vb(-0.8, 0, -0.8, 0.8, 0.3, 0.8, '#9aa1ab'),
    ...[0.3, 0.8, 1.3].map((y) => vb(-0.5, y, -0.5, 0.5, y + 0.3, 0.5, '#9aa1ab')),
    vb(-1.6, 1.8, -0.6, 1.4, 3, 0.6, c),
    vb(1, 3, -0.5, 2, 4.2, 0.5, c),
    vb(1.8, 3.4, -0.4, 2.6, 4, 0.4, shade(c, -0.15)),
    vb(-1.6, 2.6, -0.2, -2.2, 3.4, 0.2, shade(c, -0.15)),
    vb(0.5, 3.6, -0.9, 0.7, 3.8, 0.9, '#2a2d36'),
  ];
}

/** After Polyfork "Teeter-Totter": a long plank on a pivot, handles at each end. */
export function teeterTotter(a: string, b: string): BoxPart[] {
  return [
    vb(-0.6, 0, -0.6, 0.6, 1.4, 0.6, b),
    { layer: 'solid', p: [0, 1.6 / 12, 0], s: [8 / 12, 0.4 / 12, 1.2 / 12], c: a, r: [0, 0, 0.18] },
    vb(-3.4, 1.4, -0.1, -3.2, 2.6, 0.1, b),
    vb(3.2, 2.2, -0.1, 3.4, 3.4, 0.1, b),
  ];
}

// --- Trees ------------------------------------------------------------------------------------

const trunk = (h: number, w = 1, c = ART.trunk): BoxPart => vb(-w / 2, 0, -w / 2, w / 2, h, w / 2, c);

/** Evergreen tiers: each layer narrower than the one below (tall pine, young pine, fir). */
function tiers(base: number, top: number, widths: number[], c: string): BoxPart[] {
  const step = (top - base) / widths.length;
  return widths.map((w, i) => vb(-w, base + i * step, -w, w, base + (i + 1) * step, w, i % 2 ? shade(c, 0.06) : c));
}

/** After Polyfork "Tall Pine Tree": a bare lower trunk under narrow, dark tiers. */
export const tallPine = (seed: number): BoxPart[] => [trunk(5, 1), ...asSway(tiers(4, 16, [3.2, 2.7, 2.2, 1.7, 1.1, 0.6], pick(ART.spruce, rnd(seed, 3))))];
/** After Polyfork "Young Pine": a short, plump little evergreen. */
export const youngPine = (seed: number): BoxPart[] => [trunk(1.5, 0.8), ...asSway(tiers(1.2, 8, [3, 2.4, 1.6, 0.8], shade(pick(ART.spruce, rnd(seed, 4)), 0.1)))];
/** After Polyfork "Front-Yard Fir Tree": a full fir with a few coloured ornaments and a star. */
export function firTree(seed: number): BoxPart[] {
  const crown: BoxPart[] = tiers(1.5, 11.5, [3.8, 3.2, 2.5, 1.8, 1], pick(ART.spruce, rnd(seed, 5)));
  const balls = ['#e0453c', '#f2c14e', '#5b8fd6', '#f08bb3'];
  const lights: BoxPart[] = [[2.8, 3, 0], [-2.2, 5, 1.5], [1, 7, 1.9], [-1.2, 9, -1], [0.8, 4, -3]].map(([x, y, z], i) => vb(x - 0.4, y, z - 0.4, x + 0.4, y + 0.8, z + 0.4, balls[i % balls.length], 'glow'));
  lights.push(vb(-0.5, 11.5, -0.5, 0.5, 12.6, 0.5, '#ffd23f', 'glow'));
  // the ornaments glow (their own layer), only the green crown sways
  return [trunk(2, 1), ...asSway(crown), ...lights];
}
/** After Polyfork "Broad Canopy Shade Tree": a thick trunk under a wide, flat crown. */
export function shadeTree(seed: number, leaf?: string): BoxPart[] {
  const c = leaf ?? pick(ART.leaf, rnd(seed, 6));
  return [trunk(5, 1.4), vb(-1.2, 4, -0.3, 1.2, 4.6, 0.3, ART.trunk), ...asSway([vb(-5, 5, -4.5, 5, 8, 4.5, c), vb(-4, 8, -3.5, 4, 9.6, 3.5, shade(c, 0.08)), vb(-2.5, 9.6, -2, 2.5, 10.4, 2, shade(c, 0.14))])];
}
/** After Polyfork "Ornamental Front-Yard Tree": a slim trunk, a round crown in blossom pink or autumn gold. */
export function ornamentalTree(seed: number): BoxPart[] {
  const c = pick(['#f2a7b8', '#e9c46a', '#ef9b7f', '#8cc867'], rnd(seed, 7));
  return [trunk(4, 0.8), ...asSway([vb(-3, 4, -3, 3, 8, 3, c), vb(-2.2, 8, -2.2, 2.2, 9.2, 2.2, shade(c, 0.1)), vb(-3.4, 5, -2.2, 3.4, 7, 2.2, shade(c, -0.05))])];
}
/** After Polyfork "Columnar Evergreen Shrub": a tall, narrow green column. */
export const columnShrub = (seed: number): BoxPart[] => asSway([vb(-1.2, 0, -1.2, 1.2, 8, 1.2, pick(ART.spruce, rnd(seed, 8))), vb(-0.8, 8, -0.8, 0.8, 9.4, 0.8, shade(pick(ART.spruce, rnd(seed, 8)), 0.08))]);
/** After Polyfork "Olive Tree": a twisted trunk and a wide, silvery-green crown in clumps. */
export function oliveTree(seed: number): BoxPart[] {
  const c = shade('#9fb48a', (rnd(seed, 11) - 0.5) * 0.1);
  return [vb(-0.6, 0, -0.6, 0.6, 3, 0.6, '#8a6a4c'), vb(0, 2.6, -0.4, 1.8, 3.4, 0.4, '#8a6a4c'), vb(-1.6, 2.8, -0.3, 0, 3.6, 0.3, '#8a6a4c'), ...asSway([vb(-4.5, 3.6, -2.5, -0.5, 6, 2.5, c), vb(0.5, 4, -3, 4.5, 6.6, 2, shade(c, 0.06)), vb(-2, 6, -2, 2.5, 7.6, 2, shade(c, 0.12))])];
}
/** After Polyfork "Lollipop Toy Tree": a straight stick and a perfect round ball (playful). */
export const lollipopTree = (seed: number): BoxPart[] => {
  const c = pick(['#8cc867', '#79b85a', '#e9c46a'], rnd(seed, 9));
  return [vb(-0.35, 0, -0.35, 0.35, 5, 0.35, '#c79a76'), ...asSway([vb(-2.4, 5, -2.4, 2.4, 9, 2.4, c), vb(-1.8, 4.6, -1.8, 1.8, 9.4, 1.8, c), vb(-2.8, 5.6, -1.6, 2.8, 8.4, 1.6, shade(c, -0.04))])];
};
/** After Polyfork "Cone Toy Tree": a smooth stepped cone on a short stick. */
export const coneTree = (seed: number): BoxPart[] => [vb(-0.35, 0, -0.35, 0.35, 1.5, 0.35, '#c79a76'), ...asSway(tiers(1.5, 11, [2.6, 2.2, 1.8, 1.4, 1, 0.6], shade(pick(ART.spruce, rnd(seed, 10)), 0.15)))];

// --- Cars and transit ----------------------------------------------------------------------

const wheels = (xs: number[], hz: number): BoxPart[] => xs.flatMap((x) => [vb(x - 0.8, 0, hz - 0.3, x + 0.8, 1.5, hz + 0.3, '#2a2d36'), vb(x - 0.8, 0, -hz - 0.3, x + 0.8, 1.5, -hz + 0.3, '#2a2d36')]);
const lights = (x: number, hz: number): BoxPart[] => [vb(x, 1.6, -hz + 0.3, x + 0.15, 2.1, -hz + 1, '#ffe7a3', 'glow'), vb(x, 1.6, hz - 1, x + 0.15, 2.1, hz - 0.3, '#ffe7a3', 'glow')];
const carColour = (seed: number) => pick(['#e46a5c', '#5b8fd6', '#f2f2f2', '#3b4260', '#f2c14e', '#6fbf8a', '#a77bd1'], rnd(seed, 30));

/** After Polyfork "Family Crossover SUV": tall body, a long glasshouse, roof rails. */
export function suv(seed: number): BoxPart[] {
  const c = carColour(seed);
  return [vb(-4.2, 0.8, -1.9, 4.2, 3, 1.9, c), vb(-3, 3, -1.7, 2.6, 4.8, 1.7, shade(c, 0.08)), vb(-2.8, 3.2, 1.65, 2.4, 4.5, 1.8, ART.glassDark), vb(-2.8, 3.2, -1.8, 2.4, 4.5, -1.65, ART.glassDark), vb(-2.6, 4.8, -1.4, 2.2, 5.1, -1.2, '#4a5060'), vb(-2.6, 4.8, 1.2, 2.2, 5.1, 1.4, '#4a5060'), ...wheels([-2.6, 2.6], 1.9), ...lights(4.15, 1.9)];
}
/** After Polyfork "Family Minivan": a long box with a sloped nose and a sliding-door line. */
export function minivan(seed: number): BoxPart[] {
  const c = carColour(seed + 1);
  return [vb(-4.4, 0.8, -1.9, 3.2, 4.6, 1.9, c), vb(3.2, 0.8, -1.9, 4.6, 2.8, 1.9, c), vb(2.4, 2.8, -1.7, 3.6, 4, 1.7, ART.glassDark), vb(-3.8, 2.8, 1.85, 2.2, 4, 1.95, ART.glassDark), vb(-0.6, 0.9, 1.9, -0.45, 2.8, 2, shade(c, -0.25)), ...wheels([-2.8, 2.6], 1.9), ...lights(4.55, 1.9)];
}
/** After Polyfork "Suburban Pickup Truck": a cab and an open bed with a tailgate. */
export function pickupTruck(seed: number): BoxPart[] {
  const c = carColour(seed + 2);
  return [vb(-4.6, 0.8, -1.9, 4.6, 2.6, 1.9, c), vb(0.2, 2.6, -1.8, 3, 4.6, 1.8, c), vb(2.9, 3, -1.6, 3.05, 4.3, 1.6, ART.glassDark), vb(0.4, 3, 1.75, 2.8, 4.3, 1.85, ART.glassDark), vb(-4.4, 2.6, -1.7, 0, 2.7, 1.7, '#5a4636'), vb(-4.6, 2.6, -1.9, -4.3, 3.4, 1.9, c), vb(-4.4, 2.6, 1.6, 0, 3.4, 1.9, c), vb(-4.4, 2.6, -1.9, 0, 3.4, -1.6, c), ...wheels([-2.8, 2.8], 1.9), ...lights(4.55, 1.9)];
}
/** After Polyfork "Compact Hatchback": short and round, with a steep back. */
export function hatchback(seed: number): BoxPart[] {
  const c = carColour(seed + 3);
  return [vb(-3.2, 0.8, -1.7, 3.4, 2.6, 1.7, c), vb(-2.8, 2.6, -1.5, 1.6, 4.2, 1.5, shade(c, 0.08)), vb(-2.6, 2.8, 1.45, 1.4, 3.9, 1.6, ART.glassDark), vb(1.55, 2.8, -1.3, 1.7, 3.9, 1.3, ART.glassDark), ...wheels([-2, 2.1], 1.7), ...lights(3.35, 1.7)];
}
/** After Polyfork "Town Car": a long, low sedan with chrome trim. */
export function townCar(seed: number): BoxPart[] {
  const c = pick(['#2f3448', '#3b4260', '#7a2e2e', '#e9dccb'], rnd(seed, 31));
  return [vb(-4.8, 0.8, -1.8, 4.8, 2.4, 1.8, c), vb(-2.2, 2.4, -1.6, 1.8, 3.8, 1.6, c), vb(-2, 2.6, 1.55, 1.6, 3.6, 1.7, ART.glassDark), vb(-4.8, 1.5, 1.8, 4.8, 1.7, 1.9, '#d9dee5'), vb(-4.8, 1.5, -1.9, 4.8, 1.7, -1.8, '#d9dee5'), ...wheels([-3, 3], 1.8), ...lights(4.75, 1.8)];
}
/** After Polyfork "Yellow School Bus": long yellow body, black window band and stripes, a short hood. */
export function schoolBus(): BoxPart[] {
  const y = '#f2c14e';
  const parts: BoxPart[] = [vb(-7, 0.8, -2, 5.5, 5.4, 2, y), vb(5.5, 0.8, -1.8, 7.2, 3.2, 1.8, y), vb(-6.6, 3.2, 1.95, 4.8, 4.6, 2.05, '#2a2d36'), vb(-6.6, 3.2, -2.05, 4.8, 4.6, -1.95, '#2a2d36')];
  parts.push(vb(-7, 2, 2, 5.5, 2.3, 2.1, '#2a2d36'), vb(-7, 2, -2.1, 5.5, 2.3, -2, '#2a2d36'), vb(5.4, 3.4, -1.6, 5.55, 4.8, 1.6, ART.glassDark));
  return [...parts, ...wheels([-4.5, 4.4], 2), ...lights(7.15, 1.8)];
}

/** After Polyfork "City Tram": a long two-section streetcar with a pantograph (our CTrain stays its own model). */
export function cityTram(): BoxPart[] {
  const body = '#e9dccb';
  const band = '#e46a5c';
  const parts: BoxPart[] = [vb(-11, 0.8, -2, 11, 6, 2, body), vb(-11, 1.6, -2.05, 11, 2.4, 2.05, band), vb(-10.4, 3, 1.95, 10.4, 5, 2.1, ART.glassDark), vb(-10.4, 3, -2.1, 10.4, 5, -1.95, ART.glassDark)];
  parts.push(vb(-0.2, 0.8, -2.1, 0.2, 6, 2.1, '#5d6470'), vb(-1.5, 6, -0.4, 1.5, 6.4, 0.4, '#5d6470'), vb(-0.2, 6.4, -0.2, 0.2, 8, 0.2, '#2a2d36'), vb(-2, 8, -0.2, 2, 8.3, 0.2, '#2a2d36'));
  return [...parts, ...wheels([-8, -4, 4, 8], 1.8)];
}
