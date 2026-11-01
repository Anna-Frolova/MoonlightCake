// Cake decorations. Each is drawn around (0,0) = the point where it sits on the cake,
// about 20 px tall at scale 1.
import { ctx } from '../core/canvas';
import { shade, withAlpha } from '../core/color';
import { ellipsePath, roundRectPath, starPath } from '../core/draw';
import type { ToppingId } from '../data/types';

/** Glossy sphere (berries, pearls) with a soft outline in its own darker colour. */
function drawGlossyBall(x: number, y: number, radius: number, highlight: string, base: string, edge: string): void {
  const g = ctx.createRadialGradient(x - radius * 0.35, y - radius * 0.4, radius * 0.1, x, y, radius);
  g.addColorStop(0, highlight); g.addColorStop(0.55, base); g.addColorStop(1, edge);
  ellipsePath(x, y, radius, radius); ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = withAlpha(edge, 0.8); ctx.lineWidth = 1; ctx.stroke();
  ellipsePath(x - radius * 0.38, y - radius * 0.42, radius * 0.28, radius * 0.2); ctx.fillStyle = 'rgba(255,255,255,0.85)'; ctx.fill();
}

/** Almond-shaped leaf growing from (0,0) in the direction `rotation`. */
function drawLeaf(rotation: number, length: number, lightColor: string, darkColor: string): void {
  ctx.save(); ctx.rotate(rotation);
  ctx.beginPath(); ctx.moveTo(0, 0);
  ctx.quadraticCurveTo(length * 0.45, -length * 0.45, 0, -length);
  ctx.quadraticCurveTo(-length * 0.45, -length * 0.45, 0, 0); ctx.closePath();
  const g = ctx.createLinearGradient(-length * 0.4, 0, length * 0.4, 0); g.addColorStop(0, lightColor); g.addColorStop(1, darkColor);
  ctx.fillStyle = g; ctx.fill();
  ctx.strokeStyle = shade(darkColor, -0.3); ctx.lineWidth = 1; ctx.stroke();
  ctx.strokeStyle = 'rgba(255,255,255,0.55)'; ctx.beginPath(); ctx.moveTo(0, -1); ctx.lineTo(0, -length * 0.85); ctx.stroke(); // vein
  ctx.restore();
}

/** Piped buttercream rose: a base, an outer ring of six petals, an inner ring of four, a swirl. */
function drawRose(color: string): void {
  const edge = shade(color, -0.28);
  ellipsePath(0, -9, 11, 10); ctx.fillStyle = shade(color, -0.08); ctx.fill(); ctx.strokeStyle = edge; ctx.lineWidth = 1; ctx.stroke();
  const ring = (count: number, offset: number, radiusX: number, radiusY: number, petalW: number, petalH: number, centerY: number, fill: string) => {
    for (let k = 0; k < count; k++) {
      const angle = (k * Math.PI * 2) / count + offset;
      ctx.save(); ctx.translate(Math.cos(angle) * radiusX, centerY + Math.sin(angle) * radiusY); ctx.rotate(angle + Math.PI / 2);
      ellipsePath(0, 0, petalW, petalH); ctx.fillStyle = fill; ctx.fill(); ctx.strokeStyle = edge; ctx.stroke();
      ctx.restore();
    }
  };
  ring(6, 0.3, 6, 5.4, 6, 3.8, -9, color);
  ring(4, 1, 3, 2.6, 4, 2.6, -9.5, shade(color, 0.12));
  ctx.beginPath(); ctx.arc(0, -10, 2.6, 0, Math.PI * 1.6); ctx.strokeStyle = edge; ctx.lineWidth = 1.2; ctx.stroke();
  ellipsePath(-4, -14, 2.4, 1.4); ctx.fillStyle = 'rgba(255,255,255,0.6)'; ctx.fill();
}

