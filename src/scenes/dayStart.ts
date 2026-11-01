// Start of a day: news (new guests, essences, elements) and today's menu.
import { ctx, SCREEN_H, SCREEN_W } from '../core/canvas';
import { clock } from '../core/clock';
import { drawFittedText, drawPanel, drawText, drawTitle, font, roundRectPath, withPopIn, wrapText } from '../core/draw';
import { loc } from '../core/language';
import { clamp } from '../core/math';
import { drawMotes } from '../core/particles';
import { BUTTON_COLOR, TEXT } from '../core/theme';
import { button } from '../core/ui';
import { GUESTS, SPECIAL_GUESTS } from '../data/cats';
import { ELEMENT_ORDER, ELEMENTS } from '../data/elements';
import { CREAMS, ESSENCE_ORDER, ESSENCES, FILLINGS, FLAVORS, SHAPES, TOPPINGS } from '../data/ingredients';
import { guestsPerDay, MENU_CATEGORIES, STORY_DAYS } from '../data/schedule';
import { t } from '../data/strings';
import type { CreamId, FillingId, FlavorId, MenuCategory, MenuLists, ShapeId, ToppingId } from '../data/types';
import { openCafe } from '../game/flow';
import { progress, runtime, todaysMenu } from '../game/state';
import { drawCounter, drawHallBackground } from '../render/environment';
import { drawMenuItemIcon } from '../render/icons';
import { dimBackground, drawCoinCounter, drawSoundButtons } from './hud';

const PANEL = { x: 40, y: 64, w: 1200, h: 640 };
const NOTE_SIZE = 20;
/** The menu changes are laid out in this area (between the news and the button), in tiles as big as will fit. */
const MENU_AREA = { x: PANEL.x + 40, w: PANEL.w - 80, bottom: PANEL.y + PANEL.h - 92, minTop: PANEL.y + 128 };
/** Tile width is tried from `max` down to `min`; height = width × heightRatio. Icons fill a bit more of the tile than the old 74 px tile at scale 0.72 did. */
const MENU_TILE = { max: 160, min: 84, step: 4, gap: 12, heightRatio: 0.92, iconScalePerPixel: 0.88 / 74, maxLabelSize: 20 };
/** Two sections (new / resting) stand side by side, the columns as wide as their share of the tiles (within min..max). */
const SECTION = { titleHeight: 40, titleSize: 24, columnGap: 44, minShare: 0.3, maxShare: 0.7 };
const BADGE_SIZE = 13;

function menuItemName(category: MenuCategory, id: string): string {
  switch (category) {
    case 'shapes': return loc(SHAPES[id as ShapeId].name);
    case 'flavors': return loc(FLAVORS[id as FlavorId].name);
    case 'fillings': return loc(FILLINGS[id as FillingId].shortName);
    case 'creams': return loc(CREAMS[id as CreamId].name);
    case 'toppings': return loc(TOPPINGS[id as ToppingId].name);
  }
}

interface MenuTile { category: MenuCategory; id: string; badge: 'new' | 'again' | null }
interface MenuSection { title: string; tiles: MenuTile[]; isResting: boolean }

/**
 * Only what changed: day 1 shows the whole (new) menu; later days show what is new or back today
 * and what is resting today. Everything else is on the menu as yesterday.
 */
function menuSections(): MenuSection[] {
  const menu = todaysMenu();
  const collect = (lists: MenuLists, badge: (category: MenuCategory, id: string) => MenuTile['badge']): MenuTile[] =>
    MENU_CATEGORIES.flatMap(category => (lists[category] as string[]).map(id => ({ category, id, badge: badge(category, id) })));
  if (progress.day === 1) return [{ title: t().menuTitle, tiles: collect(menu, () => null), isResting: false }];
  const added: MenuLists = { shapes: [], flavors: [], fillings: [], creams: [], toppings: [] };
  for (const category of MENU_CATEGORIES) (added[category] as string[]) = [...menu.fresh[category], ...menu.returning[category]];
  const sections: MenuSection[] = [];
  const fresh = collect(added, (category, id) => ((menu.fresh[category] as string[]).includes(id) ? 'new' : 'again'));
  if (fresh.length) sections.push({ title: t().menuNewToday, tiles: fresh, isResting: false });
  const resting = collect(menu.resting, () => null);
  if (resting.length) sections.push({ title: t().menuRestingToday, tiles: resting, isResting: true });
  return sections;
}

