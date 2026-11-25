/**
 * The sun's position over Calgary from an instant (requirement.md v1.40 §10.4).
 * Pure astronomy in UTC (low-precision almanac formulas, about 0.1° here): no time zones,
 * so the client never needs Calgary's offset (§7.5).
 */

/** Calgary city centre. */
export const CALGARY = { lat: 51.0447, lon: -114.0719 } as const;

export interface SunPosition {
  /** Degrees clockwise from north (90 = east, 180 = south). */
  azimuthDeg: number;
  /** Degrees above the horizon (negative below). */
  elevationDeg: number;
}

const RAD = Math.PI / 180;
const mod = (a: number, n: number) => ((a % n) + n) % n;

export function sunPosition(at: Date, lat: number = CALGARY.lat, lon: number = CALGARY.lon): SunPosition {
  const n = at.getTime() / 86_400_000 + 2440587.5 - 2451545.0; // days since J2000.0
  const g = mod(357.529 + 0.98560028 * n, 360) * RAD; // mean anomaly
  const q = mod(280.459 + 0.98564736 * n, 360); // mean longitude (deg)
  const L = (q + 1.915 * Math.sin(g) + 0.02 * Math.sin(2 * g)) * RAD; // ecliptic longitude
  const e = (23.439 - 0.00000036 * n) * RAD; // obliquity
  const ra = Math.atan2(Math.cos(e) * Math.sin(L), Math.cos(L));
  const dec = Math.asin(Math.sin(e) * Math.sin(L));
  const gmst = mod(18.697374558 + 24.06570982441908 * n, 24) * 15; // degrees
  const ha = (gmst + lon) * RAD - ra; // hour angle
  const phi = lat * RAD;
  const elevation = Math.asin(Math.sin(phi) * Math.sin(dec) + Math.cos(phi) * Math.cos(dec) * Math.cos(ha));
  const azimuth = Math.atan2(-Math.sin(ha) * Math.cos(dec), Math.sin(dec) * Math.cos(phi) - Math.cos(dec) * Math.sin(phi) * Math.cos(ha));
  return { azimuthDeg: mod(azimuth / RAD, 360), elevationDeg: elevation / RAD };
}

export type SunPhase = 'night' | 'dawn' | 'day' | 'dusk';

/** Night below −6° (civil twilight), dawn/dusk within 6° of the horizon (east/west of south), else day. */
export function sunPhase({ azimuthDeg, elevationDeg }: SunPosition): SunPhase {
  if (elevationDeg < -6) return 'night';
  if (elevationDeg < 6) return azimuthDeg < 180 ? 'dawn' : 'dusk';
  return 'day';
}
