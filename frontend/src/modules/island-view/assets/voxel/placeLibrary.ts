/**
 * The place library (community-identity build map, 2026-11-26): every buildable place as an asset
 * key, grouped by persona into a track of steps that open one after another; the last step of each
 * persona track is that pattern's landmark (a community without its own landmark yet builds this
 * one, named after the community). Models are built once here and used by data; adding a model
 * never changes game rules. Not used by the islands yet (gallery only).
 */
import type { BoxPart } from '../boxes';
import { extent } from './designFit';
import { vmove } from './voxel';
import { beachHouse, boardwalk, lakeLighthouse, sailboat, sailingDock } from './landmarks';
import { brickStorefront, cafePatio, heritageTheatre, sandstoneSchool } from './placesMainStreet';
import { archFootbridge, canoeLaunch, kiteHill, lookoutTower, riversidePathway, riversideTeahouse, telescopeDeck, trailhead } from './placesRiverHill';
import { ballDiamond, communityGarden, communityHub, gazeboSquare, leisureCentre, outdoorRink, stoneGate, stormPond } from './placesSuburb';

/** The ten personas of `supabase/data/community_personas.csv`. */
export type Persona = 'lake' | 'river' | 'downtown' | 'historic_main_street' | 'golf' | 'new_suburb' | 'hill_view' | 'food_street' | 'mature_suburb' | 'special_district';

export interface PlaceModel {
  label: string;
  persona: Persona;
  /** Position in the persona track (1 opens first); the last step is the pattern landmark. */
  step: number;
  /** Footprint in tiles (x, z); the model stays inside it. */
  tiles: [number, number];
  /** Where the place belongs (site placement by meaning, handoff proposal E). */
  site: 'shore' | 'riverbank' | 'hilltop' | 'slope' | 'street' | 'park' | 'plaza';
  build: (seed: number) => BoxPart[];
}

/** Sailing dock with a boat beside it, centred on 2 × 2 tiles. */
const dockWithBoat = (seed: number): BoxPart[] => vmove([...vmove(sailingDock(2), -5, 0, 0), ...vmove(sailboat(seed), 6, -0.1, -8)], 0, 0, 12);

/** Moves parts so their footprint is centred on the origin (models are drawn on their lot's centre). */
function centred(build: (seed: number) => BoxPart[]): (seed: number) => BoxPart[] {
  return (seed) => {
    const parts = build(seed);
    const e = extent(parts);
    return vmove(parts, -e.cx, 0, -e.cz);
  };
}

const LIBRARY = {
  // lake
  'place.lake.sailing-dock': { label: 'Sailing dock', persona: 'lake', step: 1, tiles: [2, 2], site: 'shore', build: dockWithBoat },
  'place.lake.boardwalk': { label: 'Boardwalk', persona: 'lake', step: 2, tiles: [3, 1], site: 'shore', build: () => boardwalk(3) },
  'place.lake.beach-house': { label: 'Beach house', persona: 'lake', step: 3, tiles: [3, 2], site: 'shore', build: beachHouse },
  'place.lake.lighthouse': { label: 'Lakeside lighthouse', persona: 'lake', step: 4, tiles: [3, 3], site: 'shore', build: lakeLighthouse },
  // mature suburb
  'place.mature-suburb.community-garden': { label: 'Community garden', persona: 'mature_suburb', step: 1, tiles: [2, 2], site: 'park', build: communityGarden },
  'place.mature-suburb.outdoor-rink': { label: 'Outdoor rink', persona: 'mature_suburb', step: 2, tiles: [3, 2], site: 'park', build: outdoorRink },
  'place.mature-suburb.ball-diamond': { label: 'Ball diamond', persona: 'mature_suburb', step: 3, tiles: [3, 3], site: 'park', build: ballDiamond },
  'place.mature-suburb.leisure-centre': { label: 'Leisure centre', persona: 'mature_suburb', step: 4, tiles: [3, 3], site: 'plaza', build: leisureCentre },
  // new suburb
  'place.new-suburb.stone-gate': { label: 'Stone entrance gate', persona: 'new_suburb', step: 1, tiles: [2, 1], site: 'street', build: stoneGate },
  'place.new-suburb.storm-pond': { label: 'Storm pond', persona: 'new_suburb', step: 2, tiles: [3, 3], site: 'park', build: stormPond },
  'place.new-suburb.gazebo-square': { label: 'Gazebo square', persona: 'new_suburb', step: 3, tiles: [2, 2], site: 'plaza', build: gazeboSquare },
  'place.new-suburb.community-hub': { label: 'Community hub', persona: 'new_suburb', step: 4, tiles: [3, 3], site: 'plaza', build: communityHub },
  // river
  'place.river.pathway': { label: 'Riverside pathway', persona: 'river', step: 1, tiles: [2, 1], site: 'riverbank', build: riversidePathway },
  'place.river.canoe-launch': { label: 'Canoe launch', persona: 'river', step: 2, tiles: [2, 2], site: 'riverbank', build: canoeLaunch },
  'place.river.footbridge': { label: 'Arched footbridge', persona: 'river', step: 3, tiles: [3, 1], site: 'riverbank', build: archFootbridge },
  'place.river.teahouse': { label: 'Riverside teahouse', persona: 'river', step: 4, tiles: [2, 2], site: 'riverbank', build: riversideTeahouse },
  // hill view
  'place.hill-view.trailhead': { label: 'Trailhead', persona: 'hill_view', step: 1, tiles: [1, 1], site: 'slope', build: trailhead },
  'place.hill-view.telescope-deck': { label: 'Telescope deck', persona: 'hill_view', step: 2, tiles: [2, 2], site: 'hilltop', build: telescopeDeck },
  'place.hill-view.kite-hill': { label: 'Kite hill', persona: 'hill_view', step: 3, tiles: [2, 2], site: 'slope', build: kiteHill },
  'place.hill-view.lookout-tower': { label: 'Lookout tower', persona: 'hill_view', step: 4, tiles: [2, 2], site: 'hilltop', build: lookoutTower },
  // historic main street
  'place.main-street.cafe-patio': { label: 'Café patio', persona: 'historic_main_street', step: 1, tiles: [2, 1], site: 'street', build: cafePatio },
  'place.main-street.brick-storefront': { label: 'Brick storefront', persona: 'historic_main_street', step: 2, tiles: [2, 1], site: 'street', build: brickStorefront },
  'place.main-street.sandstone-school': { label: 'Sandstone school', persona: 'historic_main_street', step: 3, tiles: [3, 2], site: 'street', build: sandstoneSchool },
  'place.main-street.heritage-theatre': { label: 'Heritage theatre', persona: 'historic_main_street', step: 4, tiles: [2, 2], site: 'street', build: heritageTheatre },
} as const satisfies Record<string, PlaceModel>;

export type PlaceKey = keyof typeof LIBRARY;

/** Every place, each model centred on its footprint. */
export const PLACE_LIBRARY = Object.fromEntries(Object.entries(LIBRARY).map(([k, m]) => [k, { ...m, build: centred(m.build) }])) as unknown as Record<PlaceKey, PlaceModel>;

/** The steps of one persona track, in order. */
export function personaTrack(persona: Persona): PlaceKey[] {
  return (Object.keys(PLACE_LIBRARY) as PlaceKey[]).filter((k) => PLACE_LIBRARY[k].persona === persona).sort((a, b) => PLACE_LIBRARY[a].step - PLACE_LIBRARY[b].step);
}
