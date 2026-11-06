// The guest in the kitchen window follows the player: looks where they work and reacts to their choices
// (surprised by the wrong cream or magic, worried by other wrong ingredients, pleased by the right ones), now
// and then nodding with an "m-hm" at a right one and shaking their head with an "m-m" at a wrong one.
// Choices are also heard now and then, in the guest's own voice: a contented "hm", "m-hm", "mrrp!" or a short purr for
// a right one; "hmm?", "m-m" or a grumble for a wrong one (more often — that's the useful hint).
// Every sound has its face (SOUND_FACE), and the meows have intonations: an asking "mew?", a sharp "mrow!", a long
// pleading whine, even a hiss, harsher the more mistakes were made (WRONG_SOUNDS).
// Mistakes add up: after a few the guest's face goes flat (with a sigh), after more sad or angry (a sad meow or
// a "hmph"); right choices slowly bring the smile back. Now and then the guest also says something (guestComments.ts).
import { sfx } from '../audio/sfx';
import { clock } from '../core/clock';
import { clamp, pickWeighted } from '../core/math';
import type { GuestCommentTopic, Mood } from '../data/types';
import type { HeadPose } from '../render/cat';
import { maybeComment, resetGuestComment } from './guestComments';
import { patienceMood } from './patience';
import { runtime, type Customer } from './state';

type WrongReaction = 'surprised' | 'worried';
/** `voiced`: just the face that goes with a sound, without a mark beside the head. */
export type GuestReaction = WrongReaction | 'pleased' | 'voiced';

/** Seconds the guest keeps looking at the last thing the player touched before looking back at them. */
const GAZE_HOLD_SECONDS = 1.8;
/** How quickly the eyes move to a new target (share of the way per second). */
const GAZE_SPEED = 9;
/** A target this far from the guest's head (px) is looked at with the eyes turned all the way. */
const GAZE_FULL_DISTANCE = 260;
/** Resting gaze: at the player, a little down (towards the cake area under the window). */
const GAZE_REST = { x: 0.15, y: 0.2 };
/** How long each reaction face stays. */
const REACTION_SECONDS: Record<GuestReaction, number> = { surprised: 1.9, worried: 1.6, pleased: 1.3, voiced: 1.2 };
/** The face shown for each reaction; a pleased guest picks one of PLEASED_MOODS each time. */
const REACTION_MOOD: Record<WrongReaction, Mood> = { surprised: 'surprised', worried: 'thinking' };
const PLEASED_MOODS: Mood[] = ['content', 'delighted'];
/** A right choice pleases the guest only now and then, so it stays a nice surprise. */
const PLEASED_CHANCE = 0.4;
/** What the guest may say about a choice, with how often each comes up. */
type ChoiceSound = 'chirp' | 'hm' | 'mhm' | 'purr' | 'happyMeow' | 'grumble' | 'doubt' | 'disagree' | 'askMeow' | 'indignantMeow' | 'whineMeow' | 'hiss';
/** Right choices: a guest who is still displeased only hums. */
const RIGHT_SOUNDS: [ChoiceSound, number][] = [['hm', 3], ['mhm', 3], ['chirp', 2], ['happyMeow', 2], ['purr', 1]];
const RIGHT_SOUNDS_COOL: [ChoiceSound, number][] = [['hm', 3], ['mhm', 3]];
/** Wrong choices, by how displeased the guest is (0 fine, 1 flat, 2 upset); `hiss` is added by `wrongSounds`. */
const WRONG_SOUNDS: [ChoiceSound, number][][] = [
  [['doubt', 3], ['disagree', 3], ['askMeow', 3], ['grumble', 1]],
  [['disagree', 2], ['askMeow', 1], ['grumble', 3], ['indignantMeow', 3], ['whineMeow', 1]],
  [['grumble', 2], ['indignantMeow', 3], ['whineMeow', 3]],
];
/** How often a guest hisses at each displeasure level: readily with an angry temper, hardly ever otherwise. */
const HISS_WEIGHT = { angry: [0, 2, 5], calm: [0, 0, 1] };
const HISS_SECONDS = 0.4;
type GuestSound = ChoiceSound | 'sigh' | 'huff' | 'sadMeow';
/** The face that goes with each sound. */
const SOUND_FACE: Record<GuestSound, Mood> = {
  hm: 'content', mhm: 'content', purr: 'content', chirp: 'delighted', happyMeow: 'happy',
  doubt: 'thinking', disagree: 'flat', askMeow: 'surprised', sigh: 'flat',
  grumble: 'angry', indignantMeow: 'angry', huff: 'angry', hiss: 'hissing', whineMeow: 'sad', sadMeow: 'sad',
};
/** These faces are their own message: they replace the "?" or "!" beside the head. */
const FIERCE_FACES: Mood[] = ['angry', 'hissing'];
/**
 * Not every choice is voiced: a right one only now and then (a perfect cake shouldn't be a stream of sounds),
 * a wrong one mostly. A surprising mistake (wrong cream or magic) and a pleased face always come with a sound.
 */
