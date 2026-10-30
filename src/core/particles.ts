// Short-lived effect particles (sparkles, hearts, coins, floating text) and ambient magic motes.
import { ctx, SCREEN_H, SCREEN_W } from './canvas';
import { clock } from './clock';
import { withAlpha } from './color';
import { drawCoin, drawHeart, ellipsePath, font, starPath } from './draw';
import { clamp, pickRandom, randomRange } from './math';

export type ParticleKind = 'dot' | 'star' | 'heart' | 'coin' | 'text';

interface Particle {
  x: number; y: number;
  vx: number; vy: number;
  gravity: number;
  life: number; maxLife: number;
  size: number;
  color: string;
  kind: ParticleKind;
  rotation: number; spin: number;
  text?: string;
}

const MAX_PARTICLES = 320;
const particles: Particle[] = [];

export function emitParticle(partial: Partial<Particle>): void {
  if (particles.length > MAX_PARTICLES) particles.shift();
  particles.push({
    x: 0, y: 0, vx: 0, vy: 0, gravity: 0, life: 1, maxLife: 1, size: 4, color: '#fff', kind: 'dot', rotation: 0, spin: 0,
    ...partial,
  });
}

export interface BurstOptions {
  kind?: ParticleKind;
  gravity?: number;
  /** Extra upward speed. */
  lift?: number;
  minSpeed?: number; maxSpeed?: number;
  minSize?: number; maxSize?: number;
}

/** Emits `count` particles flying out from a point in random directions. */
export function burst(x: number, y: number, count: number, colors: string | string[], options: BurstOptions = {}): void {
  for (let i = 0; i < count; i++) {
    const angle = randomRange(0, Math.PI * 2);
    const speed = randomRange(options.minSpeed ?? 60, options.maxSpeed ?? 220);
    emitParticle({
      x, y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed - (options.lift ?? 0),
      gravity: options.gravity ?? 300,
      life: randomRange(0.5, 0.9), maxLife: 0.9,
      size: randomRange(options.minSize ?? 3, options.maxSize ?? 6),
      color: Array.isArray(colors) ? pickRandom(colors) : colors,
      kind: options.kind ?? 'dot',
      spin: randomRange(-6, 6),
    });
  }
}

export function floatingText(x: number, y: number, text: string, color = '#ffe27a', size = 26): void {
  emitParticle({ x, y, vy: -60, life: 1.4, maxLife: 1.4, kind: 'text', text, color, size });
}

export function updateParticles(dt: number): void {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.life -= dt;
    if (p.life <= 0) { particles.splice(i, 1); continue; }
    p.vy += p.gravity * dt;
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    p.rotation += p.spin * dt;
  }
}

export function drawParticles(): void {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = clamp(p.life / p.maxLife, 0, 1);
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rotation);
    switch (p.kind) {
      case 'dot': ellipsePath(0, 0, p.size, p.size); ctx.fillStyle = p.color; ctx.fill(); break;
      case 'star': starPath(0, 0, p.size * 1.4, p.size * 0.5, 4, 0); ctx.fillStyle = p.color; ctx.fill(); break;
      case 'heart': ctx.rotate(-p.rotation); drawHeart(0, 0, p.size * 2.2, p.color, 'plain'); break;
      case 'coin': drawCoin(0, 0, p.size); break;
      case 'text':
        ctx.rotate(-p.rotation);
        ctx.shadowColor = withAlpha(p.color, 0.9); ctx.shadowBlur = 14;
        ctx.lineWidth = 6; ctx.strokeStyle = 'rgba(30,16,70,0.85)';
        ctx.font = font(p.size, 900); ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.strokeText(p.text ?? '', 0, 0);
        ctx.fillStyle = p.color; ctx.fillText(p.text ?? '', 0, 0);
        break;
    }
    ctx.restore();
  }
}

// ---------------- ambient motes: slow glowing specks drifting upwards ----------------
interface Mote { x: number; y: number; vx: number; vy: number; life: number; maxLife: number; phase: number; size: number; color: string }
const motes: Mote[] = [];
const MOTE_COLORS = ['#9feaff', '#c9a6ff', '#ffb3f0', '#fff3b0', '#9feaff'];

export function updateMotes(dt: number): void {
  if (motes.length < 50 && Math.random() < dt * 12) {
    const life = randomRange(4, 8);
    motes.push({
      x: randomRange(0, SCREEN_W), y: randomRange(120, SCREEN_H), vx: randomRange(-8, 8), vy: randomRange(-24, -8),
      life, maxLife: life, phase: randomRange(0, 6), size: randomRange(1.5, 3.2), color: pickRandom(MOTE_COLORS),
    });
  }
  for (let i = motes.length - 1; i >= 0; i--) {
    const m = motes[i];
    m.life -= dt;
    if (m.life <= 0) { motes.splice(i, 1); continue; }
    m.x += (m.vx + Math.sin(clock.time * 1.3 + m.phase) * 10) * dt;
    m.y += m.vy * dt;
  }
}

export function drawMotes(): void {
  for (const m of motes) {
    const alpha = Math.sin(Math.PI * (1 - m.life / m.maxLife)) * 0.85;
    ctx.fillStyle = m.color;
    ctx.globalAlpha = alpha * 0.25; ellipsePath(m.x, m.y, m.size * 3.2, m.size * 3.2); ctx.fill();
    ctx.globalAlpha = alpha; ellipsePath(m.x, m.y, m.size, m.size); ctx.fill();
  }
  ctx.globalAlpha = 1;
}
