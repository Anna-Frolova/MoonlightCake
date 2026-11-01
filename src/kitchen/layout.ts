// Where things sit on the kitchen screen. Change these to rearrange the kitchen.

/** The cake's resting point: horizontal centre and the bottom of the cake (top of the stand). */
export const CAKE_CENTER_X = 760;
export const CAKE_BASE_Y = 556;

/** At the glaze station the cake slides right and shrinks so the shelf and cauldron fit in the middle. */
export const GLAZE_STATION_CAKE_X = 1112;
export const GLAZE_STATION_CAKE_SCALE = 0.76;

export const CAULDRON = { x: CAKE_CENTER_X, y: 592 };
/** Centre of the cauldron's opening: where elixir pours in and the glaze arc starts. */
export const CAULDRON_MOUTH = { x: CAULDRON.x, y: CAULDRON.y - 120 };
/** Max drops the cauldron holds. */
export const CAULDRON_CAPACITY = 10;

/** Elixir shelf: bottles stand at `firstX + i * spacing`, all scaled by `bottleScale`; left of the cake so the order ticket never hides a bottle. */
export const ELIXIR_SHELF = { y: 352, firstX: CAKE_CENTER_X - 200, spacing: 72, bottleScale: 1.35, boardWidth: 380 };
/** Where a bottle hovers while it tilts and pours. */
export const POUR_POSITION = { x: CAULDRON.x - 62, y: 418 };
/** A bottle released this close to the cauldron mouth (and below the shelf) pours into it. */
export const POUR_REACH = 140;

/**
 * Order ticket at the top right (big, so the wanted cake is easy to see on phones, with the guest's face
 * and patience on top) and the station's tool panel at the top left.
 */
export const TICKET = { x: 896, y: 70, w: 368, h: 366, headerHeight: 104, portraitRadius: 47 };
export const TOOL_PANEL = { x: 16, y: 70, w: 360, h: 344 };
/** Centre of short messages (toasts, "already decorated" hint) between the left panel and the ticket. */
export const KITCHEN_MESSAGE_X = 636;
/** Decorative shelf with the bought helpers, on the wall under the tool panel. */
export const HELPER_SHELF = { x: 40, y: 486, w: 250, slotXs: [80, 140, 200], potionX: 262 };
/** Station tabs along the bottom. */
export const TABS = { y: 652, h: 58, gap: 10, sideMargin: 16 };
/** Top bar with day, coins, reset and serve. */
export const TOP_BAR_HEIGHT = 62;

/** Area around the cake where pressing starts piping cream. */
export const CREAM_ZONE = { halfWidth: 175, above: 75, below: 55 };
/** Radius of the piping bag nozzle: beads closer than this get piped. */
export const CREAM_BRUSH_RADIUS = 28;
/** Area where magic signs can be drawn (right of the tool panel, between the bars). */
export const MAGIC_DRAW_AREA = { left: 392, top: 64, bottom: 644 };
/** Kitten helper sits on the table, left of the cake. */
export const HELPER_KITTEN_SPOT = { x: 1010, y: 548, scale: 0.42 };

/**
 * Shelf above the cake on the cream and toppings stations (like the elixir shelf on the glaze one):
 * items stand on the board at `y`, `spacing` apart, centred in the gap between the tool panel and the order ticket
 * (squeezed, and the items made smaller, when more than `maxWidth` would be needed); names go under the board.
 */
export const INGREDIENT_SHELF = {
  y: 298, centerX: KITCHEN_MESSAGE_X, maxWidth: 500, spacing: 104, boardHeight: 18,
  itemScale: 1.25, itemHalfWidth: 48, itemHeight: 100, labelSize: 16,
};
