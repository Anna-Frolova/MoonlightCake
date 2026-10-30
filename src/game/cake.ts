// The cake being built: layers, cream, glaze, toppings and magic. Pure data + rules, no drawing.
import type { Cake, CreamDot, FillingId, PlacedTopping, ShapeId, ToppingId } from '../data/types';
import { FILLING_HEIGHT, getShapeGeometry, LAYER_HEIGHT, resampleOutline, TOP_FACE_SQUASH } from './cakeGeometry';

export const MAX_LAYERS = 3;
export const MAX_TOPPINGS = 16;
export const MAX_CAULDRON_DROPS = 10;
/** Cream coverage that counts as "done" for the station tab and the serve check. */
export const CREAM_DONE_COVERAGE = 0.85;
/** Above this the beads become fancy rosettes. */
export const CREAM_FULL_COVERAGE = 0.9;

export function createCake(shape: ShapeId = 'round'): Cake {
  return {
    shape, stack: [], cream: null, creamDots: null, creamCoverage: 0, creamCompleted: false,
    glaze: null, glazeProgress: 1, cauldron: { red: 0, yellow: 0, blue: 0, white: 0, dark: 0 },
    toppings: [], magicQuality: null, element: null, magicCastTime: -99,
    seed: (Math.random() * 1e9) | 0,
  };
}

export const countLayers = (cake: Cake): number => cake.stack.filter(item => item.kind === 'layer').length;

export const cakeHeight = (cake: Cake): number =>
  cake.stack.reduce((height, item) => height + (item.kind === 'layer' ? LAYER_HEIGHT : FILLING_HEIGHT), 0);

/** Once decorating has started, layers and shape can no longer change. */
export const isStackLocked = (cake: Cake): boolean => cake.creamCoverage > 0 || !!cake.glaze || cake.toppings.length > 0;

/** The filling in each gap between two layers (null if a gap has no filling). */
export function fillingsBetweenLayers(cake: Cake): (FillingId | null)[] {
  const gaps: (FillingId | null)[] = [];
  let seenLayer = false;
  let current: FillingId | null = null;
  for (const item of cake.stack) {
    if (item.kind === 'layer') {
      if (seenLayer) gaps.push(current);
      seenLayer = true;
      current = null;
    } else current = item.filling;
  }
  return gaps;
}

/**
 * Bead positions for piped cream: a ring along the top edge and the front half of the base.
 * Coordinates are relative to the bottom-centre of the cake.
 */
export function createCreamDots(cake: Cake): void {
  const geometry = getShapeGeometry(cake.shape);
  const height = cakeHeight(cake);
  const dots: CreamDot[] = [];
  for (const [x, z] of resampleOutline(geometry.outline, 34)) {
    dots.push({ x: x * 0.96, y: -height + z * TOP_FACE_SQUASH * 0.96, ring: 'top', isPiped: false });
  }
  for (const [x, z] of resampleOutline(geometry.outline, 40)) {
    if (z > -30) dots.push({ x, y: z * TOP_FACE_SQUASH + 3, ring: 'base', isPiped: false });
  }
  cake.creamDots = dots;
}

export function updateCreamCoverage(cake: Cake): void {
  cake.creamCoverage = cake.creamDots ? cake.creamDots.filter(d => d.isPiped).length / cake.creamDots.length : 0;
}

/**
 * Lays out ordered toppings nicely: a ring on top and — when the cake height is known and there
 * are enough toppings — half of them along the middle of the front side.
 * Positions are relative to the centre of the top face.
 */
export function arrangeToppings(shape: ShapeId, counts: Partial<Record<ToppingId, number>>, height = 0): PlacedTopping[] {
  // interleave the kinds: a, b, a, b, …
  const kinds = Object.keys(counts) as ToppingId[];
  const most = Math.max(...kinds.map(k => counts[k] ?? 0));
  const list: ToppingId[] = [];
  for (let i = 0; i < most; i++) for (const kind of kinds) if (i < (counts[kind] ?? 0)) list.push(kind);

  const geometry = getShapeGeometry(shape);
  const sideCount = height > 0 && list.length > 3 ? Math.floor(list.length / 2) : 0;
  const topCount = list.length - sideCount;
  const topRing = resampleOutline(geometry.outline, topCount);
  const frontSide = geometry.frontRim.slice().sort((a, b) => a[0] - b[0]);

  return list.map((topping, i) => {
    if (i < topCount) {
      const [x, z] = topRing[i];
      const ringScale = topCount > 7 && i % 2 ? 0.3 : 0.58; // many toppings: alternate inner/outer ring
      return { topping, x: x * ringScale, y: z * TOP_FACE_SQUASH * ringScale };
    }
    const sideIndex = i - topCount;
    const [x, z] = frontSide[Math.round(((sideIndex + 0.5) / sideCount) * (frontSide.length - 1))];
    return { topping, x: x * 0.92, y: z * TOP_FACE_SQUASH * 0.92 + height * 0.5 + 8 };
  });
}
