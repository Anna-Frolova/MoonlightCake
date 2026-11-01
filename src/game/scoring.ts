// How a guest judges the served cake, and how much they pay.
import { colorDistance } from '../core/color';
import { clamp } from '../core/math';
import type { Cake, CatDef, Order, ToppingId } from '../data/types';
import { fillingsBetweenLayers } from './cake';
import { glazeRgb } from './colorMixing';
import { totalToppingCount } from './orders';

export interface ScorePart {
  /** Which part of the cake; its label comes from `t().scoreParts`. */
  kind: keyof typeof WEIGHTS;
  /** 0..1 */
  score: number;
  weight: number;
}

/**
 * Whether the guest pays: `paid` as usual; `refused` — more than half of the cake is wrong (or missing),
 * so the player gets nothing; `penalty` — the cake is ruined (at most one part right), the player pays a fine.
 */
export type PayVerdict = 'paid' | 'refused' | 'penalty';

export interface CakeScore {
  parts: ScorePart[];
  verdict: PayVerdict;
  /** Coins taken as a fine (only for `penalty`). */
  penalty: number;
  /** Weighted total, 0..1. */
  score: number;
  /** 1..5 */
  hearts: number;
  payment: number;
  tips: number;
  ingredientCost: number;
  /** payment + tips − ingredientCost − penalty (can be negative). */
  net: number;
}

/** Relative importance of each part of the cake. `speed` (how long the guest waited) is big enough that a perfect but very late cake gets 4 hearts. */
const WEIGHTS = { shape: 12, layers: 20, filling: 15, cream: 18, glaze: 22, toppings: 18, magic: 12, speed: 20 };

/** Total score needed for 5, 4, 3 and 2 hearts. */
const HEART_THRESHOLDS = [0.9, 0.75, 0.55, 0.35];

/** Glaze closer than this to the ordered colour counts as perfect; it scores 0 at +90 more. */
const GLAZE_PERFECT_DISTANCE = 10;
const GLAZE_ZERO_DISTANCE_RANGE = 90;

/** A part of the cake (shape, layers, cream…) counts as done right from this score. */
const PART_RIGHT_SCORE = 0.6;
/** With this many right parts or fewer the cake is ruined and the player is fined RUINED_CAKE_FINE coins. */
const RUINED_CAKE_MAX_RIGHT_PARTS = 1;
const RUINED_CAKE_FINE = 10;
/** Hearts are capped to match: a guest who doesn't pay gives at most 2, a ruined cake gets 1. */
const MAX_HEARTS = { refused: 2, penalty: 1 };

/** Score of the magic part when the cake has an element, but not the ordered one. */
const WRONG_MAGIC_SCORE = 0.3;

/** Price building blocks. */
const PRICE = { base: 14, perLayer: 4, filling: 3, magic: 4, royal: 20, special: 12 };
/** Tips start from this score. */
const TIPS_MIN_SCORE = 0.7;
const GENEROUS_TIP_MULTIPLIER = 1.3;

