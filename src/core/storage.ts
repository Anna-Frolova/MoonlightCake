// Small key-value storage for the save, the language and the tutorial mark (like PlayerPrefs in Unity).
// All reads and writes go through here, so the app version can swap the backend in one place.
// Storage can be blocked (private mode) or full: then reads return null and writes are skipped.

export function readStored(key: string): string | null {
  try { return localStorage.getItem(key); } catch { return null; }
}

export function writeStored(key: string, value: string): void {
  try { localStorage.setItem(key, value); } catch { /* storage unavailable */ }
}

export function removeStored(key: string): void {
  try { localStorage.removeItem(key); } catch { /* storage unavailable */ }
}
