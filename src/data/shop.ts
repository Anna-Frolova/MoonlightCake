import type { HelperId, ShopItemDef } from './types';

export const SHOP_ITEMS: ShopItemDef[] = [
  // Decor: visible in the café, each adds a share to every tip.
  { id: 'decor:garland', tab: 'decor', name: 'Гірлянда-світлячки', description: 'Чарівні вогники під стелею.', price: 40, tipBonus: 0.05 },
  { id: 'decor:catnip', tab: 'decor', name: "Котяча м'ята", description: 'Світні вазони на прилавку.', price: 50, tipBonus: 0.05 },
  { id: 'decor:gramophone', tab: 'decor', name: 'Грамофон', description: 'Тиха музика на полиці.', price: 65, tipBonus: 0.06 },
  { id: 'decor:cushion', tab: 'decor', name: 'Подушка на підвіконні', description: 'Сюди приходить поспати кошеня.', price: 80, tipBonus: 0.08 },
  { id: 'decor:vitrage', tab: 'decor', name: 'Місячний вітраж', description: 'Кругле вікно з кольорового скла.', price: 110, tipBonus: 0.10 },
  { id: 'decor:chandelier', tab: 'decor', name: 'Кришталева люстра', description: 'Розкішне сяйво над прилавком.', price: 150, tipBonus: 0.12 },
  // Helpers: each adds an "Авто" button to its kitchen station.
  { id: 'helper:layers', tab: 'helpers', name: 'Чарівна лопатка', description: 'Сама обирає форму й складає коржі з начинкою.', price: 140 },
  { id: 'helper:cream', tab: 'helpers', name: 'Зачарований віночок', description: 'Сам ідеально обводить торт потрібним кремом.', price: 130 },
  { id: 'helper:glaze', tab: 'helpers', name: 'Розумний казан', description: 'Сам змішує потрібний колір і поливає торт.', price: 170 },
  { id: 'helper:toppings', tab: 'helpers', name: 'Кіт-помічник Пушок', description: 'Розкладає прикраси точно за замовленням.', price: 160 },
  { id: 'helper:magic', tab: 'helpers', name: 'Кришталева куля', description: 'Ідеальне зачарування одним дотиком.', price: 110 },
];

export const helperItemId = (station: HelperId) => `helper:${station}` as const;
