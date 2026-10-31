// Who visits the café and how they look. What they say is in catLines.ts.
import type { CatDef, CatId, CatLook } from './types';

/** Regular guests, in the order they are introduced. */
export const GUESTS: CatDef[] = [
  {
    id: 'pushinka', name: { uk: 'Пані Пушинка', ja: 'フワリ夫人' }, firstDay: 1, voicePitch: 1.25,
    fur: '#fbf4ff', furAccent: '#e9dcf5', pattern: 'none', eyeColor: '#ff7fbf',
    hat: 'flowers', outfit: 'dress', outfitColor: '#ff9ccb',
    favoritePalettes: ['berry', 'lavender'], favoriteShapes: ['heart', 'round'],
  },
  {
    id: 'barsyk', name: { uk: 'Сер Барсик', ja: 'バルシク卿' }, firstDay: 1, voicePitch: 0.85, isGenerous: true,
    fur: '#ffa24f', furAccent: '#e0762c', pattern: 'stripes', eyeColor: '#7fe06a',
    hat: 'tophat', outfit: 'vest', outfitColor: '#3c3f8b', accessory: 'monocle',
    favoritePalettes: ['chocolate', 'berry', 'sunny'], favoriteShapes: ['square', 'round'],
  },
  {
    id: 'lihtaryk', name: { uk: 'Ліхтарик', ja: 'ランタンくん' }, firstDay: 1, voicePitch: 1.5, isKitten: true,
    fur: '#ffae5c', furAccent: '#ffffff', pattern: 'bicolor', eyeColor: '#3fe0c8',
    hat: 'souwester', outfit: 'raincoat', outfitColor: '#ffd23f',
    favoritePalettes: ['sunny', 'forest'], favoriteShapes: ['star', 'round'],
  },
  {
    id: 'vusan', name: { uk: 'Капітан Вусань', ja: 'ヒゲ船長' }, firstDay: 1, voicePitch: 0.75,
    fur: '#a9b4c8', furAccent: '#6f7a92', pattern: 'stripes', eyeColor: '#ffc24a',
    hat: 'captain', outfit: 'sailor', outfitColor: '#2f5fc8',
    favoritePalettes: ['sea', 'night'], favoriteShapes: ['square', 'star'],
    orderRule: { glazes: ['blue', 'sky', 'teal'], label: { uk: 'блакитні торти', ja: '青いケーキ' } },
  },
  {
    id: 'mzhychka', name: { uk: 'Відьмочка Мжичка', ja: '魔女っ子キリサメ' }, firstDay: 2, voicePitch: 1.1, isDarkFur: true,
    fur: '#3a3150', furAccent: '#241d36', pattern: 'none', eyeColor: '#ffe14a',
    hat: 'witch', outfit: 'cloak', outfitColor: '#7a3fd0',
    favoritePalettes: ['night', 'lavender', 'forest'], favoriteShapes: ['star', 'heart'],
    orderRule: { glazes: ['purple', 'plum', 'lilac'], label: { uk: 'фіолетові торти', ja: '紫のケーキ' } },
  },
  {
    id: 'bulochka', name: { uk: 'Тітонька Булочка', ja: 'マフィンおばさん' }, firstDay: 2, voicePitch: 0.95, ordersBigCakes: true,
    fur: '#fff6ea', furAccent: '#ff9a45', furPatch: '#4a3a40', pattern: 'calico', eyeColor: '#9be05a',
    hat: 'kerchief', outfit: 'apron', outfitColor: '#ff5a7a',
    favoritePalettes: ['chocolate', 'sunny', 'berry'], favoriteShapes: ['round', 'square', 'heart'],
  },
  {
    id: 'mokhovyk', name: { uk: 'Лісовик Моховик', ja: '森番コケまる' }, firstDay: 2, voicePitch: 0.9,
    fur: '#a07e56', furAccent: '#6e5236', pattern: 'stripes', eyeColor: '#9be85a',
    hat: 'mushroom', outfit: 'leafy', outfitColor: '#3f8f4e',
    favoritePalettes: ['forest'], favoriteShapes: ['round', 'heart'],
    orderRule: { glazes: ['green', 'lime', 'forest'], label: { uk: 'зелені торти', ja: '緑のケーキ' } },
  },
  {
    id: 'serdenko', name: { uk: 'Поет Серденько', ja: '詩人ココロ' }, firstDay: 2, voicePitch: 1.15,
    fur: '#dcd5ea', furAccent: '#a99fc0', pattern: 'stripes', eyeColor: '#ff8fc8',
    hat: 'beret', outfit: 'vest', outfitColor: '#b0304f',
    favoritePalettes: ['berry', 'lavender', 'chocolate'], favoriteShapes: ['heart'],
    orderRule: { shapes: ['heart'], label: { uk: 'торти-сердечка', ja: 'ハートのケーキ' } },
  },
  {
    id: 'murlin', name: { uk: 'Професор Мурлін', ja: 'ニャーリン教授' }, firstDay: 3, voicePitch: 0.9, isGenerous: true,
    fur: '#f4e8d6', furAccent: '#6a4c3c', pattern: 'points', eyeColor: '#4aa8ff',
    hat: 'wizard', outfit: 'robe', outfitColor: '#2e3c9a', accessory: 'glasses',
    favoritePalettes: ['night', 'sea', 'lavender'], favoriteShapes: ['star', 'square'],
  },
  {
    id: 'morok', name: { uk: 'Граф Морок', ja: 'ヤミヨ伯爵' }, firstDay: 3, voicePitch: 0.8, isDarkFur: true, isGenerous: true,
    fur: '#2c2536', furAccent: '#1a1522', pattern: 'none', eyeColor: '#ff4f6e',
    hat: 'gothic', outfit: 'gothic', outfitColor: '#2a1f3a',
    favoritePalettes: ['night'], favoriteShapes: ['heart', 'star', 'square'],
    orderRule: { glazes: ['black'], label: { uk: 'чорні торти', ja: '黒いケーキ' } },
  },
  {
    id: 'drimko', name: { uk: 'Звіздар Дрімко', ja: '星見のネムリン' }, firstDay: 4, voicePitch: 1.2,
    fur: '#f7efdf', furAccent: '#e2c597', pattern: 'points', eyeColor: '#7fb8ff',
    hat: 'nightcap', outfit: 'pajamas', outfitColor: '#4a5bc8',
    favoritePalettes: ['night', 'sea', 'lavender'], favoriteShapes: ['star'],
    orderRule: { shapes: ['star'], label: { uk: 'торти-зірки', ja: '星のケーキ' } },
  },
];

