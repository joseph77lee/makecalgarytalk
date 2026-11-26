/**
 * Place library: mature-suburb and new-suburb tracks (community-identity build map, 2026-11-26).
 * Generic places, no brands or sign text. Voxels (12 per tile), front towards +z, centred.
 */
import { asSway, type BoxPart } from '../boxes';
import { bench, fence, flowerBed, ICE, IRON, LAMP, lamp, PAVING, reeds, smallTree, STONE, WATER, WOOD, WOOD_DARK } from './placeParts';
import { ART } from './samples';
import { gableRoof, hipRoof, pick, rnd, shade, vb, windowX, windowZ } from './voxel';

const G = ART.glass;

// --- Mature suburb: community garden → outdoor rink → ball diamond → leisure centre -----------

/** Community garden (2 × 2 tiles): raised beds of crops inside a picket fence, a tool shed, a compost bin. */
export function communityGarden(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-12, 0, -12, 12, 0.3, 12, '#c9b48e')];
  parts.push(...fence(-11.5, -11.5, 11.5, -11.5), ...fence(-11.5, -11.5, -11.5, 11.5), ...fence(11.5, -11.5, 11.5, 11.5), ...fence(-11.5, 11.5, -2, 11.5), ...fence(2, 11.5, 11.5, 11.5));
  const crops = ['#6fae4f', '#8cc867', '#e46a5c', '#f2c14e', '#a77bd1', '#79b85a'];
  for (let i = 0; i < 6; i++) {
    const x0 = -9 + (i % 3) * 6.2;
    const z0 = i < 3 ? -2 : 4.5;
    parts.push(vb(x0, 0, z0, x0 + 4.6, 1.4, z0 + 4, WOOD), vb(x0 + 0.4, 1.4, z0 + 0.4, x0 + 4.2, 1.8, z0 + 3.6, '#7a5638'));
    for (let k = 0; k < 4; k++) parts.push(vb(x0 + 0.8 + k * 0.9, 1.8, z0 + 0.8, x0 + 1.4 + k * 0.9, 2.8 + rnd(seed, i, k), z0 + 3.2, pick(crops, rnd(seed, i, 7))));
  }
  // tool shed with a little gable roof
  const roof = pick(ART.roofs, rnd(seed, 3));
  parts.push(vb(-10, 0, -10.5, -3, 6, -5, '#d9c3a0'), ...gableRoof(-10, -3, -10.5, -5, 7, roof, '#d9c3a0', 0.6), vb(-7.5, 0, -5, -5.5, 4.5, -4.7, ART.door));
  // compost bin, a watering can, a sunflower row
  parts.push(vb(5, 0, -10, 10, 3, -6, WOOD_DARK), vb(5.4, 3, -9.6, 9.6, 3.3, -6.4, '#5a4030'), vb(1, 0, -6, 2.4, 1.4, -5, '#5b8fd6'));
  for (let x = -1; x <= 3; x += 2) parts.push(vb(x, 0, -10.5, x + 0.3, 6, -10.2, '#6f9a4f'), ...asSway([vb(x - 0.7, 6, -10.6, x + 1, 7.4, -10.1, '#f2c14e')]));
  return parts;
}

