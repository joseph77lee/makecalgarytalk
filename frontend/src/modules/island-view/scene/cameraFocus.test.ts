import { beforeEach, describe, expect, it } from 'vitest';
import { cameraFocus, clampToBounds, landBounds, requestViewReset, setCameraFocus, startManualView, viewReset } from './cameraFocus';

describe('free camera (requirement v1.48 §10.1)', () => {
  beforeEach(() => {
    cameraFocus.manual = false;
    viewReset.requested = false;
    setCameraFocus(0, 0);
  });

  it('a pan pauses following until the avatar moves again', () => {
    setCameraFocus(2, 3);
    startManualView();
    expect(cameraFocus.manual).toBe(true);
    setCameraFocus(2.01, 3); // standing still (tiny jitter): keep the player's view
    expect(cameraFocus.manual).toBe(true);
    setCameraFocus(2.5, 3); // walking: follow again
    expect(cameraFocus.manual).toBe(false);
  });

  it('the compass brings the start view back and resumes following', () => {
    startManualView();
    requestViewReset();
    expect(viewReset.requested).toBe(true);
    expect(cameraFocus.manual).toBe(false);
  });

  it('panning stays on the risen land', () => {
    const b = landBounds([{ x: -3, z: -2 }, { x: 4, z: 5 }, { x: 0, z: 0 }]);
    expect(b).toEqual({ minX: -3, maxX: 5, minZ: -2, maxZ: 6 });
    expect(clampToBounds(10, -10, b)).toEqual([5, -2]);
    expect(clampToBounds(1, 1, b)).toEqual([1, 1]);
    expect(landBounds([])).toEqual({ minX: -1, maxX: 1, minZ: -1, maxZ: 1 });
  });
});
