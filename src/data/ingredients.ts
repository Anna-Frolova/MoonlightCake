// Everything that goes into a cake.
import type {
  CreamDef, CreamId, EssenceDef, EssenceId, FillingDef, FillingId, FlavorDef, FlavorId,
  GlazeColorDef, GlazeColorId, ShapeDef, ShapeId, ToppingDef, ToppingId,
} from './types';

export const SHAPES: Record<ShapeId, ShapeDef> = {
  round:  { name: { uk: 'Круг',    ja: '丸' },     noun: { uk: 'круглий торт',    ja: '丸いケーキ' } },
  square: { name: { uk: 'Квадрат', ja: '四角' },   noun: { uk: 'квадратний торт', ja: '四角いケーキ' } },
  heart:  { name: { uk: 'Серце',   ja: 'ハート' }, noun: { uk: 'торт-сердечко',   ja: 'ハートのケーキ' } },
  star:   { name: { uk: 'Зірка',   ja: '星' },     noun: { uk: 'торт-зірка',      ja: '星のケーキ' } },
};

/** Cake layer flavours (коржі). */
export const FLAVORS: Record<FlavorId, FlavorDef> = {
  vanilla:    { name: { uk: 'Ванільний',  ja: 'バニラ' },     color: '#ffd86b' },
  chocolate:  { name: { uk: 'Шоколадний', ja: 'チョコ' },     color: '#9a5a3c' },
  strawberry: { name: { uk: 'Полуничний', ja: 'いちご' },     color: '#ff86b4' },
  lavender:   { name: { uk: 'Лавандовий', ja: 'ラベンダー' }, color: '#b58cff' },
  mint:       { name: { uk: "М'ятний",    ja: 'ミント' },     color: '#5fe0ae' },
  sky:        { name: { uk: 'Небесний',   ja: '空色' },       color: '#5fb4ff' },
  starry:     { name: { uk: 'Зоряний',    ja: '星空' },       color: '#3f3aa8', sparkles: true },
};

export const FILLINGS: Record<FillingId, FillingDef> = {
  jam:       { name: { uk: 'Полуничний джем',  ja: 'いちごジャム' },       shortName: { uk: 'Джем',     ja: 'ジャム' },     color: '#ff3d6e' },
  caramel:   { name: { uk: 'Карамель',         ja: 'キャラメル' },         shortName: { uk: 'Карамель', ja: 'キャラメル' }, color: '#ff9f2e' },
  blueberry: { name: { uk: 'Чорничне варення', ja: 'ブルーベリージャム' }, shortName: { uk: 'Чорниця',  ja: 'ベリー' },     color: '#6a4dff' },
  honey:     { name: { uk: 'Медовий нектар',   ja: 'はちみつ' },           shortName: { uk: 'Мед',      ja: 'はちみつ' },   color: '#ffd23d' },
  jelly:     { name: { uk: 'Місячне желе',     ja: '月のゼリー' },         shortName: { uk: 'Желе',     ja: 'ゼリー' },     color: '#7ff0ff', glows: true },
};

export const CREAMS: Record<CreamId, CreamDef> = {
  butter: { name: { uk: 'Вершковий',   ja: 'バター' }, color: '#fff6e2' },
  berry:  { name: { uk: 'Ягідний',     ja: 'ベリー' }, color: '#ffb0d0' },
  cloud:  { name: { uk: 'Хмаринковий', ja: 'ふわ雲' }, color: '#cfe8ff' },
  moon:   { name: { uk: 'Місячний',    ja: '月光' },   color: '#e0d0ff', glows: true },
};

/** Elixirs on the shelf; mixed in the cauldron to make the glaze colour. */
export const ESSENCES: Record<EssenceId, EssenceDef> = {
  red:    { name: { uk: 'Червона', ja: '赤' }, color: '#e8434d', unlockDay: 1 },
  yellow: { name: { uk: 'Жовта',   ja: '黄' }, color: '#f7c832', unlockDay: 1 },
  blue:   { name: { uk: 'Синя',    ja: '青' }, color: '#3a6fe0', unlockDay: 1 },
  white:  { name: { uk: 'Біла',    ja: '白' }, color: '#fbf8ff', unlockDay: 2 },
  dark:   { name: { uk: 'Темна',   ja: '黒' }, color: '#2a2140', unlockDay: 3 },
};
export const ESSENCE_ORDER: EssenceId[] = ['red', 'yellow', 'blue', 'white', 'dark'];

