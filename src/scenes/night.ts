// The night raid: the dark hall, the chef guarding the recipe book, faded grey ghosts drifting in with signs over them.
import { ctx, SCREEN_H, SCREEN_W } from '../core/canvas';
import { clock } from '../core/clock';
import { hexToRgb, mixRgb, rgbToHex, withAlpha } from '../core/color';
import { drawGlow, drawPanel, drawText, drawTitle, roundRectPath, withPopIn, wrapText } from '../core/draw';
import { drawMotes } from '../core/particles';
import { BUTTON_COLOR, TEXT } from '../core/theme';
import { button } from '../core/ui';
import { CHEF_CAT } from '../data/cats';
import { ELEMENTS } from '../data/elements';
import { t } from '../data/strings';
import { finishNight } from '../game/flow';
import { FREED_SECONDS, ghostPosition, ghostProgress, raid, RAID, RAID_BOOK, type FreedGhost, type GhostKind, type RaidGhost } from '../game/nightRaid';
import { runtime } from '../game/state';
import { drawMagicStrokes } from '../kitchen/stations/magic';
import { drawCat } from '../render/cat';
import { drawCounter, drawHallBackground, HALL_FLOOR_Y } from '../render/environment';
import { drawSign } from '../render/signs';
import { dimBackground, drawCoinCounter } from './hud';

const DARKNESS = 0.68;
const CHEF_SCALE = 0.95;
/**
 * The ghosts: faded grey with a soft pale glow so they stand out from the night; freed ones fill with their sign's colour.
 * Sheet: half-width and height of the body, its wavy hem. Wisp: the head's radius and the tail behind it.
 */
