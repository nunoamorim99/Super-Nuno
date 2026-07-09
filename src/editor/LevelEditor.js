// Dev-only WYSIWYG level editor (ROADMAP Phase 5). Press E in a level.
//
// Design: the editor edits THE ASCII GRID, not live objects. Every edit
// changes a character and rebuilds the scene through the existing level
// parser — so what you see is exactly what the game builds, and the
// saved file round-trips by construction.
//
// HARD SCOPE CAP (ASSET-WORKFLOW §7): no undo/redo, no multi-select,
// no autotiling, no layers. Mouse + desktop only. Level width is fixed.
//
// Controls: E toggle · left-drag paint · right-drag pan · wheel zoom.
// This module is only ever imported behind `import.meta.env.DEV`.

import { TILE, GAME_HEIGHT } from '../config/constants.js';

const ROWS = GAME_HEIGHT / TILE;

// Placeable entity types = the level format's legend (LEVELS.md).
const PALETTE = [
  { ch: 'X', name: 'ground' },
  { ch: 'x', name: 'ground decor' },
  { ch: 'P', name: 'platform' },
  { ch: 'B', name: 'brick' },
  { ch: '?', name: '? coin' },
  { ch: 'M', name: '? power-up' },
  { ch: 'S', name: '? star' },
  { ch: 'H', name: 'hidden 1-UP' },
  { ch: 'c', name: 'coin' },
  { ch: 'e', name: 'walker' },
  { ch: 'T', name: 'pipe' },
  { ch: 't', name: 'pipe (secret)' },
  { ch: 'F', name: 'flag' },
  { ch: 'd', name: 'door' },
  { ch: 'p', name: 'spawn' },
  { ch: '>', name: 'sign' },
  { ch: '*', name: 'bush' },
  { ch: '^', name: 'pine' },
  { ch: '"', name: 'sprout' },
  { ch: 'o', name: 'snowman' },
  { ch: ' ', name: 'eraser' },
];

// Editor state lives at module level so it survives the scene rebuilds
// it causes. One editor, one level at a time.
const state = {
  active: false,
  levelId: null,
  grid: null, // array of ROWS char-arrays, full level width
  meta: null, // name/theme/next/secret/time/width from the level def
  selected: 'X',
  cam: null, // {scrollX, scrollY, zoom} preserved across rebuilds
};

let ui = null; // the DOM sidebar (persists across scene restarts)

export function attachEditor(scene) {
  scene.input.keyboard.on('keydown-E', () => {
    if (scene.autoPhase || scene.player.isDead) return;
    state.active ? exitToPlay(scene) : enter(scene);
  });

  // scene was rebuilt by an edit — re-enter editor mode on the new scene
  if (state.active && state.levelId === scene.levelId) {
    enterMode(scene);
  } else if (state.active) {
    // travelled to another level mid-edit (shouldn't happen; be safe)
    state.active = false;
    destroyUI();
  } else if (scene.editorOpen) {
    enter(scene); // the title menu's "Level editor" option
  }

  // QA handle: tools/probes drive the editor through this (dev only)
  window.__editor = { state, serializeText, place: (r, c, ch) => placeCell(scene, r, c, ch, true) };
}

// ------------------------------------------------------------ mode flow

function enter(scene) {
  state.active = true;
  state.levelId = scene.levelId;
  state.meta = scene.level;
  // snapshot the CURRENT grid (includes any prior edits — the scene was
  // built from them)
  state.grid = scene.grid.map((row) => row.split(''));
  state.cam = null;
  enterMode(scene);
}

/** Put an (already active) editor in charge of a freshly built scene. */
function enterMode(scene) {
  scene.editorActive = true;
  scene.physics.world.pause();
  scene.anims.pauseAll();

  const cam = scene.cameras.main;
  cam.stopFollow();
  cam.removeBounds(); // pan past the level edges while editing
  if (state.cam) {
    cam.setScroll(state.cam.scrollX, state.cam.scrollY);
    cam.setZoom(state.cam.zoom);
  }

  drawOverlay(scene);
  buildUI(scene);
  wirePointer(scene);
  wireKeys(scene);
}

/** Walk around the level from the keyboard: arrows/WASD pan the camera
 *  (speed scales with zoom), Home/End jump to the level's start/end. */
