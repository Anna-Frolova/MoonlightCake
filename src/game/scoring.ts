// How a guest judges the served cake, and how much they pay.
import { colorDistance } from '../core/color';
import { clamp } from '../core/math';
import type { Cake, CatDef, Order, ToppingId } from '../data/types';
import { fillingsBetweenLayers } from './cake';
import { glazeRgb } from './colorMixing';
import { totalToppingCount } from './orders';

export interface ScorePart {
  /** Label shown on the result card. */
  label: string;
  /** 0..1 */
  score: number;
  weight: number;
}

export interface CakeScore {
  parts: ScorePart[];
  /** Weighted total, 0..1. */
  score: number;
  /** 1..5 */
  hearts: number;
  payment: number;
  tips: number;
  ingredientCost: number;
  /** payment + tips − ingredientCost (can be negative). */
  net: number;
}

/** Relative importance of each part of the cake. */
const WEIGHTS = { shape: 12, layers: 20, filling: 15, cream: 18, glaze: 22, toppings: 18, magic: 12 };

/** Total score needed for 5, 4, 3 and 2 hearts. */
const HEART_THRESHOLDS = [0.9, 0.75, 0.55, 0.35];

/** Glaze closer than this to the ordered colour counts as perfect; it scores 0 at +90 more. */
const GLAZE_PERFECT_DISTANCE = 10;
const GLAZE_ZERO_DISTANCE_RANGE = 90;

/** Price building blocks. */
const PRICE = { base: 14, perLayer: 4, filling: 3, magic: 4, royal: 20 };
/** Tips start from this score. */
const TIPS_MIN_SCORE = 0.7;
const GENEROUS_TIP_MULTIPLIER = 1.3;

export function scoreCake(cake: Cake, order: Order, cat: CatDef, decorTipBonus: number): CakeScore {
  const layers = cake.stack.filter(item => item.kind === 'layer');
  const parts: ScorePart[] = [];

  parts.push({ label: 'Форма', score: cake.shape === order.shape ? 1 : 0, weight: WEIGHTS.shape });

  let layerScore = 0;
  if (layers.length) {
    const countScore = layers.length === order.layerCount ? 1 : clamp(1 - Math.abs(layers.length - order.layerCount) * 0.5, 0, 1);
    const flavorScore = layers.filter(layer => layer.flavor === order.flavor).length / layers.length;
    layerScore = countScore * 0.5 + flavorScore * 0.5;
  }
  parts.push({ label: 'Коржі', score: layerScore, weight: WEIGHTS.layers });

  if (order.layerCount >= 2) {
    const gaps = fillingsBetweenLayers(cake);
    const fillingScore = gaps.length ? gaps.filter(gap => gap === order.filling).length / gaps.length : 0;
    parts.push({ label: 'Начинка', score: fillingScore, weight: WEIGHTS.filling });
  }

  let creamScore = 0;
  if (cake.cream && cake.creamCoverage > 0.03) {
    const coverage = clamp((cake.creamCoverage - 0.15) / 0.7, 0, 1);
    creamScore = cake.cream === order.cream ? 0.6 + 0.4 * coverage : 0.15 + 0.35 * coverage;
  }
  parts.push({ label: 'Крем', score: creamScore, weight: WEIGHTS.cream });

  const glazeScore = cake.glaze
    ? clamp(1 - (colorDistance(cake.glaze, glazeRgb(order.glaze)) - GLAZE_PERFECT_DISTANCE) / GLAZE_ZERO_DISTANCE_RANGE, 0, 1)
    : 0;
  parts.push({ label: 'Глазур', score: glazeScore, weight: WEIGHTS.glaze });

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
  parts.push({ label: 'Прикраси', score: clamp(accuracy - extraKinds * 0.15, 0, 1), weight: WEIGHTS.toppings });

  const quality = cake.magicQuality ?? 0;
  const magicScore = !cake.element ? 0 : cake.element === order.element ? quality : quality * 0.3;
  parts.push({ label: 'Магія', score: magicScore, weight: WEIGHTS.magic });

  const totalWeight = parts.reduce((sum, p) => sum + p.weight, 0);
  const score = clamp(parts.reduce((sum, p) => sum + p.score * p.weight, 0) / totalWeight, 0, 1);
  const heartsIndex = HEART_THRESHOLDS.findIndex(threshold => score >= threshold);
  const hearts = heartsIndex === -1 ? 1 : 5 - heartsIndex;

  const price = PRICE.base + order.layerCount * PRICE.perLayer + (order.filling ? PRICE.filling : 0)
    + totalToppingCount(order) + PRICE.magic + (order.isRoyal ? PRICE.royal : 0);
  const payment = Math.round(price * (0.35 + 0.65 * score));
  const tips = score >= TIPS_MIN_SCORE
    ? Math.round(price * (0.12 + (score - TIPS_MIN_SCORE)) * (1 + decorTipBonus) * (cat.isGenerous ? GENEROUS_TIP_MULTIPLIER : 1))
    : 0;
  const ingredientCost = cake.stack.length + (cake.cream && cake.creamCoverage > 0 ? 2 : 0) + (cake.glaze ? 1 : 0) + Math.ceil(cake.toppings.length / 2);

  return { parts, score, hearts, payment, tips, ingredientCost, net: payment + tips - ingredientCost };
}
