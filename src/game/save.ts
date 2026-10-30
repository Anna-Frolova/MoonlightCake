// Saving progress in the browser's localStorage (similar to PlayerPrefs in Unity).
import type { SaveData } from '../data/types';

const SAVE_KEY = 'misiachnyi-korzh-v6';
/** Bump when the save structure changes incompatibly; old saves are then ignored. */
const SAVE_VERSION = 6;

export function createNewSave(): SaveData {
  return {
    version: SAVE_VERSION, day: 1, coins: 0, owned: {}, seed: (Math.random() * 1e9) | 0,
    menu: null, phase: 'dayStart', guestIndex: 0, guestQueue: null,
    dayStats: { earned: 0, served: 0, hearts: 0, bestHearts: 0 },
    totals: { served: 0, hearts: 0, earned: 0 },
    finaleSeen: false, musicOn: true, soundOn: true,
  };
}

export function loadSave(): SaveData | null {
  try {
    const stored = JSON.parse(localStorage.getItem(SAVE_KEY) ?? 'null') as Partial<SaveData> | null;
    if (!stored || stored.version !== SAVE_VERSION) return null;
    const defaults = createNewSave();
    return {
      ...defaults, ...stored,
      dayStats: { ...defaults.dayStats, ...stored.dayStats },
      totals: { ...defaults.totals, ...stored.totals },
    };
  } catch {
    return null; // storage blocked or corrupted: start fresh
  }
}

export function writeSave(data: SaveData): void {
  try { localStorage.setItem(SAVE_KEY, JSON.stringify(data)); } catch { /* storage unavailable (private mode) */ }
}

export function hasSave(): boolean {
  try { return !!localStorage.getItem(SAVE_KEY); } catch { return false; }
}
