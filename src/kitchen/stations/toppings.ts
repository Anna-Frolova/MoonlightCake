// Station 4: drag toppings from the tray onto the cake — on top or on the sides.
import { sfx } from '../../audio/sfx';
import { ctx } from '../../core/canvas';
import { clock } from '../../core/clock';
import { drawFittedText, drawGlow, drawText } from '../../core/draw';
import { loc } from '../../core/language';
import { lerp, type Point } from '../../core/math';
import { burst } from '../../core/particles';
import { BUTTON_COLOR, TEXT } from '../../core/theme';
import { button, pointer, springScale } from '../../core/ui';
import { TOPPINGS } from '../../data/ingredients';
import { t } from '../../data/strings';
import type { Cake, ToppingId } from '../../data/types';
import { arrangeToppings, cakeHeight, countLayers, MAX_TOPPINGS } from '../../game/cake';
import { getShapeGeometry, isInsideTopFace } from '../../game/cakeGeometry';
import { runtime, todaysMenu } from '../../game/state';
import { drawTopping } from '../../render/toppings';
import { showToast } from '../../scenes/sceneManager';
import { cakeTopY, currentCake, currentOrder, requireLayer } from '../kitchen';
import { CAKE_BASE_Y, CAKE_CENTER_X } from '../layout';
import { drawCardBackground } from '../widgets';
import type { Station } from './station';

const TRAY_SLOT = { w: 106, h: 84, columns: 3, gapX: 112, gapY: 90 };
/** Pick-up radius of a topping already on the cake. */
const PICK_RADIUS = 18;
/** When dropped just off the cake, the topping is nudged towards the centre in this many steps. */
const SNAP_STEPS = 7;
const SNAP_STEP_FRACTION = 0.16;
/** Helper places one topping every this many ms. */
const AUTO_PLACE_INTERVAL_MS = 90;

/** Index of the topping under the pointer, or -1. */
function toppingIndexAt(point: Point, cake: Cake): number {
  const top = cakeTopY(cake);
  for (let i = cake.toppings.length - 1; i >= 0; i--) {
    const placed = cake.toppings[i];
    const dx = point.x - (CAKE_CENTER_X + placed.x), dy = point.y - (top + placed.y - 8);
    if (dx * dx + dy * dy < PICK_RADIUS * PICK_RADIUS) return i;
  }
  return -1;
}

/** Drops the dragged topping: anywhere on the visible cake — the top face or the front sides. */
function dropTopping(point: Point): void {
  const cake = currentCake(), dragged = runtime.draggedTopping!;
  runtime.draggedTopping = null;
  if (!countLayers(cake)) { if (!dragged.fromCake) showToast(t().needLayerFirst); return; }
  const geometry = getShapeGeometry(cake.shape), height = cakeHeight(cake);
  // a point is on the cake if it is inside the top outline lifted to any height of the cake
  const isOnCake = (x: number, y: number): boolean => {
    for (let lift = 0; lift <= height; lift += 4) if (isInsideTopFace(geometry, x, y + lift, 0.97)) return true;
    return false;
  };
  let x = point.x - CAKE_CENTER_X, y = point.y - CAKE_BASE_Y + 6;
  if (!isOnCake(x, y)) {
    let snapped = false;
    for (let i = 0; i < SNAP_STEPS && !snapped; i++) {
      x = lerp(x, 0, SNAP_STEP_FRACTION); y = lerp(y, -height / 2, SNAP_STEP_FRACTION);
      snapped = isOnCake(x, y);
    }
    if (!snapped) { // dropped off the cake: removed
      if (dragged.fromCake) { sfx.pickup(); burst(point.x, point.y, 6, '#fff'); }
      return;
    }
  }
  if (cake.toppings.length >= MAX_TOPPINGS) { showToast(t().noRoomForToppings); sfx.fail(); return; }
  cake.toppings.push({ topping: dragged.topping, x, y: y + height, popProgress: 0 });
  sfx.place();
  burst(CAKE_CENTER_X + x, CAKE_BASE_Y + y, 6, ['#fff', '#ffe27a'], { kind: 'star', gravity: 100, maxSpeed: 120 });
}

function countByKind(cake: Cake): [ToppingId, number][] {
  const counts = new Map<ToppingId, number>();
  for (const placed of cake.toppings) counts.set(placed.topping, (counts.get(placed.topping) ?? 0) + 1);
  return [...counts];
}

