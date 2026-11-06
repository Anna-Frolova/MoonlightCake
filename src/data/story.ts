// The story of the Faded Desert, the first region: who comes on which day and what follows.
// What the story guests say is in catLines.ts, what the map and the night say in strings.ts.
import type { CatId } from './types';

/** Today's story guest; `raid`: their master's shadows come for the recipe book that night. */
export const STORY_VISITS: Partial<Record<number, { cat: CatId; raid?: boolean }>> = {
  2: { cat: 'zoryana' },
  3: { cat: 'nyukhach' },
  4: { cat: 'krykhta', raid: true },
};

/** A story guest takes this place in the day's queue (after one ordinary guest). */
export const STORY_GUEST_PLACE = 1;
