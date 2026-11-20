import { useState } from 'react';
import type { ServerChanges } from '../daily-actions';
import { changeItems } from './changesText';

const SEEN_KEY = 'mct.changesSeen.v1';

function seenDay(): string | null {
  try {
    return window.localStorage.getItem(SEEN_KEY);
  } catch {
    return null;
  }
}
function markSeen(day: string) {
  try {
    window.localStorage.setItem(SEEN_KEY, day);
  } catch {
    // storage unavailable: the panel just shows again next visit
  }
}

interface Props {
  calgaryDay: string;
  changes: ServerChanges;
  vitality: number | null;
}

/** On entry, once per Calgary day: what changed since yesterday (requirement.md §10.1). */
export function ChangesPanel({ calgaryDay, changes, vitality }: Props) {
  const [closedDay, setClosedDay] = useState<string | null>(seenDay);
  const items = changeItems(changes, vitality);
  if (items.length === 0 || closedDay === calgaryDay) return null;
  const close = () => {
    markSeen(calgaryDay);
    setClosedDay(calgaryDay);
  };
  return (
    <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-900/20 p-4" onClick={close}>
      <div
        role="dialog"
        aria-label="What changed since yesterday"
        className="w-full max-w-sm rounded-3xl bg-white p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-2 text-base font-bold text-slate-800">Since yesterday</h2>
        <ul className="mb-3 space-y-1.5">
          {items.map((it, i) => (
            <li key={i} className="flex gap-2 text-sm text-slate-700">
              <span aria-hidden>{it.icon}</span>
              <span>{it.text}</span>
            </li>
          ))}
        </ul>
        <button type="button" onClick={close} className="w-full rounded-2xl bg-emerald-500 py-2 text-sm font-semibold text-white active:scale-[0.98]">
          Let's go
        </button>
      </div>
    </div>
  );
}
