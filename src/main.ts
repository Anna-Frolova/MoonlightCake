// Entry point: the game loop. Each frame: update() advances everything by `dt`, render() draws the current scene.
import { setBusEnabled } from './audio/engine';
import { updateMusic } from './audio/music';
import { sfx } from './audio/sfx';
import { canvas, ctx, SCREEN_H, SCREEN_W, viewport } from './core/canvas';
import { clock } from './core/clock';
import { font } from './core/draw';
import { applyLanguage } from './core/language';
import { randomRange } from './core/math';
import { drawParticles, updateMotes, updateParticles } from './core/particles';
import { beginUiFrame, findButtonAt, pointer, ui } from './core/ui';
import { t } from './data/strings';
import { progress, runtime } from './game/state';
import { setUpInput } from './input';
import { updateAutoCream } from './kitchen/stations/cream';
import { updatePotions } from './kitchen/stations/glaze';
import { drawMagicCircle } from './render/environment';
import { renderDayEnd } from './scenes/dayEnd';
import { renderDayStart } from './scenes/dayStart';
import { renderFinale } from './scenes/finale';
import { renderHall, updateHall } from './scenes/hall';
import { drawModal, drawToast } from './scenes/hud';
import { renderKitchen, updateKitchenLayout } from './scenes/kitchen';
import { renderShop } from './scenes/shop';
import { renderTitle } from './scenes/title';

/** Longest frame step; a hidden tab or a hiccup won't make everything jump. */
const MAX_FRAME_SECONDS = 0.05;
/** Fade speed between scenes (alpha per second). */
const FADE_SPEED = 5;
/** Minimum gap between hover sounds. */
const HOVER_SOUND_INTERVAL = 0.06;
/** Speeds of falling layers / popping toppings / spreading glaze (progress per second). */
const LAYER_DROP_SPEED = 4;
const TOPPING_POP_SPEED = 5;
const GLAZE_SPREAD_SPEED = 0.75;

const SCENE_RENDERERS = {
  title: renderTitle, dayStart: renderDayStart, hall: renderHall, kitchen: renderKitchen,
  dayEnd: renderDayEnd, finale: renderFinale, shop: renderShop,
};

function update(dt: number): void {
  clock.time += dt;
  clock.delta = dt;

  const fade = runtime.fade;
  if (fade) {
    fade.alpha += fade.direction * dt * FADE_SPEED;
    if (fade.direction === 1 && fade.alpha >= 1) { fade.alpha = 1; fade.onMidpoint(); fade.direction = -1; }
    else if (fade.direction === -1 && fade.alpha <= 0) runtime.fade = null;
  }
  if (runtime.toast) { runtime.toast.remaining -= dt; if (runtime.toast.remaining <= 0) runtime.toast = null; }
  runtime.shake = Math.max(0, runtime.shake - dt);
  runtime.coinBump = Math.max(0, runtime.coinBump - dt * 2.5);
  runtime.helperKittenJump = Math.max(0, runtime.helperKittenJump - dt * 1.5);
  // the coin counter rolls towards the real amount
  runtime.displayedCoins += (progress.coins - runtime.displayedCoins) * Math.min(1, dt * 6);
  if (Math.abs(progress.coins - runtime.displayedCoins) < 0.5) runtime.displayedCoins = progress.coins;

  updateParticles(dt);
  updateMotes(dt);
  updatePotions(dt);
  updateKitchenLayout(dt);
  updateMusic(progress.musicOn);
  updateHall(dt);
  updateCakeAnimations(dt);
}

function updateCakeAnimations(dt: number): void {
  const cake = runtime.cake;
  if (!cake) return;
  for (const item of cake.stack) if (item.dropProgress !== undefined && item.dropProgress < 1) item.dropProgress = Math.min(1, item.dropProgress + dt * LAYER_DROP_SPEED);
  for (const placed of cake.toppings) if (placed.popProgress !== undefined && placed.popProgress < 1) placed.popProgress = Math.min(1, placed.popProgress + dt * TOPPING_POP_SPEED);
  if (cake.glazeProgress < 1) cake.glazeProgress = Math.min(1, cake.glazeProgress + dt * GLAZE_SPREAD_SPEED);
  updateAutoCream(dt);
}

function render(): void {
  const { scale, offsetX, offsetY, pixelRatio } = viewport;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.fillStyle = '#0c0824'; ctx.fillRect(0, 0, canvas.width, canvas.height);
  const shakeX = runtime.shake ? randomRange(-4, 4) * runtime.shake * 4 : 0;
  const shakeY = runtime.shake ? randomRange(-4, 4) * runtime.shake * 4 : 0;
  ctx.setTransform(scale * pixelRatio, 0, 0, scale * pixelRatio, (offsetX + shakeX) * pixelRatio, (offsetY + shakeY) * pixelRatio);
  ctx.save();
  ctx.beginPath(); ctx.rect(0, 0, SCREEN_W, SCREEN_H); ctx.clip();

  // hover uses last frame's buttons, then the scene registers this frame's
  const hovered = runtime.fade ? null : findButtonAt(pointer);
  ui.hoveredId = hovered && !hovered.disabled ? hovered.id : null;
  if (ui.hoveredId && ui.hoveredId !== runtime.lastHoveredButton && clock.time - runtime.lastHoverSoundTime > HOVER_SOUND_INTERVAL) {
    sfx.hover();
    runtime.lastHoverSoundTime = clock.time;
  }
  runtime.lastHoveredButton = ui.hoveredId;
  beginUiFrame();
  runtime.toppingTray = [];

  SCENE_RENDERERS[runtime.scene]();
  drawParticles();
  drawToast();
  drawModal();
  canvas.style.cursor = ui.hoveredId ? 'pointer' : runtime.draggedTopping || runtime.heldPotion ? 'grabbing' : 'default';

  if (runtime.fade) { // dark veil with a spinning rune circle
    const alpha = runtime.fade.alpha;
    ctx.fillStyle = `rgba(10,6,30,${alpha})`; ctx.fillRect(0, 0, SCREEN_W, SCREEN_H);
    if (alpha > 0.2) { ctx.globalAlpha = alpha; drawMagicCircle(SCREEN_W / 2, SCREEN_H / 2, 120 + 40 * alpha, clock.time * 8, 0.5); ctx.globalAlpha = 1; }
  }
  ctx.restore();

  // portrait phone: ask to rotate (drawn in the letterbox area above the game)
  if (offsetY > 70) {
    ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
    ctx.font = font(18, 800); ctx.fillStyle = '#c9b6ff'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText(t().rotatePhone, window.innerWidth / 2, offsetY / 2);
  }
}

let lastFrameTime = performance.now();
function frame(now: number): void {
  const dt = Math.min(MAX_FRAME_SECONDS, (now - lastFrameTime) / 1000);
  lastFrameTime = now;
  update(dt);
  render();
  requestAnimationFrame(frame);
}

setBusEnabled('music', progress.musicOn);
setBusEnabled('sfx', progress.soundOn);
applyLanguage();
document.title = t().gameTitle;
setUpInput();
if (import.meta.env.DEV) void import('./debug');
requestAnimationFrame(frame);
void document.fonts?.load('800 20px Nunito');
void document.fonts?.load('700 30px Comfortaa');
