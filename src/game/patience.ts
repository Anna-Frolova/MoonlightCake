// How long a guest waits for their cake. Patience stays full for a calm stretch, then drains;
// the guest's face in the kitchen shows it, and serving late costs the "speed" part of the score.
import { sfx } from '../audio/sfx';
import { clock } from '../core/clock';
import { clamp } from '../core/math';
import type { Mood, Order } from '../data/types';
import { totalToppingCount } from './orders';
import { runtime, type Customer } from './state';

/** Seconds a guest waits for an order: bigger cakes get more time. The first `calmShare` of it patience stays full. */
const PATIENCE = { baseSeconds: 70, perLayerSeconds: 12, perToppingSeconds: 3, calmShare: 0.45 };
/** Below these levels the guest looks impatient, then upset. */
export const PATIENCE_LEVELS = { impatient: 0.5, upset: 0.2 };

export const patienceSeconds = (order: Order): number =>
  PATIENCE.baseSeconds + order.layerCount * PATIENCE.perLayerSeconds + totalToppingCount(order) * PATIENCE.perToppingSeconds;

/** 1 = perfectly patient … 0 = out of patience. Always 1 for guests in no hurry. */
export function patienceLeft(customer: Customer): number {
  if (customer.patience === null) return 1;
  const calm = customer.patience * PATIENCE.calmShare;
  return clamp(1 - (customer.waitTime - calm) / (customer.patience - calm), 0, 1);
}

/**
 * The patience bar: drains steadily from the moment the order is taken (1 → 0 over the whole wait), so the
 * player sees right away how much time they have. Always full for guests in no hurry.
 */
export function patienceBarValue(customer: Customer): number {
  return customer.patience === null ? 1 : clamp(1 - customer.waitTime / customer.patience, 0, 1);
}

/** Where on the bar the calm stretch ends: past this mark the guest starts losing their good mood (and the speed score). */
export const PATIENCE_CALM_MARK = 1 - PATIENCE.calmShare;

/** The face that goes with the patience left. */
export function patienceMood(customer: Customer): Mood {
  const left = patienceLeft(customer);
  if (customer.patience === null) return 'happy';
  return left < PATIENCE_LEVELS.upset ? 'sad' : left < PATIENCE_LEVELS.impatient ? 'thinking' : 'neutral';
}

/**
 * Counts the wait while the cake is made (called every frame); the guest meows when getting grumpier.
 * Returns true on the frame the guest runs out of patience.
 */
export function updatePatience(dt: number): boolean {
  const customer = runtime.customer;
  if (!customer || customer.state !== 'waiting' || runtime.scene !== 'kitchen' || runtime.fade || runtime.modal || runtime.isServing) return false;
  const before = patienceMood(customer);
  customer.waitTime += dt;
  const after = patienceMood(customer);
  if (after !== before) {
    customer.moodChangedAt = clock.time;
    sfx.meow(customer.cat.voicePitch, 'sad');
  }
  return customer.patience !== null && customer.waitTime >= customer.patience;
}
