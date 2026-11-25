import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';
import { EFFECTS, LOOPS, TRACKS } from './catalog';
import { ambienceMix, MAX_LOOPS, musicFor, workSound, type SoundScene } from './mix';
import { DEFAULT_SETTINGS, readSettings } from './settings';

const scene = (o: Partial<SoundScene> = {}): SoundScene => ({ weather: 'clear', wind: 'calm', nightness: 0, hasWater: false, campfire: false, construction: false, ...o });

describe('ambienceMix (requirement v1.43 §10.5)', () => {
  it('clear calm day: birds; nothing else without water, fire or building', () => {
    expect(ambienceMix(scene())).toEqual({ 'ambient-birds': 0.2 });
  });

  it('rain replaces birds; storms are louder', () => {
    const rain = ambienceMix(scene({ weather: 'rain' }));
    expect(rain['ambient-rain']).toBe(0.35);
    expect(rain['ambient-birds']).toBeUndefined();
    expect(ambienceMix(scene({ weather: 'thunderstorm' }))['ambient-rain']).toBeGreaterThan(0.35);
  });

  it('night: the quiet winter night and the campfire, no birds', () => {
    const m = ambienceMix(scene({ nightness: 1, campfire: true }));
    expect(m['ambient-night']).toBeDefined();
    expect(m.campfire).toBeDefined();
    expect(m['ambient-birds']).toBeUndefined();
  });

  it('wind by its strength when nothing else covers the air', () => {
    expect(ambienceMix(scene({ wind: 'windy' }))['ambient-wind']).toBeGreaterThan(ambienceMix(scene({ wind: 'breezy' }))['ambient-wind']!);
    expect(ambienceMix(scene({ wind: 'calm' }))['ambient-wind']).toBeUndefined();
  });

  it('never more than 3 loops, never louder than half volume', () => {
    for (const weather of ['clear', 'rain', 'thunderstorm', 'snow', 'fog'] as const)
      for (const nightness of [0, 1]) {
        const m = ambienceMix(scene({ weather, nightness, wind: 'windy', hasWater: true, campfire: true, construction: true }));
        expect(Object.keys(m).length).toBeLessThanOrEqual(MAX_LOOPS);
        for (const v of Object.values(m)) expect(v).toBeLessThanOrEqual(0.5);
      }
  });
});

describe('musicFor', () => {
  it('snow tune while it snows, night tune at night, day tune otherwise', () => {
    expect(musicFor({ weather: 'snow', nightness: 1 })).toBe('music-snow');
    expect(musicFor({ weather: 'mix', nightness: 0 })).toBe('music-snow');
    expect(musicFor({ weather: 'clear', nightness: 1 })).toBe('music-night');
    expect(musicFor({ weather: 'rain', nightness: 0 })).toBe('music-day');
  });
});

describe('workSound', () => {
  it('hammer for buildings, shovel for ice and snow places, broom for parks and gardens', () => {
    expect(workSound('fire-pit')).toBe('construction-hammer-roof');
    expect(workSound('frozen-pond')).toBe('action-shovel');
    expect(workSound('skating-rink')).toBe('action-shovel');
    expect(workSound('community-garden')).toBe('action-sweep');
    expect(workSound('neighbourhood-park')).toBe('action-sweep');
    expect(workSound(null)).toBe('construction-hammer-roof');
  });
});

describe('sound settings (requirement v1.44)', () => {
  it('all on at full volume by default', () => {
    expect(DEFAULT_SETTINGS).toEqual({ on: { music: true, ambience: true, effects: true }, volume: { music: 1, ambience: 1, effects: 1 } });
  });
  it('reads saved switches and volumes, clamping volumes to 0..1', () => {
    const saved = { on: { music: false, ambience: true, effects: true }, volume: { music: 0.3, ambience: 2, effects: -1 } };
    expect(readSettings({ getItem: () => JSON.stringify(saved) })).toEqual({ on: saved.on, volume: { music: 0.3, ambience: 1, effects: 0 } });
  });
  it('understands the first version ({music, effects}): ambience follows effects', () => {
    expect(readSettings({ getItem: () => JSON.stringify({ music: true, effects: false }) })).toEqual({
      on: { music: true, ambience: false, effects: false },
      volume: { music: 1, ambience: 1, effects: 1 },
    });
  });
  it('junk, no storage or blocked storage fall back to the default', () => {
    expect(readSettings({ getItem: () => '{oops' })).toEqual(DEFAULT_SETTINGS);
    expect(readSettings(null)).toEqual(DEFAULT_SETTINGS);
    expect(readSettings({ getItem: () => { throw new Error('blocked'); } })).toEqual(DEFAULT_SETTINGS);
  });
});

describe('sound files', () => {
  it('every required sound is in public/sfx; optional ones have a fallback that is', () => {
    const dir = join(process.cwd(), 'public', 'sfx');
    const required = Object.entries(EFFECTS).filter(([, spec]) => !('fallback' in spec)).map(([n]) => n);
    const missing = [...required, ...LOOPS, ...TRACKS].filter((n) => !existsSync(join(dir, `${n}.mp3`)));
    expect(missing).toEqual([]);
    // optional files (animals, villagers) fall back to an existing sound
    for (const spec of Object.values(EFFECTS)) if ('fallback' in spec) expect(existsSync(join(dir, `${spec.fallback}.mp3`))).toBe(true);
  });
});
