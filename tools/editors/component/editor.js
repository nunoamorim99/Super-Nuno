// Super Nuno component editor (dev only — never in the public build).
//
// A pixel editor is three things: an array of frames (each a flat array of
// hex-colour-or-null pixels), a canvas that draws the current frame at a
// zoom, and mouse handlers that write pixels. Everything else — palette,
// onion skin, playback, import/export — hangs off that core.
//
// Scope is HARD-CAPPED by ASSET-WORKFLOW.md §6: no layers, no tilemap
// mode, no pro features. The discipline is the feature.

// ---------------------------------------------------------------- state
let SIZE = 24; // frame is SIZE×SIZE pixels (24 characters, 18 tiles)
let ZOOM = 20; // screen pixels per art pixel

let frames = [blankFrame()]; // each: Array(SIZE*SIZE) of '#rrggbb' | null
let current = 0; // index of the frame being edited
let tool = 'pencil';
let color = '#3e7d2c';
let undoStack = []; // snapshots of (frameIndex, pixels) — max 50
let playing = null; // interval id while previewing

// Kenney-ish starter palette; imported colours get appended (deduped).
let palette = [
  null, // transparent (the eraser colour)
  '#000000', '#ffffff', '#9badb7', '#595652',
  '#3e7d2c', '#6abe30', '#99e550', '#d9f0ae',
  '#306082', '#5b6ee1', '#639bff', '#8ecbff',
  '#ac3232', '#d95763', '#df7126', '#ffb347',
  '#fbf236', '#ffe066', '#8f563b', '#663931',
  '#76428a', '#d77bba', '#eec39a', '#dff6f5',
];

const $ = (id) => document.getElementById(id);
const canvas = $('canvas');
const ctx = canvas.getContext('2d');

function blankFrame() {
  return Array(SIZE * SIZE).fill(null);
}

// ---------------------------------------------------------------- undo
function pushUndo() {
  undoStack.push({ index: current, pixels: [...frames[current]] });
  if (undoStack.length > 50) undoStack.shift();
}

function undo() {
  const snap = undoStack.pop();
  if (!snap || !frames[snap.index]) return;
  frames[snap.index] = snap.pixels;
  current = snap.index;
  renderAll();
}

// ---------------------------------------------------------------- canvas
function resizeCanvas() {
  ZOOM = SIZE === 24 ? 20 : 26; // both land near a 480px canvas
  canvas.width = SIZE * ZOOM;
  canvas.height = SIZE * ZOOM;
  $('canvas-info').textContent = `${SIZE}×${SIZE}`;
}

function drawCanvas() {
  const px = frames[current];

  // checkerboard = transparency
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      ctx.fillStyle = (x + y) % 2 ? '#26262e' : '#2e2e38';
      ctx.fillRect(x * ZOOM, y * ZOOM, ZOOM, ZOOM);
    }
  }

  // onion skin: the PREVIOUS frame as a ghost, to line up motion
  if ($('onion-toggle').checked && current > 0) {
    ctx.globalAlpha = 0.3;
    paintPixels(frames[current - 1]);
    ctx.globalAlpha = 1;
  }

  paintPixels(px);

  if ($('grid-toggle').checked) {
    ctx.strokeStyle = 'rgba(255,255,255,0.08)';
    for (let i = 0; i <= SIZE; i++) {
      ctx.beginPath();
      ctx.moveTo(i * ZOOM, 0); ctx.lineTo(i * ZOOM, SIZE * ZOOM);
      ctx.moveTo(0, i * ZOOM); ctx.lineTo(SIZE * ZOOM, i * ZOOM);
      ctx.stroke();
    }
  }
}

function paintPixels(px) {
  for (let i = 0; i < px.length; i++) {
    if (!px[i]) continue;
    ctx.fillStyle = px[i];
    ctx.fillRect((i % SIZE) * ZOOM, Math.floor(i / SIZE) * ZOOM, ZOOM, ZOOM);
  }
}

// -------------------------------------------------------------- drawing
function cellFromEvent(e) {
  const r = canvas.getBoundingClientRect();
  const x = Math.floor((e.clientX - r.left) / ZOOM);
  const y = Math.floor((e.clientY - r.top) / ZOOM);
  if (x < 0 || y < 0 || x >= SIZE || y >= SIZE) return null;
  return y * SIZE + x;
}

function applyTool(i) {
  const px = frames[current];
  if (tool === 'pencil') px[i] = color;
  else if (tool === 'eraser') px[i] = null;
  else if (tool === 'eyedropper') {
    if (px[i]) setColor(px[i]);
    setTool('pencil'); // picked — straight back to drawing
    return;
  } else if (tool === 'fill') {
    floodFill(px, i, px[i], color);
  }
  drawCanvas();
}

