// Station 5: enchant the cake by drawing an element's sign on it in one stroke.
import { sfx } from '../../audio/sfx';
import { ctx } from '../../core/canvas';
import { clock } from '../../core/clock';
import { shade, withAlpha } from '../../core/color';
import { drawFittedText, drawGlow, roundRectPath } from '../../core/draw';
import { loc } from '../../core/language';
import { pickRandom, randomRange, type Point, type Vec2 } from '../../core/math';
import { burst, emitParticle, floatingText } from '../../core/particles';
import { TEXT } from '../../core/theme';
import { ELEMENT_ORDER, ELEMENTS, GUEST_ELEMENTS } from '../../data/elements';
import { t } from '../../data/strings';
import type { ElementId } from '../../data/types';
import { cakeHeight, countLayers } from '../../game/cake';
import { recognizeSign } from '../../game/signRecognition';
import { progress, runtime } from '../../game/state';
import { drawMagicCircle } from '../../render/environment';
import { drawSign } from '../../render/signs';
import { showToast } from '../../scenes/sceneManager';
import { cakeTopY, currentCake, currentOrder, requireLayer } from '../kitchen';
import { CAKE_BASE_Y, CAKE_CENTER_X, ELEMENT_ROW, MAGIC_DRAW_AREA } from '../layout';
import type { Station } from './station';

const STROKE_COLOR = '#9feaff';
const FAILED_STROKE_COLOR = '#ff7f9f';
const STROKE_WIDTH = 9;
const STROKE_FADE_SECONDS = 0.7;
/** New stroke points are added only after the pointer moved this far. */
const MIN_POINT_SPACING = 4;
const SCRIBBLE_SOUND_INTERVAL = 0.07;

/** The elements on the station: the everyday ones, plus the special guest's own magic while they wait. */
function shownElements(): ElementId[] {
  const wanted = currentOrder().element;
  return GUEST_ELEMENTS.includes(wanted) ? [...ELEMENT_ORDER, wanted] : ELEMENT_ORDER;
}

const qualityWord = (quality: number): string => quality >= 1 ? t().qualityPerfect : quality >= 0.8 ? t().qualityGreat : t().qualityOk;

/** Puts the element's magic on the cake with the given quality (0..1). */
function castMagic(element: ElementId, quality: number): void {
  const cake = currentCake(), top = cakeTopY(cake), def = ELEMENTS[element];
  cake.magicQuality = quality;
  cake.element = element;
  cake.magicCastTime = clock.time;
  sfx.magic(element);
  burst(CAKE_CENTER_X, top, 26 + quality * 20, [def.color, '#ffffff', shade(def.color, 0.4)],
    { kind: 'star', gravity: element === 'fire' ? -120 : 40, maxSpeed: 300 });
  floatingText(CAKE_CENTER_X, top - 70, t().castShout(loc(def.name), qualityWord(quality)), shade(def.color, 0.3), 30);
  if (element === 'bolt' || quality >= 1) runtime.shake = 0.25;
}

function finishStroke(): void {
  const points = runtime.magicStroke!.points;
  runtime.magicStroke = null;
  const match = recognizeSign(points, shownElements());
  const recognized = match && match.quality > 0 ? match : null;
  runtime.fadingStroke = { points, startTime: clock.time, color: recognized ? ELEMENTS[recognized.element].color : FAILED_STROKE_COLOR };
  if (points.length < 4) return; // just a tap
  if (!recognized) {
    showToast(t().signNotRecognized);
    sfx.fail();
    const [lastX, lastY] = points[points.length - 1];
    burst(lastX, lastY, 10, '#8a7aa8', { gravity: -30 });
    return;
  }
  const def = ELEMENTS[recognized.element];
  if (def.unlockDay > progress.day) {
    showToast(t().elementLocked(loc(def.name), def.unlockDay));
    sfx.fail();
    return;
  }
  castMagic(recognized.element, recognized.quality);
}

function drawStrokePath(points: Vec2[], color: string, alpha: number, width: number): void {
  if (points.length < 2) return;
  ctx.save();
  ctx.globalAlpha = alpha; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  ctx.shadowColor = color; ctx.shadowBlur = 22; ctx.strokeStyle = color; ctx.lineWidth = width;
  ctx.beginPath();
  for (const [x, y] of points) ctx.lineTo(x, y);
  ctx.stroke();
  ctx.shadowBlur = 0; ctx.strokeStyle = '#ffffff'; ctx.lineWidth = width * 0.35; ctx.stroke(); // white core
  ctx.restore();
}

