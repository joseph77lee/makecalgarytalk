/**
 * Unique landmarks of the priority communities, second batch (community-identity build map,
 * 2026-11-26): lakes, river, main streets. Voxel reinterpretations of the operator's reference
 * photos, no logos, sign text or business names. Voxels (12 per tile), front +z, centred.
 */
import { asSway, type BoxPart } from '../boxes';
import { houseParts, houseTypeFor } from './houses';
import { sailboat } from './landmarks';
import { bench, fence, flowerBed, IRON, LAMP, lamp, PAVING, reeds, smallTree, STONE, WATER, WOOD, WOOD_DARK } from './placeParts';
import { ART } from './samples';
import { gableRoof, hipRoof, pick, rnd, shade, vb, vmove, vturn, windowX, windowZ } from './voxel';

const G = ART.glass;
const WHITE = '#f4f1ea';
const SAND = '#ecd9a6';
const BRIGHT = ['#e46a5c', '#f2c14e', '#6fbf8a', '#5b8fd6', '#a77bd1'];

/** Water over a rectangle (voxels), drawn in 2-voxel cells where `inside` says so. */
function water(x0: number, z0: number, x1: number, z1: number, inside: (x: number, z: number) => boolean = () => true): BoxPart[] {
  const parts: BoxPart[] = [];
  for (let x = x0; x < x1; x += 2) for (let z = z0; z < z1; z += 2) if (inside(x + 1, z + 1)) parts.push(vb(x, 0, z, x + 2, 0.35, z + 2, WATER));
  return parts;
}

/** A lakehouse (one of the game's houses) whose windows light at night like every scenery house. */
const lakehouse = (seed: number, facing: number, x: number, z: number): BoxPart[] =>
  vmove(houseParts(houseTypeFor('suburb', seed), seed, facing), x, 0, z);

/** A small rowboat along x. */
const rowboat = (x: number, z: number, c: string): BoxPart[] => [vb(x - 2.4, 0.2, z - 0.9, x + 2.4, 1.2, z + 0.9, c), vb(x - 3, 0.3, z - 0.5, x + 3, 1, z + 0.5, c), vb(x - 1.8, 0.9, z - 0.7, x + 1.8, 1.1, z + 0.7, WOOD)];

// --- Main streets ---------------------------------------------------------------------------------

/**
 * MCT — high-street clock tower (3 × 3 tiles): a red clapboard clock tower with white trim, clock
 * faces, a belfry and a weathervane, in a row of colourful two-storey shops along a lamplit street.
 */
