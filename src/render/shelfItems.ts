// Ingredients on the kitchen shelves as real objects: cake layers, jars of filling, piping bags of cream, dishes of toppings.
// Each is drawn with (x, y) at the middle of its base, standing on the shelf board.
import { ctx } from '../core/canvas';
import { shade } from '../core/color';
import { drawGlow, ellipsePath, roundRectPath, starPath } from '../core/draw';
import { CREAMS, FILLINGS, FLAVORS } from '../data/ingredients';
import type { CreamId, FillingId, FlavorId, ShapeId, ToppingId } from '../data/types';
import { getShapeGeometry } from '../game/cakeGeometry';
import { drawPrism } from './cake';
import { drawCreamPiece, drawPieceHeap, isPieceBorder } from './creamPiping';
import { drawTopping } from './toppings';

const PORCELAIN = '#f1ecff';
const PORCELAIN_SHADOW = '#b9aee6';
const PORCELAIN_RIM = '#8e82c8';
/** A layer piece is drawn with the cake's own geometry, shrunk to shelf size and lifted to sit on the board. */
const LAYER_PIECE_SCALE = 0.27, LAYER_PIECE_HEIGHT = 44, LAYER_PIECE_LIFT = 40;

/** Polished steel of the piping nozzles: light from the left, a bright stripe, a darker right side. */
const STEEL = { light: '#f4f6ff', mid: '#c3c8d8', dark: '#7c8299', edge: '#5d6278' } as const;
/** The piping bag leans to the left, its nozzle tip standing above the sample of its pattern. */
const BAG = { tipX: 6, tipY: -27, tilt: -0.22, nozzleLength: 18, length: 64, topHalfWidth: 22 } as const;
/** Three pieces of the nozzle's pattern piped on the shelf under the tip. */
const SAMPLE = { y: -8, spacing: 21, size: 9 } as const;

/** How the nozzle's opening looks from the tip: a closed star, an open star, a petal slit, a fine French star. */
function nozzleOpeningPath(cream: CreamId, radius: number): void {
  switch (CREAMS[cream].style) {
    case 'shells': starPath(0, 0, radius, radius * 0.45, 5); break;
    case 'rosettes': starPath(0, 0, radius, radius * 0.6, 8); break;
    case 'ruffles':
      ctx.beginPath(); ctx.moveTo(-radius, radius * 0.3);
      ctx.quadraticCurveTo(0, -radius, radius, radius * 0.3); ctx.quadraticCurveTo(0, -radius * 0.3, -radius, radius * 0.3); ctx.closePath();
      break;
    default: starPath(0, 0, radius, radius * 0.78, 12);
  }
}

/** A piping bag full of the cream with a steel nozzle, drawn from its nozzle tip at (0, 0) upwards. */
function drawPipingBag(cream: CreamId): void {
  const color = CREAMS[cream].color, edge = shade(color, -0.45), { nozzleLength: n, length, topHalfWidth: w } = BAG;
  ctx.lineJoin = 'round';
  // the bag: narrow at the nozzle, plump towards the top, gathered and twisted shut
  ctx.beginPath(); ctx.moveTo(-7, -n + 3);
  ctx.quadraticCurveTo(-w - 2, -length * 0.5, -w, -length); ctx.lineTo(w, -length);
  ctx.quadraticCurveTo(w + 2, -length * 0.5, 7, -n + 3); ctx.closePath();
  const fill = ctx.createLinearGradient(-w, 0, w, 0);
  fill.addColorStop(0, shade(color, 0.4)); fill.addColorStop(0.55, color); fill.addColorStop(1, shade(color, -0.25));
  ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.5)'; ctx.beginPath(); ctx.ellipse(-w * 0.45, -length * 0.55, 4, 14, 0.15, 0, Math.PI * 2); ctx.fill();
  ellipsePath(0, -length, w, 5); ctx.fillStyle = shade(color, -0.2); ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(-6, -length - 3); ctx.quadraticCurveTo(-2, -length - 12, 4, -length - 9); ctx.quadraticCurveTo(8, -length - 6, 5, -length - 2); ctx.closePath();
  ctx.fillStyle = shade(color, -0.1); ctx.fill(); ctx.stroke();
  if (CREAMS[cream].glows) { ctx.fillStyle = '#ffffff'; starPath(w * 0.35, -length * 0.45, 6, 2.4, 4, 0); ctx.fill(); }
  // the steel nozzle and its opening
  ctx.beginPath(); ctx.moveTo(-9, -n); ctx.lineTo(9, -n); ctx.lineTo(5, 0); ctx.lineTo(-5, 0); ctx.closePath();
  const steel = ctx.createLinearGradient(-9, 0, 9, 0);
  steel.addColorStop(0, STEEL.dark); steel.addColorStop(0.35, STEEL.light); steel.addColorStop(0.6, STEEL.mid); steel.addColorStop(1, STEEL.dark);
  ctx.fillStyle = steel; ctx.fill(); ctx.strokeStyle = STEEL.edge; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.save(); ctx.scale(1, 0.4); nozzleOpeningPath(cream, 5.5); ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 1; ctx.stroke(); ctx.restore();
}

