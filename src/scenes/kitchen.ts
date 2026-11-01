// The kitchen: the cake in the middle, the order ticket and the station's tools on the left,
// station tabs at the bottom.
import { ctx, SCREEN_W, view } from '../core/canvas';
import { clock } from '../core/clock';
import { drawFittedText, drawGlassPill, drawPanel, drawText, ellipsePath, font, roundRectPath, starPath } from '../core/draw';
import { easeOutCubic, lerp } from '../core/math';
import { drawMotes } from '../core/particles';
import { BUTTON_COLOR, TEXT } from '../core/theme';
import { button } from '../core/ui';
import { loc } from '../core/language';
import { t } from '../data/strings';
import { HELPER_KITTEN } from '../data/cats';
import { helperItemId } from '../data/shop';
import type { Cake } from '../data/types';
import { isCakeReady, serveCake } from '../game/flow';
import { patienceLeft, patienceMood, PATIENCE_LEVELS } from '../game/patience';
import { isOwned, progress, runtime, type Customer, type StationIndex } from '../game/state';
import { currentCake, resetCake } from '../kitchen/kitchen';
import {
  CAKE_BASE_Y, CAKE_CENTER_X, GLAZE_STATION_CAKE_SCALE, GLAZE_STATION_CAKE_X, HELPER_KITTEN_SPOT, KITCHEN_MESSAGE_X, TABS, TICKET, TOOL_PANEL,
  TOP_BAR_HEIGHT,
} from '../kitchen/layout';
import { drawGlazeArc, drawGlazeStationScenery, drawMovingBottles } from '../kitchen/stations/glaze';
import { GLAZE_STATION_INDEX, STATIONS } from '../kitchen/stations';
import { drawMagicStationCircle, drawMagicStrokes } from '../kitchen/stations/magic';
import { drawDraggedTopping } from '../kitchen/stations/toppings';
import { drawCake } from '../render/cake';
import { drawCat, drawPaws } from '../render/cat';
import { drawKitchenBackground } from '../render/environment';
import { drawOrderCard } from '../render/orderCard';
import { drawProgressBar } from '../kitchen/widgets';
import { drawCoinCounter, drawSoundButtons } from './hud';

/** How fast the layout eases into / out of the glaze station arrangement. */
const GLAZE_LAYOUT_SPEED = 7;
const HINT_Y = 72;
const HINT_TEXT_SIZE = 18;
/** Hint pill and toast are centred a bit right of the cake (clear of the left panels). */
const HINT_CENTER_X = KITCHEN_MESSAGE_X;
/** The hint must fit between the tool panel and the order ticket. */
const HINT_MAX_WIDTH = 480;
const PORTRAIT_CAT_SCALE = 0.74;
/** How far below the portrait's centre the cat's head sits (share of the radius): leaves room for the hat. */
const PORTRAIT_HEAD_OFFSET = 0.12;
const PATIENCE_BAR_HEIGHT = 16;