export function highStreetClockTower(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-18, 0, -18, 18, 0.3, 18, PAVING), vb(-18, 0.3, 4, 18, 0.36, 12, '#bdb6aa')];
  // shops either side of the tower
  const shop = (x0: number, x1: number, wall: string, roof: string, porch: boolean, i: number) => {
    parts.push(vb(x0, 0.3, -14, x1, 15, 0, wall), vb(x0 - 0.3, 15, -14.3, x1 + 0.3, 16, 0.3, shade(wall, -0.25)));
    parts.push(vb(x0 + 1, 0.3, 0, x1 - 1, 6.5, 0.3, G), vb(x0 + 0.5, 6.8, 0, x1 - 0.5, 7.6, 2.8, pick(['#2f6f5e', '#c0392b', '#2e4a7a'], rnd(seed, i))));
    for (let x = x0 + 1.5; x < x1 - 2; x += 3) parts.push(...windowZ(x, x + 1.8, 9.5, 13, 0, G));
    if (porch) {
      parts.push(vb(x0, 0.3, 0, x1, 1, 4, '#e9dccb'), vb(x0, 7.6, 0, x1, 8.2, 4, roof));
      for (let x = x0 + 0.5; x <= x1; x += (x1 - x0 - 1) / 2) parts.push(vb(x, 1, 3.3, x + 0.7, 7.6, 4, WHITE));
    }
  };
  shop(-17, -11, '#c97b5a', '#5a5f6a', false, 1);
  shop(-11, -5, '#8a3a3a', '#5a5f6a', false, 2);
  shop(5, 11, '#d0453c', '#5a5f6a', true, 3);
  shop(11, 17, '#8fa3c0', '#5a5f6a', true, 4);
  for (const [x0, x1, c] of [[-17, -5, '#5a5f6a'], [5, 17, '#5a5f6a']] as const) parts.push(...gableRoof(x0, x1, -14, 0, 16, c, '#e9dccb', 0.5));
  // the clock tower
  const RED = '#c4362c';
  parts.push(vb(-5, 0.3, -8, 5, 26, 2, RED));
  for (let y = 2; y < 26; y += 1.2) parts.push(vb(-5.1, y, 1.95, 5.1, y + 0.15, 2.1, shade(RED, -0.12)));
  parts.push(vb(-5.3, 0.3, 1.9, -4.7, 26, 2.3, WHITE), vb(4.7, 0.3, 1.9, 5.3, 26, 2.3, WHITE), vb(-5.6, 13, -8.3, 5.6, 14, 2.4, WHITE), vb(-5.8, 26, -8.6, 5.8, 27, 2.6, WHITE));
  parts.push(vb(-2, 0.3, 2, 2, 6, 2.3, ART.door), vb(-2.6, 6, 2, 2.6, 6.6, 2.4, WHITE));
  // clock faces on the front and the side, lit at night
  parts.push(vb(-3, 18, 2, 3, 24, 2.3, WHITE), vb(-2.6, 18.4, 2.3, 2.6, 23.6, 2.45, '#fbf6e6', 'glow'), vb(-0.2, 21, 2.45, 0.2, 23.2, 2.6, '#2b2f3a'), vb(-0.2, 20.8, 2.45, 1.8, 21.2, 2.6, '#2b2f3a'));
  parts.push(vb(5, 18, -6, 5.3, 24, 0, WHITE), vb(5.3, 18.4, -5.6, 5.45, 23.6, -0.4, '#fbf6e6', 'glow'));
  // belfry and cap
  parts.push(vb(-4, 27, -7, 4, 28, 1, '#5a4030'));
  for (const [x, z] of [[-3.6, -6.6], [3, -6.6], [-3.6, 0.4], [3, 0.4]]) parts.push(vb(x, 28, z, x + 0.6, 33, z + 0.6, WHITE));
  parts.push(vb(-1.2, 28, -4.2, 1.2, 30.4, -1.8, '#c9a66b'));
  parts.push(...hipRoof(-4.5, 4.5, -7.5, 1.5, 34, '#5a4030', 0.8, 5), vb(-0.2, 39, -3.2, 0.2, 43, -2.8, IRON), vb(-1.6, 41.6, -3.1, 1.6, 42, -2.9, IRON));
  // street: lamps, trees, flower pots, a bench
  for (const x of [-14, -2, 8, 16]) parts.push(...lamp(x, 3.4, 9));
  parts.push(...smallTree(-8, 14.5, seed, 9), ...smallTree(8, 14.5, seed + 1, 9), ...bench(0, 15), ...flowerBed(-17, 13, 5, 4, seed), ...flowerBed(12, 13, 5, 4, seed + 2));
  return parts;
}

/**
 * ING — twin mansard buildings (3 × 2 tiles): two white three-storey buildings with dark mansard
 * roofs and dormers, red doors and red French doors behind little balconies, shop fronts below,
 * a lane between them and a sidewalk with lamps.
 */
export function twinMansards(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-18, 0, -12, 18, 0.3, 12, '#bdb6aa'), vb(-18, 0.3, 3, 18, 0.5, 9, PAVING)];
  const RED = '#d0332f';
  const ROOF = '#4a4f5a';
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -17 : 4;
    const x1 = x0 + 13;
    const cx = (x0 + x1) / 2;
    parts.push(vb(x0, 0.3, -10, x1, 6, 3, '#9aa1ab'), vb(x0, 6, -10, x1, 15, 3, '#eeeae4'), vb(x0 - 0.3, 6, -10.3, x1 + 0.3, 6.6, 3.4, '#5a5f6a'));
    // shop front and door
    parts.push(vb(x0 + 1, 0.8, 3, cx - 1, 5.4, 3.3, G), vb(cx + 1.5, 0.3, 3, cx + 3.5, 5.4, 3.3, RED), vb(x0 + 1, 4.6, 3.3, cx - 1, 5.4, 3.5, pick(['#c9a66b', '#5b8fd6'], rnd(seed, s))));
    // first floor: a red French door with a balcony between two windows
    parts.push(vb(cx - 1.6, 7.6, 3, cx + 1.6, 13, 3.3, RED), vb(cx - 0.15, 7.6, 3.3, cx + 0.15, 13, 3.4, WHITE), vb(cx - 2.2, 7.4, 3, cx + 2.2, 7.8, 4.6, IRON));
    for (let x = cx - 2.2; x <= cx + 2.2; x += 0.8) parts.push(vb(x, 7.8, 4.3, x + 0.2, 9.6, 4.5, IRON));
    parts.push(...windowZ(x0 + 1.4, x0 + 3.4, 8.6, 12, 3, G), ...windowZ(x1 - 3.4, x1 - 1.4, 8.6, 12, 3, G));
    // mansard: a steep dark roof with two dormers
    for (let i = 0; i < 6; i++) parts.push({ ...vb(x0 - 0.5 + i * 0.25, 15 + i * 1.3, -10.5 + i * 0.25, x1 + 0.5 - i * 0.25, 16.3 + i * 1.3, 3.5 - i * 0.6, i % 2 ? shade(ROOF, -0.06) : ROOF), tag: 'roof' });
    for (const dx of [x0 + 3.5, x1 - 3.5]) {
      parts.push(vb(dx - 1.6, 16, 1, dx + 1.6, 20.5, 3.2, '#eeeae4'), vb(dx - 1, 16.6, 3.2, dx + 1, 19.6, 3.4, G));
      for (let i = 0; i < 3; i++) parts.push({ ...vb(dx - 2.2 + i * 0.8, 20.5 + i, 0.6, dx + 2.2 - i * 0.8, 21.5 + i, 3.6, ROOF), tag: 'roof' });
    }
    parts.push(vb(x0 - 0.5, 22.8, -10.5, x1 + 0.5, 23.3, -0.4, shade(ROOF, -0.12)));
  }
  // the lane between them, a red door at its end, a low back building
  parts.push(vb(-4, 0.3, -11, 4, 6, -9, '#4a4f5a'), vb(-1, 0.3, -9, 1, 4, -8.8, RED));
  for (const x of [-12, 0, 12]) parts.push(...lamp(x, 7.8, 9));
  parts.push(...smallTree(-15, 9.4, seed, 8), ...smallTree(15.4, 9.4, seed + 1, 8));
  return parts;
}

