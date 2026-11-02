/**
 * Tiny "UX researcher at work" sounds, synthesised with the Web Audio API (no audio files):
 *   - typing:   a short burst of keyboard clicks (taking notes)
 *   - click:    a mouse click (going through data)
 *   - scribble: a marker squeaking on a sticky note (affinity mapping)
 *
 * Browsers only allow sound after the visitor has interacted with the page (a click, tap, key
 * or drag), so the audio context is unlocked on the first such gesture; hovers before that stay silent.
 */

type SoundKind = 'typing' | 'click' | 'scribble';

let ctx: AudioContext | null = null;
let master: GainNode | null = null;
let noiseBuf: AudioBuffer | null = null;
let lastPlayed = 0;
let unlockBound = false;

function ensureCtx() {
  if (typeof window === 'undefined') return null;
  if (!ctx) {
    const AC = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    master = ctx.createGain();
    master.gain.value = 0.35;
    master.connect(ctx.destination);
    noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  return ctx;
}

/** Call once on mount: unlocks audio on the visitor's first click / tap / key / drag. */
export function bindAudioUnlock() {
  if (unlockBound || typeof window === 'undefined') return;
  unlockBound = true;
  const unlock = () => {
    const c = ensureCtx();
    if (c && c.state === 'suspended') c.resume();
  };
  ['pointerdown', 'keydown', 'touchstart'].forEach((ev) => window.addEventListener(ev, unlock, { passive: true }));
}

function noiseBurst(c: AudioContext, at: number, dur: number, freq: number, q: number, peak: number, type: BiquadFilterType = 'bandpass') {
  const src = c.createBufferSource();
  src.buffer = noiseBuf;
  const f = c.createBiquadFilter();
  f.type = type;
  f.frequency.value = freq;
  f.Q.value = q;
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
  src.connect(f).connect(g).connect(master!);
  src.start(at, Math.random() * 0.5);
  src.stop(at + dur + 0.02);
}

function thump(c: AudioContext, at: number, freq: number, peak: number) {
  const o = c.createOscillator();
  o.type = 'sine';
  o.frequency.setValueAtTime(freq, at);
  o.frequency.exponentialRampToValueAtTime(freq * 0.6, at + 0.03);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, at);
  g.gain.exponentialRampToValueAtTime(peak, at + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0001, at + 0.04);
  o.connect(g).connect(master!);
  o.start(at);
  o.stop(at + 0.05);
}

function typing(c: AudioContext, t: number) {
  const n = 3 + Math.floor(Math.random() * 3);
  let at = t;
  for (let i = 0; i < n; i++) {
    noiseBurst(c, at, 0.025, 2600 + Math.random() * 1400, 1.2, 0.5);
    thump(c, at, 140 + Math.random() * 40, 0.25);
    at += 0.06 + Math.random() * 0.06;
  }
}

function click(c: AudioContext, t: number) {
  noiseBurst(c, t, 0.012, 5200, 2, 0.55, 'highpass');
  thump(c, t, 900, 0.12);
  noiseBurst(c, t + 0.075, 0.01, 4600, 2, 0.35, 'highpass');
}

function scribble(c: AudioContext, t: number) {
  // two or three quick marker strokes: filtered noise with a squeaky wobble
  const strokes = 2 + Math.floor(Math.random() * 2);
  let at = t;
  for (let s = 0; s < strokes; s++) {
    const dur = 0.09 + Math.random() * 0.07;
    const src = c.createBufferSource();
    src.buffer = noiseBuf;
    const f = c.createBiquadFilter();
    f.type = 'bandpass';
    f.Q.value = 3;
    f.frequency.setValueAtTime(1500 + Math.random() * 500, at);
    f.frequency.linearRampToValueAtTime(2600 + Math.random() * 600, at + dur);
    const g = c.createGain();
    g.gain.setValueAtTime(0.0001, at);
    g.gain.exponentialRampToValueAtTime(0.35, at + 0.015);
    g.gain.exponentialRampToValueAtTime(0.0001, at + dur);
    src.connect(f).connect(g).connect(master!);
    src.start(at, Math.random() * 0.5);
    src.stop(at + dur + 0.02);
    at += dur + 0.03;
  }
}

const PLAYERS: Record<SoundKind, (c: AudioContext, t: number) => void> = { typing, click, scribble };

/** Plays one research sound (random kind unless given). Throttled so sweeping across circles isn't noisy. */
export function playResearchSound(kind?: SoundKind) {
  const c = ensureCtx();
  if (!c || !master || c.state !== 'running') return;
  const now = performance.now();
  if (now - lastPlayed < 160) return;
  lastPlayed = now;
  const kinds: SoundKind[] = ['typing', 'click', 'scribble'];
  const k = kind ?? kinds[Math.floor(Math.random() * kinds.length)];
  PLAYERS[k](c, c.currentTime + 0.005);
}
