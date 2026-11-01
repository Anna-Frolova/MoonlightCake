// The magical café: hall background, counter and kitchen. Purely decorative.
import { ctx, firstOnGrid, view } from '../core/canvas';
import { shade } from '../core/color';
import { drawGlow, drawText, drawTitle, ellipsePath, roundRectPath, starPath } from '../core/draw';
import { t } from '../data/strings';
import type { Cake, HelperId } from '../data/types';
import { createCake, createCreamDots, updateCreamCoverage } from '../game/cake';
import { isOwned, progress, runtime } from '../game/state';
import { CAKE_BASE_Y, CAKE_CENTER_X, HELPER_SHELF } from '../kitchen/layout';
import { drawCake } from './cake';
import { softGradient } from './cat';
import { drawHelperIcon } from './icons';

/** Floor line of the hall: cats stand here and the counter starts just above it. */
export const HALL_FLOOR_Y = 548;
/** Top edge of the counter, where paws and served cakes rest. */
export const COUNTER_TOP_Y = 508;
/** Decorative panels on the front of the counter repeat every this many pixels. */
const COUNTER_PANEL_SPACING = 210;

const SHELF_WOOD = '#4a2c80';
const SHELF_HIGHLIGHT = '#6a46a8';
const WINDOW_FRAME = '#3d2468';
const GOLD_METAL = '#e8b84a';
const VITRAGE_GLASS = ['#5b7fff', '#a06aff', '#3fd5e8', '#ff6ac8', '#ffd04e', '#6be0a0'];
const GARLAND_BULBS = ['#7ff0ff', '#ff8fd8', '#c9a0ff', '#fff096'];

/** Glowing rune circle slowly rotating on the floor/wall. */
export function drawMagicCircle(x: number, y: number, radius: number, time: number, alpha = 0.14): void {
  ctx.save(); ctx.translate(x, y); ctx.scale(1, 0.92);
  ctx.strokeStyle = `rgba(150,190,255,${alpha})`; ctx.lineWidth = 2;
  // outer rings with ticks and six small circles
  ctx.save(); ctx.rotate(time * 0.06);
  ellipsePath(0, 0, radius, radius); ctx.stroke();
  ellipsePath(0, 0, radius * 0.86, radius * 0.86); ctx.stroke();
  for (let i = 0; i < 24; i++) {
    const angle = (i / 24) * Math.PI * 2, outer = i % 2 ? 0.93 : 1;
    ctx.beginPath();
    ctx.moveTo(Math.cos(angle) * radius * 0.86, Math.sin(angle) * radius * 0.86);
    ctx.lineTo(Math.cos(angle) * radius * outer, Math.sin(angle) * radius * outer);
    ctx.stroke();
  }
  for (let i = 0; i < 6; i++) {
    const angle = (i / 6) * Math.PI * 2;
    ellipsePath(Math.cos(angle) * radius * 0.93, Math.sin(angle) * radius * 0.93, 6, 6); ctx.stroke();
  }
  ctx.restore();
  // hexagram + inner ring, rotating the other way
  ctx.save(); ctx.rotate(-time * 0.1);
  for (const offset of [0, Math.PI]) {
    ctx.beginPath();
    for (let i = 0; i < 3; i++) {
      const angle = offset - Math.PI / 2 + (i * Math.PI * 2) / 3;
      ctx.lineTo(Math.cos(angle) * radius * 0.82, Math.sin(angle) * radius * 0.82);
    }
    ctx.closePath(); ctx.stroke();
  }
  ellipsePath(0, 0, radius * 0.4, radius * 0.4); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

/** Glowing orb hanging on a thread from the ceiling. */
function drawOrb(x: number, y: number, color: string, time: number, radius = 13): void {
  const bob = Math.sin(time * 1.6 + x) * 6;
  drawGlow(x, y + bob, radius * 9, color, 0.22);
  ctx.strokeStyle = 'rgba(200,220,255,0.25)'; ctx.lineWidth = 1.5;
  ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, y + bob - radius); ctx.stroke();
  ellipsePath(x, y + bob, radius, radius);
  const fill = ctx.createRadialGradient(x - radius * 0.3, y + bob - radius * 0.3, 1, x, y + bob, radius);
  fill.addColorStop(0, '#ffffff'); fill.addColorStop(0.4, color); fill.addColorStop(1, shade(color, -0.3));
  ctx.fillStyle = fill; ctx.fill();
}

