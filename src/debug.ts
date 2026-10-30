// Development-only access from the browser console: `__game.runtime`, `__game.progress`, …
// Only loaded by `npm run dev` (see main.ts), never included in the built game.
import { viewport } from './core/canvas';
import { ui } from './core/ui';
import { progress, runtime } from './game/state';
import { STATIONS } from './kitchen/stations';

declare global {
  interface Window { __game?: unknown }
}

window.__game = { runtime, progress, ui, viewport, stations: STATIONS };
