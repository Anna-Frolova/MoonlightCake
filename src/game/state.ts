// Global game state, split into two objects:
//  • `progress` — what gets saved (day, coins, purchases, menu…)
//  • `runtime`  — what only lives while the page is open (current scene, cake being built, animations…)
import type { Vec2 } from '../core/math';
import { ELEMENT_ORDER, ELEMENTS } from '../data/elements';
import { CREAMS, ESSENCES, GLAZE_COLORS } from '../data/ingredients';
import { SHOP_ITEMS } from '../data/shop';
import type {
  Cake, CatDef, CreamId, ElementId, EssenceId, GlazeColorDef, KitchenThemeId, Mood, Order, SaveData, ShopItemId, ToppingId,
} from '../data/types';
import { buildDailyMenu } from './dailyMenu';
import { createNewSave, loadSave, writeSave } from './save';
import type { CakeScore } from './scoring';

// ---------------- saved progress ----------------

export const progress: SaveData = loadSave() ?? createNewSave();
ensureMenuForToday();

export function ensureMenuForToday(): void {
  if (!progress.menu || progress.menu.day !== progress.day) progress.menu = buildDailyMenu(progress.day, null, progress.seed);
  // a menu saved before every cream became available from day 1: give it the full list right away
  const allCreams = Object.keys(CREAMS) as CreamId[];
  if (progress.menu.creams.length < allCreams.length) progress.menu.creams = allCreams;
}

/** Replaces the whole progress object's contents (new game) while keeping the same reference. */
export function resetProgress(fresh: SaveData): void {
  Object.assign(progress, fresh);
}

export const saveProgress = (): void => writeSave(progress);
export const isOwned = (item: ShopItemId): boolean => !!progress.owned[item];

// What can be used today
export const todaysMenu = () => progress.menu!;
export const availableEssences = (): EssenceId[] => (Object.keys(ESSENCES) as EssenceId[]).filter(e => ESSENCES[e].unlockDay <= progress.day);
/** Everyday elements open today (the special guests' magic is only for them). */
export const availableElements = (): ElementId[] => ELEMENT_ORDER.filter(e => ELEMENTS[e].unlockDay <= progress.day);
/** Glaze colours that can be mixed from today's essences. */
export const availableGlazeColors = (): GlazeColorDef[] => {
  const essences = availableEssences();
  return GLAZE_COLORS.filter(color => (Object.keys(color.recipe) as EssenceId[]).every(e => essences.includes(e)));
};
/** Sum of tip bonuses from purchased decor. */
export const decorTipBonus = (): number => SHOP_ITEMS.reduce((sum, item) => sum + (item.tipBonus && isOwned(item.id) ? item.tipBonus : 0), 0);

// ---------------- runtime-only state ----------------

export type SceneId = 'title' | 'dayStart' | 'hall' | 'kitchen' | 'dayEnd' | 'finale' | 'shop';
/** Kitchen stations in order: layers → cream → glaze → toppings → magic. */
export type StationIndex = 0 | 1 | 2 | 3 | 4;

export type CustomerState = 'entering' | 'ordering' | 'waiting' | 'judging' | 'reacting' | 'leaving';

export interface Customer {
  cat: CatDef;
  order: Order;
  greeting: string;
  state: CustomerState;
  x: number;
  /** Seconds in the current visit (drives the walking bob and the judging pause). */
  time: number;
  mood: Mood;
  speech: { text: string; visibleChars: number } | null;
  /** Seconds since the speech finished typing while ordering (the order card pops in). */
  orderShownFor: number;
  /** Seconds since the reaction started (hearts appear one by one). */
  reactionTime: number;
  score: CakeScore | null;
  servedCake: Cake | null;
  hasPaid: boolean;
  /** Picture of the ordered cake, built once. */
  orderPicture: Cake | null;
  /** How many seconds the guest waits for the cake before running out of patience (null = no hurry, tutorial). */
  patience: number | null;
  /** Seconds spent waiting while the cake is being made. */
  waitTime: number;
  /** When the guest last got grumpier (makes the portrait wobble). */
  moodChangedAt: number;
}

export interface RuntimeState {
  scene: SceneId;
  sceneStartTime: number;
  fade: { alpha: number; direction: 1 | -1; onMidpoint: () => void } | null;
  toast: { text: string; remaining: number; startTime: number } | null;
  modal: { text: string; confirmLabel: string; cancelLabel: string; danger?: boolean; onConfirm: () => void; startTime: number } | null;
  shake: number;
  displayedCoins: number;
  coinBump: number;
  lastHoveredButton: string | null;
  lastHoverSoundTime: number;
  shopTab: 'decor' | 'helpers';

  customer: Customer | null;
  /** Bottom of the speech bubble — buttons are placed under it. */
  speechBubbleBottom: number;

  // ---- kitchen ----
  cake: Cake | null;
  station: StationIndex;
  isServing: boolean;
  selectedCream: CreamId | null;
  isPipingCream: boolean;
  lastSquishTime: number;
  /** Helper piping the cream automatically: seconds since it started. */
  autoCreamTime: number | null;
  draggedTopping: { topping: ToppingId; x: number; y: number; fromCake: boolean } | null;
  /** Tray slots this frame (the toppings station registers them while drawing). */
  toppingTray: { x: number; y: number; w: number; h: number; topping: ToppingId }[];
  helperKittenJump: number;
  heldPotion: { essence: EssenceId; x: number; y: number; grabOffsetX: number; grabOffsetY: number } | null;
  pouringPotion: { essence: EssenceId; time: number; startX: number; startY: number; dropAdded: boolean } | null;
  returningPotion: { essence: EssenceId; startX: number; startY: number; time: number } | null;
  glazeArc: { startTime: number; color: string } | null;
  /** 0 → normal kitchen, 1 → glaze station layout (cake moved aside). Animated. */
  glazeLayoutBlend: number;
  cakeX: number;
  cakeScale: number;
  magicStroke: { points: Vec2[]; lastSoundTime: number } | null;
  fadingStroke: { points: Vec2[]; startTime: number; color: string } | null;
  /** 0 → ordinary kitchen, 1 → fully transformed for the special guest. Animated. */
  kitchenThemeBlend: number;
}

export const runtime: RuntimeState = {
  scene: 'title', sceneStartTime: 0, fade: null, toast: null, modal: null, shake: 0,
  displayedCoins: progress.coins, coinBump: 0, lastHoveredButton: null, lastHoverSoundTime: 0, shopTab: 'decor',
  customer: null, speechBubbleBottom: 330,
  cake: null, station: 0, isServing: false, selectedCream: null, isPipingCream: false, lastSquishTime: 0, autoCreamTime: null,
  draggedTopping: null, toppingTray: [], helperKittenJump: 0,
  heldPotion: null, pouringPotion: null, returningPotion: null, glazeArc: null,
  glazeLayoutBlend: 0, cakeX: 760, cakeScale: 1,
  magicStroke: null, fadingStroke: null, kitchenThemeBlend: 0,
};

/** The special guest's theme while they are in the café (from walking in until they turn to leave), or null. */
export function activeGuestTheme(): KitchenThemeId | null {
  const customer = runtime.customer;
  if (!customer?.cat.special || customer.state === 'leaving') return null;
  return runtime.scene === 'hall' || runtime.scene === 'kitchen' ? customer.cat.special.theme : null;
}