/** Decorative glass flask on a shelf. */
function drawShelfPotion(x: number, y: number, color: string, time: number, height = 46): void {
  const h = height;
  drawGlow(x, y - h * 0.4, 40, color, 0.25 + 0.1 * Math.sin(time * 2 + x));
  ctx.beginPath();
  ctx.moveTo(x - 6, y - h); ctx.lineTo(x + 6, y - h); ctx.lineTo(x + 6, y - h * 0.62);
  ctx.quadraticCurveTo(x + 20, y - h * 0.55, x + 20, y - h * 0.25);
  ctx.quadraticCurveTo(x + 20, y, x, y);
  ctx.quadraticCurveTo(x - 20, y, x - 20, y - h * 0.25);
  ctx.quadraticCurveTo(x - 20, y - h * 0.55, x - 6, y - h * 0.62);
  ctx.closePath();
  ctx.fillStyle = 'rgba(200,220,255,0.18)'; ctx.fill();
  ctx.strokeStyle = 'rgba(220,230,255,0.7)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.save(); ctx.clip();
  ctx.fillStyle = color; ctx.fillRect(x - 22, y - h * 0.42 + Math.sin(time * 2 + x) * 2, 44, h);
  ctx.restore();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ellipsePath(x - 9, y - h * 0.3, 3, 7); ctx.fill();
  roundRectPath(x - 7, y - h - 8, 14, 9, 3); ctx.fillStyle = '#8a5a9e'; ctx.fill();
}

function drawCrystals(x: number, y: number, scale: number, time: number): void {
  const crystals: [offsetX: number, width: number, height: number, color: string][] = [
    [-18, 16, 46, '#7ff0ff'], [6, 18, 62, '#b48cff'], [26, 12, 36, '#ff9ce6'],
  ];
  drawGlow(x, y - 30 * scale, 70 * scale, '#9f8cff', 0.25 + 0.08 * Math.sin(time * 2));
  for (const [dx, w, h, color] of crystals) {
    const left = x + (dx - w / 2) * scale, right = x + (dx + w / 2) * scale, middle = x + dx * scale;
    ctx.beginPath();
    ctx.moveTo(left, y); ctx.lineTo(left, y - h * 0.7 * scale); ctx.lineTo(middle, y - h * scale);
    ctx.lineTo(right, y - h * 0.7 * scale); ctx.lineTo(right, y);
    ctx.closePath();
    const fill = ctx.createLinearGradient(left, 0, right, 0);
    fill.addColorStop(0, shade(color, 0.4)); fill.addColorStop(1, shade(color, -0.25));
    ctx.fillStyle = fill; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.5)'; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(middle, y - h * scale); ctx.lineTo(middle, y); ctx.stroke();
  }
}

function drawShelfBoard(x: number, y: number, w: number, h: number): void {
  ctx.fillStyle = SHELF_WOOD; roundRectPath(x, y, w, h, h / 2); ctx.fill();
  ctx.fillStyle = SHELF_HIGHLIGHT; roundRectPath(x, y, w, h * 0.4, h * 0.2); ctx.fill();
}

// ---------------- hall ----------------

