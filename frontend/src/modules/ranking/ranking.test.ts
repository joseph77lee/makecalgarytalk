import { describe, expect, it } from 'vitest';
import { isWeeklyRanking, type RankEntry, type WeeklyRanking } from './api';
import { dayLabel, mineInTop, mineText, scoreText, weeklyAnnouncement, weeklyCardTitle } from './rankingText';
import { createRankingStore } from './store';

const entry = (code: string, rank: number | null, patch: Partial<RankEntry> = {}): RankEntry => ({
  rank, code, name: code, score: 1.4, acting_residents: rank === null ? 3 : 6, needed: rank === null ? 2 : 0, ...patch,
});
const week = (top: RankEntry[], mine: RankEntry | null) => ({
  week_start: '2026-12-07', top, ranked: top.length, mine, champions: top.filter((e) => e.rank === 1).map((e) => e.code),
});
const board = (patch: Partial<WeeklyRanking> = {}): WeeklyRanking => ({
  min_residents: 5,
  results_day: true,
  home: { code: 'MAH', name: 'Mahogany' },
  last_week: week([entry('CRA', 1), entry('MAH', 2)], entry('MAH', 2)),
  this_week: { ...week([], entry('MAH', null)), updated_at: '2026-12-14T07:00:00Z' },
  ...patch,
});

describe('ranking data', () => {
  it('accepts the server shape and rejects broken data', () => {
    expect(isWeeklyRanking(board())).toBe(true);
    expect(isWeeklyRanking(board({ home: null }))).toBe(true);
    expect(isWeeklyRanking({ ...board(), this_week: week([], null) })).toBe(false); // no updated_at
    expect(isWeeklyRanking(board({ last_week: week([entry('X', 0)], null) }))).toBe(false); // rank 0
    expect(isWeeklyRanking(null)).toBe(false);
  });
});

describe('ranking texts', () => {
  it('day label without time zones', () => {
    expect(dayLabel('2026-12-07')).toBe('Dec 7');
    expect(dayLabel('2027-01-04')).toBe('Jan 4');
  });
  it('score with two decimals', () => {
    expect(scoreText(0.37)).toBe('0.37');
    expect(scoreText(2)).toBe('2.00');
  });
  it('my line: rank, or how many more residents', () => {
    expect(mineText(entry('MAH', 3), 12)).toBe('#3 of 12');
    expect(mineText(entry('MAH', null, { needed: 1 }), 12)).toBe('1 more resident to enter the ranking');
    expect(mineText(entry('MAH', null, { needed: 5 }), 0)).toBe('5 more residents to enter the ranking');
  });
  it('mine shown separately only when outside the top list', () => {
    expect(mineInTop(week([entry('MAH', 1)], entry('MAH', 1)))).toBe(true);
    expect(mineInTop(week([entry('CRA', 1)], entry('MAH', 14)))).toBe(false);
    expect(mineInTop(week([], null))).toBe(false);
  });
  it('Monday announcement only on the results day, for a ranked home community', () => {
    expect(weeklyAnnouncement(board())).toEqual({ text: 'Last week Mahogany ranked #2 in Calgary', rank: 2, ranked: 2 });
    expect(weeklyAnnouncement(board({ results_day: false }))).toBeNull();
    expect(weeklyAnnouncement(board({ home: null }))).toBeNull();
    expect(weeklyAnnouncement(board({ last_week: week([entry('CRA', 1)], entry('MAH', null)) }))).toBeNull();
    expect(weeklyAnnouncement(null)).toBeNull();
  });
  it('card titles', () => {
    expect(weeklyCardTitle(1)).toBe('#1 in Calgary last week!');
    expect(weeklyCardTitle(4)).toBe('#4 in Calgary last week');
  });
});

describe('ranking store', () => {
  const client = (data: unknown, calls: { n: number }) =>
    ({ rpc: async () => (calls.n++, { data, error: null }) }) as never;
  it('fetches once and keeps the result for a few minutes', async () => {
    let t = 0;
    const calls = { n: 0 };
    const store = createRankingStore({ getClient: () => client(board(), calls), now: () => t });
    await store.getState().load();
    await store.getState().load();
    expect(calls.n).toBe(1);
    t += 4 * 60 * 1000;
    await store.getState().load();
    expect(calls.n).toBe(2);
    await store.getState().load({ force: true });
    expect(calls.n).toBe(3);
    expect(store.getState().data?.home?.name).toBe('Mahogany');
  });
  it('reports malformed data as an error', async () => {
    const store = createRankingStore({ getClient: () => client({ nope: 1 }, { n: 0 }) });
    await store.getState().load();
    expect(store.getState().error).toBe('Ranking data is malformed');
    expect(store.getState().data).toBeNull();
  });
});
