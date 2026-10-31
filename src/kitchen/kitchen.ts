// Shared kitchen state helpers used by all stations.
import { sfx } from '../audio/sfx';
import { burst } from '../core/particles';
import { t } from '../data/strings';
import type { Cake } from '../data/types';
import { cakeHeight, countLayers, createCake } from '../game/cake';
import { runtime, todaysMenu } from '../game/state';
import { showToast } from '../scenes/sceneManager';
import { CAKE_BASE_Y, CAKE_CENTER_X } from './layout';

export const SPARKLE_COLORS = ['#fff', '#c9a6ff', '#9feaff'];

/** The cake being built (only valid in the kitchen). */
export const currentCake = (): Cake => runtime.cake!;
export const currentOrder = () => runtime.customer!.order;

/** Screen y of the cake's top face centre (cake at rest in the middle of the kitchen). */
export const cakeTopY = (cake: Cake = currentCake()): number => CAKE_BASE_Y - cakeHeight(cake);

/** Fresh kitchen for a new order. */
export function setUpKitchen(): void {
  const shapes = todaysMenu().shapes;
  runtime.cake = createCake(shapes.includes('round') ? 'round' : shapes[0]);
  runtime.station = 0;
  runtime.selectedCream = null;
  runtime.draggedTopping = null;
  runtime.isPipingCream = false;
  runtime.autoCreamTime = null;
}

/** Shows a hint and returns false when the cake has no layers yet. */
export function requireLayer(cake: Cake = currentCake()): boolean {
  if (countLayers(cake)) return true;
  showToast(t().needLayerFirst);
  sfx.fail();
  return false;
}

/** "Reset": throws the cake away and starts over with the same shape. */
export function resetCake(): void {
  const cake = runtime.cake;
  if (!cake) return;
  burst(CAKE_CENTER_X, CAKE_BASE_Y - cakeHeight(cake) / 2, 30, SPARKLE_COLORS, { lift: 100 });
  sfx.poof();
  runtime.cake = createCake(cake.shape);
  runtime.autoCreamTime = null;
  runtime.draggedTopping = null;
  runtime.isPipingCream = false;
}
