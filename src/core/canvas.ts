// The game draws everything into one <canvas> at a fixed logical resolution
// and scales it to fit the window (letterboxing the rest).

export const SCREEN_W = 1280;
export const SCREEN_H = 720;

export const canvas = document.getElementById('game') as HTMLCanvasElement;
export const ctx = canvas.getContext('2d')!;

/** How the logical 1280×720 screen maps onto the real window. */
export const viewport = { scale: 1, offsetX: 0, offsetY: 0, pixelRatio: 1 };

function resize(): void {
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2);
  const width = window.innerWidth, height = window.innerHeight;
  canvas.width = Math.round(width * pixelRatio);
  canvas.height = Math.round(height * pixelRatio);
  const scale = Math.min(width / SCREEN_W, height / SCREEN_H);
  viewport.scale = scale;
  viewport.offsetX = (width - SCREEN_W * scale) / 2;
  viewport.offsetY = (height - SCREEN_H * scale) / 2;
  viewport.pixelRatio = pixelRatio;
}
window.addEventListener('resize', resize);
resize();

/** Converts a mouse/touch position in the window into logical screen coordinates. */
export function toScreenPoint(clientX: number, clientY: number): { x: number; y: number } {
  return { x: (clientX - viewport.offsetX) / viewport.scale, y: (clientY - viewport.offsetY) / viewport.scale };
}
