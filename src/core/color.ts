import { clamp, lerp } from './math';

/** Colour as [red, green, blue], each 0..255. */
export type Rgb = [number, number, number];

export function hexToRgb(hex: string): Rgb {
  const h = hex.replace('#', '');
  return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}

export function rgbToHex(rgb: Rgb): string {
  return '#' + rgb.map(v => clamp(Math.round(v), 0, 255).toString(16).padStart(2, '0')).join('');
}

export function mixRgb(a: Rgb, b: Rgb, t: number): Rgb {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)];
}

/** Dark violet used instead of black when darkening, so shadows stay in the magical palette. */
const SHADOW_TINT: Rgb = [18, 8, 48];
const WHITE: Rgb = [255, 255, 255];
const shadeCache = new Map<string, string>();

/**
 * Lightens (amount > 0, towards white) or darkens (amount < 0, towards violet) a hex colour.
 * Called many times per frame, so results are cached.
 */
export function shade(hex: string, amount: number): string {
  const key = hex + amount;
  const cached = shadeCache.get(key);
  if (cached) return cached;
  const rgb = hexToRgb(hex);
  const result = rgbToHex(amount > 0 ? mixRgb(rgb, WHITE, amount) : mixRgb(rgb, SHADOW_TINT, -amount));
  if (shadeCache.size > 4000) shadeCache.clear();
  shadeCache.set(key, result);
  return result;
}

export function withAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex);
  return `rgba(${r},${g},${b},${alpha})`;
}

/**
 * Perceptual-ish distance between two colours ("redmean" formula), scaled to roughly 0..220.
 * Used to judge how close the glaze is to the ordered colour.
 */
export function colorDistance(a: Rgb, b: Rgb): number {
  const redMean = (a[0] + b[0]) / 2;
  const dr = a[0] - b[0], dg = a[1] - b[1], db = a[2] - b[2];
  return Math.sqrt((2 + redMean / 256) * dr * dr + 4 * dg * dg + (2 + (255 - redMean) / 256) * db * db) / 3;
}
