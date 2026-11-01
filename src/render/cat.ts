// Soft, round, glossy cats. All coordinates are in the cat's local space:
// origin at the middle of the counter edge, 1 unit = 1 pixel at scale 1, y grows downwards.
import { ctx } from '../core/canvas';
import { hexToRgb, mixRgb, rgbToHex, shade, withAlpha } from '../core/color';
import { drawGlow, ellipsePath, heartPath, roundRectPath, starPath } from '../core/draw';
import type { CatLook, Mood } from '../data/types';

const EYE_DARK = '#21163a';
const BLUSH = 'rgba(255,120,170,0.42)';
const INNER_EAR = '#ffb0cf';
/** Rose and brooch of the gothic outfit. */
const GOTHIC_RED = '#d0213f';
/** Bluish light coming from the café's magic, painted on the right edge of the body and head. */
const RIM_LIGHT = 'rgba(150,210,255,0.45)';
const ANGER_RED = '#ff5f8f';

const BODY = { centerY: -46, radiusX: 82, radiusY: 88 };
const HEAD = { centerY: -150, radiusX: 74, radiusY: 60 };
const KITTEN_BODY_SCALE = 0.86;
const KITTEN_HEAD_LIFT = 0.9;
/** How far (px) the face moves and the eyes' light moves inside them when the cat looks fully to one side. */
const FACE_TURN = { x: 6, y: 4 };
const IRIS_SHIFT = 0.28;
/** Surprised eyes are this much bigger. */
const SURPRISED_EYE_SCALE = 1.14;

export interface Gaze { x: number; y: number }
const NO_GAZE: Gaze = { x: 0, y: 0 };

/** Soft outline: the fur colour mixed towards dark violet (no harsh black lines). */
export function catOutlineColor(look: CatLook): string {
  return rgbToHex(mixRgb(hexToRgb(look.fur), [40, 20, 90], 0.72));
}

/** Radial gradient that makes a shape look round and soft (light top-left, darker bottom-right). */
export function softGradient(x: number, y: number, radiusX: number, radiusY: number, color: string): CanvasGradient {
  const g = ctx.createRadialGradient(x - radiusX * 0.35, y - radiusY * 0.45, Math.min(radiusX, radiusY) * 0.1, x, y, Math.max(radiusX, radiusY) * 1.08);
  g.addColorStop(0, shade(color, 0.32));
  g.addColorStop(0.55, color);
  g.addColorStop(1, shade(color, -0.22));
  return g;
}

/**
 * Draws a whole cat standing behind the counter.
 * @param time   seconds, drives breathing, tail sway and blinking
 * @param gaze   where the cat looks, -1..1 on each axis (0,0 = straight at the player)
 */
export function drawCat(look: CatLook, x: number, y: number, scale: number, time: number, mood: Mood = 'neutral', gaze: Gaze = NO_GAZE): void {
  const outline = catOutlineColor(look);
  const bodyScale = look.isKitten ? KITTEN_BODY_SCALE : 1;
  const breathe = Math.sin(time * 2.2) * 2.2;
  const headY = HEAD.centerY * (look.isKitten ? KITTEN_HEAD_LIFT : 1) - breathe;

  ctx.save();
  ctx.translate(x, y);
  ctx.scale(scale, scale);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  drawBack(look, outline, time);
  drawTail(look, outline, time);
  drawBody(look, outline, bodyScale, breathe);
  drawEars(look, outline, headY);
  drawHead(look, outline, headY);
  // the face shifts a little towards where the cat looks, so the head seems to turn
  ctx.save(); ctx.translate(gaze.x * FACE_TURN.x, gaze.y * FACE_TURN.y);
  drawFace(look, outline, headY, time, mood, gaze);
  ctx.restore();
  drawHat(look, outline, headY, time);
  drawAccessory(look, outline, headY);
  ctx.restore();
}

function drawTail(look: CatLook, outline: string, time: number): void {
  const sway = Math.sin(time * 1.7) * 14;
  ctx.strokeStyle = outline; ctx.lineWidth = 25;
  ctx.beginPath(); ctx.moveTo(52, -10); ctx.bezierCurveTo(120, -20, 104 + sway, -110, 136 + sway, -142); ctx.stroke();
  ctx.strokeStyle = look.fur; ctx.lineWidth = 20; ctx.stroke();
  if (look.pattern === 'stripes' || look.pattern === 'points' || look.pattern === 'calico') {
    ctx.strokeStyle = look.pattern === 'calico' ? (look.furPatch ?? look.furAccent) : look.furAccent;
    ctx.beginPath(); ctx.moveTo(124 + sway * 0.9, -114); ctx.lineTo(136 + sway, -142); ctx.stroke();
  }
  if (look.hasSpadeTail) { // devil's spade at the tip
    ctx.save(); ctx.translate(138 + sway, -150); ctx.rotate(0.5 + sway * 0.01);
    ctx.beginPath(); ctx.moveTo(0, -24); ctx.quadraticCurveTo(18, -6, 12, 6); ctx.quadraticCurveTo(6, 10, 0, 4);
    ctx.quadraticCurveTo(-6, 10, -12, 6); ctx.quadraticCurveTo(-18, -6, 0, -24); ctx.closePath();
    ctx.fillStyle = look.furAccent; ctx.fill(); ctx.strokeStyle = outline; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.restore();
  }
}

