import { useEffect, useState } from 'react';
import { useInvites } from './liveStore';

interface Props {
  /** Server's Calgary day (the × hides the button until the next one). */
  calgaryDay: string;
  /** A short nudge for a good moment, or null (shown at most once a day). */
  nudge: string | null;
  onInvite: () => void;
}

const NUDGE_MS = 10_000;

/**
 * Always-visible invite button at the bottom right of my community (requirement §5.1). The small
 * × hides it for the rest of the Calgary day; at good moments it shows a one-line nudge.
 */
export function InviteFab({ calgaryDay, nudge, onInvite }: Props) {
  const hiddenDay = useInvites((s) => s.hiddenDay);
  const hideForDay = useInvites((s) => s.hideForDay);
  const nudgedDay = useInvites((s) => s.nudgedDay);
  const markNudged = useInvites((s) => s.markNudged);
  const hidden = hiddenDay === calgaryDay;
  // Decided once when the button appears (the app mounts it with the day's state).
  const [bubble, setBubble] = useState<string | null>(() => (!hidden && nudge && nudgedDay !== calgaryDay ? nudge : null));

  useEffect(() => {
    if (!bubble) return;
    markNudged(calgaryDay);
    const t = setTimeout(() => setBubble(null), NUDGE_MS);
    return () => clearTimeout(t);
    // Only when a bubble first shows.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bubble !== null]);

  if (hidden) return null;
  return (
    <div className="pointer-events-none absolute bottom-[9.5rem] right-3 z-30 flex flex-col items-end gap-2">
      {bubble && (
        <button
          type="button"
          onClick={() => {
            setBubble(null);
            onInvite();
          }}
          className="pointer-events-auto max-w-[15rem] animate-[pulse_1.2s_ease-in-out_2] rounded-2xl rounded-br-sm bg-white px-3 py-2 text-left text-xs font-semibold text-emerald-800 shadow-lg"
        >
          {bubble}
        </button>
      )}
      <div className="pointer-events-auto relative">
        <button
          type="button"
          onClick={onInvite}
          className="flex h-12 items-center gap-1.5 rounded-full bg-emerald-500 pl-4 pr-5 text-sm font-bold text-white shadow-lg ring-4 ring-white/60 active:scale-95"
        >
          <span className="text-lg" aria-hidden>
            👋
          </span>
          Invite
        </button>
        <button
          type="button"
          onClick={() => hideForDay(calgaryDay)}
          aria-label="Hide the invite button for today"
          title="Hide for today"
          className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-slate-700/80 text-[10px] leading-none text-white shadow"
        >
          ✕
        </button>
      </div>
    </div>
  );
}
