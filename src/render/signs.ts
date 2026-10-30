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
