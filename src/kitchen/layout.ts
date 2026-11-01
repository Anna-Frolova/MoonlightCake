// Where things sit on the kitchen screen. Change these to rearrange the kitchen.
// The left column holds only the order (the guest and the wanted cake); everything you work with
// is in the middle, around the cake.

/** The order: the guest in a big window on top, name and patience under it, the wanted cake below. */
export const TICKET = { x: 16, y: 70, w: 360, h: 572, portraitHeight: 206, nameY: 236, patienceY: 256, cardY: 280 };

/** The cake's resting point: horizontal centre (middle of the free area right of the ticket) and the bottom of the cake. */
export const CAKE_CENTER_X = 828;
export const CAKE_BASE_Y = 556;

/** At the glaze station the cake slides right and shrinks so the shelf and cauldron fit in the middle. */
export const GLAZE_STATION_CAKE_X = 1120;
export const GLAZE_STATION_CAKE_SCALE = 0.76;

export const CAULDRON = { x: CAKE_CENTER_X - 40, y: 592 };
/** Centre of the cauldron's opening: where elixir pours in and the glaze arc starts. */
export const CAULDRON_MOUTH = { x: CAULDRON.x, y: CAULDRON.y - 120 };
/** Max drops the cauldron holds. */
export const CAULDRON_CAPACITY = 10;

/** Elixir shelf: bottles stand at `firstX + i * spacing`, all scaled by `bottleScale`. */
export const ELIXIR_SHELF = { y: 352, firstX: CAULDRON.x - 144, spacing: 72, bottleScale: 1.35, boardWidth: 380 };
/** Where a bottle hovers while it tilts and pours. */
export const POUR_POSITION = { x: CAULDRON.x - 62, y: 418 };
/** A bottle released this close to the cauldron mouth (and below the shelf) pours into it. */
export const POUR_REACH = 140;

/** Station buttons ("Auto", undo, pour…) line up right-aligned in the top right corner of the work area. */
export const STATION_CONTROLS = { right: 1264, y: 72, h: 46, gap: 8 };
/** Centre of short messages (toasts, "already decorated" hint). */
export const KITCHEN_MESSAGE_X = CAKE_CENTER_X;
/** Decorative shelf with the bought helpers, on the wall at the top right. */
export const HELPER_SHELF = { x: 1010, y: 172, w: 250, slotXs: [1045, 1105, 1165], potionX: 1226 };
/** Station tabs along the bottom. */
export const TABS = { y: 652, h: 58, gap: 10, sideMargin: 16 };
/** Top bar with day, coins, reset and serve. */
export const TOP_BAR_HEIGHT = 62;

/** Area around the cake where pressing starts piping cream. */
export const CREAM_ZONE = { halfWidth: 175, above: 75, below: 55 };
/** Radius of the piping bag nozzle: beads closer than this get piped. */
export const CREAM_BRUSH_RADIUS = 28;
/** Area where magic signs can be drawn (right of the order ticket, between the bars). */
export const MAGIC_DRAW_AREA = { left: 392, top: 64, bottom: 644 };
/** Kitten helper sits on the table, right of the cake. */
export const HELPER_KITTEN_SPOT = { x: 1060, y: 548, scale: 0.42 };

/**
 * Shelf above the cake on the layers, cream and toppings stations (like the elixir shelf on the glaze one):
 * items stand on the board at `y`, `spacing` apart, centred over the cake (squeezed, and the items made smaller,
 * when more than `maxWidth` would be needed); names go under the board.
 */
export const INGREDIENT_SHELF = {
  y: 298, centerX: CAKE_CENTER_X, maxWidth: 760, spacing: 104, boardHeight: 18,
  itemScale: 1.25, itemHalfWidth: 48, itemHeight: 100, labelSize: 16,
};

/** Layers station: shape switches in a row above the shelf. */
export const SHAPE_SWITCHES = { y: 120, size: 64, gap: 12 };
/** Magic station: a row of the elements (sign + name) above the cake. */
export const ELEMENT_ROW = { y: 196, w: 118, h: 84, gap: 10 };