export function drawHallBackground(time: number): void {
  const wall = ctx.createLinearGradient(0, 0, 0, 540);
  wall.addColorStop(0, '#0d0828'); wall.addColorStop(0.55, '#221456'); wall.addColorStop(1, '#3a1f78');
  ctx.fillStyle = wall; ctx.fillRect(view.left, view.top, view.right - view.left, 540 - view.top);
  // wallpaper of faint twinkling stars
  for (let y = 40, row = 0; y < 500; y += 58, row++) {
    for (let x = firstOnGrid(view.left, 90, (row % 2) * 45 + 25); x < view.right; x += 90) {
      ctx.fillStyle = `rgba(160,170,255,${0.05 + 0.04 * Math.sin(time + x * 0.05 + y)})`;
      starPath(x, y, 6, 2.4, 4, 0); ctx.fill();
    }
  }
  drawMagicCircle(640, 330, 215, time, 0.13);

  if (isOwned('decor:vitrage')) drawVitrage(time); else drawNightWindow(time);
  drawShelfBoard(38, 330, 284, 22); // window sill
  if (isOwned('decor:cushion')) drawSleepingKitten(time);
  if (runtime.scene !== 'title') drawMenuBoard();

  // shelves on the right with potions, books and crystals
  for (const shelfY of [178, 306]) drawShelfBoard(888, shelfY, 344, 18);
  ([['#7ff0ff', 925], ['#ff7fd8', 985], ['#b48cff', 1045], ['#ffd86b', 1105]] as const)
    .forEach(([color, x]) => drawShelfPotion(x, 178, color, time, 50));
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = ['#8e6ff0', '#35c3a5', '#ff7fb0'][i];
    roundRectPath(905 + i * 26, 250 - i * 4, 22, 56 + i * 4, 5); ctx.fill();
    ctx.fillStyle = 'rgba(255,255,255,0.3)'; ctx.fillRect(909 + i * 26, 260 - i * 4, 14, 3);
  }
  drawCrystals(1050, 306, 1, time);
  if (isOwned('decor:gramophone')) drawGramophone(time); else drawGlowingMushroom();

  drawOrb(820, 90, '#7ff0ff', time);
  drawOrb(1150, 70, '#c9a0ff', time, 11);
  drawOrb(330, 40, '#ff9ce6', time, 9);
  if (isOwned('decor:chandelier')) drawChandelier(time);
  if (isOwned('decor:garland')) drawGarland(time);
}

function drawVitrage(time: number): void {
  const cx = 180, cy = 205, radius = 122;
  drawGlow(cx, cy, 270, '#a08cff', 0.28);
  ellipsePath(cx, cy, radius + 15, radius + 15); ctx.fillStyle = WINDOW_FRAME; ctx.fill();
  for (let i = 0; i < 12; i++) {
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.arc(cx, cy, radius, (i * Math.PI) / 6, ((i + 1) * Math.PI) / 6); ctx.closePath();
    ctx.fillStyle = VITRAGE_GLASS[i % 6];
    ctx.globalAlpha = 0.72 + 0.18 * Math.sin(time * 1.5 + i); ctx.fill(); ctx.globalAlpha = 1;
    ctx.strokeStyle = '#1a0f33'; ctx.lineWidth = 5; ctx.stroke();
  }
  ellipsePath(cx, cy, 52, 52); ctx.fillStyle = '#f2f4ff'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.arc(cx + 15, cy - 8, 44, 0, Math.PI * 2); ctx.fillStyle = '#9a7bf0'; ctx.fill(); // crescent
}

