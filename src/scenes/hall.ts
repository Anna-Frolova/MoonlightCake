// The café hall: a guest walks in, orders, later judges the cake, pays and leaves.
import { sfx } from '../audio/sfx';
import { ctx, SCREEN_W } from '../core/canvas';
import { clock } from '../core/clock';
import { drawCoin, drawFittedText, drawHeart, drawPanel, drawText, drawTitle, ellipsePath, font, roundRectPath, withPopIn, wrapText } from '../core/draw';
import { loc } from '../core/language';
import { clamp, easeOutBack, lerp, seededRandom } from '../core/math';
import { rgbToHex, shade } from '../core/color';
import { CREAMS, FLAVORS } from '../data/ingredients';
import type { Cake } from '../data/types';
import { burst, drawMotes, floatingText } from '../core/particles';
import { BUTTON_COLOR, TEXT } from '../core/theme';
import { button } from '../core/ui';
import { t } from '../data/strings';
import {
  acceptOrder, collectPayment, GUEST_COUNTER_X, isLastGuestOfDay, say, sendGuestAway, spawnNextGuest,
} from '../game/flow';
import { catLine } from '../game/lines';
import { progress, runtime, type Customer } from '../game/state';
import { drawCake } from '../render/cake';
import { drawAngerMark, drawCat, drawPaws } from '../render/cat';
import { COUNTER_TOP_Y, drawCounter, drawHallBackground, HALL_FLOOR_Y } from '../render/environment';
import { kitchenTheme } from '../render/kitchenThemes';
import { drawOrderCard } from '../render/orderCard';
import { drawCoinCounter, drawDayCounter, drawSoundButtons } from './hud';

/** Letters typed per second in speech bubbles. */
const TYPING_SPEED = 60;
const WALK_IN_EASING = 3.2;
const WALK_IN_MIN_SPEED = 120;
const WALK_OUT_SPEED = 760;
/** Height of the sparks burst when a special guest reaches the counter (around their head). */
const SPECIAL_ARRIVAL_SPARKS_Y = 330;
/** A guest purring after a perfect cake strolls out slower, trailing hearts. */
const PURRING_WALK_OUT_SPEED = 420;
const PURR_HEARTS_PER_SECOND = 7;
/**
 * A guest out of patience (seconds in the hall): hisses and lifts the cake over their head, throws it,
 * it hits the screen, then they storm off. Without a cake they just leave after saying their piece.
 */
const STORM = { liftAt: 0.9, throwAt: 1.45, hitAt: 1.85, leaveWithCake: 3.3, leaveNoCake: 2.4, liftedY: 250, trembleSpeed: 50, tremble: 3 };
/** Where the thrown cake lands (screen centre), how big it is then and how many turns it makes on the way. */
const THROW_TARGET = { x: 640, y: 420, scale: 3.4, spins: 2.2 };
/** The cake splat on the screen: its size, how long it stays and fades. */
const SPLAT = { radius: 230, seconds: 3.4, fadeSeconds: 0.9, drips: 9, crumbs: 14 };
/** Where the anger mark floats beside the guest's head in the hall. */
const ANGER_MARK_OFFSET = { x: 92, y: -250, scale: 2 };
/** Guest is gone once past this x. */
const OFF_SCREEN_X = 1500;
const JUDGING_SECONDS = 1.5;
/** Hearts on the result card appear at HEART_FIRST + i * HEART_INTERVAL seconds. */
const HEART_FIRST = 0.4;
const HEART_INTERVAL = 0.22;

const BUBBLE = { x: 770, w: 480, textWidth: 440, lineHeight: 30, textSize: 22, orderPictureHeight: 222, centerY: 255, minY: 70, maxY: 420 };
const RESULT_CARD = { x: 36, y: 92, w: 380, h: 468 };
const NAME_TAG_SIZE = 20;
/** Heart row on the result card. */
const RESULT_HEARTS = { firstX: RESULT_CARD.x + 66, spacing: 62, y: RESULT_CARD.y + 76 };

const catScale = (customer: Customer): number => (customer.cat.isKitten ? 1.0 : 1.1);
const isSpeechFinished = (customer: Customer): boolean => !!customer.speech && customer.speech.visibleChars >= customer.speech.text.length;
const heartAppearTime = (index: number): number => HEART_FIRST + index * HEART_INTERVAL;
const paymentAppearTime = (hearts: number): number => 0.5 + hearts * HEART_INTERVAL;

