// The kitchen: the cake in the middle with the station's shelf or switches around it, the order (the guest
// and the wanted cake) on the left, station buttons in the top right corner, station tabs at the bottom.
import { ctx, SCREEN_W, view } from '../core/canvas';
import { clock } from '../core/clock';
import { drawFittedText, drawGlassPill, drawGlow, drawPanel, drawText, ellipsePath, font, roundRectPath, starPath } from '../core/draw';
import { easeOutCubic, lerp } from '../core/math';
import { burst, drawMotes } from '../core/particles';
import { sfx } from '../audio/sfx';
import { BUTTON_COLOR, TEXT } from '../core/theme';
import { button } from '../core/ui';
import { loc } from '../core/language';
import { t } from '../data/strings';
import { HELPER_KITTEN } from '../data/cats';
import { helperItemId } from '../data/shop';
import type { Cake } from '../data/types';
import { isCakeReady, serveCake } from '../game/flow';
import { patienceBarValue, patienceLeft, patienceMood, PATIENCE_CALM_MARK, PATIENCE_LEVELS } from '../game/patience';
import { currentReaction, reactionMood, updateGaze } from '../game/guestReactions';
import { activeGuestTheme, isOwned, progress, runtime, type Customer, type StationIndex } from '../game/state';
import { currentCake, resetCake } from '../kitchen/kitchen';
import {
  AUTO_BUTTON, CAKE_BASE_Y, CAKE_CENTER_X, GLAZE_STATION_CAKE_SCALE, GLAZE_STATION_CAKE_X, HELPER_KITTEN_SPOT, KITCHEN_MESSAGE_X, STATION_CONTROLS, TABS,
  TICKET, TOP_BAR_HEIGHT,
} from '../kitchen/layout';
import { drawGlazeArc, drawGlazeStationScenery, drawMovingBottles } from '../kitchen/stations/glaze';
import { GLAZE_STATION_INDEX, STATIONS, TOPPINGS_STATION_INDEX } from '../kitchen/stations';
import { drawMagicStationCircle, drawMagicStrokes } from '../kitchen/stations/magic';
import { drawDraggedTopping } from '../kitchen/stations/toppings';
import { drawCake } from '../render/cake';
import { drawAngerMark, drawCat, drawPaws } from '../render/cat';
import { drawKitchenAmbience, drawKitchenBackground } from '../render/environment';
import { kitchenTheme } from '../render/kitchenThemes';
import { drawOrderCard } from '../render/orderCard';
import { drawProgressBar } from '../kitchen/widgets';
import { drawCoinCounter, drawSoundButtons } from './hud';

/** How fast the layout eases into / out of the glaze station arrangement. */
const GLAZE_LAYOUT_SPEED = 7;
/** How long the kitchen takes to transform for a special guest. */
const KITCHEN_TRANSFORM_SECONDS = 1.3;
const HINT_Y = 72;
const HINT_TEXT_SIZE = 18;
/** The situational hint is centred over the cake. */
const HINT_CENTER_X = KITCHEN_MESSAGE_X;
/** The hint must not reach the station buttons in the top right. */
const HINT_MAX_WIDTH = 480;
/** The guest's window: cat scale, where the head sits (share of the height), where sweat / anger marks go (from the head). */
const PORTRAIT = { catScale: 1, headAt: 0.6, markOffset: { x: 82, y: -62 } };
const PATIENCE_BAR_HEIGHT = 16;

/** Moves the cake aside while the glaze station is open (called every frame). */
export function updateKitchenLayout(dt: number): void {
  const target = runtime.scene === 'kitchen' && runtime.station === GLAZE_STATION_INDEX ? 1 : 0;
  runtime.glazeLayoutBlend += (target - runtime.glazeLayoutBlend) * Math.min(1, dt * GLAZE_LAYOUT_SPEED);
  const eased = easeOutCubic(runtime.glazeLayoutBlend);
  runtime.cakeX = lerp(CAKE_CENTER_X, GLAZE_STATION_CAKE_X, eased);
  runtime.cakeScale = lerp(1, GLAZE_STATION_CAKE_SCALE, eased);
  updateKitchenTheme(dt);
}

