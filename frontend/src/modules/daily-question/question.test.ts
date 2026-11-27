import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { isQuestionResult, isTodayQuestion, type TodayQuestion } from './api';
import { AUTO_CLOSE_MS, MIN_ANSWERS_FOR_BARS, THANKS_TEXT, answeredLocally, autoCloseMs, cannotAnswerText, percents, shouldPopUp, showBars, soFarTitle, yesterdayLine } from './questionText';
import { createQuestionStore } from './store';

const question = {
  id: 'Q002',
  category: 'weather',
  text: 'On a Chinook day, how are you dressed?',
  choices: [
    { emoji: '🧥', text: 'Winter coat all day' },
    { emoji: '🧅', text: 'Layers, peeling off by noon' },
    { emoji: '😎', text: 'Shorts by afternoon' },
  ],
};
const today = (patch: Partial<TodayQuestion> = {}): TodayQuestion => ({
  calgary_day: '2026-12-02',
  question,
  can_answer: true,
  reason: null,
  answered: null,
  counts: null,
  ...patch,
});

describe('today\'s question checks', () => {
  it('accepts the server shapes', () => {
    expect(isTodayQuestion(today())).toBe(true);
    expect(isTodayQuestion(today({ can_answer: false, reason: 'answered', answered: 2, counts: { total: 5, choices: [1, 3, 1] } }))).toBe(true);
    expect(isTodayQuestion(today({ can_answer: false, reason: 'not_signed_in', counts: { total: 0, choices: [0, 0, 0] } }))).toBe(true);
  });
  it('refuses broken ones', () => {
    expect(isTodayQuestion(today({ answered: 4 }))).toBe(false); // only 3 choices
    expect(isTodayQuestion(today({ counts: { total: 2, choices: [1, 1] } }))).toBe(false); // one count per choice
    expect(isTodayQuestion({ ...today(), reason: 'busy' })).toBe(false);
    expect(isTodayQuestion({ ...today(), question: { ...question, choices: [question.choices[0]] } })).toBe(false);
    expect(isTodayQuestion(null)).toBe(false);
    expect(isQuestionResult({ question, counts: { total: 1, choices: [1, 0, 0] } })).toBe(true);
    expect(isQuestionResult({ question, counts: { total: -1, choices: [1, 0, 0] } })).toBe(false);
  });
});

describe('today\'s question texts (requirement.md v1.49 §11, §14.1)', () => {
  it('bars in whole percent, 0 when nobody answered', () => {
    expect(percents({ total: 3, choices: [1, 2, 0] })).toEqual([33, 67, 0]);
    expect(percents({ total: 0, choices: [0, 0, 0] })).toEqual([0, 0, 0]);
  });
  it('names the community and how many neighbours answered so far', () => {
    expect(soFarTitle('Mahogany', { total: 5, choices: [1, 3, 1] })).toBe('Mahogany so far (5 neighbours)');
    expect(soFarTitle('Mahogany', { total: 1, choices: [1, 0, 0] })).toBe('Mahogany so far (1 neighbour)');
    expect(soFarTitle('Mahogany', { total: 0, choices: [0, 0, 0] })).toBe('Nobody in Mahogany has answered yet');
  });
  it('writes yesterday\'s result with counts only, ties named', () => {
    expect(yesterdayLine({ question, counts: { total: 5, choices: [1, 3, 1] } })).toBe('Yesterday 3 of 5 neighbours went with 🧅 Layers, peeling off by noon');
    expect(yesterdayLine({ question, counts: { total: 4, choices: [2, 2, 0] } })).toBe(
      'Yesterday 4 neighbours answered: a tie between 🧥 Winter coat all day and 🧅 Layers, peeling off by noon',
    );
    expect(yesterdayLine({ question, counts: { total: 3, choices: [1, 1, 1] } })).toMatch(/a tie between 🧥 .*, 🧅 .* and 😎 /);
    expect(yesterdayLine({ question, counts: { total: 2, choices: [0, 2, 0] } })).toBe('Yesterday all 2 neighbours went with 🧅 Layers, peeling off by noon');
    expect(yesterdayLine({ question, counts: { total: 1, choices: [0, 0, 1] } })).toBe('Yesterday 1 neighbour answered: 😎 Shorts by afternoon');
  });
  it('explains why the choices are read-only', () => {
    expect(cannotAnswerText('not_signed_in')).toMatch(/Residents answer/);
    expect(cannotAnswerText('not_resident')).toMatch(/Check in/);
    expect(cannotAnswerText('other_community')).toMatch(/your own community/);
    expect(cannotAnswerText('answered')).toBeNull();
    expect(cannotAnswerText(null)).toBeNull();
  });
  it('pops up only for a question I can still answer, once a day', () => {
    expect(shouldPopUp(today(), null)).toBe(true);
    expect(shouldPopUp(today(), '2026-12-01')).toBe(true);
    expect(shouldPopUp(today(), '2026-12-02')).toBe(false); // closed today
    expect(shouldPopUp(today({ can_answer: false, reason: 'answered', answered: 1 }), null)).toBe(false);
    expect(shouldPopUp(today({ can_answer: false, reason: 'not_signed_in' }), null)).toBe(false);
    expect(shouldPopUp(null, null)).toBe(false);
  });
  it('shows my answer at once, before the counts arrive', () => {
    expect(answeredLocally(today(), 2)).toMatchObject({ can_answer: false, reason: 'answered', answered: 2, counts: null });
  });
});

