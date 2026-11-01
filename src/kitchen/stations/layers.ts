// Station 1: switch the cake's shape and tap layers and fillings on the shelf above the cake to stack them.
import { sfx } from '../../audio/sfx';
import { ctx } from '../../core/canvas';
import { ellipsePath } from '../../core/draw';
import { loc } from '../../core/language';
import { burst } from '../../core/particles';
import { BUTTON_COLOR } from '../../core/theme';
import { button } from '../../core/ui';
import { FILLINGS, FLAVORS } from '../../data/ingredients';
import { t } from '../../data/strings';
import type { Cake, FillingId, FlavorId, ShapeId } from '../../data/types';
import { cakeHeight, countLayers, isStackLocked, MAX_LAYERS } from '../../game/cake';
import { todaysMenu } from '../../game/state';
import { drawShapeIcon } from '../../render/icons';
import { drawFillingJar, drawLayerPiece } from '../../render/shelfItems';
import { showToast } from '../../scenes/sceneManager';
import { cakeTopY, currentCake, currentOrder, SPARKLE_COLORS } from '../kitchen';
import { CAKE_BASE_Y, CAKE_CENTER_X, CAKE_SIDE_BUTTON, FILLING_SHELF, FLAVOR_SHELF, HELPER_SHELF, SHAPE_SWITCHES, type ShelfLayout } from '../layout';
import { drawIngredientShelf, isOverShelfItem, shelfItemXs } from '../widgets';
import type { Point } from '../../core/math';
import type { Station } from './station';
import { judgeChoice } from '../../game/guestReactions';

/** Delay before the landing sound, so it matches the falling animation. */
const LAND_SOUND_DELAY_MS = 160;
/** Helper stacks one item every this many ms. */
const AUTO_STACK_INTERVAL_MS = 150;
/** Where the helper's sparkle appears (its spot on the shelf). */
const HELPER_SHELF_SPOT = { x: HELPER_SHELF.slotXs[0], y: HELPER_SHELF.y - 24 };

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
  judgeChoice(flavor === currentOrder().flavor, 'worried');
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
  judgeChoice(filling === currentOrder().filling, 'worried');
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

/**
 * The sponges (a piece of each flavour, in the chosen shape) stand on the shelf above the cake; the jars of filling
 * on their own small shelf left of the cake. Today's menu, plus a special guest's sponge and filling when the menu
 * doesn't have them (put first).
 */
function shelfFlavors(): FlavorId[] {
  const menu = todaysMenu().flavors, wanted = currentOrder().flavor;
  return menu.includes(wanted) ? menu : [wanted, ...menu];
}

function shelfFillings(): FillingId[] {
  const menu = todaysMenu().fillings, wanted = currentOrder().filling;
  return !wanted || menu.includes(wanted) ? menu : [wanted, ...menu];
}

/** Which of `items` on `shelf` is under the point, if any. */
function itemAt<T>(items: T[], shelf: ShelfLayout, point: Point): T | undefined {
  const xs = shelfItemXs(items.length, shelf);
  return items.find((_, i) => isOverShelfItem(point, xs[i], items.length, shelf));
}

/** Round switches above the shelf; the chosen shape is lit and every layer on the shelf takes it. */
function drawShapeSwitches(cake: Cake): void {
  const shapes = todaysMenu().shapes, { y, size, gap } = SHAPE_SWITCHES;
  const left = CAKE_CENTER_X - (shapes.length * size + (shapes.length - 1) * gap) / 2;
  shapes.forEach((shape, i) => {
    const isChosen = cake.shape === shape;
    button('shape_' + shape, left + i * (size + gap), y, size, size, '', {
      onClick: () => setShape(shape), hoverScale: 1.1,
      draw: (bx, by, bw, bh, hovered) => {
        ctx.save();
        if (isChosen) { ctx.shadowColor = 'rgba(95,216,255,0.9)'; ctx.shadowBlur = 18; }
        ellipsePath(bx + bw / 2, by + bh / 2, bw / 2, bh / 2);
        ctx.fillStyle = isChosen ? '#4f6fd8' : hovered ? '#5a44a8' : '#3d2e86'; ctx.fill();
        ctx.restore();
        ctx.strokeStyle = isChosen ? 'rgba(159,234,255,0.95)' : 'rgba(200,180,255,0.3)'; ctx.lineWidth = isChosen ? 3 : 1.5;
        ellipsePath(bx + bw / 2, by + bh / 2, bw / 2 - 1, bh / 2 - 1); ctx.stroke();
        drawShapeIcon(shape, bx + bw / 2, by + bh / 2 + 2, 0.82);
      },
    });
  });
}

export const layersStation: Station = {
  get name() { return t().stations.layers; },
  helper: 'layers',
  isDone: cake => countLayers(cake) > 0,
  currentHint: cake => isStackLocked(cake) ? t().lockedHint : null,

  drawControls(_rightEdge, _y, cake) {
    // undo sits right of the cake, under the right thumb (the layers are added by tapping the shelf above the cake)
    const side = CAKE_SIDE_BUTTON, size = side.h;
    button('undo', side.x + (side.w - size) / 2, side.y, size, size, '↶', {
      color: BUTTON_COLOR.secondary, fontSize: 40, radius: size / 2, disabled: isStackLocked(cake) || !cake.stack.length, onClick: removeTopItem,
    });
  },

  /** Shape switches, the sponges in that shape on the shelf above the cake, the jars of filling left of it. Tapping one puts it on the cake. */
  drawScenery(cake) {
    drawShapeSwitches(cake);
    const isHoverable = !isStackLocked(cake);
    drawIngredientShelf(shelfFlavors(), flavor => loc(FLAVORS[flavor].name), (flavor, x, y, scale) => drawLayerPiece(flavor, cake.shape, x, y, scale),
      { isHoverable, shelf: FLAVOR_SHELF });
    drawIngredientShelf(shelfFillings(), filling => loc(FILLINGS[filling].shortName), drawFillingJar, { isHoverable, shelf: FILLING_SHELF });
  },

  onPointerDown(point) {
    const flavor = itemAt(shelfFlavors(), FLAVOR_SHELF, point);
    if (flavor) { addLayer(flavor); return true; }
    const filling = itemAt(shelfFillings(), FILLING_SHELF, point);
    if (filling) { addFilling(filling); return true; }
    return false;
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