// ---------------- update ----------------

export function updateHall(dt: number): void {
  const customer = runtime.customer;
  if (!customer || runtime.scene !== 'hall' || runtime.fade) return;
  customer.time += dt;
  const speech = customer.speech;
  if (speech && speech.visibleChars < speech.text.length) speech.visibleChars = Math.min(speech.text.length, speech.visibleChars + dt * TYPING_SPEED);

  switch (customer.state) {
    case 'entering':
      customer.x += (GUEST_COUNTER_X - customer.x) * Math.min(1, dt * WALK_IN_EASING) - WALK_IN_MIN_SPEED * dt;
      if (customer.x <= GUEST_COUNTER_X + 2) {
        customer.x = GUEST_COUNTER_X;
        customer.state = 'ordering';
        customer.orderShownFor = 0;
        say(t().orderSpeech(customer.greeting, catLine(customer.cat, 'ask')));
        sfx.meow(customer.cat.voicePitch);
        if (customer.cat.special) { // a special guest arrives in a shower of their sparks
          burst(GUEST_COUNTER_X, SPECIAL_ARRIVAL_SPARKS_Y, 36, kitchenTheme(customer.cat.special.theme).sparkColors, { kind: 'star', gravity: 80, maxSpeed: 360 });
        }
      }
      break;
    case 'ordering':
      if (isSpeechFinished(customer)) {
        if (customer.orderShownFor === 0) setTimeout(sfx.sparkle, 60);
        customer.orderShownFor += dt;
      }
      break;
    case 'judging':
      if (customer.time > JUDGING_SECONDS) startReaction(customer);
      break;
    case 'reacting':
      updateReaction(customer, dt);
      break;
    case 'storming':
      updateStorm(customer, dt);
      break;
    case 'leaving':
      if (clock.time < runtime.purrUntil) {
        customer.x += dt * PURRING_WALK_OUT_SPEED;
        if (Math.random() < dt * PURR_HEARTS_PER_SECOND) {
          burst(customer.x - 20, HALL_FLOOR_Y - 230, 1, '#ff7ac0', { kind: 'heart', gravity: -70, maxSpeed: 60, minSize: 6, maxSize: 10 });
        }
      } else customer.x += dt * WALK_OUT_SPEED;
      if (customer.x > OFF_SCREEN_X) { runtime.customer = null; spawnNextGuest(); }
      break;
  }
}

function updateStorm(customer: Customer, dt: number): void {
  const crossed = (moment: number) => customer.time - dt < moment && customer.time >= moment;
  const cake = customer.servedCake;
  if (!cake) {
    if (crossed(0.2)) sfx.hiss();
    if (customer.time >= STORM.leaveNoCake) { customer.state = 'leaving'; customer.speech = null; }
    return;
  }
  if (crossed(STORM.liftAt)) sfx.hiss();
  if (crossed(STORM.throwAt)) sfx.throwCake();
  if (crossed(STORM.hitAt)) {
    const colors = splatColors(cake);
    sfx.splat();
    runtime.shake = 0.4;
    runtime.splat = { startTime: clock.time, ...colors, seed: cake.seed };
    burst(THROW_TARGET.x, THROW_TARGET.y - 60, 24, [colors.color, colors.crumbColor, '#ffffff'], { gravity: 600, maxSpeed: 520 });
  }
  if (customer.time >= STORM.leaveWithCake) { customer.state = 'leaving'; customer.speech = null; }
}

/** The splat takes the colour of the outermost thing on the cake: glaze, else cream, else the sponge. */
function splatColors(cake: Cake): { color: string; crumbColor: string } {
  const layer = cake.stack.find(item => item.kind === 'layer');
  const crumbColor = layer?.kind === 'layer' ? FLAVORS[layer.flavor].color : '#ffd86b';
  const color = cake.glaze ? rgbToHex(cake.glaze) : cake.cream && cake.creamCoverage > 0.1 ? CREAMS[cake.cream].color : crumbColor;
  return { color, crumbColor };
}

