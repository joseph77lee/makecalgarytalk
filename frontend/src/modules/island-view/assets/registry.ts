/**
 * Asset registry (requirement.md §20.4): asset key → model component.
 * Game state never references meshes; the layout emits asset keys and this
 * table decides how each key looks. The Art Pass swaps entries here only.
 */
import type { ComponentType } from 'react';
import type { AssetKey } from '../layout';
import { boxAsset, type AssetProps } from './BoxAsset';
import { HouseAsset } from './HouseAsset';
import { MiniVillagers } from './MiniVillagers';
import {
  building,
  constructionSite,
  flowerPath,
  flowers,
  holidayDecorations,
  iceRink,
  lamp,
  sign,
  silhouette,
  snowPile,
  tree,
} from './models';

export const ASSET_REGISTRY: { [K in AssetKey]: ComponentType<AssetProps<K>> } = {
  house: HouseAsset,
  'building.playground': boxAsset(building('playground')),
  'building.community-centre': boxAsset(building('community-centre')),
  'building.park': boxAsset(building('park')),
  silhouette: boxAsset(silhouette),
  'construction-site': boxAsset(constructionSite),
  'project.ice-rink': boxAsset(iceRink),
  'project.flower-path': boxAsset(flowerPath),
  'project.holiday-decorations': boxAsset(holidayDecorations),
  tree: boxAsset(tree),
  sign: boxAsset(sign),
  lamp: boxAsset(lamp),
  flowers: boxAsset(flowers),
  'snow-pile': boxAsset(snowPile),
  'mini-villager': MiniVillagers,
};
