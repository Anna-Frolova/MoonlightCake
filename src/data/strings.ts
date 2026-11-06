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
  layersEnough: 'Коржів уже досить',
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
  layersEnough: 'スポンジはもう足りてるよ',
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
