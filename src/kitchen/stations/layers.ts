// Station 1: switch the cake's shape and tap layers and fillings on the shelf above the cake to stack them.
import { sfx } from '../../audio/sfx';
import { ctx } from '../../core/canvas';
import { shade, withAlpha } from '../../core/color';
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
/** The undo button: dimmed while there is nothing to undo; the arrow's size and thickness (shares of the radius). */
const UNDO_LOOK = { disabledAlpha: 0.45, arrowRadius: 0.4, arrowWidth: 0.15, arrowHead: 0.32, ring: 3 };
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
  // one layer too many is as wrong as the wrong flavour
  judgeChoice(flavor === currentOrder().flavor && countLayers(cake) <= currentOrder().layerCount, 'worried');
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
export function shelfFlavors(): FlavorId[] {
  const menu = todaysMenu().flavors, wanted = currentOrder().flavor;
  return menu.includes(wanted) ? menu : [wanted, ...menu];
}

export function shelfFillings(): FillingId[] {
  const menu = todaysMenu().fillings, wanted = currentOrder().filling;
  return !wanted || menu.includes(wanted) ? menu : [wanted, ...menu];
}

/** Which of `items` on `shelf` is under the point, if any. */
function itemAt<T>(items: T[], shelf: ShelfLayout, point: Point): T | undefined {
  const xs = shelfItemXs(items.length, shelf);
  return items.find((_, i) => isOverShelfItem(point, xs[i], items.length, shelf));
}

/** A glossy sky-blue disc with a white ring and a bold white "back" arrow (↶ drawn, so it's thick on a phone). */
function drawUndoButton(centerX: number, centerY: number, radius: number, isDisabled: boolean, hovered: boolean): void {
  const color = BUTTON_COLOR.undo;
  ctx.save();
  ctx.globalAlpha = isDisabled ? UNDO_LOOK.disabledAlpha : 1;
  if (!isDisabled) { ctx.shadowColor = withAlpha(color, hovered ? 0.95 : 0.7); ctx.shadowBlur = hovered ? 30 : 20; ctx.shadowOffsetY = 4; }
  const fill = ctx.createLinearGradient(0, centerY - radius, 0, centerY + radius);
  fill.addColorStop(0, shade(color, 0.35)); fill.addColorStop(0.55, color); fill.addColorStop(1, shade(color, -0.25));
  ellipsePath(centerX, centerY, radius, radius); ctx.fillStyle = fill; ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ellipsePath(centerX, centerY - radius * 0.45, radius * 0.62, radius * 0.3); ctx.fillStyle = 'rgba(255,255,255,0.28)'; ctx.fill(); // gloss
  ellipsePath(centerX, centerY, radius - UNDO_LOOK.ring / 2, radius - UNDO_LOOK.ring / 2);
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'; ctx.lineWidth = UNDO_LOOK.ring; ctx.stroke();
  // the arrow: half a circle over the top from right to left, its head pointing down on the left
  const arcRadius = radius * UNDO_LOOK.arrowRadius, arcY = centerY + radius * 0.12, head = radius * UNDO_LOOK.arrowHead;
  ctx.shadowColor = 'rgba(20,40,90,0.6)'; ctx.shadowBlur = 4; ctx.shadowOffsetY = 1.5;
  ctx.strokeStyle = '#fff'; ctx.fillStyle = '#fff'; ctx.lineWidth = radius * UNDO_LOOK.arrowWidth; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.arc(centerX, arcY, arcRadius, 0, Math.PI, true); ctx.stroke();
  const tipX = centerX - arcRadius, tipY = arcY + head * 0.9;
  ctx.beginPath(); ctx.moveTo(tipX, tipY); ctx.lineTo(tipX - head * 0.75, arcY - head * 0.1); ctx.lineTo(tipX + head * 0.75, arcY - head * 0.1); ctx.closePath(); ctx.fill();
  ctx.restore();
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
  icon: 'layers',
  get name() { return t().stations.layers; },
  helper: 'layers',
  isDone: cake => countLayers(cake) > 0,
  currentHint: cake => isStackLocked(cake) ? t().lockedHint : null,

  drawControls(_rightEdge, _y, cake) {
    // undo sits right of the cake, under the right thumb (the layers are added by tapping the shelf above the cake)
    const side = CAKE_SIDE_BUTTON, size = side.h, isDisabled = isStackLocked(cake) || !cake.stack.length;
    button('undo', side.x + (side.w - size) / 2, side.y, size, size, '', {
      disabled: isDisabled, onClick: removeTopItem,
      draw: (x, y, w, h, hovered) => drawUndoButton(x + w / 2, y + h / 2, w / 2, isDisabled, hovered),
    });
  },

  /** Shape switches, the sponges in that shape on the shelf above the cake, the jars of filling left of it. Tapping one puts it on the cake. */
  drawScenery(cake) {
    drawShapeSwitches(cake);
    const isHoverable = !isStackLocked(cake);
    drawIngredientShelf(shelfFlavors(), flavor => loc(FLAVORS[flavor].name), (flavor, x, y, scale) => drawLayerPiece(flavor, cake.shape, x, y, scale),
      { isHoverable, shelf: FLAVOR_SHELF, labels: 'active' });
    drawIngredientShelf(shelfFillings(), filling => loc(FILLINGS[filling].shortName), drawFillingJar, { isHoverable, shelf: FILLING_SHELF, labels: 'active' });
  },

  onPointerDown(point) {
    const flavor = itemAt(shelfFlavors(), FLAVOR_SHELF, point);
    if (flavor) { addLayer(flavor); return true; }
    const filling = itemAt(shelfFillings(), FILLING_SHELF, point);
    if (filling) { addFilling(filling); return true; }
    return false;
  },

  /** The magic spatula goes on with the player's first layer and filling, up to the order's height. */
  autoComplete() {
    const cake = currentCake(), wanted = currentOrder().layerCount;
    if (complainIfLocked(t().lockedAuto)) return;
    const firstLayer = cake.stack.find(item => item.kind === 'layer');
    if (!firstLayer || firstLayer.kind !== 'layer') { showToast(t().needLayerFirst); sfx.fail(); return; }
    if (countLayers(cake) >= wanted) { showToast(t().layersEnough); return; }
    const firstFilling = cake.stack.find(item => item.kind === 'filling');
    const filling = firstFilling?.kind === 'filling' ? firstFilling.filling : null;
    cake.creamDots = null;
    let step = 0;
    while (countLayers(cake) < wanted) {
      // negative progress = wait before falling, so items land one after another
      if (filling && cake.stack[cake.stack.length - 1].kind === 'layer') {
        cake.stack.push({ kind: 'filling', filling, dropProgress: -step * 0.6 });
        setTimeout(sfx.squish, step * AUTO_STACK_INTERVAL_MS + AUTO_STACK_INTERVAL_MS);
        step++;
      }
      cake.stack.push({ kind: 'layer', flavor: firstLayer.flavor, dropProgress: -step * 0.6 });
      setTimeout(sfx.plop, step * AUTO_STACK_INTERVAL_MS + AUTO_STACK_INTERVAL_MS);
      step++;
    }
    sfx.sparkle();
    burst(HELPER_SHELF_SPOT.x, HELPER_SHELF_SPOT.y, 14, ['#ffd84a', '#fff'], { kind: 'star', gravity: 50 });
  },
};
