// Draws a cake: stacked layers and fillings, piped cream, glaze with drips, toppings and magic.
import { ctx } from '../core/canvas';
import { clock } from '../core/clock';
import { rgbToHex, shade, withAlpha } from '../core/color';
import { drawGlow, ellipsePath, roundRectPath, starPath } from '../core/draw';
import { clamp, easeOutBack, easeOutCubic, lerp, seededRandom, type Vec2 } from '../core/math';
import { ELEMENTS } from '../data/elements';
import { CREAMS, FILLINGS, FLAVORS } from '../data/ingredients';
import type { Cake } from '../data/types';
import { cakeHeight, CREAM_FULL_COVERAGE } from '../game/cake';
import { FILLING_HEIGHT, getShapeGeometry, LAYER_HEIGHT, TOP_FACE_SQUASH as SQUASH, type ShapeGeometry } from '../game/cakeGeometry';
import { drawMagicEffects } from './magicEffects';
import { drawCreamPiece } from './creamPiping';
import { drawTopping } from './toppings';

/** A freshly added layer falls from this height. */
const LAYER_DROP_HEIGHT = 90;
/** Toppings look a bit bigger on the cake than in the tray. */
const TOPPING_SCALE_ON_CAKE = 1.25;
/** Light comes from the upper left: used to shade the side faces. */
const LIGHT_DIR = { x: -0.55, z: 0.83 };

/** Traces the outline at height `y`, optionally scaled around the centre. */
export function traceOutline(outline: Vec2[], y: number, scale = 1): void {
  ctx.beginPath();
  outline.forEach(([x, z], i) => {
    const px = x * scale, py = y + z * SQUASH * scale;
    if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py);
  });
  ctx.closePath();
}

/** An extruded slab of the cake shape from `bottomY` up by `height`, with shaded sides. */
export function drawPrism(geometry: ShapeGeometry, bottomY: number, height: number, color: string): void {
  for (const edge of geometry.frontEdges) {
    const light = LIGHT_DIR.x * edge.normalX + LIGHT_DIR.z * edge.normalZ;
    const brightness = Math.round((-0.3 + (0.32 * (light + 1)) / 2) * 50) / 50; // rounded so the shade cache stays small
    const faceColor = shade(color, brightness);
    ctx.beginPath();
    ctx.moveTo(edge.from[0], bottomY + edge.from[1] * SQUASH);
    ctx.lineTo(edge.to[0], bottomY + edge.to[1] * SQUASH);
    ctx.lineTo(edge.to[0], bottomY - height + edge.to[1] * SQUASH);
    ctx.lineTo(edge.from[0], bottomY - height + edge.from[1] * SQUASH);
    ctx.closePath();
    ctx.fillStyle = faceColor; ctx.fill();
    ctx.strokeStyle = faceColor; ctx.lineWidth = 1; ctx.stroke(); // hides hairline gaps between faces
  }
  // soft outline: bottom front edge + the two vertical silhouette lines
  ctx.strokeStyle = shade(color, -0.45); ctx.lineWidth = 2;
  ctx.beginPath();
  for (const edge of geometry.frontEdges) {
    ctx.moveTo(edge.from[0], bottomY + edge.from[1] * SQUASH);
    ctx.lineTo(edge.to[0], bottomY + edge.to[1] * SQUASH);
  }
  for (const [x, z] of [geometry.leftmost, geometry.rightmost]) {
    ctx.moveTo(x, bottomY + z * SQUASH); ctx.lineTo(x, bottomY - height + z * SQUASH);
  }
  ctx.stroke();
  traceOutline(geometry.outline, bottomY - height);
  ctx.fillStyle = shade(color, 0.16); ctx.fill(); ctx.stroke();
}

/**
 * Draws `cake` with its bottom centre at (x, y).
 * Coordinates inside are in the cake's local space: (0,0) = bottom centre, negative y = up.
 */
