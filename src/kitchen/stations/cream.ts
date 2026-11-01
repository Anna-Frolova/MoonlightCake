// Station 2: pipe cream borders along the top edge and around the base.
import { sfx } from '../../audio/sfx';
import { ctx } from '../../core/canvas';
import { clock } from '../../core/clock';
import { drawGlassPill, drawGlow, drawText, ellipsePath } from '../../core/draw';
import { loc } from '../../core/language';
import { randomRange, type Point } from '../../core/math';
import { burst, emitParticle, floatingText } from '../../core/particles';
import { BUTTON_COLOR } from '../../core/theme';
import { pointer } from '../../core/ui';
import { CREAMS } from '../../data/ingredients';
import { t } from '../../data/strings';
import type { Cake, CreamId } from '../../data/types';
import {
  cakeHeight, countLayers, CREAM_DONE_COVERAGE, CREAM_FULL_COVERAGE, createCreamDots, updateCreamCoverage,
} from '../../game/cake';
import { runtime, todaysMenu } from '../../game/state';
import { drawCreamBowl } from '../../render/shelfItems';
import { showToast } from '../../scenes/sceneManager';
import { currentCake, currentOrder, requireLayer } from '../kitchen';
import { CAKE_BASE_Y, CAKE_CENTER_X, CREAM_BRUSH_RADIUS, CREAM_ZONE, STATION_CONTROLS } from '../layout';
import { drawIngredientShelf, drawProgressBar, isOverShelfItem, shelfItemXs } from '../widgets';
import type { Station } from './station';
import { judgeChoice } from '../../game/guestReactions';

/** Minimum seconds between squish sounds while piping. */
const SQUISH_INTERVAL = 0.09;
/** The helper's whisk pipes all beads within this many seconds (plus a short finishing pause). */
const AUTO_PIPE_SECONDS = 0.8;
const AUTO_FINISH_SECONDS = 0.9;
/** Piping progress in the top right corner. */
const PROGRESS_BAR = { w: 200, h: 26 };

function isInCreamZone(point: Point): boolean {
  const height = runtime.cake ? cakeHeight(runtime.cake) : 0;
  return Math.abs(point.x - CAKE_CENTER_X) < CREAM_ZONE.halfWidth
    && point.y > CAKE_BASE_Y - height - CREAM_ZONE.above && point.y < CAKE_BASE_Y + CREAM_ZONE.below;
}

function celebrateCream(cake: Cake, withText: boolean): void {
  cake.creamCompleted = true;
  sfx.chime();
  burst(CAKE_CENTER_X, CAKE_BASE_Y - cakeHeight(cake) / 2, 20, ['#fff', CREAMS[cake.cream!].color], { kind: 'star', gravity: 60 });
  if (withText) floatingText(CAKE_CENTER_X, CAKE_BASE_Y - cakeHeight(cake) - 60, t().niceBorders, '#fff3c4', 24);
}

function selectCream(cream: CreamId): void {
  const cake = currentCake();
  if (runtime.selectedCream !== cream) sfx.squish();
  // switching to a different cream wipes the old borders
  if (runtime.selectedCream !== cream && cake.creamCoverage > 0 && cake.cream !== cream) {
    cake.creamDots?.forEach(dot => { dot.isPiped = false; });
    updateCreamCoverage(cake);
    cake.creamCompleted = false;
    showToast(t().oldCreamRemoved);
    sfx.poof();
  }
  runtime.selectedCream = cream;
}

/** Pipes every bead near the point. */
function pipeAt(point: Point): void {
  const cake = currentCake();
  if (!countLayers(cake) || !runtime.selectedCream) return;
  if (!cake.creamDots) createCreamDots(cake);
  if (cake.cream !== runtime.selectedCream) judgeChoice(runtime.selectedCream === currentOrder().cream, 'surprised', true);
  cake.cream = runtime.selectedCream;
  const localX = point.x - CAKE_CENTER_X, localY = point.y - CAKE_BASE_Y;
  let pipedNow = 0;
  for (const dot of cake.creamDots!) {
    if (dot.isPiped) continue;
    const dx = dot.x - localX, dy = dot.y - localY;
    if (dx * dx + dy * dy < CREAM_BRUSH_RADIUS * CREAM_BRUSH_RADIUS) { dot.isPiped = true; pipedNow++; }
  }
  if (!pipedNow) return;
  updateCreamCoverage(cake);
  if (clock.time - runtime.lastSquishTime > SQUISH_INTERVAL) { sfx.squish(); runtime.lastSquishTime = clock.time; }
  emitParticle({
    x: point.x, y: point.y, vx: randomRange(-40, 40), vy: randomRange(-80, -20), gravity: 300,
    life: 0.5, maxLife: 0.5, size: randomRange(3, 6), color: CREAMS[cake.cream].color,
  });
  if (cake.creamCoverage >= CREAM_FULL_COVERAGE && !cake.creamCompleted) celebrateCream(cake, true);
}

