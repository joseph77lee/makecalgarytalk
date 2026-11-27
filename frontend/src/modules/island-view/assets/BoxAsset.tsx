import { useMemo, type ComponentType } from 'react';
import type { PlacedObject } from '../layout';
import { BoxBatch } from '../scene/BoxBatch';
import { useIslandCtx } from '../scene/islandContext';
import { translate, type BoxPart } from './boxes';
import { withLights, withSnow, withWater } from './environmentParts';
import type { BuildCtx } from './models';

export type ItemsProps<T extends PlacedObject> = { items: T[] };

/** Turns a box-model builder into an asset component that draws all its items in one batch. */
export function boxAsset<T extends PlacedObject>(build: (item: T, ctx: BuildCtx) => BoxPart[]): ComponentType<ItemsProps<T>> {
  function BoxAsset({ items }: ItemsProps<T>) {
    const { palette, snow, lightsOn } = useIslandCtx();
    const parts = useMemo(
      () => withLights(withSnow(withWater(items.flatMap((item) => translate(build(item, { palette, snow }), item.x, item.z)), palette.water), snow), lightsOn),
      [items, palette, snow, lightsOn],
    );
    return <BoxBatch parts={parts} />;
  }
  return BoxAsset;
}
