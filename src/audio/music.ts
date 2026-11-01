// Background music, scheduled slightly ahead of time. The café has its own mysterious music-box tune;
// each special guest brings theirs (dungeon, heaven, palace, shrine, cult, meadow), which plays while they are in the café.
import type { KitchenThemeId } from '../data/types';
import { audioTime, playTone, type ToneOptions } from './engine';

export type MusicTrackId = 'cafe' | KitchenThemeId;

const midiToHz = (note: number) => 440 * Math.pow(2, (note - 69) / 12);
const note = (midi: number, duration: number, delay: number, options: ToneOptions): void =>
  playTone(midiToHz(midi), duration, { bus: 'music', delay, ...options });

interface Track {
  stepSeconds: number;
  stepsPerBar: number;
  /** One chord (MIDI notes) per bar. */
  chords: number[][];
  /** Queues everything that sounds on `step` (counted from the start of the track), `delay` seconds from now. */
  playStep(step: number, beat: number, chord: number[], delay: number): void;
}

/** The café: a music-box melody over a soft pad. Am – F – G – Em. */
const CAFE_MELODY = [76, 72, 69, 72, 76, 79, 77, 76, 72, 69, 65, 69, 72, 74, 72, 69, 74, 71, 67, 71, 74, 76, 74, 71, 71, 68, 64, 68, 71, 72, 71, 68];
const cafe: Track = {
  stepSeconds: 0.36, stepsPerBar: 8,
  chords: [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 66], [52, 55, 59, 62]],
  playStep(step, beat, chord, delay) {
    // melody: every other step for sure, sometimes the ones in between
    if (beat % 2 === 0 || Math.random() < 0.4) {
      const melody = CAFE_MELODY[step % CAFE_MELODY.length];
      note(melody, 1.2, delay, { volume: 0.03, reverb: 0.55, attack: 0.004 });
      note(melody + 12, 0.5, delay, { volume: 0.01, reverb: 0.6, attack: 0.003 });
    }
    // bass + slow pad at the start of each bar
    if (beat === 0) {
      note(chord[0] - 12, 3.0, delay, { volume: 0.045, reverb: 0.3, attack: 0.3 });
      for (const pad of chord) {
        note(pad, 3.2, delay, { wave: 'triangle', volume: 0.012, reverb: 0.7, attack: 0.9 });
        playTone(midiToHz(pad) * 1.004, 3.2, { wave: 'triangle', volume: 0.008, delay, bus: 'music', reverb: 0.7, attack: 0.9 });
      }
    }
  },
};

/** Demon's dungeon: a slow, heavy D minor with a drone, war-drum thumps and a sinister bell line. Dm – B♭ – Gm – A. */
const DUNGEON_MELODY = [74, 0, 73, 74, 77, 0, 76, 74, 70, 0, 69, 70, 74, 0, 72, 70, 67, 0, 69, 70, 74, 72, 70, 69, 69, 0, 73, 76, 73, 0, 69, 0];
const dungeon: Track = {
  stepSeconds: 0.4, stepsPerBar: 8,
  chords: [[50, 53, 57], [46, 50, 53], [43, 46, 50], [45, 49, 52]],
  playStep(step, beat, chord, delay) {
    if (beat === 0 || beat === 3 || beat === 6) note(chord[0] - 24, 0.5, delay, { volume: 0.2, reverb: 0.4 }); // drum
    if (beat === 0) {
      note(chord[0] - 12, 3.4, delay, { wave: 'sawtooth', volume: 0.016, reverb: 0.5, attack: 0.4 }); // growling drone
      note(chord[0] - 12.1, 3.4, delay, { wave: 'sawtooth', volume: 0.012, reverb: 0.5, attack: 0.4 });
      for (const pad of chord) note(pad, 3.4, delay, { wave: 'triangle', volume: 0.014, reverb: 0.8, attack: 0.6 });
    }
    const melody = DUNGEON_MELODY[step % DUNGEON_MELODY.length];
    if (melody) {
      note(melody - 12, 1.4, delay, { volume: 0.035, reverb: 0.7, attack: 0.004 });
      note(melody - 12 + 6, 0.6, delay, { volume: 0.006, reverb: 0.7, attack: 0.004 }); // a tritone shadow
    }
  },
};

