import { useEffect, useState } from 'react';
import { CARD_HEIGHT, CARD_WIDTH, cardFileName, cardShareText, drawCard, type ShareCard } from './card';
import { imageShareOutcomeText, shareImage } from './share';

interface Props {
  card: ShareCard;
  /** A picture of the island (taken when the dialog opened), or null. */
  island: HTMLCanvasElement | null;
  onClose: () => void;
  /** A short message for a toast after sharing/saving (null = nothing to say). */
  onResult?: (message: string | null) => void;
}

/** Preview of a share card with Share / Close (requirement.md v1.31 §12.2). */
export function ShareCardDialog({ card, island, onClose, onResult }: Props) {
  const [blob, setBlob] = useState<Blob | null>(null);
  const [url, setUrl] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const canvas = document.createElement('canvas');
    canvas.width = CARD_WIDTH;
    canvas.height = CARD_HEIGHT;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    drawCard(ctx, card, island, island ? [island.width, island.height] : null);
    let objectUrl: string | null = null;
    let alive = true;
    canvas.toBlob((b) => {
      if (!alive || !b) return;
      objectUrl = URL.createObjectURL(b);
      setBlob(b);
      setUrl(objectUrl);
    }, 'image/png');
    return () => {
      alive = false;
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [card, island]);

  const share = async () => {
    if (!blob) return;
    setBusy(true);
    const outcome = await shareImage(blob, cardFileName(card), cardShareText(card, window.location.origin));
    setBusy(false);
    onResult?.(imageShareOutcomeText(outcome));
    if (outcome === 'shared' || outcome === 'saved') onClose();
  };

  return (
    <div className="absolute inset-0 z-50 flex items-center justify-center bg-slate-900/40 p-4" onClick={onClose}>
      <div role="dialog" aria-label="Share card" className="flex w-full max-w-xs flex-col gap-3 rounded-3xl bg-white p-3 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="aspect-[4/5] w-full overflow-hidden rounded-2xl bg-slate-100">
          {url ? <img src={url} alt={`${card.communityName}: ${card.title}`} className="h-full w-full object-cover" /> : <p className="p-6 text-center text-sm text-slate-500">Making the card…</p>}
        </div>
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className="flex-1 rounded-2xl bg-slate-100 py-2.5 text-sm font-semibold text-slate-700">
            Close
          </button>
          <button
            type="button"
            disabled={!blob || busy}
            onClick={() => void share()}
            className="flex-[2] rounded-2xl bg-indigo-500 py-2.5 text-sm font-semibold text-white disabled:opacity-50 active:scale-[0.98]"
          >
            📣 Share
          </button>
        </div>
      </div>
    </div>
  );
}
