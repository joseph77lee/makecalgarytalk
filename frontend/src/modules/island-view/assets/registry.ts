/**
 * Asset registry (requirement.md §20.4): asset key → model component.
 * Game state never references meshes; the layout emits asset keys and this table decides
 * how each looks. All `building.<key>` items go through `building` (unknown keys fall back
 * to the placeholder model, §7.6b). The Art Pass swaps entries here only.
 */
import type { ComponentType } from 'react';
import type { BuildingObject, FixedAssetKey, ObjectOf } from '../layout';
import { boxAsset, type ItemsProps } from './BoxAsset';
import { HouseAsset } from './HouseAsset';
import { MiniVillagers } from './MiniVillagers';
import { building, constructionSite, feature, flowers, lamp, rail, railEnd, reservedPlot, silhouette, snowPile, station, track, tree } from './models';

export const ASSET_REGISTRY: { [K in FixedAssetKey]: ComponentType<ItemsProps<ObjectOf<K>>> } = {
  house: HouseAsset,
  tree: boxAsset(tree),
  lamp: boxAsset(lamp),
  flowers: boxAsset(flowers),
  'snow-pile': boxAsset(snowPile),
  'mini-villager': MiniVillagers,
  'construction-site': boxAsset(constructionSite),
  silhouette: boxAsset(silhouette),
  'reserved-plot': boxAsset(reservedPlot),
  feature: boxAsset(feature),
  rail: boxAsset(rail),
  track: boxAsset(track),
  station: boxAsset(station),
  'rail-end': boxAsset(railEnd),
};

export const BuildingAsset: ComponentType<ItemsProps<BuildingObject>> = boxAsset(building);
