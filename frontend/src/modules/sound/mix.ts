/**
 * What the island sounds like right now (requirement.md v1.43 §10.5): ambience loops and the music
 * track from the weather, the time of day and what is on the island. Pure, so it is easy to test.
 */
import type { LoopName, TrackName } from './catalog';

export interface SoundScene {
  weather: 'clear' | 'partly_cloudy' | 'overcast' | 'rain' | 'snow' | 'mix' | 'fog' | 'thunderstorm';
  wind: 'calm' | 'breezy' | 'windy';
  /** 0 = day … 1 = night. */
  nightness: number;
  hasWater: boolean;
  /** A campfire burns (fire pit and later buildings). */
  campfire: boolean;
  /** Something is being built. */
  construction: boolean;
}

/** At most this many loops at once, so the island never gets noisy. */
export const MAX_LOOPS = 3;

export function ambienceMix(s: SoundScene): Partial<Record<LoopName, number>> {
  const wet = s.weather === 'rain' || s.weather === 'mix' || s.weather === 'thunderstorm';
  const night = s.nightness > 0.5;
  const candidates: [LoopName, number][] = [];
  // weather and air first
  if (wet) candidates.push(['ambient-rain', s.weather === 'thunderstorm' ? 0.45 : 0.35]);
  else if (night) candidates.push(['ambient-night', 0.28]);
  if (s.wind !== 'calm' && candidates.length === 0) candidates.push(['ambient-wind', s.wind === 'windy' ? 0.32 : 0.16]);
  // life and places
  if (!night && !wet && s.weather !== 'fog') candidates.push(['ambient-birds', 0.2]);
  if (s.campfire && night) candidates.push(['campfire', 0.2]);
  if (s.hasWater) candidates.push(['ambient-water', 0.16]);
  if (s.construction && !night) candidates.push(['construction-site', 0.1]);
  if (s.campfire && !night) candidates.push(['campfire', 0.12]);
  const out: Partial<Record<LoopName, number>> = {};
  for (const [name, volume] of candidates) {
    if (Object.keys(out).length >= MAX_LOOPS) break;
    if (out[name] === undefined) out[name] = volume;
  }
  return out;
}

/** Snow tune while it snows, night tune at night, otherwise the day tune. */
export function musicFor(s: Pick<SoundScene, 'weather' | 'nightness'>): TrackName {
  if (s.weather === 'snow' || s.weather === 'mix') return 'music-snow';
  return s.nightness > 0.5 ? 'music-night' : 'music-day';
}

/** The work sound at a construction site, by what is being built. */
export function workSound(buildingKey: string | null): 'construction-hammer-roof' | 'action-shovel' | 'action-sweep' {
  if (!buildingKey) return 'construction-hammer-roof';
  if (/pond|rink|sledding|hill/.test(buildingKey)) return 'action-shovel';
  if (/park|garden|dog/.test(buildingKey)) return 'action-sweep';
  return 'construction-hammer-roof';
}
