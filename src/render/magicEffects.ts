// Animated elemental magic around an enchanted cake.
// Drawn in the cake's local space: (0,0) = bottom centre, `top` = y of the top face (negative).
import { ctx } from '../core/canvas';
import { clock } from '../core/clock';
import { drawGlow, ellipsePath, starPath } from '../core/draw';
import { clamp, lerp, seededRandom } from '../core/math';
import type { Cake } from '../data/types';
import { TOP_FACE_SQUASH as SQUASH, type ShapeGeometry } from '../game/cakeGeometry';

/** Seconds for the effect to grow in after casting. */
const GROW_IN_SPEED = 1.4;

function drawFlame(x: number, y: number, width: number, height: number): void {
  const g = ctx.createLinearGradient(0, y, 0, y - height);
  g.addColorStop(0, 'rgba(255,90,40,0.9)'); g.addColorStop(0.45, 'rgba(255,170,50,0.9)'); g.addColorStop(1, 'rgba(255,240,150,0)');
  ctx.fillStyle = g;
  ctx.beginPath(); ctx.moveTo(x - width, y);
  ctx.quadraticCurveTo(x - width * 1.1, y - height * 0.45, x, y - height); ctx.quadraticCurveTo(x + width * 1.1, y - height * 0.45, x + width, y);
  ctx.closePath(); ctx.fill();
  ctx.fillStyle = 'rgba(255,250,200,0.8)'; // bright core
  ctx.beginPath(); ctx.moveTo(x - width * 0.45, y);
  ctx.quadraticCurveTo(x - width * 0.5, y - height * 0.3, x, y - height * 0.55); ctx.quadraticCurveTo(x + width * 0.5, y - height * 0.3, x + width * 0.45, y);
  ctx.closePath(); ctx.fill();
}

/** Jagged line from (x1,y1) to (x2,y2); the same `random` seed gives the same zigzag. */
function lightningPath(x1: number, y1: number, x2: number, y2: number, random: () => number, jaggedness: number): void {
  const segments = 7;
  ctx.beginPath(); ctx.moveTo(x1, y1);
  for (let i = 1; i < segments; i++) {
    const t = i / segments;
    ctx.lineTo(lerp(x1, x2, t) + (random() - 0.5) * jaggedness, lerp(y1, y2, t) + (random() - 0.5) * jaggedness * 0.4);
  }
  ctx.lineTo(x2, y2);
}

export function drawMagicEffects(cake: Cake, geometry: ShapeGeometry, top: number, height: number): void {
  const t = clock.time;
  const quality = cake.magicQuality ?? 0;
  const intensity = 0.45 + 0.55 * quality;
  const grow = clamp((t - cake.magicCastTime) * GROW_IN_SPEED, 0, 1);
  ctx.save();
  switch (cake.element) {
    case 'fire': drawFire(geometry, top, t, quality, intensity, grow); break;
    case 'ice': drawIce(geometry, top, height, t, intensity, grow); break;
    case 'bolt': drawLightning(geometry, top, t, quality, grow); break;
    case 'nature': drawNature(geometry, top, height, t, intensity, grow); break;
    case 'dark': drawDarkMagic(top, height, t, quality, intensity, grow); break;
    case 'light': drawLightMagic(top, height, t, quality, intensity, grow); break;
    case 'blood': drawBloodMagic(geometry, top, height, t, quality, intensity, grow); break;
    case 'sakura': drawSakuraMagic(geometry, top, height, t, quality, intensity, grow); break;
    default: drawStarMagic(top, height, t, quality, grow); break;
  }
  ctx.restore();
}

