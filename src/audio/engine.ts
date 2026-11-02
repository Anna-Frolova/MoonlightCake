// Tiny synthesiser on top of the Web Audio API. All sounds are generated in code — no audio files.
// Two buses (effects and music), each with a "dry" output and a "wet" send into a shared hall reverb.

type Bus = 'sfx' | 'music';

interface AudioGraph {
  context: AudioContext;
  sfxDry: GainNode; sfxWet: GainNode;
  musicDry: GainNode; musicWet: GainNode;
  noiseBuffer: AudioBuffer;
}

let graph: AudioGraph | null = null;
const enabled = { sfx: true, music: true };

/** Browsers only allow audio after a user gesture, so this is called on the first click/tap. */
export function initAudio(): void {
  // iOS leaves the context 'interrupted' after a call or a trip to the home screen; a tap revives it
  if (graph) { if (graph.context.state !== 'running' && !document.hidden) void graph.context.resume(); return; }
  try {
    const AudioCtor = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    const context = new AudioCtor();
    const master = context.createGain(); master.gain.value = 0.7; master.connect(context.destination);

    // Reverb: a convolver fed with a decaying noise "impulse".
    const reverb = context.createConvolver();
    const length = Math.floor(context.sampleRate * 2.6);
    const impulse = context.createBuffer(2, length, context.sampleRate);
    for (let channel = 0; channel < 2; channel++) {
      const data = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 3.2);
    }
    reverb.buffer = impulse;
    const reverbOut = context.createGain(); reverbOut.gain.value = 0.55;
    reverb.connect(reverbOut); reverbOut.connect(master);

    const makeGain = (target: AudioNode) => { const g = context.createGain(); g.connect(target); return g; };
    const noiseLength = context.sampleRate * 0.6;
    const noiseBuffer = context.createBuffer(1, noiseLength, context.sampleRate);
    const noiseData = noiseBuffer.getChannelData(0);
    for (let i = 0; i < noiseLength; i++) noiseData[i] = Math.random() * 2 - 1;

    graph = {
      context,
      sfxDry: makeGain(master), sfxWet: makeGain(reverb),
      musicDry: makeGain(master), musicWet: makeGain(reverb),
      noiseBuffer,
    };
    applyVolumes();
  } catch {
    graph = null;
  }
}

function applyVolumes(): void {
  if (!graph) return;
  graph.sfxDry.gain.value = graph.sfxWet.gain.value = enabled.sfx ? 1 : 0;
  graph.musicDry.gain.value = graph.musicWet.gain.value = enabled.music ? 1 : 0;
}

export function setBusEnabled(bus: Bus, on: boolean): void {
  enabled[bus] = on;
  applyVolumes();
}

/** Silences everything while the game is hidden (app minimised, screen locked, another tab). */
export function setAudioPaused(paused: boolean): void {
  if (!graph) return;
  if (paused) void graph.context.suspend();
  else void graph.context.resume().catch(() => { /* not allowed without a gesture: the next tap resumes it */ });
}

export function audioTime(): number | null {
  return graph ? graph.context.currentTime : null;
}

export interface ToneOptions {
  wave?: OscillatorType;
  volume?: number;
  /** Pitch glides to this frequency. */
  slideTo?: number;
  delay?: number;
  bus?: Bus;
  /** Share of the sound sent to the reverb (0..1). */
  reverb?: number;
  attack?: number;
}

export function playTone(frequency: number, duration: number, options: ToneOptions = {}): void {
  if (!graph) return;
  const { wave = 'sine', volume = 0.2, slideTo, delay = 0, bus = 'sfx', reverb = 0.25, attack = 0.008 } = options;
  const { context } = graph;
  const start = context.currentTime + delay;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = wave;
  oscillator.frequency.setValueAtTime(frequency, start);
  if (slideTo) oscillator.frequency.exponentialRampToValueAtTime(slideTo, start + duration * 0.8);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(volume, start + attack);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  oscillator.connect(envelope);
  envelope.connect(bus === 'music' ? graph.musicDry : graph.sfxDry);
  if (reverb > 0) {
    const send = context.createGain(); send.gain.value = reverb;
    envelope.connect(send); send.connect(bus === 'music' ? graph.musicWet : graph.sfxWet);
  }
  oscillator.start(start);
  oscillator.stop(start + duration + 0.05);
}

