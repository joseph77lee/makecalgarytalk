import type { Message } from './text';

/** Result of the last check-in or move, under the buttons. */
export function MessageLine({ message }: { message: Message | null }) {
  if (!message) return null;
  return (
    <p
      role="status"
      className={`mt-3 rounded-2xl px-3 py-2 text-xs ${message.tone === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-amber-50 text-amber-800'}`}
    >
      {message.text}
    </p>
  );
}
