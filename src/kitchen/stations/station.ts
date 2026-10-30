// What every kitchen station provides. The kitchen scene draws the active station's tools
// in the left panel and forwards pointer presses to it.
import type { Point } from '../../core/math';
import type { Cake, HelperId } from '../../data/types';

export interface Panel { x: number; y: number; w: number; h: number }

export interface Station {
  /** Tab caption. */
  name: string;
  /** One-line instruction shown above the cake. */
  hint: string;
  /** Shop helper that adds an "Авто" button to this station. */
  helper: HelperId;
  /** Shown as a tick on the tab. */
  isDone(cake: Cake): boolean;
  /** Panel title (defaults to `name`). */
  title?(cake: Cake): string;
  /** Overrides `hint` in special situations. */
  currentHint?(cake: Cake): string;
  /** Draws the station's tools inside the left panel. */
  drawTools(panel: Panel, cake: Cake): void;
  /** Extra buttons in the panel header (e.g. undo), left of the "Авто" button. `rightEdge` is where they must end. */
  drawHeaderButtons?(panel: Panel, cake: Cake, rightEdge: number): void;
  /** What the helper does when "Авто" is pressed. */
  autoComplete(): void;
  /** Pointer pressed on the scene (not on a button). Return true if handled. */
  onPointerDown?(point: Point, cake: Cake): boolean;
  onPointerMove?(point: Point, cake: Cake): void;
  /** Pointer released (or the gesture was cancelled). */
  onPointerUp?(point: Point, cake: Cake): void;
  /** Drawn over the cake area (cursor previews, dragged items…). */
  drawOverlay?(cake: Cake): void;
}
