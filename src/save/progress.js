// Minimal progress persistence (localStorage). This is the SEED of the
// Phase 7 save system — Phase 6 needs just enough state for the menu,
// world select, and level select to reflect reality: what's completed,
// what's unlocked, where the player left off.

import { WORLDS } from '../config/worlds.js';

const KEY = 'supernuno.progress';

function load() {
  try {
    return JSON.parse(localStorage.getItem(KEY)) ?? {};
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

/** Dev helper for demos (Phase 7 formalizes it): unlock everything. */
export function unlockAll() {
  const completed = {};
  for (const world of Object.values(WORLDS)) {
    for (const id of world.levels) completed[id] = true;
  }
  const p = load();
  p.completed = completed;
  save(p);
}