/**
 * HIL — corner tower street (3 × 2 tiles): an orange-brick corner block whose rounded corner is a
 * green-clad tower with glass bands and a dark conical cap, shop fronts below and colourful
 * banners on the lamp posts along the street.
 */
export function cornerTowerStreet(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-18, 0, -12, 18, 0.3, 12, '#bdb6aa'), vb(-18, 0.3, 2, 18, 0.5, 8, PAVING)];
  const BRICK = '#d9774a';
  // the block: along the street (x) and back along the side street
  parts.push(vb(-16, 0.3, -10, 4, 20, 2, BRICK), vb(4, 0.3, -10, 10, 20, -4, BRICK));
  for (let y = 4; y < 20; y += 2) parts.push(vb(-16, y, 1.9, 4, y + 0.15, 2.05, shade(BRICK, -0.12)));
  for (let x = -14; x < 2; x += 3.4) for (const y of [8, 13]) parts.push(...windowZ(x, x + 2, y, y + 3, 2, G));
  parts.push(vb(-15, 0.5, 2, 2, 6, 2.3, G), vb(-15.4, 6, 2, 2.4, 7, 2.6, '#3a3f4c'), vb(-16.4, 20, -10.4, 4.4, 21, 2.4, shade(BRICK, -0.25)));
  // the round corner tower
  const TEAL = '#4f8f7a';
  const ring = (y0: number, y1: number, r: number, c: string) => [vb(6 - r, y0, -1 - r * 0.42, 6 + r, y1, -1 + r * 0.42, c), vb(6 - r * 0.42, y0, -1 - r, 6 + r * 0.42, y1, -1 + r, c), vb(6 - r * 0.72, y0, -1 - r * 0.72, 6 + r * 0.72, y1, -1 + r * 0.72, c)];
  for (let y = 0.3, i = 0; y < 24; y += 3, i++) parts.push(...ring(y, y + 3, 5, i % 2 ? TEAL : '#7fb3c0'));
  parts.push(...ring(24, 25, 5.6, '#2b2f3a'), ...ring(25, 26.4, 4.6, '#3a3f4c'), ...ring(26.4, 28, 3.4, '#3a3f4c'), ...ring(28, 29.6, 2.2, '#3a3f4c'), vb(5.5, 29.6, -1.5, 6.5, 31.2, -0.5, '#3a3f4c'));
  parts.push(...ring(5.6, 6.4, 5.3, '#2b2f3a'), ...ring(14.6, 15.4, 5.3, '#2b2f3a'));
  parts.push(vb(3, 6.2, 3.9, 9, 6.6, 4.2, LAMP, 'glow'));
  // street lamps with banners and a painted crosswalk
  for (const x of [-12, -2, 14]) {
    parts.push(...lamp(x, 7.6, 10));
    const c = pick(BRIGHT, rnd(seed, x));
    parts.push(...asSway([vb(x + 0.3, 6, 7.5, x + 2.4, 9.4, 7.7, c), vb(x + 0.3, 6, 7.4, x + 2.4, 7.2, 7.8, pick(BRIGHT, rnd(seed, x, 2)))]));
  }
  for (let x = 12; x < 18; x += 1.6) parts.push(vb(x, 0.3, -11, x + 0.9, 0.36, 2, '#fbf8f2'));
  parts.push(vb(-8, 0.5, 9, 6, 2, 11, pick(BRIGHT, rnd(seed, 9))), vb(-8, 2, 9, 6, 2.4, 11, pick(BRIGHT, rnd(seed, 10))));
  return parts;
}

