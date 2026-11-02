// The game is laid out on a fixed logical 1280×720 screen, scaled to fit the window.
// Screens of another shape (phones are wider than 16:9) see more of the logical plane around it:
// backgrounds fill that `view`, while buttons and characters stay inside 0..1280 × 0..720.

export const SCREEN_W = 1280;
export const SCREEN_H = 720;
/** Device pixels per CSS pixel are capped here (iPhone screens are 3×); page zoom comes on top. */
const MAX_DEVICE_PIXEL_RATIO = 3;
/** Browsers refuse bigger canvases (iOS: ~16.7 million pixels), so the backing store stays below this. */
const MAX_CANVAS_PIXELS = 16_000_000;
/** Page zoom this close to 1 counts as not zoomed. */
const ZOOM_TOLERANCE = 0.01;

export const canvas = document.getElementById('game') as HTMLCanvasElement;

/**
 * How the logical 1280×720 screen maps onto the real window (`width`/`height` = window size in CSS pixels).
 * `zoom` is the browser's page zoom (1 normally); `resizes` / `refreshes` count how often the drawing buffer was
 * reallocated for a new size / remade on purpose. Shown next to the build stamp to diagnose blurriness.
 */
export const viewport = { scale: 1, offsetX: 0, offsetY: 0, pixelRatio: 1, zoom: 1, width: 1, height: 1, resizes: 0, refreshes: 0 };

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

const viewportMeta = document.querySelector<HTMLMetaElement>('meta[name="viewport"]');
let zoomResetFor: number | null = null;

/**
 * iOS sometimes leaves the page zoomed in after the rotation at launch. The game still fits the (zoomed) window,
 * but each canvas pixel then covers several screen pixels and everything looks blurry until a restart.
 * Re-applying the viewport tag brings iOS back to scale 1 (tried once per stuck zoom value).
 */
function undoPageZoom(zoom: number): void {
  if (!viewportMeta || zoom === zoomResetFor) return;
  zoomResetFor = zoom;
  const content = viewportMeta.content;
  viewportMeta.content = '';
  viewportMeta.content = content;
}

/**
 * Sizes the canvas to the visible window. Cheap when nothing changed, so it runs every frame:
 * on iPhones `resize` can fire before the new size is known (rotation, Safari's bars sliding away).
 */
export function fitCanvasToWindow(): void {
  if (refreshDue) refreshCanvas();
  const zoom = window.visualViewport?.scale ?? 1;
  if (Math.abs(zoom - 1) > ZOOM_TOLERANCE) undoPageZoom(zoom);
  else zoomResetFor = null;
  let width = window.innerWidth, height = window.innerHeight;
  if (width < 1 || height < 1) { // the app is still launching and the page has no size yet
    if (lastSizeKey) return; // keep the last real size
    // first sizing: take the (landscape) screen, so the drawing buffer is never created tiny
    width = Math.max(screen.width, screen.height);
    height = Math.min(screen.width, screen.height);
  }
  // One canvas pixel per screen pixel: the device ratio (3 on iPhones) times the page zoom, if zoomed in.
  // (The zoom used to be capped together with the device ratio, so a zoomed iPhone stayed at 3× and looked blurry.)
  let pixelRatio = Math.min(window.devicePixelRatio || 1, MAX_DEVICE_PIXEL_RATIO) * Math.max(1, zoom);
  const pixels = width * height * pixelRatio * pixelRatio;
  if (pixels > MAX_CANVAS_PIXELS) pixelRatio *= Math.sqrt(MAX_CANVAS_PIXELS / pixels);
  const insets = safeAreaInsets();
  const sizeKey = [width, height, pixelRatio, zoom.toFixed(2), insets.top, insets.right, insets.bottom, insets.left].join();
  if (sizeKey === lastSizeKey) return;
  lastSizeKey = sizeKey;

  // the CSS size is set in pixels too: `100vh` on iOS is taller than the visible area
  canvas.style.width = width + 'px';
  canvas.style.height = height + 'px';
  // assigning width/height reallocates the drawing buffer even when unchanged (e.g. only the insets moved)
  const bufferWidth = Math.round(width * pixelRatio), bufferHeight = Math.round(height * pixelRatio);
  if (canvas.width !== bufferWidth || canvas.height !== bufferHeight) {
    canvas.width = bufferWidth;
    canvas.height = bufferHeight;
    viewport.resizes++;
  }

  const safeWidth = width - insets.left - insets.right, safeHeight = height - insets.top - insets.bottom;
  const scale = Math.min(safeWidth / SCREEN_W, safeHeight / SCREEN_H);
  Object.assign(viewport, {
    scale, pixelRatio, zoom, width, height,
    offsetX: insets.left + (safeWidth - SCREEN_W * scale) / 2,
    offsetY: insets.top + (safeHeight - SCREEN_H * scale) / 2,
  });
  Object.assign(view, {
    left: -viewport.offsetX / scale, right: (width - viewport.offsetX) / scale,
    top: -viewport.offsetY / scale, bottom: (height - viewport.offsetY) / scale,
  });
}

