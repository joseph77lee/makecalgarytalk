import type { ServerChanges } from '../daily-actions';

export interface ChangeItem {
  icon: string;
  text: string;
}

/** "What changed since yesterday" lines (requirement.md §10.1); empty when nothing happened. */
export function changeItems(c: ServerChanges, vitality: number | null): ChangeItem[] {
  const items: ChangeItem[] = [];
  for (const b of c.built) items.push({ icon: '🎉', text: b.level > 1 ? `${b.title} upgraded to Lv ${b.level}` : `${b.title} was built` });
  for (const b of c.opened) items.push({ icon: '✨', text: `${b.title} unlocked` });
  if (c.land_grew) items.push({ icon: '🏝', text: 'The island grew' });
  if (c.new_residents > 0) items.push({ icon: '👋', text: c.new_residents === 1 ? 'A new neighbour joined' : `${c.new_residents} new neighbours joined` });
  if (c.actions > 0) {
    const parts = c.progress.map((p) => `${p.title}${p.level > 1 ? ` Lv ${p.level}` : ''} +${p.added}`);
    items.push({ icon: '🔨', text: `${c.actions} ${c.actions === 1 ? 'action' : 'actions'} yesterday${parts.length ? ': ' + parts.join(', ') : ''}` });
  }
  if (vitality !== null && c.vitality_before !== null && vitality !== c.vitality_before) {
    items.push({ icon: vitality > c.vitality_before ? '📈' : '📉', text: `Vitality ${c.vitality_before} → ${vitality}` });
  }
  return items;
}

/** Whether the changes panel is showing (others wait for it, e.g. the invite nudge). */
export function changesPanelOpen(changes: ServerChanges, vitality: number | null, seen: boolean): boolean {
  return !seen && changeItems(changes, vitality).length > 0;
}
