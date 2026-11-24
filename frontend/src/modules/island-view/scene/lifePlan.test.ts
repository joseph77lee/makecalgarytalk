import { describe, expect, it } from 'vitest';
import { lifePlan } from './lifePlan';

const always = () => 0; // every chance succeeds
const never = () => 0.999;

describe('island life visitors (M19 busier communities)', () => {
  it('planes pass far more often over NE communities (near the airport)', () => {
    expect(lifePlan('SAD', [], false, never).planeEvery).toBeLessThan(lifePlan('MAH', [], false, never).planeEvery); // Saddle Ridge is NE
  });

  it('deer only with a park, hill, creek or water; cougars only with a park, hill or creek', () => {
    expect(lifePlan('MAH', ['school'], false, always).deer).toBe(0);
    expect(lifePlan('MAH', ['school'], true, always).deer).toBe(2);
    expect(lifePlan('MAH', ['hill'], false, always).deer).toBe(2);
    expect(lifePlan('MAH', ['school'], true, always).cougar).toBe(false);
    expect(lifePlan('MAH', ['big-park'], false, always).cougar).toBe(true);
  });

  it('geese on the ground only by water; nothing visits when every chance fails', () => {
    expect(lifePlan('MAH', [], false, always).geeseOnGround).toBe(0);
    expect(lifePlan('MAH', [], true, always).geeseOnGround).toBe(2);
    expect(lifePlan('MAH', ['hill'], true, never)).toMatchObject({ balloon: false, rabbits: 0, deer: 0, cougar: false, geeseOnGround: 0 });
  });
});
