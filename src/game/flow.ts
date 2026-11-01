// The game loop on a larger scale: days, guests, serving, paying and the shop.
import { setBusEnabled } from '../audio/engine';
import { restartMusic } from '../audio/music';
import { sfx } from '../audio/sfx';
import { language, loc, setLanguage, type Language } from '../core/language';
import { pickRandom, randomInt } from '../core/math';
import { burst } from '../core/particles';
import { clock } from '../core/clock';
import { pointer } from '../core/ui';
import { catById, GUESTS, SPECIAL_GUESTS } from '../data/cats';
import { guestsPerDay, STORY_DAYS } from '../data/schedule';
import { t } from '../data/strings';
import type { CatId, QueuedGuest, ShopItemDef } from '../data/types';
import { goToScene, showModal, showToast } from '../scenes/sceneManager';
import { countLayers, CREAM_DONE_COVERAGE } from './cake';
import { buildDailyMenu } from './dailyMenu';
import { catLine, pickWithoutRepeat } from './lines';
import { canTakeOrder, generateOrder } from './orders';
import { createNewSave } from './save';
import { patienceLeft, patienceSeconds } from './patience';
import { scoreCake } from './scoring';
import { resetTutorial } from './tutorial';
import { resetGuestReactions } from './guestReactions';
import { decorTipBonus, isOwned, progress, resetProgress, runtime, saveProgress } from './state';
import { setUpKitchen } from '../kitchen/kitchen';

/** Where guests appear from (off-screen right) and where they stand at the counter. */
export const GUEST_ENTRY_X = 1480;
export const GUEST_COUNTER_X = 640;
/** Last day the queue gets a royal visit. */
const ROYAL_VISIT_DAY = STORY_DAYS;
/** Special guests come from this day on: one a day in the story, two a day in endless mode. */
const SPECIAL_GUESTS_FROM_DAY = 2;
const SPECIAL_GUESTS_PER_DAY = { story: 1, endless: 2 };
/** Cream coverage below which serving asks "serve without cream?". */
const CREAM_MISSING_COVERAGE = 0.3;
/** A guest leaving with at least this many hearts meows goodbye; after 5 hearts they purr this long. */
const GOODBYE_MEOW_HEARTS = 3;
const PERFECT_PURR_SECONDS = 2.2;

/** Today's guests in order: random regulars (never the same one twice in a row), plus scripted ones. */
function buildGuestQueue(day: number): QueuedGuest[] {
  const storyDay = Math.min(day, STORY_DAYS), count = guestsPerDay(day);
  // picky guests stay home on days when the menu can't make their kind of cake
  const pool = GUESTS.filter(cat => cat.firstDay <= storyDay && canTakeOrder(cat)).map(cat => cat.id);
  const queue: QueuedGuest[] = [];
  let previous: string | null = null;
  while (queue.length < count) {
    const id = pickRandom(pool.filter(candidate => candidate !== previous));
    queue.push({ cat: id });
    previous = id;
  }
  if (day === 1) { // two tutorial guests first
    queue[0] = { cat: 'pushinka', tutorial: 1 };
    queue[1] = { cat: 'barsyk', tutorial: 2 };
    if (queue[2].cat === 'barsyk') queue[2] = { cat: 'lihtaryk' };
  }
  if (day === ROYAL_VISIT_DAY) queue[count - 1] = { cat: 'queen' };
  // special guests take random places in the middle of the day (never the first or the last guest)
  const free = Array.from({ length: count - 2 }, (_, i) => i + 1);
  for (const id of pickSpecialGuests(day)) {
    const [index] = free.splice(randomInt(0, free.length - 1), 1);
    queue[index] = { cat: id };
  }
  return queue;
}

/** Today's special guests: one who visits for the first time today comes for sure, the rest are random. */
function pickSpecialGuests(day: number): CatId[] {
  if (day < SPECIAL_GUESTS_FROM_DAY) return [];
  const unlocked = SPECIAL_GUESTS.filter(cat => cat.firstDay <= Math.min(day, STORY_DAYS));
  const count = Math.min(unlocked.length, day > STORY_DAYS ? SPECIAL_GUESTS_PER_DAY.endless : SPECIAL_GUESTS_PER_DAY.story);
  const chosen = unlocked.filter(cat => cat.firstDay === day).map(cat => cat.id);
  while (chosen.length < count) chosen.push(pickRandom(unlocked.filter(cat => !chosen.includes(cat.id))).id);
  return chosen.slice(0, count);
}

