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
};