/** The stroke being drawn, and the last one fading out in the colour of its result. */
export function drawMagicStrokes(): void {
  if (runtime.magicStroke) drawStrokePath(runtime.magicStroke.points, STROKE_COLOR, 1, STROKE_WIDTH);
  const fading = runtime.fadingStroke;
  if (fading) {
    const k = (clock.time - fading.startTime) / STROKE_FADE_SECONDS;
    if (k >= 1) runtime.fadingStroke = null;
    else drawStrokePath(fading.points, fading.color, 1 - k, STROKE_WIDTH + k * 10);
  }
}

/** Rune circle behind the cake while this station is open. */
export function drawMagicStationCircle(): void {
  const cake = currentCake();
  if (runtime.station !== 4 || !countLayers(cake)) return;
  ctx.save();
  ctx.globalAlpha = 0.5 + 0.2 * Math.sin(clock.time * 2);
  drawMagicCircle(CAKE_CENTER_X, CAKE_BASE_Y - cakeHeight(cake) / 2, 200, clock.time * 3, 0.35);
  ctx.restore();
}

export const magicStation: Station = {
  get name() { return t().stations.magic; },
  helper: 'magic',
  isDone: cake => cake.magicQuality !== null,

  /** The elements in a row above the cake: each sign with its name; the one the guest wants glows. */
  drawScenery() {
    const order = currentOrder(), time = clock.time, { y, w, h, gap } = ELEMENT_ROW, elements = shownElements();
    const left = CAKE_CENTER_X - (elements.length * w + (elements.length - 1) * gap) / 2;
    elements.forEach((element, i) => {
      const def = ELEMENTS[element], isOpen = def.unlockDay <= progress.day, isWanted = order.element === element;
      const x = left + i * (w + gap), centerX = x + w / 2;
      ctx.save();
      if (isWanted) { ctx.shadowColor = def.color; ctx.shadowBlur = 16 + 8 * Math.sin(time * 4); }
      const fill = ctx.createLinearGradient(0, y, 0, y + h);
      fill.addColorStop(0, isWanted ? '#5a44a8' : '#3d2e86'); fill.addColorStop(1, isWanted ? '#3a2a80' : '#281d62');
      ctx.fillStyle = fill; roundRectPath(x, y, w, h, 16); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.strokeStyle = isWanted ? withAlpha(def.color, 0.9) : 'rgba(200,180,255,0.2)'; ctx.lineWidth = isWanted ? 2.5 : 1.2; ctx.stroke();
      ctx.globalAlpha = isOpen ? 1 : 0.35;
      drawGlow(centerX, y + 32, 34, def.color, isWanted ? 0.45 : 0.25);
      drawSign(element, centerX, y + 32, 38, def.color, 3);
      drawFittedText(isOpen ? loc(def.name) : t().lockedDay(def.unlockDay), centerX, y + h - 14, 17, w - 10, isOpen ? TEXT.main : TEXT.muted, 'center', 900);
      ctx.restore();
    });
  },

  /** The crystal ball casts the ordered element perfectly. */
  autoComplete() {
    if (!requireLayer()) return;
    castMagic(currentOrder().element, 1);
  },

  onPointerDown(point, cake) {
    if (point.x <= MAGIC_DRAW_AREA.left || point.y <= MAGIC_DRAW_AREA.top || point.y >= MAGIC_DRAW_AREA.bottom) return false;
    if (!countLayers(cake)) { showToast(t().needLayerFirst); return true; }
    runtime.magicStroke = { points: [[point.x, point.y]], lastSoundTime: 0 };
    runtime.fadingStroke = null;
    return true;
  },
  onPointerMove(point: Point) {
    const stroke = runtime.magicStroke;
    if (!stroke) return;
    const [lastX, lastY] = stroke.points[stroke.points.length - 1];
    if (Math.hypot(point.x - lastX, point.y - lastY) <= MIN_POINT_SPACING) return;
    stroke.points.push([point.x, point.y]);
    if (clock.time - stroke.lastSoundTime > SCRIBBLE_SOUND_INTERVAL) { sfx.scribble(); stroke.lastSoundTime = clock.time; }
    if (Math.random() < 0.5) {
      emitParticle({
        x: point.x, y: point.y, vx: randomRange(-30, 30), vy: randomRange(-40, 10), life: 0.6, maxLife: 0.6,
        size: randomRange(2, 4), color: pickRandom(['#bff6ff', '#ffffff', '#d6b6ff']), kind: 'star',
      });
    }
  },
  onPointerUp() {
    if (runtime.magicStroke) finishStroke();
  },
};