/** Flames dancing along the top rim + embers drifting up. */
function drawFire(geometry: ShapeGeometry, top: number, t: number, quality: number, intensity: number, grow: number): void {
  ctx.globalCompositeOperation = 'lighter';
  const rimBackToFront = geometry.rim.slice().sort((a, b) => a[1] - b[1]);
  rimBackToFront.forEach(([x, z], i) => {
    if (i % 2) return;
    const flicker = 0.75 + 0.25 * Math.sin(t * 13 + i * 1.7);
    const flameHeight = (26 + 8 * Math.sin(t * 7 + i * 2.3) + 18 * quality) * flicker * grow;
    drawFlame(x * 0.95, top + z * SQUASH * 0.95, (6 + 4 * quality) * grow, flameHeight);
  });
  for (let k = 0; k < 12; k++) {
    const phase = (t * 0.55 + k * 0.083) % 1;
    const emberX = Math.sin(k * 12.9) * 105 + Math.sin(t * 2 + k) * 8, emberY = top - 10 - phase * 130;
    ctx.fillStyle = `rgba(255,${150 + k * 8},60,${(1 - phase) * intensity})`;
    ellipsePath(emberX, emberY, 2.5, 2.5); ctx.fill();
  }
}

/** Frosty sides, icicles along the front rim, a glowing frozen edge and drifting snowflakes. */
function drawIce(geometry: ShapeGeometry, top: number, height: number, t: number, intensity: number, grow: number): void {
  ctx.fillStyle = `rgba(210,245,255,${0.34 * intensity * grow})`;
  for (const edge of geometry.frontEdges) {
    ctx.beginPath();
    ctx.moveTo(edge.from[0], edge.from[1] * SQUASH); ctx.lineTo(edge.to[0], edge.to[1] * SQUASH);
    ctx.lineTo(edge.to[0], top + edge.to[1] * SQUASH); ctx.lineTo(edge.from[0], top + edge.from[1] * SQUASH);
    ctx.closePath(); ctx.fill();
  }
  geometry.frontRim.forEach(([x, z], i) => {
    const length = (18 + ((i * 37) % 18)) * grow;
    const px = x * 0.98, py = top + z * SQUASH + 6;
    const g = ctx.createLinearGradient(0, py, 0, py + length);
    g.addColorStop(0, 'rgba(220,248,255,1)'); g.addColorStop(1, 'rgba(70,170,255,0.85)');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(px - 5.5, py); ctx.lineTo(px + 5.5, py); ctx.lineTo(px, py + length); ctx.closePath(); ctx.fill();
  });
  ctx.save();
  ctx.shadowColor = '#8fe6ff'; ctx.shadowBlur = 16;
  ctx.beginPath(); geometry.outline.forEach(([x, z], i) => (i ? ctx.lineTo(x, top + z * SQUASH) : ctx.moveTo(x, top + z * SQUASH))); ctx.closePath();
  ctx.strokeStyle = `rgba(190,240,255,${0.85 * grow})`; ctx.lineWidth = 6; ctx.stroke();
  ctx.restore();
  ctx.strokeStyle = `rgba(230,250,255,${0.9 * intensity})`; ctx.lineWidth = 2.2;
  for (let k = 0; k < 12; k++) {
    const fx = Math.sin(k * 7.3) * 150 + Math.sin(t + k) * 10;
    const fy = top - 70 + ((t * 22 + k * 41) % (height + 150));
    const radius = 6 + (k % 3) * 2;
    drawGlow(fx, fy, radius * 2.4, '#bff2ff', 0.35);
    for (let arm = 0; arm < 3; arm++) {
      const angle = (arm * Math.PI) / 3 + t * 0.5;
      ctx.beginPath(); ctx.moveTo(fx - Math.cos(angle) * radius, fy - Math.sin(angle) * radius); ctx.lineTo(fx + Math.cos(angle) * radius, fy + Math.sin(angle) * radius); ctx.stroke();
    }
  }
}

