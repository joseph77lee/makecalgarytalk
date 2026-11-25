import { describe, expect, it } from 'vitest';
import { initialSnowMemo, nextSnowMemo, snowVisible } from './snowCover';

describe('lying snow (requirement v1.40 §10.4)', () => {
  it('snow already there when the island opens stays visible, also after the first seconds (bug 2026-11-25)', () => {
    let m = initialSnowMemo(true);
    expect(snowVisible(m, 0)).toBe(true);
    m = nextSnowMemo(m, true, true, false); // later renders while it keeps snowing
    expect(snowVisible(m, 0)).toBe(true);
  });

  it('the first weather answer right after opening counts as already there', () => {
    let m = initialSnowMemo(false); // clear until the answer arrives
    m = nextSnowMemo(m, true, true, true);
    expect(snowVisible(m, 0)).toBe(true);
  });

  it('snow that starts while the island is open waits, then shows', () => {
    let m = initialSnowMemo(false);
    m = nextSnowMemo(m, true, true, false);
    expect(m.late).toBe(true);
    expect(snowVisible(m, 0)).toBe(false);
    expect(snowVisible(m, m.episode)).toBe(true); // the wait is over
  });

  it('cover that appears without falling snow shows at once; melting hides it at once', () => {
    let m = initialSnowMemo(false);
    m = nextSnowMemo(m, true, false, false);
    expect(snowVisible(m, 0)).toBe(true);
    m = nextSnowMemo(m, false, false, false);
    expect(snowVisible(m, 0)).toBe(false);
  });

  it('a second late start waits again', () => {
    let m = initialSnowMemo(false);
    m = nextSnowMemo(m, true, true, false);
    const first = m.episode;
    m = nextSnowMemo(m, false, false, false);
    m = nextSnowMemo(m, true, true, false);
    expect(snowVisible(m, first)).toBe(false);
    expect(snowVisible(m, m.episode)).toBe(true);
  });

  it('keeps the same memo object when nothing changed (no extra renders)', () => {
    const m = initialSnowMemo(true);
    expect(nextSnowMemo(m, true, true, false)).toBe(m);
  });
});
