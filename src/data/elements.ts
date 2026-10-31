import type { Vec2 } from '../core/math';
import type { ElementDef, ElementId } from './types';

/** Elemental magic. Each element is cast by drawing its sign on the cake. */
export const ELEMENTS: Record<ElementId, ElementDef> = {
  fire:   { name: { uk: 'Вогонь',    ja: '炎' },   color: '#ff8a3d', signName: { uk: 'трикутник', ja: '三角' },     unlockDay: 1 },
  ice:    { name: { uk: 'Лід',       ja: '氷' },   color: '#8fe6ff', signName: { uk: 'коло',      ja: '円' },       unlockDay: 1 },
  bolt:   { name: { uk: 'Блискавка', ja: '雷' },   color: '#ffe95a', signName: { uk: 'зигзаг',    ja: 'ジグザグ' }, unlockDay: 2 },
  nature: { name: { uk: 'Природа',   ja: '自然' }, color: '#6be08a', signName: { uk: 'хвиля',     ja: '波' },       unlockDay: 3 },
  star:   { name: { uk: 'Зоряна',    ja: '星' },   color: '#d6b6ff', signName: { uk: 'зірка',     ja: '星形' },     unlockDay: 4 },
};
export const ELEMENT_ORDER: ElementId[] = ['fire', 'ice', 'bolt', 'nature', 'star'];

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
};