/** Bolts striking the top (re-rolled several times a second) + sparks crawling along the rim. */
function drawLightning(geometry: ShapeGeometry, top: number, t: number, quality: number, grow: number): void {
  const frame = Math.floor(t * 9);
  const random = seededRandom(frame * 131 + 7);
  const isFlashing = random() < 0.55 + 0.3 * quality;
  ctx.globalCompositeOperation = 'lighter';
  if (isFlashing && grow > 0.2) {
    for (let bolt = 0; bolt < 2; bolt++) {
      const targetX = (random() - 0.5) * 180, targetY = top + (random() - 0.5) * 20;
      const startX = targetX + (random() - 0.5) * 120, startY = top - 150;
      const shapeSeed = frame * 131 + bolt * 17;
      lightningPath(startX, startY, targetX, targetY, seededRandom(shapeSeed), 46);
      ctx.strokeStyle = 'rgba(120,200,255,0.55)'; ctx.lineWidth = 9; ctx.stroke(); // outer glow
      lightningPath(startX, startY, targetX, targetY, seededRandom(shapeSeed), 46);
      ctx.strokeStyle = 'rgba(255,250,200,0.95)'; ctx.lineWidth = 2.5; ctx.stroke(); // bright core
    }
  }
  for (let k = 0; k < 5; k++) {
    const [x, z] = geometry.rim[(frame * 3 + k * 9) % geometry.rim.length];
    const y = top + z * SQUASH;
    lightningPath(x - 10, y, x + 10, y - 4, seededRandom(frame + k), 14);
    ctx.strokeStyle = 'rgba(255,240,120,0.9)'; ctx.lineWidth = 1.8; ctx.stroke();
  }
}

/** Vines with leaves climbing the front, flowers opening at the top, leaves drifting around. */
function drawNature(geometry: ShapeGeometry, top: number, height: number, t: number, intensity: number, grow: number): void {
  const frontLeftToRight = geometry.frontRim.slice().sort((a, b) => a[0] - b[0]);
  frontLeftToRight.forEach(([x, z], i) => {
    if (i % 3) return;
    const baseX = x, baseY = z * SQUASH, tipX = x + Math.sin(i) * 14, tipY = top + z * SQUASH + 6;
    const grownY = lerp(baseY, tipY, grow);
    ctx.strokeStyle = '#3fae5a'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(baseX, baseY); ctx.quadraticCurveTo(baseX + 16 * Math.sin(i + 1), (baseY + grownY) / 2, lerp(baseX, tipX, grow), grownY); ctx.stroke();
    for (let leaf = 1; leaf <= 3; leaf++) {
      const along = leaf / 4;
      if (along > grow) break;
      ctx.save();
      ctx.translate(lerp(baseX, tipX, along) + 8 * Math.sin(i + leaf), lerp(baseY, tipY, along));
      ctx.rotate((leaf % 2 ? 0.7 : -0.7) + Math.sin(t * 2 + leaf) * 0.1);
      ctx.fillStyle = leaf % 2 ? '#6be08a' : '#4cc870';
      ellipsePath(leaf % 2 ? 6 : -6, 0, 7, 3.5); ctx.fill();
      ctx.restore();
    }
    if (grow >= 1) { // flower at the tip
      for (let petal = 0; petal < 5; petal++) {
        const angle = (petal * Math.PI * 2) / 5 + t * 0.3;
        ellipsePath(tipX + Math.cos(angle) * 4, tipY - 2 + Math.sin(angle) * 4, 3.4, 3.4);
        ctx.fillStyle = i % 2 ? '#ffb3e6' : '#fff6a0'; ctx.fill();
      }
      ellipsePath(tipX, tipY - 2, 2.2, 2.2); ctx.fillStyle = '#ffcf3d'; ctx.fill();
    }
  });
  for (let k = 0; k < 7; k++) {
    const phase = (t * 0.25 + k / 7) % 1;
    ctx.save();
    ctx.globalAlpha = Math.sin(phase * Math.PI) * intensity;
    ctx.translate(Math.sin(k * 5.1 + t * 0.8) * 140, top - 80 + phase * (height + 140));
    ctx.rotate(t * 2 + k);
    ctx.fillStyle = '#7ef09a'; ellipsePath(0, 0, 6, 3); ctx.fill();
    ctx.restore();
  }
}

