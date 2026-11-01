// Small UI pieces of the kitchen: progress bars and the ingredient shelf above the cake.
import { ctx } from '../core/canvas';
import { clock } from '../core/clock';
import { drawFittedText, drawGlow, roundRectPath } from '../core/draw';
import { TEXT } from '../core/theme';
import { pointer, springScale } from '../core/ui';
import { INGREDIENT_SHELF, type ShelfLayout } from './layout';

/** Rounded progress bar with a glowing fill. */
export function drawProgressBar(x: number, y: number, w: number, h: number, value: number, color: string): void {
  ctx.fillStyle = 'rgba(255,255,255,0.1)'; roundRectPath(x, y, w, h, h / 2); ctx.fill();
  ctx.save();
  ctx.shadowColor = color; ctx.shadowBlur = 10; ctx.fillStyle = color;
  roundRectPath(x, y, Math.max(h, w * value), h, h / 2); ctx.fill();
  ctx.restore();
}

// ---------------- ingredient shelves ----------------

const SHELF_WOOD = '#4a2c80';
const SHELF_HIGHLIGHT = '#6a46a8';
const LABEL_SHADOW = 'rgba(20,10,50,0.9)';

// Every function takes the shelf's layout; the default is the shelf above the cake (INGREDIENT_SHELF).

/** Distance between items when `count` of them share the shelf (narrower when many must fit). */
const shelfSpacing = (count: number, shelf: ShelfLayout): number => Math.min(shelf.spacing, shelf.maxWidth / Math.max(1, count));

/** Grab half-width of each item (items shrink with the spacing). */
export const shelfItemHalfWidth = (count: number, shelf: ShelfLayout = INGREDIENT_SHELF): number =>
  Math.min(shelf.itemHalfWidth, shelfSpacing(count, shelf) / 2);

/** X of each of `count` items on the shelf. */
export const shelfItemXs = (count: number, shelf: ShelfLayout = INGREDIENT_SHELF): number[] =>
  Array.from({ length: count }, (_, i) => shelf.centerX + (i - (count - 1) / 2) * shelfSpacing(count, shelf));

/** Area of the shelf with `count` items, names included (for highlighting it). */
export function ingredientShelfRect(count: number, shelf: ShelfLayout = INGREDIENT_SHELF): { x: number; y: number; w: number; h: number } {
  const w = count * shelfSpacing(count, shelf) + 20, { y, itemHeight, centerX } = shelf;
  return { x: centerX - w / 2, y: y - itemHeight, w, h: itemHeight + 40 };
}

/** Is the point on the item standing at `x` (or its name tag), one of `count` on the shelf? */
export const isOverShelfItem = (point: { x: number; y: number }, x: number, count: number, shelf: ShelfLayout = INGREDIENT_SHELF): boolean =>
  Math.abs(point.x - x) < shelfItemHalfWidth(count, shelf) && point.y > shelf.y - shelf.itemHeight && point.y < shelf.y + 36;

/**
 * Draws the shelf board and each item on it with a springy hover, plus its name underneath.
 * `drawItem` gets the item's base point; `lifted` items float a little (the selected cream).
 */
export function drawIngredientShelf<T extends string>(
  items: readonly T[], label: (item: T) => string, drawItem: (item: T, x: number, y: number, scale: number) => void,
  options: { isHoverable: boolean; lifted?: T | null; glowColor?: (item: T) => string; shelf?: ShelfLayout },
): void {
  const shelf = options.shelf ?? INGREDIENT_SHELF, { y, boardHeight, labelSize, itemScale, centerX } = shelf;
  const spacing = shelfSpacing(items.length, shelf), fit = spacing / shelf.spacing;
  const w = items.length * spacing + 20, left = centerX - w / 2;
  ctx.fillStyle = SHELF_WOOD; roundRectPath(left, y, w, boardHeight, boardHeight / 2); ctx.fill();
  ctx.fillStyle = SHELF_HIGHLIGHT; roundRectPath(left, y, w, boardHeight * 0.4, boardHeight * 0.2); ctx.fill();
  shelfItemXs(items.length, shelf).forEach((x, i) => {
    const item = items[i], isLifted = options.lifted === item;
    const hovered = options.isHoverable && isOverShelfItem(pointer, x, items.length, shelf);
    const scale = springScale('shelf_' + item, hovered ? 1.12 : isLifted ? 1.06 : 1);
    const bob = Math.sin(clock.time * 2 + i) * 1.5 - (isLifted ? 12 : 0);
    if (isLifted || hovered) drawGlow(x, y - shelf.itemHeight * 0.44, shelf.itemHeight * 0.64, options.glowColor?.(item) ?? '#ffffff', isLifted ? 0.5 : 0.3);
    drawItem(item, x, y + bob, scale * itemScale * fit);
    ctx.save(); // a dark halo (drawn twice to make it denser) keeps the names readable on the bright heaven kitchen too
    ctx.shadowColor = LABEL_SHADOW; ctx.shadowBlur = 5;
    for (let pass = 0; pass < 2; pass++) drawFittedText(label(item), x, y + boardHeight + 13, labelSize, spacing - 6, isLifted ? TEXT.label : TEXT.main, 'center', 900);
    ctx.restore();
  });
}
