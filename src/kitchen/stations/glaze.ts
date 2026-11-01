// Station 3: drag elixir bottles from the shelf into the cauldron, mix a colour and pour it on the cake.
import { sfx } from '../../audio/sfx';
import { ctx } from '../../core/canvas';
import { clock } from '../../core/clock';
import { rgbToHex, shade, withAlpha } from '../../core/color';
import { drawFittedText, drawGlassPill, drawGlow, drawText, ellipsePath, font, roundRectPath, starPath } from '../../core/draw';
import { loc } from '../../core/language';
import { clamp, easeOutCubic, lerp, type Point } from '../../core/math';
import { burst } from '../../core/particles';
import { BUTTON_COLOR, TEXT } from '../../core/theme';
import { button, pointer, springScale } from '../../core/ui';
import { ESSENCE_ORDER, ESSENCES, glazeColorById } from '../../data/ingredients';
import { t } from '../../data/strings';
import type { Cake, EssenceId } from '../../data/types';
import { cakeHeight, countLayers } from '../../game/cake';
import { mixDrops, NAMED_COLOR_DISTANCE, nearestGlazeColor, recipeToDrops, totalDrops } from '../../game/colorMixing';
import { availableEssences, isOwned, runtime } from '../../game/state';
import { BOTTLE_NECK_TOP, drawPotionBottle } from '../../render/potionBottle';
import { showToast } from '../../scenes/sceneManager';
import { currentCake, currentOrder, requireLayer } from '../kitchen';
import {
  CAKE_BASE_Y, CAKE_SIDE_BUTTON, CAULDRON, CAULDRON_CAPACITY, CAULDRON_MOUTH, ELIXIR_SHELF, EMPTY_CAULDRON_BUTTON, POUR_POSITION, POUR_REACH,
} from '../layout';
import type { Station } from './station';

// Timeline of a pour (seconds): fly to the cauldron and tilt → pour → fly back home.
const POUR_TIMING = { tiltEnd: 0.3, dropAdded: 0.62, pourEnd: 0.98, end: 1.32 };
/** Bottle tilt angle while pouring (radians). */
const POUR_TILT = 1.95;
const RETURN_TO_SHELF_SECONDS = 0.28;
const GLAZE_ARC_SECONDS = 1;
const CAULDRON_LABEL_SIZE = 19;
/** Bottle grab area around its resting point. */
const BOTTLE_HIT = { halfWidth: 30, above: 62, below: 38 };
/** The bottle's body rests this far above the shelf board. */
const BOTTLE_REST_HEIGHT = 26.5 * ELIXIR_SHELF.bottleScale;

const bottleHome = (essence: EssenceId): Point => ({
  x: ELIXIR_SHELF.firstX + ESSENCE_ORDER.indexOf(essence) * ELIXIR_SHELF.spacing,
  y: ELIXIR_SHELF.y - BOTTLE_REST_HEIGHT,
});

const isOverBottle = (point: Point, home: Point): boolean =>
  Math.abs(point.x - home.x) < BOTTLE_HIT.halfWidth && point.y > home.y - BOTTLE_HIT.above && point.y < home.y + BOTTLE_HIT.below;

/** Is the bottle held at (x, y) close enough to pour into the cauldron? */
const isOverCauldron = (x: number, y: number): boolean =>
  y > ELIXIR_SHELF.y + 4 && Math.hypot(x - CAULDRON_MOUTH.x, y - (CAULDRON_MOUTH.y - 30)) < POUR_REACH;

/** Tip of a bottle's neck when it is at (x, y) tilted by `rotation`. */
function bottleTip(x: number, y: number, rotation: number): Point {
  const reach = BOTTLE_NECK_TOP * ELIXIR_SHELF.bottleScale;
  return { x: x + Math.sin(rotation) * reach, y: y - Math.cos(rotation) * reach };
}

function addDrop(essence: EssenceId): void {
  const drops = currentCake().cauldron;
  if (totalDrops(drops) >= CAULDRON_CAPACITY) { showToast(t().cauldronFull); sfx.fail(); return; }
  drops[essence]++;
  sfx.drop();
  setTimeout(sfx.bubble, 120);
  burst(CAULDRON_MOUTH.x - 4, CAULDRON_MOUTH.y, 12, [ESSENCES[essence].color, '#ffffff'], { lift: 160, gravity: 500, maxSpeed: 120 });
}

