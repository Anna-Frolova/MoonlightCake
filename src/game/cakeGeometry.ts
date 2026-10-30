// Cake shapes as top-down outlines, extruded into pseudo-3D prisms.
// "X" is left-right, "Z" is depth (positive = towards the viewer). On screen,
// depth is squashed by TOP_FACE_SQUASH so the top face looks like we see it from above.
import { clamp, lerp, type Vec2 } from '../core/math';
import type { ShapeId } from '../data/types';

export const TOP_FACE_SQUASH = 0.36;
export const LAYER_HEIGHT = 44;
export const FILLING_HEIGHT = 12;
/** Points around the rim used for drips, flames, piping and decorations. */
const RIM_POINT_COUNT = 44;

export interface Edge {
  from: Vec2; to: Vec2;
  /** Outward normal (unit length). normalZ > 0 means the side faces the viewer. */
  normalX: number; normalZ: number;
  /** Average depth, used to paint back faces before front faces. */
  depth: number;
}

export interface ShapeGeometry {
  outline: Vec2[];
  /** Side faces that are visible, sorted back to front. */
  frontEdges: Edge[];
  leftmost: Vec2;
  rightmost: Vec2;
  /** Evenly spaced points around the outline. */
  rim: Vec2[];
  /** Rim points on the front half. */
  frontRim: Vec2[];
}

/** Returns `count` points evenly spaced along a closed outline. */
export function resampleOutline(points: Vec2[], count: number): Vec2[] {
  const segmentLengths: number[] = [];
  let total = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    const length = Math.hypot(b[0] - a[0], b[1] - a[1]);
    segmentLengths.push(length);
    total += length;
  }
  const result: Vec2[] = [];
  let segment = 0, travelled = 0;
  for (let k = 0; k < count; k++) {
    const target = (k / count) * total;
    while (segment < points.length - 1 && travelled + segmentLengths[segment] < target) { travelled += segmentLengths[segment]; segment++; }
    const a = points[segment], b = points[(segment + 1) % points.length];
    const t = clamp((target - travelled) / (segmentLengths[segment] || 1), 0, 1);
    result.push([lerp(a[0], b[0], t), lerp(a[1], b[1], t)]);
  }
  return result;
}

function buildOutline(shape: ShapeId): Vec2[] {
  const points: Vec2[] = [];
  switch (shape) {
    case 'square': { // rounded square: four quarter-circle corners
      const half = 98, cornerRadius = 26, inner = half - cornerRadius;
      const corners: [number, number, number][] = [[inner, inner, 0], [-inner, inner, Math.PI / 2], [-inner, -inner, Math.PI], [inner, -inner, Math.PI * 1.5]];
      for (const [cx, cz, startAngle] of corners) {
        for (let k = 0; k <= 7; k++) {
          const angle = startAngle + (k / 7) * (Math.PI / 2);
          points.push([cx + Math.cos(angle) * cornerRadius, cz + Math.sin(angle) * cornerRadius]);
        }
      }
      break;
    }
    case 'heart': // classic parametric heart; the point faces the viewer
      for (let i = 0; i < 72; i++) {
        const t = (i / 72) * Math.PI * 2;
        const hx = 16 * Math.pow(Math.sin(t), 3);
        const hy = 13 * Math.cos(t) - 5 * Math.cos(2 * t) - 2 * Math.cos(3 * t) - Math.cos(4 * t);
        points.push([hx * 7.4, -(hy + 2.5) * 7.0]);
      }
      break;
    case 'star': // five points, one facing the viewer
      for (let i = 0; i < 10; i++) {
        const angle = Math.PI / 2 + (i * Math.PI) / 5;
        const radius = i % 2 ? 64 : 124;
        points.push([Math.cos(angle) * radius, Math.sin(angle) * radius]);
      }
      break;
    case 'round':
      for (let i = 0; i < 56; i++) {
        const angle = (i / 56) * Math.PI * 2;
        points.push([Math.cos(angle) * 114, Math.sin(angle) * 114]);
      }
      break;
  }
  return points;
}

const geometryCache = new Map<ShapeId, ShapeGeometry>();

export function getShapeGeometry(shape: ShapeId): ShapeGeometry {
  const cached = geometryCache.get(shape);
  if (cached) return cached;
  const outline = buildOutline(shape);

  // Work out whether the outline runs clockwise, so every normal can point outwards.
  const centerX = outline.reduce((sum, p) => sum + p[0], 0) / outline.length;
  const centerZ = outline.reduce((sum, p) => sum + p[1], 0) / outline.length;
  let orientation = 0;
  for (let i = 0; i < outline.length; i++) {
    const a = outline[i], b = outline[(i + 1) % outline.length];
    orientation += (b[1] - a[1]) * ((a[0] + b[0]) / 2 - centerX) - (b[0] - a[0]) * ((a[1] + b[1]) / 2 - centerZ);
  }
  const sign = orientation >= 0 ? 1 : -1;

  const edges: Edge[] = outline.map((from, i) => {
    const to = outline[(i + 1) % outline.length];
    const nx = (to[1] - from[1]) * sign, nz = -(to[0] - from[0]) * sign;
    const length = Math.hypot(nx, nz) || 1;
    return { from, to, normalX: nx / length, normalZ: nz / length, depth: (from[1] + to[1]) / 2 };
  });
  const frontEdges = edges.filter(e => e.normalZ > 0.02).sort((a, b) => a.depth - b.depth);
  const leftmost = outline.reduce((best, p) => (p[0] < best[0] ? p : best));
  const rightmost = outline.reduce((best, p) => (p[0] > best[0] ? p : best));
  const rim = resampleOutline(outline, RIM_POINT_COUNT);

  const geometry: ShapeGeometry = { outline, frontEdges, leftmost, rightmost, rim, frontRim: rim.filter(p => p[1] > -8) };
  geometryCache.set(shape, geometry);
  return geometry;
}

/**
 * Is the screen-space point (x, y), relative to the centre of the top face,
 * inside the top face scaled by `scale`? (Standard ray-casting test.)
 */
export function isInsideTopFace(geometry: ShapeGeometry, x: number, y: number, scale: number): boolean {
  const points = geometry.outline;
  let inside = false;
  for (let i = 0, j = points.length - 1; i < points.length; j = i++) {
    const xi = points[i][0] * scale, yi = points[i][1] * TOP_FACE_SQUASH * scale;
    const xj = points[j][0] * scale, yj = points[j][1] * TOP_FACE_SQUASH * scale;
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}
