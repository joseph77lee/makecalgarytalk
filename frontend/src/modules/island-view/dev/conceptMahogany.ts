/**
 * Concept for the community-identity build map (2026-11-25): Mahogany finished, as a lake-persona
 * island (gallery only; the islands do not use it). It shows the proposed layout: a central plaza
 * where the paths meet, the persona landmark chain on the lake (sailing dock → boardwalk → beach
 * house → lakeside lighthouse) on the biggest site, a park, a main street, the community hall,
 * residents' houses grouped in a few blocks with room between them, and a green edge.
 * Positions are in tiles from the island's corner (x right, z towards the viewer).
 */
import { translate, type BoxPart } from '../assets/boxes';
import { BUILDING_VOXELS } from '../assets/voxel/buildings';
import { VOXEL_DESIGNS as N } from '../assets/voxel/designFit';
import { houseParts, houseTypeFor } from '../assets/voxel/houses';
import { beachHouse, beachUmbrella, boardwalk, lakeLighthouse, mainStreetShop, plaza, sailboat, sailingDock } from '../assets/voxel/landmarks';
import { lampPost } from '../assets/voxel/samples';
import { rnd, vturn } from '../assets/voxel/voxel';
import type { IslandTile } from '../layout';
import { MOOD_PALETTES } from '../mood';
import { terrainParts } from '../scene/terrainParts';

export const CONCEPT_ORIGIN: [number, number] = [100, 0];
export const CONCEPT_SIZE: [number, number] = [26, 22];

export interface ConceptLabel {
  text: string;
  at: [number, number, number];
  /** The persona landmark chain (highlighted). */
  landmark?: boolean;
}

export interface ConceptScene {
  parts: BoxPart[];
  labels: ConceptLabel[];
  /** Where villagers stand (tiles, absolute). */
  people: [number, number][];
}

const [W, D] = CONCEPT_SIZE;
const PALETTE = MOOD_PALETTES.lively;
const CTX = { palette: PALETTE, snow: false };

/** The lake: an ellipse in the north-east, with a little peninsula for the lighthouse. */
const inLake = (x: number, z: number) => ((x + 0.5 - 19.5) / 6.6) ** 2 + ((z + 0.5 - 3.8) / 4.4) ** 2 < 1;
const peninsula = (x: number, z: number) => x >= 15 && x <= 16 && z >= 1 && z <= 3;
const nearLake = (x: number, z: number) => ((x + 0.5 - 19.5) / 7.8) ** 2 + ((z + 0.5 - 3.8) / 5.6) ** 2 < 1;
/** Rounded island corners. */
const onIsland = (x: number, z: number) => {
  const cx = Math.min(x, W - 1 - x);
  const cz = Math.min(z, D - 1 - z);
  return !(cx + cz < 2);
};

const PATHS = (x: number, z: number) =>
  x === 12 && z >= 7 // the avenue from the entrance to the lake
  || z === 15 && x >= 2 && x <= 24 // main street
  || z === 9 && x >= 2 && x <= 12 // to the north-west block
  || z === 18 && x >= 14 && x <= 24 // to the south-east block
  || x === 5 && z >= 15 && z <= 20 // to the south-west block
  || (x >= 10 && x <= 14 && z >= 10 && z <= 14); // the plaza

