// The kitchen: the cake in the middle with the station's shelf or switches around it, the order (the guest
// and the wanted cake in their thought cloud) on the left, station buttons in the top right corner, station tabs
// and "Serve" at the bottom.
import { ctx, SCREEN_W, view } from '../core/canvas';
import { clock } from '../core/clock';
import { shade, withAlpha } from '../core/color';
import { drawFittedText, drawGlassPill, drawGlow, drawText, ellipsePath, font, roundRectPath, withPopIn, wrapText } from '../core/draw';
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
import { patienceBarValue, patienceLeft, PATIENCE_CALM_MARK, PATIENCE_LEVELS } from '../game/patience';
import { currentReaction, guestMood, headPose, reactionMood, updateGaze } from '../game/guestReactions';
import { currentComment, GUEST_COMMENTS } from '../game/guestComments';
import { orderChangeGlow } from '../game/orderChange';
import { activeGuestTheme, isOwned, progress, runtime, type Customer, type StationIndex } from '../game/state';
import { currentCake, resetCake } from '../kitchen/kitchen';
import {
  AUTO_BUTTON, KITCHEN_TOP, RESET_BUTTON, SERVE_BUTTON, SETTINGS_PANEL, CAKE_BASE_Y, CAKE_CENTER_X, GLAZE_STATION_CAKE_SCALE, GLAZE_STATION_CAKE_X, HELPER_KITTEN_SPOT, KITCHEN_MESSAGE_X, STATION_CONTROLS, TABS,
  GUEST_COMMENT, GUEST_WINDOW, THOUGHT_CLOUD, TOP_BAR_HEIGHT,
} from '../kitchen/layout';
import { drawGlazeArc, drawGlazeStationScenery, drawMovingBottles, hasUnpouredGlaze, offerShadeHint, remindToPour } from '../kitchen/stations/glaze';
import { GLAZE_STATION_INDEX, STATIONS, TOPPINGS_STATION_INDEX } from '../kitchen/stations';
import { drawMagicStationCircle, drawMagicStrokes } from '../kitchen/stations/magic';
import { drawDraggedTopping } from '../kitchen/stations/toppings';
import { drawCake } from '../render/cake';
import { drawAngerMark, drawCat, drawPaws } from '../render/cat';
import { drawStationIcon } from '../render/icons';
import { drawKitchenAmbience, drawKitchenBackground } from '../render/environment';
import { kitchenTheme } from '../render/kitchenThemes';
import { drawOrderCake } from '../render/orderCard';
import { drawProgressBar } from '../kitchen/widgets';
import { drawCoinCounter, drawNameTag, drawSettingsButton, drawSettingsPanel } from './hud';
import { showModal } from './sceneManager';
import { drawTutorialVeil } from './tutorial';

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
const PATIENCE_BAR_HEIGHT = GUEST_WINDOW.patienceHeight;
/** The thought cloud: a pale lilac gradient with a white rim and a soft violet glow under it. */
const CLOUD_LOOK = { top: '#f3edff', bottom: '#c9b8f4', rim: 'rgba(255,255,255,0.9)', rimWidth: 4, shadow: 'rgba(120,90,230,0.55)', shadowBlur: 26 };
/** The dark backing under the patience bar, so it reads over any kitchen. */
const PATIENCE_BACKING = { pad: 5, color: 'rgba(14,8,44,0.7)' };
/** The compact day counter: a golden crescent moon, then "day · guest/guests". */
const DAY_COUNTER = { moonRadius: 12, moonBite: { x: 0.45, y: -0.2, radius: 0.8 }, textOffset: 22, textSize: 22, moonColor: '#ffd76a' };
/** The bin on the reset button. */
const BIN = { color: '#ffffff', lidW: 24, bodyTopW: 18, bodyBottomW: 14, bodyH: 18 };
/** The guest's comment bubble: pale like the thought cloud, dark text. */
const COMMENT_LOOK = { fill: '#f3edff', text: '#3a2a6e', shadow: 'rgba(20,10,50,0.6)', fadeSeconds: 0.3 };
/** How fast the changed order's frame pulses. */
const CHANGED_ORDER_PULSE_SPEED = 6;

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
  if (runtime.station === GLAZE_STATION_INDEX && index !== GLAZE_STATION_INDEX) remindToPour(currentCake());
  runtime.station = index;
  if (index === GLAZE_STATION_INDEX) offerShadeHint();
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
  drawServeButton();
  drawTutorialVeil(); // under the bottle or topping in hand, so it stays bright wherever it is carried
  drawMovingBottles();
  drawDraggedTopping();
  drawSettingsPanel(SETTINGS_PANEL.x, SETTINGS_PANEL.y);
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
  drawDayCounter(KITCHEN_TOP.dayX, TOP_BAR_HEIGHT / 2);
  drawCoinCounter(KITCHEN_TOP.coinsX, KITCHEN_TOP.y);
  drawSettingsButton(KITCHEN_TOP.settingsX, KITCHEN_TOP.y);
  const reset = RESET_BUTTON;
  button('resetCake', reset.x, reset.y, reset.w, reset.h, '', {
    color: BUTTON_COLOR.reset, onClick: askResetCake,
    draw: (x, y, w, h, hovered) => drawResetButton(x + w / 2, y + h / 2, w / 2, hovered),
  });
}