function startReaction(customer: Customer): void {
  const hearts = customer.score!.hearts;
  customer.state = 'reacting';
  customer.reactionTime = 0;
  const mood = hearts >= 4 ? 'happy' : hearts === 3 ? 'neutral' : 'sad';
  customer.mood = mood;
  say(catLine(customer.cat, hearts >= 4 ? 'good' : hearts === 3 ? 'ok' : 'bad'));
  sfx.meow(customer.cat.voicePitch, mood);
  collectPayment();
}

/** Hearts pop in one by one, then the coins fly. */
function updateReaction(customer: Customer, dt: number): void {
  const score = customer.score!, previous = customer.reactionTime;
  customer.reactionTime += dt;
  const crossed = (moment: number) => previous < moment && customer.reactionTime >= moment;
  for (let i = 0; i < score.hearts; i++) {
    if (crossed(heartAppearTime(i))) {
      sfx.heart(i);
      burst(RESULT_HEARTS.firstX + i * RESULT_HEARTS.spacing, RESULT_HEARTS.y, 8, '#ff7ac0', { kind: 'heart', gravity: 80, maxSpeed: 120, minSize: 6, maxSize: 10 });
    }
  }
  if (crossed(paymentAppearTime(score.hearts))) {
    sfx.coin();
    floatingText(640, 380, (score.net >= 0 ? '+' : '') + score.net, '#ffe27a', 40);
    burst(640, 400, 18, ['#ffd84a', '#fff1b0'], { kind: 'coin', lift: 220, gravity: 500, minSize: 7, maxSize: 10 });
    if (score.hearts >= 4) {
      burst(640, 300, 14, '#ff7ac0', { kind: 'heart', gravity: -40, lift: 60, minSize: 8, maxSize: 14 });
      sfx.chime();
    }
  }
}

/** Tapping the scene while a guest is talking shows the whole sentence at once. */
export function skipSpeechTyping(): boolean {
  const speech = runtime.customer?.speech;
  if (!speech || speech.visibleChars >= speech.text.length) return false;
  speech.visibleChars = speech.text.length;
  return true;
}

/** Enter key: accept the order or call the next guest. */
export function handleHallEnterKey(): void {
  const customer = runtime.customer;
  if (!customer) return;
  if (customer.state === 'ordering' && isSpeechFinished(customer)) acceptOrder();
  else if (customer.state === 'reacting' && customer.reactionTime > 2) sendGuestAway();
}

// ---------------- render ----------------

export function renderHall(): void {
  const time = clock.time, customer = runtime.customer;
  drawHallBackground(time);
  if (customer) {
    const isWalking = customer.state === 'entering' || customer.state === 'leaving';
    let bob = 0;
    if (isWalking) bob = -Math.abs(Math.sin(customer.time * 9)) * 10;
    else if (customer.state === 'reacting' && customer.mood === 'happy') { // happy hops that calm down
      bob = -Math.abs(Math.sin(customer.reactionTime * 6)) * 8 * Math.max(0, 1 - customer.reactionTime / 2.5);
    }
    const tremble = customer.state === 'storming' ? Math.sin(time * STORM.trembleSpeed) * STORM.tremble : 0;
    drawCat(customer.cat, customer.x + tremble, HALL_FLOOR_Y + bob, catScale(customer), time, customer.mood);
  }
  drawCounter(time);
  if (customer) {
    if (customer.state !== 'entering' && customer.state !== 'leaving') drawPaws(customer.cat, customer.x, 520, catScale(customer));
    if (customer.servedCake && (customer.state === 'judging' || customer.state === 'reacting')) { // the cake on a plate
      ellipsePath(customer.x, 534, 112, 24); ctx.fillStyle = '#efeaff'; ctx.fill();
      ctx.strokeStyle = 'rgba(127,240,255,0.6)'; ctx.lineWidth = 2; ctx.stroke();
      drawCake(customer.servedCake, customer.x, COUNTER_TOP_Y + 20, 0.6);
    }
    if (customer.state === 'storming' || (customer.state === 'leaving' && customer.mood === 'angry')) {
      drawAngerMark(customer.x + ANGER_MARK_OFFSET.x, HALL_FLOOR_Y + ANGER_MARK_OFFSET.y, ANGER_MARK_OFFSET.scale, time);
    }
    if (customer.state === 'storming' && customer.servedCake && customer.time < STORM.throwAt) drawLiftedCake(customer, customer.servedCake);
  }
  drawMotes();
  if (customer) {
    if (customer.speech) drawSpeechBubble(customer);
    if (customer.state === 'ordering' && customer.orderShownFor > 0.25) {
      button('acceptOrder', BUBBLE.x, runtime.speechBubbleBottom + 16, BUBBLE.w, 62, t().acceptOrder, {
        color: BUTTON_COLOR.confirm, fontSize: 23, glow: progress.day === 1 && progress.guestIndex === 0, onClick: acceptOrder,
      });
    }
    if (customer.state === 'reacting') drawResultCard(customer);
    if (customer.state === 'storming' && customer.servedCake) drawThrownCake(customer, customer.servedCake);
  }
  if (runtime.splat) drawSplat(runtime.splat);
  drawDayCounter();
  drawCoinCounter(262, 12);
  drawSoundButtons(SCREEN_W - 124, 16);
}

