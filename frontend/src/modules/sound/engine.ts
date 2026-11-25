/**
 * Sound engine (requirement.md v1.43 §10.5): Web Audio with three buses (music, ambience,
 * effects) under one master. Nothing starts before the first tap or key press (browser rules);
 * the page going hidden suspends audio. Files load on demand and a missing one is skipped.
 * Callers only state what they want (`playSound`, `setAmbience`, `setMusic`); the engine keeps
 * the wish and applies it once audio is unlocked, with fades.
 */
import { AMBIENCE_VOLUME, EFFECTS, EFFECTS_VOLUME, MUSIC_VOLUME, soundUrl, type EffectName, type LoopName, type TrackName } from './catalog';
import { useSoundSettings } from './settings';

const FADE = 1.5;
const CROSSFADE = 2.5;
const MAX_EFFECTS = 8;

interface Playing {
  source: AudioBufferSourceNode;
  gain: GainNode;
}

let ctx: AudioContext | null = null;
let buses: { music: GainNode; ambience: GainNode; effects: GainNode } | null = null;
const buffers = new Map<string, Promise<AudioBuffer | null>>();
const lastPlayed = new Map<string, number>();
let activeEffects = 0;

let wantedAmbience: Partial<Record<LoopName, number>> = {};
const loops = new Map<LoopName, Playing>();
let wantedTrack: TrackName | null = null;
let music: { name: TrackName; playing: Playing } | null = null;

function audioAvailable(): boolean {
  return typeof window !== 'undefined' && typeof window.AudioContext !== 'undefined';
}

function load(name: string): Promise<AudioBuffer | null> {
  let p = buffers.get(name);
  if (!p) {
    p = fetch(soundUrl(name))
      .then((r) => (r.ok ? r.arrayBuffer() : Promise.reject(new Error(`HTTP ${r.status}`))))
      .then((data) => (ctx ? ctx.decodeAudioData(data) : null))
      .catch((e: unknown) => {
        console.warn(`[sound] ${name} skipped:`, e instanceof Error ? e.message : e);
        return null;
      });
    buffers.set(name, p);
  }
  return p;
}

function applySettings(): void {
  if (!ctx || !buses) return;
  const { on, volume } = useSoundSettings.getState();
  const t = ctx.currentTime;
  // sliders feel natural on a squared curve
  const level = (c: 'music' | 'ambience' | 'effects', base: number) => (on[c] ? base * volume[c] * volume[c] : 0);
  buses.music.gain.setTargetAtTime(level('music', MUSIC_VOLUME), t, 0.15);
  buses.ambience.gain.setTargetAtTime(level('ambience', AMBIENCE_VOLUME), t, 0.15);
  buses.effects.gain.setTargetAtTime(level('effects', EFFECTS_VOLUME), t, 0.05);
}

/** Creates the audio graph on the first user gesture. */
function unlock(): void {
  if (ctx || !audioAvailable()) return;
  try {
    ctx = new AudioContext();
  } catch {
    return;
  }
  const master = ctx.createGain();
  master.connect(ctx.destination);
  const bus = () => {
    const g = ctx!.createGain();
    g.gain.value = 0;
    g.connect(master);
    return g;
  };
  buses = { music: bus(), ambience: bus(), effects: bus() };
  applySettings();
  void ctx.resume();
  // small effects are worth having ready before they are needed
  for (const name of ['ui-select', 'ui-confirm', 'ui-error', 'footsteps', 'footsteps-snow', 'bubble-pop']) void load(name);
  reconcileAmbience();
  reconcileMusic();
}

export function installSound(): () => void {
  if (!audioAvailable()) return () => {};
  const onGesture = () => unlock();
  const onVisibility = () => {
    if (!ctx) return;
    if (document.visibilityState === 'hidden') void ctx.suspend();
    else void ctx.resume();
  };
  window.addEventListener('pointerdown', onGesture, { passive: true });
  window.addEventListener('keydown', onGesture);
  document.addEventListener('visibilitychange', onVisibility);
  const unsubscribe = useSoundSettings.subscribe(() => {
    applySettings();
    reconcileAmbience();
    reconcileMusic();
  });
  return () => {
    window.removeEventListener('pointerdown', onGesture);
    window.removeEventListener('keydown', onGesture);
    document.removeEventListener('visibilitychange', onVisibility);
    unsubscribe();
  };
}