/** "Serve" bottom right; it glows once the cake is complete (an unfinished one is asked about in `serveCake`). */
function drawServeButton(): void {
  const serve = SERVE_BUTTON;
  button('serveCake', serve.x, serve.y, serve.w, serve.h, t().serveCake, { color: BUTTON_COLOR.confirm, fontSize: serve.fontSize, glow: isCakeReady(), onClick: serveCake });
}

/** "1 · 2/5" after a crescent moon: day, then the guest of the day (the wording is left out to save room). */
function drawDayCounter(x: number, centerY: number): void {
  const { moonRadius: r, moonBite, textOffset, textSize, moonColor } = DAY_COUNTER, cx = x + r;
  ctx.save();
  ellipsePath(cx, centerY, r, r); ctx.clip(); // the moon minus a bite = a crescent
  ctx.beginPath(); ctx.arc(cx, centerY, r, 0, Math.PI * 2);
  ctx.moveTo(cx + r * moonBite.x + r * moonBite.radius, centerY + r * moonBite.y);
  ctx.arc(cx + r * moonBite.x, centerY + r * moonBite.y, r * moonBite.radius, 0, Math.PI * 2);
  ctx.fillStyle = moonColor; ctx.fill('evenodd');
  ctx.restore();
  drawText(`${progress.day} · ${progress.guestIndex + 1}/${progress.guestQueue!.length}`, cx + textOffset, centerY + 1, textSize, TEXT.main, 'left', 900);
}

/** Reset asks first when there is something to throw away. */
function askResetCake(): void {
  const cake = runtime.cake;
  if (!cake || (!cake.stack.length && !cake.toppings.length)) { resetCake(); return; }
  showModal(t().confirmReset, t().reset, t().cancel, resetCake, true);
  sfx.tab();
}

/** A round pink button with a white bin on it. */
function drawResetButton(centerX: number, centerY: number, radius: number, hovered: boolean): void {
  const color = BUTTON_COLOR.reset, { lidW, bodyTopW, bodyBottomW, bodyH } = BIN;
  ctx.save();
  ctx.shadowColor = withAlpha(color, hovered ? 0.9 : 0.55); ctx.shadowBlur = hovered ? 24 : 14; ctx.shadowOffsetY = 3;
  const fill = ctx.createLinearGradient(0, centerY - radius, 0, centerY + radius);
  fill.addColorStop(0, shade(color, 0.32)); fill.addColorStop(0.55, color); fill.addColorStop(1, shade(color, -0.2));
  ellipsePath(centerX, centerY, radius, radius); ctx.fillStyle = fill; ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  ctx.strokeStyle = 'rgba(255,255,255,0.4)'; ctx.lineWidth = 1.5; ellipsePath(centerX, centerY, radius - 1, radius - 1); ctx.stroke();
  const top = centerY - bodyH / 2 + 2;
  ctx.fillStyle = BIN.color; ctx.strokeStyle = BIN.color; ctx.lineWidth = 3; ctx.lineCap = 'round';
  ctx.beginPath(); ctx.moveTo(centerX - lidW / 2, top - 4); ctx.lineTo(centerX + lidW / 2, top - 4); ctx.stroke(); // lid
  ctx.beginPath(); ctx.moveTo(centerX - 4, top - 8); ctx.lineTo(centerX + 4, top - 8); ctx.stroke(); // handle
  ctx.beginPath(); ctx.moveTo(centerX - bodyTopW / 2, top); ctx.lineTo(centerX + bodyTopW / 2, top);
  ctx.lineTo(centerX + bodyBottomW / 2, top + bodyH); ctx.lineTo(centerX - bodyBottomW / 2, top + bodyH); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = color; ctx.lineWidth = 2;
  for (const dx of [-4, 0, 4]) { ctx.beginPath(); ctx.moveTo(centerX + dx, top + 4); ctx.lineTo(centerX + dx * 0.8, top + bodyH - 4); ctx.stroke(); }
  ctx.restore();
}