/** Angel's heaven: bright harp arpeggios, a high choir pad and bells. Cmaj7 – Fmaj7 – Am7 – G. */
const heaven: Track = {
  stepSeconds: 0.24, stepsPerBar: 12,
  chords: [[60, 64, 67, 71], [53, 57, 60, 64], [57, 60, 64, 67], [55, 59, 62, 67]],
  playStep(step, beat, chord, delay) {
    // harp: up and down the chord across two octaves
    const run = [0, 1, 2, 3, 4, 5, 6, 7, 6, 5, 4, 3][beat];
    note(chord[run % chord.length] + 12 * Math.floor(run / chord.length), 1.6, delay, { volume: 0.026, reverb: 0.7, attack: 0.003 });
    if (beat === 0) {
      note(chord[0] - 12, 3.6, delay, { volume: 0.04, reverb: 0.5, attack: 0.2 });
      for (const pad of chord) note(pad + 12, 3.6, delay, { wave: 'triangle', volume: 0.008, reverb: 0.9, attack: 1.2 }); // choir
    }
    if (beat === 6 && step % 24 === 6) note(chord[2] + 24, 2.2, delay, { volume: 0.02, reverb: 0.9, attack: 0.003 }); // a bell from above
  },
};

/** Vampire's palace: a harpsichord waltz in A minor. Am – E – Am – Dm – G – C – E – E. */
const PALACE_MELODY = [76, 0, 77, 76, 75, 76, 71, 0, 72, 71, 70, 71, 76, 0, 77, 76, 75, 76, 81, 0, 79, 77, 76, 74,
  74, 0, 76, 74, 72, 71, 72, 0, 74, 72, 71, 69, 68, 0, 69, 71, 72, 74, 76, 0, 0, 0, 68, 71];
const palace: Track = {
  stepSeconds: 0.2, stepsPerBar: 6,
  chords: [[57, 60, 64], [52, 56, 59], [57, 60, 64], [50, 53, 57], [55, 59, 62], [48, 52, 55], [52, 56, 59], [52, 56, 59]],
  playStep(step, beat, chord, delay) {
    const pluck: ToneOptions = { wave: 'square', reverb: 0.45, attack: 0.002 };
    if (beat === 0) note(chord[0] - 12, 0.9, delay, { ...pluck, volume: 0.022 }); // oom…
    if (beat === 2 || beat === 4) for (const pad of chord) note(pad, 0.35, delay, { ...pluck, volume: 0.008 }); // …pah-pah
    const melody = PALACE_MELODY[step % PALACE_MELODY.length];
    if (melody) {
      note(melody, 0.5, delay, { ...pluck, volume: 0.013 });
      note(melody + 12, 0.3, delay, { volume: 0.008, reverb: 0.5, attack: 0.002 });
    }
    if (beat === 0 && step % (6 * 8) === 0) note(chord[0] - 24, 4, delay, { wave: 'triangle', volume: 0.05, reverb: 0.9, attack: 0.5 }); // organ pedal
  },
};

/** Kitsune's shrine: the Japanese miyako-bushi scale (E F A B C) — koto plucks, a breathy flute and taiko drums over a drone. */
const SHRINE_KOTO = [64, 65, 69, 71, 72, 71, 69, 65, 64, 69, 71, 76, 77, 76, 72, 71];
const SHRINE_FLUTE = [76, 0, 0, 0, 77, 0, 76, 0, 72, 0, 0, 0, 71, 0, 69, 0, 71, 0, 0, 0, 72, 0, 71, 0, 69, 0, 65, 0, 64, 0, 0, 0];
const shrine: Track = {
  stepSeconds: 0.3, stepsPerBar: 8,
  chords: [[52, 59], [57, 64], [52, 59], [53, 60]],
  playStep(step, beat, chord, delay) {
    if (beat % 2 === 0 || Math.random() < 0.3) { // koto: a bright pluck with a quick decay
      const koto = SHRINE_KOTO[step % SHRINE_KOTO.length];
      note(koto, 0.9, delay, { wave: 'triangle', volume: 0.03, reverb: 0.5, attack: 0.002 });
      note(koto + 12, 0.35, delay, { volume: 0.01, reverb: 0.5, attack: 0.002 });
    }
    const flute = SHRINE_FLUTE[step % SHRINE_FLUTE.length];
    if (flute) { // shakuhachi-like: a soft attack and a slight bend up into the note
      playTone(midiToHz(flute) * 0.985, 1.6, { volume: 0.02, delay, bus: 'music', reverb: 0.8, attack: 0.25, slideTo: midiToHz(flute) });
    }
    if (beat === 0) {
      for (const drone of chord) note(drone - 12, 2.6, delay, { wave: 'triangle', volume: 0.014, reverb: 0.7, attack: 0.6 });
      note(40, 0.6, delay, { volume: 0.22, slideTo: midiToHz(33), reverb: 0.5 }); // taiko
    }
    if (beat === 5) note(40, 0.4, delay, { volume: 0.12, slideTo: midiToHz(33), reverb: 0.4 });
  },
};

