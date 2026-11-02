// Day-1 tutorial: a hint panel walks the player through the first guest's cake step by step. While it runs,
// only the right choice works: the kitchen is veiled except for it (and the order), other presses are ignored.
// Each step completes by itself once the player has done it; the panel can always be skipped.
import { ctx, SCREEN_W, view } from '../core/canvas';
import { clock } from '../core/clock';
import { withAlpha } from '../core/color';
import { drawGlow, drawPanel, drawText, ellipsePath, roundRectPath, starPath, withPopIn, wrapText } from '../core/draw';
import { loc } from '../core/language';
import { lerp, type Point } from '../core/math';
import { BUTTON_COLOR, TEXT, TUTORIAL_COLOR } from '../core/theme';
import { button, ui } from '../core/ui';
import { CREAMS, ESSENCE_ORDER, ESSENCES, FILLINGS, FLAVORS, glazeColorById, SHAPES, TOPPINGS } from '../data/ingredients';
import { ELEMENTS, SIGN_SHAPES } from '../data/elements';
import { t } from '../data/strings';
import type { ElementId, EssenceId, ToppingId } from '../data/types';
import { cakeHeight, countLayers, createCreamDots } from '../game/cake';
import { recipeToDrops } from '../game/colorMixing';
import { progress, runtime, type StationIndex } from '../game/state';
import { clearTutorialGate, finishTutorial, tutorial, tutorialGate, type Rect } from '../game/tutorial';
import { cakeTopY } from '../kitchen/kitchen';
import {
  CAKE_BASE_Y, CAKE_CENTER_X, CREAM_ZONE, FILLING_SHELF, FLAVOR_SHELF, INGREDIENT_SHELF, MAGIC_DRAW_AREA, TABS, TICKET, TOPPING_CHECKLIST, TUTORIAL_GUIDE,
  type ShelfLayout,
} from '../kitchen/layout';
import { GLAZE_STATION_INDEX, STATIONS } from '../kitchen/stations';
import { shelfCreams } from '../kitchen/stations/cream';
import { bottleRect, cauldronRect } from '../kitchen/stations/glaze';
import { shelfFillings, shelfFlavors } from '../kitchen/stations/layers';
import { signPointAt } from '../render/signs';
import { shelfItemHalfWidth, shelfItemXs } from '../kitchen/widgets';

interface TutorialStep {
  /** The hint is shown (and the gate closed) only here, e.g. not while the guest is still walking in. */
  isRelevant(): boolean;
  isDone(): boolean;
  text(): string;
  /** The right choice: lit up, pointed at, and the only place where a press works. */
  targets?(): Rect[];
  /** Where a press may start, when that is wider than the targets (a sign can be drawn anywhere around the cake). */
  pressArea?(): Rect[];
  /** Kept bright without being pressable: where a dragged thing goes. */
  shows?(): Rect[];
  /** Drawn over the veil: shows the gesture (a dashed sign, a drag, the beads still to pipe). */
  drawGuide?(): void;
  /** In the hall only buttons are held back (a tap still skips the guest's typing). */
  buttonsOnly?: boolean;
  /** On the magic step only this element's sign is recognised. */
  magicElement?(): ElementId;
  /** The panel waits for this (the result card's hearts pop in first); the gate is closed all the same. */
  isHintShown?(): boolean;
  /** Shows a "Got it" button that completes the step. */
  needsConfirm?: boolean;
}

/** Where the hint panel sits: clear of the cake, the tools and the speech bubble. */
const COACH = {
  /**
   * Bottom right, beside the cake; on the glaze station (where the cake moves there) top right instead.
   * Moved up if the text is long, so it never covers the station tabs.
   */
  kitchen: { x: 958, y: TABS.y, w: 306 },
  kitchenGlaze: { x: 958, y: 126, w: 306 },
  hallOrder: { x: 36, y: 130, w: 380 },
  /** Under the "next guest" button while the result card fills the left side. */
  hallResult: { x: 770, offsetBelowBubble: 90, w: 480 },
};
const COACH_TEXT_SIZE = 21;
const COACH_LINE_HEIGHT = 28;
/** Gap kept between the kitchen hint panel and the station tabs. */
const COACH_TAB_GAP = 8;
/** The result-card hint waits until the hearts have popped in. */
const SCORE_HINT_DELAY = 1.6;
/** A press the tutorial holds back makes the highlight flash this long. */
const NUDGE_SECONDS = 0.5;
/** Rounding of the bright holes in the veil. */
const HOLE_RADIUS = 18;
/** The drag guide: one trip shelf → cake takes `cycle` s (the last part is a pause), the hand is a glowing dot. */
const DRAG_GUIDE = { cycle: 1.8, travel: 0.75, handRadius: 14, dash: [10, 9], lineWidth: 4, arrowSize: 16 };
/** The dashed sign: dash pattern, line width, arrowheads spread along it, the spark running round it. */
const SIGN_GUIDE = { dash: [16, 12], lineWidth: 6, arrows: 3, arrowSize: 26, sparkSpeed: 0.45, sparkCycle: 1.25, dimWhileDrawing: 0.35 };
/** Beads of cream still to pipe: ring size and pulse speed. */
const BEAD_GUIDE = { radius: 7, pulseSpeed: 5 };

