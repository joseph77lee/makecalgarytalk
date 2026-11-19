import { useMemo, type ComponentType } from 'react';
import type { PlacedObject } from '../layout';
import { BoxBatch } from '../scene/BoxBatch';
import { useIslandCtx } from '../scene/islandContext';
import { translate, type BoxPart } from './boxes';
import type { BuildCtx } from './models';

export type ItemsProps<T extends PlacedObject> = { items: T[] };

/** Turns a box-model builder into an asset component that draws all its items in one batch. */
export function boxAsset<T extends PlacedObject>(build: (item: T, ctx: BuildCtx) => BoxPart[]): ComponentType<ItemsProps<T>> {
  function BoxAsset({ items }: ItemsProps<T>) {
    const { palette, mood } = useIslandCtx();
    const parts = useMemo(
      () => items.flatMap((item) => translate(build(item, { palette, mood }), item.x, item.z)),
      [items, palette, mood],
    );
    return <BoxBatch parts={parts} />;
  }
  return BoxAsset;
}