/** Classic BFS flood fill: repaint the connected region of `from`. */
function floodFill(px, start, from, to) {
  if (from === to) return;
  const queue = [start];
  const seen = new Set(queue);
  while (queue.length) {
    const i = queue.pop();
    if (px[i] !== from) continue;
    px[i] = to;
    const x = i % SIZE, y = Math.floor(i / SIZE);
    for (const [nx, ny] of [[x - 1, y], [x + 1, y], [x, y - 1], [x, y + 1]]) {
      const n = ny * SIZE + nx;
      if (nx >= 0 && nx < SIZE && ny >= 0 && ny < SIZE && !seen.has(n)) {
        seen.add(n);
        queue.push(n);
      }
    }
  }
}

let drawing = false;
canvas.addEventListener('mousedown', (e) => {
  const i = cellFromEvent(e);
  if (i === null) return;
  pushUndo();
  drawing = tool === 'pencil' || tool === 'eraser'; // drag-paint only these
  applyTool(i);
  renderFrames();
});
canvas.addEventListener('mousemove', (e) => {
  if (!drawing) return;
  const i = cellFromEvent(e);
  if (i !== null) applyTool(i);
});
window.addEventListener('mouseup', () => {
  if (drawing) renderFrames();
  drawing = false;
});

// ---------------------------------------------------------------- tools
function setTool(t) {
  tool = t;
  for (const name of ['pencil', 'eraser', 'fill', 'eyedropper']) {
    $(`tool-${name}`).classList.toggle('active', name === t);
  }
}
$('tool-pencil').onclick = () => setTool('pencil');
$('tool-eraser').onclick = () => setTool('eraser');
$('tool-fill').onclick = () => setTool('fill');
$('tool-eyedropper').onclick = () => setTool('eyedropper');
$('undo').onclick = undo;

window.addEventListener('keydown', (e) => {
  if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA') return;
  if (e.ctrlKey && e.key.toLowerCase() === 'z') { e.preventDefault(); undo(); }
  else if (e.key.toLowerCase() === 'b') setTool('pencil');
  else if (e.key.toLowerCase() === 'e') setTool('eraser');
  else if (e.key.toLowerCase() === 'g') setTool('fill');
  else if (e.key.toLowerCase() === 'i') setTool('eyedropper');
});

// -------------------------------------------------------------- palette
function setColor(c) {
  color = c;
  renderPalette();
}

function renderPalette() {
  const box = $('swatches');
  box.innerHTML = '';
  for (const c of palette) {
    const el = document.createElement('div');
    el.className = 'swatch' + (c === null ? ' transparent' : '') +
      (c === color || (c === null && tool === 'eraser') ? ' selected' : '');
    if (c) el.style.background = c;
    el.title = c ?? 'transparent (eraser)';
    el.onclick = () => {
      if (c === null) setTool('eraser');
      else { setColor(c); if (tool === 'eraser') setTool('pencil'); }
    };
    box.appendChild(el);
  }
}

function addPaletteColor(c) {
  c = c.toLowerCase();
  if (!palette.includes(c)) palette.push(c);
}
$('color-add-btn').onclick = () => {
  addPaletteColor($('color-add').value);
  setColor($('color-add').value.toLowerCase());
};

// --------------------------------------------------------------- frames
function renderFrames() {
  const box = $('frames');
  box.innerHTML = '';
  frames.forEach((px, i) => {
    const thumb = document.createElement('canvas');
    thumb.width = SIZE;
    thumb.height = SIZE;
    thumb.style.width = '48px';
    thumb.style.height = '48px';
    thumb.className = 'frame-thumb' + (i === current ? ' current' : '');
    thumb.title = `frame ${i}`;
    const tctx = thumb.getContext('2d');
    px.forEach((c, j) => {
      if (!c) return;
      tctx.fillStyle = c;
      tctx.fillRect(j % SIZE, Math.floor(j / SIZE), 1, 1);
    });
    thumb.onclick = () => { current = i; renderAll(); };
    box.appendChild(thumb);
  });
}

$('frame-add').onclick = () => {
  frames.splice(current + 1, 0, blankFrame());
  current += 1;
  undoStack = [];
  renderAll();
};
$('frame-dup').onclick = () => {
  frames.splice(current + 1, 0, [...frames[current]]);
  current += 1;
  undoStack = [];
  renderAll();
};
$('frame-del').onclick = () => {
  if (frames.length === 1) { frames = [blankFrame()]; }
  else { frames.splice(current, 1); current = Math.min(current, frames.length - 1); }
  undoStack = [];
  renderAll();
};
$('frame-left').onclick = () => moveFrame(-1);
$('frame-right').onclick = () => moveFrame(1);

