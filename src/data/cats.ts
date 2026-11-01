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
    orderRule: { glazes: ['blue', 'sky', 'teal'] },
  },
  {
    id: 'mzhychka', name: { uk: 'Відьмочка Мжичка', ja: '魔女っ子キリサメ' }, firstDay: 2, voicePitch: 1.1, isDarkFur: true,
    fur: '#3a3150', furAccent: '#241d36', pattern: 'none', eyeColor: '#ffe14a',
    hat: 'witch', outfit: 'cloak', outfitColor: '#7a3fd0',
    favoritePalettes: ['night', 'lavender', 'forest'], favoriteShapes: ['star', 'heart'],
    orderRule: { glazes: ['purple', 'plum', 'lilac'] },
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
    orderRule: { glazes: ['green', 'lime', 'forest'] },
  },
  {
    id: 'serdenko', name: { uk: 'Поет Серденько', ja: '詩人ココロ' }, firstDay: 2, voicePitch: 1.15,
    fur: '#dcd5ea', furAccent: '#a99fc0', pattern: 'stripes', eyeColor: '#ff8fc8',
    hat: 'beret', outfit: 'vest', outfitColor: '#b0304f',
    favoritePalettes: ['berry', 'lavender', 'chocolate'], favoriteShapes: ['heart'],
    orderRule: { shapes: ['heart'] },
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
    orderRule: { glazes: ['black'] },
  },
  {
    id: 'drimko', name: { uk: 'Звіздар Дрімко', ja: '星見のネムリン' }, firstDay: 4, voicePitch: 1.2,
    fur: '#f7efdf', furAccent: '#e2c597', pattern: 'points', eyeColor: '#7fb8ff',
    hat: 'nightcap', outfit: 'pajamas', outfitColor: '#4a5bc8',
    favoritePalettes: ['night', 'sea', 'lavender'], favoriteShapes: ['star'],
    orderRule: { shapes: ['star'] },
  },
  {
    id: 'teacher', name: { uk: 'Пані Крейдочка', ja: 'チョーク先生' }, firstDay: 1, voicePitch: 1.05,
    fur: '#c9cfe0', furAccent: '#8f97b4', pattern: 'stripes', eyeColor: '#6ad0a0',
    hat: 'bun', outfit: 'cardigan', outfitColor: '#3f9a8a', accessory: 'glasses',
    favoritePalettes: ['sunny', 'forest', 'berry'], favoriteShapes: ['square', 'round'],
  },
  {
    id: 'grandpa', name: { uk: 'Дідусь Сивоус', ja: '白ひげじいさん' }, firstDay: 3, voicePitch: 0.7,
    fur: '#b8b0a8', furAccent: '#8a8078', pattern: 'none', eyeColor: '#8fb8ff',
    hat: 'flatcap', outfit: 'vest', outfitColor: '#7a5a3e', accessory: 'beard', extraAccessory: 'glasses',
    favoritePalettes: ['chocolate', 'sunny', 'forest'], favoriteShapes: ['round', 'square'],
  },
];

/**
 * Special guests: one of them visits every day, two a day in endless mode (the day of their `firstDay` they come
 * for sure; the cultist first comes on day 6, the first endless day).
 * Each orders cakes in their own style with their own magic, and the kitchen and the music change for them.
 */
export const SPECIAL_GUESTS: CatDef[] = [
  {
    id: 'demon', name: { uk: 'Демон Жарик', ja: '悪魔のホムラ' }, firstDay: 2, voicePitch: 0.7, isGenerous: true,
    fur: '#c8423a', furAccent: '#8a2228', pattern: 'stripes', eyeColor: '#ffd23f',
    hat: 'horns', outfit: 'demon', outfitColor: '#2a1418', back: 'batWings', hasSpadeTail: true,
    favoritePalettes: ['inferno'], favoriteShapes: ['star', 'square'],
    special: { theme: 'dungeon', palette: 'inferno', element: 'dark', topping: 'chili' },
  },
  {
    id: 'angel', name: { uk: 'Янгол Промінчик', ja: '天使のヒカリ' }, firstDay: 3, voicePitch: 1.35, isGenerous: true,
    fur: '#fffaf0', furAccent: '#f1dfb4', pattern: 'none', eyeColor: '#5fb8ff',
    hat: 'halo', outfit: 'angel', outfitColor: '#ffffff', back: 'featherWings',
    favoritePalettes: ['heaven'], favoriteShapes: ['heart', 'round'],
    special: { theme: 'heaven', palette: 'heaven', element: 'light', topping: 'feather' },
  },
  {
    id: 'vampire', name: { uk: 'Князь Вампурр', ja: 'ヴァンプール公' }, firstDay: 4, voicePitch: 0.85, isGenerous: true,
    fur: '#ece4ef', furAccent: '#3a2a40', pattern: 'points', eyeColor: '#ff2a4a',
    hat: 'vampire', outfit: 'vampire', outfitColor: '#1c1222', back: 'cape', accessory: 'fangs',
    favoritePalettes: ['dracula'], favoriteShapes: ['heart', 'square'],
    special: { theme: 'palace', palette: 'dracula', element: 'blood', topping: 'bat' },
  },
  {
    id: 'samurai', name: { uk: 'Самурай Котаро', ja: '侍のコタロウ' }, firstDay: 5, voicePitch: 0.85, isGenerous: true,
    fur: '#f2ece2', furAccent: '#9a8a78', pattern: 'stripes', eyeColor: '#e8a030',
    hat: 'topknot', outfit: 'samurai', outfitColor: '#2a3a6a', back: 'katana',
    favoritePalettes: ['shrine'], favoriteShapes: ['round', 'square'],
    special: { theme: 'shrine', palette: 'shrine', element: 'sakura', topping: 'mochi' },
  },
  {
    id: 'cultist', name: { uk: 'Брат Шепіт', ja: 'ささやき兄弟' }, firstDay: 6, voicePitch: 0.8, isGenerous: true, isDarkFur: true,
    fur: '#3a3448', furAccent: '#24202e', pattern: 'none', eyeColor: '#c08cff',
    hat: 'hood', outfit: 'cultRobe', outfitColor: '#2e1a44',
    favoritePalettes: ['cult'], favoriteShapes: ['star', 'square'],
    special: { theme: 'cult', palette: 'cult', element: 'dark', topping: 'candle' },
  },
  {
    id: 'fairy', name: { uk: 'Фея Росинка', ja: '妖精のしずく' }, firstDay: 1, voicePitch: 1.45, isGenerous: true,
    fur: '#fff0f6', furAccent: '#ffc0dc', pattern: 'none', eyeColor: '#5fd08a',
    hat: 'leafCrown', outfit: 'petalDress', outfitColor: '#ff9ccb', back: 'fairyWings',
    favoritePalettes: ['meadow'], favoriteShapes: ['heart', 'round'],
    special: { theme: 'meadow', palette: 'meadow', element: 'nature', topping: 'butterfly' },
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

export const catById = (id: CatId): CatDef =>
  id === 'queen' ? MOON_QUEEN : [...GUESTS, ...SPECIAL_GUESTS].find(c => c.id === id)!;