export const TOPPINGS: Record<ToppingId, ToppingDef> = {
  strawberry: { name: { uk: 'Полуниця',     ja: 'いちご' } },
  currant:    { name: { uk: 'Смородина',    ja: 'カシス' } },
  blueberry:  { name: { uk: 'Лохина',       ja: 'ブルーベリー' } },
  raspberry:  { name: { uk: 'Малина',       ja: 'ラズベリー' } },
  rosePink:   { name: { uk: 'Троянда',      ja: 'バラ' } },
  roseWhite:  { name: { uk: 'Біла троянда', ja: '白バラ' } },
  leaves:     { name: { uk: 'Листочки',     ja: '葉っぱ' } },
  pearl:      { name: { uk: 'Перлинки',     ja: 'パール' } },
  goldPearl:  { name: { uk: 'Золоті перли', ja: '金のパール' } },
  lavender:   { name: { uk: 'Лаванда',      ja: 'ラベンダー' } },
};

/** Glaze colours that orders can ask for, with the drops needed to mix them. */
export const GLAZE_COLORS: GlazeColorDef[] = [
  { id: 'red',    name: { uk: 'Червона',             ja: '赤' },           recipe: { red: 1 } },
  { id: 'yellow', name: { uk: 'Жовта',               ja: '黄色' },         recipe: { yellow: 1 } },
  { id: 'blue',   name: { uk: 'Синя',                ja: '青' },           recipe: { blue: 1 } },
  { id: 'orange', name: { uk: 'Помаранчева',         ja: 'オレンジ' },     recipe: { red: 1, yellow: 1 } },
  { id: 'green',  name: { uk: 'Зелена',              ja: '緑' },           recipe: { yellow: 1, blue: 1 } },
  { id: 'purple', name: { uk: 'Фіолетова',           ja: '紫' },           recipe: { red: 1, blue: 1 } },
  { id: 'sunset', name: { uk: 'Червоно-помаранчева', ja: '朱色' },         recipe: { red: 2, yellow: 1 } },
  { id: 'teal',   name: { uk: 'Бірюзова',            ja: 'ターコイズ' },   recipe: { blue: 2, yellow: 1 } },
  { id: 'lime',   name: { uk: 'Салатова',            ja: '黄緑' },         recipe: { yellow: 2, blue: 1 } },
  { id: 'pink',   name: { uk: 'Рожева',              ja: 'ピンク' },       recipe: { red: 1, white: 1 } },
  { id: 'sky',    name: { uk: 'Блакитна',            ja: '水色' },         recipe: { blue: 1, white: 1 } },
  { id: 'lilac',  name: { uk: 'Бузкова',             ja: 'ライラック' },   recipe: { red: 1, blue: 1, white: 1 } },
  { id: 'lemon',  name: { uk: 'Світло-жовта',        ja: 'レモン色' },     recipe: { yellow: 1, white: 1 } },
  { id: 'white',  name: { uk: 'Біла',                ja: '白' },           recipe: { white: 1 } },
  { id: 'night',  name: { uk: 'Темно-синя',          ja: '紺色' },         recipe: { blue: 1, dark: 1 } },
  { id: 'plum',   name: { uk: 'Темно-фіолетова',     ja: '濃い紫' },       recipe: { red: 1, blue: 1, dark: 1 } },
  { id: 'forest', name: { uk: 'Темно-зелена',        ja: '深緑' },         recipe: { yellow: 1, blue: 1, dark: 1 } },
  { id: 'cherry', name: { uk: 'Бордова',             ja: 'ワインレッド' }, recipe: { red: 1, dark: 1 } },
  { id: 'black',  name: { uk: 'Чорна',               ja: '黒' },           recipe: { dark: 1 } },
];
export const glazeColorById = (id: GlazeColorId): GlazeColorDef => GLAZE_COLORS.find(c => c.id === id)!;

/** Mixing tips shown on the glaze station (pairs of essences → resulting glaze colour). */
export const MIXING_TIPS: { a: EssenceId; b: EssenceId; result: GlazeColorId }[] = [
  { a: 'red', b: 'yellow', result: 'orange' },
  { a: 'yellow', b: 'blue', result: 'green' },
  { a: 'red', b: 'blue', result: 'purple' },
  { a: 'red', b: 'white', result: 'pink' },
  { a: 'blue', b: 'dark', result: 'night' },
  { a: 'dark', b: 'dark', result: 'black' },
];