/** Arched window with the night sky, an aurora and the moon. */
function drawNightWindow(time: number): void {
  const x = 70, y = 80, w = 220, h = 250, archY = y + 96;
  const windowPath = (): void => {
    ctx.beginPath(); ctx.moveTo(x, y + h); ctx.lineTo(x, archY);
    ctx.arc(x + w / 2, archY, w / 2, Math.PI, 0); ctx.lineTo(x + w, y + h); ctx.closePath();
  };
  ctx.fillStyle = WINDOW_FRAME;
  ctx.beginPath(); ctx.moveTo(x - 16, y + h + 10); ctx.lineTo(x - 16, archY);
  ctx.arc(x + w / 2, archY, w / 2 + 16, Math.PI, 0); ctx.lineTo(x + w + 16, y + h + 10); ctx.closePath(); ctx.fill();
  const sky = ctx.createLinearGradient(0, y, 0, y + h);
  sky.addColorStop(0, '#05041c'); sky.addColorStop(1, '#251a6e');
  ctx.fillStyle = sky; windowPath(); ctx.fill();

  ctx.save(); windowPath(); ctx.clip();
  for (let band = 0; band < 2; band++) { // aurora
    ctx.beginPath(); ctx.moveTo(x, y + 150 + band * 30);
    for (let px = x; px <= x + w; px += 10) ctx.lineTo(px, y + 120 + band * 34 + Math.sin(px * 0.04 + time * 0.8 + band) * 16);
    ctx.lineTo(x + w, y + 40); ctx.lineTo(x, y + 40); ctx.closePath();
    const aurora = ctx.createLinearGradient(0, y + 40, 0, y + 180);
    aurora.addColorStop(0, 'rgba(80,255,220,0)');
    aurora.addColorStop(1, band ? 'rgba(190,120,255,0.3)' : 'rgba(80,255,220,0.28)');
    ctx.fillStyle = aurora; ctx.fill();
  }
  for (let i = 0; i < 16; i++) {
    const starX = x + 12 + ((i * 53) % (w - 24)), starY = y + 20 + ((i * 37) % (h - 60));
    ctx.fillStyle = `rgba(230,240,255,${0.4 + 0.6 * Math.abs(Math.sin(time * 1.3 + i))})`;
    starPath(starX, starY, 3.5, 1.3, 4, 0); ctx.fill();
  }
  drawGlow(x + 150, y + 80, 90, '#d8e4ff', 0.45);
  ctx.fillStyle = '#eef3ff'; ctx.beginPath(); ctx.arc(x + 150, y + 80, 36, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(150,170,230,0.35)';
  ellipsePath(x + 140, y + 72, 8, 6); ctx.fill(); ellipsePath(x + 160, y + 92, 6, 5); ctx.fill();
  ctx.restore();

  ctx.strokeStyle = WINDOW_FRAME; ctx.lineWidth = 9;
  ctx.beginPath(); ctx.moveTo(x + w / 2, y - 16); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, y + 150); ctx.lineTo(x + w, y + 150); ctx.stroke();
}