/** Outdoor rink (4 × 3 tiles): a full-size rink of ice inside white boards, lines, two nets, a players' hut and floodlights. */
export function outdoorRink(_seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-24, 0, -18, 24, 0.3, 18, '#e8e2d6'), vb(-21, 0.3, -11, 21, 0.6, 11, ICE)];
  parts.push(vb(-21.5, 0, -11.5, 21.5, 2.2, -11, '#fbf8f2'), vb(-21.5, 0, 11, 21.5, 2.2, 11.5, '#fbf8f2'), vb(-21.5, 0, -11.5, -21, 2.2, 11.5, '#fbf8f2'), vb(21, 0, -11.5, 21.5, 2.2, 11.5, '#fbf8f2'));
  parts.push(vb(-21.5, 0, -11.5, 21.5, 0.8, -11.2, '#5b8fd6'), vb(-21.5, 0, 11.2, 21.5, 0.8, 11.5, '#5b8fd6'));
  parts.push(vb(-0.3, 0.6, -11, 0.3, 0.65, 11, '#e46a5c'), vb(-10.3, 0.6, -11, -9.7, 0.65, 11, '#5b8fd6'), vb(9.7, 0.6, -11, 10.3, 0.65, 11, '#5b8fd6'));
  for (let a = 0; a < 16; a++) parts.push(vb(Math.cos((a / 16) * Math.PI * 2) * 3 - 0.3, 0.6, Math.sin((a / 16) * Math.PI * 2) * 3 - 0.3, Math.cos((a / 16) * Math.PI * 2) * 3 + 0.3, 0.65, Math.sin((a / 16) * Math.PI * 2) * 3 + 0.3, '#5b8fd6'));
  for (const s of [-1, 1]) {
    const x = s * 18;
    parts.push(vb(x - 1, 0.6, -1.6, x + 1, 2.6, -1.3, '#e46a5c'), vb(x - 1, 0.6, 1.3, x + 1, 2.6, 1.6, '#e46a5c'), vb(x + s * 0.7, 0.6, -1.6, x + s * 1, 2.6, 1.6, '#e46a5c'), vb(x - 1, 2.4, -1.6, x + 1, 2.6, 1.6, '#e46a5c'));
  }
  // players' hut and benches in front, floodlights at the corners
  parts.push(vb(-7, 0, 12.5, 7, 5, 16, '#d9c3a0'), vb(-7.5, 5, 12, 7.5, 5.6, 16.5, '#8f9bc0'), vb(-6, 1.4, 12.5, 6, 1.8, 13.5, ART.wood), ...windowZ(-4, -1, 2.4, 4, 16, G), ...windowZ(1, 4, 2.4, 4, 16, G));
  parts.push(...bench(-15, 14.5), ...bench(15, 14.5), ...lamp(-23, -17, 14), ...lamp(23, -17, 14), ...lamp(-23, 13, 14), ...lamp(23, 13, 14));
  return parts;
}

/**
 * Ball diamond (5 × 5 tiles): an infield of dirt with grass inside the bases, foul lines, a curved
 * outfield fence, a backstop behind home plate, dugouts, bleachers, a scoreboard and light towers.
 */
export function ballDiamond(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-30, 0, -30, 30, 0.3, 30, '#93cb6c')];
  const HZ = 22; // home plate; the outfield is towards −z
  const R = 40; // outfield fence radius from home
  // mowing stripes in the outfield
  for (let z = -28; z < HZ; z += 4) parts.push(vb(-28, 0.3, z, 28, 0.34, z + 2, '#9fd47a'));
  // infield dirt: the area within reach of the bases (a diamond plus an arc), grass inside the bases
  for (let x = -16; x < 16; x += 1)
    for (let z = HZ - 26; z < HZ + 3; z += 1) {
      const cx = x + 0.5;
      const cz = z + 0.5;
      const d = Math.abs(cx) + Math.abs(cz - (HZ - 10));
      const r = Math.hypot(cx, cz - HZ);
      const dirt = (d < 13 && r < 20) || r < 3.2;
      const grassInside = d < 7.6 && r > 3.2;
      if (dirt && !grassInside) parts.push(vb(x, 0.3, z, x + 1, 0.46, z + 1, '#d9a77f'));
    }
  parts.push(vb(-1.2, 0.46, HZ - 11.2, 1.2, 0.9, HZ - 8.8, '#d9a77f'), vb(-0.5, 0.9, HZ - 10.3, 0.5, 1, HZ - 9.7, '#fbf8f2'));
  for (const [x, z] of [[0, HZ], [10, HZ - 10], [0, HZ - 20], [-10, HZ - 10]]) parts.push(vb(x - 0.8, 0.46, z - 0.8, x + 0.8, 0.8, z + 0.8, '#fbf8f2'));
  // foul lines out to the fence
  for (let t = 1; t < R / Math.SQRT2; t += 1) for (const s of [-1, 1]) parts.push(vb(s * t - 0.25, 0.34, HZ - t - 0.25, s * t + 0.25, 0.4, HZ - t + 0.25, '#fbf8f2'));
  // outfield fence: green panels on an arc, yellow cap
  for (let a = -45; a <= 45; a += 3) {
    const rad = (a * Math.PI) / 180;
    const x = R * Math.sin(rad);
    const z = HZ - R * Math.cos(rad);
    parts.push(vb(x - 1.2, 0, z - 1.2, x + 1.2, 4, z + 1.2, '#2f6f4a'), vb(x - 1.2, 4, z - 1.2, x + 1.2, 4.4, z + 1.2, '#f2c14e'));
  }
  // backstop behind home plate
  for (let a = -60; a <= 60; a += 10) {
    const rad = (a * Math.PI) / 180;
    const x = 6 * Math.sin(rad);
    const z = HZ + 6 * Math.cos(rad);
    parts.push(vb(x - 0.2, 0, z - 0.2, x + 0.2, 9, z + 0.2, IRON));
  }
  for (let y = 1; y <= 9; y += 1.6) parts.push(vb(-5.2, y, HZ + 5.4, 5.2, y + 0.2, HZ + 6, '#9aa1ab'));
  // dugouts along the baselines, bleachers behind them
  for (const s of [-1, 1]) {
    parts.push(vb(s * 13 - 4, 0, HZ - 2, s * 13 + 4, 4, HZ + 1, '#8f9bc0'), vb(s * 13 - 4.4, 4, HZ - 2.4, s * 13 + 4.4, 4.6, HZ + 1.4, shade('#8f9bc0', -0.2)), vb(s * 13 - 3.4, 1.2, HZ - 1.6, s * 13 + 3.4, 1.6, HZ - 0.8, ART.wood));
    for (let r = 0; r < 4; r++) parts.push(vb(s * 13 - 5, r * 1.2, HZ + 2 + r * 1.4, s * 13 + 5, r * 1.2 + 1.2, HZ + 3.4 + r * 1.4, r % 2 ? '#9aa1ab' : '#c3c8cf'));
  }
  // scoreboard beyond the fence and light towers at the corners (not taller than the leisure centre)
  parts.push(vb(-26, 0, -27, -25, 9, -26, IRON), vb(-29, 9, -27.4, -20, 14, -26.6, '#2f4a3a'));
  for (let i = 0; i < 7; i++) parts.push(vb(-28 + i * 1.2, 11.5, -26.6, -27.4 + i * 1.2, 12.4, -26.5, LAMP, 'glow'));
  for (const [x, z] of [[-27, 10], [27, 10], [27, -22]]) parts.push(vb(x - 0.4, 0, z - 0.4, x + 0.4, 15, z + 0.4, IRON), vb(x - 1.6, 15, z - 0.6, x + 1.6, 16.4, z + 0.6, LAMP, 'glow'));
  parts.push(...smallTree(-27, 27, seed, 9), ...smallTree(27, 27, seed + 1, 9));
  return parts;
}

