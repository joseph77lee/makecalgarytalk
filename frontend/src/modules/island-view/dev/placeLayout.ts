/** Layout of the gallery's place library (community-identity build map, 2026-11-26): one row per persona. */
import { box, translate, type BoxPart } from '../assets/boxes';
import { PLACE_LIBRARY, personaTrack, type Persona } from '../assets/voxel/placeLibrary';

export const PLACE_ORIGIN: [number, number] = [240, 0];
const ROW_GAP = 5.5;
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
  PERSONAS.forEach(([persona, title], r) => {
    const z = Z0 + r * ROW_GAP;
    let x = X0;
    const track = personaTrack(persona);
    for (const key of track) {
      const place = PLACE_LIBRARY[key];
      const [w, d] = place.tiles;
      const cx = x + w / 2;
      const cz = z + 1.5;
      parts.push(box('solid', cx, -0.3, cz, w + 0.6, 0.3, d + 0.6, '#9fd47a'), box('solid', cx, -0.6, cz, w + 0.6, 0.3, d + 0.6, '#c49a6c'));
      parts.push(...translate(place.build(7), cx, cz));
      const last = place.step === track.length;
      labels.push({ text: `${last ? '★ ' : ''}${place.step} · ${place.label}`, at: [cx, 0.2, cz + d / 2 + 0.6], landmark: last });
      x += w + 1.4;
    }
    labels.push({ text: title, at: [X0 - 1.6, 0.2, z + 1.5], landmark: false });
    rows[title] = [(X0 + x) / 2, z + 1.5];
  });
  return { parts, labels, rows };
}

export const PLACE_SCENE = buildScene();

/** Camera presets: each persona row, and everything. */
export const PLACE_VIEWS: Record<string, { target: [number, number]; zoom: number }> = {
  'Places: all': { target: [PLACE_ORIGIN[0] + 7, PLACE_ORIGIN[1] + 15], zoom: 26 },
  ...Object.fromEntries(Object.entries(PLACE_SCENE.rows).map(([title, t]) => [`Places: ${title}`, { target: t, zoom: 62 }])),
};

