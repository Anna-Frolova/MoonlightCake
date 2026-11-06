// A night raid: after a villain's visit grey crumbs creep to the recipe book, each carrying a magic sign.
// Drawing the sign banishes the crumb nearest the book. Losing costs a few coins, never the land's progress.
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

/** How many crumbs come, how often, how long the way to the book takes, how many pages it can lose; coins won or lost. */
export const RAID = {
  crumbs: 8, firstCrumbSeconds: 2.2, spawnSeconds: 3.2, walkSeconds: 11, pages: 3,
  winCoins: 30, lostCoinsShare: 0.15, lostCoinsMax: 40, minStrokePoints: 4,
};
/** Where the book lies and where the crumbs start: this far to either side of it, somewhere in this height. */
export const RAID_BOOK = { x: 640, y: 480 };
const SPAWN = { sideDistance: 620, topY: 170, bottomY: 430 };
/** Only the signs that are easy to tell apart at speed. */
const RAID_ELEMENTS: ElementId[] = ELEMENT_ORDER.filter(element => element !== 'star');
const FAILED_STROKE_COLOR = '#ff7f9f';

export interface RaidCrumb { element: ElementId; fromX: number; fromY: number; startTime: number }

export const raid = {
  crumbs: [] as RaidCrumb[], spawned: 0, nextSpawnAt: 0, pages: RAID.pages,
  /** Set once it is over; the coins are already counted then. */
  result: null as { won: boolean; coins: number } | null,
};

/** How far along its way a crumb is (0..1). */
export const crumbProgress = (crumb: RaidCrumb): number => (clock.time - crumb.startTime) / RAID.walkSeconds;

/** Where a crumb is now: walking to the book with a little wobble. */
export function crumbPosition(crumb: RaidCrumb): Point {
  const k = crumbProgress(crumb);
  return { x: lerp(crumb.fromX, RAID_BOOK.x, k), y: lerp(crumb.fromY, RAID_BOOK.y, k) + Math.sin(clock.time * 5 + crumb.fromY) * 6 };
}

export function startRaid(): void {
  Object.assign(raid, { crumbs: [], spawned: 0, nextSpawnAt: clock.time + RAID.firstCrumbSeconds, pages: RAID.pages, result: null });
  runtime.magicStroke = null;
  runtime.fadingStroke = null;
}

function spawnCrumb(): void {
  const open = availableElements().filter(element => RAID_ELEMENTS.includes(element));
  const side = raid.spawned % 2 ? 1 : -1;
  raid.crumbs.push({
    element: pickRandom(open), fromX: RAID_BOOK.x + side * SPAWN.sideDistance, fromY: randomRange(SPAWN.topY, SPAWN.bottomY), startTime: clock.time,
  });
  raid.spawned++;
  raid.nextSpawnAt = clock.time + RAID.spawnSeconds;
}

function finishRaid(won: boolean): void {
  const coins = won ? RAID.winCoins : -Math.min(RAID.lostCoinsMax, Math.round(progress.coins * RAID.lostCoinsShare));
  progress.coins = Math.max(0, progress.coins + coins);
  raid.result = { won, coins };
  raid.crumbs = [];
  runtime.magicStroke = null;
  progress.phase = 'dayEnd'; // reloading now must not replay the night and count its coins again
  saveProgress();
  if (won) sfx.chime(); else sfx.fail();
}

/** Called every frame. */
export function updateRaid(): void {
  if (runtime.scene !== 'night' || runtime.fade || raid.result) return;
  if (raid.spawned < RAID.crumbs && clock.time >= raid.nextSpawnAt) spawnCrumb();
  for (const crumb of raid.crumbs.filter(item => crumbProgress(item) >= 1)) {
    raid.crumbs.splice(raid.crumbs.indexOf(crumb), 1);
    raid.pages--;
    runtime.shake = 0.3;
    sfx.fail();
    burst(RAID_BOOK.x, RAID_BOOK.y, 16, ['#fff6dc', '#8a7aa8'], { lift: 140, gravity: 200 });
  }
  if (raid.pages <= 0) finishRaid(false);
  else if (raid.spawned >= RAID.crumbs && !raid.crumbs.length) finishRaid(true);
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

/** The drawn sign banishes the crumb with that sign nearest the book. */
export function finishRaidStroke(): void {
  const points = runtime.magicStroke?.points;
  runtime.magicStroke = null;
  if (!points || points.length < RAID.minStrokePoints || raid.result) return;
  const match = recognizeSign(points, [...new Set(raid.crumbs.map(crumb => crumb.element))]);
  const element = match && match.quality > 0 ? match.element : null;
  runtime.fadingStroke = { points, startTime: clock.time, color: element ? ELEMENTS[element].color : FAILED_STROKE_COLOR };
  if (!element) { showToast(t().signNotRecognized); sfx.fail(); return; }
  const [target] = raid.crumbs.filter(crumb => crumb.element === element).sort((a, b) => crumbProgress(b) - crumbProgress(a));
  const { x, y } = crumbPosition(target);
  raid.crumbs.splice(raid.crumbs.indexOf(target), 1);
  sfx.place(); sfx.sparkle();
  burst(x, y, 22, [ELEMENTS[element].color, '#ffffff'], { kind: 'star', gravity: 60, maxSpeed: 260 });
}