/** A special guest's kitchen spreads out from the cake once the scene has faded in. */
function updateKitchenTheme(dt: number): void {
  const theme = activeGuestTheme();
  if (!theme) { runtime.kitchenThemeBlend = 0; return; }
  if (runtime.scene !== 'kitchen' || runtime.fade || runtime.kitchenThemeBlend >= 1) return;
  if (runtime.kitchenThemeBlend === 0) {
    sfx.transform();
    burst(CAKE_CENTER_X, CAKE_BASE_Y - 120, 40, kitchenTheme(theme).sparkColors, { kind: 'star', gravity: 60, maxSpeed: 420 });
  }
  runtime.kitchenThemeBlend = Math.min(1, runtime.kitchenThemeBlend + dt / KITCHEN_TRANSFORM_SECONDS);
}

export function selectStation(index: StationIndex): void {
  runtime.station = index;
}

export function renderKitchen(): void {
  const cake = currentCake(), time = clock.time, station = STATIONS[runtime.station];
  drawKitchenBackground(time);
  drawGlazeStationScenery(cake);
  if (isOwned('helper:toppings') && runtime.glazeLayoutBlend < 0.3) drawHelperKitten();
  drawMagicStationCircle();
  station.drawScenery?.(cake);
  drawCake(cake, runtime.cakeX, CAKE_BASE_Y, runtime.cakeScale);
  station.drawOverlay?.(cake);
  drawMotes();
  drawKitchenAmbience(time);

  // situational message (e.g. "already decorated — reset to change")
  const hint = station.currentHint?.(cake);
  if (hint) {
    ctx.font = font(HINT_TEXT_SIZE, 800);
    const hintW = Math.min(HINT_MAX_WIDTH, ctx.measureText(hint).width + 48);
    drawGlassPill(HINT_CENTER_X - hintW / 2, HINT_Y, hintW, 40);
    drawFittedText(hint, HINT_CENTER_X, HINT_Y + 21, HINT_TEXT_SIZE, hintW - 32, TEXT.main, 'center', 800);
  }

  drawMagicStrokes();
  drawGlazeArc(cake);
  drawTopBar();
  drawTicket();
  drawStationControls(cake);
  drawStationTabs(cake);
  drawMovingBottles();
  drawDraggedTopping();
}

function drawHelperKitten(): void {
  const jump = Math.sin(runtime.helperKittenJump * Math.PI) * 30, { x, y, scale } = HELPER_KITTEN_SPOT;
  drawCat(HELPER_KITTEN, x, y - jump, scale, clock.time, runtime.helperKittenJump > 0 ? 'happy' : 'neutral');
  drawPaws(HELPER_KITTEN, x, y - 24 - jump, scale);
}

function drawTopBar(): void {
  const bar = ctx.createLinearGradient(0, 0, 0, TOP_BAR_HEIGHT);
  bar.addColorStop(0, 'rgba(30,18,80,0.92)'); bar.addColorStop(1, 'rgba(14,8,44,0.92)');
  ctx.fillStyle = bar; ctx.fillRect(view.left, view.top, view.right - view.left, TOP_BAR_HEIGHT - view.top);
  ctx.fillStyle = 'rgba(159,234,255,0.35)'; ctx.fillRect(view.left, TOP_BAR_HEIGHT - 1, view.right - view.left, 1.5);
  drawText(t().dayAndGuest(progress.day, progress.guestIndex + 1, progress.guestQueue!.length), 24, 31, 21, TEXT.main, 'left', 800);
  drawCoinCounter(250, 8);
  drawSoundButtons(420, 8);
  button('resetCake', SCREEN_W - 400, 8, 160, 46, t().reset, { color: BUTTON_COLOR.reset, fontSize: 21, onClick: resetCake });
  button('serveCake', SCREEN_W - 228, 8, 212, 46, t().serveCake, { color: BUTTON_COLOR.confirm, fontSize: 22, glow: isCakeReady(), onClick: serveCake });
}

