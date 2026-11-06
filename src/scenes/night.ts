// The night raid: the dark hall, the chef guarding the recipe book, black ghosts creeping in with signs over them.
import { ctx, SCREEN_H, SCREEN_W } from '../core/canvas';
import { clock } from '../core/clock';
import { drawGlow, drawPanel, drawText, drawTitle, roundRectPath, withPopIn, wrapText } from '../core/draw';
import { drawMotes } from '../core/particles';
import { BUTTON_COLOR, TEXT } from '../core/theme';
import { button } from '../core/ui';
import { CHEF_CAT } from '../data/cats';
import { ELEMENTS } from '../data/elements';
import { t } from '../data/strings';
import { finishNight } from '../game/flow';
import { crumbPosition, crumbProgress, raid, RAID, RAID_BOOK, type RaidCrumb } from '../game/nightRaid';
import { runtime } from '../game/state';
import { drawMagicStrokes } from '../kitchen/stations/magic';
import { drawCat } from '../render/cat';
import { drawCounter, drawHallBackground, HALL_FLOOR_Y } from '../render/environment';
import { drawSign } from '../render/signs';
import { dimBackground, drawCoinCounter } from './hud';

const DARKNESS = 0.68;
const CHEF_SCALE = 0.95;
/** The ghosts: black with a pale glow so they stand out from the night, half-width and height of the body, how it writhes, its arms, the sign over its head. */
const GHOST = {
  body: '#07040f', rim: '#b8a4ff', eyes: '#ffe27a', width: 27, height: 64, speed: 4.2, sway: 9, hemWaves: 4, hemDepth: 7,
  armLength: 44, armWidth: 6, fingerLength: 11, signSize: 44, signAbove: 44, signPlate: 'rgba(14,8,44,0.86)',
};
const BOOK = { w: 104, h: 28, cover: '#7a3f8e', page: '#fff6dc', glow: '#ffe27a' };
const PAGE_ICONS = { y: 42, spacing: 40, w: 26, h: 32, color: '#fff6dc', lost: 'rgba(255,255,255,0.14)' };
const HINT = { y: 92, size: 20, seconds: 9 };
const RESULT_PANEL = { x: 390, y: 180, w: 500, h: 300 };

export function renderNight(): void {
  const time = clock.time;
  drawHallBackground(time);
  drawCat(CHEF_CAT, RAID_BOOK.x, HALL_FLOOR_Y, CHEF_SCALE, time, raid.pages === RAID.pages ? 'neutral' : 'thinking');
  drawCounter(time);
  dimBackground(DARKNESS);
  drawBook();
  raid.crumbs.forEach(drawCrumb);
  drawMotes();
  drawMagicStrokes();
  drawPageIcons();
  drawCoinCounter(16, 12);
  if (raid.result) { drawResult(raid.result); return; }
  if (time - runtime.sceneStartTime < HINT.seconds) drawText(t().story.nightHint, SCREEN_W / 2, HINT.y, HINT.size, TEXT.main, 'center', 800);
}

function drawBook(): void {
  const { x, y } = RAID_BOOK, { w, h } = BOOK;
  drawGlow(x, y, 120, BOOK.glow, 0.28 + 0.1 * Math.sin(clock.time * 3));
  ctx.fillStyle = BOOK.cover; roundRectPath(x - w / 2 - 5, y - h / 2 + 5, w + 10, h, 7); ctx.fill();
  ctx.fillStyle = BOOK.page; roundRectPath(x - w / 2, y - h / 2, w / 2 - 2, h - 2, 5); ctx.fill();
  roundRectPath(x + 2, y - h / 2, w / 2 - 2, h - 2, 5); ctx.fill();
}

