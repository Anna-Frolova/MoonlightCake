// The game is laid out on a fixed logical 1280×720 screen, scaled to fit the window.
// Screens of another shape (phones are wider than 16:9) see more of the logical plane around it:
// backgrounds fill that `view`, while buttons and characters stay inside 0..1280 × 0..720.

export const SCREEN_W = 1280;
export const SCREEN_H = 720;

export const canvas = document.getElementById('game') as HTMLCanvasElement;
export const ctx = canvas.getContext('2d')!;

/** How the logical 1280×720 screen maps onto the real window (`width`/`height` = window size in CSS pixels). */
export const viewport = { scale: 1, offsetX: 0, offsetY: 0, pixelRatio: 1, width: 1, height: 1 };

/** The part of the logical plane that is on screen (includes the area under a notch). */
export const view = { left: 0, top: 0, right: SCREEN_W, bottom: SCREEN_H };

/** Reads the phone's safe-area insets (notch, rounded corners, home indicator) from CSS env(). */
const safeAreaProbe = document.createElement('div');
safeAreaProbe.style.cssText = 'position:fixed;left:0;top:0;visibility:hidden;pointer-events:none;'
  + 'padding:env(safe-area-inset-top) env(safe-area-inset-right) env(safe-area-inset-bottom) env(safe-area-inset-left)';
document.body.appendChild(safeAreaProbe);

function safeAreaInsets(): { top: number; right: number; bottom: number; left: number } {
  const style = getComputedStyle(safeAreaProbe);
  return {
    top: parseFloat(style.paddingTop) || 0, right: parseFloat(style.paddingRight) || 0,
    bottom: parseFloat(style.paddingBottom) || 0, left: parseFloat(style.paddingLeft) || 0,
  };
}

let lastSizeKey = '';

/**
 * Sizes the canvas to the visible window. Cheap when nothing changed, so it runs every frame:
 * on iPhones `resize` can fire before the new size is known (rotation, Safari's bars sliding away).
 */
export function fitCanvasToWindow(): void {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth, height = window.innerHeight;
  const insets = safeAreaInsets();
  const sizeKey = [width, height, pixelRatio, insets.top, insets.right, insets.bottom, insets.left].join();
  if (sizeKey === lastSizeKey) return;
  lastSizeKey = sizeKey;

  // the CSS size is set in pixels too: `100vh` on iOS is taller than the visible area
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);

  const safeWidth = width - insets.left - insets.right, safeHeight = height - insets.top - insets.bottom;
  const scale = Math.min(safeWidth / SCREEN_W, safeHeight / SCREEN_H);
  Object.assign(viewport, {
    scale, pixelRatio, width, height,
    offsetX: insets.left + (safeWidth - SCREEN_W * scale) / 2,
    offsetY: insets.top + (safeHeight - SCREEN_H * scale) / 2,
  });
  Object.assign(view, {
    left: -viewport.offsetX / scale, right: (width - viewport.offsetX) / scale,
    top: -viewport.offsetY / scale, bottom: (height - viewport.offsetY) / scale,
  });
}
window.addEventListener('resize', fitCanvasToWindow);
window.visualViewport?.addEventListener('resize', fitCanvasToWindow);
fitCanvasToWindow();

/** Converts a mouse/touch position in the window into logical screen coordinates. */
export function toScreenPoint(clientX: number, clientY: number): { x: number; y: number } {
  return { x: (clientX - viewport.offsetX) / viewport.scale, y: (clientY - viewport.offsetY) / viewport.scale };
}

/** Fills the whole visible area (backgrounds, dimming veils). */
export function fillView(): void {
  ctx.fillRect(view.left, view.top, view.right - view.left, view.bottom - view.top);
}

/** First position of a repeating pattern (`phase + k * spacing`) at or before `from`. */
export const firstOnGrid = (from: number, spacing: number, phase = 0): number => phase + Math.floor((from - phase) / spacing) * spacing;
