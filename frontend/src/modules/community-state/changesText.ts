import type { ServerChanges } from '../daily-actions';
import { vitalityMood } from '../island-view';

/** A moment worth a share card (requirement.md v1.31 §12.2). */
export interface ChangeCard {
  kind: 'weekly' | 'built' | 'revival';
  title: string;
}

export interface ChangeItem {
  icon: string;
  text: string;
  card?: ChangeCard;
}

/** Sleepy yesterday, recovered today (requirement.md v1.31 §7.4: Vitality 0–29 → 30+). */
export function revivedToday(c: ServerChanges, vitality: number | null): boolean {
  return vitality !== null && c.vitality_before !== null && vitalityMood(c.vitality_before) === 'sleepy' && vitalityMood(vitality) !== 'sleepy';
}

/**
 * "What changed since yesterday" lines (requirement.md §10.1); empty when nothing happened.
 * `extra` lines (e.g. Monday's ranking result) come first.
 */
export function changeItems(c: ServerChanges, vitality: number | null, extra: ChangeItem[] = []): ChangeItem[] {
  const items: ChangeItem[] = [...extra];
  if (revivedToday(c, vitality)) items.push({ icon: '🌸', text: 'Community Revival! Your community woke up', card: { kind: 'revival', title: 'Community Revival!' } });
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
  if (vitality !== null && c.vitality_before !== null && vitality !== c.vitality_before) {
    items.push({ icon: vitality > c.vitality_before ? '📈' : '📉', text: `Vitality ${c.vitality_before} → ${vitality}` });
  }
  return items;
}

/** Whether the changes panel is showing (others wait for it, e.g. the invite nudge). */
export function changesPanelOpen(changes: ServerChanges, vitality: number | null, seen: boolean, extra: ChangeItem[] = []): boolean {
  return !seen && changeItems(changes, vitality, extra).length > 0;
}
