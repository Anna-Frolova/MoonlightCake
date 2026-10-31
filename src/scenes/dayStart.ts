// Start of a day: news (new guests, essences, elements) and today's menu.
import { ctx, SCREEN_H, SCREEN_W } from '../core/canvas';
import { clock } from '../core/clock';
import { drawPanel, drawText, drawTitle, font, roundRectPath, withPopIn, wrapText } from '../core/draw';
import { loc } from '../core/language';
import { drawMotes } from '../core/particles';
import { BUTTON_COLOR, TEXT } from '../core/theme';
import { button } from '../core/ui';
import { GUESTS } from '../data/cats';
import { ELEMENT_ORDER, ELEMENTS } from '../data/elements';
import { CREAMS, ESSENCE_ORDER, ESSENCES, FILLINGS, FLAVORS, SHAPES, TOPPINGS } from '../data/ingredients';
import { guestsPerDay, MENU_CATEGORIES, STORY_DAYS } from '../data/schedule';
import { t } from '../data/strings';
import type { CreamId, FillingId, FlavorId, MenuCategory, ShapeId, ToppingId } from '../data/types';
import { openCafe } from '../game/flow';
import { progress, runtime, todaysMenu } from '../game/state';
import { drawCounter, drawHallBackground } from '../render/environment';
import { drawMenuItemIcon } from '../render/icons';
import { dimBackground, drawCoinCounter, drawSoundButtons } from './hud';

const PANEL = { x: 130, y: 52, w: 1020, h: 616 };
const MENU_TILE = { w: 74, h: 70, spacing: 82, labelOffset: 96 };
const MENU_ROW_SPACING = 92;

function menuItemName(category: MenuCategory, id: string): string {
  switch (category) {
    case 'shapes': return loc(SHAPES[id as ShapeId].name);
    case 'flavors': return loc(FLAVORS[id as FlavorId].name);
    case 'fillings': return loc(FILLINGS[id as FillingId].shortName);
    case 'creams': return loc(CREAMS[id as CreamId].name);
    case 'toppings': return loc(TOPPINGS[id as ToppingId].name);
  }
}

/** One row of the menu: category label + item tiles, with "new" / "again" badges. */
function drawMenuRow(category: MenuCategory, x: number, y: number): void {
  const menu = todaysMenu();
  drawText(t().menuLabels[category], x, y + 26, 16, TEXT.label, 'left', 900);
  (menu[category] as string[]).forEach((id, i) => {
    const tileX = x + MENU_TILE.labelOffset + i * MENU_TILE.spacing;
    const isFresh = (menu.fresh[category] as string[]).includes(id), isReturning = (menu.returning[category] as string[]).includes(id);
    const lift = Math.sin(clock.time * 2 + i + x) * 2;
    ctx.fillStyle = 'rgba(255,255,255,0.07)'; roundRectPath(tileX, y - 2 + lift, MENU_TILE.w, MENU_TILE.h, 16); ctx.fill();
    if (isFresh || isReturning) {
      ctx.strokeStyle = isFresh ? 'rgba(255,156,230,0.8)' : 'rgba(159,234,255,0.7)'; ctx.lineWidth = 2; ctx.stroke();
    }
    drawMenuItemIcon(category, id, tileX + MENU_TILE.w / 2, y + 26 + lift, 0.72);
    drawText(menuItemName(category, id), tileX + MENU_TILE.w / 2, y + 56 + lift, 11, TEXT.main, 'center', 800);
    if (isFresh || isReturning) {
      const label = isFresh ? t().badgeNew : t().badgeAgain;
      ctx.font = font(10, 900);
      const badgeW = ctx.measureText(label).width + 12, badgeX = tileX + MENU_TILE.w - badgeW + 4;
      ctx.save();
      ctx.shadowColor = isFresh ? '#ff6fb5' : '#5fd8ff'; ctx.shadowBlur = 10;
      ctx.fillStyle = isFresh ? '#ff6fb5' : '#36b8e0'; roundRectPath(badgeX, y - 10 + lift, badgeW, 17, 8.5); ctx.fill();
      ctx.restore();
      drawText(label, badgeX + badgeW / 2, y - 1 + lift, 10, '#fff', 'center', 900);
    }
  });
}

/** Short notes about what's new today. */
function todaysNews(day: number): string[] {
  const notes: string[] = [];
  if (day === 1) notes.push(t().welcomeNote);
  const newGuests = GUESTS.filter(cat => cat.firstDay === day && day > 1).map(cat => loc(cat.name));
  if (newGuests.length) notes.push(t().newGuestsNote(newGuests));
  const newEssences = ESSENCE_ORDER.filter(e => ESSENCES[e].unlockDay === day && day > 1);
  if (newEssences.length) notes.push(t().newEssenceNote(newEssences.map(e => loc(ESSENCES[e].name))));
  if (day === 1) notes.push(t().firstMagicNote);
  for (const element of ELEMENT_ORDER) {
    const def = ELEMENTS[element];
    if (def.unlockDay === day && day > 1) notes.push(t().newElementNote(loc(def.name), loc(def.signName)));
  }
  if (day === STORY_DAYS) notes.push(t().queenRumorNote);
  return notes;
}

export function renderDayStart(): void {
  const time = clock.time, day = progress.day, menu = todaysMenu();
  const { x, y, w, h } = PANEL;
  drawHallBackground(time); drawCounter(time); drawMotes();
  dimBackground();
  withPopIn(runtime.sceneStartTime, SCREEN_W / 2, SCREEN_H / 2, () => {
    drawPanel(x, y, w, h);
    drawTitle(t().dayTitle(day), SCREEN_W / 2, y + 46, 44, TEXT.main);
    drawText(day <= STORY_DAYS ? t().storyDaySubtitle(STORY_DAYS, guestsPerDay(day)) : t().endlessDaySubtitle(guestsPerDay(day)),
      SCREEN_W / 2, y + 86, 17, TEXT.muted, 'center', 800);

    let textY = y + 120;
    for (const note of todaysNews(day)) {
      for (const line of wrapText(note, w - 120, 17, 700)) { drawText(line, SCREEN_W / 2, textY, 17, TEXT.main, 'center', 700); textY += 24; }
    }

    const menuTitleY = Math.max(y + 176, textY + 14);
    drawTitle(t().menuTitle, x + 46, menuTitleY, 22, TEXT.main, 'left');
    const rowsY = menuTitleY + 30, leftX = x + 46, rightX = x + 560;
    drawMenuRow('flavors', leftX, rowsY);
    drawMenuRow('fillings', leftX, rowsY + MENU_ROW_SPACING);
    drawMenuRow('creams', leftX, rowsY + MENU_ROW_SPACING * 2);
    drawMenuRow('shapes', rightX, rowsY);
    drawMenuRow('toppings', rightX, rowsY + MENU_ROW_SPACING);

    const resting = MENU_CATEGORIES.flatMap(category => (menu.resting[category] as string[]).map(id =>
      t().restingItem(category, menuItemName(category, id))));
    if (resting.length) {
      wrapText(t().restingToday(resting), 420, 15, 700)
        .forEach((line, i) => drawText(line, rightX, rowsY + 196 + i * 21, 15, TEXT.muted, 'left', 700));
    }
    button('openCafe', SCREEN_W / 2 - 160, y + h - 84, 320, 64, t().openCafe, { color: BUTTON_COLOR.confirm, glow: true, onClick: openCafe });
  });
  drawCoinCounter(16, 12);
  drawSoundButtons(SCREEN_W - 124, 16);
}
