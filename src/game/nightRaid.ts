// A night raid: after a villain's visit grey, faded ghosts drift to the recipe book, each carrying a magic sign.
// Drawing the sign frees the ghost nearest the book: it gets its colour back and floats away.
// Two kinds: slow sheet ghosts float straight in, quick wisps loop round in circles on their way.
// Losing costs a few coins, never the land's progress.
import { sfx } from '../audio/sfx';
import { clock } from '../core/clock';
import { lerp, pickRandom, randomRange, type Point } from '../core/math';
import { burst } from '../core/particles';
import { ELEMENT_ORDER, ELEMENTS } from '../data/elements';
import { t } from '../data/strings';
import type { ElementId } from '../data/types';
import { showToast } from '../scenes/sceneManager';
import { recognizeSign } from './signRecognition';
import { availableElements, progress, runtime, saveProgress } from './state';

/** How often ghosts come, how many pages the book can lose; coins won or lost. */
export const RAID = {
  firstGhostSeconds: 2.2, spawnSeconds: 3.2, pages: 3,
  winCoins: 30, lostCoinsShare: 0.15, lostCoinsMax: 40, minStrokePoints: 4,
};
export type GhostKind = 'sheet' | 'wisp';
/**
 * `seconds`: the way to the book. The sheet bobs up and down by `bob` px; the wisp makes `loops` circles
 * of `loopRadius` px on its way (they shrink as it nears the book). `fromY`: the height it starts at.
 */
export const GHOST_KINDS = {
  sheet: { seconds: 13, bob: 8, bobSpeed: 2.4, fromY: { min: 200, max: 430 } },
  wisp: { seconds: 7.5, loops: 2.5, loopRadius: 110, loopSquash: 0.8, fromY: { min: 300, max: 370 } },
} as const;
/** The night's ghosts in order: slow sheets to learn on first, then more and more quick wisps. */
const GHOST_ORDER: readonly GhostKind[] = ['sheet', 'sheet', 'wisp', 'sheet', 'wisp', 'sheet', 'wisp', 'wisp', 'sheet', 'wisp'];
/** How long a freed ghost takes to fill with colour and float away. */
export const FREED_SECONDS = 1.6;
/** Where the book lies; ghosts start this far to either side of it. */
export const RAID_BOOK = { x: 640, y: 480 };
const SPAWN_SIDE_DISTANCE = 620;
/** Only the signs that are easy to tell apart at speed. */
const RAID_ELEMENTS: ElementId[] = ELEMENT_ORDER.filter(element => element !== 'star');
const FAILED_STROKE_COLOR = '#ff7f9f';

/** `side`: -1 comes from the left, 1 from the right. */
export interface RaidGhost { kind: GhostKind; element: ElementId; side: number; fromY: number; startTime: number }
/** A ghost the player freed: it fills with its sign's colour and floats up from where it was hit. */
export interface FreedGhost { kind: GhostKind; element: ElementId; x: number; y: number; side: number; startTime: number }

export const raid = {
  ghosts: [] as RaidGhost[], freed: [] as FreedGhost[], spawned: 0, nextSpawnAt: 0, pages: RAID.pages,
  /** Set once it is over; the coins are already counted then. */
  result: null as { won: boolean; coins: number } | null,
};

/** How far along its way a ghost is (0..1). */
export const ghostProgress = (ghost: RaidGhost, time = clock.time): number => (time - ghost.startTime) / GHOST_KINDS[ghost.kind].seconds;

/** Where a ghost is at `time`: the sheet floats straight with a bob, the wisp loops round in shrinking circles. */
export function ghostPosition(ghost: RaidGhost, time = clock.time): Point {
  const k = Math.max(0, ghostProgress(ghost, time)), fromX = RAID_BOOK.x + ghost.side * SPAWN_SIDE_DISTANCE;
  const x = lerp(fromX, RAID_BOOK.x, k), y = lerp(ghost.fromY, RAID_BOOK.y, k);
  if (ghost.kind === 'sheet') {
    const { bob, bobSpeed } = GHOST_KINDS.sheet;
    return { x, y: y + Math.sin(time * bobSpeed + ghost.fromY) * bob };
  }
  const { loops, loopRadius, loopSquash } = GHOST_KINDS.wisp;
  const radius = loopRadius * (1 - k), angle = k * loops * Math.PI * 2;
  // starts at the bottom of the circle and swings up and forward, towards the book
  return { x: x - ghost.side * radius * Math.sin(angle), y: y - radius * loopSquash * (1 - Math.cos(angle)) };
}