export interface NoiseOptions {
  delay?: number;
  /** Filter resonance. */
  q?: number;
  /** Filter frequency glides to this value. */
  sweepTo?: number;
  reverb?: number;
  filter?: BiquadFilterType;
}

/** Filtered white noise — whooshes, pours, crackles. */
export function playNoise(duration: number, volume: number, filterFrequency: number, options: NoiseOptions = {}): void {
  if (!graph) return;
  const { delay = 0, q = 1, sweepTo, reverb = 0.15, filter = 'bandpass' } = options;
  const { context } = graph;
  const start = context.currentTime + delay;
  const source = context.createBufferSource(); source.buffer = graph.noiseBuffer;
  const biquad = context.createBiquadFilter();
  biquad.type = filter;
  biquad.frequency.setValueAtTime(filterFrequency, start);
  biquad.Q.value = q;
  if (sweepTo) biquad.frequency.exponentialRampToValueAtTime(sweepTo, start + duration);
  const envelope = context.createGain();
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(volume, start + 0.02);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + duration);
  source.connect(biquad); biquad.connect(envelope); envelope.connect(graph.sfxDry);
  if (reverb > 0) { const send = context.createGain(); send.gain.value = reverb; envelope.connect(send); send.connect(graph.sfxWet); }
  source.start(start);
  source.stop(start + duration + 0.05);
}

/**
 * Cat sounds: `neutral` / `happy` / `sad` meows; `chirp` — a short bright "mrrp!" rising twice (the guest
 * likes what the player just did); `grumble` — a low "mrrm…" sliding down with a growl (they don't).
 */
export type MeowMood = 'neutral' | 'happy' | 'sad' | 'chirp' | 'grumble';
export type MeowVoice = 'female' | 'male';

/**
 * Pitch glide of each sound as [seconds, share of the base pitch] points, its length,
 * and how deep its "rrr" trill is (loudness wobbling GROWL_HZ times a second).
 */
const MEOW_SHAPES: Record<MeowMood, { glide: [number, number][]; duration: number; trill: number }> = {
  neutral: { glide: [[0, 1], [0.13, 1.45], [0.45, 0.85]], duration: 0.55, trill: 0 },
  happy: { glide: [[0, 1], [0.13, 1.7], [0.45, 0.85]], duration: 0.55, trill: 0 },
  sad: { glide: [[0, 1.2], [0.55, 0.7]], duration: 0.55, trill: 0 },
  chirp: { glide: [[0, 0.95], [0.07, 1.45], [0.11, 1.15], [0.2, 1.85]], duration: 0.26, trill: 0.35 },
  grumble: { glide: [[0, 0.72], [0.1, 0.8], [0.5, 0.5]], duration: 0.6, trill: 0.7 },
};
const GROWL_HZ = 26;
/**
 * A she-cat's voice sits higher with a brighter "mouth" (the band-pass filter) and a light vibrato;
 * a tom's is lower and darker. Without a voice (the helper kitten) the pitch is used as is.
 */
const VOICE_COLOR: Record<MeowVoice, { pitch: number; formant: number; vibratoCents: number }> = {
  female: { pitch: 1.12, formant: 1.25, vibratoCents: 35 },
  male: { pitch: 0.8, formant: 0.75, vibratoCents: 0 },
};
const NO_VOICE_COLOR = { pitch: 1, formant: 1, vibratoCents: 0 };
const VIBRATO_HZ = 7;