/**
 * ALT — main-street welcome arch (3 × 2 tiles): a red ribbon arch on two dark posts spanning the
 * street (no lettering), modern mixed-use blocks either side with shops below, trees and a crosswalk.
 */
export function welcomeArchStreet(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-18, 0, -12, 18, 0.3, 12, '#bdb6aa'), vb(-6, 0.3, -12, 6, 0.36, 12, '#8f949c')];
  for (let z = -11; z < 12; z += 3) parts.push(vb(-0.2, 0.36, z, 0.2, 0.4, z + 1.6, '#f2c14e'));
  for (let x = -5.5; x < 6; x += 1.6) parts.push(vb(x, 0.36, 7, x + 0.9, 0.42, 10, '#fbf8f2'));
  // blocks either side: dark grey upper floors with balconies, glass shops below
  for (const s of [-1, 1]) {
    const x0 = s < 0 ? -18 : 8;
    const x1 = x0 + 10;
    parts.push(vb(x0, 0.3, -12, x1, 26, 4, s < 0 ? '#5a6070' : '#b8765a'), vb(x0, 26, -12, x1, 27, 4.3, '#3a3f4c'));
    const face = s < 0 ? x1 : x0;
    parts.push(vb(face - 0.3 * s, 0.6, -10, face + 0.3 * s, 6, 2, G));
    for (let y = 9; y < 25; y += 4) parts.push(...(s < 0 ? windowX(-10, -6, y, y + 2.6, face, G) : windowX(-2, 2, y, y + 2.6, face - 0.6, G)), vb(face, y - 0.6, -10, face + 1.6 * s, y - 0.2, -5, IRON));
  }
  // the arch: two dark posts and a red ribbon curving over the street
  for (const s of [-1, 1]) parts.push(vb(s * 7 - 0.7, 0.3, 3.3, s * 7 + 0.7, 16, 4.7, '#2b2f3a'));
  for (let i = 0; i <= 20; i++) {
    const t = i / 20;
    const x = -7 + t * 14;
    const y = 15 + Math.sin(t * Math.PI) * 4;
    parts.push(vb(x - 0.6, y, 3.4, x + 0.6, y + 2.4, 4.6, i % 2 ? '#d0332f' : '#c02a26'));
  }
  for (let i = 1; i < 20; i += 2) {
    const t = i / 20;
    parts.push(vb(-7 + t * 14 - 0.3, 15 + Math.sin(t * Math.PI) * 4 + 1, 4.6, -7 + t * 14 + 0.3, 15 + Math.sin(t * Math.PI) * 4 + 1.5, 4.75, LAMP, 'glow'));
  }
  parts.push(...smallTree(-7.5, -8, seed, 9), ...smallTree(7.5, -8, seed + 1, 9), ...lamp(-6.8, 10.5, 9), ...lamp(6.8, 10.5, 9));
  return parts;
}

// --- Lakes ----------------------------------------------------------------------------------------

/**
 * MAH — lake beach club (5 × 4 tiles): a long two-storey clubhouse in slate blue with stone piers
 * and white trim, a lawn, a wide sandy beach with blue sun shades, and swim buoys out on the lake.
 */
