// What every kitchen station provides. Everything a station shows sits in the middle, around the cake
// (shelves, switches, the element row); its buttons line up in the top right corner. The kitchen scene
// draws the active station and forwards pointer presses to it.
import type { Point } from '../../core/math';
import type { Cake, HelperId } from '../../data/types';

export interface Station {
  /** Tab caption. */
  name: string;
  /** Shop helper that adds an "Auto" button to this station. */
  helper: HelperId;
  /** Shown as a tick on the tab. */
  isDone(cake: Cake): boolean;
  /** A message shown above the cake in special situations (null = nothing to say; the tutorial teaches the basics). */
  currentHint?(cake: Cake): string | null;
  /** The station's buttons in the top right corner, right-aligned so they end at `rightEdge` (left of "Auto"). */
  drawControls?(rightEdge: number, y: number, cake: Cake): void;
  /** What the helper does when "Auto" is pressed. */
  autoComplete(): void;
  /** Pointer pressed on the scene (not on a button). Return true if handled. */
  onPointerDown?(point: Point, cake: Cake): boolean;
  onPointerMove?(point: Point, cake: Cake): void;
  /** Pointer released (or the gesture was cancelled). */
  onPointerUp?(point: Point, cake: Cake): void;
  /** Drawn behind the cake while the station is open (shelves, switches, the element row). */
  drawScenery?(cake: Cake): void;
  /** Drawn over the cake area (cursor previews, dragged items…). */
  drawOverlay?(cake: Cake): void;
}