/** Moves the cake aside while the glaze station is open (called every frame). */
export function updateKitchenLayout(dt: number): void {
  const target = runtime.scene === 'kitchen' && runtime.station === GLAZE_STATION_INDEX ? 1 : 0;
  runtime.glazeLayoutBlend += (target - runtime.glazeLayoutBlend) * Math.min(1, dt * GLAZE_LAYOUT_SPEED);
  const eased = easeOutCubic(runtime.glazeLayoutBlend);
  runtime.cakeX = lerp(CAKE_CENTER_X, GLAZE_STATION_CAKE_X, eased);
  runtime.cakeScale = lerp(1, GLAZE_STATION_CAKE_SCALE, eased);
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
  drawToolPanel(cake);
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

/** The order: the guest's face, name and patience on top, the wanted cake below. */
function drawTicket(): void {
  const { x, y, w, h, headerHeight, portraitRadius } = TICKET, customer = runtime.customer!;
  drawPanel(x, y, w, h, { radius: 20, noStars: true });
  const portraitX = x + 18 + portraitRadius, portraitY = y + headerHeight / 2 + 2;
  drawGuestPortrait(customer, portraitX, portraitY, portraitRadius);
  const textX = portraitX + portraitRadius + 16, textW = x + w - 18 - textX;
  drawFittedText(loc(customer.cat.name), textX, y + 34, 20, textW, TEXT.main, 'left', 900);
  if (customer.patience !== null) drawPatienceBar(textX, y + 56, textW, patienceLeft(customer));
  drawOrderCard(customer, x + 10, y + headerHeight, w - 20, h - headerHeight - 10);
}

/** Round portrait of the guest; the face follows their patience and wobbles when they get grumpier. */
function drawGuestPortrait(customer: Customer, cx: number, cy: number, radius: number): void {
  const mood = patienceMood(customer), left = patienceLeft(customer), time = clock.time;
  const wobble = Math.max(0, 1 - (time - customer.moodChangedAt) * 2.5) * Math.sin(time * 40) * 4;
  const ringColor = left < PATIENCE_LEVELS.upset ? BUTTON_COLOR.danger : left < PATIENCE_LEVELS.impatient ? BUTTON_COLOR.gold : TEXT.label;
  ctx.save();
  ctx.translate(wobble, 0);
  ellipsePath(cx, cy, radius, radius); ctx.fillStyle = '#3d2e86'; ctx.fill();
  ctx.save(); ctx.clip();
  // the head is ~150 px above the cat's origin at scale 1 (a bit lower for kittens)
  const scale = PORTRAIT_CAT_SCALE, headLift = 150 * scale * (customer.cat.isKitten ? 0.9 : 1);
  drawCat(customer.cat, cx, cy + headLift + radius * PORTRAIT_HEAD_OFFSET, scale, time, mood);
  ctx.restore();
  ctx.strokeStyle = ringColor; ctx.lineWidth = 3; ellipsePath(cx, cy, radius, radius); ctx.stroke();
  if (mood === 'thinking') { // a drop of sweat
    ctx.fillStyle = '#8fd8ff'; ctx.beginPath();
    ctx.moveTo(cx + radius * 0.75, cy - radius * 0.75); ctx.quadraticCurveTo(cx + radius * 0.95, cy - radius * 0.35, cx + radius * 0.75, cy - radius * 0.3);
    ctx.quadraticCurveTo(cx + radius * 0.55, cy - radius * 0.35, cx + radius * 0.75, cy - radius * 0.75); ctx.fill();
  } else if (mood === 'sad' && customer.patience !== null) { // pulsing anger mark
    const pulse = 1 + 0.15 * Math.sin(time * 8);
    ctx.save(); ctx.translate(cx + radius * 0.8, cy - radius * 0.8); ctx.scale(pulse, pulse);
    ctx.strokeStyle = BUTTON_COLOR.danger; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
    for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) { // four bent strokes around a centre
      ctx.beginPath(); ctx.moveTo(dx * 3, dy * 9); ctx.quadraticCurveTo(dx * 3, dy * 3, dx * 9, dy * 3); ctx.stroke();
    }
    ctx.restore();
  }
  ctx.restore();
}

/** Drains from green through gold to a blinking red as the guest loses patience. */
function drawPatienceBar(x: number, y: number, w: number, left: number): void {
  const color = left < PATIENCE_LEVELS.upset ? BUTTON_COLOR.danger : left < PATIENCE_LEVELS.impatient ? BUTTON_COLOR.gold : BUTTON_COLOR.confirm;
  const blink = left < PATIENCE_LEVELS.upset ? 0.55 + 0.45 * Math.abs(Math.sin(clock.time * 5)) : 1;
  ctx.save(); ctx.globalAlpha = blink;
  drawProgressBar(x, y, w, PATIENCE_BAR_HEIGHT, left, color);
  ctx.restore();
}

function drawToolPanel(cake: Cake): void {
  const panel = TOOL_PANEL, station = STATIONS[runtime.station];
  drawPanel(panel.x, panel.y, panel.w, panel.h, { radius: 20 });
  drawText(station.title?.(cake) ?? station.name, panel.x + 20, panel.y + 25, 23, TEXT.main, 'left', 900);
  const hasHelper = isOwned(helperItemId(station.helper));
  const autoButtonX = panel.x + panel.w - 118;
  if (hasHelper) {
    button('auto', autoButtonX, panel.y + 7, 104, 38, t().auto, { color: BUTTON_COLOR.gold, fontSize: 19, glow: true, onClick: station.autoComplete });
  }
  station.drawHeaderButtons?.(panel, cake, hasHelper ? autoButtonX - 6 : panel.x + panel.w - 14);
  station.drawTools(panel, cake);
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