export function lakeBeachClub(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-30, 0, -24, 30, 0.3, -2, '#93cb6c'), vb(-30, 0, -2, 30, 0.4, 10, SAND), ...water(-30, 10, 30, 24)];
  const BLUE = '#56637a';
  // clubhouse
  parts.push(vb(-24, 0.3, -23, 24, 9, -13, '#a9a196'), vb(-24, 9, -23, 24, 17, -13, BLUE));
  for (let x = -24; x <= 24; x += 6) parts.push(vb(x - 0.8, 0.3, -13.4, x + 0.8, 17, -12.6, '#a9a196'));
  for (let x = -22; x < 22; x += 6) parts.push(...windowZ(x + 1, x + 4.4, 2.5, 7.5, -13, G), ...windowZ(x + 1, x + 4.4, 11, 15.4, -13, G));
  parts.push(vb(-24, 9, -13, 24, 9.6, -10.6, WHITE), vb(-24, 10.6, -10.8, 24, 11.2, -10.4, WHITE));
  parts.push(...hipRoof(-25, 25, -23, -12, 18, '#6b6f78', 1, 5));
  // the middle gable with a blank white sign panel
  parts.push(vb(-6, 17, -13.2, 6, 23, -12.6, BLUE), vb(-4.5, 18.5, -12.6, 4.5, 21, -12.3, WHITE), ...gableRoof(-7, 7, -16, -12, 23, '#6b6f78', BLUE, 0.6));
  parts.push(vb(-3, 0.3, -12.6, 3, 7, -12.3, ART.glassDark), vb(-23, 7.6, -12.4, 23, 8, -12, LAMP, 'glow'));
  // lawn paths, lamps, trees, playground
  for (let z = -12; z < -2; z += 2) parts.push(vb(-2, 0.3, z, 2, 0.38, z + 2, '#d6d0c4'));
  parts.push(...lamp(-8, -6, 9), ...lamp(8, -6, 9), ...smallTree(-27, -6, seed, 10), ...smallTree(27, -8, seed + 1, 10), ...smallTree(-18, -4, seed + 2, 8));
  parts.push(vb(14, 0.3, -9, 22, 0.5, -3, '#e0b070'), vb(15, 0.5, -8, 15.4, 6, -7.6, '#5b8fd6'), vb(20.6, 0.5, -8, 21, 6, -7.6, '#5b8fd6'), vb(15, 6, -8, 21, 6.4, -7.6, '#5b8fd6'), vb(17, 1.4, -8, 19, 1.8, -7.6, '#f2c14e'));
  // blue sun shades on the beach
  for (const [x, z] of [[-20, 3], [-9, 5], [4, 2.5], [15, 4.5], [25, 2]]) parts.push(vb(x - 0.2, 0.4, z - 0.2, x + 0.2, 6, z + 0.2, WHITE), ...asSway([vb(x - 3, 6, z - 3, x + 3, 6.6, z + 3, '#2e5aa8'), vb(x - 1.8, 6.6, z - 1.8, x + 1.8, 7.2, z + 1.8, '#2e5aa8')]), vb(x + 1, 0.4, z + 0.5, x + 4, 0.7, z + 1.8, pick(BRIGHT, rnd(seed, x))));
  // swim area buoys and a lifeguard chair
  for (let x = -18; x <= 10; x += 2) parts.push(vb(x - 0.4, 0.35, 15.6, x + 0.4, 0.9, 16.4, '#fbf8f2'));
  parts.push(vb(18, 0.4, 7, 18.4, 6, 7.4, WHITE), vb(20, 0.4, 7, 20.4, 6, 7.4, WHITE), vb(17.6, 6, 6.6, 20.8, 6.6, 9, '#e0453c'), vb(17.6, 6.6, 6.6, 20.8, 8.4, 7, '#e0453c'));
  return parts;
}

/**
 * LKB — lake with a waterfall hill (4 × 4 tiles): a blue lake framed by a stepped rocky hill with a
 * waterfall tumbling into it, a gazebo on top, an island of spruces and docks along the shore.
 */
export function waterfallHillLake(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-24, 0, -24, 24, 0.3, 24, '#93cb6c')];
  const inLake = (x: number, z: number) => ((x - 4) / 19) ** 2 + ((z + 1) / 17) ** 2 < 1;
  parts.push(...water(-24, -24, 24, 24, inLake));
  // the hill in the back-left corner: three stepped levels of grass on rock
  const levels: [number, number, number][] = [[-24, -24, 0], [-22, -22, 1], [-20, -20, 2]];
  levels.forEach(([x0, z0], i) => {
    const size = 18 - i * 5;
    parts.push(vb(x0, 0, z0, x0 + size, 4 + i * 4, z0 + size, shade('#9c9488', (rnd(seed, i) - 0.5) * 0.1)), vb(x0, 4 + i * 4, z0, x0 + size, 5 + i * 4, z0 + size, '#8cc867'));
  });
  // a pool on the top level spills down the three front faces into the lake
  parts.push(vb(-17, 13, -15, -13, 13.4, -12, WATER));
  for (const [z, y0, y1] of [[-12, 9, 13.2], [-9, 5, 9.2], [-6, 0.3, 5.2]] as const) {
    parts.push(vb(-17, y0, z, -13, y1, z + 0.6, '#cfeefc'));
    for (let i = 0; i < 3; i++) parts.push(vb(-16.6 + i * 1.3, y0 + 0.5 + rnd(seed, z, i) * 2, z + 0.5, -16.1 + i * 1.3, y0 + 2 + rnd(seed, z, i) * 2, z + 0.75, '#ffffff'));
    if (z > -12) parts.push(vb(-17, y0, z - 3, -13, y0 + 0.4, z, WATER));
  }
  parts.push(vb(-18, 0.3, -5.4, -12, 0.8, -3, '#f2fbff'));
  // gazebo on top
  const gx = -16;
  const gz = -18;
  for (const [dx, dz] of [[-1.6, -1.6], [1.6, -1.6], [-1.6, 1.6], [1.6, 1.6]]) parts.push(vb(gx + dx - 0.3, 13, gz + dz - 0.3, gx + dx + 0.3, 17.5, gz + dz + 0.3, WHITE));
  parts.push(...hipRoof(gx - 2, gx + 2, gz - 2, gz + 2, 18, '#c9483c', 0, 3), vb(gx - 0.6, 15.6, gz - 0.6, gx + 0.6, 16.6, gz + 0.6, LAMP, 'glow'));
  // island of spruces and docks with boats
  parts.push(vb(6, 0, -4, 14, 0.9, 2, '#8cc867'));
  for (const [x, z] of [[8, -2], [11, -1], [10, 1]]) parts.push(vb(x - 0.4, 0.9, z - 0.4, x + 0.4, 3, z + 0.4, ART.trunk), ...asSway([vb(x - 1.8, 2.4, z - 1.8, x + 1.8, 5.4, z + 1.8, ART.spruce[0]), vb(x - 1.1, 5.4, z - 1.1, x + 1.1, 8, z + 1.1, ART.spruce[1])]));
  for (const x of [-4, 6, 15]) {
    parts.push(vb(x - 1.2, 0.2, 13, x + 1.2, 0.9, 20, WOOD));
    parts.push(...rowboat(x + 3.6, 15.5, pick(BRIGHT, rnd(seed, x))));
  }
  parts.push(...lakehouse(seed + 3, 0, -6, 17), ...smallTree(20, -20, seed, 10), ...smallTree(-20, 20, seed + 4, 10), ...reeds(-6, 6, seed));
  return parts;
}

