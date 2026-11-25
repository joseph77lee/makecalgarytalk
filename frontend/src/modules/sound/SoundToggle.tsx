import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { CHANNELS, useSoundSettings, type Channel } from './settings';

const LABEL: Record<Channel, string> = { music: '🎵 Music', ambience: '🌿 Ambience', effects: '🔔 Effects' };

/**
 * 🔊 button and its panel (requirement.md v1.44 §10.5): music, ambience and effects each with a
 * switch and a volume slider. The panel is drawn on top of everything (a portal), so bars under
 * the button never cover it.
 */
export function SoundToggle() {
  const [open, setOpen] = useState(false);
  const button = useRef<HTMLButtonElement>(null);
  const [anchor, setAnchor] = useState<{ top: number; right: number } | null>(null);
  const on = useSoundSettings((s) => s.on);
  const anyOn = on.music || on.ambience || on.effects;

  useEffect(() => {
    if (!open) return;
    const place = () => {
      const r = button.current?.getBoundingClientRect();
      if (r) setAnchor({ top: r.bottom + 8, right: Math.max(8, window.innerWidth - r.right) });
    };
    place();
    window.addEventListener('resize', place);
    return () => window.removeEventListener('resize', place);
  }, [open]);

  return (
    <div className="pointer-events-auto">
      <button
        ref={button}
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Sound settings"
        title="Sound"
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg shadow-sm backdrop-blur ${anyOn ? 'bg-white/85' : 'bg-slate-800/75'}`}
      >
        <span aria-hidden>{anyOn ? '🔊' : '🔇'}</span>
      </button>
      {open &&
        anchor &&
        createPortal(
          <>
            <div className="fixed inset-0 z-[90]" onClick={() => setOpen(false)} aria-hidden />
            <div
              role="dialog"
              aria-label="Sound"
              className="fixed z-[91] w-60 rounded-2xl bg-white/95 p-3 text-sm text-slate-700 shadow-lg backdrop-blur"
              style={{ top: anchor.top, right: anchor.right }}
            >
              {CHANNELS.map((c) => (
                <ChannelRow key={c} channel={c} />
              ))}
            </div>
          </>,
          document.body,
        )}
    </div>
  );
}

function ChannelRow({ channel }: { channel: Channel }) {
  const on = useSoundSettings((s) => s.on[channel]);
  const volume = useSoundSettings((s) => s.volume[channel]);
  const setOn = useSoundSettings((s) => s.setOn);
  const setVolume = useSoundSettings((s) => s.setVolume);
  return (
    <div className="py-1.5">
      <div className="flex items-center justify-between">
        <span className="font-semibold">{LABEL[channel]}</span>
        <button type="button" role="switch" aria-checked={on} aria-label={`${LABEL[channel]} on or off`} onClick={() => setOn(channel, !on)}>
          <span className={`relative block h-5 w-9 rounded-full transition-colors ${on ? 'bg-emerald-500' : 'bg-slate-300'}`}>
            <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
          </span>
        </button>
      </div>
      <input
        type="range"
        min={0}
        max={100}
        step={5}
        value={Math.round(volume * 100)}
        disabled={!on}
        onChange={(e) => setVolume(channel, Number(e.target.value) / 100)}
        aria-label={`${LABEL[channel]} volume`}
        className="mt-1 w-full accent-emerald-500 disabled:opacity-40"
      />
    </div>
  );
}
