// The guest in the kitchen window follows the player: looks where they work and reacts to their choices
// (surprised by the wrong cream or magic, worried by other wrong ingredients, pleased by the right ones), now
// and then moving their head with it: nodding, swaying happily, tilting it in doubt, shaking it, pulling back.
// Choices are also heard now and then, in the guest's own voice, from a wide set of sounds (RIGHT_SOUNDS, WRONG_SOUNDS;
// a wrong choice more often — that's the useful hint), and no sound comes back soon after it was heard.
// Every sound has its face (SOUND_FACE), and the meows have intonations: an asking "mew?", a sharp "mrow!", a long
// pleading whine, even a hiss, harsher the more mistakes were made (WRONG_SOUNDS).
// Mistakes add up: after a few the guest's face goes flat (with a sigh), after more sad or angry (a sad meow or
// a "hmph"); right choices slowly bring the smile back. Now and then the guest also says something (guestComments.ts).
import type { HumKind, MeowMood } from '../audio/engine';
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
const PLEASED_MOODS: Mood[] = ['content', 'delighted', 'starry'];
/** A right choice pleases the guest only now and then, so it stays a nice surprise. */
const PLEASED_CHANCE = 0.4;
/** What the guest may say about a choice, with how often each comes up. */
type ChoiceSound = 'chirp' | 'hm' | 'mhm' | 'purr' | 'happyMeow' | 'softMeow' | 'trillMeow' | 'singMeow' | 'nom' | 'ooh'
  | 'grumble' | 'doubt' | 'disagree' | 'askMeow' | 'indignantMeow' | 'whineMeow' | 'hiss' | 'huff' | 'tsk' | 'gasp' | 'groan' | 'bleh';
/** Right choices: a guest who is still displeased only hums. */
const RIGHT_SOUNDS: [ChoiceSound, number][] = [
  ['hm', 3], ['mhm', 3], ['chirp', 2], ['happyMeow', 2], ['softMeow', 2], ['trillMeow', 2], ['nom', 2], ['ooh', 2], ['singMeow', 1], ['purr', 1],
];
const RIGHT_SOUNDS_COOL: [ChoiceSound, number][] = [['hm', 3], ['mhm', 3], ['softMeow', 1]];
/** Wrong choices, by how displeased the guest is (0 fine, 1 flat, 2 upset); `hiss` is added by `wrongSounds`. */
const WRONG_SOUNDS: [ChoiceSound, number][][] = [
  [['doubt', 3], ['disagree', 3], ['askMeow', 3], ['gasp', 2], ['tsk', 2], ['grumble', 1]],
  [['disagree', 1], ['askMeow', 1], ['tsk', 2], ['bleh', 3], ['groan', 2], ['grumble', 2], ['indignantMeow', 2], ['huff', 2], ['whineMeow', 1]],
  [['grumble', 2], ['indignantMeow', 2], ['whineMeow', 2], ['groan', 2], ['bleh', 2], ['huff', 2]],
];
/** How often a guest hisses at each displeasure level: readily with an angry temper, hardly ever otherwise. */
const HISS_WEIGHT = { angry: [0, 2, 5], calm: [0, 0, 1] };
const HISS_SECONDS = 0.4;
type GuestSound = ChoiceSound | 'sigh' | 'sadMeow';
/** The face that goes with each sound. */
const SOUND_FACE: Record<GuestSound, Mood> = {
  hm: 'content', mhm: 'content', purr: 'content', softMeow: 'content', chirp: 'delighted', trillMeow: 'delighted', happyMeow: 'happy', singMeow: 'happy',
  nom: 'licking', ooh: 'starry',
  doubt: 'thinking', disagree: 'flat', tsk: 'flat', sigh: 'flat', askMeow: 'surprised', gasp: 'surprised', groan: 'eyeroll', bleh: 'yuck',
  grumble: 'angry', indignantMeow: 'angry', huff: 'angry', hiss: 'hissing', whineMeow: 'sad', sadMeow: 'sad',
};
/** The sounds that are meows, with their intonation (the others are hums, unless `say` knows better). */
const MEOW_SOUNDS: Partial<Record<GuestSound, MeowMood>> = {
  chirp: 'chirp', grumble: 'grumble', happyMeow: 'happy', softMeow: 'soft', trillMeow: 'trill', singMeow: 'sing',
  askMeow: 'ask', indignantMeow: 'indignant', whineMeow: 'whine', sadMeow: 'sad',
};
/** A little heart or a note floats up beside the head with these sounds. */
export type ReactionMark = 'heart' | 'note';
const SOUND_MARK: Partial<Record<GuestSound, ReactionMark>> = { purr: 'heart', ooh: 'heart', singMeow: 'note', trillMeow: 'note' };
/** How the head moves: each move lasts `seconds` and gives the pose at a share `k` (0..1) of it. */
type HeadMove = 'nod' | 'shake' | 'sway' | 'tilt' | 'recoil';
const NOD = { dips: 2, depth: 9 }, SHAKE = { swings: 3, width: 11, tilt: 0.07 }, SWAY = { swings: 2, tilt: 0.11 }, TILT = { x: 6, tilt: 0.17 }, RECOIL = { lift: 12 };
const HEAD_MOVES: Record<HeadMove, { seconds: number; pose(k: number): HeadPose }> = {
  nod: { seconds: 0.7, pose: k => ({ x: 0, y: NOD.depth * Math.abs(Math.sin(NOD.dips * Math.PI * k)) * (1 - k), tilt: 0 }) },
  shake: { seconds: 0.85, pose: k => { const swing = Math.sin(SHAKE.swings * 2 * Math.PI * k) * (1 - k); return { x: SHAKE.width * swing, y: 0, tilt: SHAKE.tilt * swing }; } },
  sway: { seconds: 1.4, pose: k => ({ x: 0, y: 0, tilt: SWAY.tilt * Math.sin(SWAY.swings * 2 * Math.PI * k) * Math.sin(Math.PI * k) }) },
  tilt: { seconds: 0.9, pose: k => ({ x: TILT.x * Math.sin(Math.PI * k), y: 0, tilt: TILT.tilt * Math.sin(Math.PI * k) }) },
  recoil: { seconds: 0.5, pose: k => ({ x: 0, y: -RECOIL.lift * Math.sin(Math.PI * k), tilt: 0 }) },
};
/** The head move that goes with a sound. */
const SOUND_MOVE: Partial<Record<GuestSound, HeadMove>> = {
  mhm: 'nod', singMeow: 'sway', trillMeow: 'sway', purr: 'sway', disagree: 'shake', askMeow: 'tilt', doubt: 'tilt', groan: 'tilt', gasp: 'recoil', bleh: 'recoil',
};
/** No sound comes back while it is among the last few heard. */
const RECENT_SOUNDS_KEPT = 4;
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
/** Besides the moves that come with sounds, a right choice sometimes gets a silent nod, a wrong one a head shake. */
const NOD_CHANCE = 0.2;
const SHAKE_CHANCE = 0.6;
/**
 * Displeasure: a wrong choice adds 1, a right one takes `forgive` off. From `flat` the guest's face goes flat,
 * from `upset` sad (angry for an angry temper) — unless their patience already shows something worse.
 */
