/**
 * Turns a Polyfork model's meshes into one island-ready geometry (requirement.md v1.45 §19.1):
 * merged, facing +z (cars +x), centred on x/z, standing on y=0, sized into tile units, colours
 * repainted pastel, and per-vertex flags the island shader reads:
 *   aGlass — window colours (light up at night, never take snow)
 *   aRoof  — roof colours (each house wears its own pastel roof)
 *   aWall  — the main wall colour (each house wears its own pastel wall)
 * Pure: no loading, so it is unit-tested with hand-made geometry.
 */
import { Box3, BufferAttribute, BufferGeometry, Color, Matrix4, SRGBColorSpace, Vector3 } from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ART } from '../voxel/samples';
import { TILES_PER_METRE, type LpCategory, type LpFit } from './catalogue';

export interface LpModel {
  /** Non-indexed; attributes position, normal, color (linear), aGlass, aRoof, aWall. */
  geometry: BufferGeometry;
  /** Size in tiles after fitting. */
  size: Vector3;
  triangles: number;
}

export interface SourceMesh {
  geometry: BufferGeometry;
  /** World matrix of the mesh inside its file. */
  matrix: Matrix4;
  /** The mesh (or its parent) is named like a door: tells which side is the front. */
  door: boolean;
  /** The mesh is named like glass or glazing: its colours are windows. */
  glass?: boolean;
}

const KEEP = ['position', 'normal', 'color'];
const linearToSrgb = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);
const byte = (v: number) => Math.min(255, Math.max(0, Math.round(v * 255)));
const hexOf = (r: number, g: number, b: number) =>
  `#${((byte(linearToSrgb(r)) << 16) | (byte(linearToSrgb(g)) << 8) | byte(linearToSrgb(b))).toString(16).padStart(6, '0')}`;

/**
 * Softer, lighter colours closer to our pastel palette (§19.1: one palette for every kit). Dark
 * colours are lifted most, so kit browns and greys read as warm pastels next to our tiles. The
 * lift works on three's linear HSL on purpose (tuned by eye in the spike): it lifts darks strongly.
 */
export function pastelize(hex: string): string {
  const c = new Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, Math.min(hsl.s * 0.72, 0.6), hsl.l + (1 - hsl.l) * 0.32);
  return `#${c.getHexString()}`;
}

/** HSL as people see it (sRGB): three's default would measure the linear values. */
const hslOf = (hex: string) => {
  const hsl = { h: 0, s: 0, l: 0 };
  new Color(hex).getHSL(hsl, SRGBColorSpace);
  return hsl;
};

/** Window glass by colour: dark, cool (blue to grey-blue), and a small share of the model. */
export function isGlassColour(hex: string, share: number): boolean {
  const { h, s, l } = hslOf(hex);
  return share < 0.35 && l < 0.45 && l > 0.08 && h > 0.5 && h < 0.7 && s > 0.04;
}

/** sRGB distance between two hex colours (0..√3). */
export function colourDistance(a: string, b: string): number {
  // straight from the hex bytes: three's Color would convert to linear, where dark shades crowd together
  const ch = (hex: string, i: number) => parseInt(hex.slice(1 + i * 2, 3 + i * 2), 16) / 255;
  return Math.hypot(ch(a, 0) - ch(b, 0), ch(a, 1) - ch(b, 1), ch(a, 2) - ch(b, 2));
}

/**
 * Groups colours that are shades of one another (a roof is often several baked shades), biggest
 * first: each colour joins the first group whose seed is within `tolerance`.
 */
export function clusterColours(areas: Map<string, number>, tolerance = 0.09): Map<string, string> {
  const seeds: string[] = [];
  const out = new Map<string, string>();
  for (const [hex] of [...areas].sort((x, y) => y[1] - x[1])) {
    const seed = seeds.find((s) => colourDistance(s, hex) < tolerance);
    if (seed) out.set(hex, seed);
    else {
      seeds.push(hex);
      out.set(hex, hex);
    }
  }
  return out;
}

