/** Today's question state: the question for the viewed community, answering, the pop-up card. */
import type { SupabaseClient } from '@supabase/supabase-js';
import { create } from 'zustand';
import { questionsApi, type TodayQuestion } from './api';
import { ANSWER_PROBLEM_TEXT, answeredLocally, shouldPopUp } from './questionText';

export interface QuestionDeps {
  getClient: () => SupabaseClient | null;
  /** The Calgary day the pop-up was last closed on (a per-device convenience). */
  readClosedDay: () => string | null;
  writeClosedDay: (day: string) => void;
}

export interface QuestionState {
  today: TodayQuestion | null;
  communityId: string | null;
  error: string | null;
  sending: boolean;
  popUp: boolean;
  /** Loads today's question for a community; with `popUp`, opens the card when it is due. */
  load: (communityId: string, opts?: { popUp?: boolean }) => Promise<void>;
  answer: (choice: number) => Promise<void>;
  closePopUp: () => void;
}

export function createQuestionStore(deps: QuestionDeps) {
  return create<QuestionState>((set, get) => ({
    today: null,
    communityId: null,
    error: null,
    sending: false,
    popUp: false,
    async load(communityId, opts) {
      if (get().communityId !== communityId) set({ today: null, communityId });
      try {
        const c = deps.getClient();
        if (!c) throw new Error('Supabase is not configured');
        const today = await questionsApi.today(c, communityId);
        if (get().communityId !== communityId) return; // switched community meanwhile
        set({ today, error: null });
        if (opts?.popUp && shouldPopUp(today, deps.readClosedDay())) set({ popUp: true });
      } catch (e) {
        set({ error: e instanceof Error ? e.message : String(e) });
      }
    },
    async answer(choice) {
      const { today, communityId, sending } = get();
      if (!today || !today.can_answer || sending || !communityId) return;
      set({ today: answeredLocally(today, choice), sending: true, error: null });
      let problem: string | null = null;
      try {
        const c = deps.getClient();
        if (!c) throw new Error('Supabase is not configured');
        const r = await questionsApi.answer(c, choice);
        if (!r.ok) problem = ANSWER_PROBLEM_TEXT[r.problem];
      } catch (e) {
        set({ today, error: `Could not save your answer: ${e instanceof Error ? e.message : String(e)}` });
        return;
      } finally {
        set({ sending: false });
      }
      await get().load(communityId); // the community's counts (and a refused answer's real state), from the server
      if (problem) set({ error: problem });
    },
    closePopUp() {
      // Only a card closed without answering needs remembering (an answered one never pops up
      // again), so another player on this device still gets theirs.
      const t = get().today;
      if (t?.can_answer) deps.writeClosedDay(t.calgary_day);
      set({ popUp: false });
    },
  }));
}
