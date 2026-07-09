// World registry — the data spine of Super Nuno (ROADMAP Phase 1).
//
// COMMON is the shared "game grammar": every frame index, animation, and
// visual theme that means the same thing in every world (blocks, coins,
// pipes, flag, clouds...). The per-world entries hold only what carries
// story meaning: which Nuno you are, which pack to load, which finale
// plays. Adding a world = adding an entry here + its asset pack — never
// engine surgery.
//
// Frame indices refer to the Kenney sheets ('tiles' 18×18, 'chars' 24×24,
// 'bg' 24×24) — the full frame map lives in ASSET-WORKFLOW.md §1.

import { ICE_DRAG_FACTOR } from './constants.js';

export const COMMON = {
  // ---- Frame indices in the 'tiles' sheet ----
  frames: {
    tiles: {
      platformSingle: 76,
      platformLeft: 77,
      platformMid: 78,
      platformRight: 79,
      cloudLeft: 153,
      cloudMid: 154,
      cloudRight: 155,
      cloudSmall: 156,
      coin: 151,
      blockQuestion: 10,
      blockUsed: 31,
      brick: 6,
      mushroom: 128,
      pole: 131,
      flag: 111,
      doorTop: 130,
      doorBottom: 150,
      gemBlue: 67, // recolored at load into gem-fire / gem-star
    },
    // level-grid decoration characters → tile frames
    decor: { '>': 86, '*': 125, '^': 126, '"': 124, o: 145 },
    // 'bg' sheet: the rolling hills strip used for parallax
    hills: [8, 9, 10, 11],
  },

  // ---- Animations (data, not code — PreloadScene creates them all) ----
  anims: [
    { key: 'player-idle', sheet: 'chars', frames: [0] },
    { key: 'player-run', sheet: 'chars', frames: [0, 1], frameRate: 10, repeat: -1 },
    { key: 'player-jump', sheet: 'chars', frames: [1] },
    // FIRE = Kenney's orange character — a palette swap, classic style
    { key: 'fire-idle', sheet: 'chars', frames: [6] },
    { key: 'fire-run', sheet: 'chars', frames: [6, 7], frameRate: 10, repeat: -1 },
    { key: 'fire-jump', sheet: 'chars', frames: [7] },
    { key: 'coin-spin', sheet: 'tiles', frames: [151, 152], frameRate: 6, repeat: -1 },
    { key: 'walker-walk', sheet: 'chars', frames: [18, 19], frameRate: 6, repeat: -1 },
    { key: 'flag-wave', sheet: 'tiles', frames: [111, 112], frameRate: 3, repeat: -1 },
  ],

  // ---- Visual themes, picked per level via its `theme` field ----
  // Shared across worlds in v1; a world entry may override any theme's
  // values via its own `themes` (palette re-theming is the cheap lever).
  themes: {
    overworld: {
      sky: '#5c94fc',
      terrainTop: 2, // grass
      terrainFill: 122, // dirt
      parallax: true,
    },
    underground: {
      sky: '#12122a',
      terrainTop: 42, // cave floor
      terrainFill: 142, // packed dirt
      parallax: false,
    },
    snow: {
      sky: '#a8c8ec',
      terrainTop: 81, // snow-capped ground
      terrainFill: 121, // dirt
      parallax: true,
      dragFactor: ICE_DRAG_FACTOR, // ice! much less friction — you slide
    },
  },
};

// ---- The five life stages ----
// `character` points at anim-key prefixes per power state; Player derives
// `${prefix}-idle|run|jump`. Today every world still shows the Kenney base
// character — Phase 3 swaps world 1's entry to baby-Nuno's pack keys and
// NOTHING else has to change. That seam is the whole point of this file.
const KENNEY_BASE_CHARACTER = {
  sheet: 'chars',
  idleFrame: 0,
  animPrefix: { SMALL: 'player', BIG: 'player', FIRE: 'fire' },
};

const KENNEY_BASE_ENEMIES = {
  walker: { sheet: 'chars', walkFrame: 18, squashedFrame: 20, walkAnim: 'walker-walk' },
};

export const WORLDS = {
  1: {
    id: 1,
    stage: 'baby',
    title: 'World 1 — Baby',
    pack: 'world-1', // asset pack folder (loading wired in Phase 2)
    startLevel: 'level1',
    character: KENNEY_BASE_CHARACTER,
    enemies: KENNEY_BASE_ENEMIES,
    themes: {}, // per-theme overrides (palette re-theming, later)
    finale: 'first-dog', // Phase 8: the post-flag story scene
  },
  2: {
    id: 2,
    stage: 'kid',
    title: 'World 2 — Kid',
    pack: 'world-2',
    startLevel: null, // levels authored in Phase 10
    character: KENNEY_BASE_CHARACTER,
    enemies: KENNEY_BASE_ENEMIES,
    themes: {},
    finale: 'futbol-champion',
  },
  3: {
    id: 3,
    stage: 'teen',
    title: 'World 3 — Teen',
    pack: 'world-3',
    startLevel: null,
    character: KENNEY_BASE_CHARACTER,
    enemies: KENNEY_BASE_ENEMIES,
    themes: {},
    finale: 'the-request',
  },
  4: {
    id: 4,
    stage: 'adult',
    title: 'World 4 — Adult',
    pack: 'world-4',
    startLevel: null,
    character: KENNEY_BASE_CHARACTER,
    enemies: KENNEY_BASE_ENEMIES,
    themes: {},
    finale: 'the-future-home',
  },
  5: {
    id: 5,
    stage: 'love',
    title: 'World 5 — Love',
    pack: 'world-5',
    startLevel: null,
    character: KENNEY_BASE_CHARACTER,
    enemies: KENNEY_BASE_ENEMIES,
    themes: {},
    finale: 'one-year',
  },
};

// Until the world-select map exists (Phase 6), one world is active.
export const ACTIVE_WORLD = 1;

export function getActiveWorld() {
  return WORLDS[ACTIVE_WORLD];
}

/** A level's theme = the COMMON theme + the active world's overrides. */
export function resolveTheme(world, themeName) {
  const base = COMMON.themes[themeName];
  const override = world.themes?.[themeName];
  return override ? { ...base, ...override } : base;
}
