// Current interface language. Stored apart from the save, so switching it never touches progress
// and a new game keeps the chosen language.
import { JAPANESE_FONT_FAMILY } from './theme';

export type Language = 'uk' | 'ja';
/** A value in every language, e.g. `{ uk: 'Ванільний', ja: 'バニラ' }`. */
export type Localized<T = string> = Record<Language, T>;

/** Language switch buttons, in display order. */
export const LANGUAGES: { id: Language; label: string }[] = [
  { id: 'uk', label: 'УКР' },
  { id: 'ja', label: '日本語' },
];

const LANGUAGE_KEY = 'misiachnyi-korzh-language';

function detectLanguage(): Language {
  try {
    const stored = localStorage.getItem(LANGUAGE_KEY);
    if (stored === 'uk' || stored === 'ja') return stored;
  } catch { /* storage blocked: fall through to the browser language */ }
  const preferred = typeof navigator !== 'undefined' ? navigator.languages ?? [navigator.language] : [];
  return preferred.some(lang => lang?.toLowerCase().startsWith('ja')) ? 'ja' : 'uk';
}

let current: Language = detectLanguage();

export const language = (): Language => current;

/** Picks the current language's variant. */
export const loc = <T>(value: Localized<T>): T => value[current];

/** Starts downloading the Japanese glyphs; canvas text only picks a web font up once it is loaded. */
function preloadFonts(lang: Language): void {
  if (lang === 'ja') void document.fonts?.load(`800 20px ${JAPANESE_FONT_FAMILY}`, 'あア月');
}

/** Called once at startup, and by `setLanguage`. */
export function applyLanguage(): void {
  document.documentElement.lang = current;
  preloadFonts(current);
}

export function setLanguage(lang: Language): void {
  if (lang === current) return;
  current = lang;
  try { localStorage.setItem(LANGUAGE_KEY, lang); } catch { /* storage unavailable (private mode) */ }
  applyLanguage();
}
