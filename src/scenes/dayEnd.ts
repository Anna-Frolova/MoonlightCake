// End of a day: stats and the way to the shop (or to the finale after day 5).
import { ctx, SCREEN_H, SCREEN_W } from '../core/canvas';
import { clock } from '../core/clock';
import { drawFittedText, drawPanel, drawText, drawTitle, roundRectPath, withPopIn } from '../core/draw';
import { clamp, easeOutCubic } from '../core/math';
import { drawMotes } from '../core/particles';
import { BUTTON_COLOR, TEXT } from '../core/theme';
import { button } from '../core/ui';
import { STORY_DAYS } from '../data/schedule';
import { t } from '../data/strings';
import { goToShop, showFinale } from '../game/flow';
import { progress, runtime } from '../game/state';
import { drawCounter, drawHallBackground } from '../render/environment';
import { dimBackground, drawCoinCounter } from './hud';

const PANEL = { x: 340, y: 100, w: 600, h: 460 };

export function renderDayEnd(): void {
  const time = clock.time, { x, y, w, h } = PANEL;
  drawHallBackground(time); drawCounter(time); drawMotes();
  dimBackground();
  withPopIn(runtime.sceneStartTime, SCREEN_W / 2, SCREEN_H / 2, () => {
    drawPanel(x, y, w, h);
    drawTitle(t().dayFinished(progress.day), SCREEN_W / 2, y + 60, 38, TEXT.main);
    const stats = progress.dayStats, average = stats.served ? stats.hearts / stats.served : 0;
    const rows: [label: string, value: string, color: string][] = [
      [t().guestsServed, String(stats.served), TEXT.main],
      [t().averageScore, t().outOfFive(average.toFixed(1)), TEXT.main],
      [t().bestCake, '♥'.repeat(stats.bestHearts) || '—', '#ff7ac0'],
      [t().earnedToday, (stats.earned >= 0 ? '+' : '') + stats.earned, '#5ff0c8'],
    ];
    rows.forEach(([label, value, color], i) => { // rows slide in one after another
      const appear = clamp((time - runtime.sceneStartTime - 0.2 - i * 0.12) * 4, 0, 1), rowY = y + 130 + i * 52;
      ctx.save();
      ctx.globalAlpha *= appear; ctx.translate((1 - easeOutCubic(appear)) * 40, 0);
      ctx.fillStyle = 'rgba(255,255,255,0.07)'; roundRectPath(x + 40, rowY - 22, w - 80, 44, 22); ctx.fill();
      drawFittedText(label, x + 64, rowY, 21, w - 260, TEXT.main, 'left', 800);
      drawText(value, x + w - 64, rowY, 24, color, 'right', 900);
      ctx.restore();
    });
    const comment = average >= 4.3 ? t().dayCommentGreat
      : average >= 3.3 ? t().dayCommentGood : t().dayCommentCozy;
    drawFittedText(comment, SCREEN_W / 2, y + 352, 19, w - 60, TEXT.muted, 'center', 700);
    const isFinaleNext = progress.day === STORY_DAYS && !progress.finaleSeen;
    button('toShop', SCREEN_W / 2 - 160, y + h - 84, 320, 62, isFinaleNext ? t().next : t().toShop, {
      color: BUTTON_COLOR.confirm, fontSize: 23, glow: true, onClick: isFinaleNext ? showFinale : goToShop,
    });
  });
  drawCoinCounter(16, 12);
}
