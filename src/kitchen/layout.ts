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

/** Elixir shelf: bottles stand at `firstX + i * spacing`, all scaled by `bottleScale`. */
export const ELIXIR_SHELF = { y: 352, firstX: CAKE_CENTER_X - 144, spacing: 72, bottleScale: 1.35 };
/** Where a bottle hovers while it tilts and pours. */
export const POUR_POSITION = { x: CAULDRON.x - 62, y: 418 };
/** A bottle released this close to the cauldron mouth (and below the shelf) pours into it. */
export const POUR_REACH = 140;

/** Order ticket (top-left) and the station's tool panel under it. */
export const TICKET = { x: 16, y: 70, w: 360, h: 220 };
export const TOOL_PANEL = { x: 16, y: 298, w: 360, h: 344 };
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
 * items stand on the board at `y`, centred over the cake, `spacing` apart; names go under the board.
 */
export const INGREDIENT_SHELF = { y: 298, spacing: 104, boardHeight: 18, itemScale: 1.25, itemHalfWidth: 48, itemHeight: 100, labelSize: 16 };
