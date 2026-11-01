// Ingredients on the kitchen shelves as real objects: cake layers, jars of filling, bowls of cream, dishes of toppings.
// Each is drawn with (x, y) at the middle of its base, standing on the shelf board.
import { ctx } from '../core/canvas';
import { shade } from '../core/color';
import { drawGlow, ellipsePath, roundRectPath, starPath } from '../core/draw';
import { CREAMS, FILLINGS, FLAVORS } from '../data/ingredients';
import type { CreamId, FillingId, FlavorId, ShapeId, ToppingId } from '../data/types';
import { getShapeGeometry } from '../game/cakeGeometry';
import { drawPrism } from './cake';
import { drawTopping } from './toppings';

const PORCELAIN = '#f1ecff';
const PORCELAIN_SHADOW = '#b9aee6';
const PORCELAIN_RIM = '#8e82c8';
/** A layer piece is drawn with the cake's own geometry, shrunk to shelf size and lifted to sit on the board. */
const LAYER_PIECE_SCALE = 0.27, LAYER_PIECE_HEIGHT = 44, LAYER_PIECE_LIFT = 40;

/** A ceramic bowl heaped with a swirl of cream. */
export function drawCreamBowl(cream: CreamId, x: number, y: number, scale = 1): void {
  const color = CREAMS[cream].color, dark = shade(color, -0.25);
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale);
  if (CREAMS[cream].glows) drawGlow(0, -40, 46, '#d8c8ff', 0.45);

  // cream swirl: three tiers and a curled tip, peeking out of the bowl
  ctx.strokeStyle = dark; ctx.lineWidth = 1.6;
  const tiers: [number, number, number][] = [[0, -30, 26], [0, -44, 19], [2, -55, 12]];
  for (const [tierX, tierY, radius] of tiers) {
    ellipsePath(tierX, tierY, radius, radius * 0.62);
    const fill = ctx.createLinearGradient(0, tierY - radius, 0, tierY + radius * 0.6);
    fill.addColorStop(0, shade(color, 0.3)); fill.addColorStop(1, color);
    ctx.fillStyle = fill; ctx.fill(); ctx.stroke();
  }
  ctx.beginPath(); ctx.moveTo(-3, -60); ctx.quadraticCurveTo(4, -74, 10, -64); ctx.quadraticCurveTo(6, -62, 3, -59); ctx.closePath();
  ctx.fillStyle = shade(color, 0.3); ctx.fill(); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.7)'; ellipsePath(-9, -48, 5, 3); ctx.fill();
  if (CREAMS[cream].glows) { ctx.fillStyle = '#ffffff'; starPath(12, -50, 5, 2, 4, 0); ctx.fill(); }

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