/**
 * Leisure centre (3 × 3 tiles), the mature-suburb track's landmark: a pool hall with a big glass
 * front and a blue roof, a twisting water-slide tube outside, an entrance canopy and a plain sign panel.
 */
export function leisureCentre(seed: number): BoxPart[] {
  const wall = pick(['#e9dccb', '#eef0d8', '#f3dcc0'], rnd(seed, 1));
  const parts: BoxPart[] = [vb(-18, 0, -18, 18, 0.3, 18, PAVING)];
  parts.push(vb(-15, 0, -14, 9, 12, 6, wall), ...hipRoof(-16, 10, -15, 7, 13, '#5b8fd6', 0.5, 3));
  for (let x = -13; x < 7; x += 4) parts.push(...windowZ(x, x + 3, 2, 10, 6, G));
  parts.push(vb(-4, 0, 6, 4, 0.3, 11, '#c9c2b4'), vb(-5, 7, 6, 5, 7.8, 11, '#e46a5c'), vb(-4.6, 0, 10.2, -3.8, 7, 11, IRON), vb(3.8, 0, 10.2, 4.6, 7, 11, IRON));
  parts.push(vb(-14, 8, 6, -8, 11, 6.5, '#fbf8f2'), vb(-13.4, 8.6, 6.5, -8.6, 10.4, 6.6, '#5b8fd6'));
  // the slide: a tower and a tube that winds down beside the hall
  parts.push(vb(10, 0, -12, 15, 16, -7, '#f2c14e'), vb(9.6, 16, -12.4, 15.4, 17, -6.6, shade('#f2c14e', -0.2)));
  const tube = ['#e46a5c', '#6fbf8a'];
  const path: [number, number, number][] = [[15, 14, -9], [16, 12, -4], [14, 10, 0], [10.5, 8, 2], [12, 6, 6], [16, 4, 8], [15, 2, 12], [12, 0.5, 14]];
  // walk the path in short steps so the tube reads as one winding piece, colour bands every few steps
  for (let i = 0, n = 0; i < path.length - 1; i++) {
    const [x0, y0, z0] = path[i];
    const [x1, y1, z1] = path[i + 1];
    const steps = Math.ceil(Math.hypot(x1 - x0, z1 - z0) / 0.8);
    for (let k = 0; k < steps; k++, n++) {
      const t = k / steps;
      const x = x0 + (x1 - x0) * t;
      const y = y0 + (y1 - y0) * t;
      const z = z0 + (z1 - z0) * t;
      parts.push(vb(x - 1.4, y, z - 1.4, x + 1.4, y + 2.2, z + 1.4, tube[Math.floor(n / 4) % 2]));
    }
  }
  parts.push(vb(9, 0, 11, 16, 0.6, 17, WATER));
  parts.push(...lamp(-16, 12, 9), ...lamp(6, 14, 9), ...smallTree(-12, 14, seed));
  return parts;
}

