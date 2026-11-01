// The kitchen dressed up for a special guest: a stone dungeon (demon), a bright place in the clouds (angel),
// Dracula's palace (vampire), a shrine at night (samurai), a ritual hall (cultist) and a flower meadow (fairy). Each theme draws its own wall, table, cake stand and floating ambience.
import { ctx, firstOnGrid, view } from '../core/canvas';
import { shade } from '../core/color';
import { drawGlow, ellipsePath, roundRectPath, starPath } from '../core/draw';
import type { KitchenThemeId } from '../data/types';
import { CAKE_CENTER_X } from '../kitchen/layout';
import { drawMagicCircle } from './environment';
import { drawSakuraPetal } from './magicEffects';

/** Where the wall ends and the table starts, and where the table's front ends (same as the ordinary kitchen). */
const TABLE_TOP_Y = 520;
const TABLE_BOTTOM_Y = 640;
const WALL_BOTTOM_Y = 540;

interface KitchenTheme {
  /** Colour of the glowing ring that spreads from the cake while the kitchen transforms. */
  revealColor: string;
  /** Sparks that burst from the cake when the transformation starts. */
  sparkColors: string[];
  /** Wall, table and floor (everything behind the shelves and the cake). */
  drawRoom(time: number): void;
  /** The stand under the cake, around (cx, 571) — the same spot as the crystal stand. */
  drawStand(cx: number): void;
  /** Floating bits drawn in front of the cake (embers, feathers, petals). */
  drawAmbience(time: number): void;
}

const fillWall = (top: string, bottom: string, middle?: string): void => {
  const wall = ctx.createLinearGradient(0, 0, 0, WALL_BOTTOM_Y);
  wall.addColorStop(0, top); if (middle) wall.addColorStop(0.55, middle); wall.addColorStop(1, bottom);
  ctx.fillStyle = wall; ctx.fillRect(view.left, view.top, view.right - view.left, WALL_BOTTOM_Y - view.top);
};

const fillTable = (top: string, bottom: string, floor: string): void => {
  const table = ctx.createLinearGradient(0, TABLE_TOP_Y, 0, TABLE_BOTTOM_Y + 10);
  table.addColorStop(0, top); table.addColorStop(1, bottom);
  ctx.fillStyle = table; ctx.fillRect(view.left, TABLE_TOP_Y, view.right - view.left, TABLE_BOTTOM_Y + 10 - TABLE_TOP_Y);
  ctx.fillStyle = floor; ctx.fillRect(view.left, TABLE_BOTTOM_Y, view.right - view.left, view.bottom - TABLE_BOTTOM_Y);
};

/** Stable pseudo-random 0..1 for a grid cell (so stones and clouds don't flicker). */
const hash = (a: number, b: number): number => {
  const n = Math.sin(a * 127.1 + b * 311.7) * 43758.5453;
  return n - Math.floor(n);
};

/** A torch / candle flame with a warm glow around it. */
function drawFlame(x: number, y: number, size: number, time: number, colors: [glow: string, outer: string, inner: string]): void {
  const flicker = 0.85 + 0.15 * Math.sin(time * 13 + x) + 0.05 * Math.sin(time * 29 + x * 2);
  drawGlow(x, y - size, size * 7, colors[0], 0.32 * flicker);
  for (const [scale, color] of [[1, colors[1]], [0.55, colors[2]]] as const) {
    const w = size * 0.55 * scale, h = size * 1.9 * scale * flicker;
    ctx.fillStyle = color;
    ctx.beginPath(); ctx.moveTo(x - w, y);
    ctx.quadraticCurveTo(x - w * 1.1, y - h * 0.5, x + Math.sin(time * 9 + x) * w * 0.3, y - h);
    ctx.quadraticCurveTo(x + w * 1.1, y - h * 0.5, x + w, y);
    ctx.quadraticCurveTo(x, y + w * 0.6, x - w, y); ctx.fill();
  }
}

// ---------------- demon: stone dungeon ----------------

const STONE = { w: 96, h: 48, colors: ['#3d3236', '#463a3a', '#352c31', '#4c403c'] };
const DUNGEON_TORCHES = [470, 1200];
const DUNGEON_CHAINS = [560, 975];
const TORCH_Y = 430;

function drawStoneWall(time: number): void {
  fillWall('#140e12', '#2e2224');
  for (let y = 62, row = 0; y < WALL_BOTTOM_Y; y += STONE.h, row++) {
    for (let x = firstOnGrid(view.left, STONE.w, (row % 2) * STONE.w / 2); x < view.right; x += STONE.w) {
      const r = hash(x, y);
      ctx.fillStyle = shade(STONE.colors[Math.floor(r * STONE.colors.length)], -0.25 + (y / WALL_BOTTOM_Y) * 0.25);
      roundRectPath(x + 3, y + 3, STONE.w - 6, STONE.h - 6, 9); ctx.fill();
      ctx.fillStyle = 'rgba(255,220,200,0.05)'; roundRectPath(x + 6, y + 5, STONE.w - 18, 6, 3); ctx.fill(); // top edge catches the light
      if (r > 0.8) { // a crack
        ctx.strokeStyle = 'rgba(10,4,6,0.6)'; ctx.lineWidth = 1.5;
        ctx.beginPath(); ctx.moveTo(x + 20 + r * 30, y + 8); ctx.lineTo(x + 30 + r * 20, y + 22); ctx.lineTo(x + 24 + r * 30, y + 38); ctx.stroke();
      }
    }
  }
  // fiery light rising from below and a red rune circle behind the cake
  drawGlow(CAKE_CENTER_X, 560, 520, '#ff5a2a', 0.22 + 0.04 * Math.sin(time * 2));
  drawMagicCircle(CAKE_CENTER_X, 340, 230, time, 0.16, '255,90,60');
  for (const x of DUNGEON_CHAINS) drawChain(x, time);
  for (const x of DUNGEON_TORCHES) drawTorch(x, TORCH_Y, time);
  // cobwebs in the top corners of the play area
  for (const [cornerX, side] of [[view.right, -1], [392, 1]] as const) {
    ctx.strokeStyle = 'rgba(220,210,220,0.22)'; ctx.lineWidth = 1.2;
    for (let i = 0; i < 4; i++) {
      const angle = (i / 3) * (Math.PI / 2);
      ctx.beginPath(); ctx.moveTo(cornerX, 62); ctx.lineTo(cornerX + side * Math.cos(angle) * 90, 62 + Math.sin(angle) * 90); ctx.stroke();
    }
    for (const radius of [30, 55, 80]) {
      ctx.beginPath(); ctx.arc(cornerX, 62, radius, side > 0 ? 0 : Math.PI / 2, side > 0 ? Math.PI / 2 : Math.PI); ctx.stroke();
    }
  }
}