function drawSleepingKitten(time: number): void {
  ellipsePath(180, 322, 80, 18); ctx.fillStyle = '#ff8ccf'; ctx.fill();
  ctx.fillStyle = '#ffb3e0'; ellipsePath(180, 316, 62, 10); ctx.fill();
  const fur = '#c9c3f0';
  ellipsePath(186, 300, 40, 23); ctx.fillStyle = softGradient(186, 300, 40, 23, fur); ctx.fill();
  ellipsePath(156, 298, 21, 18); ctx.fillStyle = softGradient(156, 298, 21, 18, fur); ctx.fill();
  ctx.fillStyle = fur;
  ctx.beginPath(); ctx.moveTo(141, 290); ctx.lineTo(143, 274); ctx.lineTo(154, 284); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.moveTo(160, 283); ctx.lineTo(169, 271); ctx.lineTo(172, 288); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#3a2766'; ctx.lineWidth = 2.5; // closed eyes
  ctx.beginPath(); ctx.arc(149, 299, 4, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.beginPath(); ctx.arc(162, 299, 4, 0.2, Math.PI - 0.2); ctx.stroke();
  ctx.strokeStyle = fur; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.moveTo(224, 306); ctx.quadraticCurveTo(232, 322, 196, 320); ctx.stroke(); // tail
  const zPhase = (time * 0.6) % 1;
  drawText('z', 140 - zPhase * 10, 262 - zPhase * 40, 16 + zPhase * 10, `rgba(200,220,255,${1 - zPhase})`, 'center', 900);
}

/** Neon sign with the café's name (hidden on the title screen, which shows the big title). */
function drawMenuBoard(): void {
  ctx.fillStyle = WINDOW_FRAME; roundRectPath(362, 62, 236, 146, 18); ctx.fill();
  ctx.fillStyle = '#0f1838'; roundRectPath(374, 74, 212, 122, 12); ctx.fill();
  drawGlow(480, 120, 110, '#7ff0ff', 0.08);
  ctx.save(); ctx.shadowColor = '#7ff0ff'; ctx.shadowBlur = 10;
  drawTitle(t().gameTitle, 480, 102, 21, '#bff6ff');
  drawText(t().signSubtitle, 480, 130, 15, '#f2b6ff', 'center', 700);
  ctx.strokeStyle = '#bff6ff'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(462, 160); ctx.lineTo(498, 160); ctx.lineTo(492, 178); ctx.lineTo(468, 178); ctx.closePath(); ctx.stroke();
  starPath(480, 150, 6, 2.5); ctx.stroke();
  ctx.restore();
}

function drawGramophone(time: number): void {
  ctx.save(); ctx.translate(1175, 178);
  roundRectPath(-28, -30, 56, 30, 8); ctx.fillStyle = '#6a3a8a'; ctx.fill();
  ctx.strokeStyle = GOLD_METAL; ctx.lineWidth = 4; ctx.beginPath(); ctx.moveTo(4, -30); ctx.lineTo(10, -60); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(8, -56); ctx.lineTo(-10, -112); ctx.lineTo(50, -100); ctx.closePath(); ctx.fillStyle = '#f0c45a'; ctx.fill();
  if (progress.musicOn) { // floating notes
    const phase = (time * 0.7) % 1, phase2 = (phase + 0.5) % 1;
    drawText('♪', 40 + phase * 20, -110 - phase * 40, 20, `rgba(190,240,255,${1 - phase})`);
    drawText('♫', 10 - phase * 14, -120 - phase2 * 40, 18, `rgba(240,190,255,${1 - phase2})`);
  }
  ctx.restore();
}

function drawGlowingMushroom(): void {
  drawGlow(1175, 160, 50, '#7ff0ff', 0.25);
  ctx.fillStyle = '#e8e0ff'; roundRectPath(1169, 146, 12, 32, 5); ctx.fill();
  ctx.beginPath(); ctx.ellipse(1175, 148, 26, 18, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = '#5fd8ff'; ctx.fill();
  ctx.fillStyle = '#e0fbff'; ellipsePath(1166, 140, 4, 3); ctx.fill(); ellipsePath(1183, 136, 3, 3); ctx.fill();
}

function drawChandelier(time: number): void {
  const cx = 640;
  ctx.strokeStyle = GOLD_METAL; ctx.lineWidth = 3;
  ctx.beginPath(); ctx.moveTo(cx, 0); ctx.lineTo(cx, 40); ctx.stroke();
  drawGlow(cx, 80, 320, '#bfe0ff', 0.3);
  ctx.beginPath(); ctx.ellipse(cx, 70, 82, 16, 0, 0, Math.PI); ctx.strokeStyle = GOLD_METAL; ctx.lineWidth = 5; ctx.stroke();
  ctx.beginPath();
  ctx.moveTo(cx, 40); ctx.lineTo(cx - 82, 70); ctx.moveTo(cx, 40); ctx.lineTo(cx + 82, 70); ctx.moveTo(cx, 40); ctx.lineTo(cx, 86);
  ctx.stroke();
  for (let i = 0; i < 7; i++) { // hanging crystals
    const angle = (i / 6) * Math.PI, px = cx - Math.cos(angle) * 82, py = 70 + Math.sin(angle) * 16;
    ctx.fillStyle = `rgba(180,240,255,${0.6 + 0.4 * Math.sin(time * 3 + i)})`;
    ctx.beginPath(); ctx.moveTo(px, py + 4); ctx.lineTo(px + 5, py + 14); ctx.lineTo(px, py + 26); ctx.lineTo(px - 5, py + 14); ctx.closePath(); ctx.fill();
  }
  for (const side of [-1, 0, 1]) { // candles
    const px = cx + side * 82, py = side === 0 ? 86 : 70;
    roundRectPath(px - 4, py - 22, 8, 18, 2); ctx.fillStyle = '#f2ecff'; ctx.fill();
    const flicker = 0.85 + 0.15 * Math.sin(time * 11 + side);
    drawGlow(px, py - 28, 16, '#9feaff', 0.6);
    ctx.fillStyle = '#bff6ff'; ellipsePath(px, py - 28, 4, 7 * flicker); ctx.fill();
  }
}

function drawGarland(time: number): void {
  const SWAG_WIDTH = 320, SAG = 32, TOP = 18;
  const wireY = (x: number) => TOP + Math.sin((((x % SWAG_WIDTH) + SWAG_WIDTH) % SWAG_WIDTH / SWAG_WIDTH) * Math.PI) * SAG;
  const firstX = firstOnGrid(view.left, SWAG_WIDTH);
  ctx.strokeStyle = '#3a2a6a'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(firstX, TOP);
  for (let x = firstX; x <= view.right + 20; x += 20) ctx.lineTo(x, wireY(x));
  ctx.stroke();
  for (let x = firstX + 20, i = 0; x < view.right; x += 40, i++) {
    const y = wireY(x) + 8, twinkle = 0.6 + 0.4 * Math.sin(time * 2.4 + i * 1.7), color = GARLAND_BULBS[i % 4];
    drawGlow(x, y, 20, color, 0.6 * twinkle);
    ellipsePath(x, y, 5, 7); ctx.fillStyle = color; ctx.fill();
  }
}

// ---------------- counter ----------------

/** Display cake under the glass cloche on the counter. */
let clocheCake: Cake | null = null;
function getClocheCake(): Cake {
  if (clocheCake) return clocheCake;
  const cake = createCake('heart');
  cake.seed = 3;
  cake.stack = [{ kind: 'layer', flavor: 'strawberry' }, { kind: 'filling', filling: 'jelly' }, { kind: 'layer', flavor: 'lavender' }];
  cake.cream = 'butter';
  createCreamDots(cake);
  cake.creamDots!.forEach(dot => { dot.isPiped = true; });
  updateCreamCoverage(cake);
  cake.glaze = [255, 160, 220];
  cake.toppings = [{ topping: 'rosePink', x: 0, y: 0 }];
  return (clocheCake = cake);
}

export function drawCounter(time: number): void {
  ctx.fillStyle = '#24154a'; ctx.fillRect(view.left, 532, view.right - view.left, view.bottom - 532);
  for (let x = firstOnGrid(view.left, COUNTER_PANEL_SPACING, 24), i = 0; x < view.right; x += COUNTER_PANEL_SPACING, i++) { // front panels
    ctx.fillStyle = '#2f1d5e'; roundRectPath(x, 566, 190, 140, 22); ctx.fill();
    ctx.strokeStyle = '#4a3290'; ctx.lineWidth = 3; roundRectPath(x + 10, 576, 170, 120, 16); ctx.stroke();
    ctx.fillStyle = `rgba(127,240,255,${0.25 + 0.15 * Math.sin(time * 2 + i)})`;
    starPath(x + 95, 636, 7, 3, 4, 0); ctx.fill();
  }
  const edgeLight = ctx.createLinearGradient(0, 534, 0, 552);
  edgeLight.addColorStop(0, 'rgba(127,240,255,0.55)'); edgeLight.addColorStop(1, 'rgba(127,240,255,0)');
  ctx.fillStyle = edgeLight; ctx.fillRect(view.left, 534, view.right - view.left, 18);
  const top = ctx.createLinearGradient(0, 500, 0, 538);
  top.addColorStop(0, '#9a72dc'); top.addColorStop(1, '#5e3aa0');
  ctx.fillStyle = top; roundRectPath(view.left - 10, 504, view.right - view.left + 20, 34, 17); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.22)'; roundRectPath(view.left + 10, 508, view.right - view.left - 20, 6, 3); ctx.fill();

  // cloche with a mini cake
  ctx.save(); ctx.translate(310, COUNTER_TOP_Y);
  ellipsePath(0, 0, 56, 10); ctx.fillStyle = '#e9e4ff'; ctx.fill();
  drawCake(getClocheCake(), 0, -6, 0.3);
  ctx.beginPath(); ctx.moveTo(-48, 0); ctx.bezierCurveTo(-50, -92, 50, -92, 48, 0);
  ctx.fillStyle = 'rgba(200,220,255,0.14)'; ctx.fill();
  ctx.strokeStyle = 'rgba(200,230,255,0.6)'; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(-31, -20); ctx.quadraticCurveTo(-31, -54, -10, -62); ctx.stroke();
  ellipsePath(0, -68, 7, 5); ctx.fillStyle = GOLD_METAL; ctx.fill();
  ctx.restore();

  // service bell
  ctx.save(); ctx.translate(980, COUNTER_TOP_Y);
  ellipsePath(0, 0, 26, 6); ctx.fillStyle = WINDOW_FRAME; ctx.fill();
  ctx.beginPath(); ctx.moveTo(-18, -2); ctx.quadraticCurveTo(-18, -30, 0, -30); ctx.quadraticCurveTo(18, -30, 18, -2); ctx.closePath();
  ctx.fillStyle = '#f0c45a'; ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.4)'; ellipsePath(-7, -18, 4, 7); ctx.fill();
  ellipsePath(0, -33, 4, 4); ctx.fillStyle = '#f0c45a'; ctx.fill();
  ctx.restore();

  if (isOwned('decor:catnip')) for (const potX of [110, 1170]) drawCatnipPot(potX, time);

  for (let i = 0; i < 3; i++) { // drifting floor mist
    const span = view.right - view.left + 400, mistX = view.left - 200 + ((time * 18 + i * span / 3) % span);
    drawGlow(mistX, 548, 200, '#a88cff', 0.1);
  }
}

