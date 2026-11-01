// How each cream is piped along the cake's edges: every cream has its own nozzle shape (shells, rosettes,
// ruffles, a twisted rope), and two "creams" are borders laid piece by piece (a berry mix, chocolate balls).
// A piece is drawn around (x, y) = its bead's point, about 20 px wide at size 9.
import { ctx } from '../core/canvas';
import { shade } from '../core/color';
import { ellipsePath } from '../core/draw';
import type { CreamStyle } from '../data/types';

/** Pieces are drawn for a bead radius of 9 and scaled to the actual size. */
const BASE_SIZE = 9;
/** Chocolate balls: every third one is a golden (white-chocolate) ball. */
const CHOCOLATE = { dark: ['#b27a5a', '#5a3220', '#2e160a'], golden: ['#ffe7b0', '#c08a4a', '#8a5a20'] } as const;
/** The berry mix: strawberry halves, raspberries and blueberries in turn. */
const BERRY_KINDS = 3;

/** A glossy ball with a highlight (berries, chocolate). */
function glossyBall(x: number, y: number, radius: number, [highlight, base, edge]: readonly [string, string, string]): void {
  const g = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.4, radius * 0.1, x, y, radius);
  g.addColorStop(0, highlight); g.addColorStop(0.6, base); g.addColorStop(1, edge);
  ellipsePath(x, y, radius, radius); ctx.fillStyle = g; ctx.fill();
}

/**
 * One piece of piping. `x` tells which side of the cake it is on (shells lean and the rope twists
 * the way the line runs), `index` gives each bead a stable variety (berry kind, golden balls).
 */
export function drawCreamPiece(style: CreamStyle, x: number, y: number, size: number, color: string, index: number): void {
  const edge = shade(color, -0.35), light = shade(color, 0.45);
  ctx.save();
  ctx.translate(x, y); ctx.scale(size / BASE_SIZE, size / BASE_SIZE);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  switch (style) {
    case 'shells': { // a teardrop with ridges from a star nozzle, leaning along the line
      ctx.scale(x >= 0 ? 1 : -1, 1);
      ctx.beginPath(); ctx.moveTo(-11, 3); ctx.quadraticCurveTo(-12, -9, 0, -9); ctx.quadraticCurveTo(10, -8, 9, 1); ctx.quadraticCurveTo(6, 6, -11, 3);
      ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.strokeStyle = light; ctx.lineWidth = 1.4;
      for (let k = -2; k <= 2; k++) { ctx.beginPath(); ctx.moveTo(-9 + k * 0.5, 2); ctx.quadraticCurveTo(-2 + k * 2, -7 + Math.abs(k), 6 + k, 0); ctx.stroke(); }
      break;
    }
    case 'rosettes': // a small swirl seen from above
      ellipsePath(0, 0, 9, 8); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.beginPath();
      for (let t = 0; t <= 1; t += 0.04) { const radius = 7 * (1 - t), angle = t * Math.PI * 4; ctx.lineTo(Math.cos(angle) * radius, -2 + Math.sin(angle) * radius * 0.8); }
      ctx.stroke();
      ellipsePath(-3, -4, 2, 1.4); ctx.fillStyle = 'rgba(255,255,255,0.75)'; ctx.fill();
      break;
    case 'ruffles': // a soft wavy frill
      ctx.beginPath(); ctx.moveTo(-10, 4); ctx.quadraticCurveTo(-7, -9, 0, -4); ctx.quadraticCurveTo(7, -9, 10, 4); ctx.quadraticCurveTo(0, 8, -10, 4);
      ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.strokeStyle = light; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(-6, 2); ctx.quadraticCurveTo(0, -4, 6, 2); ctx.stroke();
      break;
    case 'rope': // one slanted twist of a rope border
      ctx.rotate(Math.max(-1, Math.min(1, x / 120)) * 0.25);
      ctx.beginPath(); ctx.ellipse(0, 0, 10, 6.5, -0.6, 0, Math.PI * 2);
      ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 1.3; ctx.stroke();
      ctx.strokeStyle = light; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(-7, 3); ctx.quadraticCurveTo(0, -5, 7, -3); ctx.stroke();
      break;
    case 'berries':
      switch ((index * 7) % BERRY_KINDS) {
        case 0: { // a strawberry half, cut side out
          ctx.beginPath(); ctx.moveTo(-8, 4); ctx.quadraticCurveTo(-10, -9, 0, -11); ctx.quadraticCurveTo(9, -7, 8, 4); ctx.closePath();
          ctx.fillStyle = '#ef2f4f'; ctx.fill(); ctx.strokeStyle = '#a1102e'; ctx.lineWidth = 1; ctx.stroke();
          ctx.beginPath(); ctx.moveTo(-4.5, 3); ctx.quadraticCurveTo(-5.5, -5, 0, -8); ctx.quadraticCurveTo(4.5, -4.5, 4.5, 3); ctx.closePath();
          ctx.fillStyle = '#ffc2cc'; ctx.fill();
          ctx.fillStyle = '#fff3b0'; for (const [sx, sy] of [[-6, -3], [6, -2], [-2, -9], [3, -8]]) { ellipsePath(sx, sy, 0.9, 1.3); ctx.fill(); }
          break;
        }
        case 1: // a raspberry
          for (const [dx, dy] of [[-3.5, 1], [3.5, 1], [0, -3], [-3.5, -6], [3.5, -6], [0, -9.5]]) glossyBall(dx, dy, 3.4, ['#ffb7cc', '#f03a72', '#b0174a']);
          break;
        default: // a blueberry
          glossyBall(0, -3, 7, ['#a9b8ff', '#4a5cc8', '#1f2a74']);
          ctx.fillStyle = '#1b2258'; ellipsePath(0, -8.5, 1.8, 1.4); ctx.fill();
      }
      break;
    case 'chocoBalls':
      glossyBall(0, -2, 7, index % 3 === 2 ? CHOCOLATE.golden : CHOCOLATE.dark);
      break;
  }
  ctx.restore();
}

/** Styles laid as separate pieces (fruit, sweets) rather than piped cream: shown in a heap in the bowl. */
export const isPieceBorder = (style: CreamStyle): boolean => style === 'berries' || style === 'chocoBalls';

/** A little heap of the pieces, centred on (0, 0) (in a bowl on the shelf, on the day's menu icon). */
export function drawPieceHeap(style: CreamStyle, color: string, scale: number): void {
  const heap: [number, number][] = [[-14, 0], [0, 2], [14, 0], [-7, -10], [7, -10], [0, -19]];
  heap.forEach(([dx, dy], i) => drawCreamPiece(style, dx * scale, dy * scale, 9 * scale, color, i));
}