function drawChain(x: number, time: number): void {
  const swing = Math.sin(time * 0.9 + x) * 0.05;
  ctx.save(); ctx.translate(x, 62); ctx.rotate(swing);
  ctx.strokeStyle = '#6a6066'; ctx.lineWidth = 4;
  for (let i = 0; i < 9; i++) {
    if (i % 2) ellipsePath(0, 8 + i * 14, 3, 9); else ellipsePath(0, 8 + i * 14, 7, 9);
    ctx.stroke();
  }
  ctx.fillStyle = '#4a4248'; ctx.beginPath(); ctx.arc(0, 138, 9, 0, Math.PI * 2); ctx.fill(); // a shackle ring at the end
  ctx.strokeStyle = '#7a7076'; ctx.lineWidth = 3; ctx.stroke();
  ctx.restore();
}

function drawTorch(x: number, y: number, time: number): void {
  ctx.fillStyle = '#2a2224'; roundRectPath(x - 16, y + 18, 32, 10, 4); ctx.fill(); // wall bracket
  ctx.fillStyle = '#5a3a24';
  ctx.beginPath(); ctx.moveTo(x - 9, y); ctx.lineTo(x + 9, y); ctx.lineTo(x + 5, y + 48); ctx.lineTo(x - 5, y + 48); ctx.closePath(); ctx.fill();
  ctx.fillStyle = '#3a2418'; roundRectPath(x - 12, y - 4, 24, 10, 3); ctx.fill();
  drawFlame(x, y - 2, 16, time, ['#ff8a3a', '#ff6a2a', '#ffd25a']);
}

function drawDungeonTable(time: number): void {
  fillTable('#5a5052', '#2a2224', '#0e0809');
  ctx.fillStyle = 'rgba(255,230,220,0.12)'; ctx.fillRect(view.left, TABLE_TOP_Y, view.right - view.left, 5);
  // glowing lava cracks across the stone slab
  ctx.save();
  ctx.shadowColor = '#ff6a2a'; ctx.shadowBlur = 10;
  ctx.strokeStyle = `rgba(255,${120 + 40 * Math.sin(time * 2)},40,0.75)`; ctx.lineWidth = 2;
  for (let x = firstOnGrid(view.left, 230, 60), i = 0; x < view.right; x += 230, i++) {
    ctx.beginPath(); ctx.moveTo(x, TABLE_TOP_Y + 10);
    ctx.lineTo(x + 22, TABLE_TOP_Y + 42); ctx.lineTo(x + 10, TABLE_TOP_Y + 70); ctx.lineTo(x + 34, TABLE_TOP_Y + 110);
    ctx.moveTo(x + 22, TABLE_TOP_Y + 42); ctx.lineTo(x + 52, TABLE_TOP_Y + 54);
    ctx.stroke();
  }
  ctx.restore();
}

const dungeon: KitchenTheme = {
  revealColor: '#ff5a2a',
  sparkColors: ['#ff5a2a', '#ffb02e', '#3a2a2a'],
  drawRoom(time) { drawStoneWall(time); drawDungeonTable(time); },
  drawStand(cx) { // an obsidian slab with an ember-red rim
    drawGlow(cx, 580, 200, '#ff4a2a', 0.2);
    ellipsePath(cx, 632, 74, 13); ctx.fillStyle = '#1a1214'; ctx.fill();
    ctx.fillStyle = '#2a2024'; ctx.beginPath(); ctx.moveTo(cx - 20, 630); ctx.lineTo(cx - 12, 590); ctx.lineTo(cx + 12, 590); ctx.lineTo(cx + 20, 630); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, 578, 172, 42, 0, 0, Math.PI); ctx.lineTo(cx - 172, 571); ctx.fillStyle = '#1e1618'; ctx.fill();
    ellipsePath(cx, 571, 172, 42); ctx.fillStyle = '#3a3034'; ctx.fill();
    ctx.strokeStyle = 'rgba(255,100,50,0.75)'; ctx.lineWidth = 2.5; ctx.stroke();
    ellipsePath(cx, 571, 152, 34); ctx.strokeStyle = 'rgba(255,140,80,0.3)'; ctx.lineWidth = 2; ctx.stroke();
  },
  drawAmbience(time) { // embers drifting up
    for (let k = 0; k < 22; k++) {
      const phase = (time * (0.12 + hash(k, 1) * 0.1) + hash(k, 2)) % 1;
      const x = view.left + hash(k, 3) * (view.right - view.left) + Math.sin(time * 1.5 + k) * 18, y = 640 - phase * 600;
      ctx.fillStyle = `rgba(255,${140 + Math.floor(hash(k, 4) * 90)},60,${Math.sin(phase * Math.PI) * 0.85})`;
      ellipsePath(x, y, 2.4, 2.4); ctx.fill();
    }
  },
};

// ---------------- angel: bright and in the clouds ----------------

const HEAVEN_COLUMNS = [404, 1252];

/** A puffy cloud: overlapping circles with a soft bluish underside. */
function drawCloud(x: number, y: number, scale: number, alpha = 1): void {
  ctx.save(); ctx.globalAlpha *= alpha; ctx.translate(x, y); ctx.scale(scale, scale);
  const puffs: [number, number, number][] = [[-46, 6, 24], [-18, -12, 32], [18, -6, 30], [46, 8, 22], [0, 10, 30]];
  ctx.fillStyle = '#c9d8f4';
  for (const [px, py, r] of puffs) { ellipsePath(px + 3, py + 6, r, r); ctx.fill(); }
  ctx.fillStyle = '#ffffff';
  for (const [px, py, r] of puffs) { ellipsePath(px, py, r, r); ctx.fill(); }
  ctx.restore();
}

function drawColumn(x: number): void {
  const w = 44, top = 70, bottom = TABLE_TOP_Y;
  const marble = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0);
  marble.addColorStop(0, '#ffffff'); marble.addColorStop(0.6, '#f0ecfa'); marble.addColorStop(1, '#c8c0e0');
  ctx.fillStyle = marble; ctx.fillRect(x - w / 2, top + 20, w, bottom - top - 20);
  ctx.strokeStyle = 'rgba(160,150,200,0.45)'; ctx.lineWidth = 2; // flutes
  for (let i = 1; i < 4; i++) { ctx.beginPath(); ctx.moveTo(x - w / 2 + i * w / 4, top + 26); ctx.lineTo(x - w / 2 + i * w / 4, bottom); ctx.stroke(); }
  ctx.fillStyle = '#f7f4ff'; roundRectPath(x - w / 2 - 10, top + 6, w + 20, 16, 6); ctx.fill(); // capital with scrolls
  ctx.strokeStyle = '#e8b84a'; ctx.lineWidth = 2.5; ctx.stroke();
  for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(x + side * (w / 2 + 4), top + 22, 7, 0, Math.PI * 2); ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke(); }
}

