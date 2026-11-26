/**
 * Unique landmarks by community code (community-identity build map, 2026-11-26): the last step of a
 * priority community's persona track, replacing the pattern landmark. Keys `landmark.<code>` (signature) and
 * `landmark.<code>.<order>` (later landmarks of the same community); the
 * persona matches `supabase/data/community_personas.csv` (tested). Not used by the islands yet.
 */
import type { BoxPart } from '../boxes';
import { extent } from './designFit';
import type { PlaceModel } from './placeLibrary';
import { caboosePark, curvedLibrary, domedCulturalCentre, footballStadium, heritageRedBarn, lionArchBridge, redSpiralBridge, signalHillStones, skiJumpTower, stoneArchGate } from './uniqueLandmarks';
import { cornerTowerStreet, highStreetClockTower, islandInTheLake, lagoonTeahouse, lakeBeachClub, ringPylonBridge, smallBoatMarina, twinMansards, waterfallHillLake, welcomeArchStreet } from './uniqueLandmarksTwo';
import { barracksStables, castleHouse, cougarRock, crescentTower, hilltopLookout, observationTower, peacekeeperPark, sandstoneSchoolhouse, stagecoachStone, stoneTowerEntrance, tractorGreenhouse, waveRecCentre } from './uniqueLandmarksThree';
import { vmove } from './voxel';

export interface LandmarkModel extends Omit<PlaceModel, 'step'> {
  /** Community code (as in `calgary_communities.csv`). */
  code: string;
  /**
   * Place in the community's landmark list: 1 (default) is the signature landmark, shown on the
   * World Map; 2, 3 come later on the build map. A community can have several landmarks, each one
   * real building on its own (operator, 2026-11-26). Key: `landmark.<code>` or `landmark.<code>.<order>`.
   */
  order?: number;
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
  'landmark.wsp': { code: 'WSP', label: 'Ski jump tower', persona: 'hill_view', tiles: [3, 5], site: 'slope', build: skiJumpTower },
  'landmark.dne': { code: 'DNE', label: 'Curved library', persona: 'downtown', tiles: [4, 3], site: 'plaza', build: curvedLibrary },
  'landmark.chn': { code: 'CHN', label: 'Domed cultural centre', persona: 'food_street', tiles: [3, 3], site: 'plaza', build: domedCulturalCentre },
  'landmark.leg': { code: 'LEG', label: 'Stone arches and clock-tower gate', persona: 'new_suburb', tiles: [3, 2], site: 'street', build: stoneArchGate },
  'landmark.ogd': { code: 'OGD', label: 'Caboose park', persona: 'river', tiles: [3, 2], site: 'park', build: caboosePark },
  'landmark.shn': { code: 'SHN', label: '1915 red barn', persona: 'mature_suburb', tiles: [3, 3], site: 'park', build: heritageRedBarn },
  'landmark.sta': { code: 'STA', label: 'Football stadium', persona: 'special_district', tiles: [6, 5], site: 'park', build: footballStadium },
  // second batch
  'landmark.mct': { code: 'MCT', label: 'High-street clock tower', persona: 'new_suburb', tiles: [3, 3], site: 'street', build: highStreetClockTower },
  'landmark.ing': { code: 'ING', label: 'Twin mansard buildings', persona: 'historic_main_street', tiles: [3, 2], site: 'street', build: twinMansards },
  'landmark.hil': { code: 'HIL', label: 'Corner tower street', persona: 'historic_main_street', tiles: [3, 2], site: 'street', build: cornerTowerStreet },
  'landmark.alt': { code: 'ALT', label: 'Main-street welcome arch', persona: 'historic_main_street', tiles: [3, 2], site: 'street', build: welcomeArchStreet },
  'landmark.mah': { code: 'MAH', label: 'Lake beach club', persona: 'lake', tiles: [5, 4], site: 'shore', build: lakeBeachClub },
  'landmark.lkb': { code: 'LKB', label: 'Lake with a waterfall hill', persona: 'lake', tiles: [4, 4], site: 'shore', build: waterfallHillLake },
  'landmark.mck': { code: 'MCK', label: 'Island in the lake', persona: 'lake', tiles: [4, 4], site: 'shore', build: islandInTheLake },
  'landmark.byv': { code: 'BYV', label: 'Small-boat marina', persona: 'lake', tiles: [4, 3], site: 'shore', build: smallBoatMarina },
  'landmark.bow': { code: 'BOW', label: 'Lagoon teahouse', persona: 'river', tiles: [4, 3], site: 'riverbank', build: lagoonTeahouse },
  'landmark.poi': { code: 'POI', label: 'Footbridge with ring pylons', persona: 'river', tiles: [5, 1], site: 'riverbank', build: ringPylonBridge },
  // third batch
  'landmark.ram': { code: 'RAM', label: 'Hilltop lookout over the city', persona: 'historic_main_street', tiles: [4, 3], site: 'slope', build: hilltopLookout },
  'landmark.umr': { code: 'UMR', label: 'Castle-style house', persona: 'hill_view', tiles: [3, 3], site: 'street', build: castleHouse },
  'landmark.cgr': { code: 'CGR', label: 'Cougar on the rock', persona: 'hill_view', tiles: [3, 2], site: 'park', build: cougarRock },
  'landmark.coa': { code: 'COA', label: 'Stagecoach stone', persona: 'hill_view', tiles: [3, 2], site: 'park', build: stagecoachStone },
  'landmark.cur': { code: 'CUR', label: 'Old barracks stables', persona: 'historic_main_street', tiles: [4, 3], site: 'street', build: barracksStables },
  'landmark.sna': { code: 'SNA', label: '1912 sandstone school', persona: 'historic_main_street', tiles: [4, 3], site: 'street', build: sandstoneSchoolhouse },
  'landmark.dnc': { code: 'DNC', label: 'Observation tower', persona: 'downtown', tiles: [2, 2], site: 'plaza', build: observationTower },
  'landmark.dnc.2': { code: 'DNC', order: 2, label: 'Crescent glass tower', persona: 'downtown', tiles: [3, 3], site: 'plaza', build: crescentTower },
  'landmark.kca': { code: 'KCA', label: 'Stone tower entrance', persona: 'mature_suburb', tiles: [4, 2], site: 'street', build: stoneTowerEntrance },
  'landmark.rvw': { code: 'RVW', label: 'Red tractor and greenhouse', persona: 'new_suburb', tiles: [4, 3], site: 'park', build: tractorGreenhouse },
  'landmark.roc': { code: 'ROC', label: 'Wave-roofed recreation centre', persona: 'mature_suburb', tiles: [5, 3], site: 'park', build: waveRecCentre },
  'landmark.gag': { code: 'GAG', label: 'Peacekeeper memorial park', persona: 'historic_main_street', tiles: [3, 3], site: 'plaza', build: peacekeeperPark },
} as const satisfies Record<string, LandmarkModel>;

export type LandmarkKey = keyof typeof LIBRARY;

/** Every unique landmark, each model centred on its footprint. */
export const LANDMARK_LIBRARY = Object.fromEntries(Object.entries(LIBRARY).map(([k, m]) => [k, { ...m, build: centred(m.build) }])) as unknown as Record<LandmarkKey, LandmarkModel>;