function emptyCauldron(): void {
  const drops = currentCake().cauldron;
  if (totalDrops(drops) === 0) return;
  for (const essence of ESSENCE_ORDER) drops[essence] = 0;
  sfx.poof();
  burst(CAULDRON_MOUTH.x, CAULDRON_MOUTH.y, 16, '#8a7aa8', { lift: 120, gravity: -40 });
}

/** Pours the cauldron's mix on the cake; the glaze flies over in an arc and spreads. */
function pourGlaze(): void {
  const cake = currentCake();
  const color = mixDrops(cake.cauldron);
  if (!requireLayer(cake)) return;
  if (!color) { showToast(t().addEssenceFirst); sfx.fail(); return; }
  cake.glaze = color;
  cake.glazeProgress = -0.45; // waits for the arc to land
  sfx.whoosh();
  setTimeout(sfx.pour, 380);
  setTimeout(sfx.chime, 900);
  runtime.glazeArc = { startTime: clock.time, color: rgbToHex(color) };
  setTimeout(() => burst(runtime.cakeX, CAKE_BASE_Y - cakeHeight(cake) * runtime.cakeScale - 10, 20, rgbToHex(color), { lift: 120, gravity: 400 }), 420);
}

// ---------------- dragging bottles ----------------

function grabBottle(point: Point): boolean {
  if (runtime.pouringPotion) return false;
  for (const essence of availableEssences()) {
    if (runtime.returningPotion?.essence === essence) continue;
    const home = bottleHome(essence);
    if (isOverBottle(point, home)) {
      runtime.heldPotion = { essence, x: home.x, y: home.y, grabOffsetX: home.x - point.x, grabOffsetY: home.y - point.y };
      sfx.pickup();
      return true;
    }
  }
  return false;
}

function releaseBottle(): void {
  const held = runtime.heldPotion;
  runtime.heldPotion = null;
  if (!held) return;
  const canPour = isOverCauldron(held.x, held.y);
  const isFull = totalDrops(currentCake().cauldron) >= CAULDRON_CAPACITY;
  if (canPour && isFull) showToast(t().cauldronFull);
  if (canPour && !isFull) {
    runtime.pouringPotion = { essence: held.essence, time: 0, startX: held.x, startY: held.y, dropAdded: false };
    sfx.whoosh();
  } else {
    runtime.returningPotion = { essence: held.essence, startX: held.x, startY: held.y, time: 0 };
  }
}

/** Advances pouring / returning bottles (called every frame). */
export function updatePotions(dt: number): void {
  const returning = runtime.returningPotion;
  if (returning) {
    returning.time += dt;
    if (returning.time >= RETURN_TO_SHELF_SECONDS) { runtime.returningPotion = null; sfx.place(); }
  }
  const pour = runtime.pouringPotion;
  if (!pour) return;
  const previous = pour.time;
  pour.time += dt;
  if (previous < POUR_TIMING.tiltEnd && pour.time >= POUR_TIMING.tiltEnd) sfx.pour();
  if (!pour.dropAdded && pour.time >= POUR_TIMING.dropAdded) { pour.dropAdded = true; if (runtime.cake) addDrop(pour.essence); }
  if (pour.time >= POUR_TIMING.end) { runtime.pouringPotion = null; sfx.place(); }
}

// ---------------- drawing ----------------

function drawElixirShelf(): void {
  const time = clock.time, unlocked = availableEssences(), isActive = runtime.station === 2;
  const shelfCenter = ELIXIR_SHELF.firstX + ((ESSENCE_ORDER.length - 1) / 2) * ELIXIR_SHELF.spacing, shelfLeft = shelfCenter - ELIXIR_SHELF.boardWidth / 2;
  ctx.fillStyle = '#4a2c80'; roundRectPath(shelfLeft, ELIXIR_SHELF.y, ELIXIR_SHELF.boardWidth, 22, 11); ctx.fill();
  ctx.fillStyle = '#6a46a8'; roundRectPath(shelfLeft, ELIXIR_SHELF.y, ELIXIR_SHELF.boardWidth, 7, 4); ctx.fill();

  ESSENCE_ORDER.forEach((essence, i) => {
    const home = bottleHome(essence), isUnlocked = unlocked.includes(essence);
    const isAway = runtime.heldPotion?.essence === essence || runtime.pouringPotion?.essence === essence || runtime.returningPotion?.essence === essence;
    if (isAway) { // dashed outline where the bottle stood
      ctx.strokeStyle = 'rgba(200,190,255,0.28)'; ctx.setLineDash([3, 3]); ctx.lineWidth = 1.5;
      roundRectPath(home.x - 20, home.y - 42, 40, 68, 12); ctx.stroke(); ctx.setLineDash([]);
    } else if (isUnlocked) {
      const hovered = isActive && !runtime.pouringPotion && !runtime.heldPotion && isOverBottle(pointer, home);
      const scale = springScale('potion_' + essence, hovered ? 1.14 : 1), bob = Math.sin(time * 2 + i) * 1.5;
      drawGlow(home.x, home.y, 42, ESSENCES[essence].color, hovered ? 0.6 : 0.28);
      ctx.save(); ctx.translate(home.x, home.y + bob); ctx.scale(scale, scale);
      drawPotionBottle(essence, 0, 0, ELIXIR_SHELF.bottleScale);
      ctx.restore();
    } else {
      ctx.save(); ctx.globalAlpha = 0.28; drawPotionBottle(essence, home.x, home.y, ELIXIR_SHELF.bottleScale, true); ctx.restore();
    }
    drawFittedText(isUnlocked ? loc(ESSENCES[essence].name) : t().lockedDay(ESSENCES[essence].unlockDay), home.x, ELIXIR_SHELF.y + 15, 15, ELIXIR_SHELF.spacing - 6, isUnlocked ? TEXT.main : TEXT.muted, 'center', 900);
  });
}

