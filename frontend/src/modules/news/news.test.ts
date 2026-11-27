import type { SupabaseClient } from '@supabase/supabase-js';
import { describe, expect, it, vi } from 'vitest';
import { assertNewspaper, type Newspaper } from './api';
import { newsBuildingKeys, newsReady, opensNews, yesterdayLabel } from './newsText';
import { createNewsStore } from './store';

const paper = (patch: Partial<Newspaper> = {}): Newspaper => ({
  calgary_day: '2026-12-02',
  community: 'Mahogany',
  locked: null,
  announcements: [{ title: 'Maintenance Sunday', body: '' }],
  lines: [{ icon: '👋', text: '2 new neighbours joined yesterday: A and B. Welcome!' }],
  posts: [{ id: 'p1', kind: 'event', body: 'Skating Saturday', nickname: 'Maple Fox', days_ago: 1, thanks: 2, mine: false, thanked: false, reported: false }],
  can_post: { allowed: false, reason: 'not_verified' },
  board: { open: false, roadmap: [] },
  ...patch,
});

describe('newspaper texts', () => {
  it('labels the day the news is about (the day before), across month and year ends', () => {
    expect(yesterdayLabel('2026-12-02')).toBe('Dec 1');
    expect(yesterdayLabel('2026-12-01')).toBe('Nov 30');
    expect(yesterdayLabel('2027-01-01')).toBe('Dec 31');
  });
  it('the newspaper lives on the Welcome sign lot (sign or arch), then moves to the Community hall', () => {
    expect(newsBuildingKeys(['welcome-sign', 'fire-pit'])).toEqual(['welcome-sign']);
    expect(opensNews('welcome-sign')).toBe(true);
    expect(opensNews('community-hall')).toBe(true);
    expect(opensNews('gateway-arch')).toBe(false);
    expect(opensNews('warming-hut')).toBe(false);
    expect(newsBuildingKeys(['welcome-sign', 'community-hall'])).toEqual(['community-hall']);
    expect(newsReady(['fire-pit'])).toBe(false);
    expect(newsReady(['welcome-sign'])).toBe(true);
  });
});

describe('newspaper API checks', () => {
  it('accepts open, locked and board states', () => {
    expect(() => assertNewspaper(paper())).not.toThrow();
    expect(() => assertNewspaper(paper({ locked: 'welcome_sign', lines: [] }))).not.toThrow();
    expect(() => assertNewspaper(paper({ board: { open: true, roadmap: [{ title: 'World Map', detail: '' }] } }))).not.toThrow();
  });
  it('rejects broken data', () => {
    expect(() => assertNewspaper(null)).toThrow();
    expect(() => assertNewspaper({ ...paper(), locked: 'other' })).toThrow();
    expect(() => assertNewspaper({ ...paper(), lines: [{ text: 'x' }] })).toThrow();
    expect(() => assertNewspaper({ ...paper(), board: {} })).toThrow();
    expect(() => assertNewspaper({ ...paper(), posts: [{ id: 'x', kind: 'ad' }] })).toThrow();
    expect(() => assertNewspaper({ ...paper(), can_post: {} })).toThrow();
  });
});

describe('newspaper store', () => {
  it('opens and loads the paper for a community', async () => {
    const rpc = vi.fn(async () => ({ data: paper(), error: null }));
    const use = createNewsStore({ getClient: () => ({ rpc }) as unknown as SupabaseClient });
    const p = use.getState().show('c-mah');
    expect(use.getState().open).toBe(true);
    expect(use.getState().loading).toBe(true);
    await p;
    expect(rpc).toHaveBeenCalledWith('news_get_newspaper', { p_community_id: 'c-mah' });
    expect(use.getState().paper?.community).toBe('Mahogany');
    use.getState().close();
    expect(use.getState().open).toBe(false);
  });
  it('shows an error instead of throwing', async () => {
    const rpc = vi.fn(async () => ({ data: null, error: { message: 'offline' } }));
    const use = createNewsStore({ getClient: () => ({ rpc }) as unknown as SupabaseClient });
    await use.getState().show('c-mah');
    expect(use.getState().error).toBe('offline');
    expect(use.getState().loading).toBe(false);
  });
});
