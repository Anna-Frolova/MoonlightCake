# Місячний Корж — заметки для Claude

Уютная 2D-игра: кафе, где коты-волшебники заказывают торты. TypeScript + Canvas 2D, Vite, без движка. Структура кода и «где что менять» — в `README.md`, прочитай его перед работой.

## Общение

- С пользователем говорим **по-русски**. Пользователь знаком с Unity, аналогии с ним помогают.
- Тексты внутри игры (UI, имена котов, подсказки) — **на украинском и японском**. Любой новый текст добавляем сразу на оба языка: UI — в `src/data/strings.ts` (`t()`), контент — полем `{ uk, ja }` в `src/data/` (`loc()`). Подробности — README, раздел «Языки».
- Код, имена, комментарии и сообщения коммитов — на английском.

## Это существующий проект

Общий промпт прототипирования из `../CLAUDE.md` здесь **не начинает новую игру**: четыре стартовых вопроса не задаём, игра уже есть, её развиваем. Правило «один `index.html` без npm» тоже не действует — проект сознательно переведён на Vite + TypeScript, а сборка всё равно даёт один файл `dist/index.html`. Остальные принципы промпта (game feel, edge cases, самопроверка, без заглушек) применяем.

## Команды (Windows)

PowerShell блокирует `npm.ps1`, поэтому в PowerShell пиши `npm.cmd`, а не `npm`. В Git Bash сначала: `export PATH="/c/Program Files/nodejs:$PATH"`.

```bash
npm.cmd install          # один раз
npm.cmd run dev          # дев-сервер http://localhost:8765 (конфиг .claude/launch.json → "game")
npm.cmd run typecheck    # tsc --noEmit
npm.cmd run build        # typecheck + сборка в dist/index.html
npm.cmd run app:sync     # build + копирование в нативные проекты ios/ и android/ (Capacitor)
```

Нативные приложения (Capacitor 8) — раздел «Приложение» в README. Цели: играть на своём iPhone и раздавать тестерам через TestFlight; публикация в магазинах пока не планируется, но решения должны её не закрывать (никакой рекламы и трекинга). У пользователя есть Mac, но Xcode и сборку под iOS она ещё не делала — этот шаг объяснять подробно, по шагам. Android-устройства нет, Android проверяем в эмуляторе Android Studio на Windows (AVD `Pixel_6a`).

Android из Git Bash (системная `java` — старая 1.8, нужна Java из Android Studio):

```bash
export JAVA_HOME="/c/Program Files/Android/Android Studio/jbr" ANDROID_HOME="$LOCALAPPDATA/Android/Sdk"
ADB="$ANDROID_HOME/platform-tools/adb.exe"
"$ANDROID_HOME/emulator/emulator.exe" -avd Pixel_6a -gpu host -no-boot-anim   # в фоне
npm.cmd run app:sync && (cd android && ./gradlew.bat assembleDebug)
"$ADB" install -r android/app/build/outputs/apk/debug/app-debug.apk
"$ADB" shell am start -n io.github.annafrolova.moonlightcake/.MainActivity
"$ADB" exec-out screencap -p > shot.png            # скриншот (2400×1080, тап: "$ADB" shell input tap X Y)
"$ADB" logcat -d | grep Capacitor/Console           # console.log и ошибки игры
```

Подводные камни Android-проверки:
- `__game` в APK нет (это сборка). Состояние страницы читаем через DevTools WebView: `adb forward tcp:9222 localabstract:webview_devtools_remote_<pid>` (pid — `adb shell pidof io.github.annafrolova.moonlightcake`, после перезапуска приложения он новый — пересоздать forward), затем `http://127.0.0.1:9222/json` → `webSocketDebuggerUrl` → `Runtime.evaluate` (в Node есть глобальный `WebSocket`). Сохранение: `Capacitor.Plugins.Preferences.get({ key: 'misiachnyi-korzh-v6' })`.
- Координаты тапа — в пикселях экрана 2400×1080 (скриншот уменьшается при показе — пересчитывать). Без статус-бара игра крупнее, кнопки смещаются — брать координаты со свежего скриншота.
- Каждую adb/node-команду оборачивать в `timeout`, иначе зависший вызов съедает весь лимит.
- После обновления Vite дев-сервер нужно перезапустить (иначе в консоли `__WS_TOKEN__ is not defined`).

## Правила кода