interface MenuColumn { section: MenuSection; left: number; width: number }

/** One column per section across the menu area; with two sections the one with more tiles gets more room. */
function menuColumns(sections: MenuSection[]): MenuColumn[] {
  if (sections.length === 1) return [{ section: sections[0], left: MENU_AREA.x, width: MENU_AREA.w }];
  const [first, second] = sections, usable = MENU_AREA.w - SECTION.columnGap;
  const share = clamp(first.tiles.length / (first.tiles.length + second.tiles.length), SECTION.minShare, SECTION.maxShare);
  return [
    { section: first, left: MENU_AREA.x, width: usable * share },
    { section: second, left: MENU_AREA.x + usable * share + SECTION.columnGap, width: usable * (1 - share) },
  ];
}

const tilesPerRow = (columnWidth: number, w: number): number => Math.max(1, Math.floor((columnWidth + MENU_TILE.gap) / (w + MENU_TILE.gap)));

/** The biggest tile width at which every column fits into the area (`height` px tall). */
function fitTileWidth(columns: MenuColumn[], height: number): number {
  for (let w = MENU_TILE.max; w > MENU_TILE.min; w -= MENU_TILE.step) {
    const fits = columns.every(({ section, width }) =>
      SECTION.titleHeight + Math.ceil(section.tiles.length / tilesPerRow(width, w)) * (w * MENU_TILE.heightRatio + MENU_TILE.gap) <= height);
    if (fits) return w;
  }
  return MENU_TILE.min;
}

/** The sections in columns, each under its title, rows of tiles centred in the column. */
function drawMenuSections(top: number): void {
  const sections = menuSections();
  if (!sections.length) { drawText(t().menuSameAsYesterday, SCREEN_W / 2, top + 40, 22, TEXT.muted, 'center', 800); return; }
  const columns = menuColumns(sections);
  const w = fitTileWidth(columns, MENU_AREA.bottom - top), h = w * MENU_TILE.heightRatio;
  columns.forEach(({ section, left, width }, columnIndex) => {
    const centerX = left + width / 2, perRow = tilesPerRow(width, w), rowsTop = top + SECTION.titleHeight;
    drawTitle(section.title, centerX, top + SECTION.titleHeight / 2 - 4, SECTION.titleSize, section.isResting ? TEXT.muted : TEXT.main);
    if (columnIndex > 0) { // a faint divider between the columns
      ctx.fillStyle = 'rgba(159,234,255,0.18)'; ctx.fillRect(left - SECTION.columnGap / 2 - 1, top + 6, 2, MENU_AREA.bottom - top - 12);
    }
    section.tiles.forEach((tile, i) => {
      const row = Math.floor(i / perRow), inRow = Math.min(perRow, section.tiles.length - row * perRow);
      const rowLeft = centerX - (inRow * w + (inRow - 1) * MENU_TILE.gap) / 2;
      drawMenuTile(tile, rowLeft + (i % perRow) * (w + MENU_TILE.gap), rowsTop + row * (h + MENU_TILE.gap), w, h, section.isResting, i);
    });
  });
}