function moveFrame(dir) {
  const to = current + dir;
  if (to < 0 || to >= frames.length) return;
  [frames[current], frames[to]] = [frames[to], frames[current]];
  current = to;
  renderAll();
}

// ------------------------------------------------------------- playback
$('play').onclick = () => {
  if (playing) {
    clearInterval(playing);
    playing = null;
    $('play').innerHTML = '&#9654; play';
    return;
  }
  let i = 0;
  const pctx = $('preview').getContext('2d');
  pctx.imageSmoothingEnabled = false;
  const tick = () => {
    pctx.clearRect(0, 0, 96, 96);
    const px = frames[i % frames.length];
    const s = 96 / SIZE;
    px.forEach((c, j) => {
      if (!c) return;
      pctx.fillStyle = c;
      pctx.fillRect((j % SIZE) * s, Math.floor(j / SIZE) * s, s, s);
    });
    i++;
  };
  tick();
  playing = setInterval(tick, 1000 / Number($('fps').value || 10));
  $('play').innerHTML = '&#9632; stop';
};

// ------------------------------------------------------------ frame size
$('frame-size').onchange = (e) => {
  const next = Number(e.target.value);
  if (next === SIZE) return;
  if (!confirm(`Switch to ${next}×${next}? Current frames are cleared.`)) {
    e.target.value = String(SIZE);
    return;
  }
  SIZE = next;
  frames = [blankFrame()];
  current = 0;
  undoStack = [];
  resizeCanvas();
  renderAll();
};

// --------------------------------------------------------------- import
$('import-file').onchange = async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  const img = await createImageBitmap(file);
  const cols = Math.floor(img.width / SIZE);
  const rows = Math.floor(img.height / SIZE);
  if (cols === 0 || rows === 0) {
    alert(`Image is smaller than one ${SIZE}×${SIZE} cell. Wrong frame size?`);
    return;
  }

  // read the whole image once, then slice cells out of the pixel buffer
  const off = new OffscreenCanvas(img.width, img.height);
  const octx = off.getContext('2d');
  octx.drawImage(img, 0, 0);
  const data = octx.getImageData(0, 0, img.width, img.height).data;

  const total = cols * rows;
  const from = Math.max(0, Number($('import-from').value) || 0);
  const toRaw = $('import-to').value;
  const to = Math.min(total - 1, toRaw === '' ? total - 1 : Number(toRaw));

  const imported = [];
  for (let cell = from; cell <= to; cell++) {
    const cx = (cell % cols) * SIZE;
    const cy = Math.floor(cell / cols) * SIZE;
    const px = blankFrame();
    for (let y = 0; y < SIZE; y++) {
      for (let x = 0; x < SIZE; x++) {
        const o = ((cy + y) * img.width + cx + x) * 4;
        if (data[o + 3] < 128) continue; // mostly-transparent = empty
        const hex = '#' + [data[o], data[o + 1], data[o + 2]]
          .map((v) => v.toString(16).padStart(2, '0')).join('');
        px[y * SIZE + x] = hex;
        addPaletteColor(hex);
      }
    }
    imported.push(px);
  }

  if (!imported.length) return;
  frames = imported;
  current = 0;
  undoStack = [];
  importedFileName = file.name; // enables "replace imported file" export
  refreshReplaceMode();
  e.target.value = ''; // allow re-importing the same file
  renderAll();
};

// --------------------------------------------------------------- export
// REPLACE MODE: when a PNG was imported, the easiest edit loop is
// "same file, new pixels" — export under the imported name, drop it
// back in its pack folder, reload. NO manifest change needed (the
// manifest maps key→file; the file just has new pixels).
let importedFileName = null;

function replaceMode() {
  return importedFileName && $('exp-replace').checked;
}

function refreshReplaceMode() {
  const row = $('exp-replace-row');
  row.style.display = importedFileName ? '' : 'none';
  $('exp-replace-name').textContent = importedFileName ?? '';
  if (importedFileName) $('exp-replace').checked = true;
  refreshExportFields();
  refreshExport();
}

// The naming contract (ASSET-WORKFLOW.md §3):
//   {category}-{subject}_{state}_{action}
// EXCEPT characters: ONE master sheet per world with the canonical cell
// layout (§3 table). Its file is character-{subject}.png and it always
// occupies the manifest's `nuno` sheet slot — no state/action needed.
// The editor COMPOSES the name — it cannot be hand-typo'd into the game.
const TOKEN = /^[a-z0-9]+(-[a-z0-9]+)*$/; // lowercase, hyphen inside a token

const isCharacter = () => $('exp-category').value === 'character';

