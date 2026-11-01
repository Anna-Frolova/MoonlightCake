// Shared type definitions. Ids are string unions so the editor autocompletes them
// and TypeScript catches typos (similar to enums in C#).
import type { Rgb } from '../core/color';
import type { Localized } from '../core/language';

export type ShapeId = 'round' | 'square' | 'heart' | 'star';
export type FlavorId = 'vanilla' | 'chocolate' | 'strawberry' | 'lavender' | 'mint' | 'sky' | 'starry';
export type FillingId = 'jam' | 'caramel' | 'blueberry' | 'honey' | 'jelly';
export type CreamId = 'butter' | 'berry' | 'cloud' | 'moon';
export type EssenceId = 'red' | 'yellow' | 'blue' | 'white' | 'dark';
export type ToppingId =
  | 'strawberry' | 'currant' | 'blueberry' | 'raspberry'
  | 'rosePink' | 'roseWhite' | 'leaves' | 'lavender'
  | 'pearl' | 'goldPearl'
  // only the special guests order these (see `special` on CatDef)
  | 'chili' | 'feather' | 'bat' | 'mochi' | 'candle' | 'butterfly';
export type GlazeColorId =
  | 'red' | 'yellow' | 'blue' | 'orange' | 'green' | 'purple' | 'sunset' | 'teal' | 'lime'
  | 'pink' | 'sky' | 'lilac' | 'lemon' | 'white' | 'night' | 'plum' | 'forest' | 'cherry' | 'black';
export type PaletteId = 'berry' | 'sunny' | 'sea' | 'lavender' | 'forest' | 'night' | 'chocolate'
  | 'inferno' | 'heaven' | 'dracula' | 'shrine' | 'cult' | 'meadow';
/** After the everyday five come the special guests' magic: dark (demon, cultist), light (angel), blood (vampire), sakura (samurai). */
export type ElementId = 'fire' | 'ice' | 'bolt' | 'nature' | 'star' | 'dark' | 'light' | 'blood' | 'sakura';
/** How the kitchen (and the music) changes while a special guest visits. */
export type KitchenThemeId = 'dungeon' | 'heaven' | 'palace' | 'shrine' | 'cult' | 'meadow';
export type CatId =
  | 'pushinka' | 'barsyk' | 'lihtaryk' | 'vusan' | 'mzhychka' | 'bulochka' | 'murlin'
  | 'mokhovyk' | 'serdenko' | 'morok' | 'drimko' | 'queen'
  | 'teacher' | 'grandpa'
  | 'demon' | 'angel' | 'vampire' | 'samurai' | 'cultist' | 'fairy';
export type DecorId = 'garland' | 'catnip' | 'gramophone' | 'cushion' | 'vitrage' | 'chandelier';
/** Kitchen station a helper automates. */
export type HelperId = 'layers' | 'cream' | 'glaze' | 'toppings' | 'magic';
export type ShopItemId = `decor:${DecorId}` | `helper:${HelperId}`;

/** Number of drops of each essence in the cauldron. */
export type Drops = Record<EssenceId, number>;
export type Recipe = Partial<Drops>;

// ---------------- definitions (static game data) ----------------

// Every player-visible text is `Localized` ({ uk, ja }); read it with `loc(...)` from core/language.
export interface ShapeDef { name: Localized; noun: Localized }
export interface FlavorDef { name: Localized; color: string; sparkles?: boolean }
export interface FillingDef { name: Localized; shortName: Localized; color: string; glows?: boolean }
export interface CreamDef { name: Localized; color: string; glows?: boolean }
export interface EssenceDef { name: Localized; color: string; unlockDay: number }
export interface ToppingDef { name: Localized }
export interface GlazeColorDef { id: GlazeColorId; name: Localized; recipe: Recipe }
export interface ElementDef { name: Localized; color: string; signName: Localized; unlockDay: number }

/** A colour palette: every order is built from one of them so its colours harmonise. */
export interface PaletteDef {
  name: Localized;
  /** Three colours shown as dots on the order card. */
  swatches: [string, string, string];
  // Earlier entries in each list are the palette's signature items and are picked more often.
  flavors: FlavorId[];
  fillings: FillingId[];
  creams: CreamId[];
  glazes: GlazeColorId[];
  toppings: ToppingId[];
  elements: ElementId[];
  /** A special guest's own palette: never used for anyone else. */
  isSpecial?: boolean;
}

export type CatPattern = 'none' | 'stripes' | 'points' | 'calico' | 'bicolor';
export type CatHat = 'none' | 'flowers' | 'tophat' | 'witch' | 'captain' | 'souwester' | 'wizard' | 'kerchief' | 'crown' | 'chef'
  | 'gothic' | 'mushroom' | 'beret' | 'nightcap' | 'horns' | 'halo' | 'vampire'
  | 'bun' | 'flatcap' | 'topknot' | 'hood' | 'leafCrown';
export type CatOutfit = 'none' | 'dress' | 'vest' | 'cloak' | 'sailor' | 'raincoat' | 'robe' | 'apron' | 'gown' | 'chef' | 'gothic' | 'leafy' | 'pajamas'
  | 'demon' | 'angel' | 'vampire' | 'cardigan' | 'samurai' | 'cultRobe' | 'petalDress';
export type CatAccessory = 'none' | 'monocle' | 'glasses' | 'bow' | 'fangs' | 'beard';
/** Drawn behind the cat: wings, a cape with a tall collar, or a sheathed katana across the back. */
export type CatBack = 'none' | 'batWings' | 'featherWings' | 'cape' | 'fairyWings' | 'katana';
/** `smile`: a light smile with open eyes (`happy` is the big beaming face with closed eyes). */
export type Mood = 'neutral' | 'happy' | 'sad' | 'thinking' | 'angry' | 'surprised' | 'smile';