- TypeScript strict. После изменений `typecheck` должен проходить без ошибок.
- Никаких «магических чисел»: координаты — в `src/kitchen/layout.ts`, цвета и шрифты — в `src/core/theme.ts`, экономика и веса оценки — константы в `src/game/scoring.ts`, контент — в `src/data/`.
- UI — immediate mode: `button(...)` из `src/core/ui.ts` каждый кадр.
- Новая станция кухни реализует интерфейс `Station` (`src/kitchen/stations/station.ts`) и добавляется в `src/kitchen/stations/index.ts`.
- `legacy/index.html` — исходная однофайловая версия, только для сравнения, не редактировать.

## Сохранения

`src/game/save.ts`: ключ `localStorage` `misiachnyi-korzh-v6`, `SAVE_VERSION = 6`. Если меняется форма `SaveData`, повышай версию **и** ключ вместе (старые сохранения иначе ломают загрузку).

## Проверка в браузере

В дев-режиме доступен `window.__game` (`runtime`, `progress`, `ui`, `viewport`, `clock`, `stations`), например `__game.progress.coins = 999`. В сборку не попадает. Пока панель браузера скрыта, `requestAnimationFrame` замирает — состояние проверяй через `__game`, а не по скриншотам.

Подводные камни при проверке (выяснено на практике):
- Модули из консоли импортируй по точному адресу, который загрузила игра (после HMR это `…/flow.ts?t=…`): `performance.getEntriesByType('resource').map(e => e.name).find(n => n.includes('/src/game/flow.ts'))`. Голый `import('/src/game/flow.ts')` может дать второй экземпляр модулей со своим `state` — изменения «не доходят» до игры. Надёжнее перезагрузить страницу перед тестом.
- Переходы между сценами (`goToScene`) идут только пока рисуются кадры, а пока идёт один переход, следующий игнорируется. В пакетах действий чередуй шаги со скриншотами, иначе сцена «застревает».
- Скриншот показывает последний отрисованный кадр: после изменения состояния подожди ~300 мс.
- Быстрый способ попасть к нужному гостю: задать `progress.day`, `progress.phase = 'inDay'`, `progress.guestQueue = [{ cat: '…' }, …]`, `progress.guestIndex = 0` и нажать «Продовжити» на титульном экране.
- Python на машине нет. В Git Bash heredoc ломается на апострофах внутри текста — скрипты-правки пиши через Write в scratchpad и запускай `node`.

## Временное (убрать, когда пользователь скажет)

- `ORDER_CHANGE.enabled` в `src/game/orderChange.ts` — экспериментальная фича «гость передумал посреди заказа». Пользователь решит, оставлять ли её.
- `GUEST_COMMENTS.enabled` в `src/game/guestComments.ts` — экспериментальные реплики гостей во время готовки («я хотів інший колір»). Пользователь решит, оставлять ли их.
- `SPECIALS_ONLY_FROM_DAY = 8` в `src/game/flow.ts` — режим для тестирования: с дня 8 за день приходят только особые гости, все шесть по разу. Чтобы вернуть обычные дни, удалить проверку в `buildGuestQueue` (или поставить `Infinity`) и строчку в README.

Минимальная самопроверка после геймплейных изменений: собрать торт вручную через указатель → оценка 5♥; пройти дни 1–5 → финал; день 6 → бесконечный режим; консоль без ошибок.

## Git и публикация

- Remote `origin` = https://github.com/Anna-Frolova/MoonlightCake, основная ветка `master`.
- Новую работу делаем в отдельной ветке. **Пока идёт активное тестирование на телефоне:** как только доработка проверена (typecheck, build, проверка в браузере), сразу сливаем её в `master` и пушим — без отдельного вопроса, чтобы пользователь мог проверить на GitHub Pages. После пуша дожидаемся обновления Pages и называем отметку сборки. Если что-то не проверено или сомнительно — сначала спросить.
- **Основная опубликованная версия — GitHub Pages:** https://anna-frolova.github.io/MoonlightCake/ (репозиторий публичный). Workflow `.github/workflows/pages.yml` сам собирает и выкладывает игру при каждом пуше в `master`, поэтому пуш в `master` = обновление игры для игроков. Ручной запуск — Actions → «Deploy to GitHub Pages» → Run workflow.
- Пользователь играет на iPhone: ссылку открывает в Safari и добавляет на экран «Домой» (полный экран, без панелей браузера). Внутри приложения Claude и во встроенном браузере игра зажата панелями — это не баг игры.
- Какая сборка открыта на телефоне, видно по отметке времени (UTC) в правом нижнем углу титульного экрана (`__BUILD_ID__`, задаётся в `vite.config.ts`).
- Запасная версия (Artifact): https://claude.ai/artifact/BXDxd3K77RCCwGa1dyBEf5 — обновляется из `dist/index.html` после `build`, только по просьбе пользователя. Внутри просмотрщика claude.ai игра всегда в рамке.