function exportStem() {
  const cat = $('exp-category').value;
  const subject = $('exp-subject').value.trim();
  if (!TOKEN.test(subject)) return null;
  if (isCharacter()) return `${cat}-${subject}`;
  const state = $('exp-state').value;
  const action = $('exp-action').value.trim();
  if (action && !TOKEN.test(action)) return null;
  let stem = `${cat}-${subject}`;
  if (state) stem += `_${state}`;
  if (action) stem += `_${action}`;
  return stem;
}

// The editor runs on the SAME dev server as the game, so it can read the
// target pack's real manifest, merge the new entries in, and hand back the
// COMPLETE file — you replace manifest.json wholesale, never hand-merge.
let refreshSeq = 0;
async function refreshExport() {
  const seq = ++refreshSeq;
  const el = $('filename');

  if (replaceMode()) {
    el.classList.remove('invalid');
    el.textContent = `${importedFileName}  (${frames.length} frame${frames.length > 1 ? 's' : ''}, ${SIZE}×${SIZE})`;
    $('manifest-snippet').value =
      `Same file, new pixels — drop ${importedFileName} back into its pack\n` +
      `folder and reload the game. No manifest change needed.`;
    return;
  }

  const stem = exportStem();
  el.classList.toggle('invalid', !stem);
  el.textContent = stem
    ? `${stem}.png  (${frames.length} frame${frames.length > 1 ? 's' : ''}, ${SIZE}×${SIZE})`
    : 'invalid name — subject/action must be lowercase-with-hyphens';

  if (!stem) { $('manifest-snippet').value = ''; return; }

  const pack = $('exp-pack').value;
  let manifest = null;
  try {
    const res = await fetch(`/assets/packs/${pack}/manifest.json`, { cache: 'no-store' });
    if (res.ok) manifest = await res.json();
  } catch { /* dev server unreachable — fall through to a skeleton */ }
  if (seq !== refreshSeq) return; // a newer refresh superseded this one
  if (!manifest) manifest = { pack, sheets: {}, anims: {} };

  if (isCharacter() && pack !== 'common') {
    // Character sheet: swap the file behind the world's `nuno` slot.
    // Anims stay untouched — they already map the canonical cells, and
    // you point an anim at a new cell by editing one number (§3 table).
    manifest.sheets = {
      ...manifest.sheets,
      nuno: { file: `${stem}.png`, frameWidth: SIZE, frameHeight: SIZE },
    };
  } else {
    manifest.sheets = {
      ...manifest.sheets,
      [stem]: { file: `${stem}.png`, frameWidth: SIZE, frameHeight: SIZE },
    };
    manifest.anims = {
      ...manifest.anims,
      [stem]: { sheet: stem, frames: frames.map((_, i) => i), frameRate: 10, repeat: -1 },
    };
  }
  $('manifest-snippet').value = JSON.stringify(manifest, null, 2);
}
['exp-category', 'exp-subject', 'exp-state', 'exp-action', 'exp-pack'].forEach((id) => {
  $(id).addEventListener('input', refreshExport);
});

// state/action only exist for non-character exports; the whole name
// builder disappears in replace mode (the name is already decided)
function refreshExportFields() {
  const replacing = replaceMode();
  const hide = isCharacter();
  $('exp-category').style.display = replacing ? 'none' : '';
  $('exp-subject').style.display = replacing ? 'none' : '';
  $('exp-pack').style.display = replacing ? 'none' : '';
  $('exp-state').style.display = replacing || hide ? 'none' : '';
  $('exp-action').style.display = replacing || hide ? 'none' : '';
}
$('exp-category').addEventListener('input', refreshExportFields);
$('exp-replace')?.addEventListener('input', () => {
  refreshExportFields();
  refreshExport();
});
refreshExportFields();

$('export-btn').onclick = () => {
  const stem = replaceMode() ? importedFileName.replace(/\.png$/i, '') : exportStem();
  if (!stem) { alert('Fix the name first (see the red hint).'); return; }

  // frames side by side, left→right — exactly how the game slices sheets
  const out = document.createElement('canvas');
  out.width = SIZE * frames.length;
  out.height = SIZE;
  const octx = out.getContext('2d');
  frames.forEach((px, f) => {
    px.forEach((c, j) => {
      if (!c) return;
      octx.fillStyle = c;
      octx.fillRect(f * SIZE + (j % SIZE), Math.floor(j / SIZE), 1, 1);
    });
  });

  out.toBlob((blob) => {
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${stem}.png`;
    a.click();
    URL.revokeObjectURL(a.href);
  }, 'image/png');
};

// ----------------------------------------------------------------- boot
function renderAll() {
  drawCanvas();
  renderFrames();
  renderPalette();
  refreshExport();
}
resizeCanvas();
renderAll();
