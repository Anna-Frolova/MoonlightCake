// Where things sit on the kitchen screen. Change these to rearrange the kitchen.
// The left column holds only the order (the guest and the cake they think of); everything you work with
// is in the middle, around the cake.

/**
 * The order column on the left: the guest in a window at the bottom thinks of the wanted cake in a cloud above it.
 * This area stays bright under the tutorial veil and the guest's speech.
 */
export const ORDER_AREA = { x: 16, y: 70, w: 360, h: 650 };
/**
 * The guest's window, from the hat to the chest (narrow enough to stay clear of the station tabs): the head sits
 * at `headAt` of its height; their name on a tag inside it (`nameTag` from the window's corner), a thin patience
 * bar `patienceGap` under it.
 */
export const GUEST_WINDOW = {
  x: 22, y: 476, w: 318, h: 206, headAt: 0.62, catScale: 1, markOffset: { x: 82, y: -62 },
  nameTag: { x: 12, y: 28 }, patienceGap: 10, patienceHeight: 8,
};
/**
 * The thought cloud with the wanted cake: a puffy cloud of `bumps` circles around an ellipse filling the box,
 * the cake centred inside it (`picturePadding` from the box), three thought dots (centre and radius) rising
 * from the window's top right corner.
 */
export const THOUGHT_CLOUD = {
  x: 22, y: 76, w: 348, h: 352, bumps: 11, bumpRadius: 50, picturePadding: { x: 40, y: 40 },
  dots: [{ x: 280, y: 462, r: 8 }, { x: 296, y: 443, r: 11 }, { x: 310, y: 420, r: 15 }],
  bobPixels: 3, bobSpeed: 1.6,
};

/** The cake's resting point: horizontal centre (middle of the free area right of the ticket) and the bottom of the cake. */
export const CAKE_CENTER_X = 828;
export const CAKE_BASE_Y = 556;

/** At the glaze station the cake slides right and shrinks so the shelf and cauldron fit in the middle. */
export const GLAZE_STATION_CAKE_X = 1000;
export const GLAZE_STATION_CAKE_SCALE = 0.72;

/**
 * The main button of a station that you press while working on the cake ("pour the glaze", undo the last layer)
 * sits right of the cake, low on the screen, where the right thumb rests on a phone.
 */
export const CAKE_SIDE_BUTTON = { x: 1136, y: 430, w: 128, h: 92 };
/** Toppings station: "Remove all" in the side button's place right of the cake. */
export const CLEAR_TOPPINGS_BUTTON = { x: CAKE_SIDE_BUTTON.x, y: CAKE_SIDE_BUTTON.y + 16, w: CAKE_SIDE_BUTTON.w, h: 60 };
/** The helper's "Auto" button: under the side button. */
export const AUTO_BUTTON = { x: CAKE_SIDE_BUTTON.x, y: CAKE_SIDE_BUTTON.y + CAKE_SIDE_BUTTON.h + 14, w: CAKE_SIDE_BUTTON.w, h: 56 };

export const CAULDRON = { x: CAKE_CENTER_X - 40, y: 592 };
/** Centre of the cauldron's opening: where elixir pours in and the glaze arc starts. */
export const CAULDRON_MOUTH = { x: CAULDRON.x, y: CAULDRON.y - 120 };
/** Max drops the cauldron holds. */
export const CAULDRON_CAPACITY = 10;
/** "Empty the cauldron" sits low on the left of the cauldron, far from "Pour" on the right of the cake. */
export const EMPTY_CAULDRON_BUTTON = { x: CAULDRON.x - 250, y: CAULDRON.y - 42, w: 130, h: 50 };

/** Elixir shelf: bottles stand at `firstX + i * spacing`, all scaled by `bottleScale`. */
export const ELIXIR_SHELF = { y: 352, firstX: CAULDRON.x - 144, spacing: 72, bottleScale: 1.35, boardWidth: 380 };
/** Where a bottle hovers while it tilts and pours. */
export const POUR_POSITION = { x: CAULDRON.x - 62, y: 418 };
/** A bottle released this close to the cauldron mouth (and below the shelf) pours into it. */
export const POUR_REACH = 140;

