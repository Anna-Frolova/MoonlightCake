// Paint-like mixing of essences in the cauldron (RYB colour model: red + blue = purple, etc.).
import { colorDistance, mixRgb, type Rgb } from '../core/color';
import { lerp } from '../core/math';
import { GLAZE_COLORS, glazeColorById } from '../data/ingredients';
import type { Drops, GlazeColorDef, GlazeColorId, Recipe } from '../data/types';

/** Corners of the RYB cube in RGB (0..1); the colour in between is interpolated. */
const RYB_CORNERS = {
  none: [1, 1, 1], red: [0.95, 0.12, 0.15], yellow: [1, 0.88, 0.1], blue: [0.16, 0.38, 0.9],
  redYellow: [1, 0.52, 0.05], redBlue: [0.55, 0.12, 0.68], yellowBlue: [0.12, 0.68, 0.3], all: [0.22, 0.12, 0.06],
};
const DARK_ESSENCE_RGB: Rgb = [28, 20, 48];
const WHITE: Rgb = [255, 255, 255];
/** Dark essence on its own: an almost-black glaze with a hint of violet. */
const BLACK_GLAZE_RGB: Rgb = [42, 34, 58];
/** How strongly white/dark drops tint the mix. */
const TINT_STRENGTH = 0.85;

function rybToRgb(red: number, yellow: number, blue: number): Rgb {
  const c = RYB_CORNERS, result: number[] = [];
  for (let i = 0; i < 3; i++) {
    const noBlueNoYellow = lerp(c.none[i], c.red[i], red);
    const noBlueYellow = lerp(c.yellow[i], c.redYellow[i], red);
    const blueNoYellow = lerp(c.blue[i], c.redBlue[i], red);
    const blueYellow = lerp(c.yellowBlue[i], c.all[i], red);
    result.push(lerp(lerp(noBlueNoYellow, noBlueYellow, yellow), lerp(blueNoYellow, blueYellow, yellow), blue) * 255);
  }
  return result as Rgb;
}

export const totalDrops = (drops: Drops): number => drops.red + drops.yellow + drops.blue + drops.white + drops.dark;

/** Colour of the mix in the cauldron, or null when it is empty. */
export function mixDrops(drops: Drops): Rgb | null {
  const colored = drops.red + drops.yellow + drops.blue;
  const total = colored + drops.white + drops.dark;
  if (total === 0) return null;
  if (colored === 0) { // only white and/or dark
    if (drops.dark === 0) return [...WHITE];
    if (drops.white === 0) return [...BLACK_GLAZE_RGB];
    return mixRgb(WHITE, DARK_ESSENCE_RGB, (drops.dark / (drops.white + drops.dark)) * 0.8);
  }
  const strongest = Math.max(drops.red, drops.yellow, drops.blue);
  let color = rybToRgb(drops.red / strongest, drops.yellow / strongest, drops.blue / strongest);
  color = mixRgb(color, WHITE, (drops.white / total) * TINT_STRENGTH);
  color = mixRgb(color, DARK_ESSENCE_RGB, (drops.dark / total) * TINT_STRENGTH);
  return color;
}

export function recipeToDrops(recipe: Recipe): Drops {
  return { red: recipe.red ?? 0, yellow: recipe.yellow ?? 0, blue: recipe.blue ?? 0, white: recipe.white ?? 0, dark: recipe.dark ?? 0 };
}

export const glazeRgb = (id: GlazeColorId): Rgb => mixDrops(recipeToDrops(glazeColorById(id).recipe))!;

/** The named glaze colour closest to `rgb`, and how far it is. */
export function nearestGlazeColor(rgb: Rgb): { color: GlazeColorDef; distance: number } {
  let best = GLAZE_COLORS[0], bestDistance = Infinity;
  for (const color of GLAZE_COLORS) {
    const distance = colorDistance(rgb, glazeRgb(color.id));
    if (distance < bestDistance) { bestDistance = distance; best = color; }
  }
  return { color: best, distance: bestDistance };
}

/** Below this distance the cauldron shows the colour's name instead of "unusual shade". */
export const NAMED_COLOR_DISTANCE = 22;

