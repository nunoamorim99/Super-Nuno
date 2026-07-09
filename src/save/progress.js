// SaveData — the game's single persistent record (ROADMAP Phase 7).
// One JSON blob in localStorage, one module owning it. Per-device,
// per-browser: right for a portfolio piece, no backend.
//
// Shape:
//   {
//     completed:  { level1: true, ... },      // beaten levels
//     lastLevel:  'level2',                    // where Continue resumes
//     bestScores: { level1: 3400, ... },       // best per-level run
//     highScore:  12500,                       // best total run
//   }

import { WORLDS } from '../config/worlds.js';

const KEY = 'supernuno.progress';
const LEGACY_HIGHSCORE_KEY = 'supernuno.highscore'; // pre-Phase-7 location

function load() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY)) ?? {};
    // one-time migration: the old standalone high-score key
    if (p.highScore == null) {
      const legacy = Number(localStorage.getItem(LEGACY_HIGHSCORE_KEY));
      if (legacy > 0) p.highScore = legacy;
    }
    return p;
  } catch {
    return {}; // private mode / corrupted — play without persistence
  }
}

function save(progress) {
  try {
    localStorage.setItem(KEY, JSON.stringify(progress));
  } catch {
    /* storage blocked — non-fatal */
  }
}

// ------------------------------------------------------------ completion

export function isCompleted(levelId) {
  return !!load().completed?.[levelId];
}

export function markCompleted(levelId) {
  const p = load();
  p.completed = { ...p.completed, [levelId]: true };
  save(p);
}

/** The level Continue resumes at (last level the player entered). */
export function lastLevel() {
  return load().lastLevel ?? null;
}

export function setLastLevel(levelId) {
  const p = load();
  p.lastLevel = levelId;
  save(p);
}

// --------------------------------------------------------------- unlocks

/** A level is playable if it's the world's first or the previous one is done. */
export function unlockedLevels(world) {
  return world.levels.filter((id, i) => i === 0 || isCompleted(world.levels[i - 1]));
}

/** World 1 is always open; world N opens when world N-1 is fully completed. */
export function isWorldUnlocked(id) {
  if (id === 1) return true;
  const prev = WORLDS[id - 1];
  if (!prev || prev.levels.length === 0) return false;
  return prev.levels.every(isCompleted);
}

// ---------------------------------------------------------------- scores

export function highScore() {
  return load().highScore ?? 0;
}

/** Call at run end (game over / all clear): keeps the best total. */
export function submitRunScore(score) {
  const p = load();
  if (score > (p.highScore ?? 0)) {
    p.highScore = score;
    save(p);
    return true;
  }
  return false;
}

export function bestScore(levelId) {
  return load().bestScores?.[levelId] ?? 0;
}

/** Call on level completion with the score earned IN that level. */
export function recordLevelScore(levelId, score) {
  const p = load();
  const best = p.bestScores?.[levelId] ?? 0;
  if (score > best) {
    p.bestScores = { ...p.bestScores, [levelId]: score };
    save(p);
    return true;
  }
  return false;
}

// ------------------------------------------------------------------ dev

/** Unlock everything so the portfolio piece is always demoable. */
export function unlockAll() {
  const completed = {};
  for (const world of Object.values(WORLDS)) {
    for (const id of world.levels) completed[id] = true;
  }
  const p = load();
  p.completed = completed;
  save(p);
}
