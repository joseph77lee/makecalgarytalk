/**
 * Sky and light for the island from the real sun and Calgary's weather (requirement.md v1.40
 * §10.4). Pure: the scene only applies the result. The keyframes are the times of day reviewed
 * in the asset gallery (M19): day, dawn, dusk and night, blended by the sun's height.
 */
import type { IslandEnvironment } from '../types';

export interface SkyLook {
  /** Unit vector from the island towards the light (x = east, y = up, z = south). */
  lightDir: [number, number, number];
  sunColor: string;
  sunIntensity: number;
  hemiSky: string;
  hemiGround: string;
  ambientIntensity: number;
  /** CSS background stops, top to bottom. */
  bg: [string, string, string];
  starsOpacity: number;
  /** Lamps and public windows on. */
  lightsOn: boolean;
  /** 0 = clear sky … 1 = storm clouds. */
  cloudiness: number;
  /** 0 = no fog … 1 = thick fog (scene fog colour = the lowest sky stop). */
  fog: number;
  /** 0 = day … 1 = full night. */
  nightness: number;
}

interface Key {
  sunColor: string;
  sunI: number;
  hemiSky: string;
  hemiGround: string;
  ambI: number;
  bg: [string, string, string];
}

const DAY: Key = { sunColor: '#fff4e2', sunI: 2.35, hemiSky: '#ffffff', hemiGround: '#d9d2ea', ambI: 1.2, bg: ['#c6e0fb', '#e6f0fc', '#f3eefe'] };
const DAWN: Key = { sunColor: '#ffbf98', sunI: 1.7, hemiSky: '#ffe0d0', hemiGround: '#b4a8d6', ambI: 1.15, bg: ['#a9a7e0', '#f2c3c6', '#ffe0c2'] };
const DUSK: Key = { sunColor: '#ffa868', sunI: 1.9, hemiSky: '#ffd8ac', hemiGround: '#a98fc4', ambI: 1.1, bg: ['#7d78c8', '#ee9bb2', '#ffc58c'] };
// Night stays pastel blue, never black (§10.4).
const NIGHT: Key = { sunColor: '#b4c4ff', sunI: 0.7, hemiSky: '#8a98cc', hemiGround: '#3a4266', ambI: 0.95, bg: ['#121a3d', '#28346a', '#41467c'] };

/** How cloudy each weather state makes the sky (dims the sun, greys the sky). */
export const CLOUDINESS: Record<IslandEnvironment['weather'], number> = {
  clear: 0,
  partly_cloudy: 0.25,
  overcast: 0.7,
  rain: 0.8,
  snow: 0.65,
  mix: 0.75,
  fog: 0.6,
  thunderstorm: 0.95,
};

const FOG: Record<IslandEnvironment['weather'], number> = {
  clear: 0,
  partly_cloudy: 0,
  overcast: 0,
  rain: 0.25,
  snow: 0.35,
  mix: 0.3,
  fog: 1,
  thunderstorm: 0.3,
};

/** The drawn sun is never lower than this by day, so winter shadows do not cover the island. */
export const MIN_SUN_HEIGHT = 22;
const MOON_HEIGHT = 50;

const RAD = Math.PI / 180;
const clamp01 = (t: number) => Math.min(1, Math.max(0, t));

export function mixHex(a: string, b: string, t: number): string {
  const k = clamp01(t);
  const pa = parseInt(a.slice(1), 16);
  const pb = parseInt(b.slice(1), 16);
  const ch = (s: number) => Math.round(((pa >> s) & 255) + (((pb >> s) & 255) - ((pa >> s) & 255)) * k);
  return `#${((ch(16) << 16) | (ch(8) << 8) | ch(0)).toString(16).padStart(6, '0')}`;
}

function mixKey(a: Key, b: Key, t: number): Key {
  const n = (x: number, y: number) => x + (y - x) * clamp01(t);
  return {
    sunColor: mixHex(a.sunColor, b.sunColor, t),
    sunI: n(a.sunI, b.sunI),
    hemiSky: mixHex(a.hemiSky, b.hemiSky, t),
    hemiGround: mixHex(a.hemiGround, b.hemiGround, t),
    ambI: n(a.ambI, b.ambI),
    bg: [mixHex(a.bg[0], b.bg[0], t), mixHex(a.bg[1], b.bg[1], t), mixHex(a.bg[2], b.bg[2], t)],
  };
}

/** Direction towards a body at azimuth (clockwise from north) and height, in island axes. */
export function towards(azimuthDeg: number, heightDeg: number): [number, number, number] {
  const a = azimuthDeg * RAD;
  const e = heightDeg * RAD;
  return [Math.sin(a) * Math.cos(e), Math.sin(e), -Math.cos(a) * Math.cos(e)];
}