export function hasProgressWorthContinuing(): boolean {
  return progress.day > 1 || progress.guestIndex > 0 || progress.phase !== 'dayStart' || progress.coins > 0;
}

export function startNewGame(): void {
  const { musicOn, soundOn } = progress;
  resetProgress({ ...createNewSave(), musicOn, soundOn });
  resetTutorial();
  progress.menu = buildDailyMenu(1, null, progress.seed);
  saveProgress();
  runtime.displayedCoins = 0;
  goToScene('dayStart');
}

export function continueGame(): void {
  runtime.displayedCoins = progress.coins;
  switch (progress.phase) {
    case 'inDay':
      goToScene('hall', () => {
        if (!progress.guestQueue) progress.guestQueue = buildGuestQueue(progress.day);
        spawnNextGuest();
      });
      break;
    case 'dayEnd': goToScene('dayEnd'); break;
    case 'shop': goToScene('shop'); break;
    default: goToScene('dayStart');
  }
}

export function openCafe(): void {
  if (!progress.guestQueue) progress.guestQueue = buildGuestQueue(progress.day);
  progress.phase = 'inDay';
  saveProgress();
  goToScene('hall', spawnNextGuest);
}

export function spawnNextGuest(): void {
  const queue = progress.guestQueue!;
  if (progress.guestIndex >= queue.length) { endDay(); return; }
  const next = queue[progress.guestIndex], cat = catById(next.cat), order = generateOrder(cat, progress.day, next.tutorial);
  runtime.customer = {
    cat, order, greeting: catLine(cat, 'hello'),
    state: 'entering', x: GUEST_ENTRY_X, time: 0, mood: 'neutral', speech: null,
    orderShownFor: 0, reactionTime: 0, score: null, servedCake: null, hasPaid: false, orderPicture: null,
    // the tutorial guests are in no hurry
    patience: next.tutorial ? null : patienceSeconds(order), waitTime: 0, moodChangedAt: 0,
  };
  runtime.cake = null;
  runtime.isServing = false;
  resetGuestReactions();
  if (cat.special) sfx.specialArrival(cat.special.theme);
}

/** Starts the guest's speech bubble typing out `text`. */
export function say(text: string): void {
  if (runtime.customer) runtime.customer.speech = { text, visibleChars: 0 };
}

export function acceptOrder(): void {
  const customer = runtime.customer;
  if (!customer || customer.state !== 'ordering') return;
  customer.state = 'waiting';
  goToScene('kitchen', setUpKitchen);
}

/** "Serve" button: warns about unfinished steps first. */
export function serveCake(): void {
  const cake = runtime.cake;
  if (!cake || runtime.isServing) return;
  if (!countLayers(cake)) { showToast(t().needAnyLayer); sfx.fail(); return; }
  const missing: string[] = [];
  if (cake.creamCoverage < CREAM_MISSING_COVERAGE) missing.push(t().missingCream);
  if (!cake.glaze) missing.push(t().missingGlaze);
  if (!cake.toppings.length) missing.push(t().missingToppings);
  if (cake.magicQuality === null) missing.push(t().missingMagic);
  if (missing.length) {
    showModal(t().serveAnyway(missing), t().serve, t().keepWorking, handOverCake);
    sfx.tab();
  } else handOverCake();
}

function handOverCake(): void {
  const customer = runtime.customer, cake = runtime.cake;
  if (runtime.isServing || !customer || !cake) return;
  runtime.isServing = true;
  customer.score = scoreCake(cake, customer.order, customer.cat, decorTipBonus(), customer.patience === null ? null : patienceLeft(customer));
  customer.servedCake = cake;
  customer.state = 'judging';
  customer.time = 0;
  customer.mood = 'thinking';
  runtime.draggedTopping = null;
  runtime.isPipingCream = false;
  goToScene('hall', () => say(pickWithoutRepeat('thinking:' + language(), t().thinking)));
}

/** Adds the guest's payment to the coins and stats (once). */
export function collectPayment(): void {
  const customer = runtime.customer;
  if (!customer || customer.hasPaid || !customer.score) return;
  customer.hasPaid = true;
  const { net, hearts } = customer.score;
  progress.coins = Math.max(0, progress.coins + net);
  if (net > 0) runtime.coinBump = 1;
  const stats = progress.dayStats;
  stats.earned += net; stats.served++; stats.hearts += hearts; stats.bestHearts = Math.max(stats.bestHearts, hearts);
  progress.totals.served++; progress.totals.hearts += hearts; progress.totals.earned += Math.max(0, net);
  progress.guestIndex++;
  saveProgress();
}

