// The wizard's shop between days: decor (more tips) and helpers (the "Авто" buttons).
import { ctx, SCREEN_H, SCREEN_W } from '../core/canvas';
import { clock } from '../core/clock';
import { shade, withAlpha } from '../core/color';
import { drawCoin, drawGlow, drawPanel, drawText, drawTitle, roundRectPath, withPopIn, wrapText } from '../core/draw';
import { clamp, easeOutCubic } from '../core/math';
import { drawMotes } from '../core/particles';
import { BUTTON_COLOR, TEXT } from '../core/theme';
import { button } from '../core/ui';
import { SHOP_ITEMS } from '../data/shop';
import type { ShopItemDef } from '../data/types';
import { buyItem, startNextDay } from '../game/flow';
import { isOwned, progress, runtime } from '../game/state';
import { drawKitchenBackground } from '../render/environment';
import { drawShopItemIcon } from '../render/icons';
import { dimBackground, drawCoinCounter, drawSoundButtons } from './hud';

const TABS = [
  { id: 'decor', label: 'Затишок', description: 'Робить кафе чарівнішим і збільшує чайові.' },
  { id: 'helpers', label: 'Автоматизація', description: 'Дорогі чарівні помічники: кнопка «Авто» на станції.' },
] as const;
const CARD = { w: 284, h: 140, gap: 12, rowGap: 14, columns: 4, gridX: 60, gridY: 186 };
const DISABLED_COLOR = '#4c4478';

function drawItemCard(item: ShopItemDef, index: number): void {
  const x = CARD.gridX + (index % CARD.columns) * (CARD.w + CARD.gap);
  const y = CARD.gridY + Math.floor(index / CARD.columns) * (CARD.h + CARD.rowGap);
  const { w, h } = CARD, owned = isOwned(item.id);
  const appear = clamp((clock.time - runtime.sceneStartTime - 0.1 - index * 0.06) * 4, 0, 1);

  ctx.save();
  ctx.globalAlpha *= appear; ctx.translate(0, (1 - easeOutCubic(appear)) * 24);
  ctx.save();
  if (owned) { ctx.shadowColor = 'rgba(47,201,166,0.6)'; ctx.shadowBlur = 16; }
  const fill = ctx.createLinearGradient(0, y, 0, y + h);
  fill.addColorStop(0, owned ? '#2a6a78' : '#46358f'); fill.addColorStop(1, owned ? '#1c3f58' : '#2a1f66');
  ctx.fillStyle = fill; roundRectPath(x, y, w, h, 20); ctx.fill();
  ctx.restore();
  ctx.strokeStyle = owned ? 'rgba(95,240,200,0.7)' : 'rgba(200,180,255,0.25)'; ctx.lineWidth = 1.5;
  roundRectPath(x, y, w, h, 20); ctx.stroke();
  drawGlow(x + 46, y + 52, 46, '#c9b6ff', 0.3);
  drawShopItemIcon(item.id, x + 46, y + 52, 0.95);
  const nameLines = wrapText(item.name, w - 100, 16, 900).slice(0, 2);
  nameLines.forEach((line, j) => drawText(line, x + 92, y + 22 + j * 19, 16, TEXT.main, 'left', 900));
  const description = item.description + (item.tipBonus ? ` +${Math.round(item.tipBonus * 100)}% чайових.` : '');
  wrapText(description, w - 100, 13, 700).slice(0, 3)
    .forEach((line, j) => drawText(line, x + 92, y + 24 + nameLines.length * 19 + j * 16, 13, TEXT.muted, 'left', 700));
  ctx.restore();

  if (owned) { drawText('✓ Є в кафе', x + w - 16, y + h - 22, 16, '#5ff0c8', 'right', 900); return; }
  const canAfford = progress.coins >= item.price;
  button('buy_' + item.id, x + w - 132, y + h - 48, 120, 40, '', {
    disabled: !canAfford, silent: true, color: BUTTON_COLOR.gold, onClick: () => buyItem(item),
    draw: (bx, by, bw, bh, hovered) => { // gold price capsule with a coin
      const color = canAfford ? BUTTON_COLOR.gold : DISABLED_COLOR;
      ctx.save();
      if (canAfford) { ctx.shadowColor = withAlpha(color, hovered ? 0.9 : 0.5); ctx.shadowBlur = hovered ? 22 : 12; }
      const capsule = ctx.createLinearGradient(0, by, 0, by + bh);
      capsule.addColorStop(0, shade(color, 0.35)); capsule.addColorStop(1, shade(color, -0.15));
      ctx.fillStyle = capsule; roundRectPath(bx, by, bw, bh, bh / 2); ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = 'rgba(255,255,255,0.3)'; roundRectPath(bx + 8, by + 3, bw - 16, bh * 0.4, bh / 3); ctx.fill();
      ctx.restore();
      drawCoin(bx + 24, by + bh / 2, 11);
      drawText(String(item.price), bx + 74, by + bh / 2 + 1, 19, canAfford ? '#4a2a00' : 'rgba(230,225,255,0.45)', 'center', 900);
    },
  });
}

export function renderShop(): void {
  drawKitchenBackground(clock.time); drawMotes();
  dimBackground(0.55);
  withPopIn(runtime.sceneStartTime, SCREEN_W / 2, SCREEN_H / 2, () => {
    drawPanel(30, 70, SCREEN_W - 60, 574);
    drawTitle('Крамниця чарівника', 60, 116, 32, TEXT.main, 'left');
    TABS.forEach((tab, i) => {
      const isActive = runtime.shopTab === tab.id;
      button('shopTab_' + tab.id, 760 + i * 236, 92, 226, 48, tab.label, {
        color: isActive ? BUTTON_COLOR.magic : '#3d2d82', textColor: isActive ? '#fff' : TEXT.muted, fontSize: 17, sound: 'tab',
        onClick: () => { runtime.shopTab = tab.id; },
      });
    });
    drawText(TABS.find(tab => tab.id === runtime.shopTab)!.description, 60, 160, 17, TEXT.muted, 'left', 700);
    SHOP_ITEMS.filter(item => item.tab === runtime.shopTab).forEach(drawItemCard);
    drawCoinCounter(60, 586);
    drawText('Нові смаки, форми й прикраси з’являються самі — дивись меню дня.', 226, 608, 15, TEXT.muted, 'left', 700);
    button('nextDay', SCREEN_W - 340, 578, 280, 56, `Почати день ${progress.day + 1}`, { color: BUTTON_COLOR.confirm, glow: true, onClick: startNextDay });
  });
  drawSoundButtons(SCREEN_W - 124, 12);
}