/** Wings or a cape behind the cat; wings flap slowly. */
function drawBack(look: CatLook, outline: string, time: number): void {
  const flap = Math.sin(time * 2.4) * 0.07;
  ctx.save();
  ctx.strokeStyle = outline; ctx.lineWidth = 2.5;
  switch (look.back) {
    case 'featherWings':
      for (const side of [-1, 1]) {
        ctx.save(); ctx.translate(side * 46, -92); ctx.scale(side, 1); ctx.rotate(-flap);
        for (const [count, length, from, to, fill] of [[7, 118, -1.25, 0.45, '#ffffff'], [5, 70, -1.05, 0.25, '#fff6dc']] as const) {
          for (let i = 0; i < count; i++) { // a fan of feathers, longest at the top
            const angle = from + ((to - from) * i) / (count - 1), feather = length * (1 - i * 0.07);
            ctx.save(); ctx.rotate(angle);
            ellipsePath(feather / 2, 0, feather / 2, 15);
            ctx.fillStyle = softGradient(feather / 2, 0, feather / 2, 15, fill); ctx.fill();
            ctx.strokeStyle = '#d8cfe8'; ctx.lineWidth = 1.6; ctx.stroke();
            ctx.restore();
          }
        }
        ctx.restore();
      }
      drawGlow(0, -120, 170, '#fff6c8', 0.25);
      break;
    case 'batWings':
      for (const side of [-1, 1]) {
        ctx.save(); ctx.translate(side * 44, -88); ctx.scale(side, 1); ctx.rotate(-flap * 1.5);
        ctx.beginPath(); ctx.moveTo(0, 0);
        ctx.quadraticCurveTo(30, -70, 82, -78); ctx.lineTo(140, -64);
        ctx.quadraticCurveTo(122, -40, 126, -18); ctx.quadraticCurveTo(104, -28, 92, -6);
        ctx.quadraticCurveTo(72, -20, 56, 6); ctx.quadraticCurveTo(36, -6, 18, 22); ctx.closePath();
        const membrane = ctx.createLinearGradient(0, -80, 0, 20); membrane.addColorStop(0, '#7a2430'); membrane.addColorStop(1, '#3a1018');
        ctx.fillStyle = membrane; ctx.fill(); ctx.strokeStyle = outline; ctx.stroke();
        ctx.strokeStyle = 'rgba(30,6,12,0.7)'; ctx.lineWidth = 3; // finger bones
        ctx.beginPath();
        ctx.moveTo(82, -78); ctx.lineTo(126, -18); ctx.moveTo(82, -78); ctx.lineTo(92, -6); ctx.moveTo(82, -78); ctx.lineTo(56, 6);
        ctx.stroke();
        ctx.restore();
      }
      break;
    case 'cape': {
      const lining = '#a0142c';
      ctx.beginPath(); ctx.moveTo(-58, -112); ctx.quadraticCurveTo(-120, -20, -132, 52); ctx.lineTo(132, 52); ctx.quadraticCurveTo(120, -20, 58, -112); ctx.closePath();
      ctx.fillStyle = lining; ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-50, -112); ctx.quadraticCurveTo(-104, -20, -112, 52); ctx.lineTo(112, 52); ctx.quadraticCurveTo(104, -20, 50, -112); ctx.closePath();
      ctx.fillStyle = look.outfitColor; ctx.fill();
      for (const side of [-1, 1]) { // tall collar standing up behind the head
        ctx.beginPath(); ctx.moveTo(side * 26, -112); ctx.lineTo(side * 100, -206); ctx.quadraticCurveTo(side * 122, -160, side * 100, -118); ctx.lineTo(side * 60, -98); ctx.closePath();
        ctx.fillStyle = lining; ctx.fill(); ctx.strokeStyle = outline; ctx.stroke();
        ctx.strokeStyle = shade(lining, -0.35); ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(side * 40, -110); ctx.lineTo(side * 98, -190); ctx.stroke();
      }
      break;
    }
    default:
      break;
  }
  ctx.restore();
}

function drawBody(look: CatLook, outline: string, bodyScale: number, breathe: number): void {
  const rx = BODY.radiusX * bodyScale, ry = BODY.radiusY * bodyScale;
  ctx.save();
  ctx.translate(0, -breathe * 0.5);
  ellipsePath(0, BODY.centerY, rx, ry);
  ctx.fillStyle = softGradient(0, BODY.centerY, rx, ry, look.fur); ctx.fill();
  ctx.strokeStyle = outline; ctx.lineWidth = 2.5; ctx.stroke();
  if (look.pattern === 'bicolor' || look.pattern === 'calico') {
    ctx.save(); ellipsePath(0, BODY.centerY, rx, ry); ctx.clip();
    ellipsePath(0, -52, 38, 62); ctx.fillStyle = look.pattern === 'bicolor' ? look.furAccent : '#ffffff'; ctx.fill();
    ctx.restore();
  }
  drawOutfit(look, outline, bodyScale);
  // rim light
  ctx.save(); ellipsePath(0, BODY.centerY, rx, ry); ctx.clip();
  ctx.strokeStyle = RIM_LIGHT; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.ellipse(0, BODY.centerY, 80 * bodyScale, 86 * bodyScale, 0, -0.9, 0.35); ctx.stroke();
  ctx.restore();
  ctx.restore();
}

function drawEars(look: CatLook, outline: string, headY: number): void {
  const earColor = look.pattern === 'points' ? look.furAccent : look.fur;
  for (const side of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(side * 62, headY - 6);
    ctx.quadraticCurveTo(side * 58, headY - 60, side * 46, headY - 74);
    ctx.quadraticCurveTo(side * 26, headY - 62, side * 10, headY - 48);
    ctx.closePath();
    ctx.fillStyle = look.pattern === 'calico' && side === 1 ? (look.furPatch ?? earColor) : earColor; ctx.fill();
    ctx.strokeStyle = outline; ctx.lineWidth = 2.5; ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(side * 50, headY - 20);
    ctx.quadraticCurveTo(side * 48, headY - 52, side * 44, headY - 62);
    ctx.quadraticCurveTo(side * 30, headY - 54, side * 22, headY - 44);
    ctx.closePath();
    ctx.fillStyle = INNER_EAR; ctx.fill();
  }
}

function drawHead(look: CatLook, outline: string, headY: number): void {
  const { radiusX: rx, radiusY: ry } = HEAD;
  ellipsePath(0, headY, rx, ry);
  ctx.fillStyle = softGradient(0, headY, rx, ry, look.fur); ctx.fill();
  ctx.strokeStyle = outline; ctx.lineWidth = 2.5; ctx.stroke();

  ctx.save();
  ellipsePath(0, headY, rx, ry); ctx.clip();
  const accent = look.furAccent;
  switch (look.pattern) {
    case 'stripes': {
      ctx.strokeStyle = accent; ctx.lineWidth = 7;
      const stripes = [[-14, -58, -10, -36], [0, -61, 0, -34], [14, -58, 10, -36], [-74, -2, -52, 2], [-74, 13, -54, 13], [74, -2, 52, 2], [74, 13, 54, 13]];
      for (const [x1, y1, x2, y2] of stripes) { ctx.beginPath(); ctx.moveTo(x1, headY + y1); ctx.lineTo(x2, headY + y2); ctx.stroke(); }
      break;
    }
    case 'points': { // siamese: darker muzzle
      const g = ctx.createRadialGradient(0, headY + 16, 4, 0, headY + 16, 50);
      g.addColorStop(0, withAlpha(accent, 0.95)); g.addColorStop(1, withAlpha(accent, 0));
      ctx.fillStyle = g; ctx.fillRect(-76, headY - 56, 152, 120);
      break;
    }
    case 'calico':
      ellipsePath(-42, headY - 24, 36, 28); ctx.fillStyle = accent; ctx.fill();
      ellipsePath(48, headY - 32, 30, 24); ctx.fillStyle = look.furPatch ?? accent; ctx.fill();
      break;
    case 'bicolor':
      ellipsePath(0, headY + 28, 44, 32); ctx.fillStyle = accent; ctx.fill();
      ctx.beginPath(); ctx.moveTo(-9, headY + 12); ctx.lineTo(0, headY - 44); ctx.lineTo(9, headY + 12); ctx.fill();
      break;
  }
  ctx.strokeStyle = 'rgba(150,210,255,0.5)'; ctx.lineWidth = 7;
  ctx.beginPath(); ctx.ellipse(0, headY, 72, 58, 0, -0.95, 0.45); ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.35)'; ellipsePath(-30, headY - 34, 18, 9); ctx.fill(); // glossy highlight
  ctx.restore();
}

