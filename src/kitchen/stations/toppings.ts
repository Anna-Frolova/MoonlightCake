// Station 4: drag toppings from the shelf above the cake onto it — on top or on the sides.
import { sfx } from '../../audio/sfx';
import { clock } from '../../core/clock';
import { drawFittedText, drawGlow, drawPanel, drawText } from '../../core/draw';
import { loc } from '../../core/language';
import { easeOutCubic, lerp, type Point } from '../../core/math';
import { burst } from '../../core/particles';
import { BUTTON_COLOR, TEXT } from '../../core/theme';
import { button, pointer } from '../../core/ui';
import { TOPPINGS } from '../../data/ingredients';
import { t } from '../../data/strings';
import type { Cake, ToppingId } from '../../data/types';
import { arrangeToppings, cakeHeight, countLayers, MAX_TOPPINGS } from '../../game/cake';
import { getShapeGeometry, isInsideTopFace } from '../../game/cakeGeometry';
import { isOwned, runtime, todaysMenu } from '../../game/state';
import { drawToppingDish } from '../../render/shelfItems';
import { drawTopping } from '../../render/toppings';
import { showToast } from '../../scenes/sceneManager';
import { cakeTopY, currentCake, currentOrder, requireLayer } from '../kitchen';
import { CAKE_BASE_Y, CAKE_CENTER_X, CLEAR_TOPPINGS_BUTTON, INGREDIENT_SHELF, TOPPING_CHECKLIST, TOPPING_HOLD_OFFSET } from '../layout';
import { drawIngredientShelf, shelfItemHalfWidth, shelfItemXs } from '../widgets';
import type { Station } from './station';
import { judgeChoice } from '../../game/guestReactions';

/** Pick-up radius of a topping already on the cake. */
const PICK_RADIUS = 18;
/** When dropped just off the cake, the topping is nudged towards the centre in this many steps. */
const SNAP_STEPS = 7;
const SNAP_STEP_FRACTION = 0.16;
/** With the helper a press that moved less than this is a tap on the dish: the topping jumps to the cake by itself. */
const TAP_MOVE_LIMIT = 14;
/** That jump: how long it takes and how high its arc goes. */
const TOPPING_JUMP = { seconds: 0.45, arcHeight: 90 };
/** Spots to choose from, on top of one for each topping already on the cake. */
const SPARE_SPOTS = 6;
/** Where the last press on a dish started. */
let grabPoint: Point = { x: 0, y: 0 };

/** Today's toppings, plus a special guest's signature topping (it is never on the menu) at the front. */
function shelfToppings(): ToppingId[] {
  const menu = todaysMenu().toppings;
  const extra = (Object.keys(currentOrder().toppings) as ToppingId[]).filter(topping => !menu.includes(topping));
  return [...extra, ...menu];
}

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
/** Where the carried topping is (and lands): beside the finger on a touch screen, at the cursor with a mouse. */
export function heldToppingPosition(dragged: NonNullable<typeof runtime.draggedTopping>): Point {
  if (!dragged.isTouch) return { x: dragged.x, y: dragged.y };
  const k = Math.min(1, (clock.time - dragged.grabTime) / TOPPING_HOLD_OFFSET.easeSeconds);
  return { x: dragged.x + TOPPING_HOLD_OFFSET.x * k, y: dragged.y + TOPPING_HOLD_OFFSET.y * k };
}

function dropTopping(finger: Point): void {
  const cake = currentCake(), dragged = runtime.draggedTopping!;
  dragged.x = finger.x; dragged.y = finger.y;
  const point = heldToppingPosition(dragged);
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
  if (cake.toppings.length + runtime.jumpingToppings.length >= MAX_TOPPINGS) { showToast(t().noRoomForToppings); sfx.fail(); return; }
  placeTopping(cake, dragged.topping, x, y + height, !dragged.fromCake);
}

