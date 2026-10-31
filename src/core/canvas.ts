// The game draws everything into one <canvas> at a fixed logical resolution
// and scales it to fit the window. The spare space around it (on screens wider or taller
// than 16:9) is filled with a soft, darkened blur of the scene.

export const SCREEN_W = 1280;
export const SCREEN_H = 720;

export const canvas = document.getElementById('game') as HTMLCanvasElement;
export const ctx = canvas.getContext('2d')!;

/** How the logical 1280×720 screen maps onto the real window (`width`/`height` = window size in CSS pixels). */
export const viewport = { scale: 1, offsetX: 0, offsetY: 0, pixelRatio: 1, width: 1, height: 1 };

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
}
window.addEventListener('resize', fitCanvasToWindow);
window.visualViewport?.addEventListener('resize', fitCanvasToWindow);
fitCanvasToWindow();

/** Converts a mouse/touch position in the window into logical screen coordinates. */
export function toScreenPoint(clientX: number, clientY: number): { x: number; y: number } {
  return { x: (clientX - viewport.offsetX) / viewport.scale, y: (clientY - viewport.offsetY) / viewport.scale };
}

// A tiny copy of the frame stretched over the whole window looks like a soft blur of the scene.
const BACKDROP_W = 48, BACKDROP_H = 27;
const BACKDROP_DIM = 'rgba(8,4,26,0.55)';
const backdrop = document.createElement('canvas');
backdrop.width = BACKDROP_W; backdrop.height = BACKDROP_H;
const backdropCtx = backdrop.getContext('2d')!;

/** Fills the bars around the game with the blurred scene. Call after the frame is drawn. */
export function fillLetterbox(): void {
  const { scale, offsetX, offsetY, pixelRatio, width, height } = viewport;
  const gameW = SCREEN_W * scale, gameH = SCREEN_H * scale;
  if (width - gameW < 2 && height - gameH < 2) return;
  backdropCtx.drawImage(canvas, offsetX * pixelRatio, offsetY * pixelRatio, gameW * pixelRatio, gameH * pixelRatio, 0, 0, BACKDROP_W, BACKDROP_H);
  ctx.save();
  ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0);
  ctx.beginPath(); ctx.rect(0, 0, width, height); ctx.rect(offsetX, offsetY, gameW, gameH); ctx.clip('evenodd');
  const cover = Math.max(width / SCREEN_W, height / SCREEN_H) * 1.08, coverW = SCREEN_W * cover, coverH = SCREEN_H * cover;
  ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
  ctx.drawImage(backdrop, offsetX + gameW / 2 - coverW / 2, offsetY + gameH / 2 - coverH / 2, coverW, coverH);
  ctx.fillStyle = BACKDROP_DIM; ctx.fillRect(0, 0, width, height);
  ctx.restore();
}