const DISPLEASURE = { forgive: 0.5, flat: 2, upset: 4 };
/** How bad a face is, to pick the worse of patience and displeasure. */
const MOOD_SEVERITY: Partial<Record<Mood, number>> = { flat: 1, thinking: 2, sad: 3, angry: 3 };
let lastVoiceTime = -Infinity;
let recentSounds: ChoiceSound[] = [];

const gaze = { targetX: 0, targetY: 0, since: -Infinity, x: GAZE_REST.x, y: GAZE_REST.y };
let reaction: { kind: GuestReaction; startTime: number; mood: Mood; mark?: ReactionMark } | null = null;
let gesture: { kind: HeadMove; startTime: number } | null = null;

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
  if (sound !== 'sigh' && sound !== 'sadMeow') recentSounds = [...recentSounds, sound].slice(-RECENT_SOUNDS_KEPT);
  const meow = MEOW_SOUNDS[sound];
  if (meow) sfx.meow(pitch, meow, cat.voice);
  else if (sound === 'hiss') { sfx.hiss(HISS_SECONDS); customer.moodChangedAt = clock.time; }
  else if (sound === 'purr') sfx.purr(pitch * (cat.voice === 'male' ? 0.85 : 1.1), SHORT_PURR_SECONDS);
  else if (sound === 'tsk' || sound === 'gasp') sfx[sound]();
  else sfx.hum(pitch, sound as HumKind, cat.voice);
  const move = SOUND_MOVE[sound];
  if (move) gesture = { kind: move, startTime: clock.time };
  const mood = SOUND_FACE[sound], shown = currentReaction();
  const keepsMark = (shown === 'surprised' || shown === 'worried') && !FIERCE_FACES.includes(mood);
  reaction = { kind: keepsMark ? shown : 'voiced', startTime: clock.time, mood, mark: SOUND_MARK[sound] };
}

/** What a guest this displeased may say about a wrong choice. */
function wrongSounds(customer: Customer): [ChoiceSound, number][] {
  const level = displeasureLevel(customer), hiss = HISS_WEIGHT[customer.cat.temper === 'angry' ? 'angry' : 'calm'][level];
  return hiss ? [...WRONG_SOUNDS[level], ['hiss', hiss]] : WRONG_SOUNDS[level];
}

/** Not right after another sound (a shorter wait before a complaint). */
const isQuiet = (isRight: boolean): boolean => clock.time - lastVoiceTime >= VOICE_QUIET_SECONDS[isRight ? 'right' : 'wrong'];

/** The guest's sound over a choice: by chance (or always with `isSure`), never right after another one, none of the last few again. */
function voiceChoice(isRight: boolean, whenWrong: WrongReaction, isSure: boolean): void {
  if (!isQuiet(isRight)) return;
  if (!isSure && Math.random() >= VOICE_CHANCE[isRight ? 'right' : 'wrong']) return;
  const customer = runtime.customer!, isCool = displeasureLevel(customer) > 0;
  const pool = isRight ? (isCool ? RIGHT_SOUNDS_COOL : RIGHT_SOUNDS) : wrongSounds(customer);
  const heard = recentSounds.slice(-Math.min(RECENT_SOUNDS_KEPT, pool.length - 1)), options = pool.filter(([sound]) => !heard.includes(sound));
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
  if (Math.random() < NOD_CHANCE) gesture = { kind: 'nod', startTime: clock.time };
  voiceChoice(true, whenWrong, isPleased);
  if (praise) maybeComment(customer, 'praise', true);
}

/** Where the head is during a move (still otherwise). */
export function headPose(): HeadPose {
  if (!gesture) return { x: 0, y: 0, tilt: 0 };
  const move = HEAD_MOVES[gesture.kind], k = (clock.time - gesture.startTime) / move.seconds;
  if (k < 1) return move.pose(k);
  gesture = null;
  return { x: 0, y: 0, tilt: 0 };
}

/** The little mark floating up with the current sound and how long it has been showing, or null. */
export function reactionMark(): { kind: ReactionMark; age: number } | null {
  return reaction?.mark && currentReaction() ? { kind: reaction.mark, age: clock.time - reaction.startTime } : null;
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
