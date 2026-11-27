import { describe, expect, it } from 'vitest';
import { POST_KINDS, STEP2_KINDS, isCanPost, isPost, normalizeCanPost, type CanPost } from './api';
import { KIND_LABEL, PROBLEM_TEXT, REPORT_PROBLEM, SAFETY_NOTE, ageText, cannotPostText, nextStepText } from './postText';

const post = { id: 'p1', kind: 'event', body: 'Skating Saturday', nickname: 'Maple Fox', days_ago: 0, thanks: 0, mine: false, thanked: false, reported: false };

describe('community post texts', () => {
  it('day-level ages only', () => {
    expect(ageText(0)).toBe('today');
    expect(ageText(1)).toBe('yesterday');
    expect(ageText(2)).toBe('2 days ago');
  });
  it('kinds are about real community life, safety first', () => {
    expect(POST_KINDS).toEqual(['safety', 'deal', 'event', 'lost_found', 'talk']);
  });
  it('every kind has a label and a writing hint', () => {
    for (const k of POST_KINDS) {
      expect(KIND_LABEL[k].label.length).toBeGreaterThan(0);
      expect(KIND_LABEL[k].hint.length).toBeGreaterThan(0);
    }
  });
  it('every refusal is explained', () => {
    for (const p of ['not_verified', 'locked', 'daily_limit', 'kind', 'kind_locked', 'length', 'link', 'phone', 'address', 'blocked'] as const) {
      expect(PROBLEM_TEXT[p].length).toBeGreaterThan(10);
    }
    expect(PROBLEM_TEXT.address).toMatch(/landmark/);
    expect(REPORT_PROBLEM.limit).toMatch(/3 posts a day/);
    expect(SAFETY_NOTE).toMatch(/911/);
  });
  it('tells why the write button is not there', () => {
    expect(cannotPostText({ allowed: true, kinds: STEP2_KINDS, active_days: 3, next: null })).toBeNull();
    expect(cannotPostText({ allowed: false, reason: 'not_verified' })).toMatch(/today's question/);
    expect(cannotPostText({ allowed: false, reason: 'not_verified' })).toMatch(/Verified Resident/);
    expect(cannotPostText({ allowed: false, reason: 'not_signed_in' })).toMatch(/Verified Resident/);
    expect(cannotPostText({ allowed: false, reason: 'daily_limit' })).toMatch(/tomorrow/);
    expect(cannotPostText({ allowed: false, reason: 'other_community' })).toMatch(/your own community/);
    expect(cannotPostText({ allowed: false, reason: 'locked' })).toMatch(/Welcome sign/);
  });
});

describe('community post checks', () => {
  it('accepts valid posts and rejects broken ones', () => {
    expect(isPost(post)).toBe(true);
    expect(isPost({ ...post, kind: 'ad' })).toBe(false);
    expect(isPost({ ...post, days_ago: 'today' })).toBe(false);
    expect(isPost(null)).toBe(false);
  });
  it('can-post shapes', () => {
    expect(isCanPost({ allowed: true })).toBe(true);
    expect(isCanPost({ allowed: false, reason: 'locked' })).toBe(true);
    expect(isCanPost({ allowed: false })).toBe(false);
    expect(isCanPost(undefined)).toBe(false);
  });
});

describe('personal posting steps (requirement.md v1.49 §14)', () => {
  it('writes the next step with the days to go', () => {
    expect(nextStepText({ kinds: ['event', 'deal'], days: 14, to_go: 9 })).toBe('🎉 Events and 🏷️ Local deals open after 14 active days (9 to go)');
    expect(nextStepText({ kinds: ['event'], days: 14, to_go: 1 })).toBe('🎉 Events opens after 14 active days (1 to go)');
    expect(nextStepText(null)).toBeNull();
  });
  it('fills in the step fields, also for an older server that sends only `allowed`', () => {
    expect(normalizeCanPost({ allowed: true } as unknown as CanPost)).toEqual({ allowed: true, kinds: STEP2_KINDS, active_days: 0, next: null });
    const full = { allowed: true, kinds: ['talk', 'lost_found', 'safety', 'event', 'deal'], active_days: 20, next: null } as CanPost;
    expect(normalizeCanPost(full)).toEqual(full);
    const step2 = { allowed: true, kinds: STEP2_KINDS, active_days: 5, next: { kinds: ['event', 'deal'], days: 14, to_go: 9 } } as CanPost;
    expect(normalizeCanPost(step2)).toEqual(step2);
    expect(normalizeCanPost({ allowed: true, kinds: ['ad'], active_days: 1, next: null } as unknown as CanPost)).toMatchObject({ kinds: STEP2_KINDS });
    expect(normalizeCanPost({ allowed: false, reason: 'locked' })).toEqual({ allowed: false, reason: 'locked' });
  });
});