function drawFace(look: CatLook, outline: string, headY: number, time: number, mood: Mood, gaze: Gaze): void {
  ctx.fillStyle = BLUSH;
  ellipsePath(-46, headY + 20, 13, 8); ctx.fill();
  ellipsePath(46, headY + 20, 13, 8); ctx.fill();

  // each cat blinks at a slightly different moment
  const isBlinking = (time + look.id.length * 0.7) % 3.7 < 0.13;
  const eyeScale = (look.isKitten ? 1.15 : 1) * (mood === 'surprised' ? SURPRISED_EYE_SCALE : 1);
  for (const side of [-1, 1]) drawEye(look, outline, side * 28, headY + 2, side, eyeScale, mood, isBlinking && mood !== 'surprised', gaze);
  if (mood === 'surprised') { // eyebrows shot up
    ctx.strokeStyle = outline; ctx.lineWidth = 3;
    for (const side of [-1, 1]) { ctx.beginPath(); ctx.arc(side * 28, headY - 18, 12, Math.PI * 1.2, Math.PI * 1.8); ctx.stroke(); }
  }
  if (mood === 'sad') { // tear
    ctx.fillStyle = '#8fd8ff';
    ctx.beginPath(); ctx.moveTo(40, headY + 12); ctx.quadraticCurveTo(47, headY + 23, 40, headY + 27); ctx.quadraticCurveTo(33, headY + 23, 40, headY + 12); ctx.fill();
  }

  ctx.fillStyle = '#ff8fb8'; ellipsePath(0, headY + 14, 5.5, 4); ctx.fill(); // nose
  ctx.strokeStyle = EYE_DARK; ctx.lineWidth = 2.5; ctx.beginPath();
  if (mood === 'happy') {
    ctx.moveTo(-10, headY + 21); ctx.quadraticCurveTo(0, headY + 36, 10, headY + 21); ctx.closePath();
    ctx.fillStyle = '#e0507e'; ctx.fill(); ctx.stroke();
    ellipsePath(0, headY + 29, 5, 3); ctx.fillStyle = '#ff9cbc'; ctx.fill(); // tongue
  } else if (mood === 'sad' || mood === 'angry') {
    ctx.moveTo(-7, headY + 28); ctx.quadraticCurveTo(0, headY + 21, 7, headY + 28); ctx.stroke();
  } else if (mood === 'surprised') { // a little round "o"
    ellipsePath(0, headY + 27, 5, 6.5); ctx.fillStyle = '#c0406a'; ctx.fill(); ctx.stroke();
  } else { // cat "w" mouth
    ctx.moveTo(-9, headY + 21); ctx.quadraticCurveTo(-4.5, headY + 27, 0, headY + 21); ctx.quadraticCurveTo(4.5, headY + 27, 9, headY + 21); ctx.stroke();
  }

  ctx.strokeStyle = look.isDarkFur ? 'rgba(255,255,255,0.6)' : withAlpha(outline, 0.35); ctx.lineWidth = 1.6;
  for (const side of [-1, 1]) for (let i = 0; i < 2; i++) {
    ctx.beginPath(); ctx.moveTo(side * 36, headY + 16 + i * 7); ctx.lineTo(side * 76, headY + 10 + i * 12); ctx.stroke();
  }
}

/** Big glossy eye: dark oval, coloured lower half, two white highlights. */
function drawEye(look: CatLook, outline: string, x: number, y: number, side: number, eyeScale: number, mood: Mood, isBlinking: boolean, gaze: Gaze): void {
  const rx = 14 * eyeScale, ry = 17 * eyeScale;
  ctx.strokeStyle = EYE_DARK; ctx.lineWidth = 4.5;
  if (mood === 'happy') { ctx.beginPath(); ctx.arc(x, y + 6, 11 * eyeScale, Math.PI * 1.15, Math.PI * 1.85); ctx.stroke(); return; }
  if (isBlinking) { ctx.beginPath(); ctx.moveTo(x - 11, y + 3); ctx.quadraticCurveTo(x, y + 8, x + 11, y + 3); ctx.stroke(); return; }
  ellipsePath(x, y, rx, ry); ctx.fillStyle = EYE_DARK; ctx.fill();
  // the coloured part and the highlights slide inside the eye towards where the cat looks
  const lookX = x + gaze.x * rx * IRIS_SHIFT, lookY = y + gaze.y * ry * IRIS_SHIFT;
  ctx.save(); ellipsePath(x, y, rx, ry); ctx.clip();
  ellipsePath(lookX, lookY + ry * 0.8, rx * 1.1, ry * 0.62); ctx.fillStyle = withAlpha(look.eyeColor, 0.9); ctx.fill();
  ellipsePath(lookX - rx * 0.3, lookY - ry * 0.36, rx * 0.42, ry * 0.34); ctx.fillStyle = '#fff'; ctx.fill();
  ellipsePath(lookX + rx * 0.38, lookY + ry * 0.12, rx * 0.17, rx * 0.17); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
  ctx.restore();

  if (mood === 'sad' || mood === 'thinking' || mood === 'angry') { // eyelid drawn in fur colour over the top of the eye
    if (mood === 'angry') side = -side; // the lid slants the other way: inner corners down, a frown
    ctx.fillStyle = look.fur; ctx.beginPath();
    if (mood !== 'thinking') { ctx.moveTo(x - 17, y - 20); ctx.lineTo(x + 17, y - 20); ctx.lineTo(x + 17, y - 8 + side * 6); ctx.lineTo(x - 17, y - 8 - side * 6); }
    else ctx.rect(x - 17, y - 20, 34, 15);
    ctx.closePath(); ctx.fill();
    ctx.strokeStyle = outline; ctx.lineWidth = 2.5; ctx.beginPath();
    if (mood !== 'thinking') { ctx.moveTo(x - 14, y - 8 - side * 5); ctx.lineTo(x + 14, y - 8 + side * 5); }
    else { ctx.moveTo(x - 13, y - 5); ctx.lineTo(x + 13, y - 5); }
    ctx.stroke();
  }
}

