// Interface pieces shared by several scenes: coin counter, sound toggles, toast and dialog.
import { initAudio } from '../audio/engine';
import { sfx } from '../audio/sfx';
import { ctx, fillView, SCREEN_H, SCREEN_W } from '../core/canvas';
import { clock } from '../core/clock';
import { drawCoin, drawFittedText, drawGlassPill, drawGlow, drawPanel, drawText, font, roundRectPath, starPath, withPopIn, wrapText } from '../core/draw';
import { language, LANGUAGES } from '../core/language';
import { easeOutBack } from '../core/math';
import { BUTTON_COLOR, TEXT } from '../core/theme';
import { button, ui } from '../core/ui';
import { t } from '../data/strings';
import { setMusicOn, setSoundOn, switchLanguage } from '../game/flow';
import { progress, runtime } from '../game/state';
import { CAKE_CENTER_X } from '../kitchen/layout';

const DISABLED_ICON_COLOR = '#6e6488';
const TOAST_SIZE = 22;
const MODAL_TEXT_SIZE = 24;

export function drawCoinCounter(x: number, y: number): void {
  const bump = 1 + 0.18 * Math.sin(runtime.coinBump * Math.PI);
  drawGlassPill(x, y, 150, 44);
  ctx.save();
  ctx.translate(x + 24, y + 22); ctx.scale(bump, bump);
  drawGlow(0, 0, 26, '#ffd84a', 0.25 + runtime.coinBump * 0.4);
  drawCoin(0, 0, 14);
  ctx.restore();
  drawText(String(Math.round(runtime.displayedCoins)), x + 48, y + 23, 22, TEXT.gold, 'left', 900);
}

/** Music and sound effect toggles (two round glass buttons). */
export function drawSoundButtons(x: number, y: number): void {
  const iconButton = (id: string, offsetX: number, isOn: boolean, drawIcon: (bx: number, by: number) => void, onClick: () => void): void => {
    button(id, x + offsetX, y, 48, 44, '', {
      silent: true, onClick,
      draw: (bx, by, bw, bh, hovered) => {
        ctx.save();
        if (hovered) { ctx.shadowColor = 'rgba(159,234,255,0.7)'; ctx.shadowBlur = 16; }
        drawGlassPill(bx, by, bw, bh, hovered ? 0.95 : 0.78);
        ctx.restore();
        drawIcon(bx, by);
        if (!isOn) { // strike-through
          ctx.strokeStyle = '#ff6f9f'; ctx.lineWidth = 3; ctx.lineCap = 'round';
          ctx.beginPath(); ctx.moveTo(bx + 13, by + 33); ctx.lineTo(bx + 35, by + 11); ctx.stroke();
        }
      },
    });
  };
  iconButton('toggleMusic', 0, progress.musicOn,
    (bx, by) => drawText('♪', bx + 24, by + 23, 24, progress.musicOn ? TEXT.label : DISABLED_ICON_COLOR, 'center', 900),
    () => { initAudio(); setMusicOn(!progress.musicOn); if (progress.musicOn) sfx.tab(); });
  iconButton('toggleSound', 56, progress.soundOn,
    (bx, by) => { // speaker
      ctx.fillStyle = progress.soundOn ? TEXT.label : DISABLED_ICON_COLOR;
      ctx.beginPath();
      ctx.moveTo(bx + 13, by + 18); ctx.lineTo(bx + 19, by + 18); ctx.lineTo(bx + 27, by + 11);
      ctx.lineTo(bx + 27, by + 33); ctx.lineTo(bx + 19, by + 26); ctx.lineTo(bx + 13, by + 26);
      ctx.closePath(); ctx.fill();
      if (progress.soundOn) { ctx.strokeStyle = TEXT.label; ctx.lineWidth = 2.5; ctx.beginPath(); ctx.arc(bx + 28, by + 22, 8, -0.8, 0.8); ctx.stroke(); }
    },
    () => { initAudio(); setSoundOn(!progress.soundOn); if (progress.soundOn) sfx.tab(); });
}

export const LANGUAGE_SWITCH_W = 168;
const LANGUAGE_SWITCH_H = 44;

