// Public API of the `sound` module (M22, requirement.md v1.43 §10.5). Other modules import ONLY from here.
export { installSound, playSound, setAmbience, setMusic, type PlayOptions } from './engine';
export { ambienceMix, musicFor, workSound, type SoundScene } from './mix';
export { useSoundSettings } from './settings';
export { SoundToggle } from './SoundToggle';
export type { EffectName, LoopName, TrackName } from './catalog';
