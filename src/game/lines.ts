// Guests' lines come from a shuffled "bag": every line in a list is said once before any
// line repeats, and the last line of one round never opens the next.
import { language, loc } from '../core/language';
import { CAT_LINES } from '../data/catLines';
import type { CatDef, CatLines } from '../data/types';

/** Indices not used yet in the current round, per list. */
const bags = new Map<string, number[]>();
const lastPicked = new Map<string, number>();

function shuffledIndices(count: number): number[] {
  const indices = Array.from({ length: count }, (_, i) => i);
  for (let i = count - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [indices[i], indices[j]] = [indices[j], indices[i]]; }
  return indices;
}

/** Picks from `items` without repeats until all of them were used. `key` names the list. */
export function pickWithoutRepeat<T>(key: string, items: readonly T[]): T {
  let bag = bags.get(key);
  if (!bag?.length) {
    bag = shuffledIndices(items.length);
    // the bag is popped from the end: keep the previous round's last line away from there
    if (bag.length > 1 && bag[bag.length - 1] === lastPicked.get(key)) [bag[0], bag[bag.length - 1]] = [bag[bag.length - 1], bag[0]];
    bags.set(key, bag);
  }
  const index = bag.pop()!;
  lastPicked.set(key, index);
  return items[index];
}

/** A line of `cat` of the given kind, in the current language. */
export const catLine = (cat: CatDef, kind: keyof CatLines): string =>
  pickWithoutRepeat(`${cat.id}:${kind}:${language()}`, loc(CAT_LINES[cat.id])[kind]);
