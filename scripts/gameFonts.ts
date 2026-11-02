// Vite plugin: bundles the game's web fonts so it needs no internet (the app version runs offline).
// The full fonts are large (the Japanese one is ~1 MB per weight), so they are cut down to the
// characters that actually appear in the game's source files. Runs at dev-server start and on every build;
// the result goes to src/fonts/generated/ (git-ignored) and is imported by src/main.ts.
import { createHash } from 'node:crypto';
import { existsSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin } from 'vite';
// @ts-expect-error subset-font ships without type declarations
import subsetFont from 'subset-font';

interface FontSpec {
  /** Folder under node_modules/@fontsource. */
  pkg: string;
  weights: number[];
  /** Which characters this family draws; the rest fall through to the next font in the CSS stack. */
  covers: (codePoint: number) => boolean;
  /** One whole-script file instead of @fontsource's many small slices (each slice adds overhead). */
  wholeFile?: (weight: number) => string;
}

/** First code point of the CJK blocks (kana, kanji, Japanese punctuation, full-width forms). */
const CJK_START = 0x2e80;
/** Symbols (✓ ♪ ♥ →…): Nunito lacks most of them, the Japanese font draws them. */
const SYMBOLS_START = 0x2000;
const FONTS: FontSpec[] = [
  { pkg: 'nunito', weights: [700, 800, 900], covers: cp => cp < CJK_START },
  { pkg: 'comfortaa', weights: [700], covers: cp => cp < CJK_START },
  { pkg: 'm-plus-rounded-1c', weights: [700, 800, 900], covers: cp => cp >= SYMBOLS_START, wholeFile: w => `m-plus-rounded-1c-japanese-${w}-normal.woff2` },
];
/** Always kept, so numbers and plain Latin never fall back to a system font. */
const ALWAYS = Array.from({ length: 0x7f - 0x20 }, (_, i) => String.fromCharCode(0x20 + i)).join('') + '♥…«»—–’“”№';
const SCANNED_EXTENSIONS = /\.(ts|html)$/;
/** Bump to force regeneration when this script's output format changes. */
const GENERATOR_VERSION = 2;

const root = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const outDir = join(root, 'src/fonts/generated');
const cssPath = join(outDir, 'fonts.css');

function listFiles(dir: string): string[] {
  return readdirSync(dir).flatMap(name => {
    const path = join(dir, name);
    if (path === outDir) return [];
    return statSync(path).isDirectory() ? listFiles(path) : SCANNED_EXTENSIONS.test(name) ? [path] : [];
  });
}

function usedCodePoints(): Set<number> {
  const text = [ALWAYS, readFileSync(join(root, 'index.html'), 'utf8'), ...listFiles(join(root, 'src')).map(f => readFileSync(f, 'utf8'))].join('');
  const points = new Set<number>();
  for (const ch of text) { const cp = ch.codePointAt(0)!; if (cp >= 0x20) points.add(cp); }
  return points;
}

/** Parses "U+0460-052F,U+20B4" into a membership test. */
function parseUnicodeRange(range: string): (cp: number) => boolean {
  const spans = range.split(',').map(part => {
    const [from, to] = part.trim().replace(/^U\+/i, '').split('-');
    return [parseInt(from, 16), parseInt(to ?? from, 16)] as const;
  });
  return cp => spans.some(([from, to]) => cp >= from && cp <= to);
}

/** Code points back into a compact unicode-range ("U+41-5A,U+430"). */
function toUnicodeRange(points: number[]): string {
  const parts: string[] = [];
  for (let i = 0; i < points.length; i++) {
    const start = points[i];
    while (i + 1 < points.length && points[i + 1] === points[i] + 1) i++;
    parts.push(start === points[i] ? `U+${start.toString(16)}` : `U+${start.toString(16)}-${points[i].toString(16)}`);
  }
  return parts.join(',');
}

interface Face { family: string; weight: number; file: string; range: (cp: number) => boolean }

/** Reads @fontsource's CSS for one weight: one @font-face per character-range slice. */
function readFaces({ pkg, wholeFile }: FontSpec, weight: number): Face[] {
  const pkgDir = join(root, 'node_modules/@fontsource', pkg);
  const css = readFileSync(join(pkgDir, `${weight}.css`), 'utf8');
  const faces = [...css.matchAll(/@font-face\s*{([^}]*)}/g)].map(([, body]) => ({
    family: /font-family:\s*'([^']+)'/.exec(body)![1],
    weight,
    file: join(pkgDir, /url\(\.\/([^)]+\.woff2)\)/.exec(body)![1]),
    range: parseUnicodeRange(/unicode-range:\s*([^;]+);/.exec(body)![1]),
  }));
  return wholeFile ? [{ ...faces[0], file: join(pkgDir, 'files', wholeFile(weight)), range: () => true }] : faces;
}

async function generate(log: (message: string) => void): Promise<void> {
  const points = usedCodePoints();
  const config = JSON.stringify(FONTS, (_, value: unknown) => typeof value === 'function' ? value.toString() : value);
  const hash = createHash('sha1').update(JSON.stringify([GENERATOR_VERSION, config, [...points].sort((a, b) => a - b)])).digest('hex');
  const stamp = `/* fonts-hash: ${hash} */`;
  if (existsSync(cssPath) && readFileSync(cssPath, 'utf8').startsWith(stamp)) return;

  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const rules: string[] = [stamp];
  let totalBytes = 0;
  for (const spec of FONTS) {
    for (const weight of spec.weights) {
      for (const face of readFaces(spec, weight)) {
        const wanted = [...points].filter(cp => spec.covers(cp) && face.range(cp)).sort((a, b) => a - b);
        if (!wanted.length) continue;
        const data: Buffer = await subsetFont(readFileSync(face.file), String.fromCodePoint(...wanted), { targetFormat: 'woff2' });
        const name = `${spec.pkg}-${weight}-${rules.length}.woff2`;
        writeFileSync(join(outDir, name), data);
        totalBytes += data.length;
        rules.push(`@font-face { font-family: '${face.family}'; font-style: normal; font-weight: ${weight}; font-display: block;`
          + ` src: url(./${name}) format('woff2'); unicode-range: ${toUnicodeRange(wanted)}; }`);
      }
    }
  }
  writeFileSync(cssPath, rules.join('\n') + '\n');
  log(`game fonts: ${rules.length - 1} files, ${Math.round(totalBytes / 1024)} KB for ${points.size} characters`);
}

export function gameFonts(): Plugin {
  return {
    name: 'game-fonts',
    async buildStart() { await generate(message => this.info(message)); },
  };
}