const isTutorialGuest = (): boolean => !!runtime.customer?.isTutorial;
const inKitchen = (): boolean => runtime.scene === 'kitchen' && !!runtime.cake && isTutorialGuest();
const cake = () => runtime.cake!;
const order = () => runtime.customer!.order;
const buttonRect = (id: string): Rect[] => { const found = ui.buttons.find(b => b.id === id); return found ? [found] : []; };

/** Around the cake in the middle of the kitchen: where cream is piped, toppings dropped and signs drawn. */
function cakeRect(): Rect {
  const height = runtime.cake ? cakeHeight(runtime.cake) : 0;
  return {
    x: CAKE_CENTER_X - CREAM_ZONE.halfWidth, y: CAKE_BASE_Y - height - CREAM_ZONE.above,
    w: CREAM_ZONE.halfWidth * 2, h: height + CREAM_ZONE.above + CREAM_ZONE.below,
  };
}

/** One item on a shelf (the same area that reacts to a press, see `isOverShelfItem`). */
function shelfItemRect<T>(items: T[], item: T, shelf: ShelfLayout = INGREDIENT_SHELF): Rect[] {
  const index = items.indexOf(item);
  if (index < 0) return [];
  const x = shelfItemXs(items.length, shelf)[index], halfWidth = shelfItemHalfWidth(items.length, shelf);
  return [{ x: x - halfWidth, y: shelf.y - shelf.itemHeight, w: halfWidth * 2, h: shelf.itemHeight + 36 }];
}

const center = (rect: Rect): Point => ({ x: rect.x + rect.w / 2, y: rect.y + rect.h / 2 });

// ---------------- what each step asks for ----------------

/** The next elixir the ordered colour needs (a bottle already pouring counts), or null when the mix is ready. */
function nextEssence(): EssenceId | null {
  const needed = recipeToDrops(glazeColorById(order().glaze).recipe), drops = cake().cauldron, pouring = runtime.pouringPotion;
  return ESSENCE_ORDER.find(e => drops[e] + (pouring?.essence === e && !pouring.dropAdded ? 1 : 0) < needed[e]) ?? null;
}

/** "orange = red + yellow", from the colour's recipe. */
function recipeText(): string {
  const needed = recipeToDrops(glazeColorById(order().glaze).recipe);
  return ESSENCE_ORDER.filter(e => needed[e] > 0)
    .map(e => (needed[e] > 1 ? `${needed[e]}× ` : '') + loc(ESSENCES[e].name).toLocaleLowerCase()).join(' + ');
}

/** Ordered toppings that still need more on the cake. */
function toppingsStillWanted(): ToppingId[] {
  return (Object.entries(order().toppings) as [ToppingId, number][])
    .filter(([kind, want]) => cake().toppings.filter(placed => placed.topping === kind).length < want).map(([kind]) => kind);
}

/** The "wanted" checklist left of the cake (one row per ordered kind, see `drawToppingChecklist`). */
function toppingChecklistRect(): Rect {
  const { x, y, w, titleH, rowH } = TOPPING_CHECKLIST;
  return { x, y, w, h: titleH + Object.keys(order().toppings).length * rowH + 10 };
}

function toppingDishRect(kind: ToppingId): Rect[] {
  const slot = runtime.toppingTray.find(dish => dish.topping === kind);
  return slot ? [slot] : [];
}

