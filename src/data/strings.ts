// Interface texts in every language. Names of cats, ingredients and shop items live next to
// their data (`{ uk, ja }` fields); here is everything else the player reads.
// `ja` must have exactly the same keys as `uk` — TypeScript reports anything missing.
import { loc, type Localized } from '../core/language';
import type { HelperId, MenuCategory } from './types';

type ScorePartKind = 'shape' | 'layers' | 'filling' | 'cream' | 'glaze' | 'toppings' | 'magic' | 'speed';

const uk = {
  gameTitle: 'Місячний Корж',
  tagline: 'магічна кондитерська для котів',
  signSubtitle: 'торти з чарами',
  rotatePhone: 'Поверни телефон горизонтально ↻',

  // title
  continueDay: (day: number) => `Продовжити · день ${day}`,
  newGame: 'Нова гра',
  openCafe: 'Відкрити кафе',
  confirmNewGame: 'Почати заново? Увесь прогрес буде втрачено.',
  start: 'Почати',
  cancel: 'Скасувати',

  // day counter, start and end of a day
  dayAndGuest: (day: number, guest: number, total: number) => `День ${day} · Гість ${guest}/${total}`,
  dayTitle: (day: number) => `День ${day}`,
  storyDaySubtitle: (storyDays: number, guests: number) => `із ${storyDays} · гостей сьогодні: ${guests}`,
  endlessDaySubtitle: (guests: number) => `нескінченний режим · гостей: ${guests}`,
  newGuestsNote: (names: string[]) => `Нові гості: ${names.join(', ')}.`,
  newEssenceNote: (names: string[]) => `У казані нова есенція: ${names.map(n => n.toLowerCase()).join(', ')}!`,
  newElementNote: (element: string, sign: string) => `Нова стихія — ${element.toLowerCase()}! Її знак: «${sign}».`,
  queenRumorNote: 'Ходять чутки, що сьогодні завітає сама Місячна Королева…',
  menuTitle: 'Меню дня',
  menuLabels: { shapes: 'Форми', flavors: 'Коржі', fillings: 'Начинки', creams: 'Креми', toppings: 'Прикраси' } as Record<MenuCategory, string>,
  badgeNew: 'НОВЕ',
  badgeAgain: 'ЗНОВУ',
  dayFinished: (day: number) => `День ${day} завершено!`,
  guestsServed: 'Гостей обслуговано',
  averageScore: 'Середня оцінка',
  outOfFive: (value: string) => `${value} з 5`,
  bestCake: 'Найкращий торт',
  earnedToday: 'Зароблено сьогодні',
  dayCommentGreat: 'Коти в захваті! Про твоє кафе вже говорить усе місто.',
  dayCommentGood: 'Чудовий день! Гості пішли ситі й задоволені.',
  dayCommentCozy: 'Затишний день. Завтра вийде ще смачніше!',
  next: 'Далі',
  toShop: 'До крамниці',

  // hall
  orderSpeech: (greeting: string, ask: string) => `${greeting} ${ask}`,
  acceptOrder: 'Прийняти замовлення',
  thinking: ['Хм-м…', 'Ану, ану…', 'Мрр… дай-но подивлюся…', 'Нумо скуштуємо…', 'Так-так-так…', 'Мур… цікаво…'],
  guestScore: 'Оцінка гостя',
  scoreParts: {
    shape: 'Форма', layers: 'Коржі', filling: 'Начинка', cream: 'Крем', glaze: 'Глазур', toppings: 'Прикраси', magic: 'Магія', speed: 'Швидкість',
  } as Record<ScorePartKind, string>,
  payment: 'Оплата',
  tips: 'Чайові',
  ingredients: 'Інгредієнти',
  total: 'Разом',
  finishDay: 'Завершити день',
  nextGuest: 'Наступний гість',

  // kitchen
  reset: 'Скинути',
  serveCake: 'Подати торт',
  orderFrom: (catName: string) => 'Замовлення · ' + catName,
  auto: '✦ Авто',
  needLayerFirst: 'Спершу поклади корж',
  needAnyLayer: 'Спершу поклади хоча б один корж!',
  missingCream: 'без крему',
  missingGlaze: 'без глазурі',
  missingToppings: 'без прикрас',
  missingMagic: 'без чарів',
  serveAnyway: (missing: string[]) => `Торт ще ${missing.join(', ')}. Усе одно подати?`,
  serve: 'Подати',
  keepWorking: 'Доробити',

  stations: {
    layers: 'Коржі',
    cream: 'Крем',
    glaze: 'Глазур',
    toppings: 'Прикраси',
    magic: 'Чари',
  } as Record<HelperId, string>,

  // layers station
  layersTitle: (count: number, max: number) => `Коржі · ${count}/${max}`,
  fillingsLabel: 'Начинки',
  lockedShape: 'Торт уже прикрашено. Щоб змінити форму — «Скинути».',
  lockedLayers: 'Торт уже прикрашено. Щоб змінити коржі — «Скинути».',
  lockedStack: 'Торт уже прикрашено. Щоб змінити — «Скинути».',
  lockedHint: 'Торт уже прикрашено — щоб змінити коржі, натисни «Скинути».',
  lockedAuto: 'Торт уже прикрашено — спершу «Скинути»',
  maxLayers: 'Максимум — три коржі',
  fillingAlreadyThere: 'Начинка вже є — поклади зверху корж',
  fillingNoRoom: 'Начинка кладеться між коржами, а їх уже три',

  // cream station
  creamBorders: 'Бортики',
  pickCreamOnShelf: 'Спершу обери крем на полиці',
  niceBorders: 'Гарні бортики!',
  oldCreamRemoved: 'Старий крем знято — обводь новим',

  // glaze station
  cauldronEmpty: 'Казан порожній',
  colorLabel: (name: string) => 'Колір: ' + name,
  unusualShade: 'Незвичайний відтінок',
  cheatSheet: 'Шпаргалка',
  pourOut: 'Вилити',
  pourOnCake: 'Полити торт',
  cauldronFull: 'Казан повний! Вилий або полий торт.',
  addEssenceFirst: 'Додай есенції в казан',
  lockedDay: (day: number) => `день ${day}`,

  // toppings station
  onTheCake: 'На торті:',
  removeAll: 'Зняти всі',
  noRoomForToppings: 'Більше прикрас не влізе!',

  // magic station
  qualityPerfect: 'ідеально',
  qualityGreat: 'чудово',
  qualityOk: 'непогано',
  castShout: (element: string, quality: string) => `${element}! ${quality[0].toUpperCase() + quality.slice(1)}`,
  elementLocked: (element: string, day: number) => `Стихія «${element}» відкриється в день ${day}`,
  signNotRecognized: 'Знак не розпізнано — спробуй ще раз, одним рухом',

  // shop
  shopTitle: 'Крамниця чарівника',
  shopTabs: {
    decor: 'Затишок',
    helpers: 'Автоматизація',
  },
  tipBonus: (percent: number) => `+${percent}% чайових`,
  owned: '✓ Є в кафе',
  startDay: (day: number) => `Почати день ${day}`,
  notEnoughCoins: 'Не вистачає монеток',
  bought: (name: string) => `Придбано: ${name}!`,

  // day-1 tutorial (scenes/tutorial.ts)
  tutorial: {
    title: 'Навчання',
    skip: 'Пропустити навчання',
    gotIt: 'Зрозуміло!',
    openTab: (station: string) => `Відкрий вкладку «${station}» унизу.`,
    order: 'Гість показує картинку торта — це замовлення. Роздивись його й натисни «Прийняти замовлення».',
    layers: 'Замовлення тепер зліва вгорі. Обери форму торта, а потім натисни на корж потрібного смаку.',
    cream: 'Обери крем на полиці, а потім, затиснувши палець, веди по краях торта — по верхньому й біля основи.',
    glazeMix: 'Перетягуй колби з полиці в казан: кожна колба — одна крапля. Назва кольору з’явиться під казаном.',
    glazePour: 'Колір готовий? Натисни «Полити торт».',
    toppings: 'Перетягни прикраси з полиці на торт — стільки, скільки на картинці замовлення.',
    magic: 'Останній крок — чари! Намалюй знак стихії прямо на торті одним рухом. Вогонь — трикутник, лід — коло.',
    serve: 'Торт готовий! Натисни «Подати торт».',
    score: 'Сердечка — оцінка гостя. Що точніше торт схожий на картинку, то більше монеток і чайових.',
    filling: 'Цей гість хоче два коржі з начинкою: поклади корж, потім начинку, а зверху ще один корж.',
  },

  // finale
  finaleTitle: 'Королівське визнання!',
  finaleText: 'Місячна Королева оголосила «Місячний Корж» найчарівнішим кафе королівства. Коти з усіх куточків уже пакують валізи, щоб скуштувати твоїх тортів!',
  cakesBaked: (count: number) => `Тортів спечено: ${count}`,
  heartsReceived: (count: number) => `Сердечок отримано: ${count}`,
  coinsEarned: (count: number) => `Монеток зароблено: ${count}`,
  keepPlaying: 'Грати далі',
};

