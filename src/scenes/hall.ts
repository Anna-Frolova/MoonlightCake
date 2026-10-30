// The café hall: a guest walks in, orders, later judges the cake, pays and leaves.
import { sfx } from '../audio/sfx';
import { ctx, SCREEN_W } from '../core/canvas';
import { clock } from '../core/clock';
import { drawCoin, drawHeart, drawPanel, drawText, drawTitle, ellipsePath, font, roundRectPath, withPopIn, wrapText } from '../core/draw';
import { clamp, easeOutBack, pickRandom } from '../core/math';
import { burst, drawMotes, floatingText } from '../core/particles';
import { BUTTON_COLOR, TEXT } from '../core/theme';
import { button } from '../core/ui';
import {
  acceptOrder, collectPayment, GUEST_COUNTER_X, isLastGuestOfDay, say, sendGuestAway, spawnNextGuest,
} from '../game/flow';
import { progress, runtime, type Customer } from '../game/state';
import { drawCake } from '../render/cake';
import { drawCat, drawPaws } from '../render/cat';
import { COUNTER_TOP_Y, drawCounter, drawHallBackground, HALL_FLOOR_Y } from '../render/environment';
import { drawOrderCard } from '../render/orderCard';
import { drawCoinCounter, drawDayCounter, drawSoundButtons } from './hud';

/** Letters typed per second in speech bubbles. */
const TYPING_SPEED = 60;
const WALK_IN_EASING = 3.2;
const WALK_IN_MIN_SPEED = 120;
const WALK_OUT_SPEED = 760;
/** Guest is gone once past this x. */
const OFF_SCREEN_X = 1500;
const JUDGING_SECONDS = 1.5;
/** Hearts on the result card appear at HEART_FIRST + i * HEART_INTERVAL seconds. */
const HEART_FIRST = 0.4;
const HEART_INTERVAL = 0.22;

const BUBBLE = { x: 770, w: 480, textWidth: 440, lineHeight: 26, orderPictureHeight: 222, centerY: 255, minY: 70, maxY: 420 };
const RESULT_CARD = { x: 36, y: 92, w: 380, h: 440 };
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
        say(customer.greeting + ' ' + customer.cat.lines.ask);
        sfx.meow(customer.cat.voicePitch);
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
    case 'leaving':
      customer.x += dt * WALK_OUT_SPEED;
      if (customer.x > OFF_SCREEN_X) { runtime.customer = null; spawnNextGuest(); }
      break;
  }
}

function startReaction(customer: Customer): void {
  const hearts = customer.score!.hearts;
  customer.state = 'reacting';
  customer.reactionTime = 0;
  const mood = hearts >= 4 ? 'happy' : hearts === 3 ? 'neutral' : 'sad';
  customer.mood = mood;
  const lines = customer.cat.lines;
  say(pickRandom(hearts >= 4 ? lines.good : hearts === 3 ? lines.ok : lines.bad));
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
    drawCat(customer.cat, customer.x, HALL_FLOOR_Y + bob, catScale(customer), time, customer.mood);
  }
  drawCounter(time);
  if (customer) {
    if (customer.state !== 'entering' && customer.state !== 'leaving') drawPaws(customer.cat, customer.x, 520, catScale(customer));
    if (customer.servedCake && (customer.state === 'judging' || customer.state === 'reacting')) { // the cake on a plate
      ellipsePath(customer.x, 534, 112, 24); ctx.fillStyle = '#efeaff'; ctx.fill();
      ctx.strokeStyle = 'rgba(127,240,255,0.6)'; ctx.lineWidth = 2; ctx.stroke();
      drawCake(customer.servedCake, customer.x, COUNTER_TOP_Y + 20, 0.6);
    }
  }
  drawMotes();
  if (customer) {
    if (customer.speech) drawSpeechBubble(customer);
    if (customer.state === 'ordering' && customer.orderShownFor > 0.25) {
      button('acceptOrder', BUBBLE.x, runtime.speechBubbleBottom + 16, BUBBLE.w, 58, 'Прийняти замовлення', {
        color: BUTTON_COLOR.confirm, glow: progress.day === 1 && progress.guestIndex === 0, onClick: acceptOrder,
      });
    }
    if (customer.state === 'reacting') drawResultCard(customer);
  }
  drawDayCounter();
  drawCoinCounter(262, 12);
  drawSoundButtons(SCREEN_W - 124, 16);
}

