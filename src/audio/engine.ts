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
  if (graph) { if (graph.context.state === 'suspended') void graph.context.resume(); return; }
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

/** A synthesised "meow": a sawtooth glide through a moving band-pass filter. */
export function playMeow(pitch: number, mood: 'neutral' | 'happy' | 'sad'): void {
  if (!graph) return;
  const { context } = graph;
  const start = context.currentTime;
  const oscillator = context.createOscillator(), filter = context.createBiquadFilter(), envelope = context.createGain();
  oscillator.type = 'sawtooth'; filter.type = 'bandpass'; filter.Q.value = 3;
  const base = 480 * pitch;
  if (mood === 'sad') {
    oscillator.frequency.setValueAtTime(base * 1.2, start);
    oscillator.frequency.linearRampToValueAtTime(base * 0.7, start + 0.55);
  } else {
    oscillator.frequency.setValueAtTime(base, start);
    oscillator.frequency.linearRampToValueAtTime(base * (mood === 'happy' ? 1.7 : 1.45), start + 0.13);
    oscillator.frequency.linearRampToValueAtTime(base * 0.85, start + 0.45);
  }
  filter.frequency.setValueAtTime(900, start);
  filter.frequency.linearRampToValueAtTime(1800, start + 0.15);
  filter.frequency.linearRampToValueAtTime(800, start + 0.5);
  envelope.gain.setValueAtTime(0.0001, start);
  envelope.gain.exponentialRampToValueAtTime(0.16, start + 0.04);
  envelope.gain.exponentialRampToValueAtTime(0.0001, start + 0.55);
  const send = context.createGain(); send.gain.value = 0.2;
  oscillator.connect(filter); filter.connect(envelope);
  envelope.connect(graph.sfxDry); envelope.connect(send); send.connect(graph.sfxWet);
  oscillator.start(start); oscillator.stop(start + 0.6);
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
