/**
 * Sections of the gallery's "New voxel designs" (M23 rework): where each starts and how close the
 * camera comes. Plates are sized to their content by `designLayout.ts`.
 */
import { buildDesignScene, DESIGN_SECTIONS, type DesignSection } from './designLayout';

export { DESIGN_SECTIONS, type DesignSection };

/** The laid-out scene (built once; the gallery draws it and the presets frame its plates). */
export const DESIGN_SCENE = buildDesignScene();

/** Camera presets: the middle of each plate. */
export const DESIGN_VIEWS = Object.fromEntries(
  Object.entries(DESIGN_SCENE.plates).map(([name, pl]) => [name, { target: [pl.x0 + pl.w / 2, pl.z0 + pl.d / 2] as [number, number], zoom: DESIGN_SECTIONS[name as DesignSection].zoom }]),
) as Record<DesignSection, { target: [number, number]; zoom: number }>;