export function sendGuestAway(): void {
  const customer = runtime.customer;
  if (!customer || customer.state !== 'reacting') return;
  customer.state = 'leaving';
  customer.speech = null;
  // a happy guest meows goodbye; after a perfect cake they also purr for a while
  const hearts = customer.score?.hearts ?? 0;
  if (hearts >= GOODBYE_MEOW_HEARTS) {
    customer.mood = 'happy';
    sfx.meow(customer.cat.voicePitch, 'happy');
  }
  if (hearts === 5) {
    sfx.purr(customer.cat.voicePitch, PERFECT_PURR_SECONDS, 0.4);
    runtime.purrUntil = clock.time + PERFECT_PURR_SECONDS;
  }
}

/**
 * The guest ran out of patience: back to the hall, where they throw the unfinished cake at the screen
 * (or just leave if there is no cake yet). They don't pay, and the day moves on to the next guest.
 */
export function loseGuestPatience(): void {
  const customer = runtime.customer, cake = runtime.cake;
  if (!customer || customer.state !== 'waiting' || runtime.isServing) return;
  runtime.isServing = true;
  const hasCake = !!cake && countLayers(cake) > 0;
  customer.servedCake = hasCake ? cake : null;
  customer.state = 'storming';
  customer.time = 0;
  customer.mood = 'angry';
  runtime.draggedTopping = null;
  runtime.isPipingCream = false;
  runtime.magicStroke = null;
  runtime.modal = null;
  sfx.meow(customer.cat.voicePitch, 'sad');
  goToScene('hall', () => {
    progress.guestIndex++; // gone for good, even if the page is reloaded now
    saveProgress();
    say(pickWithoutRepeat((hasCake ? 'stormWithCake:' : 'stormNoCake:') + language(), hasCake ? t().stormWithCake : t().stormNoCake));
  });
}

export function isLastGuestOfDay(): boolean {
  return progress.guestIndex >= (progress.guestQueue?.length ?? 0);
}

function endDay(): void {
  progress.phase = 'dayEnd';
  saveProgress();
  runtime.customer = null;
  goToScene('dayEnd');
}

export function goToShop(): void {
  progress.phase = 'shop';
  saveProgress();
  goToScene('shop');
}

export function showFinale(): void {
  goToScene('finale');
}

export function finishFinale(): void {
  progress.finaleSeen = true;
  goToShop();
}

export function startNextDay(): void {
  progress.day++;
  progress.phase = 'dayStart';
  progress.guestIndex = 0;
  progress.guestQueue = null;
  progress.dayStats = { earned: 0, served: 0, hearts: 0, bestHearts: 0 };
  progress.menu = buildDailyMenu(progress.day, progress.menu, progress.seed);
  saveProgress();
  goToScene('dayStart');
}

export function buyItem(item: ShopItemDef): void {
  if (isOwned(item.id)) return;
  if (progress.coins < item.price) { showToast(t().notEnoughCoins); sfx.fail(); return; }
  progress.coins -= item.price;
  progress.owned[item.id] = true;
  saveProgress();
  sfx.buy();
  burst(pointer.x, pointer.y, 28, ['#ffd84a', '#ff9ce6', '#9feaff', '#fff'], { kind: 'star', gravity: 120 });
  showToast(t().bought(loc(item.name)));
}

export function setMusicOn(on: boolean): void {
  progress.musicOn = on;
  setBusEnabled('music', on);
  if (on) restartMusic();
  saveProgress();
}

export function setSoundOn(on: boolean): void {
  progress.soundOn = on;
  setBusEnabled('sfx', on);
  saveProgress();
}

/** True when every step of the cake is done — the serve button glows. */
export function isCakeReady(): boolean {
  const cake = runtime.cake;
  return !!cake && countLayers(cake) > 0 && cake.creamCoverage >= CREAM_DONE_COVERAGE && !!cake.glaze
    && cake.toppings.length > 0 && cake.magicQuality !== null;
}

export const askStartNewGame = (): void =>
  showModal(t().confirmNewGame, t().start, t().cancel, startNewGame, true);


/** Language switch on the title screen. */
export function switchLanguage(lang: Language): void {
  setLanguage(lang);
  document.title = t().gameTitle;
}
