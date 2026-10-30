// Everything that goes into a cake.
import type {
  CreamDef, CreamId, EssenceDef, EssenceId, FillingDef, FillingId, FlavorDef, FlavorId,
  GlazeColorDef, GlazeColorId, ShapeDef, ShapeId, ToppingDef, ToppingId,
} from './types';

export const SHAPES: Record<ShapeId, ShapeDef> = {
  round:  { name: 'Круг',    noun: 'круглий торт' },
  square: { name: 'Квадрат', noun: 'квадратний торт' },
  heart:  { name: 'Серце',   noun: 'торт-сердечко' },
  star:   { name: 'Зірка',   noun: 'торт-зірка' },
};

/** Cake layer flavours (коржі). */
export const FLAVORS: Record<FlavorId, FlavorDef> = {
  vanilla:    { name: 'Ванільний',  color: '#ffd86b' },
  chocolate:  { name: 'Шоколадний', color: '#9a5a3c' },
  strawberry: { name: 'Полуничний', color: '#ff86b4' },
  lavender:   { name: 'Лавандовий', color: '#b58cff' },
  mint:       { name: "М'ятний",    color: '#5fe0ae' },
  sky:        { name: 'Небесний',   color: '#5fb4ff' },
  starry:     { name: 'Зоряний',    color: '#3f3aa8', sparkles: true },
};

export const FILLINGS: Record<FillingId, FillingDef> = {
  jam:       { name: 'Полуничний джем',  shortName: 'Джем',     color: '#ff3d6e' },
  caramel:   { name: 'Карамель',         shortName: 'Карамель', color: '#ff9f2e' },
  blueberry: { name: 'Чорничне варення', shortName: 'Чорниця',  color: '#6a4dff' },
  honey:     { name: 'Медовий нектар',   shortName: 'Мед',      color: '#ffd23d' },
  jelly:     { name: 'Місячне желе',     shortName: 'Желе',     color: '#7ff0ff', glows: true },
};

export const CREAMS: Record<CreamId, CreamDef> = {
  butter: { name: 'Вершковий',   color: '#fff6e2' },
  berry:  { name: 'Ягідний',     color: '#ffb0d0' },
  cloud:  { name: 'Хмаринковий', color: '#cfe8ff' },
  moon:   { name: 'Місячний',    color: '#e0d0ff', glows: true },
};

/** Elixirs on the shelf; mixed in the cauldron to make the glaze colour. */
export const ESSENCES: Record<EssenceId, EssenceDef> = {
  red:    { name: 'Червона', color: '#e8434d', unlockDay: 1 },
  yellow: { name: 'Жовта',   color: '#f7c832', unlockDay: 1 },
  blue:   { name: 'Синя',    color: '#3a6fe0', unlockDay: 1 },
  white:  { name: 'Біла',    color: '#fbf8ff', unlockDay: 2 },
  dark:   { name: 'Темна',   color: '#2a2140', unlockDay: 3 },
};
export const ESSENCE_ORDER: EssenceId[] = ['red', 'yellow', 'blue', 'white', 'dark'];

export const TOPPINGS: Record<ToppingId, ToppingDef> = {
  strawberry: { name: 'Полуниця' },
  currant:    { name: 'Смородина' },
  blueberry:  { name: 'Лохина' },
  raspberry:  { name: 'Малина' },
  rosePink:   { name: 'Троянда' },
  roseWhite:  { name: 'Біла троянда' },
  leaves:     { name: 'Листочки' },
  pearl:      { name: 'Перлинки' },
  goldPearl:  { name: 'Золоті перли' },
  lavender:   { name: 'Лаванда' },
};

/** Glaze colours that orders can ask for, with the drops needed to mix them. */
export const GLAZE_COLORS: GlazeColorDef[] = [
  { id: 'red',    name: 'Червона',             recipe: { red: 1 } },
  { id: 'yellow', name: 'Жовта',               recipe: { yellow: 1 } },
  { id: 'blue',   name: 'Синя',                recipe: { blue: 1 } },
  { id: 'orange', name: 'Помаранчева',         recipe: { red: 1, yellow: 1 } },
  { id: 'green',  name: 'Зелена',              recipe: { yellow: 1, blue: 1 } },
  { id: 'purple', name: 'Фіолетова',           recipe: { red: 1, blue: 1 } },
  { id: 'sunset', name: 'Червоно-помаранчева', recipe: { red: 2, yellow: 1 } },
  { id: 'teal',   name: 'Бірюзова',            recipe: { blue: 2, yellow: 1 } },
  { id: 'lime',   name: 'Салатова',            recipe: { yellow: 2, blue: 1 } },
  { id: 'pink',   name: 'Рожева',              recipe: { red: 1, white: 1 } },
  { id: 'sky',    name: 'Блакитна',            recipe: { blue: 1, white: 1 } },
  { id: 'lilac',  name: 'Бузкова',             recipe: { red: 1, blue: 1, white: 1 } },
  { id: 'lemon',  name: 'Світло-жовта',        recipe: { yellow: 1, white: 1 } },
  { id: 'white',  name: 'Біла',                recipe: { white: 1 } },
  { id: 'night',  name: 'Темно-синя',          recipe: { blue: 1, dark: 1 } },
  { id: 'plum',   name: 'Темно-фіолетова',     recipe: { red: 1, blue: 1, dark: 1 } },
  { id: 'forest', name: 'Темно-зелена',        recipe: { yellow: 1, blue: 1, dark: 1 } },
  { id: 'cherry', name: 'Бордова',             recipe: { red: 1, dark: 1 } },
];
export const glazeColorById = (id: GlazeColorId): GlazeColorDef => GLAZE_COLORS.find(c => c.id === id)!;

/** Mixing tips shown on the glaze station (pairs of essences → result). */
export const MIXING_TIPS: { a: EssenceId; b: EssenceId; result: string }[] = [
  { a: 'red', b: 'yellow', result: 'Помаранчева' },
  { a: 'yellow', b: 'blue', result: 'Зелена' },
  { a: 'red', b: 'blue', result: 'Фіолетова' },
  { a: 'red', b: 'white', result: 'Рожева' },
  { a: 'blue', b: 'dark', result: 'Темно-синя' },
];
