// Page entry point. The game's modules read the save as soon as they load, so in the app the phone's
// storage is read first (core/storage.ts), and only then the game itself (main.ts) is started.
import { initStorage } from './core/storage';

void initStorage().then(() => import('./main'));