export function startRaid(): void {
  Object.assign(raid, { ghosts: [], freed: [], spawned: 0, nextSpawnAt: clock.time + RAID.firstGhostSeconds, pages: RAID.pages, result: null });
  runtime.magicStroke = null;
  runtime.fadingStroke = null;
}

function spawnGhost(): void {
  const open = availableElements().filter(element => RAID_ELEMENTS.includes(element));
  const kind = GHOST_ORDER[raid.spawned];
  const { min, max } = GHOST_KINDS[kind].fromY;
  raid.ghosts.push({ kind, element: pickRandom(open), side: raid.spawned % 2 ? 1 : -1, fromY: randomRange(min, max), startTime: clock.time });
  raid.spawned++;
  raid.nextSpawnAt = clock.time + RAID.spawnSeconds;
}

function finishRaid(won: boolean): void {
  const coins = won ? RAID.winCoins : -Math.min(RAID.lostCoinsMax, Math.round(progress.coins * RAID.lostCoinsShare));
  progress.coins = Math.max(0, progress.coins + coins);
  raid.result = { won, coins };
  raid.ghosts = [];
  runtime.magicStroke = null;
  progress.phase = 'dayEnd'; // reloading now must not replay the night and count its coins again
  saveProgress();
  if (won) sfx.chime(); else sfx.fail();
}

/** Called every frame. */
export function updateRaid(): void {
  raid.freed = raid.freed.filter(ghost => clock.time - ghost.startTime < FREED_SECONDS);
  if (runtime.scene !== 'night' || runtime.fade || raid.result) return;
  if (raid.spawned < GHOST_ORDER.length && clock.time >= raid.nextSpawnAt) spawnGhost();
  for (const ghost of raid.ghosts.filter(item => ghostProgress(item) >= 1)) {
    raid.ghosts.splice(raid.ghosts.indexOf(ghost), 1);
    raid.pages--;
    runtime.shake = 0.3;
    sfx.fail();
    burst(RAID_BOOK.x, RAID_BOOK.y, 16, ['#fff6dc', '#8a7aa8'], { lift: 140, gravity: 200 });
  }
  if (raid.pages <= 0) finishRaid(false);
  else if (raid.spawned >= GHOST_ORDER.length && !raid.ghosts.length) finishRaid(true);
}

export function startRaidStroke(point: Point): void {
  if (!raid.result) { runtime.magicStroke = { points: [[point.x, point.y]], lastSoundTime: 0 }; runtime.fadingStroke = null; }
}

export function extendRaidStroke(point: Point): void {
  const stroke = runtime.magicStroke;
  if (!stroke) return;
  const [lastX, lastY] = stroke.points[stroke.points.length - 1];
  if (Math.hypot(point.x - lastX, point.y - lastY) > 6) stroke.points.push([point.x, point.y]);
}

/** The drawn sign frees the ghost with that sign nearest the book. */
export function finishRaidStroke(): void {
  const points = runtime.magicStroke?.points;
  runtime.magicStroke = null;
  if (!points || points.length < RAID.minStrokePoints || raid.result) return;
  const match = recognizeSign(points, [...new Set(raid.ghosts.map(ghost => ghost.element))]);
  const element = match && match.quality > 0 ? match.element : null;
  runtime.fadingStroke = { points, startTime: clock.time, color: element ? ELEMENTS[element].color : FAILED_STROKE_COLOR };
  if (!element) { showToast(t().signNotRecognized); sfx.fail(); return; }
  const [target] = raid.ghosts.filter(ghost => ghost.element === element).sort((a, b) => ghostProgress(b) - ghostProgress(a));
  const { x, y } = ghostPosition(target);
  raid.ghosts.splice(raid.ghosts.indexOf(target), 1);
  raid.freed.push({ kind: target.kind, element, x, y, side: target.side, startTime: clock.time });
  sfx.place(); sfx.sparkle();
  burst(x, y - 30, 22, [ELEMENTS[element].color, '#ffffff'], { kind: 'star', gravity: 60, maxSpeed: 260 });
}
