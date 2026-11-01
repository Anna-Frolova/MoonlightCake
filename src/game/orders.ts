// Generating guest orders. Every order follows one colour palette so its colours harmonise.
import { pickRandom, pickWeighted, randomInt } from '../core/math';
import { PALETTES } from '../data/palettes';
import { STORY_DAYS } from '../data/schedule';
import type { Cake, CatDef, GlazeColorId, Order, PaletteId, ShapeId, SpecialGuest, ToppingId } from '../data/types';
import { arrangeToppings, cakeHeight, createCake, createCreamDots, updateCreamCoverage } from './cake';
import { glazeRgb } from './colorMixing';
import { availableElements, availableGlazeColors, todaysMenu } from './state';

/** Scripted orders for the first two guests of day 1 (they teach the basics). */
const TUTORIAL_ORDERS: Record<1 | 2, Order> = {
  1: {
    palette: 'berry', shape: 'round', layerCount: 1, flavor: 'vanilla', filling: null, cream: 'butter',
    glaze: 'red', toppings: { strawberry: 3 }, element: 'fire', isRoyal: false, isSpecial: false,
  },
  2: {
    palette: 'chocolate', shape: 'square', layerCount: 2, flavor: 'chocolate', filling: 'caramel', cream: 'butter',
    glaze: 'orange', toppings: { pearl: 3 }, element: 'ice', isRoyal: false, isSpecial: false,
  },
};

/** Chance that a guest picks one of their favourite palettes / shapes when available. */
const FAVORITE_PALETTE_CHANCE = 0.9;
const FAVORITE_SHAPE_CHANCE = 0.85;
/**
 * How many toppings an order asks for, by story day (endless days use the last entry): up to `max` of one kind;
 * with `secondKindChance` there are two kinds, each up to ~60% of `max`. Starts at 1–3 of one kind.
 */
const TOPPING_COUNTS = [
  { max: 3, secondKindChance: 0 },
  { max: 3, secondKindChance: 0.25 },
  { max: 4, secondKindChance: 0.35 },
  { max: 5, secondKindChance: 0.45 },
  { max: 6, secondKindChance: 0.45 },
];
const SECOND_KIND_SHARE = 0.6;
const toppingCounts = (day: number) => TOPPING_COUNTS[Math.min(day, TOPPING_COUNTS.length) - 1];
const maxPerKind = (day: number, kindCount: number): number =>
  kindCount === 2 ? Math.ceil(toppingCounts(day).max * SECOND_KIND_SHARE) : toppingCounts(day).max;
/** A special guest always asks for at least this many of their signature topping (but no more than the day allows). */
const SPECIAL_TOPPING_MIN = 2;
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
    return !palette.isSpecial && palette.flavors.some(f => menu.flavors.includes(f))
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
  if (cat.special) return generateSpecialOrder(cat, cat.special, day);
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
  const kindCount = Math.min(Math.random() < toppingCounts(day).secondKindChance ? 2 : 1, toppingSource.length);
  const kinds: ToppingId[] = [];
  while (kinds.length < kindCount) {
    kinds.push(pickFromPalette(palette.toppings.filter(t => !kinds.includes(t)), menu.toppings.filter(t => !kinds.includes(t))));
  }
  const toppings: Order['toppings'] = {};
  for (const kind of kinds) toppings[kind] = randomInt(1, maxPerKind(day, kindCount));

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
    isSpecial: false,
  };
}

/** A special guest's cake: their own palette and magic, always their signature topping, two or three layers. */
function generateSpecialOrder(cat: CatDef, special: SpecialGuest, day: number): Order {
  const menu = todaysMenu(), palette = PALETTES[special.palette];
  const extras = palette.toppings.filter(t => t !== special.topping && menu.toppings.includes(t));
  const kindCount = extras.length && Math.random() < toppingCounts(day).secondKindChance ? 2 : 1, most = maxPerKind(day, kindCount);
  const toppings: Order['toppings'] = { [special.topping]: randomInt(Math.min(SPECIAL_TOPPING_MIN, most), most) };
  if (kindCount === 2) toppings[pickRandom(extras)] = randomInt(1, most);
  return {
    palette: special.palette,
    shape: pickPreferring(menu.shapes, cat.favoriteShapes, FAVORITE_SHAPE_CHANCE),
    layerCount: randomInt(2, 3),
    flavor: pickFromPalette(palette.flavors, menu.flavors),
    filling: pickFromPalette(palette.fillings, menu.fillings),
    cream: pickFromPalette(palette.creams, menu.creams),
    glaze: pickFromPalette(palette.glazes, availableGlazeColors().map(color => color.id)),
    toppings,
    element: special.element,
    isRoyal: false,
    isSpecial: true,
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
