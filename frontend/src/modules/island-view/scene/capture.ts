/** A still picture of the island for share cards (requirement.md v1.31 §12.2). */

type Capturer = () => HTMLCanvasElement | null;
let capturer: Capturer | null = null;

export function setIslandCapturer(c: Capturer | null): void {
  capturer = c;
}

/** The island as it is on screen now (transparent sky, no HTML labels), cropped; null when no island is shown. */
export function captureIsland(): HTMLCanvasElement | null {
  return capturer?.() ?? null;
}

/** Bounding box of the non-transparent pixels (RGBA data), or null when all are transparent. */
export function opaqueBox(data: Uint8ClampedArray, width: number, height: number): { x: number; y: number; w: number; h: number } | null {
  let minX = width;
  let minY = height;
  let maxX = -1;
  let maxY = -1;
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      if (data[(y * width + x) * 4 + 3]! > 8) {
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
      }
    }
  }
  return maxX < 0 ? null : { x: minX, y: minY, w: maxX - minX + 1, h: maxY - minY + 1 };
}