/** The special last guest of day 5. */
export const MOON_QUEEN: CatDef = {
  id: 'queen', name: { uk: 'Місячна Королева', ja: '月の女王' }, firstDay: 99, voicePitch: 1.05, isGenerous: true, ordersBigCakes: true,
  fur: '#d6deff', furAccent: '#aab6ec', pattern: 'none', eyeColor: '#c08cff',
  hat: 'crown', outfit: 'gown', outfitColor: '#8f9cf8',
  favoritePalettes: ['night', 'lavender', 'sea'], favoriteShapes: ['star', 'heart'],
};

/** The player's mascot on the title screen. */
export const CHEF_CAT: CatLook = {
  id: 'chef', fur: '#e6e0ff', furAccent: '#9a8ad0', pattern: 'stripes', eyeColor: '#5fe0c0',
  hat: 'chef', outfit: 'chef', outfitColor: '#ffffff',
};

/** Helper kitten bought in the shop; sits on the kitchen table. */
export const HELPER_KITTEN: CatLook = {
  id: 'pushok', isKitten: true, fur: '#ffffff', furAccent: '#e8e0f0', pattern: 'none', eyeColor: '#6aa8ff',
  hat: 'none', outfit: 'none', outfitColor: '#7fb0ff', accessory: 'bow',
};

export const catById = (id: CatId): CatDef => (id === 'queen' ? MOON_QUEEN : GUESTS.find(c => c.id === id)!);