/** Before the throw: the cake sits on the counter, then the guest hoists it over their head. */
function drawLiftedCake(customer: Customer, cake: Cake): void {
  const k = clamp((customer.time - STORM.liftAt) / (STORM.throwAt - STORM.liftAt), 0, 1);
  const lift = easeOutBack(k), wobble = k > 0 ? Math.sin(clock.time * 30) * 4 : 0;
  if (k === 0) { ellipsePath(customer.x, 534, 112, 24); ctx.fillStyle = '#efeaff'; ctx.fill(); }
  drawCake(cake, customer.x + wobble, lerp(COUNTER_TOP_Y + 20, STORM.liftedY, lift), 0.6);
}

/** The throw: the cake spins towards the player and grows until it hits the screen. */
function drawThrownCake(customer: Customer, cake: Cake): void {
  const k = (customer.time - STORM.throwAt) / (STORM.hitAt - STORM.throwAt);
  if (k < 0 || k >= 1) return;
  const eased = k * k, x = lerp(customer.x, THROW_TARGET.x, k), y = lerp(STORM.liftedY, THROW_TARGET.y, k) - Math.sin(k * Math.PI) * 80;
  ctx.save();
  ctx.translate(x, y); ctx.rotate(eased * Math.PI * 2 * THROW_TARGET.spins); ctx.translate(-x, -y);
  drawCake(cake, x, y + 60, lerp(0.6, THROW_TARGET.scale, eased));
  ctx.restore();
}

/** A blob of glaze with crumbs stuck on the screen; drips run down, then it fades away. */
function drawSplat(splat: NonNullable<typeof runtime.splat>): void {
  const age = clock.time - splat.startTime;
  if (age > SPLAT.seconds) { runtime.splat = null; return; }
  const random = seededRandom(splat.seed * 7 + 3), pop = easeOutBack(Math.min(1, age * 7)), radius = SPLAT.radius * pop;
  const cx = THROW_TARGET.x + (random() - 0.5) * 80, cy = THROW_TARGET.y - 80 + (random() - 0.5) * 40;
  ctx.save();
  ctx.globalAlpha = clamp((SPLAT.seconds - age) / SPLAT.fadeSeconds, 0, 1);
  ctx.fillStyle = splat.color;
  for (let i = 0; i < SPLAT.drips; i++) { // drips sliding down from the blob
    const dx = (random() - 0.5) * radius * 1.5, width = 10 + random() * 16, length = radius * 0.5 + (60 + random() * 180) * Math.min(1, age / 2.2);
    roundRectPath(cx + dx - width / 2, cy, width, length, width / 2); ctx.fill();
    ellipsePath(cx + dx, cy + length - width * 0.3, width * 0.62, width * 0.7); ctx.fill();
  }
  // the lumpy blob: a smooth curve through the midpoints of uneven points, every few of them a splash finger
  const lumps = 18;
  const blob = Array.from({ length: lumps }, (_, i) => {
    const angle = (i / lumps) * Math.PI * 2, r = radius * (i % 4 === 1 ? 1.15 + random() * 0.2 : 0.78 + random() * 0.22);
    return [cx + Math.cos(angle) * r, cy + Math.sin(angle) * r * 0.85] as const;
  });
  const midpoint = (i: number) => {
    const [ax, ay] = blob[i % lumps], [bx, by] = blob[(i + 1) % lumps];
    return [(ax + bx) / 2, (ay + by) / 2] as const;
  };
  ctx.beginPath(); ctx.moveTo(...midpoint(lumps - 1));
  for (let i = 0; i < lumps; i++) ctx.quadraticCurveTo(blob[i][0], blob[i][1], ...midpoint(i));
  ctx.closePath();
  const fill = ctx.createRadialGradient(cx - radius * 0.3, cy - radius * 0.3, radius * 0.1, cx, cy, radius);
  fill.addColorStop(0, shade(splat.color, 0.3)); fill.addColorStop(1, shade(splat.color, -0.15));
  ctx.fillStyle = fill; ctx.fill();
  ctx.fillStyle = splat.color; // droplets flung around
  for (let i = 0; i < 10; i++) {
    const angle = random() * Math.PI * 2, distance = radius * (1.05 + random() * 0.5), size = 6 + random() * 14;
    ellipsePath(cx + Math.cos(angle) * distance, cy + Math.sin(angle) * distance * 0.85, size * pop, size * pop); ctx.fill();
  }
  for (let i = 0; i < SPLAT.crumbs; i++) { // sponge crumbs stuck in it
    const px = cx + (random() - 0.5) * radius * 1.3, py = cy + (random() - 0.5) * radius, size = (8 + random() * 14) * pop;
    ctx.fillStyle = splat.crumbColor; roundRectPath(px - size / 2, py - size / 2, size, size * 0.8, size * 0.3); ctx.fill();
    ctx.fillStyle = shade(splat.crumbColor, -0.25); roundRectPath(px - size / 2, py + size * 0.15, size, size * 0.15, 2); ctx.fill();
  }
  ctx.fillStyle = 'rgba(255,255,255,0.45)'; // shine
  ellipsePath(cx - radius * 0.35, cy - radius * 0.35, radius * 0.18, radius * 0.08); ctx.fill();
  ctx.restore();
}

