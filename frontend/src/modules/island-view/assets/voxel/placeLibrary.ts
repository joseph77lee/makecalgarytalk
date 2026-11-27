/**
 * The place library (community-identity build map, 2026-11-26): every buildable place as an asset
 * key, grouped by persona into a track of steps that open one after another; the last step of each
 * persona track is that pattern's landmark (a community without its own landmark yet builds this
 * one, named after the community). Models are built once here and used by data; adding a model
 * never changes game rules. Not used by the islands yet (gallery only).
 *
 * Sizes (operator, 2026-11-26): a place takes the land its real counterpart does, with one tile
 * about a house lot (12–15 m), slightly compressed for the voxel style. Grounds that are big in
 * reality (ball diamond, golf, rink, pond) are modelled at that size; buildings come with their
 * yard, forecourt and trees (`lot`). Every model fills most of its footprint (tested).
 */
import type { BoxPart } from '../boxes';
import { extent } from './designFit';
import { onGrounds, type GroundsOptions } from './placeParts';
import { vmove } from './voxel';
import { beachHouse, boardwalk, lakeLighthouse, sailboat, sailingDock } from './landmarks';
import { foodHall, foodTrucks, glassOffice, lanternStreet, marketStalls, pocketPlaza, signatureTower, skywalk } from './placesCity';
import { cartBarn, clubhouse, drivingRange, golfHole, hayField, heritageRailway, horseCorral, redBarn } from './placesGreen';
import { brickStorefront, cafePatio, heritageTheatre, sandstoneSchool } from './placesMainStreet';
import { archFootbridge, canoeLaunch, kiteHill, lookoutTower, riversidePathway, riversideTeahouse, telescopeDeck, trailhead } from './placesRiverHill';
import { ballDiamond, communityHub, curlingClub, gazeboSquare, leisureCentre, stoneGate, stormPond, tennisCourts } from './placesSuburb';

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
  site: 'shore' | 'riverbank' | 'crossing' | 'hilltop' | 'slope' | 'street' | 'park' | 'plaza';
  build: (seed: number) => BoxPart[];
}

