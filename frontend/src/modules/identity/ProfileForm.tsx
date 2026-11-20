import { useState } from 'react';
import { nicknameHint, NICKNAME_MESSAGES, suggestNickname } from './nickname';
import { SHIRT_COLORS } from './shirts';

interface Props {
  initialNickname?: string;
  initialShirt?: number;
  submitLabel: string;
  /** Returns an error message, or null when saved. */
  onSubmit: (nickname: string, shirt: number) => Promise<string | null>;
}

/** Nickname + shirt colour (requirement.md §6.1, §10.2). */
export function ProfileForm({ initialNickname, initialShirt = 0, submitLabel, onSubmit }: Props) {
  const [nickname, setNickname] = useState(() => initialNickname ?? suggestNickname());
  const [shirt, setShirt] = useState(initialShirt);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const hint = nicknameHint(nickname);

  const submit = async () => {
    if (hint) return setError(NICKNAME_MESSAGES[hint]);
    setSaving(true);
    setError(await onSubmit(nickname, shirt));
    setSaving(false);
  };

  return (
    <form
      className="flex flex-col gap-4"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div>
        <div className="mb-2 text-sm font-semibold text-slate-700">Shirt colour</div>
        <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Shirt colour">
          {SHIRT_COLORS.map((c, i) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={shirt === i}
              aria-label={`Colour ${i + 1}`}
              onClick={() => setShirt(i)}
              className={`h-10 w-10 rounded-full border-4 transition ${shirt === i ? 'scale-110 border-slate-800' : 'border-white shadow'}`}
              style={{ backgroundColor: c }}
            />
          ))}
        </div>
      </div>
      <label className="block">
        <span className="mb-1 block text-sm font-semibold text-slate-700">Nickname</span>
        <span className="flex gap-2">
          <input
            value={nickname}
            onChange={(e) => {
              setNickname(e.target.value);
              setError(null);
            }}
            maxLength={24}
            autoComplete="off"
            className="min-w-0 flex-1 rounded-xl border border-slate-200 px-3 py-2 text-base text-slate-800 outline-none focus:border-indigo-400"
          />
          <button
            type="button"
            onClick={() => {
              setNickname(suggestNickname());
              setError(null);
            }}
            aria-label="Suggest another nickname"
            title="Suggest another nickname"
            className="rounded-xl bg-slate-100 px-3 text-lg"
          >
            🎲
          </button>
        </span>
        <span className="mt-1 block text-xs text-slate-500">Shown on your house and in the community news. No real names needed.</span>
      </label>
      {error && <p className="text-sm text-rose-600">{error}</p>}
      <button type="submit" disabled={saving} className="rounded-2xl bg-emerald-500 py-2.5 text-sm font-semibold text-white disabled:opacity-60">
        {saving ? 'Saving…' : submitLabel}
      </button>
    </form>
  );
}