/**
 * The order: the guest in a window at the bottom (name tag inside, patience under it) thinks of the wanted cake
 * in a cloud above. The cloud bobs gently; it shakes with the window when the guest gets upset.
 */
function drawTicket(): void {
  const customer = runtime.customer!, time = clock.time;
  const wobble = Math.max(0, 1 - (time - customer.moodChangedAt) * 2.5) * Math.sin(time * 40) * 5;
  const bob = Math.sin(time * THOUGHT_CLOUD.bobSpeed) * THOUGHT_CLOUD.bobPixels;
  ctx.save(); ctx.translate(wobble, 0);
  drawGuestWindow(customer);
  ctx.save(); ctx.translate(0, bob);
  drawThoughtCloud(customer);
  ctx.restore();
  ctx.restore();
  const { x, y, w, h, nameTag, patienceGap } = GUEST_WINDOW;
  drawNameTag(loc(customer.cat.name), x + nameTag.x, y + nameTag.y);
  if (customer.patience !== null) drawPatienceBar(x, y + h + patienceGap, w, customer);
  drawGuestComment();
}

/** The guest's rare comment in a bubble beside their window, popping in and fading out. */
function drawGuestComment(): void {
  const comment = currentComment();
  if (!comment) return;
  const { x, centerY, maxTextWidth, paddingX, paddingY, textSize, lineHeight, radius, tailLength } = GUEST_COMMENT, look = COMMENT_LOOK;
  const lines = wrapText(comment.text, maxTextWidth, textSize, 800);
  ctx.font = font(textSize, 800);
  const w = Math.max(...lines.map(line => ctx.measureText(line).width)) + paddingX * 2, h = lines.length * lineHeight + paddingY * 2, y = centerY - h / 2;
  const left = comment.startTime + GUEST_COMMENTS.showSeconds - clock.time;
  ctx.save();
  ctx.globalAlpha = Math.min(1, left / look.fadeSeconds);
  withPopIn(comment.startTime, x + w / 2, centerY, () => {
    ctx.save();
    ctx.shadowColor = look.shadow; ctx.shadowBlur = 14;
    ctx.fillStyle = look.fill;
    ctx.beginPath(); ctx.moveTo(x + 2, centerY - 10); ctx.lineTo(x - tailLength, centerY); ctx.lineTo(x + 2, centerY + 10); ctx.closePath(); ctx.fill();
    roundRectPath(x, y, w, h, radius); ctx.fill();
    ctx.restore();
    lines.forEach((line, i) => drawText(line, x + paddingX, y + paddingY + lineHeight * (i + 0.5), textSize, look.text, 'left', 800));
  });
  ctx.restore();
}

/** The cloud's outline: `bumps` circles around an ellipse that fills the box, plus the ellipse itself (all one fill). */
function thoughtCloudPath(grow = 0): void {
  const { x, y, w, h, bumps, bumpRadius: r } = THOUGHT_CLOUD, cx = x + w / 2, cy = y + h / 2;
  const rx = w / 2 - r, ry = h / 2 - r;
  ctx.beginPath();
  ctx.ellipse(cx, cy, rx + r * 0.6 + grow, ry + r * 0.6 + grow, 0, 0, Math.PI * 2);
  for (let i = 0; i < bumps; i++) {
    const angle = (i / bumps) * Math.PI * 2 - Math.PI / 2, bumpR = r * (i % 2 ? 0.88 : 1) + grow;
    const bx = cx + Math.cos(angle) * rx, by = cy + Math.sin(angle) * ry;
    ctx.moveTo(bx + bumpR, by); ctx.arc(bx, by, bumpR, 0, Math.PI * 2);
  }
}