/** Quarter turn (radians) that brings the door side to +z; 0 when there is no door. */
export function frontYaw(door: Box3 | null, centre: Vector3): number {
  if (!door) return 0;
  const d = door.getCenter(new Vector3()).sub(centre);
  if (Math.abs(d.x) > Math.abs(d.z)) return d.x > 0 ? -Math.PI / 2 : Math.PI / 2;
  return d.z > 0 ? 0 : Math.PI;
}

/** Uniform scale that fits a model of `size` (already turned) into tiles. */
export function fitScale(fit: LpFit, size: Vector3): number {
  if ('footprint' in fit) return fit.footprint / Math.max(size.x, size.z);
  if ('height' in fit) return fit.height / size.y;
  return TILES_PER_METRE;
}

const painted = (cat: LpCategory) => cat === 'house' || cat === 'tower' || cat === 'building';

export function normalise(meshes: SourceMesh[], cat: LpCategory, fit: LpFit): LpModel {
  if (meshes.length === 0) throw new Error('model has no meshes');
  let door: Box3 | null = null;
  const geos = meshes.map((m) => {
    const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrix);
    for (const k of Object.keys(g.attributes)) if (!KEEP.includes(k)) g.deleteAttribute(k);
    const count = g.getAttribute('position').count;
    if (!g.getAttribute('normal')) g.computeVertexNormals();
    if (!g.getAttribute('color')) g.setAttribute('color', new BufferAttribute(new Float32Array(count * 3).fill(0.8), 3));
    g.setAttribute('aHint', new BufferAttribute(new Float32Array(count).fill(m.glass ? 1 : 0), 1));
    if (m.door) {
      g.computeBoundingBox();
      door = (door ?? new Box3()).union(g.boundingBox!);
    }
    return g;
  });
  const geometry = mergeGeometries(geos, false);
  if (!geometry) throw new Error('model meshes could not be merged');

  const box = new Box3().setFromBufferAttribute(geometry.getAttribute('position') as BufferAttribute);
  const centre = box.getCenter(new Vector3());
  let yaw = painted(cat) ? frontYaw(door, centre) : 0;
  if (cat === 'car') {
    const s = box.getSize(new Vector3());
    yaw = s.z > s.x ? Math.PI / 2 : 0; // length along x (our car convention)
  }
  geometry.applyMatrix4(new Matrix4().makeTranslation(-centre.x, -box.min.y, -centre.z));
  geometry.applyMatrix4(new Matrix4().makeRotationY(yaw));
  const turned = new Box3().setFromBufferAttribute(geometry.getAttribute('position') as BufferAttribute).getSize(new Vector3());
  const s = fitScale(fit, turned);
  geometry.applyMatrix4(new Matrix4().makeScale(s, s, s));

  const hint = geometry.getAttribute('aHint').array as Float32Array;
  geometry.deleteAttribute('aHint');
  repaint(geometry, cat, hint);
  geometry.computeBoundingBox();
  const size = geometry.boundingBox!.getSize(new Vector3());
  return { geometry, size, triangles: geometry.getAttribute('position').count / 3 };
}

interface FaceStats {
  area: number;
  /** Area facing up. */
  up: number;
  /** Sum of area × height (fraction of the model height) over the upward faces. */
  upY: number;
  /** Area of walls (faces neither up nor down). */
  vertical: number;
  /** Area on meshes named like glass. */
  glassHint: number;
}

const emptyStats = (): FaceStats => ({ area: 0, up: 0, upY: 0, vertical: 0, glassHint: 0 });

/** Face statistics per colour (a triangle's colour is its first corner's; models are flat-coloured). */
export function faceStats(pos: BufferAttribute, hexes: string[], hint: Float32Array): Map<string, FaceStats> {
  let height = 0;
  for (let i = 0; i < pos.count; i++) height = Math.max(height, pos.getY(i));
  const out = new Map<string, FaceStats>();
  const a = new Vector3();
  const b = new Vector3();
  const c = new Vector3();
  const nrm = new Vector3();
  for (let t = 0; t + 2 < pos.count; t += 3) {
    a.fromBufferAttribute(pos, t);
    b.fromBufferAttribute(pos, t + 1);
    c.fromBufferAttribute(pos, t + 2);
    const y = (a.y + b.y + c.y) / 3 / (height || 1);
    nrm.crossVectors(b.sub(a), c.sub(a));
    const area = nrm.length() / 2;
    if (area === 0) continue;
    nrm.normalize();
    const st = out.get(hexes[t]) ?? emptyStats();
    st.area += area;
    if (nrm.y > 0.3) {
      st.up += area;
      st.upY += area * y;
    } else if (nrm.y > -0.3) st.vertical += area;
    if (hint[t]) st.glassHint += area;
    out.set(hexes[t], st);
  }
  return out;
}