/** Speech bubble with the cat's name, typed text and — while ordering — the order picture. */
function drawSpeechBubble(customer: Customer): void {
  const speech = customer.speech!;
  const lines = wrapText(speech.text, BUBBLE.textWidth, BUBBLE.textSize, 700);
  const showsOrder = customer.state === 'ordering';
  const pictureH = showsOrder ? BUBBLE.orderPictureHeight : 0;
  const { x, w } = BUBBLE, h = 52 + lines.length * BUBBLE.lineHeight + pictureH;
  const y = clamp(BUBBLE.centerY - h / 2, BUBBLE.minY, BUBBLE.maxY);
  runtime.speechBubbleBottom = y + h;
  const tailY = Math.min(y + h * 0.4, 360);

  ctx.save();
  drawPanel(x, y, w, h, { radius: 26, noStars: true });
  // tail pointing at the cat
  const traceTail = (edgeX: number): void => {
    ctx.beginPath(); ctx.moveTo(edgeX, tailY - 14);
    ctx.quadraticCurveTo(x - 14, tailY + 6, x - 34, tailY + 26); ctx.quadraticCurveTo(x - 4, tailY + 18, edgeX, tailY + 14);
  };
  ctx.fillStyle = 'rgba(40,26,96,0.95)'; traceTail(x + 3); ctx.fill();
  ctx.strokeStyle = 'rgba(159,234,255,0.6)'; ctx.lineWidth = 2; traceTail(x + 1); ctx.stroke();
  // name tag
  ctx.font = font(NAME_TAG_SIZE, 900);
  const catName = loc(customer.cat.name), tagW = ctx.measureText(catName).width + 32;
  ctx.shadowColor = 'rgba(255,111,181,0.7)'; ctx.shadowBlur = 14;
  const tag = ctx.createLinearGradient(x + 20, 0, x + 20 + tagW, 0);
  tag.addColorStop(0, '#ff6fb5'); tag.addColorStop(1, '#9b6bff');
  ctx.fillStyle = tag; roundRectPath(x + 20, y - 18, tagW, 34, 17); ctx.fill();
  ctx.shadowBlur = 0;
  drawText(catName, x + 20 + tagW / 2, y - 1, NAME_TAG_SIZE, '#fff', 'center', 900);
  // text typed so far
  // each line's offset in the text: a break may eat a space (Ukrainian) or nothing (Japanese)
  const visibleChars = Math.floor(speech.visibleChars);
  let lineStart = 0, lineY = y + 34;
  for (const line of lines) {
    lineStart = Math.max(lineStart, speech.text.indexOf(line, lineStart));
    drawText(line.slice(0, Math.max(0, visibleChars - lineStart)), x + 22, lineY, BUBBLE.textSize, TEXT.main, 'left', 700);
    lineStart += line.length;
    lineY += BUBBLE.lineHeight;
  }
  if (showsOrder && isSpeechFinished(customer)) { // order picture pops in
    const scale = easeOutBack(Math.min(1, customer.orderShownFor * 4));
    const centerX = x + w / 2, centerY = lineY + pictureH / 2;
    ctx.translate(centerX, centerY); ctx.scale(scale, scale); ctx.translate(-centerX, -centerY);
    drawOrderCard(customer, x + 16, lineY - 4, w - 32, pictureH - 12);
  }
  ctx.restore();
}

