/** Layout of the Polyfork side of the asset gallery (M23); drawn by `PolyforkGallery.tsx`. */

/** Where each section sits (x0, z0 = its plate's corner) and how the camera frames it. */
export const PF_SECTIONS = {
  'Compare houses': { x0: 40, z0: 0, w: 13, d: 12, zoom: 70 },
  'Polyfork houses': { x0: 40, z0: 14, w: 13, d: 5, zoom: 75 },
  'Polyfork towers': { x0: 40, z0: 21, w: 13, d: 4, zoom: 55 },
  'Polyfork nature & street': { x0: 40, z0: 27, w: 13, d: 8, zoom: 70 },
  'Polyfork people': { x0: 40, z0: 37, w: 13, d: 4, zoom: 130 },
  'Polyfork lots A': { x0: 56, z0: 0, w: 17, d: 15, zoom: 50 },
  'Polyfork lots B': { x0: 56, z0: 17, w: 17, d: 18, zoom: 45 },
} as const;
export type PfSection = keyof typeof PF_SECTIONS;

/** Camera presets for the gallery (target x, z at the plate's middle). */
export const PF_VIEWS = Object.fromEntries(
  Object.entries(PF_SECTIONS).map(([name, s]) => [name, { target: [s.x0 + s.w / 2, s.z0 + s.d / 2] as [number, number], zoom: s.zoom }]),
) as Record<PfSection, { target: [number, number]; zoom: number }>;
