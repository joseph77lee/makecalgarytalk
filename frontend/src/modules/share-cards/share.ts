/** Shares an image with the system share sheet, or saves it when sharing files is not supported. */

export type ImageShareOutcome = 'shared' | 'saved' | 'cancelled' | 'failed';

interface ShareNavigator {
  canShare?: (data: ShareData) => boolean;
  share?: (data: ShareData) => Promise<void>;
}

export async function shareImage(
  blob: Blob,
  fileName: string,
  text: string,
  nav: ShareNavigator = navigator,
  save: (blob: Blob, fileName: string) => void = saveBlob,
): Promise<ImageShareOutcome> {
  const file = new File([blob], fileName, { type: blob.type || 'image/png' });
  const data: ShareData = { files: [file], text };
  if (nav.share && nav.canShare?.(data)) {
    try {
      await nav.share(data);
      return 'shared';
    } catch (e) {
      return e instanceof DOMException && e.name === 'AbortError' ? 'cancelled' : 'failed';
    }
  }
  try {
    save(blob, fileName);
    return 'saved';
  } catch {
    return 'failed';
  }
}

function saveBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}

export function imageShareOutcomeText(o: ImageShareOutcome): string | null {
  return { shared: 'Thanks for sharing!', saved: 'Card saved. Post it in your community group!', cancelled: null, failed: 'Could not share the card.' }[o];
}
