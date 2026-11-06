import { ctx } from '../core/canvas';
import { clock } from '../core/clock';
import { drawGlow, ellipsePath } from '../core/draw';
import type { Point } from '../core/math';
import { TUTORIAL_COLOR } from '../core/theme';
import { ELEMENTS, SIGN_SHAPES } from '../data/elements';
import type { ElementId } from '../data/types';

/** The dashed sign: dash pattern, line width, arrowheads spread along it, the spark running round it. */
const SIGN_GUIDE = { dash: [16, 12], lineWidth: 6, arrows: 3, arrowSize: 26, sparkSpeed: 0.45, sparkCycle: 1.25, dimWhileDrawing: 0.35 };

/**
 * Draws an element's sign as a glowing line; the white dot marks where to start drawing. `underlay` adds a dark
 * outline under the line, so light signs stay visible on a bright background.
 */
export function drawSign(element: ElementId, centerX: number, centerY: number, size: number, color: string, lineWidth = 3, underlay?: string): void {
  const sign = SIGN_SHAPES[element];
  const points = sign.closed ? [...sign.points, sign.points[0]] : sign.points;
  const toScreen = ([x, y]: [number, number]) => [centerX + (x - 0.5) * size, centerY + (y - 0.5) * size] as const;
  ctx.save();
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  points.forEach((point, i) => { const [px, py] = toScreen(point); if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
  if (underlay) { ctx.strokeStyle = underlay; ctx.lineWidth = lineWidth + 4; ctx.stroke(); }
  ctx.strokeStyle = color; ctx.lineWidth = lineWidth; ctx.shadowColor = color; ctx.shadowBlur = 8;
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

/** A filled arrowhead with its tip at (x, y), pointing along `angle`. */
export function drawArrowhead(x: number, y: number, angle: number, size: number): void {
  ctx.save();
  ctx.translate(x, y); ctx.rotate(angle);
  ctx.beginPath(); ctx.moveTo(0, 0); ctx.lineTo(-size, -size * 0.6); ctx.lineTo(-size * 0.7, 0); ctx.lineTo(-size, size * 0.6); ctx.closePath();
  ctx.strokeStyle = TUTORIAL_COLOR.guideUnderlay; ctx.lineWidth = 4; ctx.stroke();
  ctx.fillStyle = TUTORIAL_COLOR.guide; ctx.fill();
  ctx.restore();
}

/** The sign to draw, big and dashed: arrows show the way, a spark runs it from the white start dot; faint with `isDim` (while the player draws). */
export function drawSignGuide(element: ElementId, centerX: number, centerY: number, size: number, isDim: boolean): void {
  const sign = SIGN_SHAPES[element];
  const points = sign.closed ? [...sign.points, sign.points[0]] : sign.points;
  const toScreen = ([x, y]: [number, number]): Point => ({ x: centerX + (x - 0.5) * size, y: centerY + (y - 0.5) * size });
  const at = (k: number): Point => { const [x, y] = signPointAt(element, centerX, centerY, size, k); return { x, y }; };
  ctx.save();
  ctx.globalAlpha = isDim ? SIGN_GUIDE.dimWhileDrawing : 1;
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.beginPath();
  points.forEach((point, i) => { const p = toScreen(point); if (i) ctx.lineTo(p.x, p.y); else ctx.moveTo(p.x, p.y); });
  ctx.setLineDash(SIGN_GUIDE.dash); ctx.lineDashOffset = -clock.time * 30; // the dashes march the way to draw
  ctx.strokeStyle = TUTORIAL_COLOR.guideUnderlay; ctx.lineWidth = SIGN_GUIDE.lineWidth + 5; ctx.stroke();
  ctx.strokeStyle = TUTORIAL_COLOR.guide; ctx.lineWidth = SIGN_GUIDE.lineWidth; ctx.stroke();
  ctx.setLineDash([]);
  for (let i = 0; i < SIGN_GUIDE.arrows; i++) {
    const k = (i + 0.5) / SIGN_GUIDE.arrows, before = at(k - 0.01), tip = at(k + 0.01);
    drawArrowhead(tip.x, tip.y, Math.atan2(tip.y - before.y, tip.x - before.x), SIGN_GUIDE.arrowSize);
  }
  const start = toScreen(points[0]), startPulse = 1 + 0.2 * Math.sin(clock.time * 6);
  drawGlow(start.x, start.y, 30, '#ffffff', 0.6);
  ctx.fillStyle = '#ffffff'; ellipsePath(start.x, start.y, 10 * startPulse, 10 * startPulse); ctx.fill();
  const spark = at(Math.min(1, (clock.time * SIGN_GUIDE.sparkSpeed) % SIGN_GUIDE.sparkCycle));
  drawGlow(spark.x, spark.y, 26, ELEMENTS[element].color, 0.9);
  ctx.restore();
}
