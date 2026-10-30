// The daily menu: new ingredients unlock over the days, and the rest rotate in and out.
import { seededRandom } from '../core/math';
import { MENU_CATEGORIES, MENU_SIZE, STORY_DAYS, UNLOCKS } from '../data/schedule';
import type { DailyMenu, MenuCategory, MenuLists } from '../data/types';

/** Chance that something on yesterday's menu is pushed back in the queue (so it may rest today). */
const ROTATE_OUT_CHANCE = 0.6;

const emptyLists = (): MenuLists => ({ shapes: [], flavors: [], fillings: [], creams: [], toppings: [] });

/**
 * Builds the menu for `day`. Deterministic for a given playthrough `seed`, so reloading the
 * page gives the same menu. `previous` is yesterday's menu (null on day 1).
 */
export function buildDailyMenu(day: number, previous: DailyMenu | null, seed: number): DailyMenu {
  const storyDay = Math.min(day, STORY_DAYS);
  const random = seededRandom(seed + day * 977);
  const shuffle = <T>(items: T[]): T[] => {
    for (let i = items.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [items[i], items[j]] = [items[j], items[i]]; }
    return items;
  };
  const menu: DailyMenu = { day, ...emptyLists(), fresh: emptyLists(), returning: emptyLists(), resting: emptyLists() };

  for (const category of MENU_CATEGORIES) {
    const pool: string[] = (UNLOCKS[category] as string[][]).slice(0, storyDay).flat();
    const fresh: string[] = day <= STORY_DAYS ? [...(UNLOCKS[category] as string[][])[storyDay - 1]] : [];
    const size = Math.min(pool.length, MENU_SIZE[category][storyDay - 1]);
    const yesterday: string[] = previous ? (previous[category] as string[]) : [];

    // New items are always on the menu. The others are shuffled, and yesterday's items
    // tend to go to the back of the queue, so the selection rotates.
    const others = shuffle(pool.filter(id => !fresh.includes(id)))
      .map(id => ({ id, pushedBack: yesterday.includes(id) && random() < ROTATE_OUT_CHANCE }))
      .sort((a, b) => Number(a.pushedBack) - Number(b.pushedBack))
      .map(entry => entry.id);
    let chosen = [...fresh, ...others.slice(0, size - fresh.length)];

    // Guarantee at least one change compared with yesterday when there is anything to swap.
    const leftOut = pool.filter(id => !chosen.includes(id));
    if (yesterday.length && leftOut.length && yesterday.every(id => chosen.includes(id))) {
      const swappable = chosen.filter(id => !fresh.includes(id));
      if (swappable.length) {
        const removed = swappable[Math.floor(random() * swappable.length)];
        chosen = chosen.filter(id => id !== removed).concat(leftOut[Math.floor(random() * leftOut.length)]);
      }
    }
    chosen.sort((a, b) => pool.indexOf(a) - pool.indexOf(b));

    setList(menu, category, chosen);
    setList(menu.fresh, category, fresh);
    setList(menu.returning, category, yesterday.length ? chosen.filter(id => !yesterday.includes(id) && !fresh.includes(id)) : []);
    setList(menu.resting, category, yesterday.filter(id => !chosen.includes(id)));
  }
  return menu;
}

function setList(target: MenuLists, category: MenuCategory, ids: string[]): void {
  (target[category] as string[]) = ids;
}
