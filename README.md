# Місячний Корж

A cozy 2D game about a magical café where cats in different outfits order cakes. TypeScript + Canvas 2D, no engine.

## Running

```bash
npm install      # once
npm run dev      # dev server at http://localhost:8765, reloads on save
npm run build    # typecheck + build a single file dist/index.html (opens without a server)
```

`npm run typecheck` checks types only, without building.

## Code structure (`src/`)

Unity analogy: there is no scene editor here; scenes are just functions that draw everything every frame.

| Folder | What's inside | In Unity terms |
|---|---|---|
| `main.ts` | Game loop: `update(dt)` → `render()` every frame | `Update()` on the main object |
| `input.ts` | Mouse / touch / keyboard, button presses | Input System |
| `core/` | Canvas, time, maths, colours, drawing helpers, buttons, particles, UI theme | engine utilities |
| `data/` | **Game content**: ingredients, palettes, cats, elements, shop, unlock schedule. No logic. | ScriptableObjects |
| `game/` | Rules: the cake model, colour mixing, sign recognition, orders, scoring, daily menu, saves, day flow, `state.ts` (all state) | game logic / managers |
| `audio/` | Sound synthesiser, effects, music | AudioSource / AudioMixer |
| `render/` | Drawing of objects: cake, cats, toppings, café backdrop, icons, bottles, order card | prefabs / sprites |
| `kitchen/` | Kitchen: `layout.ts` (coordinates), `stations/` (one file per station: layers, cream, glaze, toppings, magic) | per-station components |
| `scenes/` | Screens: title, day start, hall, kitchen, day end, finale, shop, shared HUD | Scenes |

### State

- `progress` (`game/state.ts`): saved data (day, coins, purchases, menu). Written to `localStorage`.
- `runtime` (`game/state.ts`): everything else (current scene, the cake in progress, animations).

### Where to change what

- New flavour / topping / cream: `data/ingredients.ts` plus the unlock schedule in `data/schedule.ts`.
- New cat guest: `data/cats.ts`.
- New colour palette for orders: `data/palettes.ts`.
- Prices, tips, scoring weights: constants at the top of `game/scoring.ts`.
- Kitchen layout (cake, cauldron, shelf): `kitchen/layout.ts`.
- UI colours and fonts: `core/theme.ts`.
- New kitchen station: a file in `kitchen/stations/` implementing the `Station` interface, added to `kitchen/stations/index.ts`.

### Debugging

In `npm run dev` the browser console exposes `__game.runtime`, `__game.progress` and `__game.stations` (e.g. `__game.progress.coins = 999`). This object is absent from the build.

`legacy/index.html` is the original single-file version, kept for reference.