export function drawCake(cake: Cake, x: number, y: number, scale = 1): void {
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale);
  const geometry = getShapeGeometry(cake.shape);
  const random = seededRandom(cake.seed);
  const height = cakeHeight(cake), top = -height;

  if (cake.magicQuality && cake.stack.length) {
    const pulse = 0.75 + 0.25 * Math.sin(clock.time * 3);
    drawGlow(0, top / 2, 240, cake.element ? ELEMENTS[cake.element].color : '#ffe9a0', 0.45 * cake.magicQuality * pulse);
  }
  if (cake.stack.length) { traceOutline(geometry.outline, 8, 1.06); ctx.fillStyle = 'rgba(8,0,30,0.25)'; ctx.fill(); } // shadow

  let bottom = 0;
  for (const item of cake.stack) {
    const itemHeight = item.kind === 'layer' ? LAYER_HEIGHT : FILLING_HEIGHT;
    const drop = item.dropProgress;
    if (drop !== undefined && drop < 0) { bottom -= itemHeight; continue; } // waiting for its turn to fall
    const fallOffset = drop !== undefined && drop < 1 ? -(1 - easeOutCubic(drop)) * LAYER_DROP_HEIGHT : 0;
    const itemBottom = bottom + fallOffset;
    if (item.kind === 'layer') drawLayer(geometry, itemBottom, itemHeight, FLAVORS[item.flavor].color, !!FLAVORS[item.flavor].sparkles, random);
    else drawFilling(geometry, itemBottom, itemHeight, item.filling, random);
    bottom -= itemHeight;
  }
  if (!cake.stack.length) { ctx.restore(); return; }

  if (cake.cream && cake.creamDots) drawCreamBeads(cake, 'base');
  if (cake.glaze) drawGlaze(cake, geometry, top, height);
  if (cake.cream && cake.creamDots) drawCreamBeads(cake, 'top');
  const toppingsBackToFront = cake.toppings.slice().sort((a, b) => a.y - b.y);
  for (const placed of toppingsBackToFront) {
    const pop = placed.popProgress;
    const popScale = pop === undefined ? 1 : pop < 0 ? 0 : easeOutBack(pop);
    if (popScale > 0) drawTopping(placed.topping, placed.x, top + placed.y, popScale * TOPPING_SCALE_ON_CAKE);
  }
  if (cake.magicQuality) drawMagicEffects(cake, geometry, top, height);
  ctx.restore();
}

function drawLayer(geometry: ShapeGeometry, bottom: number, height: number, color: string, sparkles: boolean, random: () => number): void {
  drawPrism(geometry, bottom, height, color);
  // crumbs (or twinkling stars for the starry flavour) scattered on the front side
  for (let k = 0; k < 8; k++) {
    const edge = geometry.frontEdges[Math.floor(random() * geometry.frontEdges.length)];
    const along = random();
    const px = lerp(edge.from[0], edge.to[0], along);
    const py = bottom + lerp(edge.from[1], edge.to[1], along) * SQUASH - 7 - random() * (height - 16);
    if (sparkles) {
      const twinkle = 0.5 + 0.5 * Math.sin(clock.time * 4 + k);
      ctx.fillStyle = `rgba(255,250,200,${0.4 + 0.6 * twinkle})`; starPath(px, py, 4.5, 1.6, 4, 0); ctx.fill();
    } else {
      ctx.fillStyle = withAlpha(shade(color, 0.35), 0.7); ellipsePath(px, py, 2.4, 1.8); ctx.fill();
    }
  }
}

function drawFilling(geometry: ShapeGeometry, bottom: number, height: number, fillingId: keyof typeof FILLINGS, random: () => number): void {
  const filling = FILLINGS[fillingId];
  drawPrism(geometry, bottom, height, filling.color);
  ctx.fillStyle = filling.color; // small drips onto the layer below
  geometry.frontRim.forEach(([x, z], k) => {
    if (k % 2) return;
    const dripLength = 4 + random() * 9;
    roundRectPath(x - 4, bottom + z * SQUASH - 3, 8, dripLength + 3, 4); ctx.fill();
  });
  if (filling.glows) drawGlow(0, bottom - height, 140, '#9ff4ff', 0.25 + 0.1 * Math.sin(clock.time * 3));
}

/** Size of a cream piece while piping, and once the cream is fully piped. */
const CREAM_PIECE_SIZE = { piping: 9, full: 10 };