/** Stars orbiting the cake and a small crescent moon. */
function drawStarMagic(top: number, height: number, t: number, quality: number, grow: number): void {
  const starCount = Math.round(5 + quality * 8);
  for (let k = 0; k < starCount; k++) {
    const angle = t * 0.8 + (k * Math.PI * 2) / starCount;
    const sx = Math.cos(angle) * 150, sy = top / 2 + Math.sin(angle) * (height / 2 + 46) * 0.6;
    const twinkle = 0.5 + 0.5 * Math.sin(t * 5 + k * 2);
    drawGlow(sx, sy, 22, '#e8d4ff', 0.5 * twinkle);
    ctx.fillStyle = `rgba(255,240,200,${0.5 + twinkle * 0.5})`;
    starPath(sx, sy, (10 * twinkle + 5) * grow, 2.5, 4, t); ctx.fill();
  }
  const moonAngle = t * 0.5, moonX = Math.cos(moonAngle) * 120, moonY = top - 40 + Math.sin(moonAngle) * 18;
  drawGlow(moonX, moonY, 30, '#e8dcff', 0.6 * grow);
  ctx.fillStyle = '#fff6d8';
  ctx.beginPath(); ctx.arc(moonX, moonY, 10 * grow, 0, Math.PI * 2); ctx.arc(moonX + 4, moonY - 3, 8.5 * grow, 0, Math.PI * 2, true); ctx.fill('evenodd');
}

/** Dark smoke curling up around the cake, a violet vortex turning on the top and black orbs circling it. */
function drawDarkMagic(top: number, height: number, t: number, quality: number, intensity: number, grow: number): void {
  for (let k = 0; k < 12; k++) { // smoke puffs: grow and fade as they rise
    const phase = (t * 0.32 + k / 12) % 1;
    const x = Math.sin(k * 3.7 + t * 0.6) * 125 * (0.6 + phase * 0.5), y = top + 30 - phase * 170;
    const radius = (14 + phase * 28) * grow;
    ctx.fillStyle = `rgba(36,8,64,${(1 - phase) * 0.42 * intensity})`;
    ellipsePath(x, y, radius, radius * 0.8); ctx.fill();
  }
  ctx.save();
  ctx.translate(0, top); ctx.scale(1, SQUASH);
  ctx.shadowColor = '#b36bff'; ctx.shadowBlur = 12; ctx.lineWidth = 3.5;
  for (let arm = 0; arm < 3; arm++) {
    ctx.beginPath();
    for (let s = 0; s <= 28; s++) {
      const radius = (6 + s * 3.4) * grow, angle = t * 2.2 + (arm * Math.PI * 2) / 3 + s * 0.2;
      if (s) ctx.lineTo(Math.cos(angle) * radius, Math.sin(angle) * radius); else ctx.moveTo(Math.cos(angle) * radius, Math.sin(angle) * radius);
    }
    ctx.strokeStyle = `rgba(190,120,255,${0.7 * intensity})`; ctx.stroke();
  }
  ctx.restore();
  const orbCount = 3 + Math.round(quality * 3);
  for (let k = 0; k < orbCount; k++) {
    const angle = -t * 1.1 + (k * Math.PI * 2) / orbCount;
    const x = Math.cos(angle) * 150, y = top / 2 + Math.sin(angle) * (height / 2 + 40) * 0.55;
    drawGlow(x, y, 28, '#b36bff', 0.55 * grow);
    ellipsePath(x, y, 8 * grow, 8 * grow); ctx.fillStyle = '#1a0a2a'; ctx.fill();
    ctx.strokeStyle = '#d6a8ff'; ctx.lineWidth = 1.5; ctx.stroke();
  }
}