export function skyLook(env: IslandEnvironment): SkyLook {
  const { azimuthDeg: az, elevationDeg: el } = env.sun;
  const twilight = az < 180 ? DAWN : DUSK;
  let key: Key;
  let nightness: number;
  if (el >= 10) {
    key = DAY;
    nightness = 0;
  } else if (el >= 0) {
    key = mixKey(twilight, DAY, el / 10);
    nightness = 0;
  } else if (el >= -6) {
    nightness = 1 - (el + 6) / 6;
    key = mixKey(twilight, NIGHT, nightness);
  } else {
    key = NIGHT;
    nightness = 1;
  }

  const c = CLOUDINESS[env.weather];
  const grey = mixHex('#c9ced9', '#3c4260', nightness);
  const groundGrey = mixHex('#cfd3dc', '#343a56', nightness);

  // Light from the real sun (kept above MIN_SUN_HEIGHT), turning into a high moon light at night.
  const sun = towards(az, Math.max(el, MIN_SUN_HEIGHT));
  const moon = towards((az + 180) % 360, MOON_HEIGHT);
  const raw = sun.map((v, i) => v + (moon[i] - v) * nightness) as [number, number, number];
  const len = Math.hypot(...raw) || 1;

  return {
    lightDir: [raw[0] / len, raw[1] / len, raw[2] / len],
    sunColor: mixHex(key.sunColor, '#e9edf5', c * 0.6),
    sunIntensity: key.sunI * (1 - 0.65 * c),
    hemiSky: mixHex(key.hemiSky, grey, c * 0.5),
    hemiGround: mixHex(key.hemiGround, groundGrey, c * 0.4),
    ambientIntensity: key.ambI * (1 + 0.1 * c),
    bg: [mixHex(key.bg[0], grey, c * 0.75), mixHex(key.bg[1], grey, c * 0.7), mixHex(key.bg[2], grey, c * 0.6)],
    starsOpacity: nightness * (1 - c),
    lightsOn: el < 0 || env.weather === 'thunderstorm' || ((env.weather === 'fog' || c >= 0.7) && el < 6),
    cloudiness: c,
    fog: FOG[env.weather],
    nightness,
  };
}

/**
 * Faint outline of the land still to come: clear by day, nearly gone at night and in dark storms
 * (white boxes stand out against a dark sky).
 */
export function futureLandOpacity(look: Pick<SkyLook, 'nightness' | 'cloudiness'>): number {
  const dark = Math.max(look.nightness, (look.cloudiness - 0.6) * 1.5);
  return 0.16 * (1 - 0.88 * Math.min(1, Math.max(0, dark)));
}

/** CSS background for the sky behind the canvas. */
export function skyBackground(look: SkyLook): string {
  return `linear-gradient(to bottom, ${look.bg[0]} 0%, ${look.bg[1]} 58%, ${look.bg[2]} 100%)`;
}

/** Wind as a horizontal push in island axes (towards where it blows), scaled by its level. */
export function windVector(env: Pick<IslandEnvironment, 'wind' | 'windFromDeg'>): { x: number; z: number; strength: number } {
  const strength = env.wind === 'windy' ? 1 : env.wind === 'breezy' ? 0.55 : 0.18;
  const to = (((env.windFromDeg ?? 270) + 180) % 360) * RAD; // Calgary's usual westerly when unknown
  return { x: Math.sin(to) * strength, z: -Math.cos(to) * strength, strength };
}

export type PrecipKind = 'rain' | 'snow' | 'mix';

/** Falling rain/snow and its particle count (§20.3a: capped, fewer in low quality). */
export function precipitation(weather: IslandEnvironment['weather'], lowQuality: boolean): { kind: PrecipKind; count: number } | null {
  const full: Partial<Record<IslandEnvironment['weather'], [PrecipKind, number]>> = {
    rain: ['rain', 1100],
    thunderstorm: ['rain', 1500],
    snow: ['snow', 900],
    mix: ['mix', 1000],
  };
  const p = full[weather];
  if (!p) return null;
  return { kind: p[0], count: lowQuality ? Math.min(400, Math.round(p[1] / 3)) : p[1] };
}

/** Night-sky stars: one tile of soft dots repeated over the sky (CSS background layers). */
const STAR_SPOTS: [number, number, number][] = [
  [8, 12, 1.5], [31, 5, 1], [52, 22, 2], [74, 9, 1.2], [91, 30, 1.5], [17, 41, 1], [44, 55, 1.6], [66, 46, 1],
  [86, 63, 1.8], [6, 72, 1.2], [29, 86, 1.6], [57, 79, 1], [78, 92, 1.3], [38, 30, 1], [95, 85, 1],
];
export const STARS = STAR_SPOTS.map(([x, y, r]) => `radial-gradient(${r}px ${r}px at ${x}% ${y}%, #fff 60%, transparent 100%)`).join(', ');
export const STARS_TILE = '220px 170px';
