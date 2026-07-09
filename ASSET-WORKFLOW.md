# Super Nuno — Asset Workflow

How art gets from the **Kenney CC0 pack** to the **running game**. There is no AI
generation and no automated raster pipeline — the flow is **import an existing Kenney
sprite → edit it → export it engine-ready → drop it in the right folder**. This document is
the contract between the component editor, the level editor, and the game loader.

---

## 0. Source: Kenney "Pixel Platformer" (CC0)

- License: **CC0 1.0** — public domain. Edit, rename, recombine, ship (incl. commercial),
  no attribution required. We credit Kenney anyway in `CREDITS.md` (norm + portfolio signal).
- Already vendored in the repo at `public/assets/kenney_pixel-platformer/`. Keep the **raw**
  pack in `art-source/kenney/` as edit reference; it is never loaded by the game.
- Companion packs are fair game (all CC0): **Pixel Platformer Blocks** (80 tiles in 4
  colours incl. white for easy per-world recolouring) and Kenney's CC0 **audio** packs.

---

## 1. Locked sizes & the frame map

Sizes are fixed by AstroHop and must not drift, or placement and collision break.

| Sheet | Frame size | Loaded as | Notes |
|---|---|---|---|
| `tilemap_packed.png` | **18×18** | `tiles` | terrain, blocks, pipes, flag, items |
| `tilemap-characters_packed.png` | **24×24** | `chars` | Nuno + enemies (overhang the 18 grid) |
| `tilemap-backgrounds_packed.png` | **24×24** | `bg` | background elements |

Phaser slices these by `frameWidth/frameHeight` and references frames **by index**,
left→right then top→bottom: `index = row × columns + column`. Sheet geometry:

| Sheet | Image size | Grid | Frames |
|---|---|---|---|
| `tiles` | 360×162 | **20 columns** × 9 rows | 0–179 |
| `chars` | 216×72 | **9 columns** × 3 rows | 0–26 |
| `bg` | 192×72 | **8 columns** × 3 rows | 0–23 |

### Frame map (Phase 1 assessment — every index below is code-verified in-game)

The single source of truth in code is `src/config/worlds.js` (`COMMON.frames`,
`COMMON.anims`, `COMMON.themes`). This table documents it for humans; update BOTH when
mapping a new frame.

**`tiles` (18×18):**

| Frame(s) | What | Used as |
|---|---|---|
| 2 | grass top | overworld `terrainTop` |
| 6 | brick | `B` |
| 10 | `?` block | `?` `M` `S` |
| 31 | used/empty block | opened `?`, hidden `H` |
| 42 | cave floor | underground `terrainTop` |
| 67 | blue gem | recolored → `gem-fire`, `gem-star` |
| 76–79 | floating platform (single/left/mid/right) | `P` runs |
| 81 | snow-capped ground | snow `terrainTop` |
| 86 | sign (right arrow) | decor `>` |
| 111–112 | flag (2 wave frames) | `F` + `flag-wave` |
| 121 | dirt | snow `terrainFill` |
| 122 | dirt | overworld `terrainFill` |
| 124 | sprout | decor `"` |
| 125 | bush | decor `*` |
| 126 | pine tree | decor `^` |
| 128 | red mushroom | grow item (R/G-swapped → 1-UP) |
| 130 / 150 | door top / bottom | `d` (castle door) |
| 131 | pole | flagpole shaft |
| 142 | packed dirt | underground `terrainFill` |
| 145 | snowman | decor `o` |
| 151–152 | coin (face/edge) | `c` + `coin-spin` |
| 153–156 | cloud left/mid/right/small | parallax + title |

**`chars` (24×24)** — row 0 = frames 0–8, row 1 = 9–17, row 2 = 18–26:

| Frame(s) | What | Used as |
|---|---|---|
| 0, 1 | green character (stand, walk) | player SMALL/BIG idle/run/jump |
| 6, 7 | orange character (stand, walk) | player FIRE (palette-swap tradition) |
| 18, 19 | blue slime walk | walker enemy |
| 20 | blue slime squashed | walker stomped |

**`bg` (24×24):** 8–11 = rolling-hills strip (row 1, cols 0–3) → `tex-hills` parallax.

Frames not listed are **unmapped** — Kenney extras available for new components. Pipes,
fireball, and the recolored gems/1-UP are **generated at load time** in `PreloadScene`
(no sheet frames). When the component editor exports something new, it stops being a
frame-map question entirely — the manifest names it.

---

## 2. Pack structure: shared `common` + thin per-world

```
public/assets/packs/
  common/          # ONE shared set, reused by all worlds:
                   #   blocks, ? blocks, bricks, coins, pipes, flag, castle,
                   #   projectile, HUD  → the "game grammar"
  world-1/         # per-world ONLY:
    ...            #   Nuno at this age (SMALL/BIG/POWER, all anims),
                   #   grow item, power item, one enemy re-skin, background,
                   #   palette, finale scenery
  world-2/ ... world-5/
  <pack>/manifest.json
```

Rule of thumb: if it's part of *how the game plays*, it's `common`. If it's part of *whose
life this is* (the character aging, the life-stage items, the finale), it's per-world.
A `WorldConfig` entry points at `common` + its own world pack.

---

## 3. The naming contract (load-bearing)

Exported files are named by the editor, never by hand. The stem **is** the asset key.

```
{enemy|item|tile|prop}-{subject}_{state}_{action}
```
Examples: `item-milk-bottle`, `enemy-windup-toy_walk`. Lowercase, hyphen within a
token, underscore between tokens.