function drawCauldron(cake: Cake): void {
  const { x, y } = CAULDRON, time = clock.time;
  const mix = mixDrops(cake.cauldron), mixHex = mix ? rgbToHex(mix) : null;
  const isGolden = isOwned('helper:glaze');
  // magic fire under the pot
  const flicker = 0.85 + 0.15 * Math.sin(time * 12);
  drawGlow(x, y - 10, 60, '#7ff0ff', 0.4);
  ctx.fillStyle = '#9ff4ff'; ellipsePath(x, y - 10, 30 * flicker, 14); ctx.fill();
  // legs and pot
  ctx.fillStyle = '#231a40';
  for (const side of [-1, 1]) { roundRectPath(x + side * 50 - 7, y - 30, 14, 34, 6); ctx.fill(); }
  ctx.beginPath();
  ctx.moveTo(x - 84, y - 120); ctx.quadraticCurveTo(x - 96, y - 18, x, y - 16); ctx.quadraticCurveTo(x + 96, y - 18, x + 84, y - 120);
  ctx.closePath();
  const pot = ctx.createRadialGradient(x - 30, y - 90, 10, x, y - 70, 110);
  pot.addColorStop(0, '#5a4a8a'); pot.addColorStop(1, '#1d1538');
  ctx.fillStyle = pot; ctx.fill();
  if (isGolden) {
    ctx.fillStyle = `rgba(255,216,74,${0.6 + 0.3 * Math.sin(time * 3)})`;
    for (let i = 0; i < 3; i++) { starPath(x - 30 + i * 30, y - 60, 6, 2.5); ctx.fill(); }
  }
  // rim and brew
  ellipsePath(x, y - 120, 86, 22); ctx.fillStyle = isGolden ? '#e8a92a' : '#4a3a7a'; ctx.fill();
  ellipsePath(x, y - 118, 74, 16); ctx.fillStyle = mixHex ?? '#140f28'; ctx.fill();
  if (mixHex) {
    drawGlow(x, y - 130, 90, mixHex, 0.3);
    for (let i = 0; i < 4; i++) {
      const rise = (time * 0.8 + i * 0.27) % 1, radius = 5 * (1 - rise) + 2;
      ellipsePath(x - 40 + i * 26, y - 118 - rise * 30, radius, radius);
      ctx.fillStyle = withAlpha(shade(mixHex, 0.3), 1 - rise); ctx.fill();
    }
  }
  // label under the pot
  let label = t().cauldronEmpty;
  if (mix) {
    const nearest = nearestGlazeColor(mix);
    label = nearest.distance < NAMED_COLOR_DISTANCE ? t().colorLabel(loc(nearest.color.name)) : t().unusualShade;
  }
  ctx.font = font(CAULDRON_LABEL_SIZE, 800);
  const labelWidth = ctx.measureText(label).width + (mixHex ? 52 : 32);
  drawGlassPill(x - labelWidth / 2, y + 12, labelWidth, 40, 0.9);
  if (mixHex) { ellipsePath(x - labelWidth / 2 + 19, y + 32, 8, 8); ctx.fillStyle = mixHex; ctx.fill(); }
  drawText(label, x + (mixHex ? 10 : 0), y + 33, CAULDRON_LABEL_SIZE, TEXT.main, 'center', 800);
}

