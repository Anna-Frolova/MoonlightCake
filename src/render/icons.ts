// Small icons for ingredients, menu items and shop items. All are drawn centred on (x, y).
import { ctx } from '../core/canvas';
import { clock } from '../core/clock';
import { drawGlow, ellipsePath, roundRectPath, starPath } from '../core/draw';
import { INK } from '../core/theme';
import { HELPER_KITTEN } from '../data/cats';
import { CREAMS, FILLINGS, FLAVORS } from '../data/ingredients';
import type {
  CreamId, DecorId, FillingId, FlavorId, HelperId, MenuCategory, ShapeId, ShopItemId, ToppingId,
} from '../data/types';
import { getShapeGeometry } from '../game/cakeGeometry';
import { drawPrism } from './cake';
import { drawCat } from './cat';
import { drawPieceHeap, isPieceBorder } from './creamPiping';
import { drawTopping } from './toppings';

/** Saves the context, moves to (x, y), scales, sets the ink outline; restores after `draw`. */
function withIconTransform(x: number, y: number, scale: number, draw: () => void): void {
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.strokeStyle = INK; ctx.lineWidth = 2.5; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  draw();
  ctx.restore();
}

export function drawFlavorIcon(flavor: FlavorId, x: number, y: number, scale: number): void {
  withIconTransform(x, y, scale, () => {
    ctx.save(); ctx.translate(0, 14); ctx.scale(0.27, 0.27);
    drawPrism(getShapeGeometry('round'), 0, 80, FLAVORS[flavor].color);
    ctx.restore();
    if (FLAVORS[flavor].sparkles) {
      ctx.fillStyle = '#fff6c8';
      starPath(-8, 4, 4, 1.5, 4, 0); ctx.fill();
      starPath(10, 8, 3, 1.2, 4, 0); ctx.fill();
    }
  });
}

export function drawShapeIcon(shape: ShapeId, x: number, y: number, scale: number): void {
  withIconTransform(x, y, scale, () => {
    ctx.translate(0, 12); ctx.scale(0.26, 0.26);
    drawPrism(getShapeGeometry(shape), 0, 60, '#ff9cd0');
  });
}

/** A jar of filling. */
export function drawFillingIcon(filling: FillingId, x: number, y: number, scale: number): void {
  withIconTransform(x, y, scale, () => {
    roundRectPath(-20, -16, 40, 36, 10); ctx.fillStyle = 'rgba(230,240,255,0.5)'; ctx.fill(); ctx.stroke();
    roundRectPath(-16, -6, 32, 22, 7); ctx.fillStyle = FILLINGS[filling].color; ctx.fill();
    roundRectPath(-22, -24, 44, 10, 5); ctx.fillStyle = '#8e6ff0'; ctx.fill(); ctx.stroke();
    ctx.fillStyle = 'rgba(255,255,255,0.6)'; ellipsePath(-8, 0, 3, 6); ctx.fill();
  });
}

/** A bowl with a swirl of cream. */
export function drawCreamIcon(cream: CreamId, x: number, y: number, scale: number): void {
  withIconTransform(x, y, scale, () => {
    ctx.beginPath(); ctx.moveTo(-26, -6); ctx.lineTo(26, -6); ctx.lineTo(20, 22); ctx.lineTo(-20, 22); ctx.closePath();
    ctx.fillStyle = '#d8ccff'; ctx.fill(); ctx.stroke();
    if (isPieceBorder(CREAMS[cream].style)) { ctx.save(); ctx.translate(0, -8); drawPieceHeap(CREAMS[cream].style, CREAMS[cream].color, 1); ctx.restore(); return; }
    ctx.beginPath(); ctx.moveTo(-24, -6);
    ctx.quadraticCurveTo(-26, -22, -8, -18); ctx.quadraticCurveTo(0, -32, 10, -18); ctx.quadraticCurveTo(26, -22, 24, -6);
    ctx.closePath(); ctx.fillStyle = CREAMS[cream].color; ctx.fill(); ctx.stroke();
    if (CREAMS[cream].glows) { ctx.fillStyle = 'rgba(255,255,255,0.8)'; starPath(6, -16, 5, 2, 4, 0); ctx.fill(); }
  });
}

