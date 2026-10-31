// Generating guest orders. Every order follows one colour palette so its colours harmonise.
import { pickRandom, pickWeighted, randomInt } from '../core/math';
import { PALETTES } from '../data/palettes';
import { STORY_DAYS } from '../data/schedule';
import type { Cake, CatDef, GlazeColorId, Order, PaletteId, ShapeId, ToppingId } from '../data/types';
import { arrangeToppings, cakeHeight, createCake, createCreamDots, updateCreamCoverage } from './cake';
import { glazeRgb } from './colorMixing';
import { availableElements, availableGlazeColors, todaysMenu } from './state';

/** Scripted orders for the first two guests of day 1 (they teach the basics). */
const TUTORIAL_ORDERS: Record<1 | 2, Order> = {
  1: {
    palette: 'berry', shape: 'round', layerCount: 1, flavor: 'vanilla', filling: null, cream: 'butter',
    glaze: 'red', toppings: { strawberry: 3 }, element: 'fire', isRoyal: false,
  },
  2: {
    palette: 'chocolate', shape: 'square', layerCount: 2, flavor: 'chocolate', filling: 'caramel', cream: 'butter',
    glaze: 'orange', toppings: { pearl: 5 }, element: 'ice', isRoyal: false,
  },
};

/** Chance that a guest picks one of their favourite palettes / shapes when available. */
const FAVORITE_PALETTE_CHANCE = 0.9;
const FAVORITE_SHAPE_CHANCE = 0.85;
/** Chance of a single topping kind (otherwise two) after day 1. */
const SINGLE_TOPPING_KIND_CHANCE = 0.55;
/** Weights by position in a palette list: the first items are the palette's signature ones. */
const SIGNATURE_WEIGHTS = [3, 2, 1, 1];

/**
 * Picks an item from the palette's `list` that is also `available` today, favouring the
 * palette's signature (first) items. Falls back to any available item.
 */
function pickFromPalette<T>(list: readonly T[], available: readonly T[]): T {
  const candidates = list.filter(item => available.includes(item));
  if (!candidates.length) return pickRandom(available);
  return pickWeighted(candidates, candidates.map(item => SIGNATURE_WEIGHTS[list.indexOf(item)] ?? 1));
}

function pickPreferring<T>(items: readonly T[], favorites: readonly T[], chance: number): T {
  const liked = items.filter(item => favorites.includes(item));
  return liked.length && Math.random() < chance ? pickRandom(liked) : pickRandom(items);
}

/** Palettes that today's menu can actually satisfy (at least one flavour, glaze colour and topping). */
function viablePalettes(): PaletteId[] {
  const menu = todaysMenu();
  const glazes = availableGlazeColors().map(color => color.id);
  return (Object.keys(PALETTES) as PaletteId[]).filter(id => {
    const palette = PALETTES[id];
    return palette.flavors.some(f => menu.flavors.includes(f))
      && palette.glazes.some(g => glazes.includes(g))
      && palette.toppings.some(t => menu.toppings.includes(t));
  });
}

/** A picky guest's allowed glaze colours and shapes that can be made today (empty = no such rule). */
function ruleOptions(cat: CatDef): { glazes: GlazeColorId[]; shapes: ShapeId[] } {
  const glazes = availableGlazeColors().map(color => color.id), shapes = todaysMenu().shapes;
  return {
    glazes: cat.orderRule?.glazes?.filter(id => glazes.includes(id)) ?? [],
    shapes: cat.orderRule?.shapes?.filter(id => shapes.includes(id)) ?? [],
  };
}

/** Can today's menu and essences make this guest's kind of cake? Always true for non-picky guests. */
export function canTakeOrder(cat: CatDef): boolean {
  const rule = cat.orderRule, options = ruleOptions(cat);
  return !rule || ((!rule.glazes || options.glazes.length > 0) && (!rule.shapes || options.shapes.length > 0));
}

export function generateOrder(cat: CatDef, day: number, tutorial?: 1 | 2): Order {
  if (tutorial) return structuredClone(TUTORIAL_ORDERS[tutorial]);
  const storyDay = Math.min(day, STORY_DAYS);
  const menu = todaysMenu();
  const isRoyal = cat.id === 'queen';
  const rule = ruleOptions(cat);

  // a picky guest's palette must contain one of their colours, so the rest of the cake matches it
  const viable = viablePalettes();
  const matching = rule.glazes.length ? viable.filter(id => PALETTES[id].glazes.some(g => rule.glazes.includes(g))) : viable;
  const candidates = matching.length ? matching : viable;
  const favorites = candidates.filter(id => cat.favoritePalettes.includes(id));
  const paletteId: PaletteId = favorites.length && Math.random() < FAVORITE_PALETTE_CHANCE
    ? pickRandom(favorites)
    : candidates.length ? pickRandom(candidates) : 'berry';
  const palette = PALETTES[paletteId];

  let layerCount = storyDay === 1 ? randomInt(1, 2) : randomInt(1, 3);
  if ((cat.ordersBigCakes && storyDay >= 2) || isRoyal) layerCount = 3;

  // toppings: one kind on day 1, then one or two kinds
  const paletteToppings = palette.toppings.filter(t => menu.toppings.includes(t));
  const toppingSource = paletteToppings.length ? paletteToppings : menu.toppings;
  const kindCount = Math.min(storyDay === 1 ? 1 : Math.random() < SINGLE_TOPPING_KIND_CHANCE ? 1 : 2, toppingSource.length);
  const kinds: ToppingId[] = [];
  while (kinds.length < kindCount) {
    kinds.push(pickFromPalette(palette.toppings.filter(t => !kinds.includes(t)), menu.toppings.filter(t => !kinds.includes(t))));
  }
  const maxPerKind = storyDay === 1 ? 4 : kindCount === 2 ? 4 : 6;
  const toppings: Order['toppings'] = {};
  for (const kind of kinds) toppings[kind] = randomInt(2, maxPerKind);

  return {
    palette: paletteId,
    shape: rule.shapes.length ? pickRandom(rule.shapes) : pickPreferring(menu.shapes, cat.favoriteShapes, FAVORITE_SHAPE_CHANCE),
    layerCount,
    flavor: pickFromPalette(palette.flavors, menu.flavors),
    filling: layerCount >= 2 ? pickFromPalette(palette.fillings, menu.fillings) : null,
    cream: pickFromPalette(palette.creams, menu.creams),
    glaze: pickFromPalette(palette.glazes, rule.glazes.length ? rule.glazes : availableGlazeColors().map(color => color.id)),
    toppings,
    element: pickFromPalette(palette.elements, availableElements()),
    isRoyal,
  };
}

/** The finished cake the guest wants — drawn as the order picture. */
export function buildOrderPicture(order: Order): Cake {
  const cake = createCake(order.shape);
  cake.seed = 11;
  for (let i = 0; i < order.layerCount; i++) {
    cake.stack.push({ kind: 'layer', flavor: order.flavor });
    if (i < order.layerCount - 1 && order.filling) cake.stack.push({ kind: 'filling', filling: order.filling });
  }
  cake.cream = order.cream;
  createCreamDots(cake);
  cake.creamDots!.forEach(dot => { dot.isPiped = true; });
  updateCreamCoverage(cake);
  cake.glaze = glazeRgb(order.glaze);
  cake.toppings = arrangeToppings(order.shape, order.toppings, cakeHeight(cake));
  cake.magicQuality = 1;
  cake.element = order.element;
  return cake;
}

export const totalToppingCount = (order: Order): number =>
  Object.values(order.toppings).reduce((sum, n) => sum + (n ?? 0), 0);
