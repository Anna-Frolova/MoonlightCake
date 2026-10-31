// Day-1 tutorial: a hint panel walks the player through the first guest's cake step by step.
// Each step completes by itself once the player has done it; the panel can always be skipped.
import { ctx } from '../core/canvas';
import { clock } from '../core/clock';
import { drawPanel, drawText, roundRectPath, starPath, withPopIn, wrapText } from '../core/draw';
import { BUTTON_COLOR, TEXT } from '../core/theme';
import { button, ui } from '../core/ui';
import { t } from '../data/strings';
import { cakeHeight, countLayers } from '../game/cake';
import { availableEssences, progress, runtime, type StationIndex } from '../game/state';
import { finishTutorial, tutorial } from '../game/tutorial';
import { totalDrops } from '../game/colorMixing';
import { CAKE_BASE_Y, CAKE_CENTER_X, CREAM_ZONE, ELIXIR_SHELF, TOOL_PANEL } from '../kitchen/layout';
import { STATIONS } from '../kitchen/stations';

interface Rect { x: number; y: number; w: number; h: number }

interface TutorialStep {
  /** The hint is shown only here (e.g. not while the guest is still walking in). */
  isRelevant(): boolean;
  isDone(): boolean;
  text(): string;
  /** What to highlight with a glowing frame and an arrow. */
  target?(): Rect | null;
  /** Shows a "Got it" button that completes the step. */
  needsConfirm?: boolean;
}

/** Where the hint panel sits: clear of the cake, the tools and the speech bubble. */
const COACH = {
  kitchen: { x: 930, y: 170, w: 334 },
  hallOrder: { x: 36, y: 130, w: 380 },
  /** Under the "next guest" button while the result card fills the left side. */
  hallResult: { x: 770, offsetBelowBubble: 90, w: 480 },
};
const COACH_TEXT_SIZE = 16;
const COACH_LINE_HEIGHT = 22;
/** The result-card hint waits until the hearts have popped in. */
const SCORE_HINT_DELAY = 1.6;

const inKitchen = (): boolean => runtime.scene === 'kitchen' && !!runtime.cake;
const buttonRect = (id: string): Rect | null => ui.buttons.find(b => b.id === id) ?? null;

/** Around the cake in the middle of the kitchen: where cream is piped and signs are drawn. */
function cakeRect(): Rect {
  const height = runtime.cake ? cakeHeight(runtime.cake) : 0;
  return {
    x: CAKE_CENTER_X - CREAM_ZONE.halfWidth, y: CAKE_BASE_Y - height - CREAM_ZONE.above,
    w: CREAM_ZONE.halfWidth * 2, h: height + CREAM_ZONE.above + CREAM_ZONE.below,
  };
}

/** A kitchen step: first "open this tab", then the station's own hint. */
function stationStep(index: StationIndex, text: () => string, target: () => Rect | null): TutorialStep {
  return {
    isRelevant: inKitchen,
    isDone: () => !!runtime.cake && STATIONS[index].isDone(runtime.cake),
    text: () => (runtime.station === index ? text() : t().tutorial.openTab(STATIONS[index].name)),
    target: () => (runtime.station === index ? target() : buttonRect('tab' + index)),
  };
}

const STEPS: TutorialStep[] = [
  { // the first guest shows their order
    isRelevant: () => runtime.scene === 'hall' && runtime.customer?.state === 'ordering',
    isDone: () => runtime.scene === 'kitchen',
    text: () => t().tutorial.order,
    target: () => buttonRect('acceptOrder'),
  },
  stationStep(0, () => t().tutorial.layers, () => TOOL_PANEL),
  stationStep(1, () => t().tutorial.cream, () => (runtime.selectedCream ? cakeRect() : TOOL_PANEL)),
  stationStep(2,
    () => (runtime.cake && totalDrops(runtime.cake.cauldron) ? t().tutorial.glazePour : t().tutorial.glazeMix),
    () => runtime.cake && totalDrops(runtime.cake.cauldron) ? buttonRect('pourGlaze') : {
      x: ELIXIR_SHELF.firstX - 40, y: ELIXIR_SHELF.y - 100,
      w: (availableEssences().length - 1) * ELIXIR_SHELF.spacing + 80, h: 124,
    }),
  stationStep(3, () => t().tutorial.toppings, () => TOOL_PANEL),
  stationStep(4, () => t().tutorial.magic, cakeRect),
  {
    isRelevant: inKitchen,
    isDone: () => ['judging', 'reacting', 'leaving'].includes(runtime.customer?.state ?? ''),
    text: () => t().tutorial.serve,
    target: () => buttonRect('serveCake'),
  },
  { // the result card
    isRelevant: () => runtime.scene === 'hall' && runtime.customer?.state === 'reacting' && runtime.customer.reactionTime > SCORE_HINT_DELAY,
    isDone: () => tutorial.confirmed || (progress.guestIndex >= 1 && !['judging', 'reacting'].includes(runtime.customer?.state ?? '')),
    text: () => t().tutorial.score,
    needsConfirm: true,
  },
  { // the second guest wants two layers with a filling
    isRelevant: () => inKitchen() && runtime.station === 0 && !!runtime.customer?.order.filling,
    isDone: () => progress.guestIndex >= 2 || (inKitchen() && !!runtime.customer?.order.filling && countLayers(runtime.cake!) >= 2),
    text: () => t().tutorial.filling,
    target: () => TOOL_PANEL,
  },
];

