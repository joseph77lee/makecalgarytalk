/** Typed wrappers for the questions RPC (docs/api.md), with response checks. */
import type { SupabaseClient } from '@supabase/supabase-js';

export interface Choice {
  emoji: string;
  text: string;
}

export interface Question {
  id: string;
  category: string;
  text: string;
  choices: Choice[];
}

/** Answer counts of one community: total and per choice (in choice order). Never who chose what. */
export interface Counts {
  total: number;
  choices: number[];
}

export type CannotAnswer = 'not_signed_in' | 'not_resident' | 'other_community' | 'answered';

/** Today's question as a viewer of a community sees it (requirement.md v1.49 §14.1). */
export interface TodayQuestion {
  calgary_day: string;
  question: Question;
  can_answer: boolean;
  reason: CannotAnswer | null;
  /** My choice (1-based) or null. */
  answered: number | null;
  /** After answering, and for those who cannot answer; null before answering. */
  counts: Counts | null;
}

/** Yesterday's result of a community, in the newspaper (null when nobody answered). */
export interface QuestionResult {
  question: Question;
  counts: Counts;
}

export type AnswerProblem = 'not_resident' | 'choice' | 'answered';

const isText = (v: unknown): v is string => typeof v === 'string';
const isCount = (v: unknown): v is number => Number.isInteger(v) && (v as number) >= 0;

export function isQuestion(v: unknown): v is Question {
  const o = v as Record<string, unknown> | null;
  return (
    !!o &&
    isText(o.id) &&
    isText(o.category) &&
    isText(o.text) &&
    Array.isArray(o.choices) &&
    o.choices.length >= 2 &&
    o.choices.length <= 4 &&
    o.choices.every((c) => isText((c as Record<string, unknown>)?.emoji) && isText((c as Record<string, unknown>)?.text))
  );
}

export function isCounts(v: unknown, choices: number): v is Counts {
  const o = v as Record<string, unknown> | null;
  return !!o && isCount(o.total) && Array.isArray(o.choices) && o.choices.length === choices && o.choices.every(isCount);
}

export function isTodayQuestion(v: unknown): v is TodayQuestion {
  const o = v as Record<string, unknown> | null;
  if (!o || !isText(o.calgary_day) || !isQuestion(o.question) || typeof o.can_answer !== 'boolean') return false;
  const n = o.question.choices.length;
  return (
    (o.reason === null || ['not_signed_in', 'not_resident', 'other_community', 'answered'].includes(o.reason as string)) &&
    (o.answered === null || (Number.isInteger(o.answered) && (o.answered as number) >= 1 && (o.answered as number) <= n)) &&
    (o.counts === null || isCounts(o.counts, n))
  );
}

export function isQuestionResult(v: unknown): v is QuestionResult {
  const o = v as Record<string, unknown> | null;
  return !!o && isQuestion(o.question) && isCounts(o.counts, o.question.choices.length);
}

export const questionsApi = {
  /** null when no questions are seeded. */
  async today(c: SupabaseClient, communityId: string): Promise<TodayQuestion | null> {
    const { data, error } = await c.rpc('questions_today', { p_community_id: communityId });
    if (error) throw new Error(error.message);
    if (data === null) return null;
    if (!isTodayQuestion(data)) throw new Error('Unexpected server response: today\'s question');
    return data;
  },
  async answer(c: SupabaseClient, choice: number): Promise<{ ok: true } | { ok: false; problem: AnswerProblem }> {
    const { data, error } = await c.rpc('questions_answer', { p_choice: choice });
    if (error) throw new Error(error.message);
    const d = (data ?? {}) as Record<string, unknown>;
    return d.ok === true ? { ok: true } : { ok: false, problem: (d.problem as AnswerProblem) ?? 'choice' };
  },
};
