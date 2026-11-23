import { describe, expect, it } from 'vitest';
import type { ServerChanges, ServerStreak } from '../daily-actions';
import { BUILDING_TREE, buildIslandLayout, decodePlan, finishedExampleState, type BuildingView } from '../island-view';
import { completionPercent, groupByStage, isBuilt } from './buildMapModel';
import { changeItems, changesPanelOpen, revivedToday } from './changesText';
import { landGoalText, sleepyText, streakText } from './streakText';
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
    expect(changeItems(changes(), 50)).toEqual([]);
    expect(changeItems(changes({ vitality_before: 50 }), 50)).toEqual([]); // unchanged Vitality is not news
  });
  it('lists builds, openings, growth, neighbours, help and Vitality', () => {
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
      55,
    ).map((i) => i.text);
    expect(items).toEqual([
      'Frozen pond was built',
      'Welcome sign upgraded to Lv 2',
      'Playground unlocked',
      'Your community grew!',
      '2 new neighbours joined',
      '4 actions yesterday: Fire pit +3, Welcome sign Lv 2 +1',
      'Vitality 40 → 55',
    ]);
  });
  it('built lines carry a share card; others do not', () => {
    const items = changeItems(changes({ built: [{ building_key: 'fire-pit', title: 'Fire pit', level: 1 }], new_residents: 1 }), null);
    expect(items[0]?.card).toEqual({ kind: 'built', title: 'Fire pit was built' });
    expect(items[1]?.card).toBeUndefined();
  });
  it('Community Revival: Sleepy (0–29) yesterday → 30+ today, first line with a card', () => {
    expect(revivedToday(changes({ vitality_before: 29 }), 30)).toBe(true);
    expect(revivedToday(changes({ vitality_before: 0 }), 75)).toBe(true);
    expect(revivedToday(changes({ vitality_before: 29 }), 29)).toBe(false); // still sleepy
    expect(revivedToday(changes({ vitality_before: 30 }), 45)).toBe(false); // was not sleepy
    expect(revivedToday(changes({ vitality_before: 40 }), 20)).toBe(false); // fell asleep
    expect(revivedToday(changes({ vitality_before: null }), 40)).toBe(false); // new community
    expect(revivedToday(changes({ vitality_before: 10 }), null)).toBe(false);
    const items = changeItems(changes({ vitality_before: 25 }), 31);
    expect(items[0]).toEqual({ icon: '🌸', text: 'Community Revival! Your community woke up', card: { kind: 'revival', title: 'Community Revival!' } });
    expect(items.map((i) => i.text)).toContain('Vitality 25 → 31');
  });
  it('extra lines (Monday ranking) come first and open the panel on their own', () => {
    const extra = [{ icon: '🏆', text: 'Last week Mahogany ranked #2 in Calgary', card: { kind: 'weekly' as const, title: '#2 in Calgary this week' } }];
    expect(changeItems(changes(), 50, extra)).toEqual(extra);
    expect(changesPanelOpen(changes(), 50, false, extra)).toBe(true);
    expect(changesPanelOpen(changes(), 50, true, extra)).toBe(false);
    expect(changesPanelOpen(changes(), 50, false)).toBe(false);
  });
});

const view = (key: string, status: BuildingView['status'], level = 1): BuildingView => ({ key, status, level, progress: status === 'built' ? 1 : 0.3, title: key, remaining: null });

describe('build map (requirement.md §7.6a)', () => {
  it('an upgrade still counts as built; a first construction does not', () => {
    expect(isBuilt(view('fire-pit', 'building', 2))).toBe(true);
    expect(isBuilt(view('fire-pit', 'building', 1))).toBe(false);
  });
  it('completion % counts built tree buildings only', () => {
    const all = BUILDING_TREE.buildings.map((b) => view(b.key, 'locked'));
    expect(completionPercent(all)).toBe(0);
    all[0] = view(all[0].key, 'built');
    all[1] = view(all[1].key, 'building', 3);
    expect(completionPercent([...all, view('castle', 'built')])).toBe(Math.round((2 / BUILDING_TREE.buildings.length) * 100));
    expect(completionPercent(BUILDING_TREE.buildings.map((b) => view(b.key, 'built')))).toBe(100);
  });
  it('groups by tree stage in tree order, unknown buildings last', () => {
    const groups = groupByStage([view('castle', 'built'), view('neighbourhood-park', 'locked'), view('fire-pit', 'built'), view('welcome-sign', 'built')]);
    expect(groups.map((g) => g.name)).toEqual(['1. First day', '5. Pride', 'New buildings']);
    expect(groups[0].buildings.map((b) => b.key)).toEqual(['welcome-sign', 'fire-pit']);
  });
});

describe('finished example', () => {
  const PLAN = decodePlan(JSON.parse(readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../../../public/islands/MAH.json'), 'utf8')));
  it('draws the whole tree built on the full island, with unnamed houses', () => {
    const l = buildIslandLayout(PLAN, finishedExampleState('Mahogany'));
    expect(l.futureTiles).toHaveLength(0);
    expect(l.objects.some((o) => o.assetKey === 'construction-site' || o.assetKey === 'silhouette')).toBe(false);
    expect(l.objects.find((o) => o.id === 'lot:lot-a')?.assetKey).toBe('building.community-hall');
    const houses = l.objects.filter((o) => o.assetKey === 'house');
    expect(houses.length).toBeGreaterThan(0);
    expect(houses.every((h) => h.assetKey === 'house' && h.nickname === '')).toBe(true);
    expect(l.hiddenHouseCount).toBe(0);
  });
});

describe('sleepy line', () => {
  it('invites everyone to wake the community up', () => {
    expect(sleepyText('Mahogany')).toBe('😴 Mahogany is sleepy. Help today to wake it up!');
  });
});
