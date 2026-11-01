import { ctx } from '../core/canvas';
import { ellipsePath } from '../core/draw';
import { SIGN_SHAPES } from '../data/elements';
import type { ElementId } from '../data/types';

/** Draws an element's sign as a glowing line; the white dot marks where to start drawing. */
export function drawSign(element: ElementId, centerX: number, centerY: number, size: number, color: string, lineWidth = 3): void {
  const sign = SIGN_SHAPES[element];
  const points = sign.closed ? [...sign.points, sign.points[0]] : sign.points;
  const toScreen = ([x, y]: [number, number]) => [centerX + (x - 0.5) * size, centerY + (y - 0.5) * size] as const;
  ctx.save();
  ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.shadowColor = color; ctx.shadowBlur = 8;
  ctx.beginPath();
  points.forEach((point, i) => { const [px, py] = toScreen(point); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
  ctx.stroke();
  const [startX, startY] = toScreen(points[0]);
  ctx.fillStyle = '#fff'; ellipsePath(startX, startY, lineWidth * 0.9, lineWidth * 0.9); ctx.fill();
  ctx.restore();
}

/** The point a share `k` (0..1) of the way along an element's sign, drawn as in `drawSign`. */
export function signPointAt(element: ElementId, centerX: number, centerY: number, size: number, k: number): [number, number] {
  const sign = SIGN_SHAPES[element];
  const points = sign.closed ? [...sign.points, sign.points[0]] : sign.points;
  const lengths = points.slice(1).map((point, i) => Math.hypot(point[0] - points[i][0], point[1] - points[i][1]));
  let distance = k * lengths.reduce((sum, length) => sum + length, 0);
  for (let i = 0; i < lengths.length; i++) {
    if (distance <= lengths[i] || i === lengths.length - 1) {
      const s = lengths[i] ? Math.min(1, distance / lengths[i]) : 0;
      const x = points[i][0] + (points[i + 1][0] - points[i][0]) * s, y = points[i][1] + (points[i + 1][1] - points[i][1]) * s;
      return [centerX + (x - 0.5) * size, centerY + (y - 0.5) * size];
    }
    distance -= lengths[i];
  }
  return [centerX, centerY];
}
