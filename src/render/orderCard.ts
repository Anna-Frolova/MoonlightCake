// The order shown as a picture of the wanted cake plus a row of icons: palette, element, topping counts.
import { ctx } from '../core/canvas';
import { drawGlassPill, drawGlow, drawText, ellipsePath, roundRectPath } from '../core/draw';
import { TEXT } from '../core/theme';
import { ELEMENTS } from '../data/elements';
import { PALETTES } from '../data/palettes';
import type { ToppingId } from '../data/types';
import { cakeHeight } from '../game/cake';
import { buildOrderPicture } from '../game/orders';
import type { Customer } from '../game/state';
import { drawCake } from './cake';
import { drawSign } from './signs';
import { drawTopping } from './toppings';

const ICON_ROW_HEIGHT = 38;
/** The cake picture never grows beyond this scale (the kitchen ticket is large). */
const MAX_PICTURE_SCALE = 1.15;

/** `hideMagic`: draw the wanted cake without its magic effects (they can hide the toppings). */
export function drawOrderCard(customer: Customer, x: number, y: number, w: number, h: number, hideMagic = false): void {
  const order = customer.order;
  const picture = customer.orderPicture ??= buildOrderPicture(order);
  const magic = picture.magicQuality;
  if (hideMagic) picture.magicQuality = null;

  // picture area
  const pictureH = h - ICON_ROW_HEIGHT - 4;
  const background = ctx.createLinearGradient(0, y, 0, y + pictureH);
  background.addColorStop(0, '#5a42a8'); background.addColorStop(1, '#2c1e6a');
  ctx.fillStyle = background; roundRectPath(x, y, w, pictureH, 16); ctx.fill();
  ctx.strokeStyle = 'rgba(159,234,255,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.save();
  roundRectPath(x, y, w, pictureH, 16); ctx.clip();
  drawGlow(x + w / 2, y + pictureH * 0.6, Math.min(w, pictureH * 1.6) * 0.6, '#e8dcff', 0.45);
  const scale = Math.min(MAX_PICTURE_SCALE, (pictureH - 20) / (cakeHeight(picture) + 110), (w - 20) / 270);
  drawCake(picture, x + w / 2, y + pictureH - 10 - 40 * scale, scale);
  picture.magicQuality = magic;
  ctx.restore();

  // icon row
  const rowY = y + pictureH + 4 + ICON_ROW_HEIGHT / 2;
  drawGlassPill(x, rowY - ICON_ROW_HEIGHT / 2, w, ICON_ROW_HEIGHT, 0.55);
  let cursorX = x + 14;
  PALETTES[order.palette].swatches.forEach((color, i) => {
    ellipsePath(cursorX + i * 13, rowY, 6, 6); ctx.fillStyle = color; ctx.fill();
    ctx.strokeStyle = 'rgba(255,255,255,0.7)'; ctx.lineWidth = 1.2; ctx.stroke();
  });
  cursorX += 46;

  const element = ELEMENTS[order.element];
  drawGlow(cursorX + 12, rowY, 22, element.color, 0.45);
  ellipsePath(cursorX + 12, rowY, 13, 13); ctx.fillStyle = 'rgba(20,10,50,0.7)'; ctx.fill();
  ctx.strokeStyle = element.color; ctx.lineWidth = 1.5; ctx.stroke();
  drawSign(order.element, cursorX + 12, rowY, 14, element.color, 2);
  cursorX += 36;

  for (const [topping, count] of Object.entries(order.toppings) as [ToppingId, number][]) {
    drawTopping(topping, cursorX + 10, rowY + 8, 0.95);
    drawText('×' + count, cursorX + 23, rowY + 1, 18, TEXT.main, 'left', 900);
    cursorX += 58;
  }
}
