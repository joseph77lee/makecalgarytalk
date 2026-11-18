import { useMemo, type ComponentType } from 'react';
import type { AssetKey, ObjectOf } from '../layout';
import { BoxBatch } from '../scene/BoxBatch';
import { useIslandCtx } from '../scene/islandContext';
import { translate, type BoxPart } from './boxes';
import type { BuildCtx } from './models';

export type AssetProps<K extends AssetKey> = { items: ObjectOf<K>[] };

/** Turns a box-model builder into an asset component that draws all its items in one batch. */
export function boxAsset<K extends AssetKey>(
  build: (item: ObjectOf<K>, ctx: BuildCtx) => BoxPart[],
): ComponentType<AssetProps<K>> {
  function BoxAsset({ items }: AssetProps<K>) {
    const { palette, mood } = useIslandCtx();
    const parts = useMemo(
      () => items.flatMap((item) => translate(build(item, { palette, mood }), item.x, item.z)),
      [items, palette, mood],
    );
    return <BoxBatch parts={parts} />;
  }
  return BoxAsset;
}
