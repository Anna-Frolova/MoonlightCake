// Low-level drawing helpers on top of the 2D canvas API.
import { ctx } from './canvas';
import { clock } from './clock';
import { shade, withAlpha } from './color';
import { clamp, easeOutBack } from './math';
import { FONT_FAMILY, TEXT, TITLE_FONT_FAMILY } from './theme';

// ---------------- paths ----------------

export function roundRectPath(x: number, y: number, w: number, h: number, radius: number): void {
  const r = Math.max(0, Math.min(radius, w / 2, h / 2));
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

export function ellipsePath(x: number, y: number, radiusX: number, radiusY: number): void {
  ctx.beginPath();
  ctx.ellipse(x, y, Math.max(0.1, radiusX), Math.max(0.1, radiusY), 0, 0, Math.PI * 2);
}

export function starPath(x: number, y: number, outerRadius: number, innerRadius: number, points = 5, rotation = -Math.PI / 2): void {
  ctx.beginPath();
  for (let i = 0; i < points * 2; i++) {
    const r = i % 2 ? innerRadius : outerRadius;
    const angle = rotation + (i * Math.PI) / points;
    ctx.lineTo(x + Math.cos(angle) * r, y + Math.sin(angle) * r);
  }
  ctx.closePath();
}

export function heartPath(x: number, y: number, size: number): void {
  const k = size / 24;
  ctx.beginPath();
  ctx.moveTo(x, y + 9 * k);
  ctx.bezierCurveTo(x - 3 * k, y + 6 * k, x - 12 * k, y + 1 * k, x - 12 * k, y - 5 * k);
  ctx.bezierCurveTo(x - 12 * k, y - 12 * k, x - 3 * k, y - 13 * k, x, y - 7 * k);
  ctx.bezierCurveTo(x + 3 * k, y - 13 * k, x + 12 * k, y - 12 * k, x + 12 * k, y - 5 * k);
  ctx.bezierCurveTo(x + 12 * k, y + 1 * k, x + 3 * k, y + 6 * k, x, y + 9 * k);
  ctx.closePath();
}

// ---------------- text ----------------

/** Fitted text never shrinks below this share of its intended size. */
const MIN_FIT_SCALE = 0.7;

export function font(size: number, weight = 800): string {
  return `${weight} ${size}px ${FONT_FAMILY}`;
}

export function drawText(
  text: string, x: number, y: number, size: number, color: string,
  align: CanvasTextAlign = 'center', weight = 800, baseline: CanvasTextBaseline = 'middle',
): void {
  ctx.font = font(size, weight);
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.textBaseline = baseline;
  ctx.fillText(text, x, y);
}

/** `size`, or smaller if the text at that size would be wider than `maxWidth` (never below 70%). */
export function fittedFontSize(text: string, size: number, maxWidth: number, weight = 800): number {
  ctx.font = font(size, weight);
  const width = ctx.measureText(text).width;
  return width <= maxWidth ? size : Math.max(size * MIN_FIT_SCALE, size * (maxWidth / width));
}

/** Like `drawText`, but shrinks the font to keep the text within `maxWidth`. */
export function drawFittedText(
  text: string, x: number, y: number, size: number, maxWidth: number, color: string,
  align: CanvasTextAlign = 'center', weight = 800,
): void {
  drawText(text, x, y, fittedFontSize(text, size, maxWidth, weight), color, align, weight);
}

/** Big rounded title font with a soft glow and a white-to-colour gradient. */
export function drawTitle(text: string, x: number, y: number, size: number, color: string = TEXT.main, align: CanvasTextAlign = 'center'): void {
  ctx.save();
  ctx.font = `700 ${size}px ${TITLE_FONT_FAMILY}`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.shadowColor = 'rgba(140,220,255,0.7)';
  ctx.shadowBlur = 18;
  const gradient = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  gradient.addColorStop(0, '#ffffff');
  gradient.addColorStop(1, color === TEXT.main ? '#c9b6ff' : color);
  ctx.fillStyle = gradient;
  ctx.fillText(text, x, y);
  ctx.restore();
}

/**
 * Pieces a line may break between: a word with its trailing spaces, or a single Japanese character
 * (Japanese has no spaces). Opening brackets stick to the next character and closing punctuation
 * to the previous one, so a line never starts with 「、」 or 「。」.
 */
const CJK = '\u3000-\u30ff\u3400-\u9fff\uff00-\uffef';
const WRAP_TOKEN = new RegExp(String.raw`[「『（]*[${CJK}][」』）、。！？：ー…・]*|[^\s${CJK}]+\s*|\s+`, 'g');

/** Splits text into lines that fit `maxWidth` (also honours "\n"). */
export function wrapText(text: string, maxWidth: number, size: number, weight = 700): string[] {
  ctx.font = font(size, weight);
  const lines: string[] = [];
  for (const paragraph of text.split('\n')) {
    let line = '';
    for (const token of paragraph.match(WRAP_TOKEN) ?? []) {
      const candidate = line + token;
      if (line.trim() && ctx.measureText(candidate.trimEnd()).width > maxWidth) { lines.push(line.trimEnd()); line = token.trimStart(); }
      else line = candidate;
    }
    lines.push(line.trimEnd());
  }
  return lines;
}

// ---------------- shapes & effects ----------------

/** Soft radial light. */
export function drawGlow(x: number, y: number, radius: number, color: string, alpha: number): void {
  const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
  gradient.addColorStop(0, withAlpha(color, alpha));
  gradient.addColorStop(1, withAlpha(color, 0));
  ctx.fillStyle = gradient;
  ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
}

export type HeartStyle = 'filled' | 'plain' | 'empty';
export function drawHeart(x: number, y: number, size: number, color: string, style: HeartStyle = 'filled'): void {
  heartPath(x, y, size);
  if (style === 'empty') {
    ctx.fillStyle = 'rgba(255,255,255,0.08)'; ctx.fill();
    ctx.strokeStyle = 'rgba(200,190,255,0.35)'; ctx.lineWidth = 2; ctx.stroke();
    return;
  }
  const gradient = ctx.createLinearGradient(0, y - size / 2, 0, y + size / 2);
  gradient.addColorStop(0, shade(color, 0.35));
  gradient.addColorStop(1, color);
  ctx.fillStyle = gradient;
  ctx.fill();
  if (style === 'filled') {
    ctx.save(); ctx.shadowColor = withAlpha(color, 0.8); ctx.shadowBlur = 14; ctx.fill(); ctx.restore();
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ellipsePath(x - size * 0.18, y - size * 0.12, size * 0.1, size * 0.07); ctx.fill();
  }
}

/** Gold coin with a crescent moon. */
export function drawCoin(x: number, y: number, r: number): void {
  ctx.save();
  ellipsePath(x, y + r * 0.12, r, r); ctx.fillStyle = '#b97a12'; ctx.fill();
  ellipsePath(x, y, r, r); ctx.fillStyle = '#ffcf45'; ctx.fill();
  ctx.beginPath(); ctx.arc(x, y, r * 0.62, 0, Math.PI * 2); ctx.fillStyle = '#f5b822'; ctx.fill();
  ctx.beginPath();
  ctx.arc(x - r * 0.08, y, r * 0.42, 0, Math.PI * 2);
  ctx.arc(x + r * 0.12, y - r * 0.1, r * 0.36, 0, Math.PI * 2, true);
  ctx.fillStyle = '#fff1b0'; ctx.fill('evenodd');
  ctx.fillStyle = 'rgba(255,255,255,0.6)';
  ellipsePath(x - r * 0.45, y - r * 0.45, r * 0.18, r * 0.12); ctx.fill();
  ctx.restore();
}


// ---------------- UI surfaces ----------------

/** Dark glass panel with a glowing gradient border — the main UI surface. */
export function drawPanel(x: number, y: number, w: number, h: number, options: { radius?: number; light?: boolean; noStars?: boolean } = {}): void {
  const radius = options.radius ?? 26;
  ctx.save();
  ctx.shadowColor = 'rgba(110,80,255,0.5)'; ctx.shadowBlur = 34; ctx.shadowOffsetY = 6;
  const fill = ctx.createLinearGradient(0, y, 0, y + h);
  fill.addColorStop(0, options.light ? 'rgba(70,52,150,0.96)' : 'rgba(52,36,120,0.95)');
  fill.addColorStop(1, options.light ? 'rgba(42,28,98,0.96)' : 'rgba(24,15,62,0.95)');
  ctx.fillStyle = fill;
  roundRectPath(x, y, w, h, radius); ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;
  const border = ctx.createLinearGradient(x, y, x + w, y + h);
  border.addColorStop(0, 'rgba(159,234,255,0.7)');
  border.addColorStop(0.5, 'rgba(180,140,255,0.35)');
  border.addColorStop(1, 'rgba(255,156,230,0.6)');
  ctx.strokeStyle = border; ctx.lineWidth = 2; ctx.stroke();
  ctx.fillStyle = 'rgba(255,255,255,0.06)';
  roundRectPath(x + 6, y + 6, w - 12, Math.min(40, h * 0.25), radius - 6); ctx.fill();
  if (!options.noStars) {
    const twinkle = 0.5 + 0.5 * Math.sin(clock.time * 2.2 + x);
    ctx.fillStyle = `rgba(200,240,255,${0.4 + 0.5 * twinkle})`;
    starPath(x + w - 18, y + 16, 5 + twinkle * 2, 1.6, 4, 0); ctx.fill();
    starPath(x + 16, y + h - 16, 3 + twinkle, 1.2, 4, 0); ctx.fill();
  }
  ctx.restore();
}

/** Rounded translucent capsule (HUD counters, hints, tabs). */
export function drawGlassPill(x: number, y: number, w: number, h: number, alpha = 0.78): void {
  ctx.save();
  const fill = ctx.createLinearGradient(0, y, 0, y + h);
  fill.addColorStop(0, `rgba(48,32,110,${alpha})`);
  fill.addColorStop(1, `rgba(20,12,56,${alpha})`);
  ctx.fillStyle = fill;
  roundRectPath(x, y, w, h, h / 2); ctx.fill();
  ctx.strokeStyle = 'rgba(159,234,255,0.35)'; ctx.lineWidth = 1.5; ctx.stroke();
  ctx.restore();
}

/** Runs `draw` with a springy scale-and-fade-in that starts at `startTime`. */
export function withPopIn(startTime: number, centerX: number, centerY: number, draw: () => void, speed = 3.4): void {
  const progress = clamp((clock.time - startTime) * speed, 0, 1);
  const scale = 0.82 + 0.18 * easeOutBack(progress);
  ctx.save();
  ctx.globalAlpha *= clamp(progress * 2, 0, 1);
  ctx.translate(centerX, centerY); ctx.scale(scale, scale); ctx.translate(-centerX, -centerY);
  draw();
  ctx.restore();
}