/** A step on a kitchen station: first "open this tab" (only the tab works), then the station's own step. */
function atStation(index: StationIndex, step: Omit<TutorialStep, 'isRelevant'>): TutorialStep {
  const isHere = (): boolean => runtime.station === index, tab = (): Rect[] => buttonRect('tab' + index);
  return {
    isRelevant: inKitchen,
    isDone: () => inKitchen() && step.isDone(),
    text: () => (isHere() ? step.text() : t().tutorial.openTab(STATIONS[index].name)),
    targets: () => (isHere() ? step.targets?.() ?? [] : tab()),
    pressArea: () => (isHere() ? (step.pressArea ?? step.targets)?.() ?? [] : tab()),
    shows: () => (isHere() ? step.shows?.() ?? [] : []),
    drawGuide: () => { if (isHere()) step.drawGuide?.(); },
    magicElement: step.magicElement,
  };
}

const STEPS: TutorialStep[] = [
  { // the guest shows their order
    isRelevant: () => runtime.scene === 'hall' && isTutorialGuest() && runtime.customer?.state === 'ordering',
    isDone: () => runtime.scene === 'kitchen',
    text: () => t().tutorial.order,
    targets: () => buttonRect('acceptOrder'),
    buttonsOnly: true,
  },
  atStation(0, {
    isDone: () => cake().shape === order().shape,
    text: () => t().tutorial.shape(loc(SHAPES[order().shape].name)),
    targets: () => buttonRect('shape_' + order().shape),
  }),
  atStation(0, {
    isDone: () => countLayers(cake()) >= 1,
    text: () => t().tutorial.firstLayer(loc(FLAVORS[order().flavor].name)),
    targets: () => shelfItemRect(shelfFlavors(), order().flavor, FLAVOR_SHELF),
  }),
  atStation(0, { // a filling goes only between two layers
    isDone: () => !order().filling || cake().stack.some(item => item.kind === 'filling'),
    text: () => t().tutorial.filling(loc(FILLINGS[order().filling!].shortName)),
    targets: () => shelfItemRect(shelfFillings(), order().filling!, FILLING_SHELF),
  }),
  atStation(0, {
    isDone: () => countLayers(cake()) >= order().layerCount,
    text: () => t().tutorial.secondLayer,
    targets: () => shelfItemRect(shelfFlavors(), order().flavor, FLAVOR_SHELF),
  }),
  atStation(1, {
    isDone: () => runtime.selectedCream === order().cream || STATIONS[1].isDone(cake()),
    text: () => t().tutorial.creamPick(loc(CREAMS[order().cream].name)),
    targets: () => shelfItemRect(shelfCreams(), order().cream),
  }),
  atStation(1, { // cream goes round the top edge and round the base
    isDone: () => STATIONS[1].isDone(cake()),
    text: () => t().tutorial.creamPipe,
    targets: () => [cakeRect()],
    drawGuide: drawBeadGuide,
  }),
  atStation(GLAZE_STATION_INDEX as StationIndex, { // the first colour is mixed bottle by bottle, then poured
    isDone: () => !!cake().glaze,
    text: () => {
      const essence = nextEssence();
      return essence ? t().tutorial.glazeMix(loc(glazeColorById(order().glaze).name), recipeText(), loc(ESSENCES[essence].name)) : t().tutorial.glazePour;
    },
    targets: () => { const essence = nextEssence(); return essence ? [bottleRect(essence)] : buttonRect('pourGlaze'); },
    shows: () => [cauldronRect()],
    drawGuide: () => {
      const essence = nextEssence();
      if (essence && !runtime.heldPotion && !runtime.pouringPotion) drawDragGuide(center(bottleRect(essence)), center(cauldronRect()));
    },
  }),
  atStation(3, { // toppings are dragged from the shelf
    isDone: () => toppingsStillWanted().length === 0,
    text: () => {
      const [kind] = toppingsStillWanted();
      return t().tutorial.toppings(loc(TOPPINGS[kind].name), order().toppings[kind]!);
    },
    targets: () => toppingsStillWanted().flatMap(toppingDishRect),
    shows: () => [cakeRect(), toppingChecklistRect()],
    drawGuide: () => {
      const [dish] = toppingsStillWanted().flatMap(toppingDishRect);
      if (dish && !runtime.draggedTopping) drawDragGuide(center(dish), { x: CAKE_CENTER_X, y: cakeTopY(cake()) });
    },
  }),
  atStation(4, { // the sign, dashed with arrows, over the cake
    isDone: () => cake().magicQuality !== null,
    text: () => t().tutorial.magic(loc(ELEMENTS[order().element].signName)),
    targets: () => [cakeRect()],
    pressArea: () => [{ x: MAGIC_DRAW_AREA.left, y: MAGIC_DRAW_AREA.top, w: SCREEN_W - MAGIC_DRAW_AREA.left, h: MAGIC_DRAW_AREA.bottom - MAGIC_DRAW_AREA.top }],
    drawGuide: () => drawSignGuide(order().element),
    magicElement: () => order().element,
  }),
  {
    isRelevant: inKitchen,
    isDone: () => ['judging', 'reacting', 'leaving'].includes(runtime.customer?.state ?? ''),
    text: () => t().tutorial.serve,
    targets: () => buttonRect('serveCake'),
  },
  { // the result card
    isRelevant: () => runtime.scene === 'hall' && isTutorialGuest() && runtime.customer?.state === 'reacting',
    isHintShown: () => runtime.customer!.reactionTime > SCORE_HINT_DELAY,
    isDone: () => tutorial.confirmed,
    text: () => t().tutorial.score,
    buttonsOnly: true,
    needsConfirm: true,
  },
];