/** Hearts, a bar per part of the cake, and the money breakdown. */
function drawResultCard(customer: Customer): void {
  const score = customer.score!, elapsed = customer.reactionTime;
  const { x, y, w, h } = RESULT_CARD;
  withPopIn(clock.time - elapsed, x + w / 2, y + h / 2, () => {
    drawPanel(x, y, w, h);
    drawTitle(t().guestScore, x + w / 2, y + 32, 25, TEXT.main);
    for (let i = 0; i < 5; i++) {
      const appearAt = heartAppearTime(i), isOn = i < score.hearts && elapsed >= appearAt;
      const scale = isOn ? easeOutBack((elapsed - appearAt) * 4) : 1;
      ctx.save();
      ctx.translate(RESULT_HEARTS.firstX + i * RESULT_HEARTS.spacing, RESULT_HEARTS.y); ctx.scale(scale, scale);
      drawHeart(0, 0, 44, '#ff5fa8', isOn ? 'filled' : 'empty');
      ctx.restore();
    }
    let rowY = y + 120;
    for (const part of score.parts) {
      const color = part.score >= 0.85 ? BUTTON_COLOR.confirm : part.score >= 0.5 ? BUTTON_COLOR.gold : BUTTON_COLOR.danger;
      drawFittedText(t().scoreParts[part.kind], x + 26, rowY, 19, 136, TEXT.main, 'left', 800);
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; roundRectPath(x + 170, rowY - 8, 150, 16, 8); ctx.fill();
      ctx.save();
      ctx.shadowColor = color; ctx.shadowBlur = 8; ctx.fillStyle = color;
      roundRectPath(x + 170, rowY - 8, Math.max(16, 150 * part.score * clamp(elapsed * 2, 0, 1)), 16, 8); ctx.fill();
      ctx.restore();
      drawText(part.score >= 0.85 ? '✓' : part.score >= 0.5 ? '~' : '✗', x + 342, rowY, 20, color, 'center', 900);
      rowY += 28;
    }
    if (elapsed > paymentAppearTime(score.hearts)) {
      rowY += 6;
      ctx.strokeStyle = 'rgba(159,234,255,0.25)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 24, rowY - 14); ctx.lineTo(x + w - 24, rowY - 14); ctx.stroke();
      for (const [label, value] of [[t().payment, '+' + score.payment], [t().tips, '+' + score.tips], [t().ingredients, '−' + score.ingredientCost]]) {
        drawText(label, x + 26, rowY, 19, TEXT.muted, 'left', 700);
        drawText(value, x + w - 26, rowY, 19, TEXT.muted, 'right', 800);
        rowY += 25;
      }
      drawText(t().total, x + 26, rowY + 4, 22, TEXT.main, 'left', 900);
      drawCoin(x + w - 96, rowY + 4, 11);
      drawText((score.net >= 0 ? '+' : '') + score.net, x + w - 26, rowY + 4, 22, score.net >= 0 ? '#5ff0c8' : '#ff7f9f', 'right', 900);
    }
  });
  if (elapsed > 1.4 + score.hearts * HEART_INTERVAL || elapsed > 2.6) {
    button('nextGuest', BUBBLE.x, runtime.speechBubbleBottom + 16, 320, 62, isLastGuestOfDay() ? t().finishDay : t().nextGuest, {
      color: BUTTON_COLOR.confirm, fontSize: 23, onClick: sendGuestAway,
    });
  }
}