function drawOutfit(look: CatLook, outline: string, bodyScale: number): void {
  const color = look.outfitColor;
  ctx.save();
  ellipsePath(0, BODY.centerY, BODY.radiusX * bodyScale, BODY.radiusY * bodyScale); ctx.clip();
  ctx.strokeStyle = outline; ctx.lineWidth = 2.5;
  /** Fabric with soft side-to-side shading, starting at the given neckline height. */
  const fillFabric = (fabric: string, topY = -84) => {
    const g = ctx.createLinearGradient(-90, 0, 90, 0);
    g.addColorStop(0, shade(fabric, 0.2)); g.addColorStop(0.6, fabric); g.addColorStop(1, shade(fabric, -0.2));
    ctx.fillStyle = g; ctx.fillRect(-95, topY, 190, 160);
  };
  switch (look.outfit) {
    case 'dress':
      fillFabric(color);
      ctx.fillStyle = '#fff'; for (let i = -3; i <= 3; i++) { ellipsePath(i * 15, -86, 10, 8); ctx.fill(); } // lace collar
      ctx.fillStyle = shade(color, 0.4);
      for (let i = 0; i < 12; i++) { heartPath(-60 + (i % 4) * 40 + (Math.floor(i / 4) % 2) * 20, -52 + Math.floor(i / 4) * 30, 10); ctx.fill(); }
      break;
    case 'vest':
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-95, -104, 190, 170);
      ctx.fillStyle = color;
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(side * 95, -104); ctx.lineTo(side * 22, -104); ctx.lineTo(side * 4, -22); ctx.lineTo(side * 4, 60); ctx.lineTo(side * 95, 60); ctx.fill(); ctx.stroke();
      }
      ctx.fillStyle = '#ffcf45'; for (const buttonY of [-40, -14, 12]) { ellipsePath(-14, buttonY, 4.5, 4.5); ctx.fill(); }
      ctx.fillStyle = '#ff4a6e'; ctx.beginPath(); // bow tie
      ctx.moveTo(0, -100); ctx.lineTo(-17, -110); ctx.lineTo(-17, -88); ctx.closePath();
      ctx.moveTo(0, -100); ctx.lineTo(17, -110); ctx.lineTo(17, -88); ctx.closePath();
      ctx.fill(); ctx.stroke();
      break;
    case 'cloak':
      fillFabric(color, -116);
      ctx.fillStyle = shade(color, -0.35); ctx.beginPath(); ctx.moveTo(-20, -108); ctx.lineTo(20, -108); ctx.lineTo(10, 60); ctx.lineTo(-10, 60); ctx.fill();
      ctx.fillStyle = '#ffe14a';
      starPath(-42, -40, 8, 3.2); ctx.fill(); starPath(46, -10, 6, 2.5); ctx.fill(); starPath(-30, 12, 5, 2); ctx.fill();
      drawGlow(-42, -40, 20, '#ffe14a', 0.3);
      ctx.fillStyle = '#ffcf45'; ellipsePath(0, -104, 9, 9); ctx.fill(); ctx.stroke(); // clasp
      break;
    case 'sailor':
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-95, -104, 190, 170);
      ctx.fillStyle = color; for (let i = 0; i < 5; i++) ctx.fillRect(-95, -62 + i * 24, 190, 11);
      ctx.beginPath(); ctx.moveTo(-74, -116); ctx.lineTo(74, -116); ctx.lineTo(42, -74); ctx.lineTo(0, -42); ctx.lineTo(-42, -74); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3; ctx.beginPath();
      ctx.moveTo(-60, -108); ctx.lineTo(-35, -76); ctx.lineTo(0, -50); ctx.lineTo(35, -76); ctx.lineTo(60, -108); ctx.stroke();
      ctx.fillStyle = '#ff4a5e'; ctx.beginPath(); ctx.moveTo(-10, -54); ctx.lineTo(10, -54); ctx.lineTo(4, -22); ctx.lineTo(-4, -22); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = outline; ctx.stroke();
      break;
    case 'raincoat':
      fillFabric(color, -104);
      ctx.strokeStyle = shade(color, -0.35); ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, -98); ctx.lineTo(0, 60); ctx.stroke();
      ctx.fillStyle = '#ffffff'; for (const toggleY of [-62, -32, -2]) { roundRectPath(-12, toggleY, 24, 7, 3); ctx.fill(); }
      ctx.fillStyle = shade(color, -0.12); ctx.beginPath();
      ctx.moveTo(-52, -110); ctx.lineTo(0, -84); ctx.lineTo(52, -110); ctx.lineTo(52, -96); ctx.lineTo(0, -70); ctx.lineTo(-52, -96); ctx.closePath(); ctx.fill();
      ctx.strokeStyle = outline; ctx.stroke();
      break;
    case 'robe':
      fillFabric(color, -116);
      ctx.fillStyle = '#ffd84a'; ctx.fillRect(-7, -104, 14, 170);
      ctx.fillStyle = '#e8e2ff'; for (let i = 0; i < 9; i++) { starPath(-58 + (i % 3) * 54 + (i % 2) * 8, -72 + Math.floor(i / 3) * 40, 5, 2); ctx.fill(); }
      ctx.fillStyle = '#ffd84a'; ctx.beginPath(); ctx.arc(48, -20, 8, 0, Math.PI * 2); ctx.arc(52, -23, 7, 0, Math.PI * 2, true); ctx.fill('evenodd'); // moon
      break;
    case 'apron':
      fillFabric(color, -104);
      ctx.fillStyle = '#ffffff'; for (let i = 0; i < 14; i++) { ellipsePath(-72 + (i % 5) * 36 + (Math.floor(i / 5) % 2) * 18, -82 + Math.floor(i / 5) * 32, 3.5, 3.5); ctx.fill(); }
      ctx.fillStyle = '#fffaf2'; roundRectPath(-42, -74, 84, 150, 16); ctx.fill(); ctx.stroke();
      roundRectPath(-20, -22, 40, 24, 6); ctx.stroke(); // pocket
      ctx.fillStyle = '#fffaf2'; ctx.fillRect(-74, -100, 12, 30); ctx.fillRect(62, -100, 12, 30);
      break;
    case 'gown':
      fillFabric(color, -104);
      ctx.fillStyle = shade(color, 0.4);
      for (let i = 0; i < 6; i++) { ctx.beginPath(); ctx.moveTo(-95 + i * 36, 60); ctx.quadraticCurveTo(-78 + i * 36, -40, -62 + i * 36, 60); ctx.fill(); }
      ctx.strokeStyle = '#eef2ff'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(-36, -104); ctx.quadraticCurveTo(0, -62, 36, -104); ctx.stroke(); // necklace
      ctx.fillStyle = '#fff6c8'; ctx.beginPath(); ctx.arc(0, -74, 9, 0, Math.PI * 2); ctx.arc(4, -77, 8, 0, Math.PI * 2, true); ctx.fill('evenodd');
      drawGlow(0, -74, 22, '#fff6c8', 0.4);
      break;
    case 'gothic':
      fillFabric(color, -104);
      ctx.fillStyle = shade(color, 0.22); // lace hem
      for (let i = -4; i <= 4; i++) { ellipsePath(i * 22, 40, 11, 7); ctx.fill(); }
      ctx.fillStyle = '#f4eefc'; // ruffled jabot
      for (let i = 0; i < 4; i++) { ellipsePath(0, -94 + i * 15, 22 - i * 3, 9); ctx.fill(); ctx.stroke(); }
      drawGlow(0, -102, 20, '#ff4a6e', 0.35);
      ctx.fillStyle = GOTHIC_RED; ellipsePath(0, -102, 8, 8); ctx.fill(); ctx.stroke(); // brooch
      break;
    case 'leafy':
      fillFabric(color, -104);
      ctx.fillStyle = shade(color, 0.3);
      for (let i = 0; i < 9; i++) { // leaves scattered over the tunic
        ctx.save();
        ctx.translate(-64 + (i % 3) * 62 + (Math.floor(i / 3) % 2) * 22, -64 + Math.floor(i / 3) * 34);
        ctx.rotate(0.6 + i * 0.9);
        ellipsePath(0, 0, 11, 5); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#6fbf5a'; roundRectPath(-64, -114, 128, 24, 12); ctx.fill(); ctx.stroke(); // moss scarf
      ctx.fillStyle = '#a0683a'; ellipsePath(0, -40, 7, 8); ctx.fill(); ctx.stroke(); // acorn button
      ctx.fillStyle = '#6e4626'; roundRectPath(-8, -50, 16, 7, 3); ctx.fill();
      break;
    case 'pajamas':
      fillFabric(color, -104);
      ctx.fillStyle = shade(color, 0.28);
      for (let i = 0; i < 9; i++) ctx.fillRect(-92 + i * 22, -104, 9, 170); // stripes
      ctx.fillStyle = '#fff1b0';
      starPath(-46, -50, 7, 3); ctx.fill(); starPath(44, -26, 6, 2.5); ctx.fill(); starPath(-30, 4, 5, 2); ctx.fill();
      ctx.fillStyle = shade(color, -0.15); // collar
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(0, -84); ctx.lineTo(side * 42, -110); ctx.lineTo(side * 34, -78); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = '#ffffff'; for (const buttonY of [-60, -32, -4]) { ellipsePath(0, buttonY, 5, 5); ctx.fill(); ctx.stroke(); }
      break;
    case 'demon':
      fillFabric(color, -104);
      for (let i = 0; i < 7; i++) { // flames licking up from the hem
        const flameX = -84 + i * 28, flameH = 52 + (i % 3) * 18;
        ctx.fillStyle = '#e8402a';
        ctx.beginPath(); ctx.moveTo(flameX - 16, 60); ctx.quadraticCurveTo(flameX - 14, 60 - flameH * 0.5, flameX, 60 - flameH); ctx.quadraticCurveTo(flameX + 14, 60 - flameH * 0.5, flameX + 16, 60); ctx.fill();
        ctx.fillStyle = '#ffb02e';
        ctx.beginPath(); ctx.moveTo(flameX - 8, 60); ctx.quadraticCurveTo(flameX - 7, 60 - flameH * 0.3, flameX, 60 - flameH * 0.55); ctx.quadraticCurveTo(flameX + 7, 60 - flameH * 0.3, flameX + 8, 60); ctx.fill();
      }
      ctx.fillStyle = shade(color, 0.25); ctx.beginPath(); ctx.moveTo(-40, -106); ctx.lineTo(0, -70); ctx.lineTo(40, -106); ctx.closePath(); ctx.fill(); ctx.stroke(); // collar
      drawGlow(0, -84, 24, '#ff6a2a', 0.5);
      ctx.fillStyle = '#ff6a2a'; ctx.beginPath(); ctx.moveTo(0, -94); ctx.lineTo(8, -84); ctx.lineTo(0, -74); ctx.lineTo(-8, -84); ctx.closePath(); ctx.fill(); ctx.stroke(); // amulet
      break;
    case 'angel':
      fillFabric(color, -110);
      ctx.strokeStyle = 'rgba(200,190,230,0.6)'; ctx.lineWidth = 2; // soft folds
      for (const foldX of [-48, -20, 24, 52]) { ctx.beginPath(); ctx.moveTo(foldX, -40); ctx.quadraticCurveTo(foldX + 6, 10, foldX - 2, 60); ctx.stroke(); }
      ctx.strokeStyle = '#e8b84a'; ctx.lineWidth = 6; // golden collar and belt
      ctx.beginPath(); ctx.moveTo(-44, -108); ctx.quadraticCurveTo(0, -78, 44, -108); ctx.stroke();
      ctx.lineWidth = 5; ctx.beginPath(); ctx.moveTo(-95, -12); ctx.quadraticCurveTo(0, 2, 95, -12); ctx.stroke();
      ctx.fillStyle = '#ffe98a'; starPath(0, -84, 9, 3.6); ctx.fill(); drawGlow(0, -84, 22, '#fff6c8', 0.6);
      break;
    case 'vampire':
      fillFabric(color, -104);
      ctx.fillStyle = '#f4eefc'; ctx.beginPath(); ctx.moveTo(-34, -106); ctx.lineTo(34, -106); ctx.lineTo(0, -24); ctx.closePath(); ctx.fill(); ctx.stroke(); // shirt
      ctx.fillStyle = shade(color, 0.18); // lapels
      for (const side of [-1, 1]) { ctx.beginPath(); ctx.moveTo(side * 34, -106); ctx.lineTo(side * 8, -40); ctx.lineTo(side * 22, -32); ctx.lineTo(side * 52, -96); ctx.closePath(); ctx.fill(); ctx.stroke(); }
      ctx.fillStyle = GOTHIC_RED; ctx.beginPath(); // cravat bow
      ctx.moveTo(0, -94); ctx.lineTo(-16, -104); ctx.lineTo(-16, -84); ctx.closePath();
      ctx.moveTo(0, -94); ctx.lineTo(16, -104); ctx.lineTo(16, -84); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = '#e8b84a'; ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(-24, -96); ctx.quadraticCurveTo(0, -46, 24, -96); ctx.stroke(); // medallion chain
      drawGlow(0, -58, 18, '#ff2a4a', 0.5);
      ctx.fillStyle = GOTHIC_RED; ellipsePath(0, -58, 8, 9); ctx.fill(); ctx.strokeStyle = '#e8b84a'; ctx.lineWidth = 2.5; ctx.stroke();
      break;
    case 'chef':
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-95, -104, 190, 170);
      ctx.fillStyle = '#ece6ff'; ctx.fillRect(-95, -104, 32, 170);
      ctx.fillStyle = '#b48cff'; for (const buttonY of [-52, -22, 8]) { ellipsePath(-15, buttonY, 5, 5); ctx.fill(); ellipsePath(15, buttonY, 5, 5); ctx.fill(); }
      ctx.fillStyle = '#8e6ff0'; ctx.beginPath(); ctx.moveTo(-30, -104); ctx.lineTo(30, -104); ctx.lineTo(0, -74); ctx.closePath(); ctx.fill(); ctx.stroke();
      break;
    case 'none':
      break;
  }
  ctx.restore();
}