/**
 * MCK — island in the lake (4 × 4 tiles): a round island of lakehouses and spruces in the middle of
 * a lake, joined to the shore by a little bridge, docks with boats around it.
 */
export function islandInTheLake(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-24, 0, -24, 24, 0.3, 24, '#93cb6c')];
  const inLake = (x: number, z: number) => (x / 22) ** 2 + ((z + 2) / 19) ** 2 < 1;
  const onIsland = (x: number, z: number) => (x / 10) ** 2 + ((z + 3) / 8.5) ** 2 < 1;
  parts.push(...water(-24, -24, 24, 24, (x, z) => inLake(x, z) && !onIsland(x, z)));
  for (let x = -12; x < 12; x += 2) for (let z = -13; z < 7; z += 2) if (onIsland(x + 1, z + 1)) parts.push(vb(x, 0.3, z, x + 2, 1, z + 2, '#8cc867'));
  parts.push(...lakehouse(seed, 0, -5, -6).map((b) => ({ ...b, p: [b.p[0], b.p[1] + 0.7 / 12, b.p[2]] as [number, number, number] })));
  parts.push(...lakehouse(seed + 5, 0, 5, -2).map((b) => ({ ...b, p: [b.p[0], b.p[1] + 0.7 / 12, b.p[2]] as [number, number, number] })));
  for (const [x, z] of [[-7, 1], [6, -9], [-1, -10], [8, 2]]) parts.push(vb(x - 0.4, 1, z - 0.4, x + 0.4, 3, z + 0.4, ART.trunk), ...asSway([vb(x - 1.8, 2.4, z - 1.8, x + 1.8, 5.4, z + 1.8, ART.spruce[0]), vb(x - 1.1, 5.4, z - 1.1, x + 1.1, 8, z + 1.1, ART.spruce[1])]));
  // bridge to the front shore
  for (let z = 5; z < 17; z += 1) {
    const y = 1 + Math.sin(((z - 5) / 12) * Math.PI) * 1.6;
    parts.push(vb(-1.6, y, z, 1.6, y + 0.6, z + 1, WOOD));
  }
  parts.push(vb(-1.8, 1.6, 5, -1.5, 4.2, 17, WOOD_DARK), vb(1.5, 1.6, 5, 1.8, 4.2, 17, WOOD_DARK), ...lamp(-3, 18.5, 8), ...lamp(3, 18.5, 8));
  // docks and boats around the lake
  for (const [x, z, r] of [[-17, 6, 0], [17, -6, 0], [14, 12, 1]] as const) {
    parts.push(vb(x - 1, 0.2, z - 4, x + 1, 0.9, z + 4, WOOD));
    parts.push(...(r ? vmove(vturn(sailboat(seed + x), 1), x + 3, -0.1, z) : rowboat(x + (x < 0 ? 3.6 : -3.6), z, pick(BRIGHT, rnd(seed, x)))));
  }
  parts.push(...smallTree(-21, -21, seed, 10), ...smallTree(21, 21, seed + 2, 10), ...smallTree(-21, 21, seed + 3, 9), ...bench(10, 21));
  return parts;
}

/**
 * BYV — small-boat marina (4 × 3 tiles): a blue boathouse and a clubhouse on the shore, rows of
 * dinghies on racks, a T-shaped dock with moored sailboats and kayaks on the water.
 */