/** Station buttons ("Auto", undo, pour…) line up right-aligned in the top right corner of the work area. */
export const STATION_CONTROLS = { right: 1264, y: 76, h: 46, gap: 8 };
/** Centre of short messages (toasts, "already decorated" hint). */
export const KITCHEN_MESSAGE_X = CAKE_CENTER_X;
/** Decorative shelf with the bought helpers, on the wall at the top right. */
export const HELPER_SHELF = { x: 1010, y: 172, w: 250, slotXs: [1045, 1105, 1165], potionX: 1226 };
/** Station tabs along the bottom: icon pills centred on the screen, `iconScale` for the station icons. */
export const TABS = { y: 652, h: 58, w: 104, gap: 14, iconScale: 0.95, doneBadge: { radius: 12, inset: 18 } };
/** Top bar: a compact day counter (moon, day · guest), coins, the settings gear, then reset on the right. */
export const TOP_BAR_HEIGHT = 62;
export const KITCHEN_TOP = { dayX: 24, coinsX: 150, settingsX: 316, y: 8 };
/** The music / sound panel that the gear opens, just under it. */
export const SETTINGS_PANEL = { x: KITCHEN_TOP.settingsX - 10, y: TOP_BAR_HEIGHT + 6 };
/** "Reset" in the top bar: a small round button (a bin), with a question before the cake is thrown away. */
export const RESET_BUTTON = { x: 1212, y: 6, w: 52, h: 52 };
/** "Serve": the main button of the kitchen, bottom right on the line of the tabs, where the player looks for it; well apart from the last tab. */
export const SERVE_BUTTON = { x: 1070, y: TABS.y, w: 194, h: TABS.h, fontSize: 23 };

/** Area around the cake where pressing starts piping cream. */
export const CREAM_ZONE = { halfWidth: 175, above: 75, below: 55 };
/** Radius of the piping bag nozzle: beads closer than this get piped. */
export const CREAM_BRUSH_RADIUS = 28;
/** Area where magic signs can be drawn (right of the order ticket, between the bars). */
export const MAGIC_DRAW_AREA = { left: 392, top: 64, bottom: 644 };
/**
 * Toppings station: the checklist of ordered toppings (big icons with "on the cake / wanted" counts) in the free
 * space left of the cake, under the shelf.
 */
export const TOPPING_CHECKLIST = { x: 400, y: 352, w: 236, titleH: 34, rowH: 60, iconScale: 2.2 };
/**
 * A topping carried by a finger is held this far up and to the left of it, so the finger doesn't hide where it
 * goes; it slides there over `easeSeconds` after the pickup. With a mouse it stays right at the cursor.
 */
export const TOPPING_HOLD_OFFSET = { x: -62, y: -40, easeSeconds: 0.15 };
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
export type ShelfLayout = typeof INGREDIENT_SHELF;

/** Layers station: the sponges get the shelf above the cake to themselves, a little bigger. */
export const FLAVOR_SHELF: ShelfLayout = { ...INGREDIENT_SHELF, spacing: 124, itemScale: 1.5, itemHalfWidth: 58, itemHeight: 110 };
/** Layers station: jars of filling on their own small shelf left of the cake (under the order ticket's edge). */
export const FILLING_SHELF: ShelfLayout = {
  y: 492, centerX: 523, maxWidth: 258, spacing: 70, boardHeight: 14,
  itemScale: 1.05, itemHalfWidth: 32, itemHeight: 70, labelSize: 15,
};

/** Layers station: shape switches in a row above the shelf. */
export const SHAPE_SWITCHES = { y: 120, size: 64, gap: 12 };
/**
 * Tutorial guides: the sign to draw, big and dashed over the cake (centred `aboveCakeTop` over its top face);
 * the hand that shows a drag, lifted `arcLift` over the straight line between the shelf and the cake.
 */
export const TUTORIAL_GUIDE = { signSize: 230, aboveCakeTop: 20, arcLift: 90, padding: 8 };

/** Magic station: a row of the elements (sign + name) above the cake. */
export const ELEMENT_ROW = { y: 132, w: 104, signSize: 46, gap: 6 };
