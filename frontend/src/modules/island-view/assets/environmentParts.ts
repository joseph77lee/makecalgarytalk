/**
 * Time of day and snow on box parts (requirement.md v1.40 §10.4).
 *   - Lights on (night, storms): lamps glow with a warm pool on the ground; about 70 % of public
 *     windows glow (the rest stay dark). Residents' windows (`house-window`) never light here:
 *     a house is lit only when its resident was active today (§7.2), so it already glows.
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
      if (b.tag === 'house-window') {
        out.push({ ...b, c: DARK_GLASS });
        continue;
      }
      const lit = rnd(Math.round(b.p[0] * 97), Math.round(b.p[1] * 89), Math.round(b.p[2] * 83)) < (b.tag === 'village-window' ? 0.85 : 0.7);
      out.push(lit ? { ...b, layer: 'glow', c: rnd(Math.round(b.p[0] * 31), Math.round(b.p[2] * 37), 5) < 0.5 ? '#ffd98a' : '#ffe6b3' } : { ...b, c: DARK_GLASS });
    } else out.push(b);
  }
  return out;
}

/** Snowy roofs: the roof colour shows only faintly through the snow. */
export function withSnow(parts: BoxPart[], snow: boolean): BoxPart[] {
  if (!snow) return parts;
  return parts.map((b) => (b.tag === 'roof' ? { ...b, c: snowOver(b.c) } : b));
}

function snowOver(c: string): string {
  const v = parseInt(c.slice(1), 16);
  const s = parseInt(SNOW_WHITE.slice(1), 16);
  const ch = (k: number) => Math.round(((v >> k) & 255) * 0.18 + ((s >> k) & 255) * 0.82);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}
