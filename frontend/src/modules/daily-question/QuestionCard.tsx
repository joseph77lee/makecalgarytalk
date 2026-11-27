import { useEffect } from 'react';
import { playSound } from '../sound';
import type { QuestionResult, TodayQuestion } from './api';
import { useQuestion } from './liveStore';
import { THANKS_TEXT, autoCloseMs, cannotAnswerText, percents, showBars, soFarTitle, yesterdayLine } from './questionText';

interface CardProps {
  today: TodayQuestion;
  community: string;
  sending?: boolean;
  error?: string | null;
  onAnswer: (choice: number) => void;
  /** The small "Today's question" label (off where a heading already says it). */
  label?: boolean;
}

/** Today's question (requirement.md v1.49 §14.1): one tap, then the community's counts. */
export function QuestionCard({ today, community, sending, error, onAnswer, label = true }: CardProps) {
  const q = today.question;
  const note = cannotAnswerText(today.reason);
  return (
    <div className="rounded-2xl bg-white p-3 ring-1 ring-amber-200" data-testid="today-question">
      {label && <p className="mb-1 text-[11px] font-semibold uppercase tracking-widest text-amber-600">❓ Today's question</p>}
      <p className="text-sm font-bold leading-snug text-slate-900">{q.text}</p>
      {today.can_answer ? (
        <div className="mt-2 grid gap-1.5" role="group" aria-label="Choices">
          {q.choices.map((c, i) => (
            <button
              key={c.emoji}
              type="button"
              disabled={sending}
              onClick={() => onAnswer(i + 1)}
              className="flex items-center gap-2 rounded-xl bg-amber-50 px-3 py-2 text-left text-sm font-semibold text-slate-800 ring-1 ring-amber-100 active:scale-[0.98] disabled:opacity-60"
            >
              <span className="text-lg" aria-hidden>
                {c.emoji}
              </span>
              <span>{c.text}</span>
            </button>
          ))}
        </div>
      ) : (
        <>
          {showBars(today.counts) && <p className="mt-2 text-xs font-semibold text-slate-500">{soFarTitle(community, today.counts)}</p>}
          <ul className="mt-1 space-y-1">
            {q.choices.map((c, i) => {
              const mine = today.answered === i + 1;
              const bars = showBars(today.counts) ? today.counts : null;
              const pct = bars ? percents(bars) : null;
              return (
                <li key={c.emoji} className="relative overflow-hidden rounded-xl bg-slate-100 px-3 py-1.5 text-sm">
                  {pct && <span className={`absolute inset-y-0 left-0 ${mine ? 'bg-amber-300/70' : 'bg-amber-100'}`} style={{ width: `${pct[i]}%` }} aria-hidden />}
                  {!pct && mine && <span className="absolute inset-0 bg-amber-300/70" aria-hidden />}
                  <span className="relative flex items-center justify-between gap-2">
                    <span className={mine ? 'font-bold text-slate-900' : 'text-slate-700'}>
                      {c.emoji} {c.text}
                      {mine && ' ✓'}
                    </span>
                    {bars && <span className="text-xs font-semibold text-slate-600">{bars.choices[i]}</span>}
                  </span>
                </li>
              );
            })}
          </ul>
          {today.answered && !today.counts && <p className="mt-2 text-xs text-slate-500">Saving your answer…</p>}
          {today.answered && today.counts && (
            <p className="mt-2 text-xs text-slate-500">{showBars(today.counts) ? 'Tomorrow\'s paper has the final result. New question tomorrow!' : THANKS_TEXT}</p>
          )}
          {note && <p className="mt-2 text-xs text-slate-500">{note}</p>}
        </>
      )}
      {error && <p className="mt-2 rounded-xl bg-amber-50 px-2 py-1.5 text-xs text-amber-800">{error}</p>}
    </div>
  );
}

/** The card that pops up on the first open of the day (after the changes panel). */
export function QuestionPopUp({ community }: { community: string }) {
  const popUp = useQuestion((s) => s.popUp);
  const today = useQuestion((s) => s.today);
  const sending = useQuestion((s) => s.sending);
  const error = useQuestion((s) => s.error);
  useEffect(() => {
    if (popUp) playSound('paper-open');
  }, [popUp]);
  const close = () => {
    playSound('ui-close');
    useQuestion.getState().closePopUp();
  };
  // Answered: the counts show in place, then the card closes by itself (v1.51 §14.1).
  const autoClose = popUp ? autoCloseMs(today) : null;
  useEffect(() => {
    if (autoClose === null) return;
    const t = window.setTimeout(() => useQuestion.getState().closePopUp(), autoClose);
    return () => window.clearTimeout(t);
  }, [autoClose]);
  if (!popUp || !today) return null;
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-slate-900/20 p-4 pb-[max(1rem,env(safe-area-inset-bottom))] sm:items-center" onClick={close}>
      {/* once answered, a tap anywhere (the card too) closes it */}
      <div className="relative w-full max-w-sm" onClick={(e) => today.answered === null && e.stopPropagation()}>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            close();
          }}
          aria-label="Close" className="absolute right-2 top-2 z-10 rounded-full bg-slate-200/80 px-2.5 py-0.5 text-sm text-slate-700">
          ✕
        </button>
        <QuestionCard
          today={today}
          community={community}
          sending={sending}
          error={error}
          onAnswer={(choice) => {
            playSound('ui-click');
            void useQuestion.getState().answer(choice);
          }}
        />
      </div>
    </div>
  );
}

/** Community News: today's question (live) and yesterday's result for the community. */
export function NewsQuestion({ communityId, community, yesterday }: { communityId: string; community: string; yesterday: QuestionResult | null }) {
  const today = useQuestion((s) => (s.communityId === communityId ? s.today : null));
  const sending = useQuestion((s) => s.sending);
  const error = useQuestion((s) => s.error);
  useEffect(() => {
    void useQuestion.getState().load(communityId);
  }, [communityId]);
  return (
    <div className="space-y-2">
      {yesterday && (
        <p className="flex gap-2 text-sm leading-snug text-slate-800">
          <span aria-hidden>❓</span>
          <span>
            <span className="block text-xs text-slate-500">“{yesterday.question.text}”</span>
            {yesterdayLine(yesterday)}
          </span>
        </p>
      )}
      {today && <QuestionCard today={today} community={community} sending={sending} error={error} onAnswer={(c) => void useQuestion.getState().answer(c)} label={false} />}
    </div>
  );
}