export function buildMahoganyConcept(): ConceptScene {
  const [X0, Z0] = CONCEPT_ORIGIN;
  const parts: BoxPart[] = [];
  const labels: ConceptLabel[] = [];
  const people: [number, number][] = [];
  const at = (p: BoxPart[], x: number, z: number, y = 0) => parts.push(...translate(p, X0 + x, Z0 + z).map((b) => (y ? { ...b, p: [b.p[0], b.p[1] + y, b.p[2]] as [number, number, number] } : b)));
  const label = (text: string, x: number, z: number, y: number, landmark = false) => labels.push({ text, at: [X0 + x, y, Z0 + z], landmark });
  const used = new Set<string>();
  const take = (x0: number, z0: number, w: number, d: number) => {
    for (let x = x0; x < x0 + w; x++) for (let z = z0; z < z0 + d; z++) used.add(`${x},${z}`);
  };

  // ground: grass, sand paths and beach, the lake
  const tiles: Pick<IslandTile, 'x' | 'z' | 'kind'>[] = [];
  for (let x = 0; x < W; x++)
    for (let z = 0; z < D; z++) {
      if (!onIsland(x, z)) continue;
      const water = inLake(x, z) && !peninsula(x, z);
      const kind: IslandTile['kind'] = water ? 'water' : PATHS(x, z) || nearLake(x, z) || peninsula(x, z) ? 'path' : 'grass';
      tiles.push({ x: X0 + x, z: Z0 + z, kind });
      if (water || PATHS(x, z)) used.add(`${x},${z}`);
    }
  const landKeys = new Set(tiles.map((t) => `${t.x},${t.z}`));
  parts.push(...terrainParts(tiles, landKeys, PALETTE));

  // ⭐ persona landmark chain on the lake
  at(lakeLighthouse(1), 16, 2.5);
  take(15, 1, 2, 3);
  label('⭐ Lakeside lighthouse — final landmark', 16, 2.5, 4.8, true);
  at(vturn(beachHouse(2), 1), 10.5, 4.5);
  take(9, 3, 3, 4);
  label('⭐ Beach house — landmark 3', 10.5, 4.5, 2.4, true);
  at(boardwalk(9), 17.5, 8.4);
  label('⭐ Boardwalk — landmark 2', 17.5, 8.4, 1.1, true);
  at(sailingDock(3), 22, 8.2);
  at(sailboat(3), 20, 5.4, -0.1);
  at(vturn(sailboat(4), 1), 23.6, 4.6, -0.1);
  label('⭐ Sailing dock — landmark 1', 22.4, 6.4, 1.3, true);
  for (const [x, z, s] of [[13.6, 6.6, 1], [14.8, 7.2, 2], [13.4, 2.4, 3]] as const) at(beachUmbrella(s), x, z);
  at(N.firePit2.build(4), 8.5, 7.6); // a lakeside fire pit on the grass by the beach house

  // the town centre
  at(plaza(5), 12.5, 12.5);
  label('Central plaza', 12.5, 12.5, 1.1);
  at(vturn(BUILDING_VOXELS['community-hall']({ w: 3, d: 3, level: 1, variant: 3 }, CTX), 3), 16.5, 12.5);
  take(15, 11, 3, 3);
  label('Community hall', 16.5, 12.5, 2.1);
  // shops on the north side of the main street, their fronts towards it (and the viewer)
  [19, 21, 23].forEach((x, i) => at(mainStreetShop(i + 1), x, 14.5));
  take(18, 14, 6, 1);
  label('Main street', 21, 14.5, 1.5);
  at(BUILDING_VOXELS['neighbourhood-park']({ w: 3, d: 3, level: 1, variant: 2 }, CTX), 7.5, 12.5);
  take(6, 11, 3, 3);
  label('Park', 7.5, 12.5, 1.7);
  at(BUILDING_VOXELS.playground({ w: 2, d: 2, level: 1, variant: 2 }, CTX), 8, 17.5);
  take(7, 16, 2, 3);
  label('Playground', 8, 17.5, 1.1);
  at(BUILDING_VOXELS['welcome-sign']({ w: 1, d: 1, level: 1, variant: 3 }, CTX), 12.5, 21.2);
  label('Welcome arch', 12.5, 21.2, 1.3);

  // residents' houses, grouped in blocks with yards between them
  const houses: [number, number, number][] = [
    // north-west block, facing the path at z = 9 or each other
    [2, 2, 0], [4, 2, 0], [6, 2, 0], [2, 5, 0], [4, 5, 0], [6, 5, 0], [3, 7.5, 0], [6, 7.5, 0],
    // south-west block beside the lane at x = 5
    [3.5, 16, 1], [3.5, 18, 1], [3.5, 20, 1], [6.5, 19.5, 3],
    // south-east block along its lane at z = 18
    [15, 19.5, 2], [17, 19.5, 2], [19, 19.5, 2], [21, 19.5, 2], [23, 19.5, 2],
    // east, between the main street and the lake
    [23.5, 11, 3], [21, 11, 0], [16, 16.5, 2], [21, 16.5, 2],
  ];
  houses.forEach(([x, z, facing], i) => {
    const seed = 1000 + i * 37;
    at(houseParts(houseTypeFor('suburb', seed), seed, facing, rnd(seed, 3) < 0.4), x + 0.5, z + 0.5);
    used.add(`${Math.floor(x)},${Math.floor(z)}`);
  });
  label('Neighbourhood', 4.5, 4, 1.6);
  label('Neighbourhood', 19, 20, 1.6);

  // lamps along the avenue and main street, benches and flowers by the paths
  for (let z = 17; z <= 20; z += 2) at(lampPost(), 11.6, z + 0.5);
  for (let x = 3; x <= 23; x += 4) at(N.garlandLamp.build(0), x + 0.5, 15.9);
  for (const [x, z] of [[11, 8], [14, 9], [9, 15.6]] as const) at(N.parkBench.build(0), x, z);

  // a green edge: trees on free land near the shore of the island, and a few in the yards
  const leafy = [N.shadeTree, N.ornamentalTree, N.lollipopTree, N.oliveTree];
  const evergreen = [N.tallPine, N.firTree, N.coneTree, N.youngPine];
  for (const t of tiles) {
    const x = t.x - X0;
    const z = t.z - Z0;
    if (t.kind !== 'grass' || used.has(`${x},${z}`)) continue;
    const edge = x <= 1 || z <= 1 || x >= W - 2 || z >= D - 2;
    const r = rnd(x, z, 7);
    if ((edge && r < 0.55) || (!edge && r < 0.12)) {
      const pool = rnd(x, z, 8) < 0.45 ? evergreen : leafy;
      at(pool[Math.floor(rnd(x, z, 9) * pool.length)].build(x * 31 + z), x + 0.5, z + 0.5);
    }
  }

  people.push([12.2, 12], [13, 13.2], [11.6, 13.4], [13.8, 6.2], [15.2, 7.6], [17.5, 8.4], [19.4, 16], [7.6, 13.6], [12.4, 18]);
  return { parts, labels, people: people.map(([x, z]) => [X0 + x, Z0 + z]) };
}