/** A tile: the item's picture and name, a "new" / "again" badge; resting items are dimmed. */
function drawMenuTile(tile: MenuTile, x: number, y: number, w: number, h: number, isResting: boolean, index: number): void {
  const lift = Math.sin(clock.time * 2 + index) * 2;
  ctx.save();
  if (isResting) ctx.globalAlpha = 0.5;
  ctx.fillStyle = 'rgba(255,255,255,0.08)'; roundRectPath(x, y + lift, w, h, 18); ctx.fill();
  if (tile.badge) { ctx.strokeStyle = tile.badge === 'new' ? 'rgba(255,156,230,0.85)' : 'rgba(159,234,255,0.75)'; ctx.lineWidth = 2.5; ctx.stroke(); }
  drawMenuItemIcon(tile.category, tile.id, x + w / 2, y + h * 0.4 + lift, w * MENU_TILE.iconScalePerPixel);
  drawFittedText(menuItemName(tile.category, tile.id), x + w / 2, y + h * 0.86 + lift, Math.min(MENU_TILE.maxLabelSize, w * 0.17), w - 8, TEXT.main, 'center', 800);
  ctx.restore();
  if (!tile.badge) return;
  const label = tile.badge === 'new' ? t().badgeNew : t().badgeAgain, color = tile.badge === 'new' ? '#ff6fb5' : '#36b8e0';
  ctx.font = font(BADGE_SIZE, 900);
  const badgeW = ctx.measureText(label).width + 14, badgeX = x + w - badgeW + 6;
  ctx.save();
  ctx.shadowColor = color; ctx.shadowBlur = 10;
  ctx.fillStyle = color; roundRectPath(badgeX, y - 11 + lift, badgeW, 22, 11); ctx.fill();
  ctx.restore();
  drawText(label, badgeX + badgeW / 2, y + lift, BADGE_SIZE, '#fff', 'center', 900);
}

/** Short notes about what's new today (the basics are taught by the tutorial). */
function todaysNews(day: number): string[] {
  const notes: string[] = [];
  const newGuests = [...GUESTS, ...SPECIAL_GUESTS].filter(cat => cat.firstDay === day && day > 1).map(cat => loc(cat.name));
  if (newGuests.length) notes.push(t().newGuestsNote(newGuests));
  const newEssences = ESSENCE_ORDER.filter(e => ESSENCES[e].unlockDay === day && day > 1);
  if (newEssences.length) notes.push(t().newEssenceNote(newEssences.map(e => loc(ESSENCES[e].name))));
  for (const element of ELEMENT_ORDER) {
    const def = ELEMENTS[element];
    if (def.unlockDay === day && day > 1) notes.push(t().newElementNote(loc(def.name), loc(def.signName)));
  }
  if (day === STORY_DAYS) notes.push(t().queenRumorNote);
  return notes;
}

export function renderDayStart(): void {
  const time = clock.time, day = progress.day;
  const { x, y, w, h } = PANEL;
  drawHallBackground(time); drawCounter(time); drawMotes();
  dimBackground();
  withPopIn(runtime.sceneStartTime, SCREEN_W / 2, SCREEN_H / 2, () => {
    drawPanel(x, y, w, h);
    drawTitle(t().dayTitle(day), SCREEN_W / 2, y + 46, 44, TEXT.main);
    drawText(day <= STORY_DAYS ? t().storyDaySubtitle(STORY_DAYS, guestsPerDay(day)) : t().endlessDaySubtitle(guestsPerDay(day)),
      SCREEN_W / 2, y + 88, 19, TEXT.muted, 'center', 800);

    let textY = y + 124;
    for (const note of todaysNews(day)) {
      for (const line of wrapText(note, w - 120, NOTE_SIZE, 700)) { drawText(line, SCREEN_W / 2, textY, NOTE_SIZE, TEXT.main, 'center', 700); textY += 28; }
    }

    drawMenuSections(Math.max(MENU_AREA.minTop, textY + 4));
    button('openCafe', SCREEN_W / 2 - 160, y + h - 76, 320, 64, t().openCafe, { color: BUTTON_COLOR.confirm, fontSize: 23, glow: true, onClick: openCafe });
  });
  drawCoinCounter(16, 12);
  drawSoundButtons(SCREEN_W - 124, 16);
}
