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

  // Animations are NOT here — they are data in each pack's manifest.json
  // (packs/common + packs/world-N), loaded and created by PreloadScene.

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
// Every world's character uses the SAME keys — sheet 'nuno', anims
// 'nuno-idle|run|jump' (+ 'nuno-fire-*') — and each world's pack manifest
// decides which pixels those keys mean. Swapping worlds swaps the pack;
// no code changes. `idleFrame` is the static frame HUD/Intro show — it
// mirrors the manifest's nuno-idle and goes back to 0 for every world
// once the real per-age sheets land (Phase 3+).
const NUNO_CHARACTER = (idleFrame = 0) => ({
  sheet: 'nuno',
  idleFrame,
  animPrefix: { SMALL: 'nuno', BIG: 'nuno', FIRE: 'nuno-fire' },
});

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
    levels: ['level1', 'level2', 'level3', 'level4', 'level5'], // bonus rooms excluded: entered via pipes
    character: NUNO_CHARACTER(0), // placeholder: Kenney green
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
    levels: [],
    character: NUNO_CHARACTER(2), // placeholder: Kenney blue
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
    levels: [],
    character: NUNO_CHARACTER(4), // placeholder: Kenney pink
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
    levels: [],
    character: NUNO_CHARACTER(9), // placeholder: Kenney tan
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
    levels: [],
    character: NUNO_CHARACTER(6), // placeholder: Kenney orange (same as FIRE until real art)
    enemies: KENNEY_BASE_ENEMIES,
    themes: {},
    finale: 'one-year',
  },
};

// One world is active per boot — its pack loads in PreloadScene. The
// world-select map switches worlds by saving the choice and reloading
// the page (assets are boot-time by design; a reload IS the world door).
// Dev builds also accept ?world=N in the URL for QA.
const DEFAULT_WORLD = 1;
const WORLD_KEY = 'supernuno.activeWorld';

function activeWorldId() {
  if (import.meta.env.DEV) {
    const n = Number(new URLSearchParams(window.location.search).get('world'));
    if (WORLDS[n]) return n;
  }
  try {
    const saved = Number(localStorage.getItem(WORLD_KEY));
    if (WORLDS[saved]?.startLevel) return saved;
  } catch {
    /* storage blocked */
  }
  return DEFAULT_WORLD;
}

export const ACTIVE_WORLD = activeWorldId();

export function getActiveWorld() {
  return WORLDS[ACTIVE_WORLD];
}

/** Persist the chosen world and reboot into its pack. */
export function switchWorld(id) {
  try {
    localStorage.setItem(WORLD_KEY, String(id));
  } catch {
    /* storage blocked */
  }
  window.location.reload();
}

/** A level's theme = the COMMON theme + the active world's overrides. */
export function resolveTheme(world, themeName) {
  const base = COMMON.themes[themeName];
  const override = world.themes?.[themeName];
  return override ? { ...base, ...override } : base;
}
