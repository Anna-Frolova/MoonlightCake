import type { Vec2 } from '../core/math';
import type { ElementDef, ElementId } from './types';

/** Elemental magic. Each element is cast by drawing its sign on the cake. */
export const ELEMENTS: Record<ElementId, ElementDef> = {
  fire:   { name: { uk: 'Вогонь',    ja: '炎' },   color: '#ff8a3d', signName: { uk: 'трикутник', ja: '三角' },     unlockDay: 1 },
  ice:    { name: { uk: 'Лід',       ja: '氷' },   color: '#8fe6ff', signName: { uk: 'коло',      ja: '円' },       unlockDay: 1 },
  bolt:   { name: { uk: 'Блискавка', ja: '雷' },   color: '#ffe95a', signName: { uk: 'зигзаг',    ja: 'ジグザグ' }, unlockDay: 1 },
  nature: { name: { uk: 'Природа',   ja: '自然' }, color: '#6be08a', signName: { uk: 'хвиля',     ja: '波' },       unlockDay: 1 },
  star:   { name: { uk: 'Зоряна',    ja: '星' },   color: '#d6b6ff', signName: { uk: 'зірка',     ja: '星形' },     unlockDay: 1 },
  dark:   { name: { uk: 'Темрява',   ja: '闇' },   color: '#b36bff', signName: { uk: 'вихор',     ja: 'うず' },     unlockDay: 1 },
  light:  { name: { uk: 'Світло',    ja: '光' },   color: '#ffe98a', signName: { uk: 'крила',     ja: 'つばさ' },   unlockDay: 1 },
  blood:  { name: { uk: 'Кров',      ja: '血' },   color: '#ff3a5c', signName: { uk: 'ікла',      ja: 'きば' },     unlockDay: 1 },
  foxfire: { name: { uk: 'Лисячий вогонь', ja: '狐火' }, color: '#ff7a3a', signName: { uk: 'хвіст', ja: 'しっぽ' }, unlockDay: 1 },
};
/** The everyday elements, shown on the magic station for every order. */
export const ELEMENT_ORDER: ElementId[] = ['fire', 'ice', 'bolt', 'nature', 'star'];
/** The special guests' magic: it joins the row only while its guest waits for the cake. */
export const GUEST_ELEMENTS: ElementId[] = ['dark', 'light', 'blood', 'foxfire'];

const circlePoints = (count: number): Vec2[] =>
  Array.from({ length: count }, (_, i) => {
    const angle = -Math.PI / 2 + (i / count) * Math.PI * 2;
    return [0.5 + Math.cos(angle) * 0.5, 0.5 + Math.sin(angle) * 0.5];
  });

/**
 * Reference shapes of the signs in a 0..1 box. `closed` shapes end where they start
 * (the player may begin drawing them anywhere along the outline).
 */
export const SIGN_SHAPES: Record<ElementId, { closed: boolean; points: Vec2[] }> = {
  fire: { closed: true, points: [[0.5, 0], [1, 0.88], [0, 0.88]] },
  ice: { closed: true, points: circlePoints(24) },
  bolt: { closed: false, points: [[0.72, 0], [0.22, 0.52], [0.78, 0.46], [0.28, 1]] },
  nature: { closed: false, points: Array.from({ length: 25 }, (_, i): Vec2 => [i / 24, 0.25 + 0.25 * Math.sin((i / 24) * Math.PI * 3)]) },
  // a pentagram drawn in one stroke: every second star point
  star: {
    closed: true,
    points: [0, 2, 4, 1, 3].map((k): Vec2 => {
      const angle = -Math.PI / 2 + (k * Math.PI * 2) / 5;
      return [0.5 + Math.cos(angle) * 0.5, 0.5 + Math.sin(angle) * 0.5];
    }),
  },
  // a spiral of two turns, from the outside in
  dark: {
    closed: false,
    points: Array.from({ length: 41 }, (_, i): Vec2 => {
      const k = i / 40, angle = -Math.PI / 2 + k * Math.PI * 4, radius = 0.5 * (1 - k * 0.85);
      return [0.5 + Math.cos(angle) * radius, 0.5 + Math.sin(angle) * radius];
    }),
  },
  // wings: a figure eight lying on its side (∞)
  light: {
    closed: true,
    points: Array.from({ length: 32 }, (_, i): Vec2 => {
      const angle = (i / 32) * Math.PI * 2, d = 1 + Math.sin(angle) ** 2;
      return [0.5 + (0.5 * Math.cos(angle)) / d, 0.5 + (0.8 * Math.sin(angle) * Math.cos(angle)) / d];
    }),
  },
  // fangs: a W
  blood: { closed: false, points: [[0, 0], [0.25, 0.95], [0.5, 0.3], [0.75, 0.95], [1, 0]] },
  // a fox tail: straight down, then curling to the left (a J)
  foxfire: {
    closed: false,
    points: [[0.65, 0], [0.65, 0.6], ...Array.from({ length: 9 }, (_, i): Vec2 => [0.4 + Math.cos((i / 8) * Math.PI) * 0.25, 0.6 + Math.sin((i / 8) * Math.PI) * 0.3])],
  },
};
