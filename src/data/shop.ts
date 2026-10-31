import type { HelperId, ShopItemDef } from './types';

export const SHOP_ITEMS: ShopItemDef[] = [
  // Decor: visible in the café, each adds a share to every tip.
  {
    id: 'decor:garland', tab: 'decor', price: 40, tipBonus: 0.05,
    name: { uk: 'Гірлянда-світлячки', ja: 'ホタルのガーランド' },
    description: { uk: 'Чарівні вогники під стелею.', ja: '天井にきらめく魔法の灯り。' },
  },
  {
    id: 'decor:catnip', tab: 'decor', price: 50, tipBonus: 0.05,
    name: { uk: "Котяча м'ята", ja: 'キャットニップ' },
    description: { uk: 'Світні вазони на прилавку.', ja: 'カウンターで光る植木鉢。' },
  },
  {
    id: 'decor:gramophone', tab: 'decor', price: 65, tipBonus: 0.06,
    name: { uk: 'Грамофон', ja: '蓄音機' },
    description: { uk: 'Тиха музика на полиці.', ja: '棚から流れる静かな音楽。' },
  },
  {
    id: 'decor:cushion', tab: 'decor', price: 80, tipBonus: 0.08,
    name: { uk: 'Подушка на підвіконні', ja: '窓辺のクッション' },
    description: { uk: 'Сюди приходить поспати кошеня.', ja: '子猫がお昼寝しにやって来る。' },
  },
  {
    id: 'decor:vitrage', tab: 'decor', price: 110, tipBonus: 0.10,
    name: { uk: 'Місячний вітраж', ja: '月のステンドグラス' },
    description: { uk: 'Кругле вікно з кольорового скла.', ja: '色ガラスの丸い窓。' },
  },
  {
    id: 'decor:chandelier', tab: 'decor', price: 150, tipBonus: 0.12,
    name: { uk: 'Кришталева люстра', ja: 'クリスタルのシャンデリア' },
    description: { uk: 'Розкішне сяйво над прилавком.', ja: 'カウンターの上に豪華な輝き。' },
  },
  // Helpers: each adds an "Auto" button to its kitchen station.
  {
    id: 'helper:layers', tab: 'helpers', price: 140,
    name: { uk: 'Чарівна лопатка', ja: '魔法のヘラ' },
    description: { uk: 'Сама обирає форму й складає коржі з начинкою.', ja: '形を選んで、スポンジとフィリングを重ねてくれる。' },
  },
  {
    id: 'helper:cream', tab: 'helpers', price: 130,
    name: { uk: 'Зачарований віночок', ja: '魔法の泡立て器' },
    description: { uk: 'Сам ідеально обводить торт потрібним кремом.', ja: '注文どおりのクリームで完璧にしぼってくれる。' },
  },
  {
    id: 'helper:glaze', tab: 'helpers', price: 170,
    name: { uk: 'Розумний казан', ja: 'かしこい大釜' },
    description: { uk: 'Сам змішує потрібний колір і поливає торт.', ja: '注文の色を混ぜて、ケーキにかけてくれる。' },
  },
  {
    id: 'helper:toppings', tab: 'helpers', price: 160,
    name: { uk: 'Кіт-помічник Пушок', ja: 'お手伝い猫ワタゲ' },
    description: { uk: 'Розкладає прикраси точно за замовленням.', ja: '注文どおりにトッピングを並べてくれる。' },
  },
  {
    id: 'helper:magic', tab: 'helpers', price: 110,
    name: { uk: 'Кришталева куля', ja: '水晶玉' },
    description: { uk: 'Ідеальне зачарування одним дотиком.', ja: 'ひと触れで完璧な魔法。' },
  },
];

export const helperItemId = (station: HelperId) => `helper:${station}` as const;