// --- New suburb: stone entrance gate → storm pond → gazebo square → community hub -------------

/** Stone entrance gate (2 × 1 tiles): two stacked-stone pillars with lanterns, a low wall with a blank plaque, flower beds. */
export function stoneGate(seed: number): BoxPart[] {
  const parts: BoxPart[] = [];
  const stone = (x0: number, y0: number, z0: number, x1: number, y1: number, z1: number, i: number) => vb(x0, y0, z0, x1, y1, z1, shade(STONE, (rnd(seed, i, 5) - 0.5) * 0.18));
  for (const s of [-1, 1]) {
    const x = s * 9;
    for (let y = 0, i = 0; y < 10; y += 1.6, i++) parts.push(stone(x - 2 + (i % 2) * 0.3, y, -2, x + 2 - (i % 2) * 0.3, y + 1.6, 2, i + (s > 0 ? 20 : 0)));
    parts.push(vb(x - 2.4, 10, -2.4, x + 2.4, 10.8, 2.4, '#8f8778'), vb(x - 1, 10.8, -1, x + 1, 13, 1, '#ffe7a3', 'glow'), vb(x - 1.3, 13, -1.3, x + 1.3, 13.6, 1.3, IRON));
  }
  for (let x = -7, i = 40; x < 7; x += 2.4, i++) parts.push(stone(x, 0, -1.4, x + 2.4, 3.2 + (i % 2) * 0.3, 1.4, i));
  parts.push(vb(-4.5, 3.5, 1.3, 4.5, 6.5, 1.7, '#8a6a3c'), vb(-4, 4, 1.7, 4, 6, 1.8, '#c9a66b'), vb(-0.3, 3.2, -0.3, 0.3, 3.5, 0.3, '#8f8778'));
  parts.push(...flowerBed(-11.5, 2.5, 7, 3, seed), ...flowerBed(4.5, 2.5, 7, 3, seed + 1));
  return parts;
}

/** Storm pond (4 × 3 tiles): a stone-edged pond with a fountain, reeds, a boardwalk out over the water and benches on the path around it. */
export function stormPond(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-24, 0, -18, 24, 0.25, 18, '#93cb6c')];
  const inPond = (x: number, z: number) => ((x + 0.5) / 19) ** 2 + ((z + 0.5) / 12) ** 2 < 1;
  const nearPond = (x: number, z: number) => ((x + 0.5) / 22) ** 2 + ((z + 0.5) / 15) ** 2 < 1;
  for (let x = -24; x < 24; x += 2)
    for (let z = -18; z < 18; z += 2) {
      if (inPond(x + 1, z + 1)) parts.push(vb(x, 0, z, x + 2, 0.4, z + 2, WATER));
      else if (inPond(x - 1, z + 1) || inPond(x + 3, z + 1) || inPond(x + 1, z - 1) || inPond(x + 1, z + 3)) parts.push(vb(x, 0, z, x + 2, 0.8, z + 2, shade(STONE, (rnd(seed, x, z) - 0.5) * 0.15)));
      else if (nearPond(x + 1, z + 1)) parts.push(vb(x, 0.25, z, x + 2, 0.32, z + 2, '#d6d0c4'));
    }
  parts.push(vb(-1, 0.4, -1, 1, 1, 1, '#cfc6b8'), vb(-0.4, 1, -0.4, 0.4, 8, 0.4, '#e9f6fc'), vb(-1.8, 7.4, -1.8, 1.8, 8.4, 1.8, '#e9f6fc'));
  for (const [x, z] of [[-16, -5], [-14, 7], [15, -7], [13, 8], [-5, -11], [6, -11]]) parts.push(...reeds(x, z, seed + x));
  parts.push(vb(5, 0.6, 7, 9, 1.2, 17, WOOD));
  for (let z = 7; z < 17; z += 1.2) parts.push(vb(5, 1.15, z, 9, 1.25, z + 0.1, WOOD_DARK));
  parts.push(...bench(-12, 15.8), ...bench(18, -13), ...lamp(-21, 14, 9), ...lamp(21, 14, 9), ...lamp(-21, -14, 9));
  return parts;
}