function drawHeavenRoom(time: number): void {
  fillWall('#8db4ec', '#fff2da', '#cfe1fa');
  // sun glow and slowly turning rays from the top
  drawGlow(CAKE_CENTER_X, 40, 520, '#fff6c8', 0.75);
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let i = 0; i < 9; i++) {
    const angle = Math.PI / 2 + (i - 4) * 0.2 + Math.sin(time * 0.15) * 0.05, spread = 0.045;
    ctx.fillStyle = `rgba(255,248,220,${0.07 + 0.04 * Math.sin(time * 0.8 + i)})`;
    ctx.beginPath(); ctx.moveTo(CAKE_CENTER_X, 20);
    ctx.lineTo(CAKE_CENTER_X + Math.cos(angle - spread) * 900, 20 + Math.sin(angle - spread) * 900);
    ctx.lineTo(CAKE_CENTER_X + Math.cos(angle + spread) * 900, 20 + Math.sin(angle + spread) * 900);
    ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  // clouds drifting slowly across the whole view
  const span = view.right - view.left + 400;
  for (let k = 0; k < 9; k++) {
    const x = view.left - 200 + ((time * (8 + hash(k, 5) * 10) + hash(k, 6) * span) % span);
    drawCloud(x, 100 + hash(k, 7) * 360, 0.7 + hash(k, 8) * 0.8, 0.85);
  }
  drawMagicCircle(CAKE_CENTER_X, 340, 230, time, 0.2, '232,184,74');
  for (const x of HEAVEN_COLUMNS) drawColumn(x);
  // white marble table with a golden edge
  fillTable('#ffffff', '#e2dcf2', '#7088c8');
  ctx.fillStyle = '#e8b84a'; ctx.fillRect(view.left, TABLE_TOP_Y, view.right - view.left, 4);
  ctx.strokeStyle = 'rgba(180,170,220,0.35)'; ctx.lineWidth = 1.5; // marble veins
  for (let x = firstOnGrid(view.left, 180, 40); x < view.right; x += 180) {
    ctx.beginPath(); ctx.moveTo(x, TABLE_TOP_Y + 14); ctx.quadraticCurveTo(x + 50, TABLE_TOP_Y + 50, x + 30, TABLE_TOP_Y + 110); ctx.stroke();
  }
  ctx.fillStyle = '#e8b84a'; ctx.fillRect(view.left, TABLE_BOTTOM_Y - 6, view.right - view.left, 3);
  // clouds hugging the floor
  for (let x = firstOnGrid(view.left, 120, 30), i = 0; x < view.right + 60; x += 120, i++) {
    drawCloud(x + Math.sin(time * 0.6 + i) * 6, TABLE_BOTTOM_Y + 34, 0.75, 0.55);
  }
}

const heaven: KitchenTheme = {
  revealColor: '#ffe98a',
  sparkColors: ['#ffffff', '#ffe98a', '#cfe8ff'],
  drawRoom: drawHeavenRoom,
  drawStand(cx) { // white porcelain with gold
    drawGlow(cx, 580, 220, '#fff6c8', 0.4);
    ellipsePath(cx, 632, 74, 13); ctx.fillStyle = '#e8b84a'; ctx.fill();
    ctx.fillStyle = '#ffffff'; ctx.beginPath(); ctx.moveTo(cx - 16, 630); ctx.lineTo(cx - 10, 590); ctx.lineTo(cx + 10, 590); ctx.lineTo(cx + 16, 630); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, 578, 172, 42, 0, 0, Math.PI); ctx.lineTo(cx - 172, 571); ctx.fillStyle = '#d8d0ec'; ctx.fill();
    ellipsePath(cx, 571, 172, 42); ctx.fillStyle = '#ffffff'; ctx.fill();
    ctx.strokeStyle = '#e8b84a'; ctx.lineWidth = 4; ctx.stroke();
    ellipsePath(cx, 571, 152, 34); ctx.strokeStyle = 'rgba(232,184,74,0.5)'; ctx.lineWidth = 2; ctx.stroke();
  },
  drawAmbience(time) { // feathers swinging down and golden sparkles
    for (let k = 0; k < 9; k++) {
      const phase = (time * (0.06 + hash(k, 9) * 0.04) + hash(k, 10)) % 1;
      const x = view.left + hash(k, 11) * (view.right - view.left) + Math.sin(time * 1.2 + k) * 30, y = 40 + phase * 620;
      ctx.save(); ctx.globalAlpha = Math.sin(phase * Math.PI) * 0.9;
      ctx.translate(x, y); ctx.rotate(Math.sin(time * 1.2 + k) * 0.7);
      ctx.fillStyle = '#ffffff'; ellipsePath(0, 0, 5, 13); ctx.fill();
      ctx.strokeStyle = '#e8c860'; ctx.lineWidth = 1.2; ctx.beginPath(); ctx.moveTo(0, 14); ctx.lineTo(0, -12); ctx.stroke();
      ctx.restore();
    }
    for (let k = 0; k < 14; k++) {
      const twinkle = Math.max(0, Math.sin(time * 2 + k * 1.7));
      const x = view.left + hash(k, 12) * (view.right - view.left), y = 80 + hash(k, 13) * 440;
      ctx.fillStyle = `rgba(255,236,150,${twinkle * 0.9})`; starPath(x, y, 6 * twinkle + 1, 1.5, 4, 0); ctx.fill();
    }
  },
};

// ---------------- vampire: Dracula's palace ----------------

const PALACE_WINDOWS: { x: number; y: number; w: number; h: number }[] = [{ x: 404, y: 110, w: 104, h: 300 }, { x: 1150, y: 214, w: 100, h: 210 }];
const PALACE_SCONCES = [610, 1050];
const WAINSCOT_Y = 430;
const BLOOD_MOON = '#ff5a5a';

