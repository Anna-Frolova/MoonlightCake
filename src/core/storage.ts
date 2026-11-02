// Small key-value storage for the save, the language and the tutorial mark (like PlayerPrefs in Unity).
// In a browser it is localStorage. In the iOS / Android app it is the phone's own storage (Capacitor
// Preferences): the system may clear a web view's localStorage, but not that.
// Storage can be blocked (private mode) or full: then reads return null and writes are skipped.
import { Capacitor } from '@capacitor/core';
import { Preferences } from '@capacitor/preferences';

/** In the app: a copy of everything stored, read once at start, because the native storage only answers asynchronously. */
let nativeCopy: Map<string, string> | null = null;

/** Called once before the game starts (src/boot.ts); in a browser there is nothing to prepare. */
export async function initStorage(): Promise<void> {
  if (!Capacitor.isNativePlatform()) return;
  const copy = new Map<string, string>();
  try {
    const { keys } = await Preferences.keys();
    for (const key of keys) {
      const { value } = await Preferences.get({ key });
      if (value !== null) copy.set(key, value);
    }
  } catch { /* unreadable: start as on a fresh install */ }
  nativeCopy = copy;
}

export function readStored(key: string): string | null {
  if (nativeCopy) return nativeCopy.get(key) ?? null;
  try { return localStorage.getItem(key); } catch { return null; }
}

export function writeStored(key: string, value: string): void {
  if (nativeCopy) {
    nativeCopy.set(key, value);
    void Preferences.set({ key, value }).catch(() => { /* storage unavailable */ });
    return;
  }
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

export function removeStored(key: string): void {
  if (nativeCopy) {
    nativeCopy.delete(key);
    void Preferences.remove({ key }).catch(() => { /* storage unavailable */ });
    return;
  }
  try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
}
