// App icon and splash screen, drawn with the game's own renderers (the chef cat, stars, magic circle),
// so they always match the game. Dev-only page: `npm run dev`, open /tools/art.html, press "Save".
// The PNGs go to assets/ (scripts/artSaver.ts), then `npm run app:assets` makes every size for iOS/Android.
import { canvas, ctx } from '../src/core/canvas';
import { drawGlow, ellipsePath, starPath } from '../src/core/draw';
import { CHEF_CAT } from '../src/data/cats';
import { drawCat } from '../src/render/cat';
import { drawMagicCircle } from '../src/render/environment';

const ICON = 1024;
/** Capacitor Assets' splash size; iOS shows its centre cropped to the screen, Android 12+ shows only the icon. */
const SPLASH = 2732;
/** Matches the game's own background (index.html, capacitor.config.ts). */
const NIGHT = '#0c0824';

/**
 * Android masks adaptive icons to a circle or squircle that shows only the middle ~66% (radius ~340 px here):
 * the hat and the moon stay inside it; the cat's body is cut off by the icon's lower edge.
 */
const CAT = { x: 512, floorY: 1022, scale: 3, mood: 'happy' as const };
/** A big golden full moon right behind the cat, like a halo. */
const MOON = { x: 512, y: 470, radius: 300 };

function drawSky(size: number): void {
  const sky = ctx.createRadialGradient(size * 0.5, size * 0.42, 0, size * 0.5, size * 0.42, size * 0.75);
  sky.addColorStop(0, '#4a2a92'); sky.addColorStop(0.5, '#221456'); sky.addColorStop(1, '#0d0828');
  ctx.fillStyle = sky; ctx.fillRect(0, 0, size, size);
}

/** Twinkles at fixed spots (a tiny deterministic scatter, so the art is the same every time). */
function drawStars(size: number, count: number, seed: number): void {
  for (let i = 0; i < count; i++) {
    const x = ((Math.sin(i * 12.9898 + seed) * 43758.5453) % 1 + 1) % 1 * size;
    const y = ((Math.sin(i * 78.233 + seed) * 12543.1234) % 1 + 1) % 1 * size;
    const r = size / 1024 * (5 + (i % 4) * 3);
    ctx.fillStyle = `rgba(225,235,255,${0.35 + (i % 3) * 0.2})`;
    starPath(x, y, r, r * 0.38, 4, 0); ctx.fill();
  }
}

function drawMoon(x: number, y: number, r: number): void {
  drawGlow(x, y, r * 1.7, '#ffd98a', 0.45);
  const face = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, r * 0.1, x, y, r);
  face.addColorStop(0, '#fff6d6'); face.addColorStop(0.6, '#ffe39a'); face.addColorStop(1, '#f2bf62');
  ctx.fillStyle = face; ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = 'rgba(214,150,70,0.28)';
  ellipsePath(x - r * 0.28, y - r * 0.18, r * 0.22, r * 0.17); ctx.fill();
  ellipsePath(x + r * 0.3, y + r * 0.3, r * 0.15, r * 0.12); ctx.fill();
  ellipsePath(x + r * 0.15, y - r * 0.45, r * 0.09, r * 0.07); ctx.fill();
}

/** Everything behind the cat: sky, stars, the moon, a faint rune circle. */
function drawIconBackground(): void {
  drawSky(ICON);
  drawStars(ICON, 26, 1);
  drawMagicCircle(ICON / 2, 640, 420, 0.4, 0.2);
  drawMoon(MOON.x, MOON.y, MOON.radius);
}

function drawIconCat(): void {
  drawCat(CHEF_CAT, CAT.x, CAT.floorY, CAT.scale, 0, CAT.mood);
}

function drawSplash(): void {
  const glow = ctx.createRadialGradient(SPLASH / 2, SPLASH / 2, 0, SPLASH / 2, SPLASH / 2, SPLASH * 0.55);
  glow.addColorStop(0, '#2a1764'); glow.addColorStop(1, NIGHT);
  ctx.fillStyle = glow; ctx.fillRect(0, 0, SPLASH, SPLASH);
  drawStars(SPLASH, 70, 7);
  // the icon art in the middle, inside a soft round window (iOS crops the square splash to the screen)
  const size = 1000, left = (SPLASH - size) / 2, top = (SPLASH - size) / 2;
  ctx.save();
  ctx.beginPath(); ctx.arc(SPLASH / 2, SPLASH / 2, size / 2, 0, Math.PI * 2); ctx.clip();
  ctx.translate(left, top); ctx.scale(size / ICON, size / ICON);
  drawIconBackground(); drawIconCat();
  ctx.restore();
  ctx.strokeStyle = 'rgba(200,180,255,0.35)'; ctx.lineWidth = 10;
  ctx.beginPath(); ctx.arc(SPLASH / 2, SPLASH / 2, size / 2 + 8, 0, Math.PI * 2); ctx.stroke();
}

interface Art { file: string; size: number; draw: () => void; preview?: 'round' | 'squircle' }
const ARTS: Art[] = [
  { file: 'icon-only.png', size: ICON, draw: () => { drawIconBackground(); drawIconCat(); }, preview: 'squircle' },
  { file: 'icon-background.png', size: ICON, draw: drawIconBackground },
  { file: 'icon-foreground.png', size: ICON, draw: drawIconCat, preview: 'round' },
  // the game is always dark, so there's no separate splash-dark.png
  { file: 'splash.png', size: SPLASH, draw: drawSplash },
];

function render(art: Art): string {
  canvas.width = canvas.height = art.size;
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  ctx.clearRect(0, 0, art.size, art.size);
  art.draw();
  return canvas.toDataURL('image/png');
}

async function main(): Promise<void> {
  await document.fonts.ready;
  const images = ARTS.map(art => ({ art, url: render(art) }));
  const previews = document.getElementById('previews')!;
  for (const { art, url } of images) {
    const figure = document.createElement('figure');
    if (art.preview) figure.className = art.preview;
    figure.innerHTML = `<img src="${url}" alt=""><figcaption>${art.file}</figcaption>`;
    previews.append(figure);
  }
  const status = document.getElementById('status')!;
  document.getElementById('save')!.addEventListener('click', async () => {
    status.textContent = 'saving…';
    for (const { art, url } of images) {
      const response = await fetch(`/__art/${art.file}`, { method: 'POST', body: await (await fetch(url)).blob() });
      if (!response.ok) { status.textContent = `failed: ${art.file}`; return; }
    }
    status.textContent = 'saved to assets/ — now run: npm run app:assets';
  });
}

void main();
