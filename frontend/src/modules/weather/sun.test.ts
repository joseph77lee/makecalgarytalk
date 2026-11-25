import { describe, expect, it } from 'vitest';
import { CALGARY, sunPhase, sunPosition } from './sun';

/** Highest sun of a UTC day, sampled every minute. */
function highest(day: string) {
  let best = { at: new Date(0), elevationDeg: -90, azimuthDeg: 0 };
  const start = Date.parse(`${day}T00:00:00Z`);
  for (let m = 0; m < 24 * 60; m++) {
    const at = new Date(start + m * 60_000);
    const p = sunPosition(at);
    if (p.elevationDeg > best.elevationDeg) best = { at, ...p };
  }
  return best;
}

// Expected values come from geometry, not from another solar library:
// noon height = 90° − latitude + declination (±23.44° at the solstices, ≈ 0 at the equinox);
// sunrise azimuth: cos A = sin(declination) / cos(latitude); lowest sun = latitude + declination − 90°;
// solar noon ≈ 12:00 UTC + 114.07° / 15 ≈ 19:36 UTC (± the equation of time, a few minutes).
describe('sunPosition over Calgary', () => {
  it('winter solstice: low noon sun due south about 19:35 UTC', () => {
    const h = highest('2026-12-21');
    expect(h.elevationDeg).toBeCloseTo(90 - CALGARY.lat - 23.44, 0);
    expect(Math.abs(h.azimuthDeg - 180)).toBeLessThan(1);
    const minutes = h.at.getUTCHours() * 60 + h.at.getUTCMinutes();
    expect(Math.abs(minutes - (19 * 60 + 35))).toBeLessThan(6);
  });

  it('summer solstice: high noon sun', () => {
    expect(highest('2026-06-21').elevationDeg).toBeCloseTo(90 - CALGARY.lat + 23.44, 0);
  });

  it('spring equinox: noon height near 90° − latitude', () => {
    expect(Math.abs(highest('2026-03-20').elevationDeg - (90 - CALGARY.lat))).toBeLessThan(0.7);
  });

  it('winter sunrise in the south-east', () => {
    const start = Date.parse('2026-12-21T12:00:00Z');
    let rise = null as null | number;
    for (let m = 0; m < 8 * 60; m++) {
      const p = sunPosition(new Date(start + m * 60_000));
      if (p.elevationDeg >= -0.05) {
        rise = p.azimuthDeg;
        break;
      }
    }
    const expected = Math.acos(Math.sin(-23.44 * (Math.PI / 180)) / Math.cos(CALGARY.lat * (Math.PI / 180))) * (180 / Math.PI);
    expect(rise).not.toBeNull();
    expect(Math.abs((rise ?? 0) - expected)).toBeLessThan(1.5);
  });

  it('winter midnight: sun far below the north horizon', () => {
    const p = sunPosition(new Date('2026-12-21T07:36:00Z'));
    expect(Math.abs(p.elevationDeg - (CALGARY.lat - 23.44 - 90))).toBeLessThan(0.6);
    expect(Math.min(p.azimuthDeg, 360 - p.azimuthDeg)).toBeLessThan(3);
  });
});

describe('sunPhase', () => {
  it('splits at −6° and +6°, dawn east of south and dusk west', () => {
    expect(sunPhase({ elevationDeg: -6.1, azimuthDeg: 100 })).toBe('night');
    expect(sunPhase({ elevationDeg: -6, azimuthDeg: 100 })).toBe('dawn');
    expect(sunPhase({ elevationDeg: 5.9, azimuthDeg: 240 })).toBe('dusk');
    expect(sunPhase({ elevationDeg: 6, azimuthDeg: 240 })).toBe('day');
  });
});
