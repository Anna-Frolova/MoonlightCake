// Background music: a mysterious music-box melody over a soft pad, scheduled slightly ahead of time.
import { audioTime, playTone } from './engine';

const STEP_SECONDS = 0.36;
const STEPS_PER_BAR = 8;
/** Four chords (MIDI notes), one per bar: Am – F – G – Em. */
const CHORDS = [[57, 60, 64, 67], [53, 57, 60, 64], [55, 59, 62, 66], [52, 55, 59, 62]];
const MELODY = [76, 72, 69, 72, 76, 79, 77, 76, 72, 69, 65, 69, 72, 74, 72, 69, 74, 71, 67, 71, 74, 76, 74, 71, 71, 68, 64, 68, 71, 72, 71, 68];
const midiToHz = (note: number) => 440 * Math.pow(2, (note - 69) / 12);

const scheduler = { nextStepTime: 0, step: 0 };

export function restartMusic(): void {
  const now = audioTime();
  if (now !== null) scheduler.nextStepTime = now + 0.1;
}

/** Called every frame; queues the notes due within the next quarter second. */
export function updateMusic(isEnabled: boolean): void {
  const now = audioTime();
  if (now === null || !isEnabled) return;
  if (scheduler.nextStepTime < now) scheduler.nextStepTime = now + 0.05;
  while (scheduler.nextStepTime < now + 0.25) {
    const step = scheduler.step, delay = scheduler.nextStepTime - now;
    const bar = Math.floor(step / STEPS_PER_BAR) % CHORDS.length, beat = step % STEPS_PER_BAR;
    // melody: every other step for sure, sometimes the ones in between
    if (beat % 2 === 0 || Math.random() < 0.4) {
      const note = MELODY[step % MELODY.length];
      playTone(midiToHz(note), 1.2, { volume: 0.03, delay, bus: 'music', reverb: 0.55, attack: 0.004 });
      playTone(midiToHz(note + 12), 0.5, { volume: 0.01, delay, bus: 'music', reverb: 0.6, attack: 0.003 });
    }
    // bass + slow pad at the start of each bar
    if (beat === 0) {
      playTone(midiToHz(CHORDS[bar][0] - 12), 3.0, { volume: 0.045, delay, bus: 'music', reverb: 0.3, attack: 0.3 });
      for (const note of CHORDS[bar]) {
        playTone(midiToHz(note), 3.2, { wave: 'triangle', volume: 0.012, delay, bus: 'music', reverb: 0.7, attack: 0.9 });
        playTone(midiToHz(note) * 1.004, 3.2, { wave: 'triangle', volume: 0.008, delay, bus: 'music', reverb: 0.7, attack: 0.9 });
      }
    }
    scheduler.nextStepTime += STEP_SECONDS;
    scheduler.step++;
  }
}
