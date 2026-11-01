// Recognises magic signs drawn with the mouse/finger (a simplified "$1 recogniser").
// Both the drawing and each reference sign are resampled to the same number of points,
// centred and scaled to a unit box, then compared point by point.
import type { Vec2 } from '../core/math';
import { SIGN_SHAPES } from '../data/elements';
import type { ElementId } from '../data/types';

const SAMPLE_POINTS = 48;
/** Strokes smaller than this (in pixels) are ignored — probably a click, not a sign. */
const MIN_STROKE_SIZE = 40;
/** Average point distance → spell quality. Above the last threshold the sign is not recognised. */
const QUALITY_THRESHOLDS: [number, number][] = [[0.1, 1], [0.15, 0.8], [0.2, 0.55]];

/** Resamples an open polyline into `count` points spaced evenly along its length. */
function resampleStroke(points: Vec2[], count: number): Vec2[] {
  const path = points.map(p => [...p] as Vec2);
  let length = 0;
  for (let i = 1; i < path.length; i++) length += Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
  const step = length / (count - 1);
  let accumulated = 0;
  const result: Vec2[] = [[...path[0]]];
  for (let i = 1; i < path.length; i++) {
    const d = Math.hypot(path[i][0] - path[i - 1][0], path[i][1] - path[i - 1][1]);
    if (d > 0 && accumulated + d >= step) {
      const t = (step - accumulated) / d;
      const point: Vec2 = [path[i - 1][0] + t * (path[i][0] - path[i - 1][0]), path[i - 1][1] + t * (path[i][1] - path[i - 1][1])];
      result.push(point);
      path.splice(i, 0, point); // continue measuring from the new point
      accumulated = 0;
    } else accumulated += d;
  }
  while (result.length < count) result.push([...path[path.length - 1]]);
  return result.slice(0, count);
}

/** Moves the centroid to (0,0) and scales the bigger side of the bounding box to 1. */
function normalise(points: Vec2[]): Vec2[] {
  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity, sumX = 0, sumY = 0;
  for (const [x, y] of points) {
    minX = Math.min(minX, x); minY = Math.min(minY, y); maxX = Math.max(maxX, x); maxY = Math.max(maxY, y);
    sumX += x; sumY += y;
  }
  const centerX = sumX / points.length, centerY = sumY / points.length;
  const size = Math.max(maxX - minX, maxY - minY) || 1;
  return points.map(([x, y]) => [(x - centerX) / size, (y - centerY) / size]);
}

/**
 * Every sign (and its accepted alternatives) in both drawing directions; closed signs also from every
 * starting point, because the player can begin a circle or triangle anywhere.
 */
const TEMPLATES = (Object.keys(SIGN_SHAPES) as ElementId[]).map(element => {
  const sign = SIGN_SHAPES[element];
  const variants: Vec2[][] = [];
  for (const points of [sign.points, ...(sign.alternatives ?? [])]) {
    const outline = sign.closed ? [...points, points[0]] : points;
    const base = normalise(resampleStroke(outline, SAMPLE_POINTS));
    variants.push(base, base.slice().reverse());
    if (sign.closed) {
      const loop = base.slice(0, SAMPLE_POINTS - 1);
      for (let start = 2; start < SAMPLE_POINTS - 1; start += 2) {
        const rotated = [...loop.slice(start), ...loop.slice(0, start)];
        rotated.push(rotated[0]);
        variants.push(rotated, rotated.slice().reverse());
      }
    }
  }
  return { element, variants };
});

export interface SignMatch { element: ElementId; distance: number; quality: number }

/** Returns the closest of the `allowed` signs, or null for strokes that are too short. `quality` is 0 when nothing matched well. */
export function recognizeSign(stroke: Vec2[], allowed: readonly ElementId[]): SignMatch | null {
  if (stroke.length < 6) return null;
  const xs = stroke.map(p => p[0]), ys = stroke.map(p => p[1]);
  if (Math.max(Math.max(...xs) - Math.min(...xs), Math.max(...ys) - Math.min(...ys)) < MIN_STROKE_SIZE) return null;

  const drawn = normalise(resampleStroke(stroke, SAMPLE_POINTS));
  let best: SignMatch | null = null;
  for (const template of TEMPLATES) {
    if (!allowed.includes(template.element)) continue;
    for (const variant of template.variants) {
      let distance = 0;
      for (let i = 0; i < SAMPLE_POINTS; i++) distance += Math.hypot(drawn[i][0] - variant[i][0], drawn[i][1] - variant[i][1]);
      distance /= SAMPLE_POINTS;
      if (!best || distance < best.distance) best = { element: template.element, distance, quality: 0 };
    }
  }
  if (best) best.quality = QUALITY_THRESHOLDS.find(([limit]) => best!.distance < limit)?.[1] ?? 0;
  return best;
}
