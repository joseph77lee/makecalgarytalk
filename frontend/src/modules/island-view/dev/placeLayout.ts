/** Layout of the gallery's place library (community-identity build map, 2026-11-26): one row per persona. */
import { box, translate, type BoxPart } from '../assets/boxes';
import { LANDMARK_LIBRARY, type LandmarkKey } from '../assets/voxel/landmarkLibrary';
import { PLACE_LIBRARY, personaTrack, type Persona } from '../assets/voxel/placeLibrary';
import { addBuildMaps } from './buildMapLayout';

export const PLACE_ORIGIN: [number, number] = [240, 0];
const ROW_GAP = 2;
const PERSONAS: [Persona, string][] = [
  ['lake', 'Lake'],
  ['mature_suburb', 'Mature suburb'],
  ['new_suburb', 'New suburb'],
  ['river', 'River'],
  ['hill_view', 'Hill view'],
  ['historic_main_street', 'Main street'],
  ['downtown', 'Downtown'],
  ['golf', 'Golf'],
  ['food_street', 'Food street'],
  ['special_district', 'Ranch & rail'],
];

export interface PlaceLabel {
  text: string;
  at: [number, number, number];
  landmark: boolean;
}

function buildScene(): { parts: BoxPart[]; labels: PlaceLabel[]; rows: Record<string, [number, number]> } {
  const [X0, Z0] = PLACE_ORIGIN;
  const parts: BoxPart[] = [];
  const labels: PlaceLabel[] = [];
  const rows: Record<string, [number, number]> = {};
  let z = Z0;
  PERSONAS.forEach(([persona, title]) => {
    let x = X0;
    const track = personaTrack(persona);
    for (const key of track) {
      const place = PLACE_LIBRARY[key];
      const [w, d] = place.tiles;
      const cx = x + w / 2;
      const cz = z + d / 2;
      parts.push(box('solid', cx, -0.3, cz, w + 0.6, 0.3, d + 0.6, '#9fd47a'), box('solid', cx, -0.6, cz, w + 0.6, 0.3, d + 0.6, '#c49a6c'));
      parts.push(...translate(place.build(7), cx, cz));
      const last = place.step === track.length;
      labels.push({ text: `${last ? '★ ' : ''}${place.step} · ${place.label}`, at: [cx, 0.2, cz + d / 2 + 0.6], landmark: last });
      x += w + 1.4;
    }
    const depth = Math.max(...track.map((k) => PLACE_LIBRARY[k].tiles[1]));
    labels.push({ text: title, at: [X0 - 1.6, 0.2, z + depth / 2], landmark: false });
    rows[title] = [(X0 + x) / 2, z + depth / 2];
    z += depth + ROW_GAP;
  });
  // unique landmarks of the priority communities, five to a row
  const keys = Object.keys(LANDMARK_LIBRARY) as LandmarkKey[];
  z += 3;
  for (let r = 0; r * 5 < keys.length; r++) {
    const rowKeys = keys.slice(r * 5, r * 5 + 5);
    const depth = Math.max(...rowKeys.map((k) => LANDMARK_LIBRARY[k].tiles[1]));
    let x = X0;
    for (const key of rowKeys) {
      const lm = LANDMARK_LIBRARY[key];
      const [w, d] = lm.tiles;
      const cx = x + w / 2;
      const cz = z + d / 2;
      parts.push(box('solid', cx, -0.3, cz, w + 0.6, 0.3, d + 0.6, '#9fd47a'), box('solid', cx, -0.6, cz, w + 0.6, 0.3, d + 0.6, '#c49a6c'));
      parts.push(...translate(lm.build(7), cx, cz));
      labels.push({ text: `★ ${lm.code}${lm.order ? ` ${lm.order}` : ''} · ${lm.label}`, at: [cx, 0.2, cz + d / 2 + 0.6], landmark: true });
      x += w + 1.6;
    }
    rows[`Landmarks ${[...new Set([rowKeys[0], rowKeys[rowKeys.length - 1]])].map((k) => k.slice(9).toUpperCase()).join('–')}`] = [(X0 + x) / 2, z + depth / 2];
    z += depth + ROW_GAP + 1;
  }
  addBuildMaps(parts, labels, rows, X0 + 2.4, z + 4);
  return { parts, labels, rows };
}

export const PLACE_SCENE = buildScene();

/** Camera presets: each persona row, and everything. */
export const PLACE_VIEWS: Record<string, { target: [number, number]; zoom: number }> = {
  'Places: all': { target: [PLACE_ORIGIN[0] + 9, PLACE_ORIGIN[1] + 24], zoom: 20 },
  ...Object.fromEntries(Object.entries(PLACE_SCENE.rows).filter(([title]) => !title.startsWith('Landmarks') && !title.startsWith('Build map')).map(([title, t]) => [`Places: ${title}`, { target: t, zoom: 62 }])),
};

/** Camera presets for the unique landmarks, one per row. */
export const LANDMARK_VIEWS: Record<string, { target: [number, number]; zoom: number }> = Object.fromEntries(
  Object.entries(PLACE_SCENE.rows).filter(([title]) => title.startsWith('Landmarks')).map(([title, t]) => [`Places: ${title.replace('Landmarks ', '★ ')}`, { target: t, zoom: 40 }]),
);

/** Camera presets for the build-map previews, one per sample community. */
export const BUILD_MAP_VIEWS: Record<string, { target: [number, number]; zoom: number }> = Object.fromEntries(
  Object.entries(PLACE_SCENE.rows).filter(([title]) => title.startsWith('Build map')).map(([title, t]) => [`Places: ${title}`, { target: t, zoom: 30 }]),
);