function wireKeys(scene) {
  const keys = scene.input.keyboard.addKeys('W,A,S,D,UP,DOWN,LEFT,RIGHT,HOME,END');
  const cam = scene.cameras.main;
  const onUpdate = () => {
    if (!scene.editorActive) return;
    const speed = 14 / cam.zoom;
    if (keys.LEFT.isDown || keys.A.isDown) cam.scrollX -= speed;
    if (keys.RIGHT.isDown || keys.D.isDown) cam.scrollX += speed;
    if (keys.UP.isDown || keys.W.isDown) cam.scrollY -= speed;
    if (keys.DOWN.isDown || keys.S.isDown) cam.scrollY += speed;
    if (keys.HOME.isDown) cam.scrollX = -cam.width / 4;
    if (keys.END.isDown) cam.scrollX = state.meta.width * TILE - cam.width / 2;
  };
  scene.events.on('update', onUpdate);
}

function exitToPlay(scene) {
  state.active = false;
  saveCam(scene);
  destroyUI();
  scene.anims.resumeAll();
  // rebuild clean from the edited grid — physics resumes, player respawns
  scene.scene.restart({ levelId: state.levelId, editorRows: gridRows() });
}

function saveCam(scene) {
  const cam = scene.cameras.main;
  state.cam = { scrollX: cam.scrollX, scrollY: cam.scrollY, zoom: cam.zoom };
}

function gridRows() {
  return state.grid.map((row) => row.join(''));
}

// -------------------------------------------------------------- editing

function placeCell(scene, row, col, ch, rebuild = false) {
  if (row < 0 || row >= ROWS || col < 0 || col >= state.meta.width) return;
  if (ch === 'p') {
    // only one spawn point — placing a new one clears the old
    for (const r of state.grid) {
      for (let i = 0; i < r.length; i++) if (r[i] === 'p') r[i] = ' ';
    }
  }
  state.grid[row][col] = ch;
  if (rebuild) rebuildScene(scene);
}

function rebuildScene(scene) {
  saveCam(scene);
  scene.scene.restart({ levelId: state.levelId, editorRows: gridRows() });
  // attachEditor() on the new scene instance re-enters editor mode
}

function wirePointer(scene) {
  const cam = scene.cameras.main;
  let painting = false;
  let dirty = false;
  let panning = false;
  let last = null;

  scene.input.on('pointerdown', (pointer) => {
    if (pointer.rightButtonDown()) {
      panning = true;
      last = { x: pointer.x, y: pointer.y };
      return;
    }
    painting = true;
    dirty = paintAt(scene, pointer) || dirty;
  });

  scene.input.on('pointermove', (pointer) => {
    if (panning && last) {
      cam.scrollX -= (pointer.x - last.x) / cam.zoom;
      cam.scrollY -= (pointer.y - last.y) / cam.zoom;
      last = { x: pointer.x, y: pointer.y };
      return;
    }
    if (painting) dirty = paintAt(scene, pointer) || dirty;
  });

  const finish = () => {
    panning = false;
    last = null;
    if (painting && dirty) {
      painting = false;
      dirty = false;
      rebuildScene(scene); // one rebuild per stroke, not per cell
      return;
    }
    painting = false;
  };
  scene.input.on('pointerup', finish);
  scene.input.on('pointerupoutside', finish);

  scene.input.on('wheel', (pointer, over, dx, dy) => {
    const zoom = Math.min(3, Math.max(0.3, cam.zoom * (dy > 0 ? 0.9 : 1.1)));
    cam.setZoom(zoom);
    updateStatus(scene);
  });

  // block the browser context menu so right-drag panning works
  scene.game.canvas.oncontextmenu = (e) => e.preventDefault();
}

function paintAt(scene, pointer) {
  const world = scene.cameras.main.getWorldPoint(pointer.x, pointer.y);
  const col = Math.floor(world.x / TILE);
  const row = Math.floor(world.y / TILE);
  if (row < 0 || row >= ROWS || col < 0 || col >= state.meta.width) return false;
  if (state.grid[row][col] === state.selected) return false;
  placeCell(scene, row, col, state.selected);
  return true;
}

// -------------------------------------------------- collision-box overlay

function drawOverlay(scene) {
  const g = scene.add.graphics().setDepth(50);

  // grid lines over the whole level
  g.lineStyle(1, 0xffffff, 0.07);
  const w = state.meta.width * TILE;
  for (let x = 0; x <= w; x += TILE) g.lineBetween(x, 0, x, GAME_HEIGHT);
  for (let y = 0; y <= GAME_HEIGHT; y += TILE) g.lineBetween(0, y, w, y);

  // solid bodies (merged terrain runs, pipes, platforms) — green
  g.lineStyle(1, 0x39d353, 0.8);
  for (const zone of scene.solids) {
    g.strokeRect(zone.x - zone.width / 2, zone.y - zone.height / 2, zone.width, zone.height);
  }
  // blocks — orange
  g.lineStyle(1, 0xffa657, 0.8);
  for (const block of scene.blocks.getChildren()) {
    g.strokeRect(block.x - TILE / 2, block.y - TILE / 2, TILE, TILE);
  }
  // enemies — red
  g.lineStyle(1, 0xff5555, 0.8);
  for (const enemy of scene.enemies.getChildren()) {
    const b = enemy.body;
    g.strokeRect(b.x, b.y, b.width, b.height);
  }
  // player body — blue
  if (scene.player?.body) {
    const b = scene.player.body;
    g.lineStyle(1, 0x58a6ff, 0.9);
    g.strokeRect(b.x, b.y, b.width, b.height);
  }
}

