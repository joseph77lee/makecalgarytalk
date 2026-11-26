/**
 * Gallery preview of a few communities' build maps (requirement v1.47 §7.6, 2026-11-26): the three
 * tracks of each community left to right in build order, each step on a grass plate with its
 * condition. Dev only: the real build map will be server data (M24); this reads the same models.
 */
import { box, translate, type BoxPart } from '../assets/boxes';
import { placeholderModel, BUILDING_VOXELS } from '../assets/voxel/buildings';
import { LANDMARK_LIBRARY, type LandmarkKey } from '../assets/voxel/landmarkLibrary';
import { PLACE_LIBRARY, personaTrack, type Persona } from '../assets/voxel/placeLibrary';
import { flowerBed, lamp, smallTree } from '../assets/voxel/placeParts';
import { vb } from '../assets/voxel/voxel';
import { MOOD_PALETTES } from '../mood';
import type { PlaceLabel } from './placeLayout';

const CTX = { palette: MOOD_PALETTES.lively, snow: false };

/** The sample communities: two priority lake/main-street, downtown with two landmarks, a hill, and one without a unique model. */
export const BUILD_MAP_SAMPLES: { code: string; name: string; persona: Persona }[] = [
  { code: 'MAH', name: 'Mahogany', persona: 'lake' },
  { code: 'ING', name: 'Inglewood', persona: 'historic_main_street' },
  { code: 'DNC', name: 'Downtown Commercial Core', persona: 'downtown' },
  { code: 'SIG', name: 'Signal Hill', persona: 'hill_view' },
  { code: 'ACA', name: 'Acadia', persona: 'mature_suburb' },
];

/** Conditions of steps 1–7 (requirement v1.47 §7.6): community and nature tracks, then the persona track. */
const COMMON_COND = ['first day', '3-day streak', '3 residents', '6 res. + 7-day', '10 res. + 14-day', '20 res. + 30-day', 'no new condition'];
const LANDMARK_COND = ['11 res. + 14-day', '26 res. + 21-day', '51 res. + 30-day'];

interface Step {
  label: string;
  cond: string;
  tiles: [number, number];
  build: () => BoxPart[];
  landmark?: boolean;
}

const building = (key: string, label: string, w: number, d: number, variant = 1) => ({ label, tiles: [w, d] as [number, number], build: () => BUILDING_VOXELS[key]({ w, d, level: 1, variant }, CTX) });

/** Pathway lights: a short lamplit path (they run along every path on a real island). */
const pathwayLights = (): BoxPart[] => {
  const parts: BoxPart[] = [];
  for (let x = -18; x < 18; x += 2) parts.push(vb(x, 0, -2, x + 2, 0.1, 2, '#e2d9c8'));
  for (const x of [-12, 0, 12]) parts.push(...lamp(x, -3.4, 8));
  return parts;
};
/** A decoration step: flower beds and young trees. */
const decoration = (seed: number): BoxPart[] => [...flowerBed(-10, -4, 8, 4, seed), ...flowerBed(2, 2, 8, 4, seed + 1), ...smallTree(-6, 6, seed, 8), ...smallTree(7, -6, seed + 2, 9)];

function tracks(code: string, persona: Persona): [string, Step[]][] {
  const community: Step[] = [
    building('welcome-sign', 'Welcome sign', 1, 1),
    building('fire-pit', 'Fire pit', 3, 3),
    building('warming-hut', 'Warming hut', 3, 3),
    building('skating-rink', 'Skating rink', 2, 3),
    building('community-hall', 'Community hall', 3, 3),
    building('neighbourhood-park', 'Neighbourhood park', 3, 3),
  ].map((s, i) => ({ ...s, cond: COMMON_COND[i] }));
  const nature: Step[] = [
    building('playground', 'Playground', 2, 2),
    building('sledding-hill', 'Sledding hill', 2, 2),
    building('dog-park', 'Dog park', 2, 2),
    building('community-garden', 'Community garden', 2, 2),
    { label: 'Pathway lights', tiles: [3, 1] as [number, number], build: pathwayLights },
    { label: 'Decoration …', tiles: [2, 2] as [number, number], build: () => decoration(3) },
  ].map((s, i) => ({ ...s, cond: COMMON_COND[i] }));
  const places = personaTrack(persona);
  const own = (Object.keys(LANDMARK_LIBRARY) as LandmarkKey[]).filter((k) => LANDMARK_LIBRARY[k].code === code).sort((a, b) => (LANDMARK_LIBRARY[a].order ?? 1) - (LANDMARK_LIBRARY[b].order ?? 1));
  const personaSteps: Step[] = places.slice(0, 3).map((k, i) => ({ label: PLACE_LIBRARY[k].label, cond: COMMON_COND[i], tiles: PLACE_LIBRARY[k].tiles, build: () => PLACE_LIBRARY[k].build(7) }));
  for (let n = 0; n < 3; n++) {
    const key = own[n];
    if (key) personaSteps.push({ label: `⭐${n + 1} ${LANDMARK_LIBRARY[key].label}`, cond: LANDMARK_COND[n], tiles: LANDMARK_LIBRARY[key].tiles, build: () => LANDMARK_LIBRARY[key].build(7), landmark: true });
    else if (n === 0) {
      const pattern = PLACE_LIBRARY[places[3]];
      personaSteps.push({ label: `⭐1 ${pattern.label} + name sign`, cond: LANDMARK_COND[0], tiles: pattern.tiles, build: () => pattern.build(7), landmark: true });
    } else personaSteps.push({ label: `⭐${n + 1} model later (persona place)`, cond: LANDMARK_COND[n], tiles: [2, 2], build: () => placeholderModel({ w: 2, d: 2, level: 1, variant: 0 }, CTX), landmark: true });
  }
  return [
    ['🏘️ Community', community],
    ['⭐ Persona', personaSteps],
    ['🌳 Nature', nature],
  ];
}

/** Adds the build-map blocks below the landmark rows; returns the new z. */
export function addBuildMaps(parts: BoxPart[], labels: PlaceLabel[], rows: Record<string, [number, number]>, x0: number, z0: number): number {
  let z = z0;
  for (const { code, name, persona } of BUILD_MAP_SAMPLES) {
    const top = z;
    labels.push({ text: `${code} · ${name} · ${persona.replace(/_/g, ' ')}`, at: [x0 + 4, 0.2, z - 0.8], landmark: true });
    let maxX = x0;
    for (const [title, steps] of tracks(code, persona)) {
      const depth = Math.max(...steps.map((s) => s.tiles[1]));
      labels.push({ text: title, at: [x0 - 2.4, 0.2, z + depth / 2], landmark: false });
      let x = x0;
      steps.forEach((s, i) => {
        const [w, d] = s.tiles;
        const cx = x + w / 2;
        const cz = z + depth / 2;
        parts.push(box('solid', cx, -0.3, cz, w + 0.6, 0.3, d + 0.6, '#9fd47a'), box('solid', cx, -0.6, cz, w + 0.6, 0.3, d + 0.6, '#c49a6c'));
        parts.push(...translate(s.build(), cx, cz));
        labels.push({ text: `${i + 1} · ${s.label} — ${s.cond}`, at: [cx, 0.2, cz + d / 2 + 0.6], landmark: !!s.landmark });
        x += w + 2.4;
      });
      maxX = Math.max(maxX, x);
      z += depth + 2.2;
    }
    rows[`Build map ${code}`] = [(x0 + maxX) / 2, (top + z) / 2];
    z += 12;
  }
  return z;
}
