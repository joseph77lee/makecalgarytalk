import { describe, expect, it } from 'vitest';
import type { Post } from './api';
import { postBubbles, postBubbleText } from './bubbles';

const post = (o: Partial<Post>): Post => ({ id: 'p', kind: 'event', body: 'Pancakes at the hall', nickname: 'Sarah', days_ago: 0, thanks: 0, mine: false, thanked: false, reported: false, ...o });

describe('post bubbles (requirement v1.41 §7.3)', () => {
  it('credits the writer with the kind icon', () => {
    expect(postBubbleText(post({}))).toBe('🎉 Sarah: Pancakes at the hall');
  });

  it('shortens long posts to about 40 characters with an ellipsis, on whole characters', () => {
    const t = postBubbleText(post({ body: 'Lost a grey cat near the pond on Tuesday evening, answers to Miso 🐱 please call' }));
    const body = t.slice(t.indexOf(': ') + 2);
    expect([...body].length).toBeLessThanOrEqual(40);
    expect(body.endsWith('…')).toBe(true);
    expect(postBubbleText(post({ body: '  two\n   lines  ' }))).toBe('🎉 Sarah: two lines');
  });

  it("only today's posts, never Safety, never one I reported", () => {
    const list = [
      post({ id: 'a' }),
      post({ id: 'b', days_ago: 1 }),
      post({ id: 'c', kind: 'safety' }),
      post({ id: 'd', reported: true }),
      post({ id: 'e', kind: 'deal' }),
    ];
    expect(postBubbles(list).map((b) => b.id)).toEqual(['a', 'e']);
  });
});