- Animation strips export as one PNG (frames left→right) + the frame data in the manifest.
- A **typo cannot be introduced by hand** — the editor composes the name from
  dropdowns/fields and writes it. That's the whole point.

### Characters are the exception: ONE sheet per world (decided 2026-07-09)

Each world has a single master character sheet — file `character-nuno.png`, always
registered in the manifest under the sheet key **`nuno`** (the key the engine reads).
No state/action in the name; the editor knows this and updates `sheets.nuno.file`
in the manifest for you. Every age uses the SAME canonical cell layout, so code and
manifests transfer across worlds:

| Cell | Pose | Anim entry it feeds |
|---|---|---|
| 0 | idle | `nuno-idle: [0]`, run = `[0, 1]` |
| 1 | run step | `nuno-run: [0, 1]` |
| 2 | jump | `nuno-jump` (once drawn — placeholder art uses `[1]`) |
| 3 | fall | future `nuno-fall` |
| 4 | hurt | future `nuno-hurt` |
| 5 | death | future `nuno-death` |
| 6 | power idle | `nuno-fire-idle: [6]` |
| 7 | power run step | `nuno-fire-run: [6, 7]` |
| 8 | power jump | `nuno-fire-jump` (once drawn — placeholder uses `[7]`) |

The manifest's anim entries are the truth; the table is the convention they follow.
When you draw a pose into a free cell, point that anim's `frames` at the cell —
one number in the manifest. (BIG needs no cells: it's the same art at 1.5× scale;
only the POWER state has its own look, like classic fire Mario.)

---

## 4. Save flow: download → place → reload

A browser page can't write to project folders, so we **don't** auto-save. Instead:

1. Edit in the component editor.
2. **Export** — the editor produces the PNG (+ any frame data) already correctly named.
3. **Nuno drops the file** into the matching `packs/world-N/` (or `common/`) folder.
4. **Reload the game.**

- **Replacing** an existing sprite (same path/name) is fully automatic — the game reloads
  the new pixels under the same key. This is the common case (editing Nuno's frames).
- **Adding a brand-new component** costs exactly **one line** in that pack's
  `manifest.json` (its key + file). That's the only manual seam, and it's the right place
  to think anyway.

---

## 5. The manifest (why the game "just catches" changes)

A browser game can't scan a directory to discover files — it loads a known list. Each pack
has a small `manifest.json`: the sheets it contains, their keys, frame sizes, and animation
frame ranges. `PreloadScene` loads `common`'s manifest + the active world's manifest. So
"the game automatically picks up my edit" means: *same key, new pixels, on reload.*

```jsonc
// packs/world-1/manifest.json  (the real schema since Phase 2)
{
  "pack": "world-1",
  "sheets": {
    // key = the texture key the engine uses; file = relative to this pack folder
    "nuno": { "file": "nuno.png", "frameWidth": 24, "frameHeight": 24 }
  },
  "anims": {
    // key = the animation key; every world maps the SAME keys ("nuno-idle",
    // "nuno-run", ...) onto its own pixels — that's what makes worlds swappable
    "nuno-run": { "sheet": "nuno", "frames": [0, 1], "frameRate": 10, "repeat": -1 }
  }
}
```

A sheet listed in a manifest that fails to load (typo'd filename, missing file) stops the
boot with a full-screen error naming the key and path — verified in Phase 2.

---

## 6. Component editor (dev-only) — scope

Import a Kenney sprite (or any PNG) → edit → export engine-ready. In-repo, **stripped from
the public build**, mouse-first.
- 18×18 grid default; 24×24 for characters. Fixed palette (extendable); imported colours
  auto-added. Pencil, eraser, fill, eyedropper, undo.
- Frames + onion-skin + animation playback (verify the walk cycle before exporting).
- **Import** a PNG onto the grid; a horizontal strip splits into frames automatically.
- **Export**: PNG (+ frame data) with the **contract name baked in**, plus the manifest
  entry to paste. No layers, no tilemap mode, no "pro" features — that discipline is what
  keeps it from becoming the third over-built art system.

Kenney's characters are the base to edit into Nuno; the character is the one real handcraft
job (≈15 sets across 5 ages × 3 states). Everything else is import-and-tweak.

---

## 7. Level editor (dev-only) — scope

WYSIWYG placement on top of AstroHop's existing **ASCII-grid** level format (`src/levels/*`
via `builder.js`) — that format is the level schema; **no LDtk**.
- Enter/exit edit mode; free pan/zoom camera; palette of the world's placeable entities.
- **Place / move / delete + snap-to-grid**; real art + a **collision-box overlay** drawn
  live; jump straight into play to test in place.
- **Serialize the scene → the ASCII-grid format** (download), so an edit becomes a saved
  level that round-trips.
- **Hard scope cap:** no undo/redo, no multi-select, no autotiling, no layers. Mouse/desktop
  only, dev-only, stripped from the public build. Reuses the existing level loader and
  entity creation — it's a thin UI layer, not a new engine.

World 1 is the editor's real-world trial; note what works so we settle editor-only vs.
editor-plus-hand-edited levels.

---

## 8. "Done" checklist for an asset set

- [ ] Correct frame size (18 or 24); reads clearly at gameplay scale on a phone.
- [ ] Named per the contract; stem = asset key; no hand-typed names.
- [ ] Manifest entry present (sheet + anim frame ranges).
- [ ] Collision box unchanged (art fits the fixed body; never resize the body).
- [ ] Loads on reload with no console error; animates with no pivot drift.
