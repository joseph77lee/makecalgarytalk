/**
 * SPIKE (spike/polyfork, not for main): Polyfork low-poly models (CC BY 4.0, credits in
 * public/spike-polyfork/CREDITS.md) loaded, normalised to our tile units and either voxelised
 * into our box style (option A) or kept as meshes with pastel colours (option B).
 */
import { Box3, BufferAttribute, BufferGeometry, Color, Matrix4, Mesh, Object3D, Vector3 } from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import type { BoxPart } from '../assets/boxes';
import { ART } from '../assets/voxel/samples';

export type PfCategory = 'house' | 'tree' | 'car';

/** Marker colours in voxel parts: replaced per house by its roof (two shades, like our stepped roofs) and wall colours. */
export const ROOF_MARK = '#ff00f1';
export const ROOF_MARK_2 = '#ff00f2';
export const WALL_MARK = '#ff00f3';

export const PF_MODELS = {
  cottage: { file: 'porch-front-cottage-620c29', cat: 'house' },
  ranch: { file: 'single-storey-ranch-house-3880ea', cat: 'house' },
  splitLevel: { file: 'split-level-house-40fe1a', cat: 'house' },
  twoStorey: { file: 'two-storey-family-house-c63c4a', cat: 'house' },
  townhouse: { file: 'townhouse-row-unit-b9544b', cat: 'house' },
  shadeTree: { file: 'broad-canopy-shade-tree-e7c4a2', cat: 'tree' },
  ornamentalTree: { file: 'ornamental-front-yard-tree-c6781a', cat: 'tree' },
  evergreen: { file: 'columnar-evergreen-shrub-35a00b', cat: 'tree' },
  suv: { file: 'family-crossover-suv-42027f', cat: 'car' },
  minivan: { file: 'family-minivan-924de0', cat: 'car' },
  pickup: { file: 'suburban-pickup-truck-d15ea2', cat: 'car' },
} as const satisfies Record<string, { file: string; cat: PfCategory }>;
export type PfName = keyof typeof PF_MODELS;

export interface PfModel {
  /** Non-indexed, sRGB-pastel vertex colours (`color`), `aGlass` 1 on window colours. Front +z (houses) or +x (cars); centred on x/z, standing on y=0, in tile units. */
  geometry: BufferGeometry;
  size: Vector3;
}

const SNAP = (v: number) => Math.min(255, Math.max(0, Math.round(v * 255)));
const linearToSrgb = (v: number) => (v <= 0.0031308 ? 12.92 * v : 1.055 * v ** (1 / 2.4) - 0.055);

/** Softer, lighter colours closer to our pastel palette (§19.1). */
export function pastelize(hex: string): string {
  const c = new Color(hex);
  const hsl = { h: 0, s: 0, l: 0 };
  c.getHSL(hsl);
  c.setHSL(hsl.h, hsl.s * 0.78, hsl.l + (1 - hsl.l) * 0.2);
  return `#${c.getHexString()}`;
}

const hexOf = (r: number, g: number, b: number) => `#${((SNAP(linearToSrgb(r)) << 16) | (SNAP(linearToSrgb(g)) << 8) | SNAP(linearToSrgb(b))).toString(16).padStart(6, '0')}`;

/** Window colours: blue-grey, fairly dark, and a small share of the model. */
function glassColours(shares: Map<string, number>, total: number): Set<string> {
  const out = new Set<string>();
  for (const [hex, n] of shares) {
    const c = new Color(hex);
    const hsl = { h: 0, s: 0, l: 0 };
    c.getHSL(hsl);
    const blueish = hsl.h > 0.5 && hsl.h < 0.7;
    if (blueish && hsl.l > 0.15 && hsl.l < 0.5 && n / total < 0.1) out.add(hex);
  }
  return out;
}

const cache = new Map<PfName, Promise<PfModel>>();
const loader = new GLTFLoader();

export function loadPfModel(name: PfName): Promise<PfModel> {
  let p = cache.get(name);
  if (!p) {
    const spec = PF_MODELS[name];
    p = loader.loadAsync(`/spike-polyfork/${spec.file}.glb`).then((gltf) => normalise(gltf.scene, spec.cat));
    cache.set(name, p);
  }
  return p;
}