/** The order: the guest in a big window, name and patience under it, the wanted cake below. */
function drawTicket(): void {
  const { x, y, w, h, portraitHeight, nameY, patienceY, cardY } = TICKET, customer = runtime.customer!;
  drawPanel(x, y, w, h, { radius: 20, noStars: true });
  drawGuestPortrait(customer, x + 10, y + 10, w - 20, portraitHeight);
  drawFittedText(loc(customer.cat.name), x + 20, y + nameY, 22, w - 40, TEXT.main, 'left', 900);
  if (customer.patience !== null) drawPatienceBar(x + 20, y + patienceY, w - 40, customer);
  // on the toppings station the wanted cake is shown without its magic, so its toppings are easy to see
  drawOrderCard(customer, x + 10, y + cardY, w - 20, h - cardY - 10, runtime.station === TOPPINGS_STATION_INDEX);
}

/**
 * The guest from the hat to the chest. They look where the player works, react to their choices for a moment
 * (game/guestReactions.ts), otherwise their face follows their patience; the window wobbles when they get upset.
 */
function drawGuestPortrait(customer: Customer, x: number, y: number, w: number, h: number): void {
  const reaction = currentReaction(), left = patienceLeft(customer), time = clock.time;
  const mood = reaction ? reactionMood() : patienceMood(customer);
  const wobble = Math.max(0, 1 - (time - customer.moodChangedAt) * 2.5) * Math.sin(time * 40) * 5;
  const frameColor = left < PATIENCE_LEVELS.upset ? BUTTON_COLOR.danger : left < PATIENCE_LEVELS.impatient ? BUTTON_COLOR.gold : TEXT.label;
  ctx.save();
  ctx.translate(wobble, 0);
  const backdrop = ctx.createLinearGradient(0, y, 0, y + h);
  backdrop.addColorStop(0, '#2c1a62'); backdrop.addColorStop(1, '#4a2f8e');
  ctx.fillStyle = backdrop; roundRectPath(x, y, w, h, 16); ctx.fill();
  const headX = x + w / 2, headY = y + h * PORTRAIT.headAt;
  ctx.save(); roundRectPath(x, y, w, h, 16); ctx.clip();
  drawGlow(headX, headY, h * 0.8, '#c9b6ff', 0.25);
  // the head is ~150 px above the cat's origin at scale 1 (a bit lower for kittens)
  const headLift = 150 * PORTRAIT.catScale * (customer.cat.isKitten ? 0.9 : 1);
  drawCat(customer.cat, headX, headY + headLift, PORTRAIT.catScale, time, mood, updateGaze(headX, headY, clock.delta));
  ctx.restore();
  ctx.strokeStyle = frameColor; ctx.lineWidth = 3; roundRectPath(x + 1.5, y + 1.5, w - 3, h - 3, 15); ctx.stroke();
  const sideX = headX + PORTRAIT.markOffset.x, sideY = headY + PORTRAIT.markOffset.y;
  if (reaction === 'surprised' || reaction === 'worried') drawReactionMark(reaction, sideX, sideY, time);
  else if (mood === 'thinking') { // a drop of sweat
    ctx.fillStyle = '#8fd8ff'; ctx.beginPath();
    ctx.moveTo(sideX, sideY - 16); ctx.quadraticCurveTo(sideX + 11, sideY + 4, sideX, sideY + 8);
    ctx.quadraticCurveTo(sideX - 11, sideY + 4, sideX, sideY - 16); ctx.fill();
  } else if (mood === 'angry') drawAngerMark(sideX, sideY, 1.5, time); // a sad guest just has a tear (drawn on the face)
  ctx.restore();
}

/** "!" for surprise, "?" for worry — popping in beside the head (a pleased guest just shows it on their face). */
function drawReactionMark(reaction: 'surprised' | 'worried', x: number, y: number, time: number): void {
  const pop = 1 + 0.12 * Math.sin(time * 9);
  ctx.save(); ctx.translate(x, y); ctx.scale(pop, pop);
  ctx.shadowColor = 'rgba(20,10,50,0.9)'; ctx.shadowBlur = 6;
  drawText(reaction === 'surprised' ? '!' : '?', 0, 0, 48, reaction === 'surprised' ? TEXT.gold : '#8fd8ff', 'center', 900);
  ctx.restore();
}

/**
 * Drains steadily from the start; a notch marks where the calm part ends. Green before it, then gold,
 * blinking red when the guest is about to run out of patience.
 */
