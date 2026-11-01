// What becomes available on which day, and how big the daily menu is.
import type { CreamId, FillingId, FlavorId, MenuCategory, ShapeId, ToppingId } from './types';

/** The story lasts five days; after that the game continues in endless mode. */
export const STORY_DAYS = 5;

/** Guests per day for days 1..5 (endless days use the last value). */
const GUESTS_PER_DAY = [5, 5, 6, 6, 7];
export const guestsPerDay = (day: number): number => GUESTS_PER_DAY[Math.min(day, STORY_DAYS) - 1] ?? 7;

/**
 * Items unlocked on each day (index 0 = day 1). The four piped creams — like glaze essences and magic elements
 * (`unlockDay` in ingredients.ts / elements.ts) — are there from day 1, the berry and chocolate borders come on days 2
 * and 3; once unlocked, every cream is always on the menu. Layers and toppings come gradually and rotate.
 */
export const UNLOCKS: {
  shapes: ShapeId[][]; flavors: FlavorId[][]; fillings: FillingId[][]; creams: CreamId[][]; toppings: ToppingId[][];
} = {
  shapes:   [['round', 'square'], ['heart'], [], ['star'], []],
  flavors:  [['vanilla', 'chocolate', 'strawberry'], ['lavender'], ['mint'], ['sky'], ['starry']],
  fillings: [['jam', 'caramel'], ['blueberry'], ['honey'], ['jelly'], []],
  creams:   [['butter', 'berry', 'cloud', 'moon'], ['berryMix'], ['chocoBalls'], [], []],
  toppings: [['strawberry', 'leaves', 'pearl'], ['blueberry', 'rosePink'], ['currant', 'lavender'], ['raspberry', 'goldPearl'], ['roseWhite']],
};

/** How many items of each category are on the menu on days 1..5. */
export const MENU_SIZE: Record<MenuCategory, number[]> = {
  shapes:   [2, 2, 2, 3, 3],
  flavors:  [3, 4, 4, 4, 5],
  fillings: [2, 2, 3, 3, 3],
  creams:   [4, 5, 6, 6, 6],
  toppings: [3, 4, 5, 5, 6],
};

export const MENU_CATEGORIES: MenuCategory[] = ['shapes', 'flavors', 'fillings', 'creams', 'toppings'];
