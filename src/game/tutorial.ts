// Progress through the day-1 tutorial. Whether it was finished or skipped is stored apart from
// the save (like the language), so it survives reloads and doesn't change the save format.

const TUTORIAL_KEY = 'misiachnyi-korzh-tutorial';

function readDone(): boolean {
  try { return localStorage.getItem(TUTORIAL_KEY) === 'done'; } catch { return false; }
}

export const tutorial = {
  isDone: readDone(),
  /** Index of the current step (runtime only: after a reload the steps already done are skipped again). */
  step: 0,
  /** The player pressed "Got it" on the current step. */
  confirmed: false,
  /** When the current step's hint appeared (for the pop-in animation), or null while it is hidden. */
  shownAt: null as number | null,
};

export function finishTutorial(): void {
  tutorial.isDone = true;
  try { localStorage.setItem(TUTORIAL_KEY, 'done'); } catch { /* storage unavailable (private mode) */ }
}

/** A new game teaches again from the first step. */
export function resetTutorial(): void {
  Object.assign(tutorial, { isDone: false, step: 0, confirmed: false, shownAt: null });
  try { localStorage.removeItem(TUTORIAL_KEY); } catch { /* storage unavailable */ }
}
