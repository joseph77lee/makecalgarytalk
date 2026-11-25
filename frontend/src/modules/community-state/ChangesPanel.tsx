import type { ServerChanges } from '../daily-actions';
import { changeItems, changesPanelOpen, type ChangeCard, type ChangeItem } from './changesText';

interface Props {
  changes: ServerChanges;
  /** Seen today by this account (server-side, identity module). */
  seen: boolean;
  onSeen: () => void;
  /** Lines from other modules shown first (e.g. Monday's ranking result). */
  extra?: ChangeItem[];
  /** Opens a share card for a line that has one. */
  onShare?: (card: ChangeCard) => void;
}

/** On entry, once per account per Calgary day: what changed since yesterday (requirement.md §10.1). */
export function ChangesPanel({ changes, seen, onSeen, extra = [], onShare }: Props) {
  if (!changesPanelOpen(changes, seen, extra)) return null;
  const items = changeItems(changes, extra);
  const close = onSeen;
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
            <li key={i} className="flex items-center gap-2 text-sm text-slate-700">
              <span aria-hidden>{it.icon}</span>
              <span className="min-w-0 flex-1">{it.text}</span>
              {it.card && onShare && (
                <button
                  type="button"
                  onClick={() => onShare(it.card!)}
                  className="shrink-0 rounded-full bg-indigo-50 px-2.5 py-1 text-xs font-semibold text-indigo-600 active:scale-95"
                >
                  📣 Share
                </button>
              )}
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