function drawPatienceBar(x: number, y: number, w: number, customer: Customer): void {
  const value = patienceBarValue(customer), left = patienceLeft(customer);
  const color = left < PATIENCE_LEVELS.upset ? BUTTON_COLOR.danger : value < PATIENCE_CALM_MARK ? BUTTON_COLOR.gold : BUTTON_COLOR.confirm;
  const blink = left < PATIENCE_LEVELS.upset ? 0.55 + 0.45 * Math.abs(Math.sin(clock.time * 5)) : 1;
  ctx.save(); ctx.globalAlpha = blink;
  drawProgressBar(x, y, w, PATIENCE_BAR_HEIGHT, value, color);
  ctx.restore();
  const markX = x + w * PATIENCE_CALM_MARK; // the notch: a line through the bar and a small triangle above it
  ctx.fillStyle = 'rgba(255,255,255,0.75)';
  ctx.fillRect(markX - 1, y - 2, 2, PATIENCE_BAR_HEIGHT + 4);
  ctx.beginPath(); ctx.moveTo(markX - 5, y - 8); ctx.lineTo(markX + 5, y - 8); ctx.lineTo(markX, y - 2); ctx.closePath(); ctx.fill();
}

/** "Auto" (once the helper is bought) right of the cake under the side button; the station's own buttons. */
function drawStationControls(cake: Cake): void {
  const station = STATIONS[runtime.station], auto = AUTO_BUTTON;
  if (isOwned(helperItemId(station.helper))) {
    button('auto', auto.x, auto.y, auto.w, auto.h, t().auto, { color: BUTTON_COLOR.gold, fontSize: 22, glow: true, onClick: station.autoComplete });
  }
  station.drawControls?.(STATION_CONTROLS.right, STATION_CONTROLS.y, cake);
}

function drawStationTabs(cake: Cake): void {
  const nextIndex = STATIONS.findIndex(station => !station.isDone(cake));
  const tabW = (SCREEN_W - TABS.sideMargin * 2 - TABS.gap * (STATIONS.length - 1)) / STATIONS.length;
  STATIONS.forEach((station, i) => {
    const x = TABS.sideMargin + i * (tabW + TABS.gap), isSelected = runtime.station === i, isDone = station.isDone(cake);
    button('tab' + i, x, TABS.y, tabW, TABS.h, '', {
      sound: 'tab', hoverScale: 1.04, onClick: () => selectStation(i as StationIndex),
      draw: (bx, by, bw, bh, hovered) => {
        ctx.save();
        if (isSelected) {
          ctx.shadowColor = 'rgba(155,107,255,0.8)'; ctx.shadowBlur = 22;
          const fill = ctx.createLinearGradient(0, by, 0, by + bh);
          fill.addColorStop(0, '#b48cff'); fill.addColorStop(1, '#6a3fd8');
          ctx.fillStyle = fill; roundRectPath(bx, by, bw, bh, bh / 2); ctx.fill();
          ctx.shadowBlur = 0;
          ctx.fillStyle = 'rgba(255,255,255,0.28)'; roundRectPath(bx + 10, by + 3, bw - 20, bh * 0.4, bh / 3); ctx.fill();
        } else {
          if (nextIndex === i) { ctx.shadowColor = `rgba(140,230,255,${0.5 + 0.35 * Math.sin(clock.time * 5)})`; ctx.shadowBlur = 20; } // suggested next step
          drawGlassPill(bx, by, bw, bh, hovered ? 0.95 : 0.8);
        }
        ctx.restore();
        drawFittedText(`${i + 1}  ${station.name}`, bx + bw / 2 - (isDone ? 14 : 0), by + bh / 2, 22, bw - (isDone ? 64 : 36), isSelected ? '#fff' : TEXT.main, 'center', 900);
        if (isDone) {
          ctx.save();
          ctx.shadowColor = BUTTON_COLOR.confirm; ctx.shadowBlur = 10;
          ellipsePath(bx + bw - 28, by + bh / 2, 12, 12); ctx.fillStyle = BUTTON_COLOR.confirm; ctx.fill();
          ctx.restore();
          drawText('✓', bx + bw - 28, by + bh / 2 + 1, 15, '#fff', 'center', 900);
        } else if (i === STATIONS.length - 1) { // magic is required: a star until it's done
          ctx.fillStyle = TEXT.gold; starPath(bx + 20, by + bh / 2, 8, 3.5); ctx.fill();
        }
      },
    });
  });
}
