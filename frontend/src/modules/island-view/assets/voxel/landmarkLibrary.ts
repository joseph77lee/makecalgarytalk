/**
 * Unique landmarks by community code (community-identity build map, 2026-11-26): the last step of a
 * priority community's persona track, replacing the pattern landmark. Keys `landmark.<code>`; the
 * persona matches `supabase/data/community_personas.csv` (tested). Not used by the islands yet.
 */
import type { BoxPart } from '../boxes';
import { extent } from './designFit';
import type { PlaceModel } from './placeLibrary';
import { caboosePark, curvedLibrary, domedCulturalCentre, footballStadium, heritageRedBarn, lionArchBridge, redSpiralBridge, signalHillStones, skiJumpTower, stoneArchGate } from './uniqueLandmarks';
import { vmove } from './voxel';

export interface LandmarkModel extends Omit<PlaceModel, 'step'> {
  /** Community code (as in `calgary_communities.csv`). */
  code: string;
}

const centred = (build: (seed: number) => BoxPart[]) => (seed: number) => {
  const parts = build(seed);
  const e = extent(parts);
  return vmove(parts, -e.cx, 0, -e.cz);
};

const LIBRARY = {
  'landmark.sig': { code: 'SIG', label: 'Stone numbers on the hillside', persona: 'hill_view', tiles: [4, 3], site: 'slope', build: signalHillStones },
  'landmark.cre': { code: 'CRE', label: 'Lion arch bridge', persona: 'hill_view', tiles: [5, 1], site: 'riverbank', build: lionArchBridge },
  'landmark.eau': { code: 'EAU', label: 'Red spiral footbridge', persona: 'downtown', tiles: [5, 1], site: 'riverbank', build: redSpiralBridge },
  'landmark.wsp': { code: 'WSP', label: 'Ski jump tower', persona: 'mature_suburb', tiles: [3, 5], site: 'slope', build: skiJumpTower },
  'landmark.dne': { code: 'DNE', label: 'Curved library', persona: 'downtown', tiles: [4, 3], site: 'plaza', build: curvedLibrary },
  'landmark.chn': { code: 'CHN', label: 'Domed cultural centre', persona: 'food_street', tiles: [3, 3], site: 'plaza', build: domedCulturalCentre },
  'landmark.leg': { code: 'LEG', label: 'Stone arches and clock-tower gate', persona: 'new_suburb', tiles: [3, 2], site: 'street', build: stoneArchGate },
  'landmark.ogd': { code: 'OGD', label: 'Caboose park', persona: 'river', tiles: [3, 2], site: 'park', build: caboosePark },
  'landmark.shn': { code: 'SHN', label: '1915 red barn', persona: 'mature_suburb', tiles: [3, 3], site: 'park', build: heritageRedBarn },
  'landmark.sta': { code: 'STA', label: 'Football stadium', persona: 'historic_main_street', tiles: [6, 5], site: 'park', build: footballStadium },
} as const satisfies Record<string, LandmarkModel>;

export type LandmarkKey = keyof typeof LIBRARY;

/** Every unique landmark, each model centred on its footprint. */
export const LANDMARK_LIBRARY = Object.fromEntries(Object.entries(LIBRARY).map(([k, m]) => [k, { ...m, build: centred(m.build) }])) as unknown as Record<LandmarkKey, LandmarkModel>;