export const toppingsStation: Station = {
  get name() { return t().stations.toppings; },
  helper: 'toppings',
  isDone: cake => cake.toppings.length > 0,

  drawTools(panel, cake) {
    const { x, y, h } = panel;
    const toppings = todaysMenu().toppings;
    toppings.forEach((topping, i) => {
      const slotX = x + 14 + (i % TRAY_SLOT.columns) * TRAY_SLOT.gapX, slotY = y + 50 + Math.floor(i / TRAY_SLOT.columns) * TRAY_SLOT.gapY;
      const { w, h: slotH } = TRAY_SLOT;
      runtime.toppingTray.push({ x: slotX, y: slotY, w, h: slotH, topping });
      const hovered = pointer.x >= slotX && pointer.x <= slotX + w && pointer.y >= slotY && pointer.y <= slotY + slotH;
      const scale = springScale('tray_' + topping, hovered ? 1.07 : 1);
      ctx.save();
      ctx.translate(slotX + w / 2, slotY + slotH / 2); ctx.scale(scale, scale); ctx.translate(-(slotX + w / 2), -(slotY + slotH / 2));
      drawCardBackground(slotX, slotY, w, slotH, false, hovered);
      drawGlow(slotX + w / 2, slotY + 40, 40, '#ffffff', 0.12);
      drawTopping(topping, slotX + 36, slotY + 44, 1.2);
      drawTopping(topping, slotX + 66, slotY + 48, 1.2);
      drawFittedText(loc(TOPPINGS[topping].name), slotX + w / 2, slotY + 72, 16, w - 8, TEXT.main, 'center', 800);
      ctx.restore();
    });

    // what is on the cake now
    const listY = y + 50 + Math.ceil(toppings.length / TRAY_SLOT.columns) * TRAY_SLOT.gapY + 10;
    const counts = countByKind(cake);
    if (counts.length) drawText(t().onTheCake, x + 20, listY, 18, TEXT.label, 'left', 900);
    counts.forEach(([topping, count], i) => {
      const entryX = x + 120 + (i % 3) * 78, entryY = listY + Math.floor(i / 3) * 28;
      drawTopping(topping, entryX + 8, entryY + 8, 0.8);
      drawText('× ' + count, entryX + 22, entryY, 19, TEXT.main, 'left', 900);
    });
    button('clearToppings', x + 14, y + h - 56, 170, 46, t().removeAll, {
      color: BUTTON_COLOR.secondary, fontSize: 19, disabled: !cake.toppings.length,
      onClick: () => { cake.toppings = []; sfx.poof(); },
    });
  },

  /** Pushok the kitten lays out exactly the ordered toppings. */
  autoComplete() {
    const cake = currentCake();
    if (!requireLayer(cake)) return;
    cake.toppings = arrangeToppings(cake.shape, currentOrder().toppings, cakeHeight(cake)).map((placed, i) => {
      setTimeout(sfx.place, i * AUTO_PLACE_INTERVAL_MS);
      return { ...placed, popProgress: -i * 0.35 };
    });
    runtime.helperKittenJump = 1;
    sfx.meow(1.6, 'happy');
  },

  onPointerDown(point, cake) {
    for (const slot of runtime.toppingTray) {
      if (point.x >= slot.x && point.x <= slot.x + slot.w && point.y >= slot.y && point.y <= slot.y + slot.h) {
        runtime.draggedTopping = { topping: slot.topping, x: point.x, y: point.y, fromCake: false };
        sfx.pickup();
        return true;
      }
    }
    if (!countLayers(cake)) return false;
    const index = toppingIndexAt(point, cake);
    if (index < 0) return false;
    const [picked] = cake.toppings.splice(index, 1);
    runtime.draggedTopping = { topping: picked.topping, x: point.x, y: point.y, fromCake: true };
    sfx.pickup();
    return true;
  },
  onPointerMove(point) {
    const dragged = runtime.draggedTopping;
    if (dragged) { dragged.x = point.x; dragged.y = point.y; }
  },
  onPointerUp(point) {
    if (runtime.draggedTopping) dropTopping(point);
  },
};

/** The topping in hand follows the pointer (drawn on top of everything). */
export function drawDraggedTopping(): void {
  const dragged = runtime.draggedTopping;
  if (!dragged) return;
  drawGlow(dragged.x, dragged.y, 34, '#ffffff', 0.35);
  drawTopping(dragged.topping, dragged.x, dragged.y + 10, 1.4 + 0.06 * Math.sin(clock.time * 10));
}

