import type { HelperId, ShopItemDef } from './types';

export const SHOP_ITEMS: ShopItemDef[] = [
  // Decor: visible in the café, each adds a share to every tip.
  {
    id: 'decor:garland', tab: 'decor', price: 40, tipBonus: 0.05,
    name: { uk: 'Гірлянда-світлячки', ja: 'ホタルのガーランド' },
  },
  {
    id: 'decor:catnip', tab: 'decor', price: 50, tipBonus: 0.05,
    name: { uk: "Котяча м'ята", ja: 'キャットニップ' },
  },
  {
    id: 'decor:gramophone', tab: 'decor', price: 65, tipBonus: 0.06,
    name: { uk: 'Грамофон', ja: '蓄音機' },
  },
  {
    id: 'decor:cushion', tab: 'decor', price: 80, tipBonus: 0.08,
    name: { uk: 'Подушка на підвіконні', ja: '窓辺のクッション' },
  },
  {
    id: 'decor:vitrage', tab: 'decor', price: 110, tipBonus: 0.10,
    name: { uk: 'Місячний вітраж', ja: '月のステンドグラス' },
  },
  {
    id: 'decor:chandelier', tab: 'decor', price: 150, tipBonus: 0.12,
    name: { uk: 'Кришталева люстра', ja: 'クリスタルのシャンデリア' },
  },
  // Helpers: each adds an "Auto" button to its kitchen station.
  {
    id: 'helper:layers', tab: 'helpers', price: 140,
    name: { uk: 'Чарівна лопатка', ja: '魔法のヘラ' },
    description: { uk: 'Сама складає коржі й начинку.', ja: 'スポンジとフィリングを自動で重ねる。' },
  },
  {
    id: 'helper:cream', tab: 'helpers', price: 130,
    name: { uk: 'Зачарований віночок', ja: '魔法の泡立て器' },
    description: { uk: 'Сам обводить торт кремом.', ja: 'クリームを自動でしぼる。' },
  },
  {
    id: 'helper:glaze', tab: 'helpers', price: 170,
    name: { uk: 'Розумний казан', ja: 'かしこい大釜' },
    description: { uk: 'Сам змішує колір і поливає торт.', ja: '色を混ぜて自動でかける。' },
  },
  {
    id: 'helper:toppings', tab: 'helpers', price: 160,
    name: { uk: 'Кіт-помічник Пушок', ja: 'お手伝い猫ワタゲ' },
    description: { uk: 'Сам розкладає прикраси.', ja: 'トッピングを自動で並べる。' },
  },
  {
    id: 'helper:magic', tab: 'helpers', price: 110,
    name: { uk: 'Кришталева куля', ja: '水晶玉' },
    description: { uk: 'Ідеальні чари одним дотиком.', ja: 'ひと触れで完璧な魔法。' },
  },
];

export const helperItemId = (station: HelperId) => `helper:${station}` as const;