function normalise(scene: Object3D, cat: PfCategory): PfModel {
  scene.updateMatrixWorld(true);
  const geos: BufferGeometry[] = [];
  let door: Box3 | null = null;
  scene.traverse((o) => {
    const m = o as Mesh;
    if (!m.isMesh) return;
    const g = (m.geometry.index ? m.geometry.toNonIndexed() : m.geometry.clone()).applyMatrix4(m.matrixWorld);
    for (const k of Object.keys(g.attributes)) if (!['position', 'normal', 'color'].includes(k)) g.deleteAttribute(k);
    geos.push(g);
    if (/door/.test(o.name) || /door/.test(o.parent?.name ?? '')) door = (door ?? new Box3()).union(new Box3().setFromObject(m));
  });
  const geometry = mergeGeometries(geos, false)!;
  const box = new Box3().setFromBufferAttribute(geometry.getAttribute('position') as BufferAttribute);
  const centre = box.getCenter(new Vector3());

  // Face the front +z (houses: towards the door), cars +x (our car convention).
  let yaw = 0;
  if (cat === 'house' && door) {
    const d = (door as Box3).getCenter(new Vector3()).sub(centre);
    yaw = Math.abs(d.x) > Math.abs(d.z) ? (d.x > 0 ? -Math.PI / 2 : Math.PI / 2) : d.z > 0 ? 0 : Math.PI;
  }
  if (cat === 'car') {
    const s = box.getSize(new Vector3());
    yaw = s.z > s.x ? Math.PI / 2 : 0; // length along x
  }
  geometry.applyMatrix4(new Matrix4().makeTranslation(-centre.x, -box.min.y, -centre.z));
  geometry.applyMatrix4(new Matrix4().makeRotationY(yaw));
  const raw = new Box3().setFromBufferAttribute(geometry.getAttribute('position') as BufferAttribute).getSize(new Vector3());
  const scale = cat === 'house' ? 0.92 / Math.max(raw.x, raw.z) : cat === 'tree' ? 1.1 / raw.y : 0.46 / Math.max(raw.x, raw.z);
  geometry.applyMatrix4(new Matrix4().makeScale(scale, scale, scale));

  // Colours: linear → sRGB hex → pastel; mark windows.
  const col = geometry.getAttribute('color') as BufferAttribute;
  const hexes: string[] = [];
  const shares = new Map<string, number>();
  for (let i = 0; i < col.count; i++) {
    const h = hexOf(col.getX(i), col.getY(i), col.getZ(i));
    hexes.push(h);
    shares.set(h, (shares.get(h) ?? 0) + 1);
  }
  const glass = cat === 'house' ? glassColours(shares, col.count) : new Set<string>();
  const out = new Float32Array(col.count * 3);
  const glassAttr = new Float32Array(col.count);
  const c = new Color();
  hexes.forEach((h, i) => {
    c.set(glass.has(h) ? ART.glass : pastelize(h));
    out.set([c.r, c.g, c.b], i * 3); // three converts the colour from sRGB to linear in Color.set
    glassAttr[i] = glass.has(h) ? 1 : 0;
  });
  geometry.setAttribute('color', new BufferAttribute(out, 3));
  geometry.setAttribute('aGlass', new BufferAttribute(glassAttr, 1));
  // Roof and wall colours, so each house can wear our own pastel roof and wall (houses only).
  const roofAttr = new Float32Array(col.count);
  const wallAttr = new Float32Array(col.count);
  if (cat === 'house') {
    const posA = geometry.getAttribute('position') as BufferAttribute;
    const height = new Box3().setFromBufferAttribute(posA).getSize(new Vector3()).y;
    const up = new Map<string, number>();
    const all = new Map<string, number>();
    const e1 = new Vector3();
    const e2 = new Vector3();
    const n = new Vector3();
    for (let t = 0; t < col.count; t += 3) {
      const a0 = new Vector3().fromBufferAttribute(posA, t);
      e1.fromBufferAttribute(posA, t + 1).sub(a0);
      e2.fromBufferAttribute(posA, t + 2).sub(a0);
      n.crossVectors(e1, e2);
      const area = n.length() / 2;
      n.normalize();
      const h = hexes[t];
      all.set(h, (all.get(h) ?? 0) + area);
      if (n.y > 0.45 && a0.y > height * 0.4) up.set(h, (up.get(h) ?? 0) + area);
    }
    const roofs = new Set([...up].filter(([h, a]) => !glass.has(h) && a / (all.get(h) ?? 1) > 0.5 && a > 0.02).map(([h]) => h));
    const wall = [...all].filter(([h]) => !roofs.has(h) && !glass.has(h) && new Color(h).getHSL({ h: 0, s: 0, l: 0 }).l > 0.35).sort((x, y) => y[1] - x[1])[0]?.[0];
    hexes.forEach((h, i) => {
      roofAttr[i] = roofs.has(h) ? 1 : 0;
      wallAttr[i] = h === wall ? 1 : 0;
    });
  }
  geometry.setAttribute('aRoof', new BufferAttribute(roofAttr, 1));
  geometry.setAttribute('aWall', new BufferAttribute(wallAttr, 1));
  geometry.computeBoundingBox();
  return { geometry, size: geometry.boundingBox!.getSize(new Vector3()) };
}

