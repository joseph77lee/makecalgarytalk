/**
 * Today's local posts as mini-villager speech bubbles (requirement.md v1.41 §7.3): credited to
 * the writer, never Safety posts, never a post I reported, only today's.
 */
import type { Post } from './api';
import { KIND_LABEL } from './postText';

export const BUBBLE_CHARS = 40;

export interface PostBubble {
  id: string;
  text: string;
}

/** "🎉 Sarah: Pancake breakfast at the hall this Sat…" (about 40 characters of the post). */
export function postBubbleText(post: Pick<Post, 'kind' | 'nickname' | 'body'>): string {
  const body = post.body.replace(/\s+/g, ' ').trim();
  const chars = [...body];
  const short = chars.length > BUBBLE_CHARS ? `${chars.slice(0, BUBBLE_CHARS - 1).join('').trimEnd()}…` : body;
  return `${KIND_LABEL[post.kind].icon} ${post.nickname}: ${short}`;
}

export function postBubbles(posts: Post[]): PostBubble[] {
  return posts.filter((p) => p.days_ago === 0 && p.kind !== 'safety' && !p.reported).map((p) => ({ id: p.id, text: postBubbleText(p) }));
}
