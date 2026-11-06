// EXPERIMENTAL: once a day one ordinary guest changes their mind halfway through the order — asks for another
// cream, one more topping or different magic (never another glaze colour) — and pays a big bonus if the
// player gets the change right. Turn it off with ORDER_CHANGE.enabled.
import { sfx } from '../audio/sfx';
import { clock } from '../core/clock';
import { loc } from '../core/language';
import { pickRandom, randomInt } from '../core/math';
import { SPECIAL_GUESTS, STORY_GUESTS } from '../data/cats';
import { ELEMENTS } from '../data/elements';
import { CREAMS, TOPPINGS } from '../data/ingredients';
import { PALETTES } from '../data/palettes';
import { t } from '../data/strings';
import type { Order, QueuedGuest, ToppingId } from '../data/types';
import { showModal } from '../scenes/sceneManager';
import { countLayers, CREAM_DONE_COVERAGE } from './cake';
import { react } from './guestReactions';
import { availableElements, progress, runtime, todaysMenu, type Customer } from './state';

/**
 * `delaySeconds`: how long after the cream is piped the guest speaks up; they get `extraPatienceSeconds` more
 * to wait; the order card glows for `highlightSeconds` after the player read the request.
 */
export const ORDER_CHANGE = { enabled: true, delaySeconds: 2.5, extraPatienceSeconds: 60, highlightSeconds: 6 };
/** An added topping comes in this many pieces. */
const ADDED_TOPPINGS = { min: 1, max: 2 };

/** What the guest changes; named like the score parts, so the bonus checks that part of the cake. */
export type OrderChangeKind = 'cream' | 'toppings' | 'magic';
export interface OrderChange { kind: OrderChangeKind; readAt: number | null }

/** A stable number 0..n-1 for the day (the same after a reload), so the day's changing guest doesn't move. */
function dayPick(n: number): number {
  const mixed = Math.imul(progress.seed ^ Math.imul(progress.day, 0x9e3779b1), 0x85ebca6b) >>> 0;
  return mixed % n;
}

/** Is the guest at `index` today's guest who will change their order? Never the tutorial, special or story guests, or the queen. */
export function changesOrderToday(queue: readonly QueuedGuest[], index: number): boolean {
  if (!ORDER_CHANGE.enabled) return false;
  const ordinary = queue.map((guest, i) => ({ guest, i }))
    .filter(({ guest }) => !guest.tutorial && guest.cat !== 'queen' && ![...SPECIAL_GUESTS, ...STORY_GUESTS].some(cat => cat.id === guest.cat))
    .map(({ i }) => i);
  return ordinary.length > 0 && ordinary[dayPick(ordinary.length)] === index;
}

/** The change itself, or null if today's menu leaves nothing to change into. Also returns what the guest says. */
function makeChange(customer: Customer): { order: Order; kind: OrderChangeKind; line: string } | null {
  const order = customer.order, menu = todaysMenu(), isShe = customer.cat.voice === 'female';
  const options: (() => { order: Order; kind: OrderChangeKind; line: string })[] = [];
  const creams = menu.creams.filter(cream => cream !== order.cream);
  if (creams.length) options.push(() => {
    const cream = pickRandom(creams);
    return { order: { ...order, cream }, kind: 'cream', line: t().orderChangeCream(loc(CREAMS[cream].name), isShe) };
  });
  const newToppings = menu.toppings.filter(topping => !order.toppings[topping]);
  if (newToppings.length) options.push(() => {
    const matching = newToppings.filter(topping => PALETTES[order.palette].toppings.includes(topping));
    const topping: ToppingId = pickRandom(matching.length ? matching : newToppings), count = randomInt(ADDED_TOPPINGS.min, ADDED_TOPPINGS.max);
    return { order: { ...order, toppings: { ...order.toppings, [topping]: count } }, kind: 'toppings', line: t().orderChangeTopping(loc(TOPPINGS[topping].name), count, isShe) };
  });
  const elements = availableElements().filter(element => element !== order.element);
  if (elements.length) options.push(() => {
    const element = pickRandom(elements);
    return { order: { ...order, element }, kind: 'magic', line: t().orderChangeMagic(loc(ELEMENTS[element].name), isShe) };
  });
  return options.length ? pickRandom(options)() : null;
}

/**
 * Counts down once the cream is piped (called every frame), then the guest asks for the change. Waits while the
 * player is in the middle of a gesture, so nothing they are holding gets lost.
 */
export function updateOrderChange(dt: number): void {
  const customer = runtime.customer, cake = runtime.cake;
  if (!customer?.changesOrder || customer.orderChange || customer.state !== 'waiting' || !cake) return;
  if (runtime.scene !== 'kitchen' || runtime.fade || runtime.modal || runtime.isServing) return;
  if (!countLayers(cake) || cake.creamCoverage < CREAM_DONE_COVERAGE) return;
  customer.changeCountdown += dt;
  const isBusy = runtime.isPipingCream || runtime.draggedTopping || runtime.heldPotion || runtime.magicStroke || runtime.autoCreamTime !== null;
  if (customer.changeCountdown < ORDER_CHANGE.delaySeconds || isBusy) return;
  const change = makeChange(customer);
  customer.changesOrder = false;
  if (!change) return;
  customer.order = change.order;
  customer.orderPicture = null; // redrawn with the change
  customer.orderChange = { kind: change.kind, readAt: null };
  if (customer.patience !== null) customer.patience += ORDER_CHANGE.extraPatienceSeconds;
  react('surprised');
  sfx.meow(customer.cat.voicePitch, 'neutral', customer.cat.voice);
  showModal(change.line, t().orderChangeOk, null, () => { customer.orderChange!.readAt = clock.time; }, false, loc(customer.cat.name));
}

/** 0..1: how strongly the order card glows after the change was read (0 when there is nothing to show). */
export function orderChangeGlow(customer: Customer): number {
  const readAt = customer.orderChange?.readAt;
  if (readAt == null) return 0;
  return Math.max(0, 1 - (clock.time - readAt) / ORDER_CHANGE.highlightSeconds);
}