/**
 * Option A: the model's surface as our voxels (`perTile` voxels per tile, 12 like our models),
 * runs of one colour along x merged into one box. Windows keep ART.glass so the night lights
 * find them; the top of the upper part is tagged `roof` (snow); tree crowns sway.
 */
export function voxelize(model: PfModel, perTile: number, cat: PfCategory): BoxPart[] {
  const pos = model.geometry.getAttribute('position') as BufferAttribute;
  const col = model.geometry.getAttribute('color') as BufferAttribute;
  const glass = model.geometry.getAttribute('aGlass') as BufferAttribute;
  const roofA = model.geometry.getAttribute('aRoof') as BufferAttribute;
  const wallA = model.geometry.getAttribute('aWall') as BufferAttribute;
  const cells = new Map<string, { r: number; g: number; b: number; n: number; glass: number; roof: number; wall: number }>();
  const v = 1 / perTile;
  const a = new Vector3();
  const b = new Vector3();
  const cc = new Vector3();
  const p = new Vector3();
  for (let t = 0; t < pos.count; t += 3) {
    a.fromBufferAttribute(pos, t);
    b.fromBufferAttribute(pos, t + 1);
    cc.fromBufferAttribute(pos, t + 2);
    const longest = Math.max(a.distanceTo(b), b.distanceTo(cc), cc.distanceTo(a));
    const steps = Math.max(1, Math.ceil(longest / (v * 0.45)));
    for (let i = 0; i <= steps; i++)
      for (let j = 0; j <= steps - i; j++) {
        const u = i / steps;
        const w = j / steps;
        const k = 1 - u - w;
        p.set(a.x * k + b.x * u + cc.x * w, a.y * k + b.y * u + cc.y * w, a.z * k + b.z * u + cc.z * w);
        const key = `${Math.floor(p.x / v)},${Math.floor(Math.min(p.y, model.size.y - 1e-6) / v)},${Math.floor(p.z / v)}`;
        const vi = i === 0 && j === 0 ? t : i === steps ? t + 1 : j === steps ? t + 2 : t; // nearest corner colour is enough here
        const cell = cells.get(key) ?? { r: 0, g: 0, b: 0, n: 0, glass: 0, roof: 0, wall: 0 };
        cell.r += col.getX(vi);
        cell.g += col.getY(vi);
        cell.b += col.getZ(vi);
        cell.glass += glass.getX(vi);
        cell.roof += roofA.getX(vi);
        cell.wall += wallA.getX(vi);
        cell.n++;
        cells.set(key, cell);
      }
  }
  let maxJ = 0;
  for (const k of cells.keys()) maxJ = Math.max(maxJ, Number(k.split(',')[1]));
  const color = new Color();
  const coded = new Map<string, { hex: string; tag?: BoxPart['tag']; layer: BoxPart['layer'] }>();
  for (const [k, c] of cells) {
    const [i, j, kk] = k.split(',').map(Number);
    const isGlass = c.glass / c.n > 0.5;
    color.setRGB(c.r / c.n, c.g / c.n, c.b / c.n);
    // roof and wall cells carry markers; each house paints them with its own colours
    const hex = isGlass ? ART.glass : c.roof / c.n > 0.5 ? (j % 2 === 0 ? ROOF_MARK : ROOF_MARK_2) : c.wall / c.n > 0.5 ? WALL_MARK : `#${color.getHexString()}`;
    const top = !cells.has(`${i},${j + 1},${kk}`);
    const upper = j >= maxJ * (cat === 'tree' ? 0.3 : 0.45);
    coded.set(k, {
      hex,
      tag: !isGlass && top && upper ? 'roof' : undefined,
      layer: cat === 'tree' && j > maxJ * 0.28 ? 'sway' : 'solid',
    });
  }
  // merge runs along x
  const parts: BoxPart[] = [];
  const done = new Set<string>();
  for (const [k, c] of coded) {
    if (done.has(k)) continue;
    const [i, j, kk] = k.split(',').map(Number);
    let i0 = i;
    while (coded.get(`${i0 - 1},${j},${kk}`)?.hex === c.hex && coded.get(`${i0 - 1},${j},${kk}`)?.tag === c.tag && !done.has(`${i0 - 1},${j},${kk}`)) i0--;
    let i1 = i;
    while (coded.get(`${i1 + 1},${j},${kk}`)?.hex === c.hex && coded.get(`${i1 + 1},${j},${kk}`)?.tag === c.tag) i1++;
    for (let x = i0; x <= i1; x++) done.add(`${x},${j},${kk}`);
    const len = i1 - i0 + 1;
    parts.push({ layer: c.layer, p: [(i0 + len / 2) * v, (j + 0.5) * v, (kk + 0.5) * v], s: [len * v, v, v], c: c.hex, ...(c.tag ? { tag: c.tag } : {}) });
  }
  return parts;
}
