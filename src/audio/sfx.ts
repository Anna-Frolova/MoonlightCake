// Sound effects, built from tones and noise.
import { pickRandom, randomInt, randomRange } from '../core/math';
import type { ElementId, KitchenThemeId } from '../data/types';
import { playMeow, playNoise, playPurr, playTone } from './engine';

/** Pentatonic steps — any combination sounds pleasant. */
const PENTATONIC = [0, 2, 4, 7, 9];
const BELL_BASE_HZ = 784; // G5

/** Glassy bell: a sine with two quiet overtones. `semitone` is relative to G5. */
function bell(semitone: number, delay = 0, volume = 0.09, duration = 0.9): void {
  const frequency = BELL_BASE_HZ * Math.pow(2, semitone / 12);
  playTone(frequency, duration, { volume, delay, reverb: 0.45, attack: 0.004 });
  playTone(frequency * 2.01, duration * 0.5, { volume: volume * 0.3, delay, reverb: 0.45, attack: 0.004 });
  playTone(frequency * 3.98, duration * 0.25, { volume: volume * 0.1, delay, reverb: 0.5, attack: 0.003 });
}

export const sfx = {
  hover() { playTone(2400 + Math.random() * 400, 0.06, { volume: 0.018, reverb: 0.4, attack: 0.003 }); },
  click() { bell(pickRandom(PENTATONIC) + 12 * randomInt(0, 1), 0, 0.07, 0.5); playTone(260, 0.1, { volume: 0.08, slideTo: 520, reverb: 0.1 }); },
  tab() { bell(pickRandom(PENTATONIC), 0, 0.06, 0.4); },
  /** A cake layer landing — a soft slime-like "bloop". */
  plop() {
    playTone(170, 0.22, { volume: 0.35, slideTo: 480, reverb: 0.15, attack: 0.005 });
    playTone(520, 0.12, { volume: 0.1, slideTo: 260, delay: 0.08, reverb: 0.2 });
    playNoise(0.08, 0.05, 700, { q: 2, reverb: 0.05, filter: 'lowpass' });
  },
  squish() { playNoise(0.12, 0.06, 650 + Math.random() * 300, { q: 3, sweepTo: 1200, reverb: 0.1 }); playTone(240, 0.1, { volume: 0.05, slideTo: 180, reverb: 0.05 }); },
  drop() { playTone(1500, 0.16, { volume: 0.14, slideTo: 520, reverb: 0.5, attack: 0.003 }); },
  bubble() { for (let i = 0; i < 4; i++) playTone(randomRange(260, 520), 0.12, { volume: 0.07, slideTo: randomRange(700, 1100), delay: i * 0.07, reverb: 0.3 }); },
  pour() { playNoise(0.7, 0.07, 400, { q: 0.8, sweepTo: 1600, reverb: 0.3, filter: 'lowpass' }); playTone(300, 0.6, { volume: 0.05, slideTo: 600, reverb: 0.4 }); },
  place() { playTone(620, 0.1, { volume: 0.14, slideTo: 980, reverb: 0.3, attack: 0.003 }); bell(12 + pickRandom(PENTATONIC), 0.02, 0.03, 0.3); },
  pickup() { playTone(500, 0.08, { volume: 0.1, slideTo: 760, reverb: 0.2, attack: 0.003 }); },
  coin() { [4, 8, 11].forEach((step, i) => bell(step + 12, i * 0.06, 0.06, 0.6)); },
  chime() { [0, 2, 4, 7, 9, 12].forEach((step, i) => bell(step, i * 0.06, 0.07, 1.1)); },
  sparkle() { for (let i = 0; i < 7; i++) playTone(randomRange(1800, 3200), 0.25, { volume: 0.035, delay: i * 0.045, reverb: 0.6, attack: 0.002 }); },
  fail() { playTone(420, 0.35, { volume: 0.12, slideTo: 260, reverb: 0.3 }); playTone(430, 0.35, { volume: 0.05, slideTo: 250, delay: 0.02, reverb: 0.3 }); },
  heart(index: number) { bell(PENTATONIC[index % 5] + (index >= 5 ? 12 : 0), 0, 0.09, 0.8); },
  poof() { playNoise(0.35, 0.09, 2500, { q: 0.7, sweepTo: 500, reverb: 0.35 }); },
  whoosh() { playNoise(0.45, 0.05, 300, { q: 1.2, sweepTo: 2400, reverb: 0.4 }); },
  buy() { sfx.coin(); [0, 4, 7, 12, 16].forEach((step, i) => bell(step, 0.15 + i * 0.07, 0.07, 1.2)); },
  /** Tiny shimmer while drawing a magic sign. */
  scribble() { playTone(randomRange(1400, 2300), 0.12, { volume: 0.018, reverb: 0.5, attack: 0.003 }); },
  magic(element: ElementId) {
    switch (element) {
      case 'fire':
        playNoise(0.7, 0.14, 250, { q: 0.7, sweepTo: 1800, reverb: 0.3, filter: 'lowpass' });
        for (let i = 0; i < 7; i++) playNoise(0.04, 0.06, 3200, { delay: 0.05 + i * 0.07 + randomRange(0, 0.05), q: 3, reverb: 0.1 });
        playTone(160, 0.6, { wave: 'sawtooth', volume: 0.035, slideTo: 80, reverb: 0.3 });
        break;
      case 'ice':
        [24, 28, 31, 36, 40].forEach((step, i) => bell(step, i * 0.05, 0.05, 1.3));
        playNoise(0.6, 0.05, 6000, { q: 2, reverb: 0.5, filter: 'highpass' });
        break;
      case 'bolt':
        playNoise(0.3, 0.25, 2500, { q: 0.5, sweepTo: 200, reverb: 0.3 });
        playTone(900, 0.3, { wave: 'sawtooth', volume: 0.07, slideTo: 110, reverb: 0.3 });
        playTone(55, 0.8, { volume: 0.22, slideTo: 35, delay: 0.03, reverb: 0.5 });
        break;
      case 'nature':
        [0, 4, 7, 11, 14, 19].forEach((step, i) => bell(step - 12, i * 0.08, 0.07, 1.3));
        playNoise(0.7, 0.04, 1500, { q: 0.6, sweepTo: 700, reverb: 0.4 });
        break;
      case 'dark': // a low swell sinking into a whoosh
        playTone(110, 1.2, { wave: 'sawtooth', volume: 0.05, slideTo: 55, reverb: 0.6, attack: 0.15 });
        playTone(116.5, 1.2, { wave: 'sawtooth', volume: 0.035, slideTo: 58, reverb: 0.6, attack: 0.15 });
        playNoise(1.0, 0.09, 1800, { q: 0.8, sweepTo: 150, reverb: 0.6, filter: 'lowpass' });
        [0, 1, 6].forEach((step, i) => bell(step - 12, 0.15 + i * 0.12, 0.05, 1.4));
        break;
      case 'light': // a bright chord rising like a choir
        [0, 4, 7, 12, 16, 19, 24].forEach((step, i) => bell(step, i * 0.05, 0.06, 1.6));
        [523, 659, 784].forEach(hz => playTone(hz, 1.4, { wave: 'triangle', volume: 0.03, reverb: 0.8, attack: 0.25 }));
        sfx.sparkle();
        break;
      case 'blood': // two heartbeats and a dark music-box chord
        for (const delay of [0, 0.22, 0.75, 0.97]) playTone(70, 0.25, { volume: 0.3, slideTo: 45, delay, reverb: 0.2 });
        [0, 3, 6, 9].forEach((step, i) => bell(step - 5, 0.1 + i * 0.09, 0.05, 1.3));
        break;
      default:
        sfx.chime(); sfx.sparkle();
    }
  },
  /** A special guest walks in: the café hints at the change. */
  specialArrival(theme: KitchenThemeId) {
    switch (theme) {
      case 'dungeon': // a rumble from below and a gong
        playTone(55, 1.6, { volume: 0.25, slideTo: 38, reverb: 0.6, attack: 0.05 });
        playNoise(1.2, 0.08, 220, { q: 0.6, reverb: 0.5, filter: 'lowpass' });
        playTone(98, 2, { wave: 'triangle', volume: 0.08, reverb: 0.8, delay: 0.1 });
        break;
      case 'heaven': // a harp glissando
        [0, 2, 4, 7, 9, 12, 14, 16, 19, 21, 24].forEach((step, i) => bell(step - 5, i * 0.045, 0.05, 1.4));
        break;
      case 'palace': // an organ chord and a flutter of bats
        [57, 60, 64, 69].forEach(note => playTone(440 * Math.pow(2, (note - 69) / 12), 1.8, { wave: 'square', volume: 0.018, reverb: 0.8, attack: 0.1 }));
        for (let i = 0; i < 6; i++) playTone(randomRange(3200, 4200), 0.05, { volume: 0.03, slideTo: 2600, delay: 0.5 + i * 0.09, reverb: 0.3 });
        break;
    }
  },
  /** The kitchen turns into the special guest's place. */
  transform() { playNoise(0.9, 0.08, 400, { q: 0.7, sweepTo: 3600, reverb: 0.6 }); sfx.sparkle(); },
  meow(pitch = 1, mood: 'neutral' | 'happy' | 'sad' = 'neutral') { playMeow(pitch, mood); },
  purr(pitch = 1, seconds = 2, delay = 0) { playPurr(pitch, seconds, delay); },
  /** An angry hiss before the guest throws the cake. */
  hiss() { playNoise(0.6, 0.12, 4500, { q: 0.8, sweepTo: 2500, reverb: 0.15, filter: 'highpass' }); },
  /** The cake flying at the screen. */
  throwCake() { playNoise(0.4, 0.08, 400, { q: 1.4, sweepTo: 3000, reverb: 0.2 }); },
  /** …and hitting it. */
  splat() {
    playNoise(0.35, 0.3, 900, { q: 0.6, sweepTo: 180, reverb: 0.25, filter: 'lowpass' });
    playTone(140, 0.3, { volume: 0.3, slideTo: 60, reverb: 0.2 });
    for (let i = 0; i < 4; i++) playNoise(0.06, 0.05, randomRange(500, 1200), { delay: 0.25 + i * 0.12, q: 3, reverb: 0.1 }); // drips
  },
};
