import { describe, expect, it } from 'vitest';
import type { ServerChanges, ServerStreak } from '../daily-actions';
import { buildIslandLayout, decodePlan, finishedExampleState } from '../island-view';
import { changeItems, changesPanelOpen } from './changesText';
import { landGoalText, streakText } from './streakText';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const streak = (days: number, acted: number, active: number, needed: number, attended: boolean): ServerStreak => ({
  days,
  today: { acted, active_residents: active, needed, attended },
});

describe('streak bar text (requirement.md §7.5)', () => {
  it('shows days, today\'s count and how many more are needed', () => {
    expect(streakText(streak(5, 2, 6, 3, false))).toEqual({ title: '5-day streak', today: 'Today 2/6', hint: '1 more neighbour today keeps it going' });
    expect(streakText(streak(5, 1, 6, 3, false)).hint).toBe('2 more neighbours today keeps it going');
  });
  it('says when today already counts', () => {
    expect(streakText(streak(6, 3, 6, 3, true)).hint).toBe('Today counts ✓');
  });
  it('no streak yet, nobody active: one person starts it', () => {
    expect(streakText(streak(0, 0, 0, 1, false))).toEqual({ title: 'No streak yet', today: 'Today 0/1', hint: '1 more neighbour today starts a streak' });
  });
  it('island growth goal, none at the largest island', () => {
    expect(landGoalText(1)).toBe('1 more neighbour to grow');
    expect(landGoalText(4)).toBe('4 more neighbours to grow');
    expect(landGoalText(null)).toBeNull();
  });
});

const changes = (patch: Partial<ServerChanges> = {}): ServerChanges => ({
  actions: 0, progress: [], built: [], opened: [], new_residents: 0, land_grew: false, vitality_before: null, ...patch,
});

describe('what changed since yesterday', () => {
  it('is empty when nothing happened (the panel then stays closed)', () => {
    expect(changeItems(changes())).toEqual([]);
    expect(changeItems(changes({ vitality_before: 20 }))).toEqual([]); // Vitality is never shown (v1.41 §7.4)
  });
  it('lists builds, openings, growth, neighbours and help; no Vitality line', () => {
    const items = changeItems(
      changes({
        actions: 4,
        progress: [{ building_key: 'fire-pit', title: 'Fire pit', level: 1, added: 3 }, { building_key: 'welcome-sign', title: 'Welcome sign', level: 2, added: 1 }],
        built: [{ building_key: 'frozen-pond', title: 'Frozen pond', level: 1 }, { building_key: 'welcome-sign', title: 'Welcome sign', level: 2 }],
        opened: [{ building_key: 'playground', title: 'Playground' }],
        new_residents: 2,
        land_grew: true,
        vitality_before: 40,
      }),
    ).map((i) => i.text);
    expect(items).toEqual([
      'Frozen pond was built',
      'Welcome sign upgraded to Lv 2',
      'Playground unlocked',
      'Your community grew!',
      '2 new neighbours joined',
      '4 actions yesterday: Fire pit +3, Welcome sign Lv 2 +1',
    ]);
  });
  it('built lines carry a share card; others do not', () => {
    const items = changeItems(changes({ built: [{ building_key: 'fire-pit', title: 'Fire pit', level: 1 }], new_residents: 1 }));
    expect(items[0]?.card).toEqual({ kind: 'built', title: 'Fire pit was built' });
    expect(items[1]?.card).toBeUndefined();
  });
  it('no Community Revival any more, even when a quiet community picks up (v1.41 §7.4)', () => {
    const items = changeItems(changes({ vitality_before: 10 }));
    expect(items).toEqual([]);
  });
  it('extra lines (Monday ranking) come first and open the panel on their own', () => {
    const extra = [{ icon: '🏆', text: 'Last week Mahogany ranked #2 in Calgary', card: { kind: 'weekly' as const, title: '#2 in Calgary this week' } }];
    expect(changeItems(changes(), extra)).toEqual(extra);
    expect(changesPanelOpen(changes(), false, extra)).toBe(true);
    expect(changesPanelOpen(changes(), true, extra)).toBe(false);
    expect(changesPanelOpen(changes(), false)).toBe(false);
  });
});

describe('finished example', () => {
  const PLAN = decodePlan(JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../public/islands/MAH.json'), 'utf8')));
  it('draws the whole tree built on the full island, with unnamed houses', () => {
    const l = buildIslandLayout(PLAN, finishedExampleState('Mahogany'));
    expect(l.futureTiles).toHaveLength(0);
    expect(l.objects.some((o) => o.assetKey === 'construction-site' || o.assetKey === 'silhouette')).toBe(false);
    expect(l.objects.find((o) => o.id === 'lot:community-hall')?.assetKey).toBe('building.community-hall');
    expect(l.objects.find((o) => o.id === 'lot:landmark.mah')?.assetKey).toBe('building.landmark.mah');
    const houses = l.objects.filter((o) => o.assetKey === 'house');
    expect(houses.length).toBeGreaterThan(0);
    expect(houses.every((h) => h.assetKey === 'house' && h.nickname === '')).toBe(true);
    expect(l.hiddenHouseCount).toBe(0);
  });
});

