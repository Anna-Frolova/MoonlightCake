// The order shown as a picture of the wanted cake (no icon row: the picture itself tells what to make).
import { ctx } from '../core/canvas';
import { drawGlow, roundRectPath } from '../core/draw';
import { cakeHeight } from '../game/cake';
import { buildOrderPicture } from '../game/orders';
import type { Customer } from '../game/state';
import { drawCake } from './cake';

/** The cake picture never grows beyond this scale (the kitchen's thought cloud is large). */
const MAX_PICTURE_SCALE = 1.15;

export function drawOrderCard(customer: Customer, x: number, y: number, w: number, h: number): void {
  const background = ctx.createLinearGradient(0, y, 0, y + h);
  background.addColorStop(0, '#5a42a8'); background.addColorStop(1, '#2c1e6a');
  ctx.fillStyle = background; roundRectPath(x, y, w, h, 16); ctx.fill();
  ctx.strokeStyle = 'rgba(159,234,255,0.3)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.save();
  roundRectPath(x, y, w, h, 16); ctx.clip();
  drawGlow(x + w / 2, y + h * 0.6, Math.min(w, h * 1.6) * 0.6, '#e8dcff', 0.45);
  drawOrderCake(customer, x, y, w, h);
  ctx.restore();
}

/** Just the wanted cake, fitted into the box (no card behind it). `hideMagic`: without its magic effects (they can hide the toppings). */
export function drawOrderCake(customer: Customer, x: number, y: number, w: number, h: number, hideMagic = false): void {
  const picture = customer.orderPicture ??= buildOrderPicture(customer.order);
  const magic = picture.magicQuality;
  if (hideMagic) picture.magicQuality = null;
  const scale = Math.min(MAX_PICTURE_SCALE, (h - 20) / (cakeHeight(picture) + 110), (w - 20) / 270);
  drawCake(picture, x + w / 2, y + h - 10 - 40 * scale, scale);
  picture.magicQuality = magic;
}
