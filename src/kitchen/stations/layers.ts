// Station 1: pick the shape and stack layers with fillings in between.
import { sfx } from '../../audio/sfx';
import { drawText } from '../../core/draw';
import { loc } from '../../core/language';
import { burst } from '../../core/particles';
import { BUTTON_COLOR, TEXT } from '../../core/theme';
import { button } from '../../core/ui';
import { FILLINGS, FLAVORS, SHAPES } from '../../data/ingredients';
import { t } from '../../data/strings';
import type { FillingId, FlavorId, ShapeId } from '../../data/types';
import { cakeHeight, countLayers, isStackLocked, MAX_LAYERS } from '../../game/cake';
import { todaysMenu } from '../../game/state';
import { drawFillingIcon, drawFlavorIcon, drawShapeIcon } from '../../render/icons';
import { showToast } from '../../scenes/sceneManager';
import { cakeTopY, currentCake, currentOrder, SPARKLE_COLORS } from '../kitchen';
import { CAKE_BASE_Y, CAKE_CENTER_X } from '../layout';
import { toolCard } from '../widgets';
import type { Station } from './station';

/** Delay before the landing sound, so it matches the falling animation. */
const LAND_SOUND_DELAY_MS = 160;
/** Helper stacks one item every this many ms. */
const AUTO_STACK_INTERVAL_MS = 150;
/** Where the helper's sparkle appears (its spot on the shelf). */
const HELPER_SHELF_SPOT = { x: 975, y: 210 };

function complainIfLocked(message: string): boolean {
  if (!isStackLocked(currentCake())) return false;
  showToast(message);
  sfx.fail();
  return true;
}

function setShape(shape: ShapeId): void {
  const cake = currentCake();
  if (cake.shape === shape) return;
  if (complainIfLocked(t().lockedShape)) return;
  cake.shape = shape;
  cake.creamDots = null;
  sfx.place();
  if (cake.stack.length) burst(CAKE_CENTER_X, cakeTopY(cake), 14, SPARKLE_COLORS, { kind: 'star', gravity: 60 });
}

function addLayer(flavor: FlavorId): void {
  const cake = currentCake();
  if (complainIfLocked(t().lockedLayers)) return;
  if (countLayers(cake) >= MAX_LAYERS) { showToast(t().maxLayers); sfx.fail(); return; }
  cake.stack.push({ kind: 'layer', flavor, dropProgress: 0 });
  cake.creamDots = null;
  setTimeout(() => {
    sfx.plop();
    burst(CAKE_CENTER_X, CAKE_BASE_Y - cakeHeight(cake) + 10, 10, FLAVORS[flavor].color, { lift: 120, gravity: 500 });
  }, LAND_SOUND_DELAY_MS);
}

function addFilling(filling: FillingId): void {
  const cake = currentCake();
  if (complainIfLocked(t().lockedStack)) return;
  const last = cake.stack[cake.stack.length - 1];
  if (!last || last.kind !== 'layer') {
    showToast(last ? t().fillingAlreadyThere : t().needLayerFirst);
    sfx.fail(); return;
  }
  if (countLayers(cake) >= MAX_LAYERS) { showToast(t().fillingNoRoom); sfx.fail(); return; }
  cake.stack.push({ kind: 'filling', filling, dropProgress: 0 });
  cake.creamDots = null;
  setTimeout(() => {
    sfx.squish();
    burst(CAKE_CENTER_X, CAKE_BASE_Y - cakeHeight(cake), 8, FILLINGS[filling].color, { lift: 80 });
  }, LAND_SOUND_DELAY_MS);
}

function removeTopItem(): void {
  const cake = currentCake();
  if (isStackLocked(cake) || !cake.stack.length) return;
  cake.stack.pop();
  cake.creamDots = null;
  sfx.pickup();
}

export const layersStation: Station = {
  get name() { return t().stations.layers.name; },
  get hint() { return t().stations.layers.hint; },
  helper: 'layers',
  isDone: cake => countLayers(cake) > 0,
  title: cake => t().layersTitle(countLayers(cake), MAX_LAYERS),
  currentHint: cake => isStackLocked(cake) ? t().lockedHint : layersStation.hint,

  drawHeaderButtons(panel, cake, rightEdge) {
    button('undo', rightEdge - 46, panel.y + 7, 46, 38, '↶', {
      color: BUTTON_COLOR.secondary, fontSize: 22, disabled: isStackLocked(cake) || !cake.stack.length, onClick: removeTopItem,
    });
  },

  drawTools({ x, y }, cake) {
    const menu = todaysMenu();
    menu.shapes.forEach((shape, i) => toolCard(
      'shape_' + shape, x + 14 + i * 84, y + 48, 78, 58, loc(SHAPES[shape].name),
      (cx, cy) => drawShapeIcon(shape, cx, cy + 2, 0.8), () => setShape(shape), { selected: cake.shape === shape, labelSize: 12 },
    ));
    menu.flavors.forEach((flavor, i) => toolCard(
      'flavor_' + flavor, x + 14 + (i % 4) * 84, y + 112 + Math.floor(i / 4) * 68, 78, 62, loc(FLAVORS[flavor].name),
      (cx, cy) => drawFlavorIcon(flavor, cx, cy, 0.85), () => addLayer(flavor), { silent: true, labelSize: 11 },
    ));
    drawText(t().fillingsLabel, x + 20, y + 256, 14, TEXT.label, 'left', 900);
    menu.fillings.forEach((filling, i) => toolCard(
      'filling_' + filling, x + 14 + i * 67, y + 268, 62, 66, loc(FILLINGS[filling].shortName),
      (cx, cy) => drawFillingIcon(filling, cx, cy + 2, 0.75), () => addFilling(filling), { silent: true, labelSize: 11 },
    ));
  },

  /** The magic spatula picks the shape and stacks the ordered layers with fillings. */
  autoComplete() {
    const cake = currentCake(), order = currentOrder();
    if (complainIfLocked(t().lockedAuto)) return;
    cake.shape = order.shape;
    cake.stack = [];
    cake.creamDots = null;
    const { flavor, filling } = order;
    let step = 0;
    for (let n = 0; n < order.layerCount; n++) {
      // negative progress = wait before falling, so items land one after another
      cake.stack.push({ kind: 'layer', flavor, dropProgress: -step * 0.6 });
      setTimeout(sfx.plop, step * AUTO_STACK_INTERVAL_MS + AUTO_STACK_INTERVAL_MS);
      step++;
      if (n < order.layerCount - 1 && filling) {
        cake.stack.push({ kind: 'filling', filling, dropProgress: -step * 0.6 });
        setTimeout(sfx.squish, step * AUTO_STACK_INTERVAL_MS + AUTO_STACK_INTERVAL_MS);
        step++;
      }
    }
    sfx.sparkle();
    burst(HELPER_SHELF_SPOT.x, HELPER_SHELF_SPOT.y, 14, ['#ffd84a', '#fff'], { kind: 'star', gravity: 50 });
  },
};