const VOICE_CHANCE = { right: 0.3, wrong: 0.75 };
/** After any sound the guest stays quiet at least this long before the next one (shorter before a complaint). */
const VOICE_QUIET_SECONDS = { right: 2.5, wrong: 0.8 };
/** A surprised sound is a little higher than a worried one. */
const SURPRISED_VOICE = 1.1;
const SHORT_PURR_SECONDS = 0.8;
/** A right choice gets a nod (with "m-hm") this often, a wrong one a head shake (with "m-m"). */
const NOD_CHANCE = 0.35;
const SHAKE_CHANCE = 0.6;
/** Nod: `dips` dips of `depth` px; head shake: `swings` swings of `width` px, the head tilting with them. Both ease out. */
const NOD = { seconds: 0.7, dips: 2, depth: 9 };
const SHAKE = { seconds: 0.85, swings: 3, width: 11, tilt: 0.07 };
/**
 * Displeasure: a wrong choice adds 1, a right one takes `forgive` off. From `flat` the guest's face goes flat,
 * from `upset` sad (angry for an angry temper) — unless their patience already shows something worse.
 */
const DISPLEASURE = { forgive: 0.5, flat: 2, upset: 4 };
/** How bad a face is, to pick the worse of patience and displeasure. */
const MOOD_SEVERITY: Partial<Record<Mood, number>> = { flat: 1, thinking: 2, sad: 3, angry: 3 };
let lastVoiceTime = -Infinity;
let lastSound: ChoiceSound | null = null;

const gaze = { targetX: 0, targetY: 0, since: -Infinity, x: GAZE_REST.x, y: GAZE_REST.y };
let reaction: { kind: GuestReaction; startTime: number; mood: Mood } | null = null;
let gesture: { kind: 'nod' | 'shake'; startTime: number } | null = null;

const isWaitingGuest = (): boolean => runtime.scene === 'kitchen' && runtime.customer?.state === 'waiting';

/** The guest glances at a point on the screen (where the player just tapped or is dragging). */
export function lookAt(x: number, y: number): void {
  if (!isWaitingGuest()) return;
  gaze.targetX = x; gaze.targetY = y; gaze.since = clock.time;
}

/** Shows a reaction face for a moment; surprise also jolts the window and gets a puzzled "mrr?". */
export function react(kind: WrongReaction | 'pleased'): void {
  const customer = runtime.customer;
  if (!customer || !isWaitingGuest()) return;
  reaction = { kind, startTime: clock.time, mood: kind === 'pleased' ? PLEASED_MOODS[Math.floor(Math.random() * PLEASED_MOODS.length)] : REACTION_MOOD[kind] };
  if (kind !== 'pleased') customer.moodChangedAt = clock.time;
}

/** Plays one of the guest's sounds in their voice (a surprised one a little higher) and shows the face that goes with it. */
function say(sound: GuestSound, isSurprised = false): void {
  const customer = runtime.customer!, cat = customer.cat, pitch = cat.voicePitch * (isSurprised ? SURPRISED_VOICE : 1);
  lastVoiceTime = clock.time;
  if (sound !== 'sigh' && sound !== 'huff' && sound !== 'sadMeow') lastSound = sound;
  switch (sound) {
    case 'chirp': case 'grumble': sfx.meow(pitch, sound, cat.voice); break;
    case 'happyMeow': sfx.meow(pitch, 'happy', cat.voice); break;
    case 'askMeow': sfx.meow(pitch, 'ask', cat.voice); break;
    case 'indignantMeow': sfx.meow(pitch, 'indignant', cat.voice); break;
    case 'whineMeow': sfx.meow(pitch, 'whine', cat.voice); break;
    case 'sadMeow': sfx.meow(pitch, 'sad', cat.voice); break;
    case 'hiss': sfx.hiss(HISS_SECONDS); customer.moodChangedAt = clock.time; break;
    case 'purr': sfx.purr(pitch * (cat.voice === 'male' ? 0.85 : 1.1), SHORT_PURR_SECONDS); break;
    default: sfx.hum(pitch, sound, cat.voice);
  }
  const mood = SOUND_FACE[sound], shown = currentReaction();
  const keepsMark = (shown === 'surprised' || shown === 'worried') && !FIERCE_FACES.includes(mood);
  reaction = { kind: keepsMark ? shown : 'voiced', startTime: clock.time, mood };
}

/** What a guest this displeased may say about a wrong choice. */
function wrongSounds(customer: Customer): [ChoiceSound, number][] {
  const level = displeasureLevel(customer), hiss = HISS_WEIGHT[customer.cat.temper === 'angry' ? 'angry' : 'calm'][level];
  return hiss ? [...WRONG_SOUNDS[level], ['hiss', hiss]] : WRONG_SOUNDS[level];
}

