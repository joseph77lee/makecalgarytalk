/**
 * Time of day and snow on box parts (requirement.md v1.40 §10.4).
 *   - Lights on (night, storms): lamps glow with a warm pool on the ground; about 70 % of public
 *     windows and every house window glow (requirement v1.48 §7.2: every house is lit at night).
 *   - Lights off: lamp heads are off.
 *   - Snow: roofs turn snowy.
 */
import type { BoxPart } from './boxes';
import { ART } from './voxel/samples';
import { rnd } from './voxel/voxel';

const WINDOW_COLOURS = new Set<string>([ART.glass, ART.glassDark, '#a9d3ea']);
export const LAMP = '#ffe7a3';
const LAMP_OFF = '#f1ece0';
const DARK_GLASS = '#2b3550';
export const SNOW_WHITE = '#f6f8fb';

/** Water a model draws itself takes the island's water colour (icy with snow; v1.48 §7.6b). */
export function withWater(parts: BoxPart[], water: string): BoxPart[] {
  return parts.some((b) => b.tag === 'water') ? parts.map((b) => (b.tag === 'water' ? { ...b, c: water } : b)) : parts;
}

export function withLights(parts: BoxPart[], on: boolean): BoxPart[] {
  const out: BoxPart[] = [];
  for (const b of parts) {
    if (b.layer === 'glow' && b.c === LAMP) {
      if (on) {
        out.push(b);
        // a soft warm pool under tall lamps (not under small lit details)
        if (b.s[1] > 0.1) out.push({ layer: 'mist', p: [b.p[0], 0.02, b.p[2]], s: [1.6, 0.02, 1.6], c: '#ffd27a' }, { layer: 'mist', p: [b.p[0], 0.03, b.p[2]], s: [0.9, 0.02, 0.9], c: '#ffe2a0' });
      } else out.push({ ...b, layer: 'solid', c: LAMP_OFF });
    } else if (on && b.layer === 'solid' && WINDOW_COLOURS.has(b.c)) {
      const lit = b.tag === 'village-window' || rnd(Math.round(b.p[0] * 97), Math.round(b.p[1] * 89), Math.round(b.p[2] * 83)) < 0.7;
      out.push(lit ? { ...b, layer: 'glow', c: rnd(Math.round(b.p[0] * 31), Math.round(b.p[2] * 37), 5) < 0.5 ? '#ffd98a' : '#ffe6b3' } : { ...b, c: DARK_GLASS });
    } else out.push(b);
  }
  return out;
}

/** Grass colours the place and landmark models paint their own ground with. */
const MODEL_GRASS = new Set(['#93cb6c', '#8cc867', '#9fd47a']);
/** Snow on the ground (the island's winter grass, mood.ts). */
const SNOW_GROUND = '#eef3f9';
/** Thin enough to be ground (a lawn or a terrace top), not a bush or leaves. */
const GROUND_THICKNESS = 1.2 / 12;

/** Snowy roofs (the roof colour shows only faintly through the snow) and snow on the models' own lawns. */
export function withSnow(parts: BoxPart[], snow: boolean): BoxPart[] {
  if (!snow) return parts;
  return parts.map((b) =>
    b.tag === 'roof' ? { ...b, c: snowOver(b.c) } : b.layer === 'solid' && MODEL_GRASS.has(b.c) && b.s[1] <= GROUND_THICKNESS ? { ...b, c: SNOW_GROUND } : b,
  );
}

function snowOver(c: string): string {
  const v = parseInt(c.slice(1), 16);
  const s = parseInt(SNOW_WHITE.slice(1), 16);
  const ch = (k: number) => Math.round(((v >> k) & 255) * 0.18 + ((s >> k) & 255) * 0.82);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}