/** Moves past finished steps (called every frame). */
export function updateTutorial(): void {
  if (tutorial.isDone || runtime.scene === 'title') return;
  if (progress.day > 1) { finishTutorial(); return; } // a save from before the tutorial existed
  while (tutorial.step < STEPS.length && STEPS[tutorial.step].isDone()) {
    tutorial.step++;
    tutorial.confirmed = false;
    tutorial.shownAt = null;
  }
  if (tutorial.step >= STEPS.length) finishTutorial();
}

function coachPosition(): { x: number; y: number; w: number } {
  if (runtime.scene === 'kitchen') return COACH.kitchen;
  if (runtime.customer?.state === 'reacting') {
    const { x, w, offsetBelowBubble } = COACH.hallResult;
    return { x, y: runtime.speechBubbleBottom + offsetBelowBubble, w };
  }
  return COACH.hallOrder;
}

/** Pulsing gold frame around the target and a bouncing arrow pointing at it. */
function drawHighlight(rect: Rect): void {
  const pulse = 0.5 + 0.5 * Math.sin(clock.time * 5), grow = 6 + pulse * 3;
  ctx.save();
  ctx.shadowColor = TEXT.gold; ctx.shadowBlur = 18;
  ctx.strokeStyle = `rgba(255,226,122,${0.6 + 0.4 * pulse})`; ctx.lineWidth = 3 + pulse * 2;
  roundRectPath(rect.x - grow, rect.y - grow, rect.w + grow * 2, rect.h + grow * 2, 18); ctx.stroke();
  // above the target, or below it when it is at the top of the screen
  const pointsUp = rect.y < 120, bob = Math.abs(Math.sin(clock.time * 4)) * 10;
  const tipY = pointsUp ? rect.y + rect.h + grow + 6 + bob : rect.y - grow - 6 - bob, direction = pointsUp ? 1 : -1;
  const centerX = rect.x + rect.w / 2;
  ctx.fillStyle = TEXT.gold;
  ctx.beginPath();
  ctx.moveTo(centerX, tipY); ctx.lineTo(centerX - 14, tipY + direction * 18); ctx.lineTo(centerX - 5, tipY + direction * 18);
  ctx.lineTo(centerX - 5, tipY + direction * 34); ctx.lineTo(centerX + 5, tipY + direction * 34); ctx.lineTo(centerX + 5, tipY + direction * 18);
  ctx.lineTo(centerX + 14, tipY + direction * 18); ctx.closePath(); ctx.fill();
  ctx.restore();
}

export function drawTutorial(): void {
  if (tutorial.isDone || runtime.fade || runtime.scene === 'title') return;
  const step = STEPS[tutorial.step];
  if (!step?.isRelevant()) { tutorial.shownAt = null; return; }
  tutorial.shownAt ??= clock.time;

  const target = step.target?.();
  if (target) drawHighlight(target);

  const { x, y, w } = coachPosition();
  const lines = wrapText(step.text(), w - 40, COACH_TEXT_SIZE, 700);
  const h = 48 + lines.length * COACH_LINE_HEIGHT + 58;
  withPopIn(tutorial.shownAt, x + w / 2, y + h / 2, () => {
    drawPanel(x, y, w, h, { light: true, noStars: true });
    ctx.fillStyle = TEXT.gold; starPath(x + 26, y + 24, 8, 3.2); ctx.fill();
    drawText(t().tutorial.title, x + 40, y + 25, 14, TEXT.gold, 'left', 900);
    lines.forEach((line, i) => drawText(line, x + 20, y + 54 + i * COACH_LINE_HEIGHT, COACH_TEXT_SIZE, TEXT.main, 'left', 700));
    const buttonY = y + h - 50;
    if (step.needsConfirm) {
      button('tutorialGotIt', x + w - 140, buttonY, 124, 38, t().tutorial.gotIt, {
        color: BUTTON_COLOR.confirm, fontSize: 16, onClick: () => { tutorial.confirmed = true; },
      });
    }
    button('tutorialSkip', x + 16, buttonY, 196, 38, t().tutorial.skip, {
      color: BUTTON_COLOR.secondary, fontSize: 14, onClick: finishTutorial,
    });
  });
}