export type UiStrings = typeof uk;

const ja: UiStrings = {
  gameTitle: 'ムーンライトケーキ',
  tagline: 'ネコたちのための魔法のケーキ屋さん',
  signSubtitle: '魔法のケーキ',
  rotatePhone: 'スマホを横向きにしてね ↻',

  continueDay: day => `つづきから · ${day}日目`,
  newGame: 'はじめから',
  openCafe: 'お店をひらく',
  confirmNewGame: 'はじめからやり直す？これまでの進行はすべて消えます。',
  start: 'はじめる',
  cancel: 'キャンセル',

  dayAndGuest: (day, guest, total) => `${day}日目 · お客さん ${guest}/${total}`,
  dayTitle: day => `${day}日目`,
  storyDaySubtitle: (storyDays, guests) => `全${storyDays}日 · 今日のお客さん：${guests}匹`,
  endlessDaySubtitle: guests => `エンドレスモード · お客さん：${guests}匹`,
  newGuestsNote: names => `新しいお客さん：${names.join('、')}。`,
  newEssenceNote: names => `大釜に新しいエッセンス：${names.join('、')}！`,
  newElementNote: (element, sign) => `新しい属性「${element}」！しるしは「${sign}」。`,
  queenRumorNote: '今日はあの月の女王がやって来るといううわさ…',
  menuTitle: '今日のメニュー',
  menuLabels: { shapes: '形', flavors: 'スポンジ', fillings: 'フィリング', creams: 'クリーム', toppings: 'トッピング' },
  badgeNew: 'NEW',
  badgeAgain: '再登場',
  dayFinished: day => `${day}日目おしまい！`,
  guestsServed: 'おもてなししたお客さん',
  averageScore: '平均評価',
  outOfFive: value => `${value} / 5`,
  bestCake: 'いちばんのケーキ',
  earnedToday: '今日のかせぎ',
  dayCommentGreat: 'ネコたちは大よろこび！町じゅうがこのお店のうわさで持ちきり。',
  dayCommentGood: 'すてきな一日！お客さんはおなかいっぱいで満足そう。',
  dayCommentCozy: 'のんびりした一日。明日はもっとおいしくなるよ！',
  next: 'つぎへ',
  toShop: 'お店へ',

  orderSpeech: (greeting, ask) => `${greeting}${ask}`,
  acceptOrder: '注文を受ける',
  thinking: ['うーん…', 'どれどれ…', 'ニャ…ちょっと見せて…', 'では、いただきます…', 'ふむふむ…', 'ニャ…気になるね…'],
  guestScore: 'お客さんの評価',
  scoreParts: {
    shape: '形', layers: 'スポンジ', filling: 'フィリング', cream: 'クリーム', glaze: 'グレーズ', toppings: 'トッピング', magic: '魔法', speed: 'スピード',
  },
  payment: 'お代',
  tips: 'チップ',
  ingredients: '材料費',
  total: '合計',
  finishDay: '一日をおえる',
  nextGuest: 'つぎのお客さん',

  reset: 'やり直す',
  serveCake: 'ケーキを出す',
  orderFrom: catName => `注文 · ${catName}`,
  auto: '✦ オート',
  needLayerFirst: 'まずスポンジをのせてね',
  needAnyLayer: 'まずスポンジを1枚はのせてね！',
  missingCream: 'クリーム',
  missingGlaze: 'グレーズ',
  missingToppings: 'トッピング',
  missingMagic: '魔法',
  serveAnyway: missing => `まだ${missing.join('・')}がないよ。このまま出す？`,
  serve: '出す',
  keepWorking: 'つづける',

  stations: {
    layers: 'スポンジ',
    cream: 'クリーム',
    glaze: 'グレーズ',
    toppings: 'トッピング',
    magic: '魔法',
  },

  layersTitle: (count, max) => `スポンジ · ${count}/${max}`,
  fillingsLabel: 'フィリング',
  lockedShape: 'もうデコレーション済み。形を変えるなら「やり直す」。',
  lockedLayers: 'もうデコレーション済み。スポンジを変えるなら「やり直す」。',
  lockedStack: 'もうデコレーション済み。変えるなら「やり直す」。',
  lockedHint: 'もうデコレーション済み — スポンジを変えるなら「やり直す」を押してね。',
  lockedAuto: 'もうデコレーション済み — まず「やり直す」',
  maxLayers: 'スポンジは3枚まで',
  fillingAlreadyThere: 'フィリングはもうあるよ — 上にスポンジをのせてね',
  fillingNoRoom: 'フィリングはスポンジの間に。もう3枚あるよ',

  creamBorders: 'ふち',
  pickCreamOnShelf: 'まず棚のクリームを選んでね',
  niceBorders: 'きれいなふち！',
  oldCreamRemoved: '前のクリームを取ったよ — 新しいのでなぞってね',

  cauldronEmpty: '大釜はからっぽ',
  colorLabel: name => '色：' + name,
  unusualShade: 'ふしぎな色合い',
  cheatSheet: 'まぜかたメモ',
  pourOut: '捨てる',
  pourOnCake: 'ケーキにかける',
  cauldronFull: '大釜がいっぱい！捨てるかケーキにかけてね。',
  addEssenceFirst: '大釜にエッセンスを入れてね',
  lockedDay: day => `${day}日目`,

  onTheCake: 'ケーキの上：',
  removeAll: 'ぜんぶ取る',
  noRoomForToppings: 'もうトッピングがのらないよ！',

  qualityPerfect: 'パーフェクト',
  qualityGreat: 'すばらしい',
  qualityOk: 'まあまあ',
  castShout: (element, quality) => `${element}！${quality}！`,
  elementLocked: (element, day) => `属性「${element}」は${day}日目に解放されます`,
  signNotRecognized: 'しるしが読み取れなかったよ — ひと筆でもう一度',

  shopTitle: '魔法使いのお店',
  shopTabs: {
    decor: 'インテリア',
    helpers: 'おてつだい',
  },
  tipBonus: percent => `チップ+${percent}%`,
  owned: '✓ お店にあるよ',
  startDay: day => `${day}日目をはじめる`,
  notEnoughCoins: 'コインが足りないよ',
  bought: name => `${name}を買ったよ！`,

  tutorial: {
    title: 'チュートリアル',
    skip: 'チュートリアルをとばす',
    gotIt: 'わかった！',
    openTab: station => `下の「${station}」タブを開いてね。`,
    order: 'お客さんが見せている絵が注文だよ。よく見て「注文を受ける」を押そう。',
    layers: '注文は左上に出ているよ。ケーキの形を選んで、注文どおりの味のスポンジをタップしよう。',
    cream: '棚のクリームを選んで、押したままケーキのふちをなぞろう — 上のふちと下のふち。',
    glazeMix: '棚のびんを大釜までドラッグしよう。1本で1しずく。色の名前は大釜の下に出るよ。',
    glazePour: '色ができたら「ケーキにかける」を押そう。',
    toppings: '棚のトッピングをケーキまでドラッグ。注文の絵と同じ数だけのせよう。',
    magic: '最後は魔法！ケーキの上に属性のしるしをひと筆で描こう。炎は三角、氷は円。',
    serve: 'ケーキの完成！「ケーキを出す」を押そう。',
    score: 'ハートはお客さんの評価だよ。絵にそっくりなほど、コインとチップが増えるよ。',
    filling: 'このお客さんはフィリング入りの2段ケーキがほしいみたい。スポンジ → フィリング → スポンジの順にのせよう。',
  },

  finaleTitle: '王家のおすみつき！',
  finaleText: '月の女王が「ムーンライトケーキ」を王国でいちばん魔法のようなカフェと認めました。国じゅうのネコたちが、あなたのケーキを食べようと荷造りを始めています！',
  cakesBaked: count => `焼いたケーキ：${count}個`,
  heartsReceived: count => `もらったハート：${count}個`,
  coinsEarned: count => `かせいだコイン：${count}枚`,
  keepPlaying: 'まだまだ遊ぶ',
};

const STRINGS: Localized<UiStrings> = { uk, ja };

/** Interface texts in the current language. */
export const t = (): UiStrings => loc(STRINGS);