/** A model set on a lot of w × d tiles with its grounds (yard, forecourt, path, trees). */
const lot = (build: (seed: number) => BoxPart[], w: number, d: number, opts?: GroundsOptions) => (seed: number) => onGrounds(build(seed), w, d, seed, opts);
const SAND = { base: '#ecd9a6', trees: 0, path: false } as const;

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
  'place.lake.boardwalk': { label: 'Boardwalk', persona: 'lake', step: 2, tiles: [3, 1], site: 'shore', build: lot(() => boardwalk(3), 3, 1, SAND) },
  'place.lake.beach-house': { label: 'Beach house', persona: 'lake', step: 3, tiles: [4, 3], site: 'shore', build: lot(beachHouse, 4, 3, { ...SAND, trees: 0.25 }) },
  'place.lake.lighthouse': { label: 'Lakeside lighthouse', persona: 'lake', step: 4, tiles: [3, 3], site: 'shore', build: lot(lakeLighthouse, 3, 3, SAND) },
  // mature suburb
  'place.mature-suburb.tennis-courts': { label: 'Tennis courts', persona: 'mature_suburb', step: 1, tiles: [3, 2], site: 'park', build: tennisCourts },
  'place.mature-suburb.curling-club': { label: 'Curling club', persona: 'mature_suburb', step: 2, tiles: [3, 2], site: 'plaza', build: curlingClub },
  'place.mature-suburb.ball-diamond': { label: 'Ball diamond', persona: 'mature_suburb', step: 3, tiles: [5, 5], site: 'park', build: ballDiamond },
  'place.mature-suburb.leisure-centre': { label: 'Leisure centre', persona: 'mature_suburb', step: 4, tiles: [4, 4], site: 'plaza', build: lot(leisureCentre, 4, 4) },
  // new suburb
  'place.new-suburb.stone-gate': { label: 'Stone entrance gate', persona: 'new_suburb', step: 1, tiles: [2, 1], site: 'street', build: lot(stoneGate, 2, 1, { trees: 0, path: false }) },
  'place.new-suburb.storm-pond': { label: 'Storm pond', persona: 'new_suburb', step: 2, tiles: [4, 3], site: 'park', build: stormPond },
  'place.new-suburb.gazebo-square': { label: 'Gazebo square', persona: 'new_suburb', step: 3, tiles: [2, 2], site: 'plaza', build: gazeboSquare },
  'place.new-suburb.community-hub': { label: 'Community hub', persona: 'new_suburb', step: 4, tiles: [4, 3], site: 'plaza', build: lot(communityHub, 4, 3) },
  // river
  'place.river.pathway': { label: 'Riverside pathway', persona: 'river', step: 1, tiles: [2, 1], site: 'riverbank', build: riversidePathway },
  'place.river.canoe-launch': { label: 'Canoe launch', persona: 'river', step: 2, tiles: [2, 2], site: 'riverbank', build: canoeLaunch },
  'place.river.footbridge': { label: 'Arched footbridge', persona: 'river', step: 3, tiles: [3, 1], site: 'crossing', build: archFootbridge },
  'place.river.teahouse': { label: 'Riverside teahouse', persona: 'river', step: 4, tiles: [3, 2], site: 'riverbank', build: lot(riversideTeahouse, 3, 2, { path: false }) },
  // hill view
  'place.hill-view.trailhead': { label: 'Trailhead', persona: 'hill_view', step: 1, tiles: [1, 1], site: 'slope', build: trailhead },
  'place.hill-view.telescope-deck': { label: 'Telescope deck', persona: 'hill_view', step: 2, tiles: [2, 2], site: 'hilltop', build: telescopeDeck },
  'place.hill-view.kite-hill': { label: 'Kite hill', persona: 'hill_view', step: 3, tiles: [3, 3], site: 'slope', build: lot(kiteHill, 3, 3, { path: false, trees: 0.12 }) },
  'place.hill-view.lookout-tower': { label: 'Lookout tower', persona: 'hill_view', step: 4, tiles: [2, 2], site: 'hilltop', build: lookoutTower },
  // historic main street
  'place.main-street.cafe-patio': { label: 'Café patio', persona: 'historic_main_street', step: 1, tiles: [2, 1], site: 'street', build: cafePatio },
  'place.main-street.brick-storefront': { label: 'Brick storefront', persona: 'historic_main_street', step: 2, tiles: [2, 1], site: 'street', build: brickStorefront },
  'place.main-street.sandstone-school': { label: 'Sandstone school', persona: 'historic_main_street', step: 3, tiles: [4, 3], site: 'street', build: lot(sandstoneSchool, 4, 3, { align: 'back' }) },
  'place.main-street.heritage-theatre': { label: 'Heritage theatre', persona: 'historic_main_street', step: 4, tiles: [2, 3], site: 'street', build: lot(heritageTheatre, 2, 3, { align: 'back', base: '#e2d9c8', trees: 0.3 }) },
  // downtown
  'place.downtown.pocket-plaza': { label: 'Pocket plaza', persona: 'downtown', step: 1, tiles: [2, 2], site: 'plaza', build: pocketPlaza },
  'place.downtown.skywalk': { label: 'Skywalk', persona: 'downtown', step: 2, tiles: [3, 1], site: 'street', build: skywalk },
  'place.downtown.glass-office': { label: 'Glass office', persona: 'downtown', step: 3, tiles: [2, 2], site: 'street', build: glassOffice },
  'place.downtown.signature-tower': { label: 'Signature tower', persona: 'downtown', step: 4, tiles: [3, 3], site: 'plaza', build: lot(signatureTower, 3, 3, { base: '#d6d2ca', trees: 0.45 }) },
  // golf
  'place.golf.golf-hole': { label: 'Short golf hole', persona: 'golf', step: 1, tiles: [5, 3], site: 'park', build: golfHole },
  'place.golf.driving-range': { label: 'Driving range', persona: 'golf', step: 2, tiles: [5, 3], site: 'park', build: drivingRange },
  'place.golf.cart-barn': { label: 'Cart barn', persona: 'golf', step: 3, tiles: [2, 1], site: 'park', build: cartBarn },
  'place.golf.clubhouse': { label: 'Clubhouse', persona: 'golf', step: 4, tiles: [4, 3], site: 'park', build: clubhouse },
  // food street
  'place.food-street.food-trucks': { label: 'Food trucks', persona: 'food_street', step: 1, tiles: [2, 2], site: 'street', build: foodTrucks },
  'place.food-street.market-stalls': { label: 'Market stalls', persona: 'food_street', step: 2, tiles: [3, 2], site: 'plaza', build: marketStalls },
  'place.food-street.lantern-street': { label: 'Lantern street', persona: 'food_street', step: 3, tiles: [3, 1], site: 'street', build: lanternStreet },
  'place.food-street.food-hall': { label: 'Food hall', persona: 'food_street', step: 4, tiles: [4, 3], site: 'street', build: lot(foodHall, 4, 3, { align: 'back', base: '#d9cfbd', trees: 0.4 }) },
  // special district (ranch and heritage rail)
  'place.special-district.hay-field': { label: 'Hay field', persona: 'special_district', step: 1, tiles: [3, 3], site: 'park', build: hayField },
  'place.special-district.horse-corral': { label: 'Horse corral', persona: 'special_district', step: 2, tiles: [3, 3], site: 'park', build: horseCorral },
  'place.special-district.red-barn': { label: 'Red barn', persona: 'special_district', step: 3, tiles: [3, 2], site: 'park', build: lot(redBarn, 3, 2, { path: false }) },
  'place.special-district.heritage-railway': { label: 'Heritage railway', persona: 'special_district', step: 4, tiles: [4, 2], site: 'park', build: heritageRailway },
} as const satisfies Record<string, PlaceModel>;

export type PlaceKey = keyof typeof LIBRARY;

/** Every place, each model centred on its footprint. */
export const PLACE_LIBRARY = Object.fromEntries(Object.entries(LIBRARY).map(([k, m]) => [k, { ...m, build: centred(m.build) }])) as unknown as Record<PlaceKey, PlaceModel>;

/** The steps of one persona track, in order. */
export function personaTrack(persona: Persona): PlaceKey[] {
  return (Object.keys(PLACE_LIBRARY) as PlaceKey[]).filter((k) => PLACE_LIBRARY[k].persona === persona).sort((a, b) => PLACE_LIBRARY[a].step - PLACE_LIBRARY[b].step);
}
