import type { ServerChanges } from '../daily-actions';

/** A moment worth a share card (requirement.md v1.31 §12.2). */
export interface ChangeCard {
  kind: 'weekly' | 'built';
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
  for (const b of c.built) {
    const text = b.level > 1 ? `${b.title} upgraded to Lv ${b.level}` : `${b.title} was built`;
    items.push({ icon: '🎉', text, card: { kind: 'built', title: text } });
  }
  for (const b of c.opened) items.push({ icon: '✨', text: `${b.title} unlocked` });
  if (c.land_grew) items.push({ icon: '🏝', text: 'Your community grew!' });
  if (c.new_residents > 0) items.push({ icon: '👋', text: c.new_residents === 1 ? 'A new neighbour joined' : `${c.new_residents} new neighbours joined` });
  if (c.actions > 0) {
    const parts = c.progress.map((p) => `${p.title}${p.level > 1 ? ` Lv ${p.level}` : ''} +${p.added}`);
    items.push({ icon: '🔨', text: `${c.actions} ${c.actions === 1 ? 'action' : 'actions'} yesterday${parts.length ? ': ' + parts.join(', ') : ''}` });
  }
  return items;
}

/** Whether the changes panel is showing (others wait for it, e.g. the invite nudge). */
export function changesPanelOpen(changes: ServerChanges, seen: boolean, extra: ChangeItem[] = []): boolean {
  return !seen && changeItems(changes, extra).length > 0;
}