function fakeClient(responses: Record<string, unknown[]>) {
  const rpc = vi.fn(async (fn: string) => ({ data: responses[fn]!.shift(), error: null }));
  return { client: { rpc } as unknown as SupabaseClient, rpc };
}

describe('the answered card (requirement.md v1.51 §14.1)', () => {
  it('shows bars only from 3 answers; fewer get the thank-you line', () => {
    expect(MIN_ANSWERS_FOR_BARS).toBe(3);
    expect(showBars({ total: 3, choices: [1, 1, 1] })).toBe(true);
    expect(showBars({ total: 2, choices: [2, 0, 0] })).toBe(false);
    expect(showBars({ total: 0, choices: [0, 0, 0] })).toBe(false);
    expect(showBars(null)).toBe(false);
    expect(THANKS_TEXT).toMatch(/tomorrow's paper/);
  });
  it('closes by itself a few seconds after the counts are back, never before answering', () => {
    expect(autoCloseMs(today())).toBeNull();
    expect(autoCloseMs(answeredLocally(today(), 2))).toBeNull(); // still saving
    expect(autoCloseMs(today({ can_answer: false, reason: 'answered', answered: 2, counts: { total: 1, choices: [0, 1, 0] } }))).toBe(AUTO_CLOSE_MS);
    expect(AUTO_CLOSE_MS).toBeGreaterThanOrEqual(2000);
    expect(AUTO_CLOSE_MS).toBeLessThanOrEqual(4000);
    expect(autoCloseMs(null)).toBeNull();
  });
});

describe('today\'s question store', () => {
  it('loads, pops up, answers and then shows the server counts', async () => {
    const answered = today({ can_answer: false, reason: 'answered', answered: 2, counts: { total: 1, choices: [0, 1, 0] } });
    const { client, rpc } = fakeClient({ questions_today: [today(), answered], questions_answer: [{ ok: true, choice: 2 }] });
    let closed: string | null = null;
    const store = createQuestionStore({ getClient: () => client, readClosedDay: () => closed, writeClosedDay: (d) => (closed = d) });
    await store.getState().load('mah', { popUp: true });
    expect(store.getState().popUp).toBe(true);
    await store.getState().answer(2);
    expect(rpc).toHaveBeenCalledWith('questions_answer', { p_choice: 2 });
    expect(store.getState().today).toEqual(answered);
    store.getState().closePopUp();
    expect(store.getState().popUp).toBe(false);
    expect(closed).toBeNull(); // answered: nothing to remember on this device
  });
  it('remembers a card closed without answering, for that day', async () => {
    const { client } = fakeClient({ questions_today: [today()] });
    let closed: string | null = null;
    const store = createQuestionStore({ getClient: () => client, readClosedDay: () => closed, writeClosedDay: (d) => (closed = d) });
    await store.getState().load('mah', { popUp: true });
    store.getState().closePopUp();
    expect(closed).toBe('2026-12-02');
  });
  it('does not pop up again on the day it was closed, and shows a refused answer', async () => {
    const { client } = fakeClient({
      questions_today: [today(), today({ can_answer: false, reason: 'answered', answered: 1, counts: { total: 1, choices: [1, 0, 0] } })],
      questions_answer: [{ ok: false, problem: 'answered', choice: 1 }],
    });
    const store = createQuestionStore({ getClient: () => client, readClosedDay: () => '2026-12-02', writeClosedDay: () => {} });
    await store.getState().load('mah', { popUp: true });
    expect(store.getState().popUp).toBe(false);
    await store.getState().answer(3);
    expect(store.getState().error).toMatch(/already answered/);
    expect(store.getState().today?.answered).toBe(1); // the server's answer wins
  });
  it('puts the choices back when saving fails', async () => {
    const rpc = vi.fn(async (fn: string) => (fn === 'questions_today' ? { data: today(), error: null } : { data: null, error: { message: 'offline' } }));
    const store = createQuestionStore({ getClient: () => ({ rpc }) as unknown as SupabaseClient, readClosedDay: () => null, writeClosedDay: () => {} });
    await store.getState().load('mah');
    await store.getState().answer(1);
    expect(store.getState().today?.can_answer).toBe(true);
    expect(store.getState().error).toMatch(/offline/);
  });
});
