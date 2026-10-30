// Stylised elixir bottles on the glaze shelf. Each essence has its own bottle shape.
import { ctx } from '../core/canvas';
import { clock } from '../core/clock';
import { shade } from '../core/color';
import { drawGlow, ellipsePath, roundRectPath } from '../core/draw';
import { ESSENCES } from '../data/ingredients';
import type { EssenceId } from '../data/types';

type BottleShape = 'round' | 'vial' | 'bulb' | 'heart' | 'diamond';
const BOTTLE_SHAPES: Record<EssenceId, BottleShape> = { red: 'round', yellow: 'vial', blue: 'bulb', white: 'heart', dark: 'diamond' };
const LOCKED_LIQUID = '#6e6488';

/** Height from the bottle origin (body) up to the neck's lip, before scaling. */
export const BOTTLE_NECK_TOP = 38;

function traceBody(shape: BottleShape): void {
  ctx.beginPath();
  switch (shape) {
    case 'vial': roundRectPath(-11, -18, 22, 42, 10); break;
    case 'bulb':
      ctx.moveTo(-5, -16); ctx.lineTo(-20, 6); ctx.quadraticCurveTo(-26, 24, 0, 24);
      ctx.quadraticCurveTo(26, 24, 20, 6); ctx.lineTo(5, -16); ctx.closePath();
      break;
    case 'heart':
      ctx.moveTo(0, 24);
      ctx.bezierCurveTo(-8, 18, -24, 8, -22, -4); ctx.bezierCurveTo(-21, -16, -6, -18, 0, -8);
      ctx.bezierCurveTo(6, -18, 21, -16, 22, -4); ctx.bezierCurveTo(24, 8, 8, 18, 0, 24);
      ctx.closePath();
      break;
    case 'diamond':
      ctx.moveTo(0, -16); ctx.lineTo(20, 4); ctx.lineTo(0, 24); ctx.lineTo(-20, 4); ctx.closePath();
      break;
    default: ctx.arc(0, 4, 20, 0, Math.PI * 2);
  }
}

/**
 * Draws the bottle of `essence` with its body at (x, y). Locked bottles (not yet unlocked)
 * are greyed out and have no bubbles.
 */
export function drawPotionBottle(essence: EssenceId, x: number, y: number, scale = 1, locked = false): void {
  const color = locked ? LOCKED_LIQUID : ESSENCES[essence].color;
  const shape = BOTTLE_SHAPES[essence];
  const time = clock.time;
  ctx.save(); ctx.translate(x, y); ctx.scale(scale, scale); ctx.lineJoin = 'round';

  // neck
  roundRectPath(-6, -34, 12, 22, 3);
  ctx.fillStyle = 'rgba(210,230,255,0.28)'; ctx.fill();
  ctx.strokeStyle = 'rgba(235,245,255,0.75)'; ctx.lineWidth = 1.6; ctx.stroke();

  // glass body with liquid, a bright surface and rising bubbles
  traceBody(shape); ctx.fillStyle = 'rgba(200,220,255,0.2)'; ctx.fill();
  ctx.save(); traceBody(shape); ctx.clip();
  const surfaceY = shape === 'vial' ? -6 : -2;
  const liquid = ctx.createLinearGradient(0, surfaceY, 0, 26);
  liquid.addColorStop(0, shade(color, 0.12)); liquid.addColorStop(0.5, color); liquid.addColorStop(1, shade(color, -0.3));
  ctx.fillStyle = liquid; ctx.fillRect(-30, surfaceY + Math.sin(time * 2 + x), 60, 40);
  ellipsePath(0, surfaceY, 24, 3); ctx.fillStyle = shade(color, 0.45); ctx.fill();
  if (!locked) {
    for (let i = 0; i < 4; i++) {
      const rise = (time * 0.6 + i * 0.27 + x * 0.01) % 1;
      ellipsePath(-8 + i * 5.5, 22 - rise * (22 - surfaceY), 1.6, 1.6);
      ctx.fillStyle = `rgba(255,255,255,${0.6 * (1 - rise)})`; ctx.fill();
    }
    drawGlow(0, 10, 22, '#ffffff', 0.15);
  }
  ctx.restore();

  // outline: dark rim + light glass edge, and a highlight stroke
  traceBody(shape);
  ctx.strokeStyle = 'rgba(30,10,70,0.55)'; ctx.lineWidth = 3; ctx.stroke();
  ctx.strokeStyle = 'rgba(235,245,255,0.85)'; ctx.lineWidth = 1.6; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.75)'; ctx.lineWidth = 2.4; ctx.lineCap = 'round';
  ctx.beginPath();
  if (shape === 'vial') { ctx.moveTo(-6, -12); ctx.lineTo(-6, 10); }
  else if (shape === 'diamond') { ctx.moveTo(-5, -8); ctx.lineTo(-13, 2); }
  else ctx.arc(0, 4, 14, Math.PI * 1.1, Math.PI * 1.45);
  ctx.stroke();

  // lip, cork, string and a little tag with the colour dot
  roundRectPath(-8, -36, 16, 5, 2.5); ctx.fillStyle = 'rgba(225,238,255,0.8)'; ctx.fill();
  const cork = ctx.createLinearGradient(-6, 0, 6, 0);
  cork.addColorStop(0, '#a8744a'); cork.addColorStop(1, '#6e4426');
  ctx.fillStyle = cork;
  ctx.beginPath(); ctx.moveTo(-5, -36); ctx.lineTo(-6, -45); ctx.quadraticCurveTo(0, -48, 6, -45); ctx.lineTo(5, -36); ctx.closePath(); ctx.fill();
  ctx.strokeStyle = '#e8c06a'; ctx.lineWidth = 1.4;
  ctx.beginPath(); ctx.moveTo(-6.5, -30); ctx.lineTo(6.5, -28); ctx.moveTo(5, -29); ctx.quadraticCurveTo(12, -24, 11, -16); ctx.stroke();
  ctx.save(); ctx.translate(11, -14); ctx.rotate(0.18);
  roundRectPath(-5, 0, 11, 9, 2); ctx.fillStyle = '#fff1d0'; ctx.fill();
  ellipsePath(0.5, 4.5, 2.2, 2.2); ctx.fillStyle = color; ctx.fill();
  ctx.restore();

  ctx.restore();
}