/** How a cat looks (also used for the chef mascot and the helper kitten). */
export interface CatLook {
  id: string;
  fur: string;
  /** Secondary fur colour: stripes, siamese points, white belly… */
  furAccent: string;
  /** Third colour for calico patches. */
  furPatch?: string;
  pattern: CatPattern;
  eyeColor: string;
  hat: CatHat;
  outfit: CatOutfit;
  outfitColor: string;
  accessory?: CatAccessory;
  isKitten?: boolean;
  /** Dark fur: use light whiskers. */
  isDarkFur?: boolean;
  back?: CatBack;
  /** Little devil's tail with a spade tip. */
  hasSpadeTail?: boolean;
  /** Second accessory worn together with the first one (the grandpa's beard and glasses). */
  extraAccessory?: CatAccessory;
}

export interface CatDef extends CatLook {
  id: CatId;
  name: Localized;
  /** First day this guest visits the café. */
  firstDay: number;
  voicePitch: number;
  /** Always orders three layers (from day 2). */
  ordersBigCakes?: boolean;
  /** Tips 30% more. */
  isGenerous?: boolean;
  favoritePalettes: PaletteId[];
  favoriteShapes: ShapeId[];
  /** A picky guest orders only cakes that follow this rule. */
  orderRule?: OrderRule;
  /** A special guest: orders cakes in their own style and transforms the kitchen and the music. */
  special?: SpecialGuest;
}

/** What makes a special guest's visit special. */
export interface SpecialGuest {
  theme: KitchenThemeId;
  /** Their own palette (marked `isSpecial`), their magic and their signature topping, which is on every cake they order. */
  palette: PaletteId;
  element: ElementId;
  topping: ToppingId;
}

/** "Only these glaze colours" and/or "only these shapes" — the order picture shows it, no text needed. The guest skips days when today's menu can't make it. */
export interface OrderRule {
  glazes?: GlazeColorId[];
  shapes?: ShapeId[];
}

/** What a guest says; every list is used up before any line repeats (see game/lines.ts). */
export interface CatLines { hello: string[]; ask: string[]; good: string[]; ok: string[]; bad: string[] }

/** Decor shows its tip bonus instead of a description; helpers have a short description. */
export interface ShopItemDef { id: ShopItemId; tab: 'decor' | 'helpers'; name: Localized; description?: Localized; price: number; tipBonus?: number }

// ---------------- runtime data ----------------

export interface Order {
  palette: PaletteId;
  shape: ShapeId;
  layerCount: number;
  flavor: FlavorId;
  /** Filling between layers (null for a single layer). */
  filling: FillingId | null;
  cream: CreamId;
  glaze: GlazeColorId;
  toppings: Partial<Record<ToppingId, number>>;
  element: ElementId;
  /** The Moon Queen's special order (pays more). */
  isRoyal: boolean;
  /** A special guest's order (pays more too). */
  isSpecial: boolean;
}

export type StackItem =
  | { kind: 'layer'; flavor: FlavorId; dropProgress?: number }
  | { kind: 'filling'; filling: FillingId; dropProgress?: number };

/** One piped cream bead along the top edge or around the base. */
export interface CreamDot { x: number; y: number; ring: 'top' | 'base'; isPiped: boolean; revealAt?: number }

export interface PlacedTopping {
  topping: ToppingId;
  /** Offset from the centre of the cake's top face. */
  x: number; y: number;
  popProgress?: number;
}

export interface Cake {
  shape: ShapeId;
  /** Bottom to top. */
  stack: StackItem[];
  cream: CreamId | null;
  creamDots: CreamDot[] | null;
  creamCoverage: number;
  creamCompleted: boolean;
  glaze: Rgb | null;
  /** 0 → just poured, 1 → fully spread with drips (can start negative to delay). */
  glazeProgress: number;
  cauldron: Drops;
  toppings: PlacedTopping[];
  /** Spell quality 0..1, or null if not enchanted yet. */
  magicQuality: number | null;
  element: ElementId | null;
  magicCastTime: number;
  /** Seed for stable random details (crumbs, drip lengths). */
  seed: number;
}

export interface DailyMenu {
  day: number;
  shapes: ShapeId[];
  flavors: FlavorId[];
  fillings: FillingId[];
  creams: CreamId[];
  toppings: ToppingId[];
  /** Items unlocked for the first time today / returning after a rest / resting today. */
  fresh: MenuLists;
  returning: MenuLists;
  resting: MenuLists;
}
export interface MenuLists { shapes: ShapeId[]; flavors: FlavorId[]; fillings: FillingId[]; creams: CreamId[]; toppings: ToppingId[] }
export type MenuCategory = keyof MenuLists;

export interface QueuedGuest { cat: CatId; tutorial?: 1 | 2 }

export type GamePhase = 'dayStart' | 'inDay' | 'dayEnd' | 'shop';

export interface SaveData {
  version: number;
  day: number;
  coins: number;
  owned: Partial<Record<ShopItemId, boolean>>;
  /** Seed for the daily menu rotation, fixed per playthrough. */
  seed: number;
  menu: DailyMenu | null;
  phase: GamePhase;
  guestIndex: number;
  guestQueue: QueuedGuest[] | null;
  dayStats: { earned: number; served: number; hearts: number; bestHearts: number };
  totals: { served: number; hearts: number; earned: number };
  finaleSeen: boolean;
  musicOn: boolean;
  soundOn: boolean;
}