/** The cultist's hall: a slow chant in C phrygian — a low drone, choir chords, a tolling bell and a two-voice chant. */
const CULT_CHANT = [60, 0, 61, 0, 60, 0, 58, 0, 60, 0, 63, 0, 61, 0, 60, 0];
const cult: Track = {
  stepSeconds: 0.5, stepsPerBar: 8,
  chords: [[48, 51, 55], [49, 53, 56], [48, 51, 55], [46, 49, 53]],
  playStep(step, beat, chord, delay) {
    if (beat === 0) {
      note(36, 4.2, delay, { wave: 'sawtooth', volume: 0.012, reverb: 0.6, attack: 0.8 });
      for (const voice of chord) note(voice + 12, 4.2, delay, { wave: 'triangle', volume: 0.016, reverb: 0.9, attack: 1.4 }); // choir
      note(chord[0] + 24, 3.5, delay, { volume: 0.05, reverb: 0.9, attack: 0.004 }); // bell
      playTone(midiToHz(chord[0] + 24) * 2.76, 2.5, { volume: 0.012, delay, bus: 'music', reverb: 0.9, attack: 0.004 }); // the bell's inharmonic partial
    }
    const chant = CULT_CHANT[step % CULT_CHANT.length];
    if (chant) { // two voices a fifth apart, sung softly
      note(chant, 1.1, delay, { wave: 'triangle', volume: 0.022, reverb: 0.8, attack: 0.15 });
      note(chant - 5, 1.1, delay, { wave: 'triangle', volume: 0.014, reverb: 0.8, attack: 0.15 });
    }
  },
};

/** The fairy's meadow: a light pastoral in 6/8 — pizzicato bass, a flute tune and birds. G – C – D – G – Em – C – D – G. */
const MEADOW_FLUTE = [79, 0, 81, 83, 0, 79, 84, 0, 83, 81, 0, 79, 81, 0, 79, 78, 0, 74, 79, 0, 0, 0, 0, 0,
  76, 0, 79, 83, 0, 81, 79, 0, 76, 72, 0, 76, 74, 0, 76, 78, 0, 81, 79, 0, 0, 0, 0, 0];
const meadow: Track = {
  stepSeconds: 0.22, stepsPerBar: 6,
  chords: [[55, 59, 62], [48, 52, 55], [50, 54, 57], [55, 59, 62], [52, 55, 59], [48, 52, 55], [50, 54, 57], [55, 59, 62]],
  playStep(step, beat, chord, delay) {
    const pluck: ToneOptions = { wave: 'triangle', reverb: 0.4, attack: 0.002 };
    if (beat === 0 || beat === 3) note(chord[0] - 12 + (beat === 3 ? 7 : 0), 0.5, delay, { ...pluck, volume: 0.035 });
    if (beat === 1 || beat === 4) for (const voice of chord) note(voice, 0.3, delay, { ...pluck, volume: 0.009 });
    const flute = MEADOW_FLUTE[step % MEADOW_FLUTE.length];
    if (flute) note(flute, 0.6, delay, { volume: 0.022, reverb: 0.6, attack: 0.03 });
    if (beat === 2 && Math.random() < 0.25) { // a bird: two quick chirps
      for (const chirp of [0, 0.09]) playTone(2600 + Math.random() * 900, 0.07, { volume: 0.012, delay: delay + chirp, bus: 'music', reverb: 0.4, attack: 0.002, slideTo: 3800 });
    }
  },
};

const TRACKS: Record<MusicTrackId, Track> = { cafe, dungeon, heaven, palace, shrine, cult, meadow };

const scheduler = { nextStepTime: 0, step: 0, track: 'cafe' as MusicTrackId };

export function restartMusic(): void {
  const now = audioTime();
  if (now !== null) scheduler.nextStepTime = now + 0.1;
}

/** Called every frame; switches to `trackId` (from its first bar) and queues the notes due within the next quarter second. */
export function updateMusic(isEnabled: boolean, trackId: MusicTrackId): void {
  const now = audioTime();
  if (now === null || !isEnabled) return;
  if (trackId !== scheduler.track) { scheduler.track = trackId; scheduler.step = 0; }
  const track = TRACKS[scheduler.track];
  if (scheduler.nextStepTime < now) scheduler.nextStepTime = now + 0.05;
  while (scheduler.nextStepTime < now + 0.25) {
    const step = scheduler.step, beat = step % track.stepsPerBar;
    const chord = track.chords[Math.floor(step / track.stepsPerBar) % track.chords.length];
    track.playStep(step, beat, chord, scheduler.nextStepTime - now);
    scheduler.nextStepTime += track.stepSeconds;
    scheduler.step++;
  }
}
