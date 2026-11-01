// Small UI pieces of the kitchen: tool cards and progress bars in the left panel, the ingredient shelf above the cake.
import { ctx } from '../core/canvas';
import { clock } from '../core/clock';
import { drawFittedText, drawGlow, roundRectPath } from '../core/draw';
import { TEXT } from '../core/theme';
import { button, pointer, springScale } from '../core/ui';
import { INGREDIENT_SHELF } from './layout';

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

/** Caption size on tool cards (shrinks to fit narrow cards). */
const TOOL_LABEL_SIZE = 15;

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
      drawFittedText(label, bx + bw / 2, by + bh - 12, options.labelSize ?? TOOL_LABEL_SIZE, bw - 6, TEXT.main, 'center', 800);
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

// ---------------- ingredient shelf above the cake ----------------

const SHELF_WOOD = '#4a2c80';
const SHELF_HIGHLIGHT = '#6a46a8';

/** Distance between items when `count` of them share the shelf (narrower when many must fit). */
const shelfSpacing = (count: number): number => Math.min(INGREDIENT_SHELF.spacing, INGREDIENT_SHELF.maxWidth / Math.max(1, count));

/** Grab half-width of each item (items shrink with the spacing). */
export const shelfItemHalfWidth = (count: number): number => Math.min(INGREDIENT_SHELF.itemHalfWidth, shelfSpacing(count) / 2);

/** X of each of `count` items on the ingredient shelf. */
export const shelfItemXs = (count: number): number[] =>
  Array.from({ length: count }, (_, i) => INGREDIENT_SHELF.centerX + (i - (count - 1) / 2) * shelfSpacing(count));

/** Area of the shelf with `count` items, names included (for highlighting it). */
export function ingredientShelfRect(count: number): { x: number; y: number; w: number; h: number } {
  const w = count * shelfSpacing(count) + 20, { y, itemHeight, centerX } = INGREDIENT_SHELF;
  return { x: centerX - w / 2, y: y - itemHeight, w, h: itemHeight + 40 };
}

/** Is the point on the item standing at `x` (or its name tag), one of `count` on the shelf? */
export const isOverShelfItem = (point: { x: number; y: number }, x: number, count: number): boolean =>
  Math.abs(point.x - x) < shelfItemHalfWidth(count)
  && point.y > INGREDIENT_SHELF.y - INGREDIENT_SHELF.itemHeight && point.y < INGREDIENT_SHELF.y + 36;

/**
 * Draws the shelf board and each item on it with a springy hover, plus its name underneath.
 * `drawItem` gets the item's base point; `lifted` items float a little (the selected cream).
 */
export function drawIngredientShelf<T extends string>(
  items: readonly T[], label: (item: T) => string, drawItem: (item: T, x: number, y: number, scale: number) => void,
  options: { isHoverable: boolean; lifted?: T | null; glowColor?: (item: T) => string },
): void {
  const { y, boardHeight, labelSize, itemScale, centerX } = INGREDIENT_SHELF;
  const spacing = shelfSpacing(items.length), fit = spacing / INGREDIENT_SHELF.spacing;
  const w = items.length * spacing + 20, left = centerX - w / 2;
  ctx.fillStyle = SHELF_WOOD; roundRectPath(left, y, w, boardHeight, boardHeight / 2); ctx.fill();
  ctx.fillStyle = SHELF_HIGHLIGHT; roundRectPath(left, y, w, boardHeight * 0.4, boardHeight * 0.2); ctx.fill();
  shelfItemXs(items.length).forEach((x, i) => {
    const item = items[i], isLifted = options.lifted === item;
    const hovered = options.isHoverable && isOverShelfItem(pointer, x, items.length);
    const scale = springScale('shelf_' + item, hovered ? 1.12 : isLifted ? 1.06 : 1);
    const bob = Math.sin(clock.time * 2 + i) * 1.5 - (isLifted ? 12 : 0);
    if (isLifted || hovered) drawGlow(x, y - 44, 64, options.glowColor?.(item) ?? '#ffffff', isLifted ? 0.5 : 0.3);
    drawItem(item, x, y + bob, scale * itemScale * fit);
    drawFittedText(label(item), x, y + boardHeight + 13, labelSize, spacing - 6, isLifted ? TEXT.label : TEXT.main, 'center', 900);
  });
}