/** The cloud with the wanted cake in it, the thought dots under it; a golden glow pulses round it after the order changed. */
function drawThoughtCloud(customer: Customer): void {
  const { x, y, w, h, dots, picturePadding: pad } = THOUGHT_CLOUD, look = CLOUD_LOOK;
  const fill = ctx.createLinearGradient(0, y, 0, y + h);
  fill.addColorStop(0, look.top); fill.addColorStop(1, look.bottom);
  ctx.save();
  ctx.shadowColor = look.shadow; ctx.shadowBlur = look.shadowBlur;
  ctx.fillStyle = look.rim;
  for (const dot of dots) { ellipsePath(dot.x, dot.y, dot.r + look.rimWidth / 2, dot.r + look.rimWidth / 2); ctx.fill(); }
  thoughtCloudPath(look.rimWidth); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = fill;
  for (const dot of dots) { ellipsePath(dot.x, dot.y, dot.r - look.rimWidth / 2, dot.r - look.rimWidth / 2); ctx.fill(); }
  thoughtCloudPath(); ctx.fill();
  ctx.restore();
  drawChangedOrderGlow(customer);
  // on the toppings station the wanted cake is shown without its magic, so its toppings are easy to see
  drawOrderCake(customer, x + pad.x, y + pad.y, w - pad.x * 2, h - pad.y * 2, runtime.station === TOPPINGS_STATION_INDEX, true);
}

/** A pulsing golden halo round the cloud for a while after the guest changed the order. */
function drawChangedOrderGlow(customer: Customer): void {
  const glow = orderChangeGlow(customer);
  if (glow <= 0) return;
  ctx.save();
  ctx.globalAlpha = glow * (0.55 + 0.45 * Math.sin(clock.time * CHANGED_ORDER_PULSE_SPEED));
  ctx.shadowColor = TEXT.gold; ctx.shadowBlur = 22;
  ctx.strokeStyle = TEXT.gold; ctx.lineWidth = 5;
  thoughtCloudPath(CLOUD_LOOK.rimWidth + 2); ctx.stroke();
  ctx.restore();
  ctx.save(); // cover the stroke's inner half and the circles' inner arcs with the cloud again
  const { y, h } = THOUGHT_CLOUD, fill = ctx.createLinearGradient(0, y, 0, y + h);
  fill.addColorStop(0, CLOUD_LOOK.top); fill.addColorStop(1, CLOUD_LOOK.bottom);
  ctx.fillStyle = fill; thoughtCloudPath(); ctx.fill();
  ctx.restore();
}

/**
 * The guest from the hat to the chest in their window. They look where the player works and react to their
 * choices for a moment, nod or shake their head (game/guestReactions.ts), otherwise their face follows their
 * patience and the player's mistakes; the frame turns
 * gold, then red as patience runs out.
 */