/** Not right after another sound (a shorter wait before a complaint). */
const isQuiet = (isRight: boolean): boolean => clock.time - lastVoiceTime >= VOICE_QUIET_SECONDS[isRight ? 'right' : 'wrong'];

/** The guest's sound over a choice: by chance (or always with `isSure`), never right after another one, never the same twice running. */
function voiceChoice(isRight: boolean, whenWrong: WrongReaction, isSure: boolean): void {
  if (!isQuiet(isRight)) return;
  if (!isSure && Math.random() >= VOICE_CHANCE[isRight ? 'right' : 'wrong']) return;
  const customer = runtime.customer!, isCool = displeasureLevel(customer) > 0;
  const options = (isRight ? (isCool ? RIGHT_SOUNDS_COOL : RIGHT_SOUNDS) : wrongSounds(customer)).filter(([sound]) => sound !== lastSound);
  say(pickWeighted(options.map(([option]) => option), options.map(([, weight]) => weight)), !isRight && whenWrong === 'surprised');
}

/** 0 = fine, 1 = flat, 2 = upset, from the guest's displeasure. */
const displeasureLevel = (customer: Customer): number =>
  customer.displeasure >= DISPLEASURE.upset ? 2 : customer.displeasure >= DISPLEASURE.flat ? 1 : 0;

/** The guest's face when not reacting: the worse of what their patience and the player's mistakes show. */
export function guestMood(customer: Customer): Mood {
  const fromPatience = patienceMood(customer), level = displeasureLevel(customer);
  if (!level) return fromPatience;
  const fromMistakes: Mood = level === 1 ? 'flat' : customer.cat.temper === 'angry' ? 'angry' : 'sad';
  return (MOOD_SEVERITY[fromMistakes] ?? 0) > (MOOD_SEVERITY[fromPatience] ?? 0) ? fromMistakes : fromPatience;
}

/**
 * Wrong → the given worried / surprised face, sometimes a head shake. Right → sometimes a nod, and sometimes
 * (PLEASED_CHANCE) a pleased face, only when `praise` is set (not for every small step). Each choice moves the
 * guest's displeasure; when their face gets worse for it they sigh, meow sadly or huff instead of the usual sound.
 * Sounds come by chance (see VOICE_CHANCE), so the player can often tell by ear without it getting noisy.
 * `topic` is what the choice was about, for the guest's rare comment.
 */
export function judgeChoice(isRight: boolean, whenWrong: WrongReaction, praise = false, topic?: GuestCommentTopic): void {
  const customer = runtime.customer;
  if (!customer || !isWaitingGuest()) return;
  const levelBefore = displeasureLevel(customer);
  customer.displeasure = isRight ? Math.max(0, customer.displeasure - DISPLEASURE.forgive) : customer.displeasure + 1;
  if (!isRight) {
    react(whenWrong);
    const isShaking = Math.random() < SHAKE_CHANCE;
    if (isShaking) gesture = { kind: 'shake', startTime: clock.time };
    const level = displeasureLevel(customer);
    if (level > levelBefore) say(level === 1 ? 'sigh' : customer.cat.temper === 'angry' ? 'huff' : 'sadMeow'); // the face just got worse
    else if (isShaking && !level) { if (isQuiet(false)) say('disagree', whenWrong === 'surprised'); }
    else voiceChoice(false, whenWrong, isShaking || whenWrong === 'surprised');
    if (topic) maybeComment(customer, topic, false);
    return;
  }
  const isPleased = praise && Math.random() < PLEASED_CHANCE;
  if (isPleased) react('pleased');
  if (Math.random() < NOD_CHANCE) {
    gesture = { kind: 'nod', startTime: clock.time };
    if (isQuiet(true) && lastSound !== 'mhm') say('mhm');
  } else voiceChoice(true, whenWrong, isPleased);
  if (praise) maybeComment(customer, 'praise', true);
}

/** Where the head is during a nod or a head shake (still otherwise). */
export function headPose(): HeadPose {
  if (!gesture) return { x: 0, y: 0, tilt: 0 };
  const seconds = gesture.kind === 'nod' ? NOD.seconds : SHAKE.seconds, k = (clock.time - gesture.startTime) / seconds;
  if (k >= 1) { gesture = null; return { x: 0, y: 0, tilt: 0 }; }
  const fade = 1 - k;
  if (gesture.kind === 'nod') return { x: 0, y: NOD.depth * Math.abs(Math.sin(NOD.dips * Math.PI * k)) * fade, tilt: 0 };
  const swing = Math.sin(SHAKE.swings * 2 * Math.PI * k) * fade;
  return { x: SHAKE.width * swing, y: 0, tilt: SHAKE.tilt * swing };
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
  gesture = null;
  resetGuestComment();
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
