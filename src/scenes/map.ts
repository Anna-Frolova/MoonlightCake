// The map of the world: the story's opening, and after each story day the land healing a little with the day's hearts.
import { ctx, SCREEN_W, view } from '../core/canvas';
import { clock } from '../core/clock';
import { drawGlassPill, drawPanel, drawText, drawTitle, font, starPath, wrapText } from '../core/draw';
import { clamp, easeOutCubic, lerp } from '../core/math';
import { BUTTON_COLOR, TEXT } from '../core/theme';
import { button } from '../core/ui';
import { STORY_DAYS } from '../data/schedule';
import { t } from '../data/strings';
import { leaveMap } from '../game/flow';
import { progress, runtime } from '../game/state';
import { drawCrackedMoon, drawLand, LAND_SPOTS } from '../render/world';

const MAP = {
  moonX: SCREEN_W / 2, moonY: 104, moonRadius: 74, landY: 210, starCount: 40, growDelay: 0.5, growSeconds: 2.4,
  labelSize: 18, labelLift: 16,
};
const TEXT_PANEL = { x: 150, y: 512, w: 980, h: 188, size: 20, lineHeight: 26, padding: 28 };

/** The text of this visit to the map. */
const mapText = (): string => (runtime.mapMode === 'intro' ? t().story.intro : t().story.afterDay[Math.min(progress.day, STORY_DAYS) - 1]);

export function renderMap(): void {
  const time = clock.time;
  const shown = lerp(runtime.mapLandFrom, progress.land, easeOutCubic(clamp((time - runtime.sceneStartTime - MAP.growDelay) / MAP.growSeconds, 0, 1)));
  const sky = ctx.createLinearGradient(0, view.top, 0, MAP.landY + 60);
  sky.addColorStop(0, '#05041c'); sky.addColorStop(1, '#2c2070');
  ctx.fillStyle = sky; ctx.fillRect(view.left, view.top, view.right - view.left, view.bottom - view.top);
  for (let i = 0; i < MAP.starCount; i++) {
    ctx.fillStyle = `rgba(230,240,255,${0.3 + 0.6 * Math.abs(Math.sin(time * 1.1 + i))})`;
    starPath(view.left + ((i * 137) % (view.right - view.left)), view.top + 10 + ((i * 53) % (MAP.landY - 20)), 3.5, 1.3, 4, 0); ctx.fill();
  }
  drawCrackedMoon(MAP.moonX, MAP.moonY, MAP.moonRadius, shown);
  const landW = view.right - view.left, landH = view.bottom - MAP.landY;
  drawLand(view.left, MAP.landY, landW, landH, shown, time);
  for (const [key, spot] of Object.entries(LAND_SPOTS) as [keyof typeof LAND_SPOTS, (typeof LAND_SPOTS)[keyof typeof LAND_SPOTS]][]) {
    if (shown > spot.from) drawPlaceName(t().story.places[key], view.left + landW * spot.x, MAP.landY + landH * spot.y);
  }
  drawTextPanel(shown);
}

function drawPlaceName(name: string, x: number, y: number): void {
  ctx.font = font(MAP.labelSize, 800);
  const w = ctx.measureText(name).width + 32;
  drawGlassPill(x - w / 2, y + MAP.labelLift, w, 32, 0.8);
  drawText(name, x, y + MAP.labelLift + 16, MAP.labelSize, TEXT.main, 'center', 800);
}

function drawTextPanel(shown: number): void {
  const { x, y, w, h, size, lineHeight, padding } = TEXT_PANEL;
  drawPanel(x, y, w, h);
  drawTitle(t().story.regionName, x + padding, y + 32, 24, TEXT.main, 'left');
  drawText(t().story.landHealed(Math.round(shown * 100)), x + w - padding, y + 32, 20, '#5ff0c8', 'right', 900);
  wrapText(mapText(), w - padding * 2, size, 700).forEach((line, i) => drawText(line, x + padding, y + 68 + i * lineHeight, size, TEXT.main, 'left', 700));
  button('mapNext', x + w - 220, y + h - 64, 196, 52, t().next, { color: BUTTON_COLOR.confirm, fontSize: 22, glow: true, onClick: leaveMap });
}
