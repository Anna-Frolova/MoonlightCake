// Now and then a guest says a word about the cake while it is made ("I wanted another colour"), in a bubble beside
// their window. Experimental: to remove it, set GUEST_COMMENTS.enabled to false.
import { clock } from '../core/clock';
import { pickRandom } from '../core/math';
import { t } from '../data/strings';
import type { GuestCommentTopic } from '../data/types';
import { runtime, type Customer } from './state';

/** Chance of a comment on a wrong and on a praised right choice, the limit per guest, the pause between comments, seconds on screen. */
export const GUEST_COMMENTS = { enabled: true, wrongChance: 0.25, rightChance: 0.06, perGuest: 2, pauseSeconds: 15, showSeconds: 3.2 };

let comment: { text: string; startTime: number } | null = null;
let madeForGuest = 0;
let lastTime = -Infinity;

/** The guest may remark on a choice; the tutorial guest stays quiet (the hints do the talking). */
export function maybeComment(customer: Customer, topic: GuestCommentTopic, isRight: boolean): void {
  const { enabled, wrongChance, rightChance, perGuest, pauseSeconds } = GUEST_COMMENTS;
  if (!enabled || customer.isTutorial || runtime.modal || madeForGuest >= perGuest || clock.time - lastTime < pauseSeconds) return;
  if (Math.random() >= (isRight ? rightChance : wrongChance)) return;
  comment = { text: pickRandom(t().guestComments[topic](customer.cat.voice === 'female')), startTime: clock.time };
  madeForGuest++;
  lastTime = clock.time;
}

/** The comment on screen now and when it appeared, or null. */
export function currentComment(): { text: string; startTime: number } | null {
  if (comment && clock.time - comment.startTime > GUEST_COMMENTS.showSeconds) comment = null;
  return comment;
}

/** A new guest starts with a clean slate. */
export function resetGuestComment(): void {
  comment = null;
  madeForGuest = 0;
  lastTime = -Infinity;
}