/** Beams of light falling on the cake, a golden halo floating over it, sparkles and drifting feathers. */
function drawLightMagic(top: number, height: number, t: number, quality: number, intensity: number, grow: number): void {
  ctx.save();
  ctx.globalCompositeOperation = 'lighter';
  for (let k = 0; k < 5; k++) { // god rays
    const sway = Math.sin(t * 0.7 + k * 1.9) * 18, x = (k - 2) * 46 + sway, width = 16 + (k % 2) * 10;
    const g = ctx.createLinearGradient(0, top - 280, 0, top + 20);
    g.addColorStop(0, 'rgba(255,245,200,0)'); g.addColorStop(1, `rgba(255,240,170,${(0.16 + 0.1 * Math.sin(t * 2 + k)) * intensity * grow})`);
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(x - width * 0.4, top - 280); ctx.lineTo(x + width * 0.4, top - 280); ctx.lineTo(x + width * 1.6, top + 20); ctx.lineTo(x - width * 1.6, top + 20); ctx.closePath(); ctx.fill();
  }
  ctx.restore();
  const haloY = top - 54 + Math.sin(t * 1.8) * 6;
  ctx.save();
  ctx.shadowColor = '#ffe98a'; ctx.shadowBlur = 20;
  ctx.strokeStyle = `rgba(255,226,120,${0.95 * grow})`; ctx.lineWidth = 7;
  ellipsePath(0, haloY, 74 * grow, 16 * grow); ctx.stroke();
  ctx.strokeStyle = `rgba(255,255,230,${0.9 * grow})`; ctx.lineWidth = 2.5; ctx.stroke();
  ctx.restore();
  const sparkleCount = Math.round(6 + quality * 8);
  for (let k = 0; k < sparkleCount; k++) {
    const twinkle = Math.max(0, Math.sin(t * 3 + k * 2.3));
    const x = Math.sin(k * 7.7) * 160, y = top - 40 + ((k * 53) % (height + 120));
    drawGlow(x, y, 16, '#fff6c8', 0.5 * twinkle);
    ctx.fillStyle = `rgba(255,252,225,${twinkle})`; starPath(x, y, 7 * twinkle * grow + 1, 1.6, 4, 0); ctx.fill();
  }
  for (let k = 0; k < 5; k++) { // feathers swing down like leaves
    const phase = (t * 0.18 + k / 5) % 1;
    ctx.save();
    ctx.globalAlpha = Math.sin(phase * Math.PI) * intensity;
    ctx.translate(Math.sin(k * 4.3) * 150 + Math.sin(t * 1.5 + k) * 22, top - 120 + phase * (height + 180));
    ctx.rotate(Math.sin(t * 1.5 + k) * 0.6);
    ctx.fillStyle = '#ffffff'; ellipsePath(0, 0, 4, 11); ctx.fill();
    ctx.strokeStyle = '#e8c860'; ctx.lineWidth = 1; ctx.beginPath(); ctx.moveTo(0, 12); ctx.lineTo(0, -10); ctx.stroke();
    ctx.restore();
  }
}