/** The piped cream (or the berry / chocolate border) along one edge, back pieces first; a bit plumper once fully piped. */
function drawCreamBeads(cake: Cake, ring: 'top' | 'base'): void {
  const cream = CREAMS[cake.cream!];
  const size = cake.creamCoverage >= CREAM_FULL_COVERAGE ? CREAM_PIECE_SIZE.full : CREAM_PIECE_SIZE.piping;
  const beads = cake.creamDots!.map((dot, index) => ({ dot, index })).filter(({ dot }) => dot.isPiped && dot.ring === ring)
    .sort((a, b) => a.dot.y - b.dot.y);
  for (const { dot, index } of beads) drawCreamPiece(cream.style, dot.x, dot.y, size, cream.color, index);
  const beadsOnly = beads.map(({ dot }) => dot);
  if (cream.glows) for (const bead of beadsOnly) drawGlow(bead.x, bead.y, 16, '#d8c8ff', 0.18 + 0.08 * Math.sin(clock.time * 3));
}

/** Glaze spreads from the centre of the top, then runs down in thin drips of uneven length. */
function drawGlaze(cake: Cake, geometry: ShapeGeometry, top: number, height: number): void {
  const color = rgbToHex(cake.glaze!);
  const progress = clamp(cake.glazeProgress, 0, 1);
  const random = seededRandom(cake.seed + 7);
  const spread = easeOutCubic(clamp(progress * 2.2, 0, 1));
  const highlight = shade(color, 0.45);
  const frontLeftToRight = geometry.frontRim.slice().sort((a, b) => a[0] - b[0]);
  const drips = frontLeftToRight.map(point => {
    const roll = random();
    const length = roll < 0.45 ? 2 + random() * 5          // ~half are short
      : roll < 0.8 ? 8 + random() * 9                        // some medium
      : 18 + random() * Math.min(32, height * 0.6);           // a few long ones
    return { point, length, width: 2.6 + random() * 3.2, jitterX: (random() - 0.5) * 5, startAt: 0.4 + random() * 0.3 };
  });

  if (spread >= 0.99) {
    // lip of glaze hugging the front edge, from which the drips hang
    ctx.strokeStyle = color; ctx.lineWidth = 6; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    ctx.beginPath();
    frontLeftToRight.forEach(([x, z], i) => { const px = x * 0.985, py = top + z * SQUASH * 0.985 + 1.5; if (i) ctx.lineTo(px, py); else ctx.moveTo(px, py); });
    ctx.stroke();
    for (const drip of drips) {
      const length = drip.length * easeOutCubic(clamp((progress - drip.startAt) / (1 - drip.startAt), 0, 1));
      if (length < 0.5) continue;
      const px = drip.point[0] * 0.985 + drip.jitterX, py = top + drip.point[1] * SQUASH * 0.985 + 2, w = drip.width;
      ctx.fillStyle = color;
      ctx.beginPath(); ctx.moveTo(px - w / 2 - 1.6, py - 3); // tapering stream
      ctx.quadraticCurveTo(px - w * 0.42, py + length * 0.55, px - w * 0.3, py + length);
      ctx.lineTo(px + w * 0.3, py + length);
      ctx.quadraticCurveTo(px + w * 0.42, py + length * 0.55, px + w / 2 + 1.6, py - 3);
      ctx.closePath(); ctx.fill();
      ellipsePath(px, py + length, w * 0.6, w * 0.7); ctx.fill(); // drop at the end
      if (length > 7) {
        ctx.strokeStyle = withAlpha(highlight, 0.55); ctx.lineWidth = 1.1;
        ctx.beginPath(); ctx.moveTo(px - w * 0.18, py + 1); ctx.lineTo(px - w * 0.14, py + length - 2); ctx.stroke();
      }
      ellipsePath(px - w * 0.2, py + length - w * 0.15, w * 0.18, w * 0.2); ctx.fillStyle = withAlpha(highlight, 0.7); ctx.fill();
    }
  }
  if (spread > 0.01) {
    traceOutline(geometry.outline, top, 0.985 * spread);
    ctx.fillStyle = color; ctx.fill(); ctx.strokeStyle = shade(color, -0.3); ctx.lineWidth = 1.4; ctx.stroke();
    ctx.save(); ctx.translate(-20 * spread, -4 * spread); // glossy reflection
    traceOutline(geometry.outline, top, 0.42 * spread); ctx.fillStyle = 'rgba(255,255,255,0.22)'; ctx.fill();
    ctx.restore();
  }
}
