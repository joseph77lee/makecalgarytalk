import type { ObjectOf } from '../layout';
import type { ItemsProps } from './BoxAsset';
import { boxAsset } from './BoxAsset';
import { house } from './models';

const HouseBoxes = boxAsset<ObjectOf<'house'>>(house);

/** Resident houses; active-today houses light their windows (no smoke, requirement.md v1.26 §7.2). */
export function HouseAsset({ items }: ItemsProps<ObjectOf<'house'>>) {
  return <HouseBoxes items={items} />;
}