/** A pointed gothic window with the night sky, a blood-red moon and bats. */
function drawGothicWindow(x: number, y: number, w: number, h: number, time: number, hasMoon: boolean): void {
  const archY = y + w * 0.7;
  const path = (inset: number): void => {
    ctx.beginPath(); ctx.moveTo(x + inset, y + h); ctx.lineTo(x + inset, archY);
    ctx.quadraticCurveTo(x + inset, y + inset, x + w / 2, y + inset - 6);
    ctx.quadraticCurveTo(x + w - inset, y + inset, x + w - inset, archY); ctx.lineTo(x + w - inset, y + h); ctx.closePath();
  };
  path(-10); ctx.fillStyle = '#2a0a10'; ctx.fill(); ctx.strokeStyle = '#c9a050'; ctx.lineWidth = 3; ctx.stroke();
  const sky = ctx.createLinearGradient(0, y, 0, y + h); sky.addColorStop(0, '#0a0614'); sky.addColorStop(1, '#3a0c22');
  path(0); ctx.fillStyle = sky; ctx.fill();
  ctx.save(); path(0); ctx.clip();
  if (hasMoon) {
    drawGlow(x + w * 0.62, y + 90, 80, BLOOD_MOON, 0.55);
    ellipsePath(x + w * 0.62, y + 90, 30, 30); ctx.fillStyle = '#ff7a6a'; ctx.fill();
    ctx.fillStyle = 'rgba(160,30,40,0.35)'; ellipsePath(x + w * 0.55, y + 82, 7, 6); ctx.fill(); ellipsePath(x + w * 0.7, y + 100, 5, 4); ctx.fill();
  }
  for (let i = 0; i < 3; i++) { // bats crossing the window
    const phase = (time * 0.09 + i / 3 + x * 0.001) % 1;
    drawBat(x - 20 + phase * (w + 40), y + 60 + i * 50 + Math.sin(time * 3 + i) * 10, 0.6, time + i);
  }
  ctx.restore();
  ctx.strokeStyle = '#2a0a10'; ctx.lineWidth = 5; // lead lines
  ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2, y + h); ctx.moveTo(x, archY + 40); ctx.lineTo(x + w, archY + 40); ctx.stroke();
}

/** A bat silhouette with flapping wings, about 40 px wide at scale 1. */
function drawBat(x: number, y: number, scale: number, time: number): void {
  const flap = Math.sin(time * 14) * 0.6;
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.fillStyle = '#120408';
  for (const side of [-1, 1]) {
    ctx.save(); ctx.scale(side, 1); ctx.rotate(flap * 0.5);
    ctx.beginPath(); ctx.moveTo(2, 0); ctx.quadraticCurveTo(12, -12, 22, -8); ctx.quadraticCurveTo(18, -2, 20, 4);
    ctx.quadraticCurveTo(14, 0, 12, 4); ctx.quadraticCurveTo(8, 0, 2, 4); ctx.closePath(); ctx.fill();
    ctx.restore();
  }
  ellipsePath(0, 0, 4, 6); ctx.fill();
  ctx.restore();
}

function drawSconce(x: number, y: number, time: number): void {
  ctx.strokeStyle = '#c9a050'; ctx.lineWidth = 4;
  ctx.beginPath(); ctx.moveTo(x, y + 40); ctx.quadraticCurveTo(x, y + 20, x - 26, y + 14); ctx.moveTo(x, y + 40); ctx.quadraticCurveTo(x, y + 20, x + 26, y + 14); ctx.stroke();
  ctx.fillStyle = '#c9a050'; ellipsePath(x, y + 42, 9, 6); ctx.fill();
  for (const dx of [-26, 0, 26]) {
    const top = dx ? y : y - 12;
    ctx.fillStyle = '#c9a050'; ellipsePath(x + dx, top + 14, 9, 3); ctx.fill();
    ctx.fillStyle = '#f2e8e0'; roundRectPath(x + dx - 4, top - 10, 8, 24, 2); ctx.fill();
    ctx.fillStyle = 'rgba(160,20,40,0.8)'; ctx.fillRect(x + dx - 4, top - 10, 3, 9); // a red wax drip
    drawFlame(x + dx, top - 10, 7, time, ['#ffb060', '#ff9a3a', '#fff0b0']);
  }
}

function drawPalaceRoom(time: number): void {
  fillWall('#2a0610', '#5a0f1e');
  // damask wallpaper: faint golden diamonds and fleurs
  for (let y = 80, row = 0; y < WAINSCOT_Y; y += 60, row++) {
    for (let x = firstOnGrid(view.left, 70, (row % 2) * 35); x < view.right; x += 70) {
      ctx.fillStyle = 'rgba(255,190,120,0.07)';
      ctx.beginPath(); ctx.moveTo(x, y - 16); ctx.quadraticCurveTo(x + 12, y, x, y + 16); ctx.quadraticCurveTo(x - 12, y, x, y - 16); ctx.fill();
      ellipsePath(x, y - 22, 4, 4); ctx.fill();
    }
  }
  drawGlow(CAKE_CENTER_X, 330, 420, '#ff2a4a', 0.12);
  drawMagicCircle(CAKE_CENTER_X, 340, 230, time, 0.15, '255,80,110');
  PALACE_WINDOWS.forEach((win, i) => drawGothicWindow(win.x, win.y, win.w, win.h, time, i === 0));
  // dark wood wainscoting with a golden rail
  const panel = ctx.createLinearGradient(0, WAINSCOT_Y, 0, TABLE_TOP_Y);
  panel.addColorStop(0, '#3a1012'); panel.addColorStop(1, '#22080a');
  ctx.fillStyle = panel; ctx.fillRect(view.left, WAINSCOT_Y, view.right - view.left, TABLE_TOP_Y - WAINSCOT_Y);
  for (let x = firstOnGrid(view.left, 120, 10); x < view.right; x += 120) {
    ctx.strokeStyle = 'rgba(201,160,80,0.4)'; ctx.lineWidth = 2; roundRectPath(x + 8, WAINSCOT_Y + 14, 104, TABLE_TOP_Y - WAINSCOT_Y - 24, 6); ctx.stroke();
  }
  ctx.fillStyle = '#c9a050'; ctx.fillRect(view.left, WAINSCOT_Y - 4, view.right - view.left, 7);
  for (const x of PALACE_SCONCES) drawSconce(x, 380, time);
  // velvet swags along the top with golden fringe
  for (let x = firstOnGrid(view.left, 200, 0); x < view.right; x += 200) {
    ctx.fillStyle = '#7a0f20';
    ctx.beginPath(); ctx.moveTo(x, 58); ctx.quadraticCurveTo(x + 100, 140, x + 200, 58); ctx.lineTo(x + 200, 50); ctx.lineTo(x, 50); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = '#c9a050'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(x, 58); ctx.quadraticCurveTo(x + 100, 140, x + 200, 58); ctx.stroke();
    ctx.fillStyle = '#c9a050'; ellipsePath(x, 60, 9, 9); ctx.fill(); // tassel knot
    roundRectPath(x - 4, 64, 8, 22, 3); ctx.fill();
  }
  // mahogany table with a red velvet runner
  fillTable('#4a1a14', '#22090a', '#120406');
  ctx.fillStyle = '#c9a050'; ctx.fillRect(view.left, TABLE_TOP_Y, view.right - view.left, 3);
  ctx.fillStyle = '#7a0f20'; ctx.fillRect(view.left, TABLE_TOP_Y + 40, view.right - view.left, 56);
  ctx.fillStyle = '#c9a050'; ctx.fillRect(view.left, TABLE_TOP_Y + 40, view.right - view.left, 3); ctx.fillRect(view.left, TABLE_TOP_Y + 93, view.right - view.left, 3);
}

