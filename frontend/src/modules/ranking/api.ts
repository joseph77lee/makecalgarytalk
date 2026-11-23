/** Weekly ranking from the server (requirement.md v1.31 §12.1). */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface RankEntry {
  /** null = not ranked (fewer than 5 acting Verified Residents). */
  rank: number | null;
  code: string;
  name: string;
  /** Average daily active Verified Residents per 1,000 people, two decimals. */
  score: number;
  acting_residents: number;
  /** More acting residents needed to be ranked (0 when ranked). */
  needed: number;
}

export interface WeekBoard {
  /** Monday of the week, YYYY-MM-DD (Calgary). */
  week_start: string;
  top: RankEntry[];
  ranked: number;
  mine: RankEntry | null;
  /** Codes at #1 (more than one when tied). */
  champions: string[];
}

export interface WeeklyRanking {
  min_residents: number;
  /** Monday: last week's results are announced today. */
  results_day: boolean;
  home: { code: string; name: string } | null;
  last_week: WeekBoard;
  this_week: WeekBoard & { updated_at: string };
}

function isEntry(v: unknown): v is RankEntry {
  const e = v as RankEntry;
  return (
    !!e &&
    (e.rank === null || (Number.isInteger(e.rank) && e.rank >= 1)) &&
    typeof e.code === 'string' &&
    typeof e.name === 'string' &&
    typeof e.score === 'number' &&
    Number.isInteger(e.acting_residents) &&
    Number.isInteger(e.needed)
  );
}

function isWeek(v: unknown): v is WeekBoard {
  const w = v as WeekBoard;
  return (
    !!w &&
    typeof w.week_start === 'string' &&
    Array.isArray(w.top) &&
    w.top.every(isEntry) &&
    Number.isInteger(w.ranked) &&
    (w.mine === null || isEntry(w.mine)) &&
    Array.isArray(w.champions) &&
    w.champions.every((c) => typeof c === 'string')
  );
}

export function isWeeklyRanking(v: unknown): v is WeeklyRanking {
  const r = v as WeeklyRanking;
  return (
    !!r &&
    Number.isInteger(r.min_residents) &&
    typeof r.results_day === 'boolean' &&
    (r.home === null || (typeof r.home?.code === 'string' && typeof r.home?.name === 'string')) &&
    isWeek(r.last_week) &&
    isWeek(r.this_week) &&
    typeof r.this_week.updated_at === 'string'
  );
}

export async function fetchWeeklyRanking(c: SupabaseClient): Promise<WeeklyRanking> {
  const { data, error } = await c.rpc('ranking_weekly');
  if (error) throw new Error(error.message);
  if (!isWeeklyRanking(data)) throw new Error('Ranking data is malformed');
  return data;
}
