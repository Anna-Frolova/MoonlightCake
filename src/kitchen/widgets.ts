// Small UI pieces used inside the kitchen tool panel.
import { ctx } from '../core/canvas';
import { drawGlow, drawText, roundRectPath } from '../core/draw';
import { TEXT } from '../core/theme';
import { button } from '../core/ui';

/** Background of a tool card / topping tray slot. */
export function drawCardBackground(x: number, y: number, w: number, h: number, selected: boolean, hovered: boolean): void {
  ctx.save();
  if (selected) { ctx.shadowColor = 'rgba(95,216,255,0.9)'; ctx.shadowBlur = 18; }
  else if (hovered) { ctx.shadowColor = 'rgba(180,140,255,0.7)'; ctx.shadowBlur = 14; }
  const fill = ctx.createLinearGradient(0, y, 0, y + h);
  fill.addColorStop(0, selected ? '#4f6fd8' : hovered ? '#5a44a8' : '#45348f');
  fill.addColorStop(1, selected ? '#2c3e9a' : hovered ? '#3a2a80' : '#2c2068');
  ctx.fillStyle = fill; roundRectPath(x, y, w, h, 16); ctx.fill();
  ctx.shadowBlur = 0;
  ctx.strokeStyle = selected ? 'rgba(159,234,255,0.95)' : 'rgba(200,180,255,0.25)';
  ctx.lineWidth = selected ? 2.5 : 1.5; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.07)'; roundRectPath(x + 4, y + 3, w - 8, h * 0.35, 12); ctx.fill();
  ctx.restore();
}

export interface ToolCardOptions {
  selected?: boolean;
  silent?: boolean;
  labelSize?: number;
}

/** A clickable card with an icon and a caption under it. `drawIcon` gets the icon centre. */
export function toolCard(
  id: string, x: number, y: number, w: number, h: number,
  label: string, drawIcon: (cx: number, cy: number) => void, onClick: () => void, options: ToolCardOptions = {},
): void {
  button(id, x, y, w, h, '', {
    onClick, silent: options.silent, hoverScale: 1.08,
    draw: (bx, by, bw, bh, hovered) => {
      drawCardBackground(bx, by, bw, bh, !!options.selected, hovered);
      const iconY = by + bh / 2 - 8;
      drawGlow(bx + bw / 2, iconY, bw * 0.45, '#ffffff', 0.12);
      drawIcon(bx + bw / 2, iconY);
      drawText(label, bx + bw / 2, by + bh - 12, options.labelSize ?? 13, TEXT.main, 'center', 800);
    },
  });
}

/** Rounded progress bar with a glowing fill. */
export function drawProgressBar(x: number, y: number, w: number, h: number, value: number, color: string): void {
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; roundRectPath(x, y, w, h, h / 2); ctx.fill();
  ctx.save();
  ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.fillStyle = color;
  roundRectPath(x, y, Math.max(h, w * value), h, h / 2); ctx.fill();
  ctx.restore();
}