function drawCatnipPot(x: number, time: number): void {
  ctx.save(); ctx.translate(x, COUNTER_TOP_Y);
  drawGlow(0, -50, 70, '#5ff0c0', 0.2);
  for (let i = 0; i < 7; i++) {
    const angle = -Math.PI / 2 + (i - 3) * 0.32 + Math.sin(time * 1.4 + i) * 0.05;
    ctx.save(); ctx.rotate(angle + Math.PI / 2);
    ellipsePath(0, -46, 11, 27); ctx.fillStyle = i % 2 ? '#35c3a5' : '#5ff0c0'; ctx.fill();
    ctx.restore();
  }
  ctx.beginPath(); ctx.moveTo(-28, -40); ctx.lineTo(28, -40); ctx.lineTo(22, 0); ctx.lineTo(-22, 0); ctx.closePath();
  ctx.fillStyle = '#7a4fd0'; ctx.fill();
  ctx.fillStyle = '#9a72ec'; ctx.fillRect(-27, -40, 54, 8);
  ctx.restore();
}

// ---------------- kitchen ----------------

/** Helpers shown on the kitchen shelf once bought (the glaze cauldron and kitten appear elsewhere). */
const SHELF_HELPERS: HelperId[] = ['layers', 'cream', 'magic'];

export function drawKitchenBackground(time: number): void {
  const wall = ctx.createLinearGradient(0, 0, 0, 540);
  wall.addColorStop(0, '#0e0a2c'); wall.addColorStop(1, '#2c1a62');
  ctx.fillStyle = wall; ctx.fillRect(view.left, view.top, view.right - view.left, 540 - view.top);
  for (let y = 60, row = 0; y < 520; y += 44, row++) { // tiles
    for (let x = firstOnGrid(view.left, 44, (row % 2) * 22 - 22); x < view.right; x += 44) {
      ctx.fillStyle = `rgba(140,150,255,${0.04 + 0.02 * Math.sin(time * 0.8 + x * 0.02 + y * 0.03)})`;
      roundRectPath(x + 3, y + 3, 38, 38, 10); ctx.fill();
    }
  }
  drawMagicCircle(CAKE_CENTER_X, 340, 230, time, 0.12);
  drawGlow(CAKE_CENTER_X, 300, 380, '#8f7cff', 0.18);
  drawOrb(CAKE_CENTER_X - 150, 70, '#7ff0ff', time, 11);
  drawOrb(CAKE_CENTER_X + 170, 90, '#ff9ce6', time, 10);

  // shelf with the bought helpers (empty dashed slots otherwise)
  const shelf = HELPER_SHELF;
  drawShelfBoard(shelf.x, shelf.y, shelf.w, 16);
  SHELF_HELPERS.forEach((helper, i) => {
    const x = shelf.slotXs[i];
    if (isOwned(`helper:${helper}`)) drawHelperIcon(helper, x, shelf.y - 24, 0.75, time);
    else {
      ctx.strokeStyle = 'rgba(180,170,255,0.16)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 2;
      roundRectPath(x - 18, shelf.y - 36, 36, 32, 10); ctx.stroke(); ctx.setLineDash([]);
    }
  });
  drawShelfPotion(shelf.potionX, shelf.y, '#7ff0ff', time, 34);

  // table
  const table = ctx.createLinearGradient(0, 520, 0, 650);
  table.addColorStop(0, '#6a46b0'); table.addColorStop(1, '#3e2678');
  ctx.fillStyle = table; ctx.fillRect(view.left, 520, view.right - view.left, 130);
  ctx.fillStyle = 'rgba(255,255,255,0.18)'; ctx.fillRect(view.left, 520, view.right - view.left, 5);
  const edgeLight = ctx.createLinearGradient(0, 520, 0, 540);
  edgeLight.addColorStop(0, 'rgba(127,240,255,0.25)'); edgeLight.addColorStop(1, 'rgba(127,240,255,0)');
  ctx.fillStyle = edgeLight; ctx.fillRect(view.left, 524, view.right - view.left, 16);
  ctx.fillStyle = '#140c33'; ctx.fillRect(view.left, 640, view.right - view.left, view.bottom - 640);

  drawCakeStand();
}

