/**
 * Gallery sound board (M22): play every effect, choose the ambience (automatic from the chosen
 * weather and time, or loops by hand) and the music, and set the volumes. Dev tool only.
 */
import { useEffect, useState } from 'react';
import { EFFECTS, LOOPS, TRACKS, SoundToggle, ambienceMix, musicFor, playSound, setAmbience, setMusic, type EffectName, type LoopName, type SoundScene, type TrackName } from '../../sound';

const GROUPS: [string, EffectName[]][] = [
  ['UI', ['ui-click', 'ui-select', 'ui-confirm', 'ui-error', 'ui-place', 'ui-back', 'ui-close']],
  ['Player', ['footsteps', 'footsteps-snow', 'action-shovel', 'action-sweep', 'construction-hammer-roof', 'house-knock', 'paper-open', 'bubble-pop', 'map-whoosh']],
  ['Celebration', ['celebrate-built', 'crowd-cheer', 'land-rise']],
  ['Animals & people', ['villager-hello-female', 'villager-hello-male', 'deer-call', 'cougar-growl', 'rabbit-hop', 'geese-honk', 'owl']],
  ['Sky & town', ['thunder', 'plane-flyby', 'tram-passing']],
];

const short = (name: string) => name.replace(/^(ui|ambient|music)-/, '').replace(/-/g, ' ');

export function SoundBoard({ scene }: { scene: SoundScene }) {
  const [open, setOpen] = useState(false);
  const [autoAmbience, setAutoAmbience] = useState(true);
  const [loops, setLoops] = useState<Set<LoopName>>(new Set());
  const [track, setTrack] = useState<TrackName | 'auto' | 'off'>('auto');

  // every effect is listed in a group (catches a new sound left off the board)
  const listed = new Set(GROUPS.flatMap(([, names]) => names));
  const unlisted = (Object.keys(EFFECTS) as EffectName[]).filter((n) => !listed.has(n));

  const { weather, wind, nightness, hasWater, campfire, construction } = scene;
  useEffect(() => {
    const s = { weather, wind, nightness, hasWater, campfire, construction };
    setAmbience(autoAmbience ? ambienceMix(s) : Object.fromEntries([...loops].map((l) => [l, 0.3])));
    setMusic(track === 'auto' ? musicFor(s) : track === 'off' ? null : track);
  }, [weather, wind, nightness, hasWater, campfire, construction, autoAmbience, loops, track]);
  useEffect(
    () => () => {
      setAmbience({});
      setMusic(null);
    },
    [],
  );

  return (
    <div className="absolute left-3 top-24 z-20 flex flex-col items-start gap-2">
      <div className="flex items-center gap-2">
        <button type="button" onClick={() => setOpen(!open)} className="rounded-full bg-white/90 px-3 py-1.5 text-xs font-semibold text-slate-700 shadow">
          🎧 Sound board {open ? '▲' : '▼'}
        </button>
        <SoundToggle />
      </div>
      {open && (
        <div className="max-h-[70vh] w-72 overflow-y-auto rounded-2xl bg-white/95 p-3 text-xs text-slate-700 shadow-lg">
          <p className="mb-2 text-[11px] text-slate-500">Tap the page once first (browsers start sound only after a tap).</p>
          {[...GROUPS, ...(unlisted.length ? ([['Other', unlisted]] as [string, EffectName[]][]) : [])].map(([title, names]) => (
            <div key={title} className="mb-2">
              <div className="mb-1 font-bold">{title}</div>
              <div className="flex flex-wrap gap-1">
                {names.map((n) => (
                  <button key={n} type="button" onClick={() => playSound(n)} className="rounded-full bg-slate-100 px-2 py-1 hover:bg-indigo-100">
                    ▶ {short(n)}
                  </button>
                ))}
              </div>
            </div>
          ))}
          <div className="mb-2">
            <div className="mb-1 flex items-center justify-between font-bold">
              <span>Ambience</span>
              <label className="flex items-center gap-1 font-normal">
                <input type="checkbox" checked={autoAmbience} onChange={(e) => setAutoAmbience(e.target.checked)} /> from weather &amp; time
              </label>
            </div>
            <div className="flex flex-wrap gap-1">
              {LOOPS.map((l) => {
                const on = loops.has(l);
                return (
                  <button
                    key={l}
                    type="button"
                    disabled={autoAmbience}
                    onClick={() => setLoops((s) => (on ? new Set([...s].filter((x) => x !== l)) : new Set([...s, l])))}
                    className={`rounded-full px-2 py-1 disabled:opacity-40 ${on ? 'bg-emerald-500 text-white' : 'bg-slate-100'}`}
                  >
                    {short(l)}
                  </button>
                );
              })}
            </div>
          </div>
          <div>
            <div className="mb-1 font-bold">Music</div>
            <div className="flex flex-wrap gap-1">
              {(['auto', ...TRACKS, 'off'] as const).map((m) => (
                <button key={m} type="button" onClick={() => setTrack(m)} className={`rounded-full px-2 py-1 ${track === m ? 'bg-indigo-500 text-white' : 'bg-slate-100'}`}>
                  {m === 'auto' ? 'auto' : m === 'off' ? 'off' : short(m)}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
