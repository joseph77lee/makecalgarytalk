/**
 * Today's local posts for the island's mini villagers (requirement.md v1.41 §7.3): read once per
 * island visit with the same server function as the newspaper (hidden and expired posts are
 * already left out there), without opening the newspaper.
 */
import { useEffect } from 'react';
import { create } from 'zustand';
import { getSupabaseClient, readSupabaseConfig } from '../common';
import { postBubbles, type PostBubble } from '../posts';
import { fetchNewspaper } from './api';

const NONE: PostBubble[] = [];

const useIslandPosts = create<{ communityId: string | null; bubbles: PostBubble[] }>(() => ({ communityId: null, bubbles: NONE }));

async function load(communityId: string): Promise<void> {
  const cfg = readSupabaseConfig();
  if (!cfg.ok) return;
  try {
    const paper = await fetchNewspaper(getSupabaseClient(cfg.config), communityId);
    if (useIslandPosts.getState().communityId === communityId) useIslandPosts.setState({ bubbles: postBubbles(paper.posts) });
  } catch (e) {
    console.warn('[news] island posts not loaded:', e instanceof Error ? e.message : e);
  }
}

/** Speech bubbles for today's posts in the community shown on the island (empty while loading). */
export function useTodayPostBubbles(communityId: string | null): PostBubble[] {
  const state = useIslandPosts();
  useEffect(() => {
    if (!communityId) return;
    useIslandPosts.setState({ communityId, bubbles: NONE });
    void load(communityId);
  }, [communityId]);
  return state.communityId === communityId ? state.bubbles : NONE;
}