/** Shelf and cauldron; faded in/out with the glaze station layout. */
export function drawGlazeStationScenery(cake: Cake): void {
  const blend = runtime.glazeLayoutBlend;
  if (blend <= 0.02) return;
  ctx.save();
  ctx.globalAlpha = clamp(blend * 1.4 - 0.2, 0, 1);
  ctx.translate(0, (1 - easeOutCubic(blend)) * 40);
  drawElixirShelf();
  drawCauldron(cake);
  ctx.restore();
}

/** Bottles that are held, pouring or flying back (drawn above everything else). */
export function drawMovingBottles(): void {
  const time = clock.time, scale = ELIXIR_SHELF.bottleScale;
  const returning = runtime.returningPotion;
  if (returning) {
    const home = bottleHome(returning.essence), k = easeOutCubic(returning.time / RETURN_TO_SHELF_SECONDS);
    drawPotionBottle(returning.essence, lerp(returning.startX, home.x, k), lerp(returning.startY, home.y, k), scale);
  }

  const pour = runtime.pouringPotion;
  if (pour) {
    const t = pour.time, home = bottleHome(pour.essence), color = ESSENCES[pour.essence].color;
    let x: number, y: number, rotation: number;
    if (t < POUR_TIMING.tiltEnd) {
      const k = easeOutCubic(t / POUR_TIMING.tiltEnd);
      x = lerp(pour.startX, POUR_POSITION.x, k); y = lerp(pour.startY, POUR_POSITION.y, k); rotation = POUR_TILT * k;
    } else if (t < POUR_TIMING.pourEnd) {
      x = POUR_POSITION.x; y = POUR_POSITION.y + Math.sin(t * 18) * 1.2; rotation = POUR_TILT + Math.sin(t * 9) * 0.05;
    } else {
      const k = easeOutCubic((t - POUR_TIMING.pourEnd) / (POUR_TIMING.end - POUR_TIMING.pourEnd));
      x = lerp(POUR_POSITION.x, home.x, k); y = lerp(POUR_POSITION.y, home.y, k); rotation = POUR_TILT * (1 - k);
    }
    if (t > POUR_TIMING.tiltEnd - 0.03 && t < POUR_TIMING.pourEnd + 0.04) drawElixirStream(t, x, y, rotation, color);
    ctx.save(); ctx.translate(x, y); ctx.rotate(rotation);
    drawGlow(0, 0, 40, color, 0.35);
    drawPotionBottle(pour.essence, 0, 0, scale);
    ctx.restore();
  }

  const held = runtime.heldPotion;
  if (held) {
    const color = ESSENCES[held.essence].color, nearCauldron = isOverCauldron(held.x, held.y);
    if (nearCauldron) { // highlight the cauldron mouth as a drop target
      drawGlow(CAULDRON_MOUTH.x, CAULDRON_MOUTH.y, 110, color, 0.45 + 0.15 * Math.sin(time * 8));
      ctx.save();
      ctx.strokeStyle = withAlpha(color, 0.9); ctx.lineWidth = 3; ctx.setLineDash([7, 6]); ctx.lineDashOffset = -time * 30;
      ellipsePath(CAULDRON_MOUTH.x, CAULDRON_MOUTH.y, 92, 26); ctx.stroke();
      ctx.restore();
    }
    ctx.save(); ctx.translate(held.x, held.y);
    ctx.rotate(nearCauldron ? 0.45 : Math.sin(time * 6) * 0.08);
    ctx.scale(1.12, 1.12);
    drawGlow(0, 0, 46, color, 0.45);
    drawPotionBottle(held.essence, 0, 0, scale);
    ctx.restore();
  }
}

/** The thin stream of elixir from the tilted bottle into the cauldron. */
function drawElixirStream(t: number, x: number, y: number, rotation: number, color: string): void {
  const alpha = clamp(Math.min((t - 0.27) / 0.08, (1.02 - t) / 0.1), 0, 1);
  const tip = bottleTip(x, y, rotation), endX = CAULDRON_MOUTH.x - 6, endY = CAULDRON_MOUTH.y + 2;
  ctx.save();
  ctx.lineCap = 'round'; ctx.shadowColor = color; ctx.shadowBlur = 12;
  ctx.strokeStyle = color; ctx.lineWidth = 6 * alpha;
  ctx.beginPath(); ctx.moveTo(tip.x, tip.y); ctx.quadraticCurveTo(tip.x + 10, tip.y + 6, endX, endY); ctx.stroke();
  ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 1.6 * alpha; ctx.stroke();
  for (let i = 0; i < 3; i++) { // droplets
    const k = (clock.time * 2.5 + i / 3) % 1;
    const dropX = lerp(tip.x + 5, endX, k) + Math.sin(k * 9 + i) * 3, dropY = lerp(tip.y + 3, endY, k * k);
    ellipsePath(dropX, dropY, 2.2 * alpha, 2.6 * alpha); ctx.fillStyle = color; ctx.fill();
  }
  for (let i = 0; i < 2; i++) { // ripples
    const k = (clock.time * 1.8 + i * 0.5) % 1;
    ctx.strokeStyle = withAlpha(shade(color, 0.4), (1 - k) * alpha); ctx.lineWidth = 2;
    ellipsePath(endX, endY + 2, 6 + k * 22, 2 + k * 6); ctx.stroke();
  }
  ctx.restore();
}