/** `patienceLeft` is 1..0 when the guest was timed, null when they were in no hurry (no speed part then). */
export function scoreCake(cake: Cake, order: Order, cat: CatDef, decorTipBonus: number, patienceLeft: number | null): CakeScore {
  const layers = cake.stack.filter(item => item.kind === 'layer');
  const parts: ScorePart[] = [];

  parts.push({ kind: 'shape', score: cake.shape === order.shape ? 1 : 0, weight: WEIGHTS.shape });

  let layerScore = 0;
  if (layers.length) {
    const countScore = layers.length === order.layerCount ? 1 : clamp(1 - Math.abs(layers.length - order.layerCount) * 0.5, 0, 1);
    const flavorScore = layers.filter(layer => layer.flavor === order.flavor).length / layers.length;
    layerScore = countScore * 0.5 + flavorScore * 0.5;
  }
  parts.push({ kind: 'layers', score: layerScore, weight: WEIGHTS.layers });

  if (order.layerCount >= 2) {
    const gaps = fillingsBetweenLayers(cake);
    const fillingScore = gaps.length ? gaps.filter(gap => gap === order.filling).length / gaps.length : 0;
    parts.push({ kind: 'filling', score: fillingScore, weight: WEIGHTS.filling });
  }

  let creamScore = 0;
  if (cake.cream && cake.creamCoverage > 0.03) {
    const coverage = clamp((cake.creamCoverage - 0.15) / 0.7, 0, 1);
    creamScore = cake.cream === order.cream ? 0.6 + 0.4 * coverage : 0.15 + 0.35 * coverage;
  }
  parts.push({ kind: 'cream', score: creamScore, weight: WEIGHTS.cream });

  const glazeScore = cake.glaze
    ? clamp(1 - (colorDistance(cake.glaze, glazeRgb(order.glaze)) - GLAZE_PERFECT_DISTANCE) / GLAZE_ZERO_DISTANCE_RANGE, 0, 1)
    : 0;
  parts.push({ kind: 'glaze', score: glazeScore, weight: WEIGHTS.glaze });

  // toppings: how close each ordered count is, minus a penalty per unwanted kind
  const placed: Partial<Record<ToppingId, number>> = {};
  for (const t of cake.toppings) placed[t.topping] = (placed[t.topping] ?? 0) + 1;
  const orderedKinds = Object.keys(order.toppings) as ToppingId[];
  let accuracy = 0;
  for (const kind of orderedKinds) {
    const wanted = order.toppings[kind] ?? 0, got = placed[kind] ?? 0;
    accuracy += clamp(1 - Math.abs(got - wanted) / Math.max(wanted, 2), 0, 1);
  }
  accuracy /= orderedKinds.length;
  const extraKinds = (Object.keys(placed) as ToppingId[]).filter(kind => !order.toppings[kind]).length;
  parts.push({ kind: 'toppings', score: clamp(accuracy - extraKinds * 0.15, 0, 1), weight: WEIGHTS.toppings });

  // how neatly the sign was drawn doesn't matter: the right magic is perfect, the wrong one barely counts
  const magicScore = !cake.element ? 0 : cake.element === order.element ? 1 : WRONG_MAGIC_SCORE;
  parts.push({ kind: 'magic', score: magicScore, weight: WEIGHTS.magic });

  if (patienceLeft !== null) parts.push({ kind: 'speed', score: patienceLeft, weight: WEIGHTS.speed });

  const totalWeight = parts.reduce((sum, p) => sum + p.weight, 0);
  const score = clamp(parts.reduce((sum, p) => sum + p.score * p.weight, 0) / totalWeight, 0, 1);
  const heartsIndex = HEART_THRESHOLDS.findIndex(threshold => score >= threshold);
  const hearts = heartsIndex === -1 ? 1 : 5 - heartsIndex;

  const price = PRICE.base + order.layerCount * PRICE.perLayer + (order.filling ? PRICE.filling : 0)
    + totalToppingCount(order) + PRICE.magic + (order.isRoyal ? PRICE.royal : 0) + (order.isSpecial ? PRICE.special : 0);
  const payment = Math.round(price * (0.35 + 0.65 * score));
  const tips = score >= TIPS_MIN_SCORE
    ? Math.round(price * (0.12 + (score - TIPS_MIN_SCORE)) * (1 + decorTipBonus) * (cat.isGenerous ? GENEROUS_TIP_MULTIPLIER : 1))
    : 0;
  const ingredientCost = cake.stack.length + (cake.cream && cake.creamCoverage > 0 ? 2 : 0) + (cake.glaze ? 1 : 0) + Math.ceil(cake.toppings.length / 2);

  // a cake that is mostly wrong earns nothing; a ruined one costs a fine
  const cakeParts = parts.filter(part => part.kind !== 'speed');
  const rightParts = cakeParts.filter(part => part.score >= PART_RIGHT_SCORE).length;
  const verdict: PayVerdict = rightParts <= RUINED_CAKE_MAX_RIGHT_PARTS ? 'penalty' : rightParts < cakeParts.length / 2 ? 'refused' : 'paid';
  if (verdict !== 'paid') {
    const penalty = verdict === 'penalty' ? RUINED_CAKE_FINE : 0;
    return { parts, verdict, penalty, score, hearts: Math.min(hearts, MAX_HEARTS[verdict]), payment: 0, tips: 0, ingredientCost: 0, net: -penalty };
  }
  return { parts, verdict, penalty: 0, score, hearts, payment, tips, ingredientCost, net: payment + tips - ingredientCost };
}