/** Advances the helper's automatic piping (called every frame). */
export function updateAutoCream(dt: number): void {
  const cake = runtime.cake;
  if (runtime.autoCreamTime === null || !cake?.creamDots) return;
  runtime.autoCreamTime += dt;
  let changed = false;
  for (const dot of cake.creamDots) {
    if (!dot.isPiped && (dot.revealAt ?? 0) <= runtime.autoCreamTime) { dot.isPiped = true; changed = true; }
  }
  if (changed) { updateCreamCoverage(cake); if (Math.random() < 0.6) sfx.squish(); }
  if (runtime.autoCreamTime > AUTO_FINISH_SECONDS) {
    cake.creamDots.forEach(dot => { dot.isPiped = true; });
    updateCreamCoverage(cake);
    runtime.autoCreamTime = null;
    if (!cake.creamCompleted) celebrateCream(cake, false);
  }
}

export const creamStation: Station = {
  get name() { return t().stations.cream; },
  helper: 'cream',
  isDone: cake => cake.creamCoverage >= CREAM_DONE_COVERAGE,

  /** Bowls of today's creams on the shelf above the cake; the chosen one is lifted. */
  drawScenery() {
    drawIngredientShelf(todaysMenu().creams, cream => loc(CREAMS[cream].name), drawCreamBowl, {
      isHoverable: !runtime.isPipingCream, lifted: runtime.selectedCream, glowColor: cream => CREAMS[cream].color,
    });
  },

  /** Piping progress, and the cream in the bag right now. */
  /** How much of the borders is piped, as a bar in the top right corner. */
  drawControls(rightEdge, y, cake) {
    const barX = rightEdge - PROGRESS_BAR.w, barY = y + (STATION_CONTROLS.h - PROGRESS_BAR.h) / 2;
    drawGlassPill(barX - 8, y, PROGRESS_BAR.w + 16, STATION_CONTROLS.h);
    drawProgressBar(barX, barY, PROGRESS_BAR.w, PROGRESS_BAR.h, cake.creamCoverage, cake.creamCoverage >= CREAM_DONE_COVERAGE ? BUTTON_COLOR.confirm : BUTTON_COLOR.gold);
    drawText(Math.round(cake.creamCoverage * 100) + '%', barX + PROGRESS_BAR.w / 2, barY + PROGRESS_BAR.h / 2 + 1, 18, '#fff', 'center', 900);
  },

  /** The enchanted whisk pipes the ordered cream bead by bead. */
  autoComplete() {
    const cake = currentCake();
    if (!requireLayer(cake)) return;
    const cream = currentOrder().cream;
    runtime.selectedCream = cream;
    cake.cream = cream;
    if (!cake.creamDots) createCreamDots(cake);
    const dots = cake.creamDots!;
    dots.forEach((dot, i) => { dot.isPiped = false; dot.revealAt = (i / dots.length) * AUTO_PIPE_SECONDS; });
    cake.creamCompleted = false;
    runtime.autoCreamTime = 0;
    sfx.sparkle();
  },

  onPointerDown(point, cake) {
    const creams = todaysMenu().creams, xs = shelfItemXs(creams.length);
    const tapped = creams.find((_, i) => isOverShelfItem(point, xs[i], creams.length));
    if (tapped) { selectCream(tapped); return true; }
    if (!isInCreamZone(point)) return false;
    if (!countLayers(cake)) { showToast(t().needLayerFirst); return true; }
    if (!runtime.selectedCream) { showToast(t().pickCreamOnShelf); return true; }
    runtime.isPipingCream = true;
    pipeAt(point);
    return true;
  },
  onPointerMove(point) {
    if (runtime.isPipingCream) pipeAt(point);
  },
  onPointerUp() {
    runtime.isPipingCream = false;
  },

  /** Dashed nozzle circle following the pointer. */
  drawOverlay(cake) {
    if (!runtime.selectedCream || !countLayers(cake) || !isInCreamZone(pointer)) return;
    drawGlow(pointer.x, pointer.y, 40, CREAMS[runtime.selectedCream].color, 0.35);
    ellipsePath(pointer.x, pointer.y, CREAM_BRUSH_RADIUS, CREAM_BRUSH_RADIUS);
    ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2;
    ctx.setLineDash([5, 5]); ctx.lineDashOffset = -clock.time * 20; ctx.stroke(); ctx.setLineDash([]);
  },
};