function drawHat(look: CatLook, outline: string, headY: number, time: number): void {
  ctx.save();
  ctx.strokeStyle = outline; ctx.lineWidth = 2.5; ctx.lineJoin = 'round';
  const color = look.outfitColor;
  switch (look.hat) {
    case 'flowers': {
      const petalColors = ['#ff8fd0', '#ffffff', '#ffd84a', '#c9a0ff'];
      for (let i = 0; i < 7; i++) { // wreath along the top of the head
        const angle = Math.PI * (1.12 + i * 0.127);
        const fx = Math.cos(angle) * 66, fy = headY + Math.sin(angle) * 52;
        ctx.fillStyle = '#5ce07a'; ellipsePath(fx + 8, fy + 4, 8, 4); ctx.fill();
        for (let p = 0; p < 5; p++) {
          const petalAngle = (p * Math.PI * 2) / 5 + i;
          ellipsePath(fx + Math.cos(petalAngle) * 6.5, fy + Math.sin(petalAngle) * 6.5, 6.5, 6.5);
          ctx.fillStyle = petalColors[i % 4]; ctx.fill(); ctx.lineWidth = 1.4; ctx.stroke();
        }
        ellipsePath(fx, fy, 4, 4); ctx.fillStyle = '#ffa623'; ctx.fill();
      }
      break;
    }
    case 'tophat':
      ctx.translate(12, headY - 48); ctx.rotate(0.12);
      ellipsePath(0, 0, 58, 12); ctx.fillStyle = '#2c2448'; ctx.fill(); ctx.stroke();
      roundRectPath(-36, -78, 72, 78, 10); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ff4a6e'; ctx.fillRect(-35, -20, 70, 14);
      ctx.fillStyle = 'rgba(160,200,255,0.25)'; roundRectPath(-28, -72, 10, 50, 5); ctx.fill();
      break;
    case 'witch':
      ctx.translate(0, headY - 44);
      ellipsePath(0, 0, 98, 19); ctx.fillStyle = '#3d2266'; ctx.fill(); ctx.stroke();
      ctx.beginPath(); // bent cone
      ctx.moveTo(-48, -4); ctx.quadraticCurveTo(-24, -70, -6, -124); ctx.quadraticCurveTo(30, -154, 64, -132);
      ctx.quadraticCurveTo(28, -124, 22, -82); ctx.quadraticCurveTo(30, -40, 48, -4); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(-46, -6); ctx.lineTo(46, -6); ctx.lineTo(42, -23); ctx.lineTo(-40, -23); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffcf45'; roundRectPath(-9, -23, 18, 17, 3); ctx.fill(); ctx.stroke(); // buckle
      ctx.fillStyle = '#ffe14a'; starPath(4, -72, 7, 3); ctx.fill(); drawGlow(4, -72, 18, '#ffe14a', 0.4);
      break;
    case 'captain':
      ctx.translate(0, headY - 46);
      ctx.beginPath(); ctx.moveTo(-62, 2); ctx.quadraticCurveTo(-66, -38, 0, -44); ctx.quadraticCurveTo(66, -38, 62, 2); ctx.closePath();
      ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#25305a'; roundRectPath(-60, -6, 120, 15, 6); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 9, 48, 13, 0, 0, Math.PI); ctx.fillStyle = '#1b2246'; ctx.fill(); ctx.stroke(); // visor
      ctx.fillStyle = '#ffcf45'; ctx.beginPath(); ctx.arc(0, -22, 9, 0, Math.PI * 2); ctx.fill(); ctx.stroke(); // badge
      break;
    case 'souwester':
      ctx.translate(0, headY - 38);
      ctx.beginPath(); ctx.ellipse(0, 6, 98, 21, 0.06, 0, Math.PI * 2); ctx.fillStyle = shade(color, -0.08); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.ellipse(0, 0, 62, 44, 0, Math.PI, 0); ctx.closePath(); ctx.fillStyle = color; ctx.fill(); ctx.stroke();
      ctx.fillStyle = 'rgba(255,255,255,0.35)'; ellipsePath(-22, -24, 14, 7); ctx.fill();
      break;
    case 'wizard':
      ctx.translate(0, headY - 44);
      ellipsePath(0, 0, 92, 17); ctx.fillStyle = shade(color, -0.1); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-52, -2); ctx.quadraticCurveTo(-10, -60, -18, -154); ctx.quadraticCurveTo(22, -70, 52, -2); ctx.closePath();
      ctx.fillStyle = color; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#ffd84a'; starPath(-6, -62, 8, 3.5); ctx.fill(); starPath(18, -26, 6, 2.5); ctx.fill(); starPath(-26, -22, 5, 2); ctx.fill();
      drawGlow(-18, -154, 16, '#9feaff', 0.7); ctx.fillStyle = '#fff'; ellipsePath(-18, -154, 5, 5); ctx.fill();
      break;
    case 'kerchief':
      ctx.beginPath();
      ctx.moveTo(-72, headY - 6); ctx.quadraticCurveTo(-76, headY - 66, 0, headY - 64); ctx.quadraticCurveTo(76, headY - 66, 72, headY - 6);
      ctx.quadraticCurveTo(0, headY - 34, -72, headY - 6); ctx.closePath();
      ctx.fillStyle = color; ctx.fill(); ctx.stroke();
      ctx.save(); ctx.clip(); ctx.fillStyle = '#fff'; // polka dots
      for (let i = 0; i < 12; i++) { ellipsePath(-60 + (i % 6) * 24, headY - 52 + Math.floor(i / 6) * 16 + (i % 2) * 5, 3.5, 3.5); ctx.fill(); }
      ctx.restore();
      ctx.fillStyle = color; ctx.beginPath(); ctx.moveTo(68, headY - 10); ctx.lineTo(92, headY - 24); ctx.lineTo(88, headY + 2); ctx.closePath(); ctx.fill(); ctx.stroke(); // knot
      break;
    case 'crown': {
      ctx.translate(0, headY - 54);
      const gold = ctx.createLinearGradient(0, -40, 0, 6); gold.addColorStop(0, '#fff6b8'); gold.addColorStop(1, '#e8a92a');
      ctx.beginPath(); ctx.moveTo(-42, 4); ctx.lineTo(-46, -30); ctx.lineTo(-23, -12); ctx.lineTo(0, -42); ctx.lineTo(23, -12); ctx.lineTo(46, -30); ctx.lineTo(42, 4); ctx.closePath();
      ctx.fillStyle = gold; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#c08cff'; ellipsePath(0, -8, 6, 6); ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#7ff0ff'; ellipsePath(-27, -4, 4, 4); ctx.fill(); ellipsePath(27, -4, 4, 4); ctx.fill();
      drawGlow(0, -46, 20, '#ffffff', 0.5 + 0.3 * Math.sin(time * 4));
      break;
    }
    case 'gothic': // tiny tilted top hat with a veil and a red rose
      ctx.translate(30, headY - 50); ctx.rotate(0.24);
      ctx.fillStyle = 'rgba(20,12,30,0.4)';
      ctx.beginPath(); ctx.moveTo(-38, 2); ctx.quadraticCurveTo(-30, 28, -6, 30); ctx.quadraticCurveTo(24, 26, 36, 2); ctx.closePath(); ctx.fill();
      ctx.fillStyle = '#1a1424'; ellipsePath(0, 0, 40, 9); ctx.fill(); ctx.stroke();
      roundRectPath(-22, -44, 44, 44, 8); ctx.fill(); ctx.stroke();
      ctx.fillStyle = GOTHIC_RED; ctx.fillRect(-21, -14, 42, 8);
      ellipsePath(24, -8, 11, 10); ctx.fill(); ctx.stroke(); // rose
      ctx.strokeStyle = '#7a0f22'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.arc(24, -8, 5, 0, Math.PI * 1.6); ctx.stroke();
      break;
    case 'mushroom': { // red toadstool cap with white spots
      ctx.translate(0, headY - 40);
      ctx.beginPath(); ctx.ellipse(0, 0, 82, 56, 0, Math.PI, 0); ctx.quadraticCurveTo(0, 16, -82, 0); ctx.closePath();
      const cap = ctx.createLinearGradient(0, -56, 0, 10); cap.addColorStop(0, '#ff6a5a'); cap.addColorStop(1, '#d43a36');
      ctx.fillStyle = cap; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff6e8';
      for (const [spotX, spotY, radius] of [[-46, -20, 10], [-10, -40, 12], [30, -26, 10], [60, -8, 6], [-66, -4, 5], [6, -10, 6]]) {
        ellipsePath(spotX, spotY, radius, radius * 0.85); ctx.fill();
      }
      ctx.save(); ctx.translate(-30, -50); ctx.rotate(-0.6); // a leaf on top
      ctx.fillStyle = '#6be08a'; ellipsePath(0, 0, 14, 6); ctx.fill(); ctx.stroke();
      ctx.restore();
      break;
    }
    case 'beret': // with a feather and a heart pin
      ctx.translate(-10, headY - 46); ctx.rotate(-0.16);
      ctx.fillStyle = '#ffffff';
      ctx.beginPath(); ctx.moveTo(26, -10); ctx.quadraticCurveTo(52, -78, 104, -82); ctx.quadraticCurveTo(86, -30, 48, 6); ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(38, -2); ctx.quadraticCurveTo(66, -50, 100, -78); ctx.stroke(); // quill
      ellipsePath(0, 0, 72, 22); ctx.fillStyle = color; ctx.fill(); ctx.stroke();
      ctx.fillStyle = shade(color, -0.2); ctx.beginPath(); ctx.ellipse(0, 8, 58, 10, 0, 0, Math.PI); ctx.fill();
      ctx.beginPath(); ctx.moveTo(0, -21); ctx.lineTo(5, -32); ctx.stroke(); // stem
      ctx.fillStyle = '#ff6f9f'; heartPath(38, -2, 16); ctx.fill(); ctx.stroke();
      break;
    case 'nightcap': // floppy cap with stars and a pompom
      ctx.translate(0, headY - 42);
      ctx.beginPath();
      ctx.moveTo(-66, 4); ctx.quadraticCurveTo(-40, -72, 20, -84); ctx.quadraticCurveTo(84, -92, 98, -36);
      ctx.quadraticCurveTo(64, -56, 42, -40); ctx.quadraticCurveTo(62, -16, 66, 4); ctx.closePath();
      ctx.fillStyle = color; ctx.fill(); ctx.stroke();
      ctx.fillStyle = '#fff1b0';
      starPath(-24, -38, 7, 3); ctx.fill(); starPath(14, -60, 6, 2.5); ctx.fill(); starPath(30, -24, 5, 2); ctx.fill();
      ctx.fillStyle = '#ffffff'; roundRectPath(-70, -6, 140, 18, 9); ctx.fill(); ctx.stroke(); // fluffy brim
      ellipsePath(98, -34, 13, 13); ctx.fill(); ctx.stroke(); // pompom
      break;
    case 'horns': // curved little devil horns between the ears
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(side * 12, headY - 52);
        ctx.quadraticCurveTo(side * 14, headY - 92, side * 44, headY - 108);
        ctx.quadraticCurveTo(side * 32, headY - 86, side * 34, headY - 56); ctx.closePath();
        const horn = ctx.createLinearGradient(0, headY - 108, 0, headY - 50); horn.addColorStop(0, '#fff0d8'); horn.addColorStop(0.35, '#5a2a2a'); horn.addColorStop(1, '#2a1214');
        ctx.fillStyle = horn; ctx.fill(); ctx.stroke();
      }
      break;
    case 'halo': {
      const haloY = headY - 92 + Math.sin(time * 2) * 4;
      drawGlow(0, haloY, 70, '#fff6c8', 0.5);
      ctx.strokeStyle = '#e8b84a'; ctx.lineWidth = 9; ellipsePath(0, haloY, 48, 12); ctx.stroke();
      ctx.strokeStyle = '#fff6c8'; ctx.lineWidth = 3.5; ctx.stroke();
      break;
    }
    case 'vampire': { // slicked-back hair with a widow's peak
      const hair = look.furAccent;
      ctx.beginPath(); ctx.moveTo(-73, headY + 2);
      ctx.quadraticCurveTo(-78, headY - 64, 0, headY - 63); ctx.quadraticCurveTo(78, headY - 64, 73, headY + 2);
      ctx.quadraticCurveTo(52, headY - 38, 14, headY - 34); ctx.lineTo(0, headY - 18); ctx.lineTo(-14, headY - 34);
      ctx.quadraticCurveTo(-52, headY - 38, -73, headY + 2); ctx.closePath();
      ctx.fillStyle = softGradient(0, headY - 40, 70, 30, hair); ctx.fill(); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,0.28)'; ctx.lineWidth = 3; // shine
      ctx.beginPath(); ctx.moveTo(-40, headY - 44); ctx.quadraticCurveTo(-20, headY - 58, 10, headY - 56); ctx.stroke();
      break;
    }
    case 'chef':
      ctx.translate(0, headY - 50);
      ctx.fillStyle = '#ffffff'; roundRectPath(-46, -14, 92, 22, 8); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(-31, -30, 25, 0, Math.PI * 2); ctx.arc(0, -47, 31, 0, Math.PI * 2); ctx.arc(31, -30, 25, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-31, -30, 25, Math.PI * 0.75, Math.PI * 1.6); ctx.stroke();
      ctx.beginPath(); ctx.arc(0, -47, 31, Math.PI * 1.1, Math.PI * 1.9); ctx.stroke();
      ctx.beginPath(); ctx.arc(31, -30, 25, Math.PI * 1.4, Math.PI * 2.25); ctx.stroke();
      ctx.fillStyle = '#ffffff'; ctx.fillRect(-44, -16, 88, 6);
      break;
    case 'none':
      break;
  }
  ctx.restore();
}

