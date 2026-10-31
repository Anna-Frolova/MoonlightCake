// Title screen: the chef cat behind the counter, the game title and continue / new game.
import { ctx, SCREEN_W } from '../core/canvas';
import { clock } from '../core/clock';
import { drawText, starPath } from '../core/draw';
import { BUTTON_COLOR, TEXT, TITLE_FONT_FAMILY } from '../core/theme';
import { button } from '../core/ui';
import { CHEF_CAT } from '../data/cats';
import { t } from '../data/strings';
import { askStartNewGame, continueGame, hasProgressWorthContinuing, startNewGame } from '../game/flow';
import { hasSave } from '../game/save';
import { progress } from '../game/state';
import { drawCat, drawPaws } from '../render/cat';
import { drawCounter, drawHallBackground, HALL_FLOOR_Y } from '../render/environment';
import { drawMotes } from '../core/particles';
import { drawLanguageSwitch, drawSoundButtons, LANGUAGE_SWITCH_W } from './hud';

const TITLE_Y = 100;
const BUTTONS_Y = 590;

export function renderTitle(): void {
  const time = clock.time;
  drawHallBackground(time);
  drawCat(CHEF_CAT, 640, HALL_FLOOR_Y, 1.1, time, Math.sin(time * 0.5) > 0.6 ? 'happy' : 'neutral');
  drawCounter(time);
  drawPaws(CHEF_CAT, 640, 522, 1.1);
  drawMotes();

  // big glowing title with an outline
  const bob = Math.sin(time * 1.4) * 4, title = t().gameTitle;
  ctx.save();
  ctx.shadowColor = 'rgba(140,220,255,0.9)'; ctx.shadowBlur = 34;
  ctx.font = `700 76px ${TITLE_FONT_FAMILY}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.lineWidth = 10; ctx.strokeStyle = '#1a0d3d'; ctx.strokeText(title, 640, TITLE_Y + bob);
  const fill = ctx.createLinearGradient(0, 70, 0, 130);
  fill.addColorStop(0, '#e6fbff'); fill.addColorStop(1, '#c9a6ff');
  ctx.fillStyle = fill; ctx.fillText(title, 640, TITLE_Y + bob);
  ctx.restore();
  for (let i = 0; i < 4; i++) { // twinkling stars around the title
    const twinkle = 0.5 + 0.5 * Math.sin(time * 3 + i * 1.7);
    ctx.fillStyle = `rgba(220,245,255,${twinkle})`;
    starPath(370 + i * 180 + (i % 2) * 40, 62 + (i % 2) * 70 + bob, 6 + twinkle * 5, 2, 4, 0); ctx.fill();
  }
  drawText(t().tagline, 640, 154, 27, TEXT.pink, 'center', 800);

  if (hasSave() && hasProgressWorthContinuing()) {
    button('continue', 340, BUTTONS_Y, 290, 66, t().continueDay(progress.day), { color: BUTTON_COLOR.confirm, fontSize: 23, glow: true, onClick: continueGame });
    button('newGame', 650, BUTTONS_Y, 290, 66, t().newGame, { color: BUTTON_COLOR.secondary, fontSize: 23, onClick: askStartNewGame });
  } else {
    button('newGame', 490, BUTTONS_Y, 300, 66, t().openCafe, { color: BUTTON_COLOR.confirm, fontSize: 24, glow: true, onClick: startNewGame });
  }
  drawText(__BUILD_ID__, SCREEN_W - 16, 706, 11, 'rgba(220,210,255,0.35)', 'right', 700); // which build is running (phones cache old ones)
  drawSoundButtons(SCREEN_W - 124, 16);
  drawLanguageSwitch(SCREEN_W - 124 - LANGUAGE_SWITCH_W - 8, 16);
}