export interface PlayOptions {
  /** Multiplies the catalog volume. */
  volume?: number;
  /** Seconds to wait before playing. */
  delay?: number;
  /** Play only part of a longer file. */
  offset?: number;
  duration?: number;
  rate?: number;
}

/** A one-shot effect. Silently does nothing before the first tap, when effects are off or the file is missing. */
export function playSound(name: EffectName, opts: PlayOptions = {}): void {
  if (!ctx || !buses || !useSoundSettings.getState().on.effects) return;
  const spec: { volume: number; gap?: number; fallback?: EffectName } = EFFECTS[name];
  const now = ctx.currentTime;
  const gap = spec.gap ?? 0.06;
  if (now - (lastPlayed.get(name) ?? -Infinity) < gap || activeEffects >= MAX_EFFECTS) return;
  lastPlayed.set(name, now);
  const c = ctx;
  const out = buses.effects;
  void load(name).then(async (found) => {
    // a missing file can stand in with a softer sound (e.g. animals without their own file)
    const buffer = found ?? (spec.fallback ? await load(spec.fallback) : null);
    if (!buffer || ctx !== c) return;
    const source = c.createBufferSource();
    source.buffer = buffer;
    source.playbackRate.value = opts.rate ?? 1;
    const gain = c.createGain();
    gain.gain.value = spec.volume * (opts.volume ?? 1);
    source.connect(gain).connect(out);
    activeEffects++;
    source.onended = () => {
      activeEffects--;
      gain.disconnect();
    };
    const when = c.currentTime + (opts.delay ?? 0);
    if (opts.duration !== undefined) {
      // fade out the cut so it does not click
      gain.gain.setValueAtTime(gain.gain.value, when + Math.max(0, opts.duration - 0.08));
      gain.gain.linearRampToValueAtTime(0, when + opts.duration);
      source.start(when, opts.offset ?? 0, opts.duration);
    } else source.start(when, opts.offset ?? 0);
  });
}

function startLoop(name: LoopName | TrackName, out: GainNode, volume: number, fade: number, randomStart = true): Playing | null {
  if (!ctx) return null;
  const c = ctx;
  const gain = c.createGain();
  gain.gain.value = 0;
  gain.connect(out);
  const source = c.createBufferSource();
  source.loop = true;
  source.connect(gain);
  const playing = { source, gain };
  void load(name).then((buffer) => {
    if (!buffer || ctx !== c) return;
    source.buffer = buffer;
    // ambience starts at a random point so repeats are not in step; music from the top
    source.start(0, randomStart ? Math.random() * buffer.duration * 0.8 : 0);
    gain.gain.setTargetAtTime(volume, c.currentTime, fade / 3);
  });
  return playing;
}

function stopLoop(p: Playing, fade: number): void {
  if (!ctx) return;
  const t = ctx.currentTime;
  p.gain.gain.cancelScheduledValues(t);
  p.gain.gain.setTargetAtTime(0, t, fade / 3);
  setTimeout(() => {
    try {
      p.source.stop();
    } catch {
      // never started (file missing)
    }
    p.gain.disconnect();
  }, fade * 1000 + 200);
}

function reconcileAmbience(): void {
  if (!ctx || !buses) return;
  const on = useSoundSettings.getState().on.ambience;
  for (const [name, p] of loops) {
    const v = on ? wantedAmbience[name] : undefined;
    if (v === undefined) {
      stopLoop(p, FADE);
      loops.delete(name);
    } else p.gain.gain.setTargetAtTime(v, ctx.currentTime, FADE / 3);
  }
  if (!on) return;
  for (const [name, v] of Object.entries(wantedAmbience) as [LoopName, number][]) {
    if (loops.has(name)) continue;
    const p = startLoop(name, buses.ambience, v, FADE);
    if (p) loops.set(name, p);
  }
}

function reconcileMusic(): void {
  if (!ctx || !buses) return;
  const want = useSoundSettings.getState().on.music ? wantedTrack : null;
  if (music?.name === want) return;
  if (music) stopLoop(music.playing, CROSSFADE);
  music = null;
  if (!want) return;
  const p = startLoop(want, buses.music, 1, CROSSFADE, false);
  if (p) music = { name: want, playing: p };
}

/** The ambience loops wanted now (name → volume); others fade out. */
export function setAmbience(mix: Partial<Record<LoopName, number>>): void {
  wantedAmbience = mix;
  reconcileAmbience();
}

/** The music track wanted now (null = silence); the change crossfades. */
export function setMusic(track: TrackName | null): void {
  wantedTrack = track;
  reconcileMusic();
}
