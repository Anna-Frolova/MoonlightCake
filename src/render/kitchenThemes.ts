// The kitchen dressed up for a special guest: a stone dungeon (demon), a bright place in the clouds (angel)
// and Dracula's palace (vampire). Each theme draws its own wall, table, cake stand and floating ambience.
import { ctx, firstOnGrid, view } from '../core/canvas';
import { shade } from '../core/color';
import { drawGlow, ellipsePath, roundRectPath, starPath } from '../core/draw';
import type { KitchenThemeId } from '../data/types';
import { CAKE_CENTER_X } from '../kitchen/layout';
import { drawMagicCircle } from './environment';

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

const THEMES: Record<KitchenThemeId, KitchenTheme> = { dungeon, heaven, palace };
export const kitchenTheme = (id: KitchenThemeId): KitchenTheme => THEMES[id];