/** Two-part glass capsule "УКР | 日本語"; the current language is lit up. */
export function drawLanguageSwitch(x: number, y: number): void {
  const segmentW = LANGUAGE_SWITCH_W / LANGUAGES.length;
  drawGlassPill(x, y, LANGUAGE_SWITCH_W, LANGUAGE_SWITCH_H);
  LANGUAGES.forEach(({ id, label }, i) => {
    const isCurrent = language() === id;
    button('language_' + id, x + i * segmentW, y, segmentW, LANGUAGE_SWITCH_H, '', {
      silent: true, hoverScale: isCurrent ? 1 : 1.06,
      onClick: () => { if (!isCurrent) { switchLanguage(id); sfx.tab(); } },
      draw: (bx, by, bw, bh, hovered) => {
        if (isCurrent) {
          ctx.save();
          ctx.shadowColor = 'rgba(155,107,255,0.8)'; ctx.shadowBlur = 14;
          const fill = ctx.createLinearGradient(0, by, 0, by + bh);
          fill.addColorStop(0, '#b48cff'); fill.addColorStop(1, '#6a3fd8');
          ctx.fillStyle = fill; roundRectPath(bx + 4, by + 4, bw - 8, bh - 8, (bh - 8) / 2); ctx.fill();
          ctx.restore();
        }
        drawText(label, bx + bw / 2, by + bh / 2 + 1, 17, isCurrent ? '#fff' : hovered ? TEXT.label : TEXT.muted, 'center', 900);
      },
    });
  });
}

/** "Day N · Guest i/n" pill. */
export function drawDayCounter(): void {
  const queueLength = progress.guestQueue?.length ?? 0;
  const guestNumber = Math.min(progress.guestIndex + (runtime.customer?.hasPaid ? 0 : 1), queueLength);
  drawGlassPill(16, 12, 236, 44);
  drawFittedText(t().dayAndGuest(progress.day, guestNumber, queueLength), 134, 35, 21, 216, TEXT.main, 'center', 800);
}

export function drawToast(): void {
  const toast = runtime.toast;
  if (!toast) return;
  const age = clock.time - toast.startTime;
  const scale = 0.7 + 0.3 * easeOutBack(age * 5);
  ctx.save();
  ctx.globalAlpha = Math.min(1, toast.remaining * 3);
  ctx.font = font(TOAST_SIZE, 800);
  const w = ctx.measureText(toast.text).width + 64, h = 50;
  // in the kitchen it sits over the cake area, elsewhere at the top centre
  const top = runtime.scene === 'kitchen' ? 116 : 74, centerX = runtime.scene === 'kitchen' ? CAKE_CENTER_X + 60 : SCREEN_W / 2;
  ctx.translate(centerX, top + h / 2); ctx.scale(scale, scale); ctx.translate(-centerX, -(top + h / 2));
  ctx.shadowColor = 'rgba(140,110,255,0.7)'; ctx.shadowBlur = 22;
  drawGlassPill(centerX - w / 2, top, w, h, 0.95);
  ctx.shadowBlur = 0;
  ctx.fillStyle = TEXT.label; starPath(centerX - w / 2 + 22, top + h / 2, 8, 3, 4, clock.time * 2); ctx.fill();
  drawText(toast.text, centerX + 10, top + h / 2, TOAST_SIZE, TEXT.main);
  ctx.restore();
}

/** Confirmation dialog; its buttons are on layer 1, so nothing else reacts while it is open. */
export function drawModal(): void {
  const modal = runtime.modal;
  if (!modal) return;
  ui.layer = 1;
  ctx.fillStyle = 'rgba(8,4,26,0.62)'; fillView();
  const lines = wrapText(modal.text, 440, MODAL_TEXT_SIZE, 800);
  const w = 520, h = 150 + lines.length * 33, x = SCREEN_W / 2 - w / 2, y = SCREEN_H / 2 - h / 2;
  withPopIn(modal.startTime, SCREEN_W / 2, SCREEN_H / 2, () => {
    drawPanel(x, y, w, h, { light: true });
    lines.forEach((line, i) => drawText(line, SCREEN_W / 2, y + 50 + i * 33, MODAL_TEXT_SIZE, TEXT.main));
    button('modalCancel', x + 40, y + h - 80, 200, 56, modal.cancelLabel, { color: BUTTON_COLOR.secondary, fontSize: 22, onClick: () => { runtime.modal = null; } });
    button('modalConfirm', x + 280, y + h - 80, 200, 56, modal.confirmLabel, {
      color: modal.danger ? BUTTON_COLOR.danger : BUTTON_COLOR.confirm, fontSize: 22,
      onClick: () => { runtime.modal = null; modal.onConfirm(); },
    });
  });
  ui.layer = 0;
}

/** Darkens the scene behind a popup panel. */
export function dimBackground(alpha = 0.5): void {
  ctx.fillStyle = `rgba(8,4,26,${alpha})`;
  fillView();
}
