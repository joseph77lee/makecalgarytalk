/**
 * Own analytics (requirement.md v1.35 §21): fire-and-forget calls to the server. Day-level only;
 * the server keeps one visit per player per day and caps events. Never throws, never blocks play.
 */
export interface RpcClient {
  rpc: (fn: string, args?: Record<string, unknown>) => PromiseLike<{ error: unknown }>;
}

export type ShareDetail = 'weekly' | 'built' | 'revival' | 'invite';

export function createTracker(getClient: () => RpcClient | null) {
  // A page session sends each visit/community once.
  const sentViews = new Set<string>();
  const call = (fn: string, args: Record<string, unknown>) => {
    const client = getClient();
    if (!client) return;
    try {
      void Promise.resolve(client.rpc(fn, args)).then(
        () => {},
        () => {},
      );
    } catch {
      // analytics never breaks the game
    }
  };
  return {
    /** Today's visit, and the community on screen (null: none). */
    visit(communityCode: string | null) {
      const key = communityCode ?? '';
      if (sentViews.has(key)) return;
      sentViews.add(key);
      call('analytics_visit', { p_community_code: communityCode });
    },
    /** A share card or invite link was shared (or saved / copied). */
    share(detail: ShareDetail) {
      call('analytics_event', { p_kind: 'share', p_detail: detail });
    },
    /** The player opened the site from an invite link. */
    inviteVisit() {
      call('analytics_event', { p_kind: 'invite_visit' });
    },
  };
}
