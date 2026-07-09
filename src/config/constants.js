// Foundation numbers — LOCKED (see ROADMAP.md "Foundation numbers").
// These are the contract the whole game is tuned around. Changing any of
// them after levels exist breaks placement, collision, or the feel that
// already plays right — so they live here, in ONE place, and every module
// imports them instead of keeping its own copy.

// ---- Grid & frames ----
export const TILE = 18; // the world grid unit ('tiles' sheet frame size)
export const CHAR_FRAME = 24; // character + background sheet frame size

// ---- Internal resolution (logical pixels; Scale.FIT stretches to the screen) ----
export const GAME_WIDTH = 800; // landscape / desktop
export const PORTRAIT_WIDTH = 540; // touch portrait: narrower view = bigger pixels
export const GAME_HEIGHT = 450;

// ---- Physics ----
export const GRAVITY_Y = 1000; // world gravity
export const EXTRA_FALL_GRAVITY = 900; // added while falling — snappy descents

// ---- Player feel (the tuned interplay — never retune piecemeal) ----
export const ACCELERATION = 1600;
export const DRAG = 1300;
export const MAX_RUN_SPEED = 240;
export const MAX_FALL_SPEED = 900;
export const JUMP_VELOCITY = -480;
export const JUMP_CUT_VELOCITY = -160; // release jump early = shorter hop

// ---- Collision boxes (FIXED for every age of Nuno — art changes, boxes don't) ----
export const PLAYER_BODY = {
  SMALL: { width: 16, height: 20 },
  BIG: { width: 16, height: 30 }, // BIG and POWER share the same box
};
export const BIG_SCALE = 1.5; // visual scale when BIG/POWER (~2 tiles tall)
export const ENEMY_BODY = { width: 16, height: 14, offsetX: 4, offsetY: 10 };

// ---- Timings ----
export const STAR_DURATION = 8000;
export const HURT_INVULN_DURATION = 2000;
export const ENEMY_WALK_SPEED = 40;
export const ICE_DRAG_FACTOR = 0.3; // icy themes: drag × 0.3 = the classic slide