/** Moves past finished steps and sets what the player may press (called every frame). */
export function updateTutorial(): void {
  if (tutorial.isDone || runtime.scene === 'title') { clearTutorialGate(); return; }
  if (progress.day > 1) { finishTutorial(); return; } // a save from before the tutorial existed
  // a later guest is here (e.g. the page was reloaded after the tutorial guest left): nothing more to teach
  const isGuestScene = runtime.scene === 'hall' || runtime.scene === 'kitchen';
  if (isGuestScene && runtime.customer && !runtime.customer.isTutorial) { finishTutorial(); return; }
  while (tutorial.step < STEPS.length && STEPS[tutorial.step].isDone()) {
    tutorial.step++;
    tutorial.confirmed = false;
    tutorial.shownAt = null;
  }
  if (tutorial.step >= STEPS.length) { finishTutorial(); return; }
  const step = STEPS[tutorial.step];
  if (!step.isRelevant()) { clearTutorialGate(); return; }
  tutorialGate.pressable = (step.pressArea ?? step.targets)?.() ?? [];
  tutorialGate.buttonsOnly = !!step.buttonsOnly;
  tutorialGate.magicElement = step.magicElement?.() ?? null;
}

const currentStep = (): TutorialStep | null => {
  const step = tutorial.isDone || runtime.scene === 'title' ? null : STEPS[tutorial.step];
  return step?.isRelevant() ? step : null;
};

// ---------------- drawing ----------------

/**
 * Darkens the kitchen except the step's targets, the places they go and the order (called by the kitchen scene
 * under the bottle or topping in hand). Each hole is cut with its own clip, so overlapping holes stay bright.
 */
export function drawTutorialVeil(): void {
  const step = currentStep();
  if (!step) return;
  const pad = TUTORIAL_GUIDE.padding, holes = [...(step.targets?.() ?? []), ...(step.shows?.() ?? []), TICKET];
  ctx.save();
  for (const hole of holes) {
    roundRectPath(hole.x - pad, hole.y - pad, hole.w + pad * 2, hole.h + pad * 2, HOLE_RADIUS);
    ctx.rect(view.left, view.top, view.right - view.left, view.bottom - view.top);
    ctx.clip('evenodd');
  }
  ctx.fillStyle = TUTORIAL_COLOR.veil;
  ctx.fillRect(view.left, view.top, view.right - view.left, view.bottom - view.top);
  ctx.restore();
}

function coachPosition(): { x: number; y: number; w: number } {
  if (runtime.scene === 'kitchen') return runtime.station === GLAZE_STATION_INDEX ? COACH.kitchenGlaze : COACH.kitchen;
  if (runtime.customer?.state === 'reacting') {
    const { x, w, offsetBelowBubble } = COACH.hallResult;
    return { x, y: runtime.speechBubbleBottom + offsetBelowBubble, w };
  }
  return COACH.hallOrder;
}