function drawAccessory(look: CatLook, outline: string, headY: number): void {
  switch (look.accessory) {
    case 'monocle':
      ctx.strokeStyle = '#e8b93a'; ctx.lineWidth = 3.5; ellipsePath(28, headY + 2, 19, 19); ctx.stroke();
      ctx.fillStyle = 'rgba(200,230,255,0.15)'; ctx.fill();
      ctx.lineWidth = 1.5; ctx.beginPath(); ctx.moveTo(44, headY + 12); ctx.quadraticCurveTo(54, headY + 54, 32, headY + 84); ctx.stroke(); // chain
      break;
    case 'glasses':
      ctx.strokeStyle = '#7a5a3e'; ctx.lineWidth = 3.5; ctx.fillStyle = 'rgba(200,230,255,0.2)';
      ellipsePath(-28, headY + 2, 19, 18); ctx.fill(); ctx.stroke();
      ellipsePath(28, headY + 2, 19, 18); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-9, headY - 2); ctx.quadraticCurveTo(0, headY - 8, 9, headY - 2); ctx.stroke();
      break;
    case 'bow':
      ctx.save(); ctx.translate(40, headY - 42);
      ctx.fillStyle = look.outfitColor; ctx.strokeStyle = outline; ctx.lineWidth = 2.5;
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(side * 20, -18, side * 20, 0); ctx.quadraticCurveTo(side * 20, 18, 0, 0); ctx.fill(); ctx.stroke();
      }
      ellipsePath(0, 0, 6, 6); ctx.fill(); ctx.stroke();
      ctx.restore();
      break;
    case 'fangs': // two little fangs under the mouth
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = outline; ctx.lineWidth = 1.2;
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(side * 3.5, headY + 22.5); ctx.lineTo(side * 8.5, headY + 22); ctx.lineTo(side * 6.2, headY + 31); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      break;
    default:
      break;
  }
}