/** Puts a topping on the cake (`y` from the centre of the top face); a new one is judged against the order. */
function placeTopping(cake: Cake, topping: ToppingId, x: number, y: number, isNew: boolean): void {
  cake.toppings.push({ topping, x, y, popProgress: 0 });
  // right while it's an ordered kind and there are not more of it than wanted
  const wanted = currentOrder().toppings[topping] ?? 0;
  if (isNew) judgeChoice(cake.toppings.filter(item => item.topping === topping).length <= wanted, 'worried');
  sfx.place();
  burst(CAKE_CENTER_X + x, cakeTopY(cake) + y, 6, ['#fff', '#ffe27a'], { kind: 'star', gravity: 100, maxSpeed: 120 });
}

/** The spot furthest from everything on the cake, among evenly spread ones on its top and front. */
function freeToppingSpot(cake: Cake): Point {
  const taken = [...cake.toppings, ...runtime.jumpingToppings];
  const spots = arrangeToppings(cake.shape, { [cake.toppings[0]?.topping ?? 'strawberry']: taken.length + SPARE_SPOTS }, cakeHeight(cake));
  const clearance = (spot: Point): number => Math.min(Infinity, ...taken.map(item => Math.hypot(item.x - spot.x, item.y - spot.y)));
  return spots.reduce<Point>((best, spot) => (clearance(spot) > clearance(best) ? spot : best), spots[0]);
}

/** Pushok sends one topping from its dish to a free spot on the cake. */
function jumpToCake(cake: Cake, topping: ToppingId, from: Point): void {
  if (!requireLayer(cake)) return;
  if (cake.toppings.length + runtime.jumpingToppings.length >= MAX_TOPPINGS) { showToast(t().noRoomForToppings); sfx.fail(); return; }
  const spot = freeToppingSpot(cake);
  runtime.jumpingToppings.push({ topping, fromX: from.x, fromY: from.y, x: spot.x, y: spot.y, startTime: clock.time });
  runtime.helperKittenJump = 1;
}

/** Lands the toppings that finished their jump (called every frame). */
export function updateJumpingToppings(): void {
  const cake = runtime.cake;
  if (!cake || !runtime.jumpingToppings.length) return;
  const isLanded = (jump: { startTime: number }): boolean => clock.time - jump.startTime >= TOPPING_JUMP.seconds;
  runtime.jumpingToppings.filter(isLanded).forEach(jump => placeTopping(cake, jump.topping, jump.x, jump.y, true));
  runtime.jumpingToppings = runtime.jumpingToppings.filter(jump => !isLanded(jump));
}

/**
 * The checklist left of the cake: every ordered topping as a big icon with how many are on the cake out of how
 * many are wanted (green tick when right, red when too many); toppings that weren't ordered are listed crossed out.
 */
function drawToppingChecklist(cake: Cake): void {
  const order = currentOrder(), { x, y, w, titleH, rowH, iconScale } = TOPPING_CHECKLIST;
  const placed: Partial<Record<ToppingId, number>> = {};
  for (const item of cake.toppings) placed[item.topping] = (placed[item.topping] ?? 0) + 1;
  const wanted = Object.entries(order.toppings) as [ToppingId, number][];
  const extras = (Object.keys(placed) as ToppingId[]).filter(kind => !order.toppings[kind]);
  drawPanel(x, y, w, titleH + (wanted.length + extras.length) * rowH + 10, { radius: 18, noStars: true });
  drawFittedText(t().toppingsNeeded, x + w / 2, y + titleH / 2 + 4, 20, w - 24, TEXT.label, 'center', 900);
  let rowY = y + titleH;
  const row = (kind: ToppingId, label: string, color: string, mark: string | null): void => {
    drawTopping(kind, x + 38, rowY + rowH - 12, iconScale);
    drawText(label, x + 82, rowY + rowH / 2 + 2, 26, color, 'left', 900);
    if (mark) drawText(mark, x + w - 30, rowY + rowH / 2 + 2, 26, color, 'center', 900);
    rowY += rowH;
  };
  for (const [kind, want] of wanted) {
    const got = placed[kind] ?? 0;
    const color = got === want ? BUTTON_COLOR.confirm : got > want ? BUTTON_COLOR.danger : TEXT.main;
    row(kind, `${got} / ${want}`, color, got === want ? '✓' : got > want ? '!' : null);
  }
  for (const kind of extras) row(kind, `${placed[kind]}`, BUTTON_COLOR.danger, '✗'); // not in the order
}

