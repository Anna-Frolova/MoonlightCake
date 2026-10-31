// Interface colours and fonts. Change them here to restyle the whole UI.

export const TEXT = {
  main: '#f4efff',
  muted: '#bdb0ea',
  label: '#9feaff',
  pink: '#ffb3f0',
  gold: '#ffe27a',
} as const;

export const BUTTON_COLOR = {
  confirm: '#2fc9a6',
  secondary: '#7a68c9',
  magic: '#9b6bff',
  pink: '#ff6fb5',
  gold: '#f7b733',
  danger: '#ff5f8f',
  reset: '#c25aa8',
} as const;

/** Dark violet outline used for small drawn objects (toppings, coins, icons). */
export const INK = '#2e1f55';

/** Rounded Japanese font: kana and kanji come from it, Latin and Cyrillic stay in Nunito / Comfortaa. */
export const JAPANESE_FONT_FAMILY = '"M PLUS Rounded 1c"';
export const FONT_FAMILY = `Nunito, ${JAPANESE_FONT_FAMILY}, "Segoe UI", "Yu Gothic UI", system-ui, sans-serif`;
export const TITLE_FONT_FAMILY = `Comfortaa, ${FONT_FAMILY}`;