// -------------------------------------------------------------- sidebar

function buildUI(scene) {
  destroyUI();
  ui = document.createElement('div');
  ui.id = 'level-editor-ui';
  ui.style.cssText = `
    position: fixed; top: 0; right: 0; bottom: 0; width: 176px;
    background: #1b1b22ee; color: #cfcfd8; font: 12px monospace;
    padding: 10px; overflow-y: auto; z-index: 30; border-left: 1px solid #3a3a46;
  `;

  const title = document.createElement('div');
  title.innerHTML = `<b style="color:#ffe066">LEVEL EDITOR</b><br>
    <span style="color:#8a8a96">${state.levelId} · ${state.meta.width} cols<br>
    E play · arrows/WASD walk<br>
    Home/End jump · R-drag pan<br>
    wheel zoom</span><br><br>`;
  ui.appendChild(title);

  for (const item of PALETTE) {
    const btn = document.createElement('button');
    btn.textContent = `${item.ch === ' ' ? '␣' : item.ch}  ${item.name}`;
    btn.dataset.ch = item.ch;
    btn.style.cssText = `
      display: block; width: 100%; text-align: left; margin: 2px 0;
      padding: 4px 8px; font: 12px monospace; cursor: pointer;
      background: ${item.ch === state.selected ? '#5c94fc' : '#3c3c46'};
      color: ${item.ch === state.selected ? '#fff' : '#cfcfd8'};
      border: 1px solid #55555f; border-radius: 5px;
    `;
    btn.onclick = () => {
      state.selected = item.ch;
      for (const b of ui.querySelectorAll('button[data-ch]')) {
        const sel = b.dataset.ch === item.ch;
        b.style.background = sel ? '#5c94fc' : '#3c3c46';
        b.style.color = sel ? '#fff' : '#cfcfd8';
      }
    };
    ui.appendChild(btn);
  }

  const save = document.createElement('button');
  save.textContent = '⬇ Save level .js';
  save.style.cssText = `
    display: block; width: 100%; margin: 10px 0 4px; padding: 7px 8px;
    font: bold 12px monospace; cursor: pointer; background: #2ea043;
    color: #fff; border: 1px solid #3fb950; border-radius: 5px;
  `;
  save.onclick = () => downloadLevel();
  ui.appendChild(save);

  const status = document.createElement('div');
  status.id = 'level-editor-status';
  status.style.cssText = 'color:#8a8a96; margin-top:6px;';
  ui.appendChild(status);

  document.body.appendChild(ui);
  updateStatus(scene);
}

function updateStatus(scene) {
  const el = document.getElementById('level-editor-status');
  if (el) el.textContent = `zoom ${scene.cameras.main.zoom.toFixed(2)}×`;
}

function destroyUI() {
  ui?.remove();
  ui = null;
}

// ------------------------------------------------------------ serializer

/** The grid → a level module, same shape as src/levels/*.js.
 *  Rows stay FULL WIDTH (no trailing trim) so a save of an untouched
 *  level is byte-identical to what the game already builds. */
export function serializeText() {
  const meta = state.meta;
  const rows = gridRows();
  while (rows.length && rows[0].trim() === '') rows.shift(); // keep bottom-anchor

  const lines = [
    '// Saved by the Super Nuno level editor.',
    'export default {',
    `  name: '${meta.name}',`,
    `  theme: '${meta.theme}',`,
    `  next: '${meta.next}',`,
  ];
  if (meta.secret) {
    lines.push(`  secret: { room: '${meta.secret.room}', exitCol: ${meta.secret.exitCol} },`);
  }
  if (meta.time) lines.push(`  time: ${meta.time},`);
  lines.push(`  width: ${meta.width},`);
  lines.push('  rows: [');
  for (const r of rows) lines.push(`    ${JSON.stringify(r)},`);
  lines.push('  ],', '};', '');
  return lines.join('\n');
}

function downloadLevel() {
  const blob = new Blob([serializeText()], { type: 'text/javascript' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = `${state.levelId}.js`;
  a.click();
  URL.revokeObjectURL(a.href);
}
