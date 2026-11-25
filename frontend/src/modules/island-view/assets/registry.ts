/**
 * Asset registry (requirement.md §20.4): asset key → model component.
 * Game state never references meshes; the layout emits asset keys and this table decides
 * how each looks (houses, trees and cars: Polyfork low-poly, M23). All `building.<key>` items go through `building` (unknown keys fall back
 * to the placeholder model, §7.6b). The Art Pass swaps entries here only.
 */
import type { ComponentType } from 'react';
import type { BuildingObject, FixedAssetKey, ObjectOf } from '../layout';
import { boxAsset, type ItemsProps } from './BoxAsset';
import { lowpolyAsset } from './lowpoly/lowpolyAsset';
import { lampPool, placeHouse, placeLamp, placeProp, placeSnowPile, placeTree } from './lowpoly/islandModels';
import { MiniVillagers } from './MiniVillagers';
import { building, constructionSite, feature, flowers, house, lamp, prop, rail, railEnd, reservedPlot, silhouette, snowPile, station, track, tree } from './models';

export const ASSET_REGISTRY: { [K in FixedAssetKey]: ComponentType<ItemsProps<ObjectOf<K>>> } = {
  // Polyfork low-poly models (M23, §19.1); box models while they load or if a file fails
  house: lowpolyAsset(placeHouse, house),
  tree: lowpolyAsset(placeTree, tree),
  lamp: lowpolyAsset(placeLamp, lamp, lampPool),
  flowers: boxAsset(flowers),
  'snow-pile': lowpolyAsset(placeSnowPile, snowPile),
  'mini-villager': MiniVillagers,
  'construction-site': boxAsset(constructionSite),
  silhouette: boxAsset(silhouette),
  'reserved-plot': boxAsset(reservedPlot),
  feature: boxAsset(feature),
  rail: boxAsset(rail),
  track: boxAsset(track),
  station: boxAsset(station),
  'rail-end': boxAsset(railEnd),
  prop: lowpolyAsset(placeProp, prop),
};

export const BuildingAsset: ComponentType<ItemsProps<BuildingObject>> = boxAsset(building);
