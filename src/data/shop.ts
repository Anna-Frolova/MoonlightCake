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
  // Helpers take the routine off the player's hands, but the choices stay theirs (see `autoComplete` of each station).
  {
    id: 'helper:layers', tab: 'helpers', price: 140,
    name: { uk: 'Чарівна лопатка', ja: '魔法のヘラ' },
    description: { uk: 'Перший корж і начинку кладеш ти, решту складає лопатка.', ja: '最初のスポンジとフィリングをのせれば、残りは自動で重ねる。' },
  },
  {
    id: 'helper:cream', tab: 'helpers', price: 130,
    name: { uk: 'Зачарований віночок', ja: '魔法の泡立て器' },
    description: { uk: 'Ти обираєш крем, а віночок сам обводить ним торт.', ja: 'クリームを選べば、自動でしぼる。' },
  },
  {
    id: 'helper:glaze', tab: 'helpers', price: 170,
    name: { uk: 'Розумний казан', ja: 'かしこい大釜' },
    description: { uk: 'Підказує рецепт кольору із замовлення. Змішуєш ти.', ja: '注文の色のレシピを教えてくれる。混ぜるのは自分で。' },
  },
  {
    id: 'helper:toppings', tab: 'helpers', price: 160,
    name: { uk: 'Кіт-помічник Пушок', ja: 'お手伝い猫ワタゲ' },
    description: { uk: 'Торкнись блюдця — і Пушок покладе прикрасу на торт.', ja: 'お皿をタップすると、ワタゲがトッピングをのせる。' },
  },
  {
    id: 'helper:magic', tab: 'helpers', price: 110,
    name: { uk: 'Кришталева куля', ja: '水晶玉' },
    description: { uk: 'Показує на торті знак, який треба намалювати.', ja: 'ケーキの上に描く印を見せてくれる。' },
  },
];

export const helperItemId = (station: HelperId) => `helper:${station}` as const;