export function drawToppingIcon(topping: ToppingId, x: number, y: number, scale: number): void {
  withIconTransform(x, y, scale, () => drawTopping(topping, 0, 12, 1.6));
}

/** Icon for an item of the daily menu. */
export function drawMenuItemIcon(category: MenuCategory, id: string, x: number, y: number, scale: number): void {
  switch (category) {
    case 'shapes': drawShapeIcon(id as ShapeId, x, y, scale); break;
    case 'flavors': drawFlavorIcon(id as FlavorId, x, y, scale); break;
    case 'fillings': drawFillingIcon(id as FillingId, x, y, scale); break;
    case 'creams': drawCreamIcon(id as CreamId, x, y, scale); break;
    case 'toppings': drawToppingIcon(id as ToppingId, x, y, scale); break;
  }
}

export function drawDecorIcon(decor: DecorId, x: number, y: number, scale: number): void {
  withIconTransform(x, y, scale, () => {
    switch (decor) {
      case 'garland':
        ctx.beginPath(); ctx.moveTo(-30, -14); ctx.quadraticCurveTo(0, 14, 30, -14); ctx.stroke();
        ['#7ff0ff', '#ff8fd8', '#c9a0ff', '#fff096'].forEach((color, i) => {
          const bulbY = -6 + (i === 1 || i === 2 ? 8 : 0);
          ellipsePath(-22 + i * 15, bulbY + 6, 5, 7); ctx.fillStyle = color; ctx.fill(); ctx.stroke();
        });
        break;
      case 'catnip':
        for (let i = 0; i < 5; i++) {
          ctx.save(); ctx.rotate((i - 2) * 0.35);
          ctx.fillStyle = '#35c3a5'; ellipsePath(0, -18, 7, 16); ctx.fill(); ctx.stroke();
          ctx.restore();
        }
        ctx.beginPath(); ctx.moveTo(-18, -2); ctx.lineTo(18, -2); ctx.lineTo(14, 22); ctx.lineTo(-14, 22); ctx.closePath();
        ctx.fillStyle = '#7a4fd0'; ctx.fill(); ctx.stroke();
        break;
      case 'gramophone':
        roundRectPath(-20, 4, 40, 20, 4); ctx.fillStyle = '#6a3a8a'; ctx.fill(); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0, 4); ctx.lineTo(-14, -28); ctx.lineTo(26, -20); ctx.closePath();
        ctx.fillStyle = '#f0c45a'; ctx.fill(); ctx.stroke();
        break;
      case 'cushion':
        ellipsePath(0, 8, 30, 12); ctx.fillStyle = '#ff8ccf'; ctx.fill(); ctx.stroke();
        ellipsePath(4, -4, 20, 12); ctx.fillStyle = '#c9c3f0'; ctx.fill(); ctx.stroke();
        ellipsePath(-14, -6, 10, 9); ctx.fill(); ctx.stroke();
        break;
      case 'vitrage':
        ['#5b7fff', '#a06aff', '#3fd5e8', '#ff6ac8', '#ffd04e', '#6be0a0'].forEach((color, i) => {
          ctx.beginPath(); ctx.moveTo(0, 0); ctx.arc(0, 0, 26, (i * Math.PI) / 3, ((i + 1) * Math.PI) / 3); ctx.closePath();
          ctx.fillStyle = color; ctx.fill(); ctx.stroke();
        });
        ellipsePath(0, 0, 10, 10); ctx.fillStyle = '#f2f4ff'; ctx.fill(); ctx.stroke();
        break;
      case 'chandelier':
        ctx.beginPath(); ctx.ellipse(0, -4, 26, 8, 0, 0, Math.PI); ctx.strokeStyle = '#e8b84a'; ctx.lineWidth = 4; ctx.stroke();
        for (let i = 0; i < 5; i++) {
          const px = -24 + i * 12;
          ctx.fillStyle = '#bff0ff';
          ctx.beginPath(); ctx.moveTo(px, 4); ctx.lineTo(px + 4, 12); ctx.lineTo(px, 22); ctx.lineTo(px - 4, 12); ctx.closePath(); ctx.fill();
        }
        ctx.fillStyle = '#9feaff'; ellipsePath(0, -18, 4, 7); ctx.fill();
        break;
    }
  });
}