const palace: KitchenTheme = {
  revealColor: '#ff3a5c',
  sparkColors: ['#ff3a5c', '#7a0f24', '#c9a050'],
  drawRoom: drawPalaceRoom,
  drawStand(cx) { // black lacquer with gold and garnets
    drawGlow(cx, 580, 200, '#ff2a4a', 0.16);
    ellipsePath(cx, 632, 74, 13); ctx.fillStyle = '#c9a050'; ctx.fill();
    ctx.fillStyle = '#1a0a10'; ctx.beginPath(); ctx.moveTo(cx - 16, 630); ctx.lineTo(cx - 10, 590); ctx.lineTo(cx + 10, 590); ctx.lineTo(cx + 16, 630); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, 578, 172, 42, 0, 0, Math.PI); ctx.lineTo(cx - 172, 571); ctx.fillStyle = '#120408'; ctx.fill();
    for (let i = 0; i < 7; i++) { ellipsePath(cx - 135 + i * 45, 600 + Math.sin((i / 6) * Math.PI) * 12, 5, 5); ctx.fillStyle = '#d4183a'; ctx.fill(); }
    ellipsePath(cx, 571, 172, 42); ctx.fillStyle = '#2a1018'; ctx.fill();
    ctx.strokeStyle = '#c9a050'; ctx.lineWidth = 3.5; ctx.stroke();
    ellipsePath(cx, 571, 152, 34); ctx.strokeStyle = 'rgba(201,160,80,0.45)'; ctx.lineWidth = 2; ctx.stroke();
  },
  drawAmbience(time) { // rose petals floating down and a bat now and then
    for (let k = 0; k < 10; k++) {
      const phase = (time * (0.05 + hash(k, 14) * 0.04) + hash(k, 15)) % 1;
      const x = view.left + hash(k, 16) * (view.right - view.left) + Math.sin(time + k) * 26, y = 60 + phase * 600;
      ctx.save(); ctx.globalAlpha = Math.sin(phase * Math.PI) * 0.9;
      ctx.translate(x, y); ctx.rotate(time * (0.8 + hash(k, 17)) + k);
      ctx.fillStyle = k % 3 ? '#b0102e' : '#e0284a'; ellipsePath(0, 0, 7, 4.5); ctx.fill();
      ctx.restore();
    }
    const batPhase = (time * 0.07) % 1;
    if (batPhase < 0.5) drawBat(view.right + 40 - batPhase * 2 * (view.right - view.left + 80), 150 + Math.sin(time * 2.5) * 30, 1.1, time);
  },
};

// ---------------- samurai: a shrine at night ----------------

const TORII = { halfSpan: 236, pillarWidth: 30, topY: 78, beamY: 236, color: '#d83a2a', dark: '#2a1414' };
const SHRINE_LANTERN_SPACING = 170;
const STONE_LANTERNS = [452, 1222];
const SAKURA_PINK = '#ff9cc4';

/** A red paper lantern (chōchin) hanging from the rope, glowing and swaying. */
function drawPaperLantern(x: number, y: number, time: number): void {
  const swing = Math.sin(time * 1.3 + x * 0.01) * 0.08;
  ctx.save(); ctx.translate(x, y); ctx.rotate(swing);
  drawGlow(0, 26, 70, '#ff9a4a', 0.35);
  ctx.strokeStyle = '#2a1414'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(0, -12); ctx.lineTo(0, 0); ctx.stroke();
  ctx.fillStyle = '#2a1414'; roundRectPath(-12, 0, 24, 6, 2); ctx.fill(); roundRectPath(-12, 46, 24, 6, 2); ctx.fill();
  ellipsePath(0, 26, 20, 23);
  const paper = ctx.createRadialGradient(-5, 20, 2, 0, 26, 24); paper.addColorStop(0, '#ffd27a'); paper.addColorStop(0.5, '#ff5a3a'); paper.addColorStop(1, '#b8201a');
  ctx.fillStyle = paper; ctx.fill();
  ctx.strokeStyle = 'rgba(80,10,10,0.45)'; ctx.lineWidth = 1.5; // ribs
  for (let i = -2; i <= 2; i++) { ctx.beginPath(); ctx.ellipse(0, 26 + i * 8, 20 - Math.abs(i) * 3, 2, 0, 0, Math.PI * 2); ctx.stroke(); }
  ctx.fillStyle = '#2a1414'; ctx.fillRect(-1.5, 52, 3, 10); // tassel
  ctx.restore();
}

/** A stone lantern (tōrō) standing by the table, with a warm light inside. */
function drawStoneLantern(x: number, time: number): void {
  const base = TABLE_TOP_Y;
  ctx.fillStyle = '#6a6470';
  roundRectPath(x - 24, base - 14, 48, 14, 3); ctx.fill();
  ctx.fillRect(x - 8, base - 60, 16, 46);
  roundRectPath(x - 22, base - 96, 44, 36, 4); ctx.fill();
  ctx.beginPath(); ctx.moveTo(x - 36, base - 96); ctx.quadraticCurveTo(x, base - 124, x + 36, base - 96); ctx.closePath(); ctx.fill();
  const flicker = 0.85 + 0.15 * Math.sin(time * 9 + x);
  drawGlow(x, base - 78, 60, '#ffb060', 0.35 * flicker);
  ctx.fillStyle = `rgba(255,200,110,${0.85 * flicker})`; roundRectPath(x - 12, base - 90, 24, 22, 3); ctx.fill();
}

