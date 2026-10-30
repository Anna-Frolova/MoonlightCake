// Small math helpers used everywhere.

export const randomRange = (min: number, max: number): number => min + Math.random() * (max - min);
/** Random integer in [min, max] (both inclusive). */
export const randomInt = (min: number, max: number): number => Math.floor(randomRange(min, max + 1));
export const pickRandom = <T>(items: readonly T[]): T => items[Math.floor(Math.random() * items.length)];
export const clamp = (value: number, min: number, max: number): number => (value < min ? min : value > max ? max : value);
export const lerp = (from: number, to: number, t: number): number => from + (to - from) * t;

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - clamp(t, 0, 1), 3);
/** Overshoots slightly past 1 before settling — gives a springy "pop". */
export const easeOutBack = (t: number): number => {
  t = clamp(t, 0, 1);
  const overshoot = 1.70158;
  return 1 + (overshoot + 1) * Math.pow(t - 1, 3) + overshoot * Math.pow(t - 1, 2);
};

/** Deterministic pseudo-random generator (mulberry32): the same seed always gives the same sequence. */
export function seededRandom(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Picks from `items` using the matching `weights` (higher weight = more likely). */
export function pickWeighted<T>(items: readonly T[], weights: readonly number[]): T {
  const total = weights.reduce((sum, w) => sum + w, 0);
  let roll = Math.random() * total;
  for (let i = 0; i < items.length; i++) {
    roll -= weights[i];
    if (roll <= 0) return items[i];
  }
  return items[0];
}

export type Point = { x: number; y: number };
/** A point as a tuple — used for polygon outlines and drawn strokes. */
export type Vec2 = [number, number];