/** A piping bag of the cream over a sample of its pattern, so each nozzle shows what it pipes. */
export function drawCreamOnShelf(cream: CreamId, x: number, y: number, scale = 1): void {
  if (isPieceBorder(CREAMS[cream].style)) { drawCreamBowl(cream, x, y, scale); return; }
  const { color, style } = CREAMS[cream];
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale);
  if (CREAMS[cream].glows) drawGlow(0, -46, 46, '#d8c8ff', 0.45);
  for (let i = -1; i <= 1; i++) drawCreamPiece(style, i * SAMPLE.spacing, SAMPLE.y, SAMPLE.size, color, i + 1);
  ctx.translate(BAG.tipX, BAG.tipY); ctx.rotate(BAG.tilt);
  drawPipingBag(cream);
  ctx.restore();
}

/** A ceramic bowl heaped with the pieces of a border laid by hand (berries, chocolate balls). */
function drawCreamBowl(cream: CreamId, x: number, y: number, scale: number): void {
  const color = CREAMS[cream].color;
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.save(); ctx.translate(0, -30); drawPieceHeap(CREAMS[cream].style, color, 1.25); ctx.restore();
  // bowl
  ctx.beginPath(); ctx.moveTo(-34, -26); ctx.quadraticCurveTo(-32, 2, 0, 2); ctx.quadraticCurveTo(32, 2, 34, -26); ctx.closePath();
  const bowl = ctx.createLinearGradient(-34, 0, 34, 0);
  bowl.addColorStop(0, PORCELAIN); bowl.addColorStop(0.7, PORCELAIN); bowl.addColorStop(1, PORCELAIN_SHADOW);
  ctx.fillStyle = bowl; ctx.fill();
  ctx.strokeStyle = PORCELAIN_RIM; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = color; ctx.fillRect(-30, -16, 60, 5); // band in the cream's colour
  ellipsePath(0, -26, 34, 6); ctx.fillStyle = shade(color, -0.1); ctx.fill(); ctx.stroke(); // rim with cream inside
  ctx.restore();
}

/** Where the toppings lie on a dish (offsets from its centre), front ones last. */
const DISH_PILE: [number, number][] = [[-14, -10], [14, -10], [0, -14], [-6, -4], [8, -3]];

/** A shallow porcelain dish with a little heap of one topping. */
export function drawToppingDish(topping: ToppingId, x: number, y: number, scale = 1): void {
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale);
  // foot and plate
  ellipsePath(0, 0, 18, 5); ctx.fillStyle = PORCELAIN_SHADOW; ctx.fill();
  ellipsePath(0, -6, 36, 10);
  const plate = ctx.createLinearGradient(-36, 0, 36, 0);
  plate.addColorStop(0, PORCELAIN); plate.addColorStop(0.75, PORCELAIN); plate.addColorStop(1, PORCELAIN_SHADOW);
  ctx.fillStyle = plate; ctx.fill();
  ctx.strokeStyle = PORCELAIN_RIM; ctx.lineWidth = 2; ctx.stroke();
  ellipsePath(0, -7, 27, 6); ctx.fillStyle = 'rgba(142,130,200,0.25)'; ctx.fill();
  for (const [dx, dy] of DISH_PILE) drawTopping(topping, dx, dy, 1.15);
  ctx.restore();
}

/** One cake layer of the flavour, in the given shape (the shelf follows the shape switches). */
export function drawLayerPiece(flavor: FlavorId, shape: ShapeId, x: number, y: number, scale = 1): void {
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale * LAYER_PIECE_SCALE, scale * LAYER_PIECE_SCALE);
  drawPrism(getShapeGeometry(shape), -LAYER_PIECE_LIFT, LAYER_PIECE_HEIGHT, FLAVORS[flavor].color);
  if (FLAVORS[flavor].sparkles) {
    ctx.fillStyle = '#fff6c8';
    starPath(-40, -LAYER_PIECE_LIFT - 22, 13, 5, 4, 0); ctx.fill();
    starPath(36, -LAYER_PIECE_LIFT - 14, 10, 4, 4, 0); ctx.fill();
  }
  ctx.restore();
}

/** A glass jar of filling with a lid and a shine. */
export function drawFillingJar(filling: FillingId, x: number, y: number, scale = 1): void {
  const color = FILLINGS[filling].color;
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale);
  if (FILLINGS[filling].glows) drawGlow(0, -26, 40, color, 0.4);
  ctx.strokeStyle = PORCELAIN_RIM; ctx.lineWidth = 2;
  roundRectPath(-22, -48, 44, 48, 12); ctx.fillStyle = 'rgba(230,240,255,0.35)'; ctx.fill(); ctx.stroke(); // glass
  roundRectPath(-18, -32, 36, 29, 9); ctx.fillStyle = color; ctx.fill(); // filling inside
  ctx.fillStyle = shade(color, 0.35); ellipsePath(0, -31, 17, 4); ctx.fill(); // its surface
  roundRectPath(-25, -58, 50, 13, 6); ctx.fillStyle = '#8e6ff0'; ctx.fill(); ctx.stroke(); // lid
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; roundRectPath(-21, -56, 20, 4, 2); ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.6)'; ellipsePath(-12, -22, 3.5, 9); ctx.fill(); // shine on the glass
  ctx.restore();
}