/** A black ghost writhing on its way: a swaying body with a torn wavy hem, thin arms reaching forward, glowing slanted eyes. */
function drawCrumb(crumb: RaidCrumb): void {
  const { x, y } = crumbPosition(crumb), def = ELEMENTS[crumb.element], { width, height, hemWaves, sway } = GHOST;
  const phase = clock.time * GHOST.speed + crumb.fromY, lean = Math.sin(phase * 0.7) * sway, reach = RAID_BOOK.x > x ? 1 : -1;
  const headY = y - height * 0.55, hemY = y + height * 0.45;
  ctx.save();
  ctx.shadowColor = GHOST.rim; ctx.shadowBlur = 18;
  for (const side of [-1, 1]) drawGhostArm(x + side * width * 0.75 + lean * 0.4, headY + height * 0.4, side, reach, phase);
  ctx.fillStyle = GHOST.body;
  ctx.beginPath();
  ctx.moveTo(x - width + lean * 0.3, y);
  ctx.quadraticCurveTo(x - width + lean, headY - height * 0.1, x + lean, headY - height * 0.12); // up over the head
  ctx.quadraticCurveTo(x + width + lean, headY - height * 0.1, x + width + lean * 0.3, y);
  for (let i = hemWaves * 2; i >= 0; i--) { // back along the hem, its tatters writhing
    const k = i / (hemWaves * 2), px = x - width + width * 2 * k - lean * 0.5;
    ctx.lineTo(px, hemY + (i % 2 ? -GHOST.hemDepth : GHOST.hemDepth * 0.6) + Math.sin(phase * 1.6 + i * 1.3) * GHOST.hemDepth * 0.7);
  }
  ctx.closePath(); ctx.fill();
  ctx.restore();
  for (const side of [-1, 1]) { // slanted eyes, inner corners down
    const eyeX = x + lean * 0.8 + side * width * 0.36, eyeY = headY + height * 0.16;
    ctx.fillStyle = GHOST.eyes; ctx.shadowColor = GHOST.eyes; ctx.shadowBlur = 10;
    ctx.beginPath(); ctx.moveTo(eyeX - side * 8, eyeY + 4); ctx.lineTo(eyeX + side * 8, eyeY - 5); ctx.lineTo(eyeX + side * 3, eyeY + 6); ctx.closePath(); ctx.fill();
    ctx.shadowBlur = 0;
  }
  const plateY = headY - GHOST.signAbove, half = GHOST.signSize / 2 + 8;
  ctx.fillStyle = GHOST.signPlate; roundRectPath(x - half, plateY - half, half * 2, half * 2, 12); ctx.fill();
  if (crumbProgress(crumb) > 0.7) { ctx.strokeStyle = BUTTON_COLOR.danger; ctx.lineWidth = 3; ctx.stroke(); }
  drawSign(crumb.element, x, plateY, GHOST.signSize, def.color, 3);
}

/** A thin wavering arm with three claw-like fingers, raised and reaching towards the book. */
function drawGhostArm(x: number, y: number, side: number, reach: number, phase: number): void {
  const { armLength, armWidth, fingerLength } = GHOST, wave = Math.sin(phase * 1.3 + side) * 12;
  const elbowX = x + side * armLength * 0.4 + reach * 8, elbowY = y + wave, handX = x + side * armLength * 0.8 + reach * armLength * 0.3, handY = y - armLength * 0.35 - wave;
  ctx.strokeStyle = GHOST.body; ctx.lineCap = 'round'; ctx.lineWidth = armWidth;
  ctx.beginPath(); ctx.moveTo(x, y); ctx.quadraticCurveTo(elbowX, elbowY, handX, handY); ctx.stroke();
  ctx.lineWidth = armWidth * 0.5;
  for (const spread of [-0.55, 0, 0.55]) {
    const angle = Math.atan2(handY - elbowY, handX - elbowX) + spread + Math.sin(phase * 2 + spread) * 0.15;
    ctx.beginPath(); ctx.moveTo(handX, handY); ctx.lineTo(handX + Math.cos(angle) * fingerLength, handY + Math.sin(angle) * fingerLength); ctx.stroke();
  }
}

function drawPageIcons(): void {
  const { y, spacing, w, h, color, lost } = PAGE_ICONS, left = SCREEN_W / 2 - ((RAID.pages - 1) * spacing) / 2;
  for (let i = 0; i < RAID.pages; i++) {
    ctx.fillStyle = i < raid.pages ? color : lost;
    roundRectPath(left + i * spacing - w / 2, y - h / 2, w, h, 5); ctx.fill();
  }
}

function drawResult(result: { won: boolean; coins: number }): void {
  const { x, y, w, h } = RESULT_PANEL;
  withPopIn(runtime.sceneStartTime, SCREEN_W / 2, SCREEN_H / 2, () => {
    drawPanel(x, y, w, h);
    drawTitle(result.won ? t().story.nightWonTitle : t().story.nightLostTitle, x + w / 2, y + 56, 30, TEXT.main);
    wrapText(result.won ? t().story.nightWon : t().story.nightLost, w - 70, 20, 700)
      .forEach((line, i) => drawText(line, x + w / 2, y + 110 + i * 28, 20, TEXT.main, 'center', 700));
    drawText((result.coins > 0 ? '+' : '') + result.coins, x + w / 2, y + h - 104, 26, result.won ? '#5ff0c8' : '#ff7f9f', 'center', 900);
    button('nightDone', x + w / 2 - 130, y + h - 76, 260, 58, t().next, { color: BUTTON_COLOR.confirm, fontSize: 23, glow: true, onClick: finishNight });
  });
}
