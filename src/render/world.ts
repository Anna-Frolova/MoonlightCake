// The world outside the café, seen through the window and on the map: a faded desert that comes back to life
// (`land`: 0 = all faded, 1 = healed), under the cracked Moon.
import { ctx } from '../core/canvas';
import { hexToRgb, mixRgb, rgbToHex } from '../core/color';
import { drawGlow, ellipsePath, roundRectPath } from '../core/draw';
import { clamp, easeOutCubic } from '../core/math';

/** The dunes from far to near: faded lilac-grey, healed green. */
const DUNES = [
  { faded: '#8d7a84', healed: '#5fae86', top: 0.12, wave: 0.05, waves: 2.2 },
  { faded: '#6e5c6c', healed: '#469672', top: 0.38, wave: 0.06, waves: 3.1 },
  { faded: '#54465a', healed: '#2f7a60', top: 0.68, wave: 0.05, waves: 2.6 },
];
/** The three places that come back one after another: where they are (shares of the land) and when (`land` from → to). */
export const LAND_SPOTS = {
  lake: { x: 0.2, y: 0.42, from: 0, to: 0.35 },
  grove: { x: 0.52, y: 0.5, from: 0.3, to: 0.65 },
  village: { x: 0.8, y: 0.34, from: 0.6, to: 1 },
};
const LAKE = { rx: 110, ry: 30, color: '#5fb8ff', shine: 'rgba(255,255,255,0.55)' };
/** Trees of the grove as [x, y from the spot, size]. */
const TREES: [number, number, number][] = [[-70, -6, 0.9], [-30, 12, 1.1], [14, -14, 0.8], [52, 8, 1.2], [92, -4, 0.85]];
const TREE = { trunk: '#5a3f46', crown: '#2fae74', light: '#6fdc9a', height: 34, radius: 24 };
/** Houses of the village as [x, y from the spot, size]. */
const HOUSES: [number, number, number][] = [[-56, 6, 1], [4, -8, 0.85], [58, 10, 1.05]];
const HOUSE = { wall: '#d8c6e8', roof: '#c8567a', lit: '#ffe27a', w: 36, h: 26, roofH: 20 };

const mixHex = (a: string, b: string, k: number): string => rgbToHex(mixRgb(hexToRgb(a), hexToRgb(b), k));
const growth = (land: number, spot: { from: number; to: number }): number => clamp((land - spot.from) / (spot.to - spot.from), 0, 1);

/** The land in the box: `detail` scales the lake, trees and houses (bigger in the small window). */
export function drawLand(x: number, y: number, w: number, h: number, land: number, time: number, detail = 1): void {
  const green = clamp(land * 1.15, 0, 1);
  for (const dune of DUNES) {
    const top = y + h * dune.top;
    ctx.beginPath(); ctx.moveTo(x, y + h);
    for (let i = 0; i <= 32; i++) {
      const px = x + (w * i) / 32;
      ctx.lineTo(px, top + Math.sin((i / 32) * Math.PI * dune.waves + dune.top * 9) * h * dune.wave);
    }
    ctx.lineTo(x + w, y + h); ctx.closePath();
    ctx.fillStyle = mixHex(dune.faded, dune.healed, green); ctx.fill();
  }
  const at = (spot: { x: number; y: number }) => ({ px: x + w * spot.x, py: y + h * spot.y });
  drawLake(at(LAND_SPOTS.lake), growth(land, LAND_SPOTS.lake), detail, time);
  drawGrove(at(LAND_SPOTS.grove), growth(land, LAND_SPOTS.grove), detail);
  drawVillage(at(LAND_SPOTS.village), growth(land, LAND_SPOTS.village), detail, time);
}