export function smallBoatMarina(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-24, 0, -18, 24, 0.3, 0, '#93cb6c'), vb(-24, 0, 0, 24, 0.4, 4, SAND), ...water(-24, 4, 24, 18)];
  // boathouse and clubhouse
  parts.push(vb(-22, 0.3, -16, -10, 8, -8, '#4f7fb8'), ...gableRoof(-22, -10, -16, -8, 8.6, '#e9dccb', '#4f7fb8', 0.6), vb(-19, 0.3, -8, -13, 6.5, -7.7, WHITE));
  parts.push(vb(12, 0.3, -16, 22, 7, -9, WHITE), ...hipRoof(11.5, 22.5, -16.5, -8.5, 8, '#5b8fd6', 0.5, 3), ...windowZ(14, 17, 2.6, 5.4, -9, G), ...windowZ(18.5, 21, 2.6, 5.4, -9, G));
  parts.push(vb(12.5, 4, -8.7, 21.5, 4.4, -8.4, LAMP, 'glow'));
  // dinghy racks: rows of small hulls in bright colours
  for (let row = 0; row < 3; row++)
    for (let k = 0; k < 6; k++) {
      const x = -6 + k * 2.6;
      const z = -15 + row * 4;
      parts.push(vb(x - 1, 0.3, z - 1.6, x + 1, 1.2, z + 1.6, pick(['#fbf8f2', '#f2c14e', '#e46a5c', '#5b8fd6'], rnd(seed, row, k))));
    }
  // T-shaped dock and boats
  parts.push(vb(-1.5, 0.2, 0, 1.5, 0.9, 13, WOOD), vb(-14, 0.2, 11, 14, 0.9, 14, WOOD));
  for (let x = -14; x < 14; x += 1.4) parts.push(vb(x, 0.85, 11, x + 0.1, 0.95, 14, WOOD_DARK));
  parts.push(...vmove(vturn(sailboat(seed), 1), -9, -0.1, 7.5), ...vmove(vturn(sailboat(seed + 3), 1), 9, -0.1, 7.5), ...vmove(sailboat(seed + 5), 18, -0.1, 16));
  for (const [x, z, c] of [[-18, 8, '#f2c14e'], [-20, 12, '#e46a5c'], [17, 6, '#6fbf8a']] as const) parts.push(vb(x - 2.6, 0.2, z - 0.6, x + 2.6, 0.9, z + 0.6, c), vb(x - 0.8, 0.9, z - 0.4, x + 0.8, 1, z + 0.4, '#2b2f3a'));
  parts.push(...lamp(-4, -2, 8), ...lamp(4, -2, 8), ...smallTree(-9, -4, seed, 10), ...smallTree(9, -4, seed + 1, 9), ...fence(-23.6, -1, -16, -1, WOOD, 2.6));
  return parts;
}

// --- River -----------------------------------------------------------------------------------------

/**
 * BOW — lagoon teahouse (4 × 3 tiles): a big timber pavilion under a broad shingled pyramid roof, its
 * deck out over the lagoon with dark umbrellas and flowers, a dock with paddle boats, spruces around.
 */