/** Magic arc of glaze from the cauldron to the top of the cake. */
export function drawGlazeArc(cake: Cake): void {
  const arc = runtime.glazeArc;
  if (!arc) return;
  const progress = (clock.time - arc.startTime) / GLAZE_ARC_SECONDS;
  if (progress >= 1) { runtime.glazeArc = null; return; }
  const head = clamp(progress * 2.2, 0, 1), tail = clamp(progress * 2.2 - 1.1, 0, 1);
  const start = { x: CAULDRON_MOUTH.x - 30, y: CAULDRON_MOUTH.y - 6 };
  const end = { x: runtime.cakeX, y: CAKE_BASE_Y - cakeHeight(cake) * runtime.cakeScale - 4 };
  const control = { x: (start.x + end.x) / 2 + 20, y: Math.min(start.y, end.y) - 170 };
  const pointAt = (s: number): Point => ({
    x: (1 - s) * (1 - s) * start.x + 2 * (1 - s) * s * control.x + s * s * end.x,
    y: (1 - s) * (1 - s) * start.y + 2 * (1 - s) * s * control.y + s * s * end.y,
  });
  const time = clock.time;
  ctx.save();
  ctx.lineCap = 'round'; ctx.lineJoin = 'round'; ctx.shadowColor = arc.color; ctx.shadowBlur = 18;
  ctx.beginPath();
  for (let i = 0; i <= 24; i++) { const p = pointAt(lerp(tail, head, i / 24)); ctx.lineTo(p.x, p.y); }
  ctx.strokeStyle = arc.color; ctx.lineWidth = 10; ctx.stroke();
  ctx.shadowBlur = 0; ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.8)';
  for (let i = 0; i < 6; i++) {
    const p = pointAt(lerp(tail, head, (time * 3 + i / 6) % 1));
    starPath(p.x + Math.sin(i * 3 + time * 9) * 8, p.y + Math.cos(i * 2 + time * 7) * 8, 4, 1.4, 4, time * 4); ctx.fill();
  }
  ctx.restore();
}

export const glazeStation: Station = {
  get name() { return t().stations.glaze; },
  helper: 'glaze',
  isDone: cake => !!cake.glaze,

  /** "Pour on the cake" — big, right of the cake; "empty the cauldron" — low, left of the cauldron. The colour's name is under the cauldron. */
  drawControls(_rightEdge, _y, cake) {
    const total = totalDrops(cake.cauldron), side = CAKE_SIDE_BUTTON, empty = EMPTY_CAULDRON_BUTTON;
    button('pourGlaze', side.x, side.y, side.w, side.h, t().pourOnCake, {
      color: BUTTON_COLOR.pink, fontSize: 26, disabled: total === 0 || !countLayers(cake), glow: total > 0 && !cake.glaze, onClick: pourGlaze,
    });
    button('emptyCauldron', empty.x, empty.y, empty.w, empty.h, t().pourOut, {
      color: BUTTON_COLOR.secondary, fontSize: 19, disabled: total === 0, onClick: emptyCauldron,
    });
  },

  /** The smart cauldron mixes the ordered colour and pours it. */
  autoComplete() {
    const cake = currentCake();
    if (!requireLayer(cake)) return;
    cake.cauldron = recipeToDrops(glazeColorById(currentOrder().glaze).recipe);
    sfx.bubble(); sfx.sparkle();
    setTimeout(pourGlaze, 350);
  },

  onPointerDown(point) {
    return grabBottle(point);
  },
  onPointerMove(point) {
    const held = runtime.heldPotion;
    if (held) { held.x = point.x + held.grabOffsetX; held.y = point.y + held.grabOffsetY; }
  },
  onPointerUp() {
    releaseBottle();
  },
};