function drawLake({ px, py }: { px: number; py: number }, grown: number, detail: number, time: number): void {
  if (grown <= 0) return;
  const k = easeOutCubic(grown), rx = LAKE.rx * detail * k, ry = LAKE.ry * detail * k;
  ctx.save();
  ellipsePath(px, py, rx, ry); ctx.fillStyle = LAKE.color; ctx.fill();
  ctx.strokeStyle = LAKE.shine; ctx.lineWidth = Math.max(1, 2 * detail);
  ctx.beginPath(); ctx.ellipse(px, py - ry * 0.2, rx * (0.55 + 0.05 * Math.sin(time * 1.4)), ry * 0.4, 0, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
  ctx.restore();
}

function drawGrove({ px, py }: { px: number; py: number }, grown: number, detail: number): void {
  TREES.forEach(([dx, dy, size], i) => {
    const k = easeOutCubic(clamp(grown * TREES.length - i * 0.7, 0, 1)) * size * detail;
    if (k <= 0) return;
    const baseX = px + dx * detail, baseY = py + dy * detail;
    ctx.strokeStyle = TREE.trunk; ctx.lineWidth = 5 * k; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(baseX, baseY); ctx.lineTo(baseX, baseY - TREE.height * k); ctx.stroke();
    ellipsePath(baseX, baseY - TREE.height * 1.3 * k, TREE.radius * k, TREE.radius * k); ctx.fillStyle = TREE.crown; ctx.fill();
    ellipsePath(baseX - TREE.radius * 0.3 * k, baseY - TREE.height * 1.5 * k, TREE.radius * 0.45 * k, TREE.radius * 0.45 * k); ctx.fillStyle = TREE.light; ctx.fill();
  });
}

function drawVillage({ px, py }: { px: number; py: number }, grown: number, detail: number, time: number): void {
  HOUSES.forEach(([dx, dy, size], i) => {
    const k = easeOutCubic(clamp(grown * HOUSES.length - i * 0.7, 0, 1)) * size * detail;
    if (k <= 0) return;
    const w = HOUSE.w * k, h = HOUSE.h * k, left = px + dx * detail - w / 2, top = py + dy * detail - h;
    ctx.fillStyle = HOUSE.wall; roundRectPath(left, top, w, h, 3 * k); ctx.fill();
    ctx.fillStyle = HOUSE.roof; ctx.beginPath(); ctx.moveTo(left - 4 * k, top); ctx.lineTo(left + w / 2, top - HOUSE.roofH * k); ctx.lineTo(left + w + 4 * k, top); ctx.closePath(); ctx.fill();
    ctx.fillStyle = HOUSE.lit; ctx.globalAlpha = 0.8 + 0.2 * Math.sin(time * 2 + i);
    roundRectPath(left + w * 0.34, top + h * 0.3, w * 0.32, h * 0.4, 2 * k); ctx.fill();
    ctx.globalAlpha = 1;
  });
}

/** The Moon, a giant magic cake layer, with a jagged crack that fades as the world heals. */
export function drawCrackedMoon(x: number, y: number, radius: number, land: number): void {
  drawGlow(x, y, radius * 2.5, '#d8e4ff', 0.3 + 0.2 * land);
  ellipsePath(x, y, radius, radius); ctx.fillStyle = '#eef3ff'; ctx.fill();
  ctx.fillStyle = 'rgba(150,170,230,0.35)';
  ellipsePath(x - radius * 0.28, y - radius * 0.22, radius * 0.22, radius * 0.17); ctx.fill();
  ellipsePath(x + radius * 0.3, y + radius * 0.34, radius * 0.17, radius * 0.14); ctx.fill();
  const crack: [number, number][] = [[0.52, -0.86], [0.2, -0.42], [0.42, -0.14], [0.02, 0.18], [0.24, 0.42], [-0.08, 0.98]];
  ctx.save();
  ctx.globalAlpha = 1 - land * 0.75;
  ctx.strokeStyle = '#3a2f6a'; ctx.lineJoin = 'round'; ctx.lineCap = 'round'; ctx.lineWidth = Math.max(1.5, radius * 0.07);
  ctx.beginPath();
  crack.forEach(([cx, cy], i) => { if (i) ctx.lineTo(x + cx * radius, y + cy * radius); else ctx.moveTo(x + cx * radius, y + cy * radius); });
  ctx.stroke();
  ctx.restore();
}