/** A synthesised cat sound: a sawtooth glide through a moving band-pass filter (the "mouth"). */
export function playMeow(pitch: number, mood: MeowMood, voice?: MeowVoice): void {
  if (!graph) return;
  const { context } = graph;
  const start = context.currentTime, shape = MEOW_SHAPES[mood], color = voice ? VOICE_COLOR[voice] : NO_VOICE_COLOR;
  const end = start + shape.duration;
  const oscillator = context.createOscillator(), filter = context.createBiquadFilter(), envelope = context.createGain();
  oscillator.type = 'sawtooth'; filter.type = 'bandpass'; filter.Q.value = 3;
  const base = 480 * pitch * color.pitch;
  shape.glide.forEach(([time, share], i) => {
    if (i === 0) oscillator.frequency.setValueAtTime(base * share, start);
    else oscillator.frequency.linearRampToValueAtTime(base * share, start + time);
  });
  const formant = color.formant * (mood === 'grumble' ? 0.7 : 1);
  filter.frequency.setValueAtTime(900 * formant, start);
  filter.frequency.linearRampToValueAtTime(1800 * formant, start + shape.duration * 0.28);
  filter.frequency.linearRampToValueAtTime(800 * formant, end - 0.05);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(0.16, start + 0.03);
  envelope.gain.exponentialRampToValueAtTime(0.0001, end);
  let output: AudioNode = envelope;
  const extras: OscillatorNode[] = [];
  if (shape.trill > 0) { // the "rrr": loudness wobbling fast
    const trill = context.createGain(), lfo = context.createOscillator(), depth = context.createGain();
    trill.gain.value = 1 - shape.trill / 2; lfo.frequency.value = GROWL_HZ; depth.gain.value = shape.trill / 2;
    lfo.connect(depth); depth.connect(trill.gain); envelope.connect(trill);
    output = trill; extras.push(lfo);
  }
  if (color.vibratoCents > 0) {
    const lfo = context.createOscillator(), depth = context.createGain();
    lfo.frequency.value = VIBRATO_HZ; depth.gain.value = color.vibratoCents;
    lfo.connect(depth); depth.connect(oscillator.detune); extras.push(lfo);
  }
  const send = context.createGain(); send.gain.value = 0.2;
  oscillator.connect(filter); filter.connect(envelope);
  output.connect(graph.sfxDry); output.connect(send); send.connect(graph.sfxWet);
  for (const node of [oscillator, ...extras]) { node.start(start); node.stop(end + 0.05); }
}

/**
 * A cat's purr: a low buzzing tone through a low-pass filter, its loudness throbbing ~25 times a second,
 * in slow "breaths" (louder on the inhale). `pitch` follows the cat's voice.
 */
export function playPurr(pitch: number, duration: number, delay = 0): void {
  if (!graph) return;
  const { context } = graph;
  const start = context.currentTime + delay;
  const voice = context.createOscillator(), filter = context.createBiquadFilter(), envelope = context.createGain();
  voice.type = 'sawtooth'; voice.frequency.value = 42 * pitch;
  filter.type = 'lowpass'; filter.frequency.value = 380; filter.Q.value = 2;
  const throb = context.createOscillator(), throbDepth = context.createGain(), throbbing = context.createGain();
  throb.frequency.value = 24; throbDepth.gain.value = 0.5; throbbing.gain.value = 0.5;
  throb.connect(throbDepth); throbDepth.connect(throbbing.gain);
  envelope.gain.setValueAtTime(0.0001, start);
  const breath = 0.9; // seconds per breath
  for (let t = 0; t < duration; t += breath) {
    envelope.gain.linearRampToValueAtTime(0.22, start + t + breath * 0.4);
    envelope.gain.linearRampToValueAtTime(0.08, start + t + breath * 0.95);
  }
  envelope.gain.linearRampToValueAtTime(0.0001, start + duration + 0.2);
  voice.connect(filter); filter.connect(throbbing); throbbing.connect(envelope); envelope.connect(graph.sfxDry);
  voice.start(start); throb.start(start);
  voice.stop(start + duration + 0.3); throb.stop(start + duration + 0.3);
}