/** Speech bubble with the cat's name, typed text and — while ordering — the order picture. */
function drawSpeechBubble(customer: Customer): void {
  const speech = customer.speech!;
  const lines = wrapText(speech.text, BUBBLE.textWidth, 19, 700);
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
  ctx.font = font(17, 900);
  const tagW = ctx.measureText(customer.cat.name).width + 30;
  ctx.shadowColor = 'rgba(255,111,181,0.7)'; ctx.shadowBlur = 14;
  const tag = ctx.createLinearGradient(x + 20, 0, x + 20 + tagW, 0);
  tag.addColorStop(0, '#ff6fb5'); tag.addColorStop(1, '#9b6bff');
  ctx.fillStyle = tag; roundRectPath(x + 20, y - 16, tagW, 30, 15); ctx.fill();
  ctx.shadowBlur = 0;
  drawText(customer.cat.name, x + 20 + tagW / 2, y - 1, 17, '#fff', 'center', 900);
  // text typed so far
  let charsLeft = Math.floor(speech.visibleChars), lineY = y + 34;
  for (const line of lines) {
    drawText(line.slice(0, Math.max(0, charsLeft)), x + 22, lineY, 19, TEXT.main, 'left', 700);
    charsLeft -= line.length + 1;
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
  const score = customer.score!, t = customer.reactionTime;
  const { x, y, w, h } = RESULT_CARD;
  withPopIn(clock.time - t, x + w / 2, y + h / 2, () => {
    drawPanel(x, y, w, h);
    drawTitle('Оцінка гостя', x + w / 2, y + 32, 22, TEXT.main);
    for (let i = 0; i < 5; i++) {
      const appearAt = heartAppearTime(i), isOn = i < score.hearts && t >= appearAt;
      const scale = isOn ? easeOutBack((t - appearAt) * 4) : 1;
      ctx.save();
      ctx.translate(RESULT_HEARTS.firstX + i * RESULT_HEARTS.spacing, RESULT_HEARTS.y); ctx.scale(scale, scale);
      drawHeart(0, 0, 44, '#ff5fa8', isOn ? 'filled' : 'empty');
      ctx.restore();
    }
    let rowY = y + 120;
    for (const part of score.parts) {
      const color = part.score >= 0.85 ? BUTTON_COLOR.confirm : part.score >= 0.5 ? BUTTON_COLOR.gold : BUTTON_COLOR.danger;
      drawText(part.label, x + 26, rowY, 17, TEXT.main, 'left', 800);
      ctx.fillStyle = 'rgba(255,255,255,0.1)'; roundRectPath(x + 170, rowY - 8, 150, 16, 8); ctx.fill();
      ctx.save();
      ctx.shadowColor = color; ctx.shadowBlur = 8; ctx.fillStyle = color;
      roundRectPath(x + 170, rowY - 8, Math.max(16, 150 * part.score * clamp(t * 2, 0, 1)), 16, 8); ctx.fill();
      ctx.restore();
      drawText(part.score >= 0.85 ? '✓' : part.score >= 0.5 ? '~' : '✗', x + 342, rowY, 18, color, 'center', 900);
      rowY += 27;
    }
    if (t > paymentAppearTime(score.hearts)) {
      rowY += 6;
      ctx.strokeStyle = 'rgba(159,234,255,0.25)'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(x + 24, rowY - 14); ctx.lineTo(x + w - 24, rowY - 14); ctx.stroke();
      for (const [label, value] of [['Оплата', '+' + score.payment], ['Чайові', '+' + score.tips], ['Інгредієнти', '−' + score.ingredientCost]]) {
        drawText(label, x + 26, rowY, 17, TEXT.muted, 'left', 700);
        drawText(value, x + w - 26, rowY, 17, TEXT.muted, 'right', 800);
        rowY += 23;
      }
      drawText('Разом', x + 26, rowY + 4, 20, TEXT.main, 'left', 900);
      drawCoin(x + w - 96, rowY + 4, 11);
      drawText((score.net >= 0 ? '+' : '') + score.net, x + w - 26, rowY + 4, 22, score.net >= 0 ? '#5ff0c8' : '#ff7f9f', 'right', 900);
    }
  });
  if (t > 1.4 + score.hearts * HEART_INTERVAL || t > 2.6) {
    button('nextGuest', BUBBLE.x, runtime.speechBubbleBottom + 16, 300, 58, isLastGuestOfDay() ? 'Завершити день' : 'Наступний гість', {
      color: BUTTON_COLOR.confirm, onClick: sendGuestAway,
    });
  }
}
