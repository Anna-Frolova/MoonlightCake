// Progress through the day-1 tutorial. Whether it was finished or skipped is stored apart from
// the save (like the language), so it survives reloads and doesn't change the save format.
import { readStored, removeStored, writeStored } from '../core/storage';

const TUTORIAL_KEY = 'misiachnyi-korzh-tutorial';

export const tutorial = {
  isDone: readStored(TUTORIAL_KEY) === 'done',
  /** Index of the current step (runtime only: after a reload the steps already done are skipped again). */
  step: 0,
  /** The player pressed "Got it" on the current step. */
  confirmed: false,
  /** When the current step's hint appeared (for the pop-in animation), or null while it is hidden. */
  shownAt: null as number | null,
};

export function finishTutorial(): void {
  tutorial.isDone = true;
  writeStored(TUTORIAL_KEY, 'done');
}

/** A new game teaches again from the first step. */
export function resetTutorial(): void {
  Object.assign(tutorial, { isDone: false, step: 0, confirmed: false, shownAt: null });
  removeStored(TUTORIAL_KEY);
}
