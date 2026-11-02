// The guest in the kitchen window follows the player: looks where they work and reacts to their choices
// (surprised by the wrong cream or magic, worried by other wrong ingredients, pleased by the right ones).
// Every choice is also heard: a bright "mrrp!" for a right one, a low grumble for a wrong one, in the guest's own voice.
import { sfx } from '../audio/sfx';
import { clock } from '../core/clock';
import { clamp } from '../core/math';
import type { Mood } from '../data/types';
import { runtime } from './state';

export type GuestReaction = 'surprised' | 'worried' | 'pleased';

/** Seconds the guest keeps looking at the last thing the player touched before looking back at them. */
const GAZE_HOLD_SECONDS = 1.8;
/** How quickly the eyes move to a new target (share of the way per second). */
const GAZE_SPEED = 9;
/** A target this far from the guest's head (px) is looked at with the eyes turned all the way. */
const GAZE_FULL_DISTANCE = 260;
/** Resting gaze: at the player, a little down (towards the cake area under the window). */
const GAZE_REST = { x: 0.15, y: 0.2 };
/** How long each reaction face stays. */
const REACTION_SECONDS: Record<GuestReaction, number> = { surprised: 1.9, worried: 1.6, pleased: 1.3 };
/** The face shown for each reaction; a pleased guest picks one of PLEASED_MOODS each time. */
const REACTION_MOOD: Record<Exclude<GuestReaction, 'pleased'>, Mood> = { surprised: 'surprised', worried: 'thinking' };
const PLEASED_MOODS: Mood[] = ['content', 'delighted'];
/** A right choice pleases the guest only now and then, so it stays a nice surprise. */
const PLEASED_CHANCE = 0.4;
/** Several quick choices (toppings dropped one after another) get one sound per this many seconds. */
const VOICE_INTERVAL = 0.3;
/** A surprised grumble is a little higher than a worried one. */
const SURPRISED_VOICE = 1.1;
let lastVoiceTime = -Infinity;

const gaze = { targetX: 0, targetY: 0, since: -Infinity, x: GAZE_REST.x, y: GAZE_REST.y };
let reaction: { kind: GuestReaction; startTime: number; mood: Mood } | null = null;

const isWaitingGuest = (): boolean => runtime.scene === 'kitchen' && runtime.customer?.state === 'waiting';

/** The guest glances at a point on the screen (where the player just tapped or is dragging). */
export function lookAt(x: number, y: number): void {
  if (!isWaitingGuest()) return;
  gaze.targetX = x; gaze.targetY = y; gaze.since = clock.time;
}

/** Shows a reaction face for a moment; surprise also jolts the window and gets a puzzled "mrr?". */
export function react(kind: GuestReaction): void {
  const customer = runtime.customer;
  if (!customer || !isWaitingGuest()) return;
  reaction = { kind, startTime: clock.time, mood: kind === 'pleased' ? PLEASED_MOODS[Math.floor(Math.random() * PLEASED_MOODS.length)] : REACTION_MOOD[kind] };
  if (kind !== 'pleased') customer.moodChangedAt = clock.time;
}

/** The guest's chirp or grumble over a choice (at most one per VOICE_INTERVAL). */
function voiceChoice(isRight: boolean, whenWrong: Exclude<GuestReaction, 'pleased'>): void {
  const cat = runtime.customer?.cat;
  if (!cat || !isWaitingGuest() || clock.time - lastVoiceTime < VOICE_INTERVAL) return;
  lastVoiceTime = clock.time;
  sfx.meow(cat.voicePitch * (!isRight && whenWrong === 'surprised' ? SURPRISED_VOICE : 1), isRight ? 'chirp' : 'grumble', cat.voice);
}

/**
 * Wrong → the given worried / surprised face. Right → sometimes (PLEASED_CHANCE) a pleased face, and only
 * when `praise` is set (not for every small step). Either way the guest makes a sound, so the player can tell by ear.
 */
export function judgeChoice(isRight: boolean, whenWrong: Exclude<GuestReaction, 'pleased'>, praise = false): void {
  voiceChoice(isRight, whenWrong);
  if (!isRight) react(whenWrong);
  else if (praise && Math.random() < PLEASED_CHANCE) react('pleased');
}

/** The current reaction, or null once it has passed. */
export function currentReaction(): GuestReaction | null {
  if (!reaction || clock.time - reaction.startTime > REACTION_SECONDS[reaction.kind]) return null;
  return reaction.kind;
}

/** The face of the current reaction (call only while `currentReaction()` is not null). */
export const reactionMood = (): Mood => reaction?.mood ?? 'neutral';

/** Forgets reactions and the gaze target (a new guest). */
export function resetGuestReactions(): void {
  reaction = null;
  gaze.since = -Infinity;
}

/**
 * Where the eyes point (-1..1 on each axis) for a head at (headX, headY), eased towards the target every frame.
 * Without a recent target the guest looks back at the player.
 */
export function updateGaze(headX: number, headY: number, dt: number): { x: number; y: number } {
  let targetX = GAZE_REST.x, targetY = GAZE_REST.y;
  if (clock.time - gaze.since < GAZE_HOLD_SECONDS) {
    targetX = clamp((gaze.targetX - headX) / GAZE_FULL_DISTANCE, -1, 1);
    targetY = clamp((gaze.targetY - headY) / GAZE_FULL_DISTANCE, -1, 1);
  }
  const k = Math.min(1, dt * GAZE_SPEED);
  gaze.x += (targetX - gaze.x) * k; gaze.y += (targetY - gaze.y) * k;
  return { x: gaze.x, y: gaze.y };
}
