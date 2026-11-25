import { describe, expect, it } from 'vitest';
import { NOON_CLEAR, type IslandEnvironment } from '../types';
import { futureLandOpacity, MIN_SUN_HEIGHT, mixHex, precipitation, skyLook, towards, windVector } from './sky';

const env = (el: number, az = 180, weather: IslandEnvironment['weather'] = 'clear'): IslandEnvironment => ({
  ...NOON_CLEAR,
  sun: { azimuthDeg: az, elevationDeg: el },
  weather,
});
const RAD = Math.PI / 180;

describe('skyLook: light direction', () => {
  it('winter noon sun (15.5°) is drawn at the minimum height, from the south', () => {
    const [x, y, z] = skyLook(env(15.5)).lightDir;
    expect(y).toBeCloseTo(Math.sin(MIN_SUN_HEIGHT * RAD), 5);
    expect(z).toBeGreaterThan(0.9); // z = south
    expect(Math.abs(x)).toBeLessThan(1e-9);
  });

  it('a high summer sun keeps its real height', () => {
    expect(skyLook(env(62)).lightDir[1]).toBeCloseTo(Math.sin(62 * RAD), 5);
  });

  it('morning light comes from the east, evening light from the west (shadows move)', () => {
    expect(skyLook(env(12, 120)).lightDir[0]).toBeGreaterThan(0.5);
    expect(skyLook(env(12, 240)).lightDir[0]).toBeLessThan(-0.5);
  });

  it('is always a unit vector', () => {
    for (const el of [-40, -6, -3, 0, 5, 30]) {
      expect(Math.hypot(...skyLook(env(el, 200)).lightDir)).toBeCloseTo(1, 6);
    }
  });

  it('towards(): azimuth 90 = +x (east), 180 = +z (south)', () => {
    expect(towards(90, 0)[0]).toBeCloseTo(1);
    expect(towards(180, 0)[2]).toBeCloseTo(1);
  });
});

describe('skyLook: phases', () => {
  it('night: stars, lamps on, low light, full nightness', () => {
    const n = skyLook(env(-30, 0));
    expect(n.nightness).toBe(1);
    expect(n.starsOpacity).toBe(1);
    expect(n.lightsOn).toBe(true);
    expect(n.sunIntensity).toBeLessThan(skyLook(env(30)).sunIntensity / 3);
  });

  it('clear day: no stars, lamps off', () => {
    const d = skyLook(env(15));
    expect(d.starsOpacity).toBe(0);
    expect(d.lightsOn).toBe(false);
  });

  it('lamps switch on as the sun sets', () => {
    expect(skyLook(env(0.5, 235)).lightsOn).toBe(false);
    expect(skyLook(env(-0.5, 235)).lightsOn).toBe(true);
  });

  it('dawn and dusk have different tints', () => {
    expect(skyLook(env(2, 120)).bg[2]).not.toBe(skyLook(env(2, 240)).bg[2]);
  });

  it('blends smoothly at the keyframe edges (no jumps at −6°, 0° and 10°)', () => {
    for (const edge of [-6, 0, 10]) {
      const a = skyLook(env(edge - 0.01, 240));
      const b = skyLook(env(edge + 0.01, 240));
      expect(Math.abs(a.sunIntensity - b.sunIntensity)).toBeLessThan(0.01);
      expect(Math.abs(a.nightness - b.nightness)).toBeLessThan(0.01);
    }
  });
});

describe('skyLook: weather', () => {
  it('clouds dim the sun and grey the sky; storms dim most', () => {
    const clear = skyLook(env(15));
    const overcast = skyLook(env(15, 180, 'overcast'));
    const storm = skyLook(env(15, 180, 'thunderstorm'));
    expect(overcast.sunIntensity).toBeLessThan(clear.sunIntensity * 0.7);
    expect(storm.sunIntensity).toBeLessThan(overcast.sunIntensity);
    expect(overcast.bg[0]).not.toBe(clear.bg[0]);
  });

  it('clouds hide the stars', () => {
    expect(skyLook(env(-30, 0, 'overcast')).starsOpacity).toBeLessThan(0.35);
  });

  it('dark weather turns lamps on near the horizon, not at midday; storms always', () => {
    expect(skyLook(env(3, 200, 'overcast')).lightsOn).toBe(true);
    expect(skyLook(env(15, 180, 'overcast')).lightsOn).toBe(false);
    expect(skyLook(env(15, 180, 'thunderstorm')).lightsOn).toBe(true);
  });

  it('fog is thick in fog, light in snow, none when clear', () => {
    expect(skyLook(env(15, 180, 'fog')).fog).toBe(1);
    expect(skyLook(env(15, 180, 'snow')).fog).toBeGreaterThan(0);
    expect(skyLook(env(15)).fog).toBe(0);
  });
});

describe('precipitation', () => {
  it('only rain, snow, mix and storms fall', () => {
    expect(precipitation('clear', false)).toBeNull();
    expect(precipitation('overcast', false)).toBeNull();
    expect(precipitation('fog', false)).toBeNull();
    expect(precipitation('rain', false)?.kind).toBe('rain');
    expect(precipitation('thunderstorm', false)?.kind).toBe('rain');
    expect(precipitation('snow', false)?.kind).toBe('snow');
    expect(precipitation('mix', false)?.kind).toBe('mix');
  });

  it('stays within the phone budget: ≤ 1,500 particles, ≤ 400 in low quality', () => {
    for (const w of ['rain', 'snow', 'mix', 'thunderstorm'] as const) {
      expect(precipitation(w, false)!.count).toBeLessThanOrEqual(1500);
      expect(precipitation(w, true)!.count).toBeLessThanOrEqual(400);
    }
  });
});

describe('windVector', () => {
  it('a west wind blows towards the east (+x); strength follows the level', () => {
    const w = windVector({ wind: 'windy', windFromDeg: 270 });
    expect(w.x).toBeCloseTo(1);
    expect(Math.abs(w.z)).toBeLessThan(1e-9);
    expect(windVector({ wind: 'calm', windFromDeg: 270 }).strength).toBeLessThan(windVector({ wind: 'breezy', windFromDeg: 270 }).strength);
  });

  it('a north wind blows south (+z); unknown direction falls back to a westerly', () => {
    expect(windVector({ wind: 'breezy', windFromDeg: 0 }).z).toBeGreaterThan(0.5);
    expect(windVector({ wind: 'breezy', windFromDeg: null }).x).toBeGreaterThan(0.5);
  });
});

describe('mixHex', () => {
  it('mixes and clamps', () => {
    expect(mixHex('#000000', '#ffffff', 0.5)).toBe('#808080');
    expect(mixHex('#102030', '#ffffff', -1)).toBe('#102030');
    expect(mixHex('#102030', '#ffffff', 2)).toBe('#ffffff');
  });
});

describe('futureLandOpacity', () => {
  it('clear by day, nearly gone at night and in storms', () => {
    expect(futureLandOpacity(skyLook(env(15)))).toBeCloseTo(0.16);
    expect(futureLandOpacity(skyLook(env(-30, 0)))).toBeLessThan(0.025);
    expect(futureLandOpacity(skyLook(env(15, 180, 'thunderstorm')))).toBeLessThan(0.1);
    expect(futureLandOpacity(skyLook(env(15, 180, 'overcast')))).toBeGreaterThan(0.12);
  });
});