/** Which colours are glass, roof and wall, from their face statistics (shades grouped first). */
export function classifyColours(byHex: Map<string, FaceStats>): { glass: Set<string>; roof: Set<string>; wall: Set<string> } {
  const groupOf = clusterColours(new Map([...byHex].map(([h, st]) => [h, st.area])));
  const groups = new Map<string, FaceStats>();
  let total = 0;
  for (const [h, st] of byHex) {
    const g = groupOf.get(h)!;
    const acc = groups.get(g) ?? emptyStats();
    acc.area += st.area;
    acc.up += st.up;
    acc.upY += st.upY;
    acc.vertical += st.vertical;
    acc.glassHint += st.glassHint;
    groups.set(g, acc);
    total += st.area;
  }
  const glassG = new Set<string>();
  const roofG = new Set<string>();
  for (const [g, st] of groups) {
    // windows stand upright: a dark cool colour that faces up is a slate roof, not glass
    if (st.glassHint > st.area * 0.5 || (isGlassColour(g, st.area / total) && st.vertical / st.area > 0.6)) glassG.add(g);
    else if (st.area / total > 0.025 && st.up / st.area > 0.3 && st.upY / st.up > 0.5) roofG.add(g);
  }
  const wallG = [...groups]
    .filter(([g, st]) => !glassG.has(g) && !roofG.has(g) && st.vertical / st.area > 0.55 && hslOf(g).l > 0.15)
    .sort((x, y) => y[1].area - x[1].area)[0]?.[0];
  const pick = (want: (g: string) => boolean) => new Set([...groupOf].filter(([, g]) => want(g)).map(([h]) => h));
  return { glass: pick((g) => glassG.has(g)), roof: pick((g) => roofG.has(g)), wall: pick((g) => g === wallG) };
}

/** Pastel colours and the glass / roof / wall flags (see the file header). */
function repaint(geometry: BufferGeometry, cat: LpCategory, hint: Float32Array): void {
  const col = geometry.getAttribute('color') as BufferAttribute;
  const pos = geometry.getAttribute('position') as BufferAttribute;
  const n = col.count;
  const hexes: string[] = new Array(n);
  for (let i = 0; i < n; i++) hexes[i] = hexOf(col.getX(i), col.getY(i), col.getZ(i));
  const none = new Set<string>();
  const { glass, roof, wall } = painted(cat) ? classifyColours(faceStats(pos, hexes, hint)) : { glass: none, roof: none, wall: none };

  const colours = new Float32Array(n * 3);
  const aGlass = new Float32Array(n);
  const aRoof = new Float32Array(n);
  const aWall = new Float32Array(n);
  const c = new Color();
  const pastel = new Map<string, string>();
  for (let i = 0; i < n; i++) {
    const h = hexes[i];
    let p = pastel.get(h);
    if (!p) pastel.set(h, (p = pastelize(h)));
    c.set(glass.has(h) ? ART.glass : p); // Color.set converts sRGB hex to linear
    colours[i * 3] = c.r;
    colours[i * 3 + 1] = c.g;
    colours[i * 3 + 2] = c.b;
    aGlass[i] = glass.has(h) ? 1 : 0;
    aRoof[i] = roof.has(h) ? 1 : 0;
    aWall[i] = wall.has(h) ? 1 : 0;
  }
  geometry.setAttribute('color', new BufferAttribute(colours, 3));
  geometry.setAttribute('aGlass', new BufferAttribute(aGlass, 1));
  geometry.setAttribute('aRoof', new BufferAttribute(aRoof, 1));
  geometry.setAttribute('aWall', new BufferAttribute(aWall, 1));
}
