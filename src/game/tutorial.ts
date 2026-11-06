// Progress through the day-1 tutorial. Whether it was finished or skipped is stored apart from
// the save (like the language), so it survives reloads and doesn't change the save format.
import { readStored, removeStored, writeStored } from '../core/storage';
import type { ElementId } from '../data/types';

const TUTORIAL_KEY = 'misiachnyi-korzh-tutorial';
const SHADE_HINT_KEY = 'misiachnyi-korzh-shade-hint';
/** The tutorial's own button ("Skip") works at every step. */
const TUTORIAL_BUTTON_PREFIX = 'tutorial';

export interface Rect { x: number; y: number; w: number; h: number }

export const tutorial = {
  isDone: readStored(TUTORIAL_KEY) === 'done',
  /** Index of the current step (runtime only: after a reload the steps already done are skipped again). */
  step: 0,
  /** When the current step's hint appeared (for the pop-in animation), or null while it is hidden. */
  shownAt: null as number | null,
  /** When the player last pressed something the tutorial holds back (the highlight flashes). */
  nudgedAt: null as number | null,
  /** Kitchen stations whose part of the tutorial the player skipped (runtime only, like `step`). */
  skippedStations: [] as number[],
};

/**
 * What the current step lets the player do, set every frame by the tutorial scene. While `pressable` is set,
 * a press anywhere else is ignored (only the right choice works); `null` = no restriction.
 */
export const tutorialGate = {
  pressable: null as Rect[] | null,
  /** Only buttons are held back (in the hall a tap still skips the guest's typing). */
  buttonsOnly: false,
  /** On the magic step only this element's sign works (any other counts as not recognised). */
  magicElement: null as ElementId | null,
};

const isInside = (point: { x: number; y: number }, rect: Rect): boolean =>
  point.x >= rect.x && point.x <= rect.x + rect.w && point.y >= rect.y && point.y <= rect.y + rect.h;

/** May a press start here? `buttonId` is the button under the point, if any. */
export function isPressAllowed(point: { x: number; y: number }, buttonId: string | null): boolean {
  const areas = tutorialGate.pressable;
  if (!areas || buttonId?.startsWith(TUTORIAL_BUTTON_PREFIX)) return true;
  if (tutorialGate.buttonsOnly && !buttonId) return true;
  return areas.some(rect => isInside(point, rect));
}

export function clearTutorialGate(): void {
  Object.assign(tutorialGate, { pressable: null, buttonsOnly: false, magicElement: null });
}

/** Skips just one station's part: its steps count as done, the rest of the tutorial goes on. */
export function skipTutorialStation(station: number): void {
  if (!tutorial.skippedStations.includes(station)) tutorial.skippedStations.push(station);
}

export function finishTutorial(): void {
  tutorial.isDone = true;
  clearTutorialGate();
  writeStored(TUTORIAL_KEY, 'done');
}

/** True only the first time: the one-off hint about the white and dark bottles (kept apart from the save, like the tutorial). */
export function takeShadeHint(): boolean {
  if (readStored(SHADE_HINT_KEY) === 'done') return false;
  writeStored(SHADE_HINT_KEY, 'done');
  return true;
}

/** A new game teaches again from the first step. */
export function resetTutorial(): void {
  Object.assign(tutorial, { isDone: false, step: 0, shownAt: null, nudgedAt: null, skippedStations: [] });
  clearTutorialGate();
  removeStored(TUTORIAL_KEY);
  removeStored(SHADE_HINT_KEY);
}