function drawShrineRoom(time: number): void {
  fillWall('#140c28', '#4a1a2a', '#2a1238');
  for (let i = 0; i < 24; i++) { // stars over the shrine
    const sx = view.left + hash(i, 20) * (view.right - view.left), sy = 70 + hash(i, 21) * 260;
    ctx.fillStyle = `rgba(255,240,220,${0.3 + 0.5 * Math.abs(Math.sin(time * 1.2 + i))})`; starPath(sx, sy, 2.6, 1, 4, 0); ctx.fill();
  }
  drawGlow(CAKE_CENTER_X, 520, 520, '#ff6a3a', 0.16);
  // a big torii gate behind the cake
  const { halfSpan, pillarWidth, topY, beamY, color, dark } = TORII, cx = CAKE_CENTER_X;
  ctx.fillStyle = color;
  for (const side of [-1, 1]) ctx.fillRect(cx + side * halfSpan - pillarWidth / 2, topY + 20, pillarWidth, TABLE_TOP_Y - topY - 20);
  ctx.fillRect(cx - halfSpan - 30, beamY, halfSpan * 2 + 60, 18); // nuki
  ctx.fillRect(cx - 12, topY + 26, 24, beamY - topY - 26); // gakuzuka
  ctx.beginPath(); // kasagi: the curved top beam
  ctx.moveTo(cx - halfSpan - 70, topY - 6); ctx.quadraticCurveTo(cx, topY + 22, cx + halfSpan + 70, topY - 6);
  ctx.lineTo(cx + halfSpan + 60, topY + 22); ctx.quadraticCurveTo(cx, topY + 44, cx - halfSpan - 60, topY + 22); ctx.closePath();
  ctx.fillStyle = dark; ctx.fill();
  ctx.fillStyle = color; ctx.fillRect(cx - halfSpan - 40, topY + 30, halfSpan * 2 + 80, 12);
  drawMagicCircle(cx, 340, 200, time, 0.14, '255,140,80');
  // lanterns on a rope along the top
  ctx.strokeStyle = '#2a1414'; ctx.lineWidth = 2;
  ctx.beginPath(); ctx.moveTo(view.left, 70);
  for (let x = view.left; x <= view.right + 20; x += 20) ctx.lineTo(x, 70 + Math.sin(((x - view.left) / SHRINE_LANTERN_SPACING) * Math.PI) ** 2 * 10);
  ctx.stroke();
  for (let x = firstOnGrid(view.left, SHRINE_LANTERN_SPACING, 40); x < view.right; x += SHRINE_LANTERN_SPACING) drawPaperLantern(x, 74, time);
  for (const x of STONE_LANTERNS) drawStoneLantern(x, time);
  // dark lacquered wooden floor-table with a red edge
  fillTable('#4a2418', '#1a0a08', '#120606');
  ctx.fillStyle = color; ctx.fillRect(view.left, TABLE_TOP_Y, view.right - view.left, 4);
  ctx.strokeStyle = 'rgba(0,0,0,0.3)'; ctx.lineWidth = 2; // planks
  for (let y = TABLE_TOP_Y + 30; y < TABLE_BOTTOM_Y; y += 30) { ctx.beginPath(); ctx.moveTo(view.left, y); ctx.lineTo(view.right, y); ctx.stroke(); }
}

const shrine: KitchenTheme = {
  revealColor: SAKURA_PINK,
  sparkColors: [SAKURA_PINK, '#ffffff', '#e8323a'],
  drawRoom: drawShrineRoom,
  drawStand(cx) { // a plain wooden offering stand on a red base
    drawGlow(cx, 580, 200, '#ff9a4a', 0.18);
    ellipsePath(cx, 632, 74, 13); ctx.fillStyle = '#b8201a'; ctx.fill();
    ctx.fillStyle = '#a07040'; ctx.fillRect(cx - 40, 590, 80, 40);
    ctx.fillStyle = '#2a1414'; ellipsePath(cx, 610, 12, 12); ctx.fill(); // the stand's round cut-out
    ctx.beginPath(); ctx.ellipse(cx, 578, 172, 42, 0, 0, Math.PI); ctx.lineTo(cx - 172, 571); ctx.fillStyle = '#8a5a30'; ctx.fill();
    ellipsePath(cx, 571, 172, 42); ctx.fillStyle = '#d8b07a'; ctx.fill();
    ctx.strokeStyle = '#b8201a'; ctx.lineWidth = 3.5; ctx.stroke();
    ellipsePath(cx, 571, 150, 34); ctx.strokeStyle = 'rgba(120,70,30,0.4)'; ctx.lineWidth = 2; ctx.stroke();
  },
  drawAmbience(time) { // sakura petals drifting down across the whole kitchen
    for (let k = 0; k < 18; k++) {
      const phase = (time * (0.05 + hash(k, 22) * 0.04) + hash(k, 23)) % 1;
      const x = view.left + hash(k, 24) * (view.right - view.left) + Math.sin(time * 0.9 + k) * 40, y = 60 + phase * 620;
      drawSakuraPetal(x, y, 10 + hash(k, 25) * 6, time * (0.8 + hash(k, 26)) + k, Math.sin(phase * Math.PI) * 0.95);
    }
  },
};

// ---------------- cultist: a secret ritual hall ----------------

const CULT_BANNERS = [470, 1190];
const CULT_PURPLE = '#b36bff';
/** Clusters of candles at the back of the altar: [x, number of candles]. */
const CULT_CANDLES: [number, number][] = [[470, 4], [1190, 4]];

function drawCultBanner(x: number, time: number): void {
  const w = 86, top = 66, h = 230, sway = Math.sin(time * 0.8 + x) * 2;
  ctx.save(); ctx.translate(sway, 0);
  ctx.fillStyle = '#c9a050'; ctx.fillRect(x - w / 2 - 8, top - 6, w + 16, 6); // rod
  ctx.beginPath(); ctx.moveTo(x - w / 2, top); ctx.lineTo(x + w / 2, top); ctx.lineTo(x + w / 2, top + h); ctx.lineTo(x, top + h - 30); ctx.lineTo(x - w / 2, top + h); ctx.closePath();
  const cloth = ctx.createLinearGradient(x - w / 2, 0, x + w / 2, 0); cloth.addColorStop(0, '#4a2470'); cloth.addColorStop(0.5, '#3a1a5a'); cloth.addColorStop(1, '#24103a');
  ctx.fillStyle = cloth; ctx.fill(); ctx.strokeStyle = '#c9a050'; ctx.lineWidth = 3; ctx.stroke();
  const eyeY = top + 90; // the eye emblem
  ctx.beginPath(); ctx.moveTo(x - 28, eyeY); ctx.quadraticCurveTo(x, eyeY - 24, x + 28, eyeY); ctx.quadraticCurveTo(x, eyeY + 24, x - 28, eyeY); ctx.closePath();
  ctx.fillStyle = '#12081c'; ctx.fill(); ctx.strokeStyle = '#e8b84a'; ctx.lineWidth = 2.5; ctx.stroke();
  drawGlow(x, eyeY, 26, CULT_PURPLE, 0.55 + 0.2 * Math.sin(time * 2));
  ellipsePath(x, eyeY, 8, 8); ctx.fillStyle = CULT_PURPLE; ctx.fill();
  ctx.strokeStyle = 'rgba(232,184,74,0.7)'; ctx.lineWidth = 2; // rays around the eye
  for (let i = 0; i < 7; i++) { const a = Math.PI + (i / 6) * Math.PI; ctx.beginPath(); ctx.moveTo(x + Math.cos(a) * 34, eyeY + Math.sin(a) * 28); ctx.lineTo(x + Math.cos(a) * 44, eyeY + Math.sin(a) * 36); ctx.stroke(); }
  ctx.restore();
}

/** A tall ritual candle with a violet flame. */
function drawRitualCandle(x: number, height: number, time: number): void {
  const top = TABLE_TOP_Y + 6 - height;
  ctx.fillStyle = '#2a2234'; roundRectPath(x - 7, top, 14, height, 3); ctx.fill();
  ctx.fillStyle = '#3e3450'; roundRectPath(x - 3, top, 5, height * 0.4, 2); ctx.fill(); // drip
  drawFlame(x, top, 7, time, [CULT_PURPLE, '#9a5aff', '#f2e8ff']);
}