/** Crimson drips running down the front, a heartbeat glow and drops of blood circling the cake. */
function drawBloodMagic(geometry: ShapeGeometry, top: number, height: number, t: number, quality: number, intensity: number, grow: number): void {
  const beat = (t * 1.2) % 1, pulse = Math.max(Math.exp(-beat * 12), 0.7 * Math.exp(-Math.abs(beat - 0.22) * 14)); // lub-dub
  drawGlow(0, top - 10, 150 + pulse * 40, '#ff2a4a', (0.18 + pulse * 0.25) * intensity);
  geometry.frontRim.forEach(([x, z], i) => {
    if (i % 2) return;
    const length = (16 + ((i * 29) % 30) + Math.sin(t * 1.3 + i) * 4) * grow * Math.min(1, height / 60);
    const px = x * 0.98, py = top + z * SQUASH;
    const g = ctx.createLinearGradient(0, py, 0, py + length);
    g.addColorStop(0, '#c4102e'); g.addColorStop(1, '#8a0a20');
    ctx.fillStyle = g;
    ctx.beginPath(); ctx.moveTo(px - 4.5, py); ctx.lineTo(px + 4.5, py); ctx.lineTo(px + 3, py + length);
    ctx.arc(px, py + length, 3.6, 0, Math.PI); ctx.closePath(); ctx.fill();
    ellipsePath(px - 1.2, py + length - 1, 1.1, 1.6); ctx.fillStyle = 'rgba(255,200,210,0.7)'; ctx.fill();
  });
  const dropCount = 4 + Math.round(quality * 4);
  for (let k = 0; k < dropCount; k++) {
    const angle = t * 0.7 + (k * Math.PI * 2) / dropCount;
    const x = Math.cos(angle) * 145, y = top / 2 + Math.sin(angle) * (height / 2 + 44) * 0.55 + Math.sin(t * 2 + k) * 6;
    const size = (5 + pulse * 1.5) * grow;
    drawGlow(x, y, 18, '#ff3a5c', 0.4);
    ctx.fillStyle = '#d4183a';
    ctx.beginPath(); ctx.moveTo(x, y - size * 1.9); ctx.quadraticCurveTo(x + size * 1.1, y - size * 0.2, x, y + size); ctx.quadraticCurveTo(x - size * 1.1, y - size * 0.2, x, y - size * 1.9); ctx.fill();
    ellipsePath(x - size * 0.3, y - size * 0.1, size * 0.22, size * 0.35); ctx.fillStyle = 'rgba(255,220,225,0.8)'; ctx.fill();
  }
}

/** A sakura petal (about `size` px long) with the little notch at its tip, pointing up at rotation 0. */
export function drawSakuraPetal(x: number, y: number, size: number, rotation: number, alpha = 1): void {
  ctx.save(); ctx.translate(x, y); ctx.rotate(rotation); ctx.globalAlpha *= alpha;
  ctx.beginPath(); ctx.moveTo(0, size * 0.5);
  ctx.quadraticCurveTo(-size * 0.55, 0, -size * 0.2, -size * 0.5); ctx.lineTo(0, -size * 0.36);
  ctx.lineTo(size * 0.2, -size * 0.5); ctx.quadraticCurveTo(size * 0.55, 0, 0, size * 0.5); ctx.closePath();
  const g = ctx.createLinearGradient(0, size * 0.5, 0, -size * 0.5); g.addColorStop(0, '#ff8fb8'); g.addColorStop(1, '#ffe0ec');
  ctx.fillStyle = g; ctx.fill();
  ctx.restore();
}

/**
 * Sakura: a soft pink glow and petals drifting down around the cake in a gentle swirl; a few have settled
 * on the top face.
 */
function drawSakuraMagic(geometry: ShapeGeometry, top: number, height: number, t: number, quality: number, intensity: number, grow: number): void {
  drawGlow(0, top - 20, 190, '#ffb8d4', 0.25 * intensity * grow);
  const petals = Math.round(14 + quality * 14), fall = height + 260;
  for (let k = 0; k < petals; k++) {
    const random = seededRandom(k * 97 + 5), speed = 0.18 + random() * 0.12, phase = (t * speed + random()) % 1;
    const swirl = t * (0.8 + random() * 0.6) + k;
    const x = (random() - 0.5) * 300 + Math.sin(swirl) * 30, y = top - 200 + phase * fall;
    drawSakuraPetal(x, y, 9 + random() * 6, Math.sin(swirl * 1.3) * 1.2 + k, Math.sin(phase * Math.PI) * intensity * grow);
  }
  const random = seededRandom(31); // petals resting on the top face
  const settled = Math.round(4 + quality * 6);
  for (let k = 0; k < settled; k++) {
    const [rx, rz] = geometry.rim[Math.floor(random() * geometry.rim.length)], s = 0.25 + random() * 0.6;
    drawSakuraPetal(rx * s, top + rz * s * SQUASH, 10 * grow, random() * Math.PI * 2);
  }
}
