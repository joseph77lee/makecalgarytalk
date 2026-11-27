import type { ServerChanges } from '../daily-actions';
import { buildingSpec } from '../island-view';

/** A moment worth a share card (requirement.md v1.31 §12.2). */
export interface ChangeCard {
  kind: 'weekly' | 'built' | 'landmark';
  title: string;
}

export interface ChangeItem {
  icon: string;
  text: string;
  card?: ChangeCard;
}

/**
 * "What changed since yesterday" lines (requirement.md §10.1); empty when nothing happened.
 * No Vitality or Revival lines (v1.41 §7.4).
 * `extra` lines (e.g. Monday's ranking result) come first.
 */
export function changeItems(c: ServerChanges, extra: ChangeItem[] = []): ChangeItem[] {
  const items: ChangeItem[] = [...extra];
  // landmarks first: the community's biggest moments (§7.9), named as "our landmark"
  const built = [...c.built].sort((a, b) => Number(isLandmarkKey(b.building_key)) - Number(isLandmarkKey(a.building_key)));
  for (const b of built) {
    if (isLandmarkKey(b.building_key)) {
      const text = `Our landmark, the ${b.title}, was built!`;
      // the card names just the place; its gold theme and share text say it is our landmark
      items.push({ icon: '⭐', text, card: { kind: 'landmark', title: b.title } });
      continue;
    }
    const text = b.level > 1 ? `${b.title} upgraded to Lv ${b.level}` : `${b.title} was built`;
    items.push({ icon: '🎉', text, card: { kind: 'built', title: text } });
  }
  for (const b of c.opened) items.push(isLandmarkKey(b.building_key) ? { icon: '⭐', text: `Our landmark, the ${b.title}, is ready to build` } : { icon: '✨', text: `${b.title} is ready to build` });
  if (c.land_grew) items.push({ icon: '🏝', text: 'Your community grew!' });
  if (c.new_residents > 0) items.push({ icon: '👋', text: c.new_residents === 1 ? 'A new neighbour joined' : `${c.new_residents} new neighbours joined` });
  if (c.actions > 0) {
    const parts = c.progress.map((p) => `${p.title}${p.level > 1 ? ` Lv ${p.level}` : ''} +${p.added}`);
    items.push({ icon: '🔨', text: `${c.actions} ${c.actions === 1 ? 'action' : 'actions'} yesterday${parts.length ? ': ' + parts.join(', ') : ''}` });
  }
  return items;
}

/**
 * A landmark step of the build map: a unique landmark (with its order) or a persona's own last
 * places (the persona track from step 4, the landmark conditions; §7.6, §7.9).
 */
export function isLandmarkKey(key: string): boolean {
  const spec = buildingSpec(key);
  return !!spec && (spec.landmarkOrder !== undefined || (spec.track === 'persona' && spec.step >= 4));
}

/** Whether the changes panel is showing (others wait for it, e.g. the invite nudge). */
export function changesPanelOpen(changes: ServerChanges, seen: boolean, extra: ChangeItem[] = []): boolean {
  return !seen && changeItems(changes, extra).length > 0;
}
