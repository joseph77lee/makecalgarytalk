import { useState } from 'react';
import { useSoundSettings } from './settings';

/** 🔊 button: music and effects on/off separately (requirement.md v1.43 §10.5). */
export function SoundToggle() {
  const [open, setOpen] = useState(false);
  const music = useSoundSettings((s) => s.music);
  const effects = useSoundSettings((s) => s.effects);
  const set = useSoundSettings((s) => s.set);
  const anyOn = music || effects;
  return (
    <div className="pointer-events-auto relative">
      <button
        type="button"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Sound settings"
        title="Sound"
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-lg shadow-sm backdrop-blur ${anyOn ? 'bg-white/85' : 'bg-slate-800/75'}`}
      >
        <span aria-hidden>{anyOn ? '🔊' : '🔇'}</span>
      </button>
      {open && (
        <div className="absolute right-0 top-12 z-40 w-44 rounded-xl bg-white/95 p-2 text-sm text-slate-700 shadow-md backdrop-blur">
          <Switch label="🎵 Music" on={music} onChange={(v) => set({ music: v })} />
          <Switch label="🔔 Effects" on={effects} onChange={(v) => set({ effects: v })} />
        </div>
      )}
    </div>
  );
}

function Switch({ label, on, onChange }: { label: string; on: boolean; onChange: (v: boolean) => void }) {
  return (
    <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className="flex w-full items-center justify-between rounded-lg px-2 py-1.5 hover:bg-slate-50">
      <span className="font-semibold">{label}</span>
      <span className={`relative h-5 w-9 rounded-full transition-colors ${on ? 'bg-emerald-500' : 'bg-slate-300'}`}>
        <span className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all ${on ? 'left-[18px]' : 'left-0.5'}`} />
      </span>
    </button>
  );
}
