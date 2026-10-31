// After day 5: the Moon Queen's recognition and the total stats; then endless mode.
import { SCREEN_W } from '../core/canvas';
import { clock } from '../core/clock';
import { drawPanel, drawText, drawTitle, withPopIn, wrapText } from '../core/draw';
import { pickRandom, randomRange } from '../core/math';
import { drawMotes, emitParticle } from '../core/particles';
import { BUTTON_COLOR, TEXT } from '../core/theme';
import { button } from '../core/ui';
import { MOON_QUEEN } from '../data/cats';
import { t } from '../data/strings';
import { finishFinale } from '../game/flow';
import { progress, runtime } from '../game/state';
import { drawCat, drawPaws } from '../render/cat';
import { drawCounter, drawHallBackground, HALL_FLOOR_Y } from '../render/environment';

const PANEL = { x: 36, y: 90, w: 470, h: 420 };
const FALLING_STAR_CHANCE_PER_FRAME = 0.25;

export function renderFinale(): void {
  const time = clock.time, { x, y, w, h } = PANEL;
  drawHallBackground(time);
  drawCat(MOON_QUEEN, 640, HALL_FLOOR_Y, 1.1, time, 'happy');
  drawCounter(time);
  drawPaws(MOON_QUEEN, 640, 520, 1.1);
  drawMotes();
  if (Math.random() < FALLING_STAR_CHANCE_PER_FRAME) {
    emitParticle({
      x: randomRange(0, SCREEN_W), y: -10, vx: randomRange(-20, 20), vy: randomRange(40, 90), life: 6, maxLife: 6,
      size: randomRange(3, 6), color: pickRandom(['#fff6c8', '#ffd84a', '#c9a0ff', '#8fdcff']), kind: 'star', spin: randomRange(-2, 2),
    });
  }
  withPopIn(runtime.sceneStartTime, x + w / 2, y + h / 2, () => {
    drawPanel(x, y, w, h);
    drawTitle(t().finaleTitle, x + w / 2, y + 48, 28, TEXT.main);
    const lines = wrapText(t().finaleText, w - 60, 18, 700);
    lines.forEach((line, i) => drawText(line, x + 30, y + 98 + i * 26, 18, TEXT.main, 'left', 700));
    const totals = progress.totals, statsY = y + 110 + lines.length * 26;
    drawText(t().cakesBaked(totals.served), x + 30, statsY + 14, 18, TEXT.muted, 'left', 800);
    drawText(t().heartsReceived(totals.hearts), x + 30, statsY + 42, 18, TEXT.muted, 'left', 800);
    drawText(t().coinsEarned(totals.earned), x + 30, statsY + 70, 18, TEXT.muted, 'left', 800);
    button('keepPlaying', x + 30, y + h - 82, w - 60, 60, t().keepPlaying, { color: BUTTON_COLOR.confirm, glow: true, onClick: finishFinale });
  });
}