export function drawTopping(topping: ToppingId, x: number, y: number, scale = 1): void {
  ctx.save();
  ctx.translate(x, y); ctx.scale(scale, scale);
  ctx.lineJoin = 'round'; ctx.lineCap = 'round';
  switch (topping) {
    case 'strawberry': {
      ctx.beginPath(); ctx.moveTo(0, 4);
      ctx.bezierCurveTo(-12, -2, -12, -16, -5, -17); ctx.quadraticCurveTo(0, -18.5, 5, -17); ctx.bezierCurveTo(12, -16, 12, -2, 0, 4);
      ctx.closePath();
      const g = ctx.createRadialGradient(-4, -12, 1, 0, -7, 15); g.addColorStop(0, '#ff8aa0'); g.addColorStop(0.5, '#ff3358'); g.addColorStop(1, '#c4143a');
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#a1102e'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#ffeaa8'; // seeds
      for (const [sx, sy] of [[-5, -11], [0, -12], [5, -11], [-6, -5], [-1, -6], [4, -5], [-2, 0], [2, -1]]) { ellipsePath(sx, sy, 0.9, 1.4); ctx.fill(); }
      ellipsePath(-5, -12, 2.2, 3); ctx.fillStyle = 'rgba(255,255,255,0.55)'; ctx.fill();
      ctx.translate(0, -17); // green calyx on top
      for (let k = 0; k < 5; k++) drawLeaf(-Math.PI / 2 + (k - 2) * 0.55, 7, '#7de88f', '#2fa04f');
      break;
    }
    case 'currant':
      ctx.strokeStyle = '#6a8a3a'; ctx.lineWidth = 1.4;
      ctx.beginPath(); ctx.moveTo(-3, -24); ctx.quadraticCurveTo(4, -20, 3, -14); ctx.moveTo(0, -21); ctx.lineTo(-4, -13); ctx.stroke();
      for (const [bx, by] of [[-5, -5], [3, -5], [-1, -11], [6, -13], [-6, -14]]) drawGlossyBall(bx, by, 4.8, '#ffc2c8', '#f0283f', '#9e0d22');
      break;
    case 'blueberry':
      drawGlossyBall(0, -8, 8.5, '#a9b8ff', '#4a5cc8', '#1f2a74');
      ellipsePath(2, -5, 6, 4); ctx.fillStyle = 'rgba(220,228,255,0.22)'; ctx.fill(); // dusty bloom
      ctx.fillStyle = '#1b2258'; starPath(0, -15.5, 3.4, 1.4, 5, -Math.PI / 2); ctx.fill(); // crown
      break;
    case 'raspberry': {
      const drupelets: [number, number][] = [];
      const perRow = [3, 4, 4, 3];
      perRow.forEach((count, row) => { for (let k = 0; k < count; k++) drupelets.push([(k - (count - 1) / 2) * 4.6, -3 - row * 4.6]); });
      drupelets.push([0, -20]);
      for (const [dx, dy] of drupelets) drawGlossyBall(dx, dy, 3.1, '#ffb3c8', '#ff3f76', '#b8164a');
      break;
    }
    case 'rosePink': drawRose('#ff8ab8'); break;
    case 'roseWhite': drawRose('#fff2e2'); break;
    case 'leaves':
      drawLeaf(-0.6, 17, '#9af0aa', '#2f9e57');
      drawLeaf(0.55, 15, '#9af0aa', '#3aae62');
      break;
    case 'pearl':
      drawGlossyBall(0, -6, 5.8, '#ffffff', '#f3ecff', '#b8acdc');
      ellipsePath(1.5, -4, 4, 2.2); ctx.fillStyle = 'rgba(170,225,255,0.25)'; ctx.fill(); // iridescence
      break;
    case 'goldPearl': drawGlossyBall(0, -6, 5.8, '#fffbe0', '#f4cc4f', '#a87a10'); break;
    case 'lavender':
      ctx.strokeStyle = '#4fa86a'; ctx.lineWidth = 1.6; ctx.beginPath(); ctx.moveTo(0, 0); ctx.quadraticCurveTo(2, -12, 0, -26); ctx.stroke();
      drawLeaf(-0.9, 8, '#9af0aa', '#3aae62'); drawLeaf(0.9, 8, '#9af0aa', '#3aae62');
      for (let k = 0; k < 6; k++) { // buds in pairs up the stem
        const budY = -11 - k * 3.1, spread = 2.6 - k * 0.25;
        for (const side of [-1, 1]) {
          ellipsePath(side * spread + Math.sin(k) * 0.5, budY, 2.4, 3.2);
          ctx.fillStyle = (k + (side > 0 ? 1 : 0)) % 2 ? '#a57cf2' : '#8556dc'; ctx.fill();
        }
      }
      ellipsePath(0, -29, 2, 2.8); ctx.fillStyle = '#b896ff'; ctx.fill();
      break;
    case 'chili': { // a curved glossy pepper with a little flame at the tip
      ctx.beginPath(); ctx.moveTo(-4, -18);
      ctx.bezierCurveTo(6, -20, 10, -10, 6, -2); ctx.quadraticCurveTo(2, 4, -8, 4);
      ctx.quadraticCurveTo(-2, 0, 0, -6); ctx.quadraticCurveTo(0, -12, -6, -14); ctx.closePath();
      const g = ctx.createLinearGradient(-6, -18, 8, 2); g.addColorStop(0, '#ff6a4a'); g.addColorStop(0.6, '#e8202a'); g.addColorStop(1, '#a00e1e');
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#7a0a16'; ctx.lineWidth = 1; ctx.stroke();
      ellipsePath(3, -12, 1.4, 3.5); ctx.fillStyle = 'rgba(255,230,220,0.7)'; ctx.fill();
      ctx.strokeStyle = '#3f9a3a'; ctx.lineWidth = 2.2; ctx.beginPath(); ctx.moveTo(-5, -17); ctx.quadraticCurveTo(-8, -22, -4, -25); ctx.stroke(); // stem
      ctx.fillStyle = '#5cc04a'; ellipsePath(-4, -18, 4, 2); ctx.fill();
      ctx.fillStyle = 'rgba(255,190,60,0.85)'; // tiny flame
      ctx.beginPath(); ctx.moveTo(-11, 4); ctx.quadraticCurveTo(-14, 0, -12, -4); ctx.quadraticCurveTo(-10, -1, -8, 1); ctx.closePath(); ctx.fill();
      break;
    }
    case 'feather': // a white feather with a golden quill, stuck into the cake at an angle
      ctx.rotate(0.35);
      ctx.beginPath(); ctx.moveTo(0, 0);
      ctx.bezierCurveTo(-9, -8, -8, -22, 0, -30); ctx.bezierCurveTo(8, -22, 9, -8, 0, 0); ctx.closePath();
      ctx.fillStyle = '#ffffff'; ctx.fill(); ctx.strokeStyle = '#c9c0e0'; ctx.lineWidth = 1; ctx.stroke();
      ctx.strokeStyle = '#e0e4f8'; ctx.lineWidth = 0.8; // barbs
      for (let k = 1; k < 6; k++) { const y = -k * 5; ctx.beginPath(); ctx.moveTo(-6 + k * 0.6, y + 2); ctx.lineTo(0, y - 1); ctx.lineTo(6 - k * 0.6, y + 2); ctx.stroke(); }
      ctx.strokeStyle = '#e8b84a'; ctx.lineWidth = 1.4; ctx.beginPath(); ctx.moveTo(0, 3); ctx.lineTo(0, -28); ctx.stroke();
      break;
    case 'bat': { // a chocolate bat with spread wings and little pink eyes
      const g = ctx.createLinearGradient(0, -22, 0, 0); g.addColorStop(0, '#7a4a30'); g.addColorStop(1, '#3e2214');
      ctx.fillStyle = g; ctx.strokeStyle = '#24120a'; ctx.lineWidth = 1;
      for (const side of [-1, 1]) {
        ctx.beginPath(); ctx.moveTo(side * 3, -12);
        ctx.quadraticCurveTo(side * 10, -22, side * 16, -18);
        ctx.quadraticCurveTo(side * 14, -12, side * 15, -8); ctx.quadraticCurveTo(side * 11, -10, side * 10, -6);
        ctx.quadraticCurveTo(side * 7, -9, side * 3, -6); ctx.closePath(); ctx.fill(); ctx.stroke();
      }
      ellipsePath(0, -10, 5, 6.5); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(-4, -14); ctx.lineTo(-3.5, -19); ctx.lineTo(-1, -15); ctx.moveTo(4, -14); ctx.lineTo(3.5, -19); ctx.lineTo(1, -15); ctx.fill(); // ears
      ctx.fillStyle = '#ff8fb0'; ellipsePath(-2, -11, 1.1, 1.1); ctx.fill(); ellipsePath(2, -11, 1.1, 1.1); ctx.fill();
      ellipsePath(-2, -14, 1.2, 0.8); ctx.fillStyle = 'rgba(255,230,200,0.45)'; ctx.fill(); // shine
      break;
    }
    case 'sushi': { // a tiny salmon nigiri: a block of rice, a striped slice of salmon, a strip of nori
      ctx.beginPath(); ctx.ellipse(0, -5, 12, 6, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fbf8f2'; ctx.fill(); ctx.strokeStyle = '#cfc8bc'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#e8e2d6'; for (const [gx, gy] of [[-6, -3], [-1, -2], [5, -3], [8, -6], [-9, -6]]) { ellipsePath(gx, gy, 1.6, 1); ctx.fill(); } // grains
      ctx.beginPath(); ctx.moveTo(-13, -8); ctx.quadraticCurveTo(-12, -16, 0, -15); ctx.quadraticCurveTo(12, -16, 14, -9); ctx.quadraticCurveTo(0, -6, -13, -8); ctx.closePath();
      const g = ctx.createLinearGradient(0, -16, 0, -7); g.addColorStop(0, '#ff9a6a'); g.addColorStop(1, '#ff6a3a');
      ctx.fillStyle = g; ctx.fill(); ctx.strokeStyle = '#d0502a'; ctx.stroke();
      ctx.strokeStyle = 'rgba(255,240,230,0.85)'; ctx.lineWidth = 1.2; // the salmon's white stripes
      for (const sx of [-7, -2, 3, 8]) { ctx.beginPath(); ctx.moveTo(sx - 1, -14); ctx.quadraticCurveTo(sx + 1, -11, sx, -8); ctx.stroke(); }
      ctx.fillStyle = '#24402a'; ctx.fillRect(-2.5, -15.5, 5, 13); // nori band
      break;
    }
    case 'candle': { // a little black candle with a violet flame and a wax drip
      ctx.fillStyle = '#2a2234'; roundRectPath(-4, -16, 8, 16, 2); ctx.fill(); ctx.strokeStyle = '#120c18'; ctx.lineWidth = 1; ctx.stroke();
      ctx.fillStyle = '#3e3450'; roundRectPath(-1, -16, 3, 7, 1.5); ctx.fill(); // drip
      ctx.strokeStyle = '#120c18'; ctx.beginPath(); ctx.moveTo(0, -16); ctx.lineTo(0, -19); ctx.stroke(); // wick
      ctx.fillStyle = 'rgba(192,140,255,0.4)'; ellipsePath(0, -23, 6, 8); ctx.fill(); // glow
      ctx.fillStyle = '#c08cff'; ctx.beginPath(); ctx.moveTo(0, -30); ctx.quadraticCurveTo(4, -22, 0, -19); ctx.quadraticCurveTo(-4, -22, 0, -30); ctx.fill();
      ctx.fillStyle = '#f2e8ff'; ellipsePath(0, -22, 1.4, 2.4); ctx.fill();
      break;
    }
    case 'butterfly': // pink upper wings, green lower wings, a dark body with antennae
      for (const side of [-1, 1]) {
        ctx.save(); ctx.scale(side, 1);
        ctx.fillStyle = '#ff9ccb'; ctx.beginPath(); ctx.ellipse(6, -16, 7, 9, -0.5, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#c0507e'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#7fd89a'; ctx.beginPath(); ctx.ellipse(5, -6, 5, 6, 0.4, 0, Math.PI * 2); ctx.fill(); ctx.strokeStyle = '#3f9a5a'; ctx.stroke();
        ctx.fillStyle = '#ffffff'; ellipsePath(7, -17, 1.8, 1.8); ctx.fill();
        ctx.restore();
      }
      ctx.fillStyle = '#3a2a40'; roundRectPath(-1.5, -20, 3, 16, 1.5); ctx.fill();
      ctx.strokeStyle = '#3a2a40'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, -20); ctx.quadraticCurveTo(-3, -26, -5, -27); ctx.moveTo(0, -20); ctx.quadraticCurveTo(3, -26, 5, -27); ctx.stroke();
      break;
  }
  ctx.restore();
}