export function lagoonTeahouse(seed: number): BoxPart[] {
  const parts: BoxPart[] = [vb(-24, 0, -18, 24, 0.3, -2, '#93cb6c'), ...water(-24, -2, 24, 18)];
  for (let x = -24; x < 24; x += 2) parts.push(vb(x, 0, -3, x + 2, 1, -1, shade(STONE, (rnd(seed, x) - 0.5) * 0.2)));
  // pavilion: posts, a wide pyramid roof of shingles
  parts.push(vb(-14, 0.3, -16, 6, 7, -6, '#c9a27a'));
  for (let x = -14; x <= 6; x += 4) parts.push(vb(x - 0.5, 0.3, -6.5, x + 0.5, 8, -5.5, '#8a6343'));
  parts.push(...windowZ(-12, -8, 2, 6, -6, G), ...windowZ(-4, 0, 2, 6, -6, G));
  for (let i = 0; i < 8; i++) parts.push({ ...vb(-18 + i * 1.6, 8 + i * 1.1, -18 + i * 1.3, 10 - i * 1.6, 9.1 + i * 1.1, -1 - i * 1.3, i % 2 ? '#9a7a5e' : '#a8876a'), tag: 'roof' });
  parts.push(vb(-4.6, 16.8, -10.6, -3.4, 18.6, -9.4, '#8a6343'));
  // deck on posts over the water, rail, umbrellas, flower boxes
  parts.push(vb(-16, 1, -2, 8, 1.8, 9, WOOD));
  for (let x = -16; x < 8; x += 1.4) parts.push(vb(x, 1.75, -2, x + 0.1, 1.85, 9, WOOD_DARK));
  for (const x of [-15, -7, 1, 7]) parts.push(vb(x, -3, 8.2, x + 0.8, 1, 9, WOOD_DARK));
  parts.push(vb(-16, 1.8, 8.6, 8, 3.6, 9, '#6e5a48'), vb(-16.4, 1.8, -2, -16, 3.6, 9, '#6e5a48'));
  for (const [x, z] of [[-11, 3], [-3, 5], [4, 2]]) parts.push(vb(x - 0.2, 1.8, z - 0.2, x + 0.2, 7.4, z + 0.2, '#3a3f4c'), ...asSway([vb(x - 2.8, 7.4, z - 2.8, x + 2.8, 8, z + 2.8, '#4a4f5a'), vb(x - 1.6, 8, z - 1.6, x + 1.6, 8.5, z + 1.6, '#4a4f5a')]), vb(x - 1.2, 1.8, z - 1.2, x + 1.2, 3.4, z + 1.2, ART.wood));
  for (const x of [-12, -4, 4]) parts.push(vb(x, 3.6, 8.6, x + 2.4, 4.6, 9.2, '#8a6343'), vb(x + 0.2, 4.6, 8.7, x + 2.2, 5.4, 9.1, '#b77fd0'));
  for (const x of [-14, -6, 2]) parts.push(vb(x, 3.6, 8.7, x + 1, 4.8, 8.9, LAMP, 'glow'));
  // dock with paddle boats
  parts.push(vb(10, 0.2, -2, 24, 0.9, 1, WOOD), vb(22, 0.2, 1, 24, 0.9, 12, WOOD));
  for (const [z, c] of [[4, '#e46a5c'], [8, '#f2c14e']] as const) parts.push(vb(17, 0.2, z - 1.6, 21, 1.6, z + 1.6, c), vb(18, 1.6, z - 1, 20, 2.6, z + 1, '#fbf8f2'));
  for (const [x, z] of [[-21, -15], [-21, -8], [12, -15], [20, -12], [18, -6]]) parts.push(vb(x - 0.4, 0.3, z - 0.4, x + 0.4, 3, z + 0.4, ART.trunk), ...asSway([vb(x - 2, 2.4, z - 2, x + 2, 6, z + 2, ART.spruce[0]), vb(x - 1.2, 6, z - 1.2, x + 1.2, 9.4, z + 1.2, ART.spruce[1])]));
  parts.push(...reeds(-20, 12, seed), ...reeds(14, 15, seed + 1), ...lamp(-18, -4.5, 8));
  return parts;
}

/**
 * POI — footbridge with ring pylons (5 × 1 tiles, spanning along x): a slim pinkish concrete deck on
 * a middle pier, and at each end a tall pylon with a round opening near its top.
 */
export function ringPylonBridge(_seed: number): BoxPart[] {
  const C = '#c9a99a';
  const parts: BoxPart[] = [vb(-30, 4, -3, 30, 5.2, 3, C), vb(-30, 5.2, -3, 30, 7, -2.6, shade(C, -0.06)), vb(-30, 5.2, 2.6, 30, 7, 3, shade(C, -0.06))];
  parts.push(vb(-1.5, -4, -2, 1.5, 4, 2, shade(C, -0.08)), vb(-2.5, 3, -2.5, 2.5, 4, 2.5, shade(C, -0.08)));
  for (const s of [-1, 1]) {
    const x = s * 26;
    // pylon: a slab rising from below the deck with a ring opening (a square hole framed by steps)
    parts.push(vb(x - 3, -4, -4.5, x + 3, 16, -2.5, C), vb(x - 3, -4, 2.5, x + 3, 16, 4.5, C));
    parts.push(vb(x - 3, 16, -4.5, x + 3, 17, 4.5, C), vb(x - 3, 23, -4.5, x + 3, 25, 4.5, C), vb(x - 3, 17, -4.5, x + 3, 18, -1.5, C), vb(x - 3, 17, 1.5, x + 3, 18, 4.5, C), vb(x - 3, 22, -4.5, x + 3, 23, -1.5, C), vb(x - 3, 22, 1.5, x + 3, 23, 4.5, C), vb(x - 3, 18, -4.5, x + 3, 22, -3, C), vb(x - 3, 18, 3, x + 3, 22, 4.5, C));
    parts.push(vb(x - 2.6, 7, -2.5, x + 2.6, 16, -2.2, shade(C, -0.1)), vb(x - 2.6, 7, 2.2, x + 2.6, 16, 2.5, shade(C, -0.1)));
  }
  for (const x of [-14, 14]) parts.push(vb(x - 0.2, 7, -2.9, x + 0.2, 10, -2.5, IRON), vb(x - 0.7, 10, -3.2, x + 0.7, 11, -2.2, LAMP, 'glow'));
  return parts;
}