/** Pulsing comic anger mark (four bent strokes around a centre), drawn beside an angry cat's head. */
export function drawAngerMark(x: number, y: number, scale: number, time: number): void {
  const pulse = scale * (1 + 0.17 * Math.sin(time * 8));
  ctx.save(); ctx.translate(x, y); ctx.scale(pulse, pulse);
  ctx.strokeStyle = ANGER_RED; ctx.lineWidth = 3.5; ctx.lineCap = 'round';
  for (const [dx, dy] of [[-1, -1], [1, -1], [-1, 1], [1, 1]]) {
    ctx.beginPath(); ctx.moveTo(dx * 3, dy * 9); ctx.quadraticCurveTo(dx * 3, dy * 3, dx * 9, dy * 3); ctx.stroke();
  }
  ctx.restore();
}

/** Two paws resting on the counter, drawn after the counter so they overlap it. */
export function drawPaws(look: CatLook, x: number, y: number, scale: number): void {
  const color = look.pattern === 'points' || look.pattern === 'bicolor' ? look.furAccent : look.fur;
  const outline = catOutlineColor(look);
  for (const side of [-1, 1]) {
    const pawX = x + side * 50 * scale;
    ellipsePath(pawX, y, 22 * scale, 12 * scale);
    ctx.fillStyle = softGradient(pawX, y, 22 * scale, 12 * scale, color); ctx.fill();
    ctx.strokeStyle = outline; ctx.lineWidth = 2.5 * scale; ctx.stroke();
    ctx.fillStyle = INNER_EAR; // toe beans
    ellipsePath(pawX - 7 * scale, y + 3 * scale, 3 * scale, 2.5 * scale); ctx.fill();
    ellipsePath(pawX, y + 4 * scale, 3 * scale, 2.5 * scale); ctx.fill();
    ellipsePath(pawX + 7 * scale, y + 3 * scale, 3 * scale, 2.5 * scale); ctx.fill();
  }
}
