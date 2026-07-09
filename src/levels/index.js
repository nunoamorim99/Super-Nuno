import level1 from './level1.js';
import level2 from './level2.js';
import level3 from './level3.js';
import level4 from './level4.js';
import level5 from './level5.js';
import bonus11 from './bonus11.js';
import bonus15 from './bonus15.js';

// World 1: level1 → level5, chained via each level's `next` field.
export const LEVELS = { level1, level2, level3, level4, level5, bonus11, bonus15 };

// Visual themes moved to src/config/worlds.js (COMMON.themes) in Phase 1 —
// levels keep picking one by name via their `theme` field.