/** Crystal stand under the cake; moves and scales together with the cake. */
function drawCakeStand(): void {
  const cx = CAKE_CENTER_X;
  ctx.save();
  ctx.translate(runtime.cakeX, CAKE_BASE_Y); ctx.scale(runtime.cakeScale, runtime.cakeScale); ctx.translate(-cx, -CAKE_BASE_Y);
  drawGlow(cx, 580, 200, '#7ff0ff', 0.14);
  ellipsePath(cx, 632, 74, 13); ctx.fillStyle = '#b8a8f0'; ctx.fill();
  ctx.fillStyle = '#d8d0ff';
  ctx.beginPath(); ctx.moveTo(cx - 16, 630); ctx.lineTo(cx - 10, 590); ctx.lineTo(cx + 10, 590); ctx.lineTo(cx + 16, 630); ctx.closePath(); ctx.fill();
  ctx.beginPath(); ctx.ellipse(cx, 578, 172, 42, 0, 0, Math.PI); ctx.lineTo(cx - 172, 571); ctx.fillStyle = '#a898e0'; ctx.fill();
  ellipsePath(cx, 571, 172, 42); ctx.fillStyle = '#efeaff'; ctx.fill();
  ctx.strokeStyle = 'rgba(127,240,255,0.6)'; ctx.lineWidth = 2.5; ctx.stroke();
  ellipsePath(cx, 571, 152, 34); ctx.strokeStyle = 'rgba(160,140,230,0.5)'; ctx.lineWidth = 2; ctx.stroke();
  ctx.restore();
}