export function drawHelperIcon(helper: HelperId, x: number, y: number, scale: number, time = clock.time): void {
  withIconTransform(x, y, scale, () => {
    drawGlow(0, 0, 34, '#bff0ff', 0.35 + 0.15 * Math.sin(time * 3));
    switch (helper) {
      case 'layers': // magic spatula
        ctx.save(); ctx.rotate(-0.5 + Math.sin(time * 2) * 0.08);
        roundRectPath(-4, -6, 8, 34, 3); ctx.fillStyle = '#9a6646'; ctx.fill(); ctx.stroke();
        roundRectPath(-14, -30, 28, 26, 8); ctx.fillStyle = '#e9e1f4'; ctx.fill(); ctx.stroke();
        ctx.fillStyle = '#ffd84a'; starPath(0, -17, 6, 2.5); ctx.fill();
        ctx.restore();
        break;
      case 'cream': // enchanted whisk
        ctx.save(); ctx.rotate(0.4 + Math.sin(time * 6) * 0.15);
        roundRectPath(-4, 6, 8, 22, 3); ctx.fillStyle = '#c98c5e'; ctx.fill(); ctx.stroke();
        for (let i = -2; i <= 2; i++) {
          ctx.beginPath(); ctx.ellipse(0, -8, 4 + Math.abs(i) * 4, 16, 0, 0, Math.PI * 2);
          ctx.strokeStyle = '#dfe6ff'; ctx.lineWidth = 2; ctx.stroke();
        }
        ctx.restore();
        break;
      case 'glaze': // smart cauldron with a colour-cycling brew
        ctx.beginPath(); ctx.arc(0, 2, 22, 0, Math.PI); ctx.closePath(); ctx.fillStyle = '#3a2f5f'; ctx.fill(); ctx.stroke();
        ellipsePath(0, 2, 22, 6); ctx.fillStyle = `hsl(${(time * 80) % 360},70%,60%)`; ctx.fill(); ctx.stroke();
        ctx.strokeStyle = '#ffcf45'; ctx.lineWidth = 3; ellipsePath(0, 2, 23, 7); ctx.stroke();
        break;
      case 'toppings':
        drawCat(HELPER_KITTEN, 0, 30, 0.2, time, 'happy');
        break;
      case 'magic': { // crystal ball
        roundRectPath(-14, 14, 28, 8, 3); ctx.fillStyle = '#6a3a8a'; ctx.fill(); ctx.stroke();
        ellipsePath(0, -2, 17, 17);
        const ball = ctx.createRadialGradient(-5, -8, 2, 0, -2, 18);
        ball.addColorStop(0, '#ffffff'); ball.addColorStop(0.5, '#c9b3ff'); ball.addColorStop(1, '#6a4fc0');
        ctx.fillStyle = ball; ctx.fill(); ctx.stroke();
        ctx.fillStyle = `rgba(255,255,255,${0.5 + 0.5 * Math.sin(time * 4)})`; starPath(4, -6, 5, 1.8, 4, 0); ctx.fill();
        break;
      }
    }
  });
}

export function drawShopItemIcon(item: ShopItemId, x: number, y: number, scale: number): void {
  const [kind, key] = item.split(':');
  if (kind === 'decor') drawDecorIcon(key as DecorId, x, y, scale);
  else drawHelperIcon(key as HelperId, x, y, scale);
}
