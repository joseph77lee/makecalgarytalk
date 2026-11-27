import { useState, type ReactNode } from 'react';
import { AvatarPreview } from '../avatar';
import { randomLook, type AvatarLook } from '../common';
import { LOOK_HAIR_COLOURS, SKIN_TONES } from '../island-view';
import { AGE_LABELS, HAIR_LABELS, beardAllowed, withPart } from './lookParts';
import { nicknameHint, NICKNAME_MESSAGES, suggestNickname } from './nickname';
import { SHIRT_COLORS } from './shirts';

interface Props {
  initialNickname?: string;
  initialShirt?: number;
  /** The look to start from; a random one when not given (first visit). */
  initialLook?: AvatarLook;
  submitLabel: string;
  /** Returns an error message, or null when saved. */
  onSubmit: (nickname: string, shirt: number, look: AvatarLook) => Promise<string | null>;
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div>
      <div className="mb-1 text-xs font-semibold text-slate-600">{label}</div>
      <div className="flex flex-wrap gap-1.5">{children}</div>
    </div>
  );
}

function Chip({ on, onClick, children, disabled }: { on: boolean; onClick: () => void; children: ReactNode; disabled?: boolean }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      disabled={disabled}
      onClick={onClick}
      className={`rounded-full px-2.5 py-1 text-xs font-semibold transition disabled:opacity-40 ${on ? 'bg-slate-800 text-white' : 'bg-slate-100 text-slate-600'}`}
    >
      {children}
    </button>
  );
}

function Swatch({ colour, on, label, onClick }: { colour: string; on: boolean; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={label}
      onClick={onClick}
      className={`h-7 w-7 rounded-full border-[3px] transition ${on ? 'scale-110 border-slate-800' : 'border-white shadow'}`}
      style={{ backgroundColor: colour }}
    />
  );
}

/** Nickname, shirt colour and how my villager looks (requirement.md v1.52 §6.1, §10.2). */
export function ProfileForm({ initialNickname, initialShirt = 0, initialLook, submitLabel, onSubmit }: Props) {
  const [nickname, setNickname] = useState(() => initialNickname ?? suggestNickname());
  const [shirt, setShirt] = useState(initialShirt);
  const [look, setLook] = useState<AvatarLook>(() => initialLook ?? randomLook());
  const set = <K extends keyof AvatarLook>(key: K, value: AvatarLook[K]) => setLook((l) => withPart(l, key, value));
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const hint = nicknameHint(nickname);

  const submit = async () => {
    if (hint) return setError(NICKNAME_MESSAGES[hint]);
    setSaving(true);
    setError(await onSubmit(nickname, shirt, look));
    setSaving(false);
  };

  return (
    <form
      className="flex flex-col gap-3"
      onSubmit={(e) => {
        e.preventDefault();
        void submit();
      }}
    >
      <div className="flex items-start gap-3">
        <div className="relative shrink-0">
          <AvatarPreview look={look} shirt={SHIRT_COLORS[shirt] ?? SHIRT_COLORS[0]} className="h-36 w-28 rounded-2xl bg-sky-50" />
          <button
            type="button"
            onClick={() => {
              setLook(randomLook());
              setShirt(Math.floor(Math.random() * SHIRT_COLORS.length));
            }}
            aria-label="Shuffle my look"
            title="Shuffle my look"
            className="absolute -bottom-2 -right-2 rounded-full bg-white px-2.5 py-1 text-lg shadow"
          >
            🎲
          </button>
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-2">
          <Row label="Age">
            {AGE_LABELS.map((l, i) => (
              <Chip key={l} on={look.age === i} onClick={() => set('age', i)}>
                {l}
              </Chip>
            ))}
          </Row>
          <Row label="Skin">
            {SKIN_TONES.map((c, i) => (
              <Swatch key={c} colour={c} on={look.skin === i} label={`Skin tone ${i + 1}`} onClick={() => set('skin', i)} />
            ))}
          </Row>
          <Row label="Shirt">
            {SHIRT_COLORS.map((c, i) => (
              <Swatch key={c} colour={c} on={shirt === i} label={`Shirt colour ${i + 1}`} onClick={() => setShirt(i)} />
            ))}
          </Row>
        </div>
      </div>
      <Row label="Hair">
        {HAIR_LABELS.map((l, i) => (
          <Chip key={l} on={look.hair === i} onClick={() => set('hair', i)}>
            {l}
          </Chip>
        ))}
      </Row>
      <Row label="Hair colour">
        {LOOK_HAIR_COLOURS.map((c, i) => (
          <Swatch key={c} colour={c} on={look.hair_colour === i} label={`Hair colour ${i + 1}`} onClick={() => set('hair_colour', i)} />
        ))}
      </Row>
      <Row label="Clothes and more">
        <Chip on={!look.skirt} onClick={() => set('skirt', false)}>
          Trousers
        </Chip>
        <Chip on={look.skirt} onClick={() => set('skirt', true)}>
          Skirt
        </Chip>
        <Chip on={look.beard} disabled={!beardAllowed(look)} onClick={() => set('beard', !look.beard)}>
          Beard
        </Chip>
        <Chip on={look.glasses} onClick={() => set('glasses', !look.glasses)}>
          Glasses
        </Chip>
      </Row>
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
