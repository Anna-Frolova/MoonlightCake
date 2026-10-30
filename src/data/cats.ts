import type { CatDef, CatId, CatLook } from './types';

/** Regular guests, in the order they are introduced. */
export const GUESTS: CatDef[] = [
  {
    id: 'pushinka', name: 'Пані Пушинка', firstDay: 1, voicePitch: 1.25,
    fur: '#fbf4ff', furAccent: '#e9dcf5', pattern: 'none', eyeColor: '#ff7fbf',
    hat: 'flowers', outfit: 'dress', outfitColor: '#ff9ccb',
    favoritePalettes: ['berry', 'lavender'], favoriteShapes: ['heart', 'round'],
    lines: {
      hello: ['Мур-мур, добрий вечір!', 'Ох, яке чарівне місце!', 'Привіт, любий пекарю!'],
      ask: 'Мені, будь ласка, ось такий тортик:',
      good: ['Це найніжніший торт у світі! Мрр!', 'Ах, просто казка! Дякую!'],
      ok: ['Мило… але трішки не те.', 'Гарненький, хоч і не зовсім мій.'],
      bad: ['Ой… це зовсім не те, що я просила.', 'Мяу… я трошки засмучена.'],
    },
  },
  {
    id: 'barsyk', name: 'Сер Барсик', firstDay: 1, voicePitch: 0.85, isGenerous: true,
    fur: '#ffa24f', furAccent: '#e0762c', pattern: 'stripes', eyeColor: '#7fe06a',
    hat: 'tophat', outfit: 'vest', outfitColor: '#3c3f8b', accessory: 'monocle',
    favoritePalettes: ['chocolate', 'berry', 'sunny'], favoriteShapes: ['square', 'round'],
    lines: {
      hello: ['Добрий вечір, шановний кондитере.', 'Вітаю. Я маю бездоганний смак.'],
      ask: 'Прошу приготувати ось це:',
      good: ['Бездоганно! Мої вітання кухареві.', 'Шедевр, гідний лорда!'],
      ok: ['Пристойно. Але монокль бачить недоліки.'],
      bad: ['Хм. Це… сміливе прочитання мого замовлення.'],
    },
  },
  {
    id: 'lihtaryk', name: 'Ліхтарик', firstDay: 1, voicePitch: 1.5, isKitten: true,
    fur: '#ffae5c', furAccent: '#ffffff', pattern: 'bicolor', eyeColor: '#3fe0c8',
    hat: 'souwester', outfit: 'raincoat', outfitColor: '#ffd23f',
    favoritePalettes: ['sunny', 'forest'], favoriteShapes: ['star', 'round'],
    lines: {
      hello: ['Привіт! Мама дала мені монетки!', 'Ура, торти! Ура!'],
      ask: 'Я хочу-хочу ось такий!',
      good: ['Ва-а-ау! Найкращий торт у моєму житті!'],
      ok: ['Смачно! Але трішки не такий…'],
      bad: ['Ой… я хотів інший… *шмиг*'],
    },
  },
  {
    id: 'vusan', name: 'Капітан Вусань', firstDay: 1, voicePitch: 0.75,
    fur: '#a9b4c8', furAccent: '#6f7a92', pattern: 'stripes', eyeColor: '#ffc24a',
    hat: 'captain', outfit: 'sailor', outfitColor: '#2f5fc8',
    favoritePalettes: ['sea', 'night'], favoriteShapes: ['square', 'star'],
    lines: {
      hello: ['Агов, на кораблі!', 'Тримай курс на смачне, юнго!'],
      ask: 'Юнго, ось креслення мого торта:',
      good: ['Тисяча рибок! Чудовий торт!'],
      ok: ['Пливе, але кренить на лівий борт.'],
      bad: ['Шторм мені у вуса! Це не той торт.'],
    },
  },
  {
    id: 'mzhychka', name: 'Відьмочка Мжичка', firstDay: 2, voicePitch: 1.1, isDarkFur: true,
    fur: '#3a3150', furAccent: '#241d36', pattern: 'none', eyeColor: '#ffe14a',
    hat: 'witch', outfit: 'cloak', outfitColor: '#7a3fd0',
    favoritePalettes: ['night', 'lavender', 'forest'], favoriteShapes: ['star', 'heart'],
    lines: {
      hello: ['Мрр… відчуваю тут чари.', 'Привіт! Я щойно з шабашу.'],
      ask: 'Зачаклуй мені ось такий:',
      good: ['Відьомськи смачно! Мяу-ха-ха!'],
      ok: ['Непогано, але зілля було б кращим.'],
      bad: ['Пфф! Перетворю тебе на жабку… жартую.'],
    },
  },
  {
    id: 'bulochka', name: 'Тітонька Булочка', firstDay: 2, voicePitch: 0.95, ordersBigCakes: true,
    fur: '#fff6ea', furAccent: '#ff9a45', furPatch: '#4a3a40', pattern: 'calico', eyeColor: '#9be05a',
    hat: 'kerchief', outfit: 'apron', outfitColor: '#ff5a7a',
    favoritePalettes: ['chocolate', 'sunny', 'berry'], favoriteShapes: ['round', 'square', 'heart'],
    lines: {
      hello: ['Ой, дитинко, привіт!', 'А я до тебе на тортик!'],
      ask: 'Зроби мені, сонечко, такий тортик:',
      good: ['Ох, як у бабусі! Обійму тебе!'],
      ok: ['Смачненько, але чогось бракує.'],
      bad: ['Ой, сонечко, щось сьогодні не вийшло…'],
    },
  },
  {
    id: 'murlin', name: 'Професор Мурлін', firstDay: 3, voicePitch: 0.9, isGenerous: true,
    fur: '#f4e8d6', furAccent: '#6a4c3c', pattern: 'points', eyeColor: '#4aa8ff',
    hat: 'wizard', outfit: 'robe', outfitColor: '#2e3c9a', accessory: 'glasses',
    favoritePalettes: ['night', 'sea', 'lavender'], favoriteShapes: ['star', 'square'],
    lines: {
      hello: ['Доброго вечора, юний чарівнику.', 'А, мій улюблений кондитер!'],
      ask: 'Ось мій рецепт:',
      good: ['Блискуче! Чари бездоганні!'],
      ok: ['Майже правильно. Оцінка — «добре».'],
      bad: ['Хм-м. Варто перечитати підручник.'],
    },
  },
];

/** The special last guest of day 5. */
export const MOON_QUEEN: CatDef = {
  id: 'queen', name: 'Місячна Королева', firstDay: 99, voicePitch: 1.05, isGenerous: true, ordersBigCakes: true,
  fur: '#d6deff', furAccent: '#aab6ec', pattern: 'none', eyeColor: '#c08cff',
  hat: 'crown', outfit: 'gown', outfitColor: '#8f9cf8',
  favoritePalettes: ['night', 'lavender', 'sea'], favoriteShapes: ['star', 'heart'],
  lines: {
    hello: ['Я чула, що тут печуть найчарівніші торти.'],
    ask: 'Ось мій королівський торт:',
    good: ['Відтепер це кафе — під захистом Місяця!'],
    ok: ['Гідно. Місяць усміхається.'],
    bad: ['Місяць сьогодні в хмарах…'],
  },
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
