import type { PaletteDef, PaletteId } from './types';

/**
 * Colour palettes. An order picks one palette and takes every ingredient from it,
 * so all colours on a cake go together.
 */
export const PALETTES: Record<PaletteId, PaletteDef> = {
  berry: {
    name: { uk: 'Ягідна', ja: 'ベリー' }, swatches: ['#ff86b4', '#ff3d6e', '#fff6e2'],
    flavors: ['strawberry', 'vanilla', 'chocolate'], fillings: ['jam', 'caramel'], creams: ['berry', 'butter'],
    glazes: ['pink', 'red', 'cherry', 'white'],
    toppings: ['strawberry', 'raspberry', 'rosePink', 'currant', 'leaves', 'pearl'],
    elements: ['fire', 'star'],
  },
  sunny: {
    name: { uk: 'Сонячна', ja: 'お日さま' }, swatches: ['#ffd86b', '#ff9f2e', '#fff6e2'],
    flavors: ['vanilla', 'chocolate', 'strawberry'], fillings: ['caramel', 'honey', 'jam'], creams: ['butter', 'berry'],
    glazes: ['yellow', 'orange', 'sunset', 'lemon'],
    toppings: ['strawberry', 'goldPearl', 'leaves', 'roseWhite', 'currant'],
    elements: ['fire', 'bolt'],
  },
  sea: {
    name: { uk: 'Морська', ja: '海' }, swatches: ['#5fb4ff', '#5fe0ae', '#cfe8ff'],
    flavors: ['sky', 'mint', 'vanilla'], fillings: ['blueberry', 'jelly', 'honey'], creams: ['cloud', 'butter'],
    glazes: ['blue', 'teal', 'sky', 'white'],
    toppings: ['blueberry', 'pearl', 'leaves', 'roseWhite'],
    elements: ['ice', 'bolt'],
  },
  lavender: {
    name: { uk: 'Лавандова', ja: 'ラベンダー' }, swatches: ['#b58cff', '#ff86b4', '#e0d0ff'],
    flavors: ['lavender', 'strawberry', 'vanilla', 'sky'], fillings: ['blueberry', 'jam', 'jelly'], creams: ['moon', 'berry', 'cloud'],
    glazes: ['lilac', 'purple', 'pink', 'sky'],
    toppings: ['lavender', 'blueberry', 'rosePink', 'pearl'],
    elements: ['star', 'ice'],
  },
  forest: {
    name: { uk: 'Лісова', ja: '森' }, swatches: ['#5fe0ae', '#9a5a3c', '#ffd23d'],
    flavors: ['mint', 'chocolate', 'vanilla'], fillings: ['honey', 'caramel', 'jam'], creams: ['butter', 'cloud'],
    glazes: ['green', 'lime', 'forest', 'lemon'],
    toppings: ['leaves', 'blueberry', 'currant', 'strawberry', 'raspberry'],
    elements: ['nature', 'bolt'],
  },
  night: {
    name: { uk: 'Нічна', ja: '夜' }, swatches: ['#3f3aa8', '#7ff0ff', '#e0d0ff'],
    flavors: ['starry', 'lavender', 'chocolate', 'sky'], fillings: ['jelly', 'blueberry'], creams: ['moon', 'cloud'],
    glazes: ['night', 'black', 'plum', 'purple', 'sky'],
    toppings: ['blueberry', 'goldPearl', 'lavender', 'pearl'],
    elements: ['star', 'ice', 'bolt'],
  },
  chocolate: {
    name: { uk: 'Шоколадна', ja: 'チョコ' }, swatches: ['#9a5a3c', '#ff9f2e', '#ffb0d0'],
    flavors: ['chocolate', 'vanilla'], fillings: ['caramel', 'honey', 'jam'], creams: ['butter', 'berry'],
    glazes: ['cherry', 'orange', 'red', 'white'],
    toppings: ['strawberry', 'raspberry', 'goldPearl', 'currant', 'roseWhite'],
    elements: ['fire', 'nature'],
  },
  // the special guests' own palettes (their signature topping goes on every cake they order anyway)
  inferno: {
    name: { uk: 'Пекельна', ja: '地獄' }, swatches: ['#2a1a24', '#ff4a2a', '#ffb02e'], isSpecial: true,
    flavors: ['chocolate', 'starry'], fillings: ['caramel', 'jam', 'honey'], creams: ['butter', 'berry'],
    glazes: ['black', 'cherry', 'sunset', 'red'],
    toppings: ['chili', 'raspberry', 'currant', 'goldPearl', 'strawberry'],
    elements: ['dark'],
  },
  heaven: {
    name: { uk: 'Небесна', ja: '天国' }, swatches: ['#fffaf0', '#ffe9a0', '#cfe8ff'], isSpecial: true,
    flavors: ['vanilla', 'sky', 'strawberry'], fillings: ['honey', 'jelly', 'caramel'], creams: ['cloud', 'moon', 'butter'],
    glazes: ['white', 'lemon', 'sky', 'pink'],
    toppings: ['feather', 'pearl', 'goldPearl', 'roseWhite'],
    elements: ['light'],
  },
  dracula: {
    name: { uk: 'Вампірська', ja: '吸血鬼' }, swatches: ['#7a0f24', '#1a1020', '#e8d8e0'], isSpecial: true,
    flavors: ['chocolate', 'strawberry', 'starry'], fillings: ['jam', 'blueberry'], creams: ['berry', 'moon'],
    glazes: ['cherry', 'black', 'red', 'plum'],
    toppings: ['bat', 'currant', 'raspberry', 'rosePink'],
    elements: ['blood'],
  },
  shrine: {
    name: { uk: 'Самурайська', ja: '侍' }, swatches: ['#ffffff', '#e8323a', '#fff6e2'], isSpecial: true,
    flavors: ['vanilla', 'strawberry'], fillings: ['jam'], creams: ['butter'],
    glazes: ['white', 'red'],
    toppings: ['sushi', 'strawberry', 'raspberry', 'roseWhite'],
    elements: ['sakura'],
  },
  cult: {
    name: { uk: 'Таємнича', ja: '秘密結社' }, swatches: ['#1a1022', '#7a3fd0', '#b48cff'], isSpecial: true,
    flavors: ['chocolate', 'starry', 'lavender'], fillings: ['blueberry', 'jelly'], creams: ['moon', 'cloud'],
    glazes: ['black', 'purple', 'plum', 'night'],
    toppings: ['candle', 'blueberry', 'currant', 'lavender'],
    elements: ['dark'],
  },
  meadow: {
    name: { uk: 'Квіткова', ja: '花畑' }, swatches: ['#ff9ccb', '#5fe0ae', '#fff6e2'], isSpecial: true,
    flavors: ['mint', 'strawberry', 'lavender'], fillings: ['honey', 'jam', 'jelly'], creams: ['berry', 'butter'],
    glazes: ['pink', 'green', 'lime', 'forest'],
    toppings: ['butterfly', 'leaves', 'rosePink', 'lavender', 'strawberry'],
    elements: ['nature'],
  },
};