const GHOST = {
  body: '#aaa4b6', highlight: '#d3cede', face: '#4a4458', glow: '#d3cede', glowAlpha: 0.22, blush: 'rgba(255,143,184,0.75)',
  sheet: { width: 30, height: 70, hemWaves: 5, hemDepth: 9, hemSpeed: 4, lean: 4 },
  wisp: { radius: 24, tailLength: 62, tailWave: 7, dust: 5, dustSpacing: 15 },
  signSize: 44, signAbove: 40, signPlate: 'rgba(14,8,44,0.86)',
  /** A freed ghost: how fast it fills with colour, how high it floats, how much it sways. */
  freed: { colorSeconds: 0.35, rise: 150, sway: 10 },
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
  raid.freed.forEach(drawFreedGhost);
  raid.ghosts.forEach(drawRaidGhost);
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

/** A ghost on its way to the book, with its sign above; the plate turns red when it is close. */
function drawRaidGhost(ghost: RaidGhost): void {
  const { x, y } = ghostPosition(ghost), def = ELEMENTS[ghost.element];
  // the wisp's tail trails behind it, opposite to where it is heading
  const before = ghostPosition(ghost, clock.time - 0.06), heading = Math.atan2(y - before.y, x - before.x);
  const top = drawGhost(ghost.kind, x, y, heading, ghost.startTime, GHOST.body, false);
  const plateY = top - GHOST.signAbove, half = GHOST.signSize / 2 + 8;
  ctx.fillStyle = GHOST.signPlate; roundRectPath(x - half, plateY - half, half * 2, half * 2, 12); ctx.fill();
  if (ghostProgress(ghost) > 0.7) { ctx.strokeStyle = BUTTON_COLOR.danger; ctx.lineWidth = 3; ctx.stroke(); }
  drawSign(ghost.element, x, plateY, GHOST.signSize, def.color, 3);
}

/** A freed ghost fills with its sign's colour, smiles and floats up, swaying, as it fades. */
function drawFreedGhost(ghost: FreedGhost): void {
  const k = (clock.time - ghost.startTime) / FREED_SECONDS, { colorSeconds, rise, sway } = GHOST.freed;
  const color = mixHex(GHOST.body, ELEMENTS[ghost.element].color, Math.min(1, (clock.time - ghost.startTime) / colorSeconds));
  ctx.save();
  ctx.globalAlpha = Math.max(0, Math.min(1, (1 - k) * 2));
  drawGhost(ghost.kind, ghost.x + Math.sin(k * 9) * sway, ghost.y - rise * k * k, -Math.PI / 2, ghost.startTime, color, true);
  ctx.restore();
}

/**
 * Draws a ghost standing at (x, y) (the bottom of the sheet, the wisp's head lower edge) and returns the y of its top.
 * `heading`: where a wisp is flying (its tail points the other way). `seed`: keeps each ghost's wobble its own.
 */
function drawGhost(kind: GhostKind, x: number, y: number, heading: number, seed: number, color: string, isFreed: boolean): number {
  const phase = clock.time + seed;
  if (kind === 'sheet') {
    const { width, height, hemWaves, hemDepth, hemSpeed, lean: leanAmount } = GHOST.sheet, lean = Math.sin(phase * 1.6) * leanAmount;
    const headY = y - height + width;
    drawGlow(x, y - height / 2, height * 0.9, GHOST.glow, GHOST.glowAlpha);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(x - width, y);
    ctx.lineTo(x - width, headY);
    ctx.arc(x + lean * 0.3, headY, width, Math.PI, 0);
    ctx.lineTo(x + width, y);
    for (let i = hemWaves - 1; i >= 0; i--) { // the soft wavy hem, back to the left
      const left = x - width + (i * width * 2) / hemWaves;
      ctx.quadraticCurveTo(left + width / hemWaves, y + hemDepth + Math.sin(phase * hemSpeed + i) * hemDepth * 0.3, left, y);
    }
    ctx.fill();
    ctx.fillStyle = GHOST.highlight;
    ctx.beginPath(); ctx.ellipse(x - width * 0.45, headY - width * 0.4, 5, 9, -0.4, 0, Math.PI * 2); ctx.fill();
    drawGhostFace(x + 4 + lean * 0.3, headY + 8, isFreed);
    return y - height;
  }
  const { radius, tailLength, tailWave, dust, dustSpacing } = GHOST.wisp, cy = y - radius;
  const back = heading + Math.PI, wave = Math.sin(phase * 6) * tailWave;
  const tipX = x + Math.cos(back) * tailLength - Math.sin(back) * wave, tipY = cy + Math.sin(back) * tailLength + Math.cos(back) * wave;
  if (!isFreed) for (let i = 1; i <= dust; i++) { // grey dust trailing behind
    const d = tailLength + i * dustSpacing;
    ctx.fillStyle = withAlpha(GHOST.highlight, 0.5 - i * 0.08);
    ctx.beginPath(); ctx.arc(x + Math.cos(back) * d, cy + Math.sin(back) * d + Math.sin(phase * 3 + i) * 5, 4 - i * 0.5, 0, Math.PI * 2); ctx.fill();
  }
  drawGlow(x, cy, radius * 2.4, GHOST.glow, GHOST.glowAlpha);
  ctx.fillStyle = color;
  ctx.beginPath(); ctx.arc(x, cy, radius, 0, Math.PI * 2); ctx.fill();
  const side = Math.PI / 2; // the tail: from both sides of the head, narrowing to its tip
  ctx.beginPath();
  ctx.moveTo(x + Math.cos(back - side) * radius, cy + Math.sin(back - side) * radius);
  ctx.quadraticCurveTo(x + Math.cos(back - 0.5) * tailLength * 0.6, cy + Math.sin(back - 0.5) * tailLength * 0.6, tipX, tipY);
  ctx.quadraticCurveTo(x + Math.cos(back + 0.3) * tailLength * 0.5, cy + Math.sin(back + 0.3) * tailLength * 0.5, x + Math.cos(back + side) * radius, cy + Math.sin(back + side) * radius);
  ctx.fill();
  ctx.fillStyle = GHOST.highlight;
  ctx.beginPath(); ctx.ellipse(x - radius * 0.4, cy - radius * 0.45, 4, 7, -0.5, 0, Math.PI * 2); ctx.fill();
  drawGhostFace(x + 3, cy + 2, isFreed);
  return cy - radius;
}

/** Faded: sleepy eyes and a small round mouth. Freed: smiling eyes, a smile and pink cheeks. */
function drawGhostFace(x: number, y: number, isFreed: boolean): void {
  ctx.strokeStyle = GHOST.face; ctx.fillStyle = GHOST.face; ctx.lineWidth = 3; ctx.lineCap = 'round';
  if (isFreed) {
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(x + side * 10, y + 2, 5, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke(); }
    ctx.beginPath(); ctx.arc(x, y + 8, 6, 0.15 * Math.PI, 0.85 * Math.PI); ctx.stroke();
    ctx.fillStyle = GHOST.blush;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(x + side * 18, y + 9, 5, 0, Math.PI * 2); ctx.fill(); }
    return;
  }
  ctx.beginPath(); ctx.moveTo(x - 15, y); ctx.lineTo(x - 6, y); ctx.moveTo(x + 6, y); ctx.lineTo(x + 15, y); ctx.stroke();
  ctx.beginPath(); ctx.arc(x, y + 12, 3.5, 0, Math.PI * 2); ctx.fill();
}

const mixHex = (from: string, to: string, k: number): string => rgbToHex(mixRgb(hexToRgb(from), hexToRgb(to), k));

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