function drawGuestWindow(customer: Customer): void {
  const reaction = currentReaction(), left = patienceLeft(customer), time = clock.time;
  const mood = reaction ? reactionMood() : guestMood(customer);
  const { x, y, w, h, headAt, catScale, markOffset } = GUEST_WINDOW;
  const frameColor = left < PATIENCE_LEVELS.upset ? BUTTON_COLOR.danger : left < PATIENCE_LEVELS.impatient ? BUTTON_COLOR.gold : TEXT.label;
  const backdrop = ctx.createLinearGradient(0, y, 0, y + h);
  backdrop.addColorStop(0, '#2c1a62'); backdrop.addColorStop(1, '#4a2f8e');
  ctx.fillStyle = backdrop; roundRectPath(x, y, w, h, 16); ctx.fill();
  const headX = x + w / 2, headY = y + h * headAt;
  ctx.save(); roundRectPath(x, y, w, h, 16); ctx.clip();
  drawGlow(headX, headY, h * 0.8, '#c9b6ff', 0.25);
  // the head is ~150 px above the cat's origin at scale 1 (a bit lower for kittens)
  const headLift = 150 * catScale * (customer.cat.isKitten ? 0.9 : 1);
  drawCat(customer.cat, headX, headY + headLift, catScale, time, mood, updateGaze(headX, headY, clock.delta), headPose());
  ctx.restore();
  ctx.strokeStyle = frameColor; ctx.lineWidth = 3; roundRectPath(x + 1.5, y + 1.5, w - 3, h - 3, 15); ctx.stroke();
  const sideX = headX + markOffset.x, sideY = headY + markOffset.y;
  if (reaction === 'surprised' || reaction === 'worried') drawReactionMark(reaction, sideX, sideY, time);
  else if (mood === 'thinking') { // a drop of sweat
    ctx.fillStyle = '#8fd8ff'; ctx.beginPath();
    ctx.moveTo(sideX, sideY - 16); ctx.quadraticCurveTo(sideX + 11, sideY + 4, sideX, sideY + 8);
    ctx.quadraticCurveTo(sideX - 11, sideY + 4, sideX, sideY - 16); ctx.fill();
  } else if (mood === 'angry' || mood === 'hissing') drawAngerMark(sideX, sideY, 1.5, time); // a sad guest just has a tear (drawn on the face)
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
  const value = patienceBarValue(customer), left = patienceLeft(customer), backing = PATIENCE_BACKING;
  ctx.fillStyle = backing.color;
  roundRectPath(x - backing.pad, y - backing.pad, w + backing.pad * 2, PATIENCE_BAR_HEIGHT + backing.pad * 2, (PATIENCE_BAR_HEIGHT + backing.pad * 2) / 2); ctx.fill();
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

/** The helper's button (once it is bought) right of the cake under the side button; the station's own buttons. */
function drawStationControls(cake: Cake): void {
  const station = STATIONS[runtime.station], auto = AUTO_BUTTON;
  if (station.autoComplete && station.helper && isOwned(helperItemId(station.helper))) {
    button('auto', auto.x, auto.y, auto.w, auto.h, station.helperLabel ?? t().auto, { color: BUTTON_COLOR.gold, fontSize: 22, glow: true, onClick: station.autoComplete });
  }
  station.drawControls?.(STATION_CONTROLS.right, STATION_CONTROLS.y, cake);
}

/**
 * Station tabs: icon pills centred along the bottom; a done station gets a green tick, the suggested next one glows.
 * The glaze tab pulses pink with a "!" while a mixed colour waits in the cauldron.
 */
function drawStationTabs(cake: Cake): void {
  const nextIndex = STATIONS.findIndex(station => !station.isDone(cake));
  const { w: tabW, h: tabH, gap, iconScale, doneBadge } = TABS, left = SCREEN_W / 2 - (STATIONS.length * tabW + (STATIONS.length - 1) * gap) / 2;
  STATIONS.forEach((station, i) => {
    const x = left + i * (tabW + gap), isSelected = runtime.station === i, isDone = station.isDone(cake);
    const needsPour = i === GLAZE_STATION_INDEX && !isSelected && hasUnpouredGlaze(cake), pulse = 0.5 + 0.5 * Math.sin(clock.time * TABS.reminderPulseSpeed);
    button('tab' + i, x, TABS.y, tabW, tabH, '', {
      sound: 'tab', hoverScale: 1.06, onClick: () => selectStation(i as StationIndex),
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
          if (needsPour) { ctx.shadowColor = withAlpha(BUTTON_COLOR.pink, 0.5 + 0.5 * pulse); ctx.shadowBlur = 16 + 14 * pulse; }
          else if (nextIndex === i) { ctx.shadowColor = `rgba(140,230,255,${0.5 + 0.35 * Math.sin(clock.time * 5)})`; ctx.shadowBlur = 20; } // suggested next step
          drawGlassPill(bx, by, bw, bh, hovered ? 0.95 : 0.8);
        }
        ctx.restore();
        drawStationIcon(station.icon, bx + bw / 2 - (isDone || needsPour ? doneBadge.radius * 0.6 : 0), by + bh / 2, iconScale);
        if (isDone || needsPour) {
          const badgeX = bx + bw - doneBadge.inset, badgeY = by + bh / 2;
          ctx.save();
          const badgeColor = needsPour ? BUTTON_COLOR.pink : BUTTON_COLOR.confirm;
          ctx.shadowColor = badgeColor; ctx.shadowBlur = 10;
          ellipsePath(badgeX, badgeY, doneBadge.radius, doneBadge.radius); ctx.fillStyle = badgeColor; ctx.fill();
          ctx.restore();
          drawText(needsPour ? '!' : '✓', badgeX, badgeY + 1, 15, '#fff', 'center', 900);
        }
      },
    });
  });
}
