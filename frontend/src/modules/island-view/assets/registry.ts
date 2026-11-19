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
  flowers,
  lamp,
  showcaseBirdFeeders,
  showcaseFlowerPath,
  showcaseHolidayDecorations,
  showcaseIceRink,
  showcaseLanternStreet,
  showcaseSnowmanGarden,
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
  'showcase.ice-rink': boxAsset(showcaseIceRink),
  'showcase.flower-path': boxAsset(showcaseFlowerPath),
  'showcase.holiday-decorations': boxAsset(showcaseHolidayDecorations),
  'showcase.snowman-garden': boxAsset(showcaseSnowmanGarden),
  'showcase.lantern-street': boxAsset(showcaseLanternStreet),
  'showcase.bird-feeders': boxAsset(showcaseBirdFeeders),
  tree: boxAsset(tree),
  sign: boxAsset(sign),
  lamp: boxAsset(lamp),
  flowers: boxAsset(flowers),
  'snow-pile': boxAsset(snowPile),
  'mini-villager': MiniVillagers,
};