/**
 * iPhones often show the canvas blurry at launch although its buffer has exactly the screen's pixels (diagnostics on
 * the title screen: 3.0×, buffer = screen, zoom 1.00): iOS's on-screen copy of the canvas looks like it's made at
 * 1 pixel per point and stretched, until a restart. Remaking the drawing buffer or toggling the CSS transform didn't
 * help; taking the canvas out of the page and putting it back (iOS then rebuilds how it shows it) does. So that's done
 * shortly after launch, after coming back to the game and after a resize. Never mid-touch (a drag would break).
 * The game redraws the whole frame right after, so nothing flickers.
 */
const REFRESH_DELAYS_MS = [100, 300, 1000, 2500];
/**
 * At launch the canvas stays invisible (the page's night background shows) until the refresh at this time,
 * then fades in, so the blurry first moment isn't seen.
 */
const REVEAL_AT_MS = 300;
/** Shown anyway by then, should no frame run the refresh (e.g. a finger held down). */
const REVEAL_FALLBACK_MS = 1500;
const REVEAL_FADE = 'opacity 0.25s ease-out';
let refreshDue = false;
let revealDue = false;
let pointersDown = 0;

function reinsertCanvas(): void {
  const parent = canvas.parentNode;
  if (!parent) return;
  const next = canvas.nextSibling;
  parent.removeChild(canvas);
  parent.insertBefore(canvas, next);
}

function revealCanvas(): void {
  revealDue = false;
  canvas.style.opacity = '';
}

function refreshCanvas(): void {
  if (pointersDown > 0) return; // stays due until the finger is lifted
  refreshDue = false;
  reinsertCanvas();
  canvas.width = canvas.width; // a fresh drawing buffer of the same size
  viewport.refreshes++;
  if (revealDue) revealCanvas();
}

function scheduleCanvasRefresh(): void {
  for (const delay of REFRESH_DELAYS_MS) setTimeout(() => { refreshDue = true; }, delay);
}

window.addEventListener('resize', () => { fitCanvasToWindow(); scheduleCanvasRefresh(); });
window.visualViewport?.addEventListener('resize', fitCanvasToWindow);
document.addEventListener('visibilitychange', () => {
  if (document.hidden) pointersDown = 0; // a touch cut off by leaving the app never reports its end
  else scheduleCanvasRefresh();
});
window.addEventListener('pageshow', scheduleCanvasRefresh);
window.addEventListener('pointerdown', () => { pointersDown++; }, true);
for (const type of ['pointerup', 'pointercancel']) window.addEventListener(type, () => { pointersDown = Math.max(0, pointersDown - 1); }, true);
fitCanvasToWindow();
canvas.style.opacity = '0';
canvas.style.transition = REVEAL_FADE;
scheduleCanvasRefresh();
setTimeout(() => { revealDue = true; }, REVEAL_AT_MS);
setTimeout(revealCanvas, REVEAL_FALLBACK_MS);

/** Created only after the canvas got its real size, so its buffer is never first made at the default 300×150. */
export const ctx = canvas.getContext('2d')!;

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
