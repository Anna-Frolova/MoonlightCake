// Interface texts in every language. Names of cats, ingredients and shop items live next to
// their data (`{ uk, ja }` fields); here is everything else the player reads.
// `ja` must have exactly the same keys as `uk` — TypeScript reports anything missing.
import { loc, type Localized } from '../core/language';
import type { GuestCommentTopic, HelperId, MenuCategory } from './types';

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
  toppingsNeeded: 'Потрібно',
  menuNewToday: 'Нове сьогодні',
  menuRestingToday: 'Сьогодні відпочивають',
  menuSameAsYesterday: 'Меню таке саме, як учора',
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
  /** A guest who waited too long starts with a reproach, then says what they think of the cake. */
  lateSpeech: (reproach: string, line: string) => `${reproach} ${line}`,
  // reproaches are said by every guest, so they avoid gendered verb forms
  lateSad: ['Ох, як же довго це було…', 'Ціла вічність минула…', 'Так довго чекати — це так сумно…', 'Ох, мої лапки аж затерпли від чекання…'],
  lateAngry: ['Нарешті! Скільки можна чекати?!', 'Ну нарешті! Ще трохи — і мене б тут не було!', 'Це ж скільки часу минуло?!', 'Повільніше не можна було?!'],
  acceptOrder: 'Прийняти замовлення',
  thinking: ['Хм-м…', 'Ану, ану…', 'Мрр… дай-но подивлюся…', 'Нумо скуштуємо…', 'Так-так-так…', 'Мур… цікаво…'],
  /** The guest ran out of patience: throws the unfinished cake / leaves when there is no cake. */
  stormWithCake: ['Ш-ш-ш! Досить чекати! Забирайте свій торт!', 'Мяу-у-у! Я чекав цілу вічність! Ось вам!', 'Ф-ф-ф! Тримайте свій недопечений торт!', 'Все! Мій терпець урвався! Лови!'],
  stormNoCake: ['Ш-ш-ш! Я йду звідси!', 'Мяу! Тут навіть коржа немає! Бувайте!', 'Ф-ф-ф! Більше я сюди не прийду… до завтра.', 'Все, мій терпець урвався! Піду в інше кафе!'],
  guestScore: 'Оцінка гостя',
  scoreParts: {
    shape: 'Форма', layers: 'Коржі', filling: 'Начинка', cream: 'Крем', glaze: 'Глазур', toppings: 'Прикраси', magic: 'Магія', speed: 'Швидкість',
  } as Record<ScorePartKind, string>,
  payment: 'Оплата',
  tips: 'Чайові',
  ingredients: 'Інгредієнти',
  changeBonus: 'Бонус за зміну',

  // the story of the first region (scenes/map.ts, scenes/night.ts)
  story: {
    regionName: 'Поблякла Пустеля',
    landHealed: (percent: number) => `Ожило: ${percent}%`,
    places: { lake: 'Озеро', grove: 'Гай', village: 'Селище' },
    intro: 'Усю магію світу давав Місяць — величезний чарівний корж. Та він тріснув, уламки впали на землю, і світ поблякнув. Ти — кондитер останнього чарівного кафе. Магія живе, коли нею діляться: кожен щасливий гість повертає землі життя.',
    afterDay: [
      'Перші щасливі гості — і серед піску блиснула вода.',
      'Зоряна мала рацію: джерело розливається, земля зітхає.',
      'На берегах проросла зелень. А хтось нишпорив біля кафе…',
      'Граф Крихта пішов, та його слова не йдуть з голови. Земля все одно оживає.',
      'Королева принесла вість: перший уламок Місяця знайдено! Попереду ще довгий шлях.',
    ],
    nightHint: 'Малюй знак над тінню, поки вона не дісталася книги рецептів!',
    nightWonTitle: 'Книга вціліла',
    nightWon: 'Сірі крихти втекли в темряву. Хто ж їх послав?',
    nightLostTitle: 'Сторінки вкрадено',
    nightLost: 'Сірі крихти втекли зі сторінками й дрібними монетками. Але магію так просто не вкрасти.',
  },

  // what a guest may say while the cake is made (game/guestComments.ts); `isShe` picks the verb form
  guestComments: {
    layer: () => ['Це не той корж…', 'Щось не так із коржами.'],
    filling: isShe => ['Це не та начинка.', `Я ${isShe ? 'просила' : 'просив'} іншу начинку.`],
    cream: isShe => [`Я ${isShe ? 'просила' : 'просив'} інший крем.`, 'Це не той крем…'],
    glaze: isShe => [`Я ${isShe ? 'хотіла' : 'хотів'} інший колір.`, 'Хм, це не мій колір.'],
    topping: isShe => [`Цього я не ${isShe ? 'замовляла' : 'замовляв'}.`, 'Цього вже забагато.'],
    magic: isShe => ['Це не ті чари!', `Я ${isShe ? 'чекала' : 'чекав'} на інші чари…`],
    praise: () => ['Мм, виглядає смачно!', 'Саме так!', 'Мені вже подобається!'],
  } as Record<GuestCommentTopic, (isShe: boolean) => string[]>,

  // a guest changing their order halfway (game/orderChange.ts); `isShe` picks the verb form
  orderChangeCream: (cream: string, isShe: boolean) =>
    `Ой, вибачте, я ${isShe ? 'помилилася' : 'помилився'}! Можна крем «${cream}» замість того? Я щедро віддячу!`,
  orderChangeTopping: (topping: string, count: number, isShe: boolean) =>
    `Ой, я ще ${isShe ? 'забула' : 'забув'} сказати! Додайте, будь ласка, ${topping} × ${count}. Я щедро віддячу!`,
  orderChangeMagic: (element: string, isShe: boolean) =>
    `Ой, я ${isShe ? 'переплутала' : 'переплутав'} чари! Хочу «${element}» замість тих. Я щедро віддячу!`,
  orderChangeOk: 'Добре!',
  total: 'Разом',
  guestRefusedToPay: 'Гість не заплатив',
  ruinedCakeFine: 'Штраф за зіпсований торт',
  finishDay: 'Завершити день',
  nextGuest: 'Наступний гість',

  // kitchen
  reset: 'Скинути',
  confirmReset: 'Викинути цей торт і почати спочатку?',
  serveCake: 'Подати торт',
  glazeNotPoured: 'Глазур у казані — не забудь полити торт!',
  shadeHintLight: 'Мені потрібен світліший колір, ніж звичайний! Біла колба робить колір світлішим.',
  shadeHintDark: 'Мені потрібен темніший колір, ніж звичайний! Темна колба робить колір темнішим.',
  orderFrom: (catName: string) => 'Замовлення · ' + catName,
  auto: '✦ Авто',
  helperHint: '✦ Підказка',
  toppingTapHint: 'Торкнись блюдця — Пушок покладе прикрасу',
  creamTapHint: 'Торкнись крему — віночок сам обведе торт',
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
  } as Record<HelperId | 'magic', string>,

  // layers station
  lockedShape: 'Торт уже прикрашено. Щоб змінити форму — «Скинути».',
  lockedLayers: 'Торт уже прикрашено. Щоб змінити коржі — «Скинути».',
  lockedStack: 'Торт уже прикрашено. Щоб змінити — «Скинути».',
  lockedHint: 'Торт уже прикрашено — щоб змінити коржі, натисни «Скинути».',
  lockedAuto: 'Торт уже прикрашено — спершу «Скинути»',
  maxLayers: 'Максимум — три коржі',
  fillingAlreadyThere: 'Начинка вже є — поклади зверху корж',
  fillingNoRoom: 'Начинка кладеться між коржами, а їх уже три',

  // cream station
  pickCreamOnShelf: 'Спершу обери крем на полиці',
  niceBorders: 'Гарні бортики!',
  oldCreamRemoved: 'Старий крем знято — обводь новим',

  // glaze station
  cauldronEmpty: 'Казан порожній',
  colorLabel: (name: string) => 'Колір: ' + name,
  unusualShade: 'Незвичайний відтінок',
  pourOut: 'Вилити',
  pourOnCake: 'Полити',
  cauldronFull: 'Казан повний! Вилий або полий торт.',
  addEssenceFirst: 'Додай есенції в казан',
  lockedDay: (day: number) => `день ${day}`,

  // toppings station
  removeAll: 'Зняти всі',
  noRoomForToppings: 'Більше прикрас не влізе!',

  // magic station
  /** Shown when magic is cast; the right element also gets praise. */
  castShout: (element: string, isWanted: boolean) => (isWanted ? `${element}! Ідеально` : `${element}!`),
  elementLocked: (element: string, day: number) => `Стихія «${element}» відкриється в день ${day}`,
  signNotRecognized: 'Знак не розпізнано — спробуй ще раз, одним рухом',

  // shop
  shopTitle: 'Крамниця чарівника',
  shopTabs: {
    decor: 'Затишок',
    helpers: 'Помічники',
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
    skipPart: (station: string) => `Пропустити «${station}»`,
    openTab: (station: string) => `Відкрий вкладку «${station}» унизу.`,
    layerFirst: (layers: string) => `Але спершу поклади корж у вкладці «${layers}».`,
    order: 'Гість показує картинку торта — це замовлення. Натисни «Прийняти замовлення».',
    shape: (shape: string) => `Замовлення — зліва. Спершу форма: натисни «${shape}» угорі.`,
    firstLayer: (flavor: string) => `Тепер натисни корж «${flavor}» на полиці.`,
    filling: (filling: string) => `Начинку («${filling}») кладуть тільки між коржами, не зверху. Натисни на неї.`,
    secondLayer: 'Накрий начинку другим коржем.',
    creamPick: (cream: string) => `Обери крем «${cream}» на полиці.`,
    creamPipe: 'Веди пальцем по краю торта: і зверху, і внизу, біля основи.',
    glazeMix: (color: string, recipe: string, bottle: string) => `Глазур «${color}» = ${recipe}. Перетягни колбу «${bottle}» в казан.`,
    glazePour: 'Колір готовий! Натисни «Полити».',
    glazeShades: 'Біла колба робить колір світлішим, темна — темнішим.',
    toppings: (topping: string, count: number) => `Перетягни «${topping}» з полиці на торт — ${count} шт.`,
    magic: (sign: string) => `Чари! Намалюй ${sign} на торті одним рухом: від білої крапки за стрілками.`,
    serve: 'Торт готовий! Натисни «Подати торт».',
  },

  // finale
  finaleTitle: 'Перший уламок Місяця!',
  finaleText: 'Місячна Королева подякувала кафе «Місячний Корж»: завдяки твоїм тортам Поблякла Пустеля ожила, а в ній знайшовся перший уламок Місяця. Та Граф Крихта теж шукає уламки. Навіщо вони йому?',
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
  toppingsNeeded: 'のせる数',
  menuNewToday: '今日の新メニュー',
  menuRestingToday: '今日はお休み',
  menuSameAsYesterday: 'メニューは昨日と同じです',
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
  lateSpeech: (reproach, line) => `${reproach}${line}`,
  lateSad: ['もう来ないかと思った…', 'ずいぶん待ったなあ…さびしかった。', '永遠に待った気分…', 'さびしくて眠っちゃうところだった。'],
  lateAngry: ['やっとか！どれだけ待たせるんだ！', 'ようやくだ！帰ろうかと思ったぞ！', 'いったい何分たったと思ってる！', 'これ以上おそくはできなかったのか！'],
  acceptOrder: '注文を受ける',
  thinking: ['うーん…', 'どれどれ…', 'ニャ…ちょっと見せて…', 'では、いただきます…', 'ふむふむ…', 'ニャ…気になるね…'],
  stormWithCake: ['シャーッ！もう待てない！このケーキ、返すよ！', 'ニャーッ！ずっと待ってたのに！えいっ！', 'フーッ！作りかけのケーキなんていらない！', 'もうがまんの限界！受け取れ！'],
  stormNoCake: ['シャーッ！もう帰る！', 'ニャッ！スポンジすらないじゃない！さよなら！', 'フーッ！もう来ないから…明日までは。', 'がまんの限界！ほかのカフェに行く！'],
  guestScore: 'お客さんの評価',
  scoreParts: {
    shape: '形', layers: 'スポンジ', filling: 'フィリング', cream: 'クリーム', glaze: 'グレーズ', toppings: 'トッピング', magic: '魔法', speed: 'スピード',
  },
  payment: 'お代',
  tips: 'チップ',
  ingredients: '材料費',
  changeBonus: '変更ボーナス',

  story: {
    regionName: '色あせた砂漠',
    landHealed: percent => `よみがえり：${percent}%`,
    places: { lake: '湖', grove: '林', village: '村' },
    intro: '世界の魔法はすべて、大きな魔法のスポンジ「月」から生まれていた。けれど月は割れ、かけらは地上に落ち、世界は色を失った。きみは最後の魔法カフェのパティシエ。魔法は分かち合うと生きる。お客さんの笑顔が、大地に命を返すんだ。',
    afterDay: [
      '最初のお客さんの笑顔で、砂の中に水がきらめいた。',
      'ホシノの言うとおり。泉は広がり、大地が息をしている。',
      '岸辺に緑が芽吹いた。でも、カフェのまわりを誰かがかぎ回っていた…',
      'クラム伯爵は去ったが、あの言葉が忘れられない。それでも大地はよみがえる。',
      '女王の知らせ：月の最初のかけらが見つかった！旅はまだ続く。',
    ],
    nightHint: '影の上のしるしを描こう。レシピの本に届く前に！',
    nightWonTitle: '本は守られた',
    nightWon: '灰色のくずは闇へ逃げていった。いったい誰の差し金だろう？',
    nightLostTitle: 'ページを取られた',
    nightLost: '灰色のくずはページと小銭を持って逃げた。でも魔法はかんたんには盗めない。',
  },

  guestComments: {
    layer: () => ['そのスポンジじゃないよ…', 'スポンジがちょっと違うな。'],
    filling: () => ['そのフィリングじゃないよ。', '別のフィリングをたのんだのに。'],
    cream: () => ['別のクリームをたのんだよ。', 'そのクリームじゃないよ…'],
    glaze: () => ['別の色がよかったな。', 'うーん、この色じゃないな。'],
    topping: () => ['それはたのんでないよ。', 'それは多すぎるかな。'],
    magic: () => ['その魔法じゃないよ！', '別の魔法を待ってたのに…'],
    praise: () => ['おいしそう！', 'そうそう！', 'もう気に入ったよ！'],
  },

  orderChangeCream: (cream: string) => `あっ、ごめんなさい！クリームは「${cream}」にしてもらえる？お礼ははずむよ！`,
  orderChangeTopping: (topping: string, count: number) => `あっ、言い忘れてた！${topping}を${count}こ追加してくれる？お礼ははずむよ！`,
  orderChangeMagic: (element: string) => `あっ、魔法をまちがえちゃった！「${element}」にしてほしいな。お礼ははずむよ！`,
  orderChangeOk: 'わかった！',
  total: '合計',
  guestRefusedToPay: 'お代はもらえなかった',
  ruinedCakeFine: 'だめにしたケーキの罰金',
  finishDay: '一日をおえる',
  nextGuest: 'つぎのお客さん',

  reset: 'やり直す',
  confirmReset: 'このケーキを捨てて、最初から作り直す？',
  serveCake: 'ケーキを出す',
  glazeNotPoured: 'グレーズが大釜にあるよ。ケーキにかけるのを忘れないでね！',
  shadeHintLight: 'ふつうより明るい色がいいな！白のびんで色が明るくなるよ。',
  shadeHintDark: 'ふつうより暗い色がいいな！黒のびんで色が暗くなるよ。',
  orderFrom: catName => `注文 · ${catName}`,
  auto: '✦ オート',
  helperHint: '✦ ヒント',
  toppingTapHint: 'お皿をタップすると、ワタゲがのせるよ',
  creamTapHint: 'クリームをタップすると、泡立て器がしぼるよ',
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

  lockedShape: 'もうデコレーション済み。形を変えるなら「やり直す」。',
  lockedLayers: 'もうデコレーション済み。スポンジを変えるなら「やり直す」。',
  lockedStack: 'もうデコレーション済み。変えるなら「やり直す」。',
  lockedHint: 'もうデコレーション済み — スポンジを変えるなら「やり直す」を押してね。',
  lockedAuto: 'もうデコレーション済み — まず「やり直す」',
  maxLayers: 'スポンジは3枚まで',
  fillingAlreadyThere: 'フィリングはもうあるよ — 上にスポンジをのせてね',
  fillingNoRoom: 'フィリングはスポンジの間に。もう3枚あるよ',

  pickCreamOnShelf: 'まず棚のクリームを選んでね',
  niceBorders: 'きれいなふち！',
  oldCreamRemoved: '前のクリームを取ったよ — 新しいのでなぞってね',

  cauldronEmpty: '大釜はからっぽ',
  colorLabel: name => '色：' + name,
  unusualShade: 'ふしぎな色合い',
  pourOut: '捨てる',
  pourOnCake: 'かける',
  cauldronFull: '大釜がいっぱい！捨てるかケーキにかけてね。',
  addEssenceFirst: '大釜にエッセンスを入れてね',
  lockedDay: day => `${day}日目`,

  removeAll: 'ぜんぶ取る',
  noRoomForToppings: 'もうトッピングがのらないよ！',

  castShout: (element, isWanted) => (isWanted ? `${element}！パーフェクト！` : `${element}！`),
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
    skipPart: station => `「${station}」をとばす`,
    openTab: station => `下の「${station}」タブを開いてね。`,
    layerFirst: layers => `でも先に「${layers}」タブでスポンジをのせてね。`,
    order: 'お客さんが見せている絵が注文だよ。「注文を受ける」を押そう。',
    shape: shape => `注文は左だよ。まずは形：上の「${shape}」を押そう。`,
    firstLayer: flavor => `次は棚の「${flavor}」スポンジをタップ。`,
    filling: filling => `フィリング（${filling}）はスポンジの間にだけはさむよ。上にはのせないでね。タップしよう。`,
    secondLayer: 'フィリングの上に、もう1枚スポンジをのせよう。',
    creamPick: cream => `棚の「${cream}」クリームを選ぼう。`,
    creamPipe: '指でケーキのふちをなぞろう。上のふちと、下の土台のまわりも！',
    glazeMix: (color, recipe, bottle) => `「${color}」のグレーズ＝${recipe}。「${bottle}」のびんを大釜までドラッグ。`,
    glazePour: '色ができた！「かける」を押そう。',
    glazeShades: '白のびんで色は明るく、黒のびんで暗くなるよ。',
    toppings: (topping, count) => `棚の「${topping}」をケーキまでドラッグ。${count}個のせよう。`,
    magic: sign => `魔法！ケーキの上に${sign}をひと筆で描こう。白い点から矢印の向きに。`,
    serve: 'ケーキの完成！「ケーキを出す」を押そう。',
  },

  finaleTitle: '月の最初のかけら！',
  finaleText: '月の女王が「ムーンライトケーキ」に感謝しました。あなたのケーキのおかげで色あせた砂漠はよみがえり、月の最初のかけらが見つかりました。でもクラム伯爵もかけらを探しています。いったい何のために？',
  cakesBaked: count => `焼いたケーキ：${count}個`,
  heartsReceived: count => `もらったハート：${count}個`,
  coinsEarned: count => `かせいだコイン：${count}枚`,
  keepPlaying: 'まだまだ遊ぶ',
};

const STRINGS: Localized<UiStrings> = { uk, ja };

/** Interface texts in the current language. */
export const t = (): UiStrings => loc(STRINGS);