/** Gazebo square (2 × 2 tiles): a paved square, a white gazebo with a red stepped roof, benches, lamps and flower beds. */
export function gazeboSquare(seed: number): BoxPart[] {
  const roof = pick(['#d0453c', '#c9483c', '#5b8fd6'], rnd(seed, 2));
  const parts: BoxPart[] = [vb(-12, 0, -12, 12, 0.3, 12, PAVING), vb(-6, 0.3, -6, 6, 1.2, 6, '#fbf8f2')];
  for (const [x, z] of [[-5, -5], [5, -5], [-5, 5], [5, 5], [0, -5.5], [-5.5, 0], [5.5, 0]]) parts.push(vb(x - 0.4, 1.2, z - 0.4, x + 0.4, 8, z + 0.4, '#fbf8f2'));
  parts.push(vb(-5.6, 2.6, -5.6, 5.6, 3, -5.2, '#fbf8f2'), vb(-5.6, 2.6, -5.6, -5.2, 3, 5.6, '#fbf8f2'), vb(5.2, 2.6, -5.6, 5.6, 3, 5.6, '#fbf8f2'));
  for (let i = 0; i < 4; i++) parts.push({ ...vb(-6.8 + i * 1.6, 8 + i, -6.8 + i * 1.6, 6.8 - i * 1.6, 9 + i, 6.8 - i * 1.6, i % 2 ? shade(roof, -0.08) : roof), tag: 'roof' });
  parts.push(vb(-0.3, 12, -0.3, 0.3, 13.6, 0.3, '#e9c46a'));
  parts.push(...bench(0, 9.5), ...bench(-9.5, 0, false), ...bench(9.5, 0, false));
  parts.push(...lamp(-10.5, -10.5), ...lamp(10.5, -10.5), ...flowerBed(-11.5, 7, 5, 4, seed), ...flowerBed(6.5, 7, 5, 4, seed + 3));
  return parts;
}

/**
 * Community hub (3 × 3 tiles), the new-suburb track's landmark: a modern hall of wood and glass
 * under a sloped roof, a tall colourful sign pylon (no text), a small outdoor rink and a lit plaza.
 */
export function communityHub(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-18, 0, -18, 18, 0.3, 18, PAVING)];
  // the hall: wood cladding, a glass front, a roof that slopes up towards the front
  parts.push(vb(-16, 0, -15, 6, 10, 2, '#c9a27a'));
  for (let i = 0; i < 5; i++) parts.push({ ...vb(-17, 10 + i * 0.8, -16 + i * 3.6, 7, 11 + i * 0.8, -12 + i * 3.6, i % 2 ? '#4a5060' : '#5a6070'), tag: 'roof' });
  parts.push(vb(-15, 0.3, 2, 5, 9, 2.4, G), vb(-15.4, 0, 2, -14.8, 10, 2.6, '#4a5060'));
  for (let x = -11; x <= 3; x += 4) parts.push(vb(x - 0.3, 0, 2.1, x + 0.3, 9.4, 2.7, '#4a5060'));
  parts.push(...windowX(-13, -5, 3, 8, 6, G));
  // sign pylon: stacked colour blocks
  const colours = ['#e46a5c', '#f2c14e', '#6fbf8a', '#5b8fd6'];
  for (let i = 0; i < 6; i++) parts.push(vb(9, i * 3, 6, 12, i * 3 + 3, 8.4, colours[(i + Math.floor(rnd(seed, 4) * 4)) % 4]));
  parts.push(vb(8.6, 18, 5.6, 12.4, 18.6, 8.8, '#4a5060'), vb(9.6, 15, 8.4, 11.4, 17, 8.6, '#ffe7a3', 'glow'));
  // a small rink beside the hall
  parts.push(vb(8, 0.3, -16, 17, 0.6, -4, ICE), vb(7.6, 0, -16.4, 17.4, 1.8, -16, '#fbf8f2'), vb(7.6, 0, -4.4, 17.4, 1.8, -4, '#fbf8f2'), vb(7.6, 0, -16.4, 8, 1.8, -4, '#fbf8f2'), vb(17, 0, -16.4, 17.4, 1.8, -4, '#fbf8f2'));
  parts.push(...lamp(-16, 15), ...lamp(4, 15), ...bench(-6, 12), ...smallTree(-12, 9, seed), ...smallTree(14, 14, seed + 1));
  return parts;
}