function drawCultRoom(time: number): void {
  fillWall('#0a0610', '#241434');
  for (let x = firstOnGrid(view.left, 60, 0), i = 0; x < view.right; x += 60, i++) { // heavy drapes
    const folds = ctx.createLinearGradient(x, 0, x + 60, 0);
    folds.addColorStop(0, 'rgba(60,30,90,0.25)'); folds.addColorStop(0.5, 'rgba(0,0,0,0.25)'); folds.addColorStop(1, 'rgba(60,30,90,0.25)');
    ctx.fillStyle = folds; ctx.fillRect(x, 60, 60, TABLE_TOP_Y - 60);
  }
  // the ritual circle glowing on the wall, with a second ring of runes turning the other way
  drawGlow(CAKE_CENTER_X, 330, 330, CULT_PURPLE, 0.22 + 0.06 * Math.sin(time * 1.5));
  drawMagicCircle(CAKE_CENTER_X, 330, 240, time, 0.4, '179,107,255');
  ctx.save(); ctx.translate(CAKE_CENTER_X, 330); ctx.rotate(-time * 0.15);
  ctx.fillStyle = 'rgba(200,150,255,0.45)';
  for (let i = 0; i < 16; i++) { ctx.save(); ctx.rotate((i / 16) * Math.PI * 2); ctx.translate(0, -262); starPath(0, 0, 6, 2.4, 3 + (i % 3), 0); ctx.fill(); ctx.restore(); }
  ctx.restore();
  for (const x of CULT_BANNERS) drawCultBanner(x, time);
  // the altar: black cloth with a purple border and golden runes
  fillTable('#1e1428', '#0c0812', '#06040a');
  ctx.fillStyle = '#5a2a8a'; ctx.fillRect(view.left, TABLE_TOP_Y, view.right - view.left, 6);
  ctx.fillStyle = '#5a2a8a'; ctx.fillRect(view.left, TABLE_BOTTOM_Y - 14, view.right - view.left, 6);
  ctx.fillStyle = 'rgba(232,184,74,0.6)';
  for (let x = firstOnGrid(view.left, 70, 20), i = 0; x < view.right; x += 70, i++) { starPath(x, TABLE_BOTTOM_Y - 34, 7, 2.6, 3 + (i % 4), 0); ctx.fill(); }
  for (const [x, count] of CULT_CANDLES) for (let i = 0; i < count; i++) drawRitualCandle(x - 42 + i * 28, 46 + ((i * 23) % 34), time + i);
}

const cult: KitchenTheme = {
  revealColor: CULT_PURPLE,
  sparkColors: [CULT_PURPLE, '#2e1a44', '#e8b84a'],
  drawRoom: drawCultRoom,
  drawStand(cx) { // black stone with glowing violet runes
    drawGlow(cx, 580, 210, CULT_PURPLE, 0.25);
    ellipsePath(cx, 632, 74, 13); ctx.fillStyle = '#120c18'; ctx.fill();
    ctx.fillStyle = '#1e1628'; ctx.beginPath(); ctx.moveTo(cx - 20, 630); ctx.lineTo(cx - 12, 590); ctx.lineTo(cx + 12, 590); ctx.lineTo(cx + 20, 630); ctx.closePath(); ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, 578, 172, 42, 0, 0, Math.PI); ctx.lineTo(cx - 172, 571); ctx.fillStyle = '#140e1c'; ctx.fill();
    ellipsePath(cx, 571, 172, 42); ctx.fillStyle = '#2a2236'; ctx.fill();
    ctx.strokeStyle = 'rgba(179,107,255,0.8)'; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.fillStyle = 'rgba(200,150,255,0.6)';
    for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; starPath(cx + Math.cos(a) * 150, 571 + Math.sin(a) * 34, 4, 1.6, 3, 0); ctx.fill(); }
  },
  drawAmbience(time) { // incense smoke curling up and a few violet embers
    for (let k = 0; k < 8; k++) {
      const phase = (time * 0.08 + k / 8) % 1, baseX = CULT_CANDLES[k % 2][0];
      const x = baseX + Math.sin(phase * 6 + k) * 30, y = TABLE_TOP_Y - 40 - phase * 360;
      ctx.fillStyle = `rgba(190,160,230,${(1 - phase) * 0.18})`;
      ellipsePath(x, y, 14 + phase * 30, 10 + phase * 18); ctx.fill();
    }
    for (let k = 0; k < 14; k++) {
      const phase = (time * (0.1 + hash(k, 28) * 0.08) + hash(k, 29)) % 1;
      const x = view.left + hash(k, 30) * (view.right - view.left), y = 620 - phase * 560;
      ctx.fillStyle = `rgba(200,150,255,${Math.sin(phase * Math.PI) * 0.8})`; ellipsePath(x, y, 2.2, 2.2); ctx.fill();
    }
  },
};

// ---------------- fairy: a flower meadow ----------------

const MEADOW_FLOWER_COLORS = ['#ff9ccb', '#ffffff', '#fff06a', '#c9a0ff', '#ff7aa8'];
/** Tall flowers at the sides: [x, height, colour index]. */
const TALL_FLOWERS: [number, number, number][] = [[410, 230, 0], [455, 170, 2], [500, 260, 1], [1160, 210, 3], [1205, 270, 0], [1250, 180, 4]];

function drawBlossom(x: number, y: number, radius: number, color: string, spin: number): void {
  ctx.fillStyle = color;
  for (let p = 0; p < 5; p++) { const a = spin + (p * Math.PI * 2) / 5; ellipsePath(x + Math.cos(a) * radius, y + Math.sin(a) * radius, radius * 0.85, radius * 0.85); ctx.fill(); }
  ellipsePath(x, y, radius * 0.6, radius * 0.6); ctx.fillStyle = '#ffd23f'; ctx.fill();
}

