// The night raid: the dark hall, the chef guarding the recipe book, grey crumbs creeping in with signs over them.
import { ctx, SCREEN_H, SCREEN_W } from '../core/canvas';
import { clock } from '../core/clock';
import { drawGlow, drawPanel, drawText, drawTitle, ellipsePath, roundRectPath, withPopIn, wrapText } from '../core/draw';
import { drawMotes } from '../core/particles';
import { BUTTON_COLOR, TEXT } from '../core/theme';
import { button } from '../core/ui';
import { CHEF_CAT } from '../data/cats';
import { ELEMENTS } from '../data/elements';
import { t } from '../data/strings';
import { finishNight } from '../game/flow';
import { crumbPosition, crumbProgress, raid, RAID, RAID_BOOK, type RaidCrumb } from '../game/nightRaid';
import { runtime } from '../game/state';
import { drawMagicStrokes } from '../kitchen/stations/magic';
import { drawCat } from '../render/cat';
import { drawCounter, drawHallBackground, HALL_FLOOR_Y } from '../render/environment';
import { drawSign } from '../render/signs';
import { dimBackground, drawCoinCounter } from './hud';

const DARKNESS = 0.68;
const CHEF_SCALE = 0.95;
const CRUMB = { radius: 26, color: '#6a6084', rim: '#d8ccff', eyes: '#fff6dc', signSize: 46, signY: 62, signPlate: 'rgba(14,8,44,0.82)' };
const BOOK = { w: 104, h: 28, cover: '#7a3f8e', page: '#fff6dc', glow: '#ffe27a' };
const PAGE_ICONS = { y: 42, spacing: 40, w: 26, h: 32, color: '#fff6dc', lost: 'rgba(255,255,255,0.14)' };
const HINT = { y: 92, size: 20, seconds: 9 };
const RESULT_PANEL = { x: 390, y: 180, w: 500, h: 300 };

export function renderNight(): void {
  const time = clock.time;
  drawHallBackground(time);
  drawCat(CHEF_CAT, RAID_BOOK.x, HALL_FLOOR_Y, CHEF_SCALE, time, raid.pages === RAID.pages ? 'neutral' : 'thinking');
  drawCounter(time);
  dimBackground(DARKNESS);
  drawBook();
  raid.crumbs.forEach(drawCrumb);
  drawMotes();
  drawMagicStrokes();
  drawPageIcons();
  drawCoinCounter(16, 12);
  if (raid.result) { drawResult(raid.result); return; }
  if (time - runtime.sceneStartTime < HINT.seconds) drawText(t().story.nightHint, SCREEN_W / 2, HINT.y, HINT.size, TEXT.main, 'center', 800);
}

function drawBook(): void {
  const { x, y } = RAID_BOOK, { w, h } = BOOK;
  drawGlow(x, y, 120, BOOK.glow, 0.28 + 0.1 * Math.sin(clock.time * 3));
  ctx.fillStyle = BOOK.cover; roundRectPath(x - w / 2 - 5, y - h / 2 + 5, w + 10, h, 7); ctx.fill();
  ctx.fillStyle = BOOK.page; roundRectPath(x - w / 2, y - h / 2, w / 2 - 2, h - 2, 5); ctx.fill();
  roundRectPath(x + 2, y - h / 2, w / 2 - 2, h - 2, 5); ctx.fill();
}

/** A crumb of grey: a soft blob with two eyes, its sign on a dark plate above it; hurrying gets it a redder plate edge. */
function drawCrumb(crumb: RaidCrumb): void {
  const { x, y } = crumbPosition(crumb), r = CRUMB.radius, def = ELEMENTS[crumb.element];
  ctx.save();
  ctx.shadowColor = CRUMB.rim; ctx.shadowBlur = 16;
  ellipsePath(x, y, r, r * 0.86); ctx.fillStyle = CRUMB.color; ctx.fill();
  ctx.restore();
  ctx.fillStyle = CRUMB.eyes;
  ellipsePath(x - r * 0.3, y - r * 0.12, 5, 6); ctx.fill();
  ellipsePath(x + r * 0.3, y - r * 0.12, 5, 6); ctx.fill();
  const plateY = y - CRUMB.signY, half = CRUMB.signSize / 2 + 8;
  ctx.fillStyle = CRUMB.signPlate; roundRectPath(x - half, plateY - half, half * 2, half * 2, 12); ctx.fill();
  if (crumbProgress(crumb) > 0.7) { ctx.strokeStyle = BUTTON_COLOR.danger; ctx.lineWidth = 3; ctx.stroke(); }
  drawSign(crumb.element, x, plateY, CRUMB.signSize, def.color, 3);
}

function drawPageIcons(): void {
  const { y, spacing, w, h, color, lost } = PAGE_ICONS, left = SCREEN_W / 2 - ((RAID.pages - 1) * spacing) / 2;
  for (let i = 0; i < RAID.pages; i++) {
    ctx.fillStyle = i < raid.pages ? color : lost;
    roundRectPath(left + i * spacing - w / 2, y - h / 2, w, h, 5); ctx.fill();
  }
}

function drawResult(result: { won: boolean; coins: number }): void {
  const { x, y, w, h } = RESULT_PANEL;
  withPopIn(runtime.sceneStartTime, SCREEN_W / 2, SCREEN_H / 2, () => {
    drawPanel(x, y, w, h);
    drawTitle(result.won ? t().story.nightWonTitle : t().story.nightLostTitle, x + w / 2, y + 56, 30, TEXT.main);
    wrapText(result.won ? t().story.nightWon : t().story.nightLost, w - 70, 20, 700)
      .forEach((line, i) => drawText(line, x + w / 2, y + 110 + i * 28, 20, TEXT.main, 'center', 700));
    drawText((result.coins > 0 ? '+' : '') + result.coins, x + w / 2, y + h - 104, 26, result.won ? '#5ff0c8' : '#ff7f9f', 'center', 900);
    button('nightDone', x + w / 2 - 130, y + h - 76, 260, 58, t().next, { color: BUTTON_COLOR.confirm, fontSize: 23, glow: true, onClick: finishNight });
  });
}