export const toppingsStation: Station = {
  icon: 'toppings',
  get name() { return t().stations.toppings; },
  helper: 'toppings',
  currentHint: cake => (isOwned('helper:toppings') && !cake.toppings.length ? t().toppingTapHint : null),
  isDone: cake => cake.toppings.length > 0,

  /** Dishes of today's toppings on the shelf above the cake; they are dragged from there. */
  drawScenery() {
    const toppings = shelfToppings(), { y, itemHeight } = INGREDIENT_SHELF, halfWidth = shelfItemHalfWidth(toppings.length);
    shelfItemXs(toppings.length).forEach((x, i) => {
      runtime.toppingTray.push({ x: x - halfWidth, y: y - itemHeight, w: halfWidth * 2, h: itemHeight + 36, topping: toppings[i] });
    });
    drawIngredientShelf(toppings, topping => loc(TOPPINGS[topping].name), drawToppingDish, { isHoverable: !runtime.draggedTopping });
  },

  drawOverlay(cake) {
    drawToppingChecklist(cake);
  },

  drawControls(_rightEdge, _y, cake) {
    const clear = CLEAR_TOPPINGS_BUTTON;
    button('clearToppings', clear.x, clear.y, clear.w, clear.h, t().removeAll, {
      color: BUTTON_COLOR.secondary, fontSize: 19, disabled: !cake.toppings.length,
      onClick: () => { cake.toppings = []; runtime.jumpingToppings = []; sfx.poof(); },
    });
  },

  
  onPointerDown(point, cake) {
    for (const slot of runtime.toppingTray) {
      if (point.x >= slot.x && point.x <= slot.x + slot.w && point.y >= slot.y && point.y <= slot.y + slot.h) {
        runtime.draggedTopping = { topping: slot.topping, x: point.x, y: point.y, fromCake: false, grabTime: clock.time, isTouch: pointer.isTouch };
        grabPoint = point;
        sfx.pickup();
        return true;
      }
    }
    if (!countLayers(cake)) return false;
    const index = toppingIndexAt(point, cake);
    if (index < 0) return false;
    const [picked] = cake.toppings.splice(index, 1);
    runtime.draggedTopping = { topping: picked.topping, x: point.x, y: point.y, fromCake: true, grabTime: clock.time, isTouch: pointer.isTouch };
    sfx.pickup();
    return true;
  },
  onPointerMove(point) {
    const dragged = runtime.draggedTopping;
    if (dragged) { dragged.x = point.x; dragged.y = point.y; }
  },
  onPointerUp(point, cake) {
    const dragged = runtime.draggedTopping;
    if (!dragged) return;
    const isTap = !dragged.fromCake && isOwned('helper:toppings') && Math.hypot(point.x - grabPoint.x, point.y - grabPoint.y) < TAP_MOVE_LIMIT;
    if (!isTap) { dropTopping(point); return; }
    runtime.draggedTopping = null;
    jumpToCake(cake, dragged.topping, grabPoint);
  },
};

/** The topping in hand follows the finger, held beside it; Pushok's jump in an arc (drawn on top of everything). */
export function drawDraggedTopping(): void {
  const cake = runtime.cake;
  if (cake) {
    for (const jump of runtime.jumpingToppings) {
      const k = Math.min(1, (clock.time - jump.startTime) / TOPPING_JUMP.seconds), s = easeOutCubic(k);
      const x = lerp(jump.fromX, CAKE_CENTER_X + jump.x, s), y = lerp(jump.fromY, cakeTopY(cake) + jump.y, s) - Math.sin(k * Math.PI) * TOPPING_JUMP.arcHeight;
      drawTopping(jump.topping, x, y, lerp(1.4, 1, k));
    }
  }
  const dragged = runtime.draggedTopping;
  if (!dragged) return;
  const { x, y } = heldToppingPosition(dragged);
  drawGlow(x, y, 34, '#ffffff', 0.35);
  drawTopping(dragged.topping, x, y + 10, 1.4 + 0.06 * Math.sin(clock.time * 10));
}