function drawMeadowRoom(time: number): void {
  fillWall('#4f9f7f', '#c8ecc0', '#8fd0a8');
  for (let i = 0; i < 6; i++) drawGlow(view.left + hash(i, 31) * (view.right - view.left), 120 + hash(i, 32) * 260, 140, '#fff6c8', 0.22 + 0.08 * Math.sin(time + i)); // sun dapples
  drawMagicCircle(CAKE_CENTER_X, 340, 220, time, 0.18, '120,220,140');
  // vines hanging from the top, swaying, with leaves
  for (let x = firstOnGrid(view.left, 90, 30), i = 0; x < view.right; x += 90, i++) {
    const length = 70 + hash(i, 33) * 110, sway = Math.sin(time * 0.9 + i) * 8;
    ctx.strokeStyle = '#3f8a4a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(x, 58); ctx.quadraticCurveTo(x + sway, 58 + length / 2, x + sway * 1.5, 58 + length); ctx.stroke();
    for (let leaf = 1; leaf <= 4; leaf++) {
      const along = leaf / 5, lx = x + sway * along * 1.5, ly = 58 + length * along;
      ctx.save(); ctx.translate(lx, ly); ctx.rotate(leaf % 2 ? 0.8 : -0.8);
      ctx.fillStyle = leaf % 2 ? '#6fcf7a' : '#4fb060'; ellipsePath(leaf % 2 ? 8 : -8, 0, 9, 4.5); ctx.fill();
      ctx.restore();
    }
    if (i % 3 === 0) drawBlossom(x + sway * 1.5, 62 + length, 5, MEADOW_FLOWER_COLORS[i % 5], time * 0.3);
  }
  // tall flowers rising by the sides
  for (const [x, height, colorIndex] of TALL_FLOWERS) {
    const sway = Math.sin(time * 1.1 + x) * 6, topY = TABLE_TOP_Y - height;
    ctx.strokeStyle = '#3f9a4a'; ctx.lineWidth = 4;
    ctx.beginPath(); ctx.moveTo(x, TABLE_TOP_Y); ctx.quadraticCurveTo(x - 10, TABLE_TOP_Y - height / 2, x + sway, topY); ctx.stroke();
    ctx.save(); ctx.translate(x - 6, TABLE_TOP_Y - height * 0.45); ctx.rotate(-0.7); ctx.fillStyle = '#5fc07e'; ellipsePath(14, 0, 16, 6); ctx.fill(); ctx.restore();
    drawBlossom(x + sway, topY, 13, MEADOW_FLOWER_COLORS[colorIndex], time * 0.2 + x);
  }
  // mossy wooden table with grass along the front and little flowers
  fillTable('#8a6a44', '#5a4228', '#3f7a3a');
  ctx.fillStyle = '#6fbf5a'; ctx.fillRect(view.left, TABLE_TOP_Y, view.right - view.left, 12);
  ctx.strokeStyle = '#5aa64a'; ctx.lineWidth = 2.5;
  for (let x = firstOnGrid(view.left, 12, 0), i = 0; x < view.right; x += 12, i++) { // grass at the front edge
    const h = 10 + hash(i, 34) * 14, bend = Math.sin(time * 1.5 + i * 0.7) * 3;
    ctx.beginPath(); ctx.moveTo(x, TABLE_BOTTOM_Y); ctx.quadraticCurveTo(x + bend, TABLE_BOTTOM_Y - h / 2, x + bend * 2, TABLE_BOTTOM_Y - h); ctx.stroke();
  }
  for (let x = firstOnGrid(view.left, 140, 50), i = 0; x < view.right; x += 140, i++) drawBlossom(x, TABLE_BOTTOM_Y - 14, 4, MEADOW_FLOWER_COLORS[i % 5], 0);
}

/** A butterfly with flapping wings (scale 1 ≈ 30 px wide). */
function drawButterfly(x: number, y: number, scale: number, time: number, color: string): void {
  const flap = Math.abs(Math.sin(time * 10)) * 0.8 + 0.2;
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale);
  for (const side of [-1, 1]) {
    ctx.save(); ctx.scale(side * flap, 1);
    ctx.fillStyle = color; ctx.beginPath(); ctx.ellipse(8, -5, 9, 7, -0.4, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = shade(color, -0.15); ctx.beginPath(); ctx.ellipse(6, 5, 6, 5, 0.4, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  ctx.fillStyle = '#3a2a40'; roundRectPath(-1.5, -8, 3, 16, 1.5); ctx.fill();
  ctx.restore();
}

const meadow: KitchenTheme = {
  revealColor: '#ff9ccb',
  sparkColors: ['#ff9ccb', '#7fd89a', '#fff6a0'],
  drawRoom: drawMeadowRoom,
  drawStand(cx) { // a slice of a tree stump with growth rings and moss
    drawGlow(cx, 580, 200, '#fff6c8', 0.25);
    ellipsePath(cx, 632, 80, 14); ctx.fillStyle = '#3f7a3a'; ctx.fill();
    ctx.beginPath(); ctx.ellipse(cx, 578, 172, 42, 0, 0, Math.PI); ctx.lineTo(cx - 172, 571); ctx.fillStyle = '#7a5a3a'; ctx.fill();
    ctx.strokeStyle = 'rgba(60,40,20,0.5)'; ctx.lineWidth = 2; // bark
    for (let i = -6; i <= 6; i++) { ctx.beginPath(); ctx.moveTo(cx + i * 26, 588 + Math.abs(i) * -2); ctx.lineTo(cx + i * 26 + 4, 612 - Math.abs(i) * 4); ctx.stroke(); }
    ellipsePath(cx, 571, 172, 42); ctx.fillStyle = '#e0c094'; ctx.fill();
    ctx.strokeStyle = 'rgba(150,100,50,0.45)'; ctx.lineWidth = 2;
    for (const k of [0.82, 0.62, 0.42, 0.22]) { ellipsePath(cx, 571, 172 * k, 42 * k); ctx.stroke(); }
    ctx.fillStyle = '#6fbf5a'; // moss on the rim
    for (let i = 0; i < 6; i++) { const a = Math.PI * (0.15 + i * 0.14); ellipsePath(cx + Math.cos(a) * 168, 571 + Math.sin(a) * 40, 14, 6); ctx.fill(); }
  },
  drawAmbience(time) { // butterflies fluttering across and fireflies twinkling
    for (let k = 0; k < 5; k++) {
      const phase = (time * (0.04 + hash(k, 35) * 0.03) + hash(k, 36)) % 1;
      const x = view.left - 40 + phase * (view.right - view.left + 80), y = 140 + hash(k, 37) * 300 + Math.sin(time * 2 + k * 3) * 30;
      drawButterfly(x, y, 0.9, time + k, MEADOW_FLOWER_COLORS[k % 5]);
    }
    for (let k = 0; k < 16; k++) {
      const twinkle = Math.max(0, Math.sin(time * 2.4 + k * 1.9));
      const x = view.left + hash(k, 38) * (view.right - view.left) + Math.sin(time * 0.7 + k) * 20, y = 120 + hash(k, 39) * 420;
      drawGlow(x, y, 14, '#fff6a0', 0.6 * twinkle);
      ctx.fillStyle = `rgba(255,255,210,${twinkle})`; ellipsePath(x, y, 2, 2); ctx.fill();
    }
  },
};

const THEMES: Record<KitchenThemeId, KitchenTheme> = { dungeon, heaven, palace, shrine, cult, meadow };
export const kitchenTheme = (id: KitchenThemeId): KitchenTheme => THEMES[id];
