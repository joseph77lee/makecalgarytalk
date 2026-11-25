/**
 * Asset components that draw island objects with Polyfork low-poly models (M23, requirement.md
 * v1.45 §19.1), falling back to the box models while models load or when one fails.
 */
import { useMemo, type ComponentType } from 'react';
import type { PlacedObject } from '../../layout';
import { BoxBatch } from '../../scene/BoxBatch';
import { useIslandCtx } from '../../scene/islandContext';
import { translate, type BoxPart } from '../boxes';
import type { ItemsProps } from '../BoxAsset';
import { withLights, withSnow } from '../environmentParts';
import type { BuildCtx } from '../models';
import { LP_MODELS } from './catalogue';
import { useLpModels } from './loadModel';
import { Instanced } from './LowpolyMeshes';
import { useLpUniforms } from './material';
import { groupPlacements, type LpPlacement, type PlaceCtx } from './placement';

/**
 * An asset component that draws each item with low-poly models (`place`), or with its box model
 * (`fallback`) while its models load, when one fails to load, or when `place` returns null.
 */
export function lowpolyAsset<T extends PlacedObject>(
  place: (item: T, ctx: PlaceCtx) => LpPlacement[] | null,
  fallback: (item: T, ctx: BuildCtx) => BoxPart[],
): ComponentType<ItemsProps<T>> {
  function LowpolyAsset({ items }: ItemsProps<T>) {
    const { palette, snow, lightsOn, lowQuality } = useIslandCtx();
    useLpUniforms(snow, lightsOn);
    const planned = useMemo(() => items.map((item) => ({ item, placements: place(item, { palette, snow, lowQuality }) })), [items, palette, snow, lowQuality]);
    const names = useMemo(() => [...new Set(planned.flatMap((p) => (p.placements ?? []).map((q) => q.model)))].sort(), [planned]);
    const models = useLpModels(names);
    const { placements, parts } = useMemo(() => {
      const placements: LpPlacement[] = [];
      const parts: BoxPart[] = [];
      for (const { item, placements: ps } of planned) {
        if (ps && models && ps.every((p) => models.has(p.model))) placements.push(...ps);
        else parts.push(...translate(fallback(item, { palette, snow }), item.x, item.z));
      }
      return { placements, parts: withLights(withSnow(parts, snow), lightsOn) };
    }, [planned, models, palette, snow, lightsOn]);
    const groups = useMemo(() => groupPlacements(placements), [placements]);
    return (
      <>
        {models &&
          [...groups].map(([key, g]) => {
            const model = models.get(g.model);
            return model ? <Instanced key={key} model={model} placements={g.list} sway={LP_MODELS[g.model].cat === 'tree'} mirror={g.mirror} /> : null;
          })}
        {parts.length > 0 && <BoxBatch parts={parts} />}
      </>
    );
  }
  return LowpolyAsset;
}
