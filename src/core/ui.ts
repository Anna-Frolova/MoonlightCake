// "Immediate-mode" buttons: every frame the scene calls `button(...)`, which both draws it
// and registers its rectangle; clicks are then matched against last frame's rectangles.
import { ctx } from './canvas';
import { clock } from './clock';
import { shade, withAlpha } from './color';
import { drawFittedText, roundRectPath, starPath } from './draw';
import { BUTTON_COLOR } from './theme';

export interface ButtonHitArea {
  id: string;
  x: number; y: number; w: number; h: number;
  /** Modal dialogs use layer 1 so only their buttons react while open. */
  layer: number;
  onClick?: () => void;
  disabled: boolean;
  silent: boolean;
  color: string;
  sound: 'click' | 'tab';
}

export const ui = {
  buttons: [] as ButtonHitArea[],
  layer: 0,
  hoveredId: null as string | null,
  pressedId: null as string | null,
};

export const pointer = { x: -99, y: -99, isDown: false };

// ---------------- springy scale animation per element ----------------
const springs = new Map<string, { scale: number; velocity: number }>();
const SPRING_STIFFNESS = 300;
const SPRING_DAMPING = 17;
/** Button captions shrink to stay this far inside the button. */
const BUTTON_TEXT_PADDING = 18;

/** Moves the element's scale towards `target` with a little bounce; returns the current scale. */
export function springScale(id: string, target: number): number {
  let spring = springs.get(id);
  if (!spring) { spring = { scale: 1, velocity: 0 }; springs.set(id, spring); }
  const dt = Math.min(clock.delta, 0.033);
  spring.velocity += ((target - spring.scale) * SPRING_STIFFNESS - spring.velocity * SPRING_DAMPING) * dt;
  spring.scale += spring.velocity * dt;
  return spring.scale;
}

/** Button under the point, considering only the top-most layer (so modals block the rest). */
export function findButtonAt(point: { x: number; y: number }): ButtonHitArea | null {
  let topLayer = -1;
  for (const b of ui.buttons) if (b.layer > topLayer) topLayer = b.layer;
  for (let i = ui.buttons.length - 1; i >= 0; i--) {
    const b = ui.buttons[i];
    if (b.layer === topLayer && point.x >= b.x && point.x <= b.x + b.w && point.y >= b.y && point.y <= b.y + b.h) return b;
  }
  return null;
}

/** Called at the start of each frame, before scenes register this frame's buttons. */
export function beginUiFrame(): void {
  ui.buttons = [];
  ui.layer = 0;
}

export interface ButtonOptions {
  onClick?: () => void;
  color?: string;
  textColor?: string;
  fontSize?: number;
  radius?: number;
  disabled?: boolean;
  /** Pulsing glow + sparkles: marks the recommended next action. */
  glow?: boolean;
  silent?: boolean;
  sound?: 'click' | 'tab';
  hoverScale?: number;
  /** Draws the button yourself instead of the default glossy capsule. */
  draw?: (x: number, y: number, w: number, h: number, hovered: boolean, pressed: boolean) => void;
}

export function button(id: string, x: number, y: number, w: number, h: number, label: string, options: ButtonOptions = {}): void {
  const disabled = !!options.disabled;
  const hovered = !disabled && ui.hoveredId === id;
  const pressed = ui.pressedId === id && hovered;
  const color = disabled ? '#4c4478' : (options.color ?? BUTTON_COLOR.magic);
  ui.buttons.push({
    id, x, y, w, h, layer: ui.layer, onClick: options.onClick, disabled,
    silent: !!options.silent, color: options.color ?? BUTTON_COLOR.magic, sound: options.sound ?? 'click',
  });

  const scale = springScale(id, disabled ? 1 : pressed ? 0.92 : hovered ? (options.hoverScale ?? 1.06) : 1);
  ctx.save();
  ctx.translate(x + w / 2, y + h / 2);
  ctx.scale(scale * (pressed ? 1.03 : 1), scale * (pressed ? 0.95 : 1)); // squash when pressed
  ctx.translate(-(x + w / 2), -(y + h / 2));

  if (options.draw) { options.draw(x, y, w, h, hovered, pressed); ctx.restore(); return; }

  const radius = options.radius ?? Math.min(h / 2, 24);
  if (!disabled) {
    const pulse = options.glow ? 0.25 + 0.25 * Math.sin(clock.time * 4.5) : 0;
    ctx.shadowColor = withAlpha(color, (hovered ? 0.85 : 0.5) + pulse * 0.4);
    ctx.shadowBlur = (hovered ? 28 : 16) + pulse * 26;
    ctx.shadowOffsetY = 4;
  }
  const fill = ctx.createLinearGradient(0, y, 0, y + h);
  fill.addColorStop(0, shade(color, 0.32));
  fill.addColorStop(0.55, color);
  fill.addColorStop(1, shade(color, -0.2));
  ctx.fillStyle = fill;
  roundRectPath(x, y, w, h, radius); ctx.fill();
  ctx.shadowBlur = 0; ctx.shadowOffsetY = 0;

  // glossy highlight + a light sweep while hovered
  ctx.save();
  roundRectPath(x, y, w, h, radius); ctx.clip();
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  roundRectPath(x + 8, y + 3, w - 16, h * 0.4, radius * 0.8); ctx.fill();
  if (hovered) {
    const sweepX = x + ((clock.time * 260) % (w + 120)) - 60;
    const sweep = ctx.createLinearGradient(sweepX - 30, 0, sweepX + 30, 0);
    sweep.addColorStop(0, 'rgba(255,255,255,0)');
    sweep.addColorStop(0.5, 'rgba(255,255,255,0.28)');
    sweep.addColorStop(1, 'rgba(255,255,255,0)');
    ctx.fillStyle = sweep; ctx.fillRect(x, y, w, h);
  }
  ctx.restore();
  ctx.strokeStyle = disabled ? 'rgba(255,255,255,0.12)' : 'rgba(255,255,255,0.4)';
  ctx.lineWidth = 1.5;
  roundRectPath(x + 0.75, y + 0.75, w - 1.5, h - 1.5, radius); ctx.stroke();

  if (options.glow && !disabled) {
    const twinkle = 0.5 + 0.5 * Math.sin(clock.time * 6);
    ctx.fillStyle = `rgba(255,255,255,${0.5 + twinkle * 0.5})`;
    starPath(x + w - 14, y + 10, 4 + twinkle * 3, 1.4, 4, 0); ctx.fill();
    starPath(x + 14, y + h - 10, 3 + (1 - twinkle) * 2, 1.2, 4, 0); ctx.fill();
  }
  ctx.shadowColor = 'rgba(30,0,70,0.55)'; ctx.shadowBlur = 5; ctx.shadowOffsetY = 1.5;
  drawFittedText(label, x + w / 2, y + h / 2 + 1, options.fontSize ?? 20, w - BUTTON_TEXT_PADDING, disabled ? 'rgba(230,225,255,0.45)' : (options.textColor ?? '#fff'), 'center', 900);
  ctx.restore();
}