/** Pulsing gold frame around the target (flashing after a held-back press), with a bouncing arrow if `withArrow`. */
function drawHighlight(rect: Rect, withArrow: boolean): void {
  const nudge = tutorial.nudgedAt === null ? 0 : Math.max(0, 1 - (clock.time - tutorial.nudgedAt) / NUDGE_SECONDS);
  const pulse = Math.min(1, 0.5 + 0.5 * Math.sin(clock.time * 5) + nudge), grow = 6 + pulse * 3 + nudge * 8;
  ctx.save();
  ctx.shadowColor = TEXT.gold; ctx.shadowBlur = 18 + nudge * 20;
  ctx.strokeStyle = withAlpha(TEXT.gold, 0.6 + 0.4 * pulse); ctx.lineWidth = 3 + pulse * 2 + nudge * 3;
  roundRectPath(rect.x - grow, rect.y - grow, rect.w + grow * 2, rect.h + grow * 2, HOLE_RADIUS); ctx.stroke();
  if (withArrow) { // above the target, or below it when it is at the top of the screen
    const pointsUp = rect.y < 120, bob = Math.abs(Math.sin(clock.time * 4)) * 10;
    const tipY = pointsUp ? rect.y + rect.h + grow + 6 + bob : rect.y - grow - 6 - bob, direction = pointsUp ? 1 : -1;
    const centerX = rect.x + rect.w / 2;
    ctx.fillStyle = TEXT.gold;
    ctx.beginPath();
    ctx.moveTo(centerX, tipY); ctx.lineTo(centerX - 14, tipY + direction * 18); ctx.lineTo(centerX - 5, tipY + direction * 18);
    ctx.lineTo(centerX - 5, tipY + direction * 34); ctx.lineTo(centerX + 5, tipY + direction * 34); ctx.lineTo(centerX + 5, tipY + direction * 18);
    ctx.lineTo(centerX + 14, tipY + direction * 18); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
}

/** A filled arrowhead with its tip at (x, y), pointing along `angle`. */
function drawArrowhead(x: number, y: number, angle: number, size: number): void {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(angle);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-size, -size * 0.6); ctx.lineTo(-size * 0.7, 0); ctx.lineTo(-size, size * 0.6); ctx.closePath();
  ctx.strokeStyle = TUTORIAL_COLOR.guideUnderlay; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = TUTORIAL_COLOR.guide; ctx.fill();
  ctx.restore();
}

/** A dashed arc from the shelf to where the thing goes, and a glowing "finger" carrying it along again and again. */
function drawDragGuide(from: Point, to: Point): void {
  const control = { x: (from.x + to.x) / 2, y: Math.min(from.y, to.y) - TUTORIAL_GUIDE.arcLift };
  const pointAt = (s: number): Point => ({
    x: lerp(lerp(from.x, control.x, s), lerp(control.x, to.x, s), s),
    y: lerp(lerp(from.y, control.y, s), lerp(control.y, to.y, s), s),
  });
  ctx.save();
  ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(from.x, from.y); ctx.quadraticCurveTo(control.x, control.y, to.x, to.y);
  ctx.setLineDash(DRAG_GUIDE.dash); ctx.lineDashOffset = -clock.time * 30;
  ctx.strokeStyle = TUTORIAL_COLOR.guideUnderlay; ctx.lineWidth = DRAG_GUIDE.lineWidth + 4; ctx.stroke();
  ctx.strokeStyle = TUTORIAL_COLOR.guide; ctx.lineWidth = DRAG_GUIDE.lineWidth; ctx.stroke();
  ctx.setLineDash([]);
  const end = pointAt(0.97);
  drawArrowhead(to.x, to.y, Math.atan2(to.y - end.y, to.x - end.x), DRAG_GUIDE.arrowSize);
  const k = Math.min(1, ((clock.time % DRAG_GUIDE.cycle) / DRAG_GUIDE.cycle) / DRAG_GUIDE.travel);
  const hand = pointAt(k * k * (3 - 2 * k)); // eased: picks up slowly, puts down slowly
  drawGlow(hand.x, hand.y, DRAG_GUIDE.handRadius * 2.4, TUTORIAL_COLOR.guide, 0.6);
  ctx.fillStyle = withAlpha('#ffffff', 0.85); ellipsePath(hand.x, hand.y, DRAG_GUIDE.handRadius, DRAG_GUIDE.handRadius); ctx.fill();
  ctx.restore();
}

/** Pulsing rings on the cream beads still to pipe — along the top edge and round the base. */
function drawBeadGuide(): void {
  const current = cake();
  if (!countLayers(current) || !runtime.selectedCream) return;
  if (!current.creamDots) createCreamDots(current);
  const pulse = 0.5 + 0.5 * Math.sin(clock.time * BEAD_GUIDE.pulseSpeed);
  ctx.save();
  ctx.strokeStyle = withAlpha(TUTORIAL_COLOR.guide, 0.45 + 0.45 * pulse); ctx.lineWidth = 2.5;
  for (const dot of current.creamDots!) {
    if (dot.isPiped) continue;
    ellipsePath(runtime.cakeX + dot.x * runtime.cakeScale, CAKE_BASE_Y + dot.y * runtime.cakeScale, BEAD_GUIDE.radius, BEAD_GUIDE.radius);
    ctx.stroke();
  }
  ctx.restore();
}

/** The sign to draw, big and dashed over the cake: arrows show the way, a spark runs it from the white start dot. */
function drawSignGuide(element: ElementId): void {
  const sign = SIGN_SHAPES[element], size = TUTORIAL_GUIDE.signSize;
  const centerX = CAKE_CENTER_X, centerY = cakeTopY(cake()) - TUTORIAL_GUIDE.aboveCakeTop;
  const points = sign.closed ? [...sign.points, sign.points[0]] : sign.points;
  const toScreen = ([x, y]: [number, number]): Point => ({ x: centerX + (x - 0.5) * size, y: centerY + (y - 0.5) * size });
  const at = (k: number): Point => { const [x, y] = signPointAt(element, centerX, centerY, size, k); return { x, y }; };
  ctx.save();
  ctx.globalAlpha = runtime.magicStroke ? SIGN_GUIDE.dimWhileDrawing : 1;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  points.forEach((point, i) => { const p = toScreen(point); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
  ctx.setLineDash(SIGN_GUIDE.dash); ctx.lineDashOffset = -clock.time * 30; // the dashes march the way to draw
  ctx.strokeStyle = TUTORIAL_COLOR.guideUnderlay; ctx.lineWidth = SIGN_GUIDE.lineWidth + 5; ctx.stroke();
  ctx.strokeStyle = TUTORIAL_COLOR.guide; ctx.lineWidth = SIGN_GUIDE.lineWidth; ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 0; i < SIGN_GUIDE.arrows; i++) {
    const k = (i + 0.5) / SIGN_GUIDE.arrows, before = at(k - 0.01), tip = at(k + 0.01);
    drawArrowhead(tip.x, tip.y, Math.atan2(tip.y - before.y, tip.x - before.x), SIGN_GUIDE.arrowSize);
  }
  const start = toScreen(points[0]), startPulse = 1 + 0.2 * Math.sin(clock.time * 6);
  drawGlow(start.x, start.y, 30, '#ffffff', 0.6);
  ctx.fillStyle = '#ffffff'; ellipsePath(start.x, start.y, 10 * startPulse, 10 * startPulse); ctx.fill();
  const spark = at(Math.min(1, (clock.time * SIGN_GUIDE.sparkSpeed) % SIGN_GUIDE.sparkCycle));
  drawGlow(spark.x, spark.y, 26, ELEMENTS[element].color, 0.9);
  ctx.restore();
}

export function drawTutorial(): void {
  if (runtime.fade) return;
  const step = currentStep();
  if (!step || step.isHintShown?.() === false) { tutorial.shownAt = null; return; }
  tutorial.shownAt ??= clock.time;

  step.drawGuide?.();
  (step.targets?.() ?? []).forEach((target, i) => drawHighlight(target, i === 0));

  const { x, y: preferredY, w } = coachPosition();
  const lines = wrapText(step.text(), w - 40, COACH_TEXT_SIZE, 700);
  const h = 48 + lines.length * COACH_LINE_HEIGHT + 58;
  const y = runtime.scene === 'kitchen' ? Math.min(preferredY, TABS.y - COACH_TAB_GAP - h) : preferredY;
  withPopIn(tutorial.shownAt, x + w / 2, y + h / 2, () => {
    drawPanel(x, y, w, h, { light: true, noStars: true });
    ctx.fillStyle = TEXT.gold; starPath(x + 26, y + 24, 8, 3.2); ctx.fill();
    drawText(t().tutorial.title, x + 40, y + 25, 17, TEXT.gold, 'left', 900);
    lines.forEach((line, i) => drawText(line, x + 20, y + 58 + i * COACH_LINE_HEIGHT, COACH_TEXT_SIZE, TEXT.main, 'left', 700));
    const buttonY = y + h - 50;
    if (step.needsConfirm) {
      button('tutorialGotIt', x + w - 140, buttonY, 124, 38, t().tutorial.gotIt, {
        color: BUTTON_COLOR.confirm, fontSize: 19, onClick: () => { tutorial.confirmed = true; },
      });
    }
    button('tutorialSkip', x + 16, buttonY, 196, 38, t().tutorial.skip, {
      color: BUTTON_COLOR.secondary, fontSize: 17, onClick: finishTutorial,
    });
  });
}
