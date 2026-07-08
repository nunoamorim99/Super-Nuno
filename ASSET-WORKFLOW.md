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

Phaser slices these by `frameWidth/frameHeight` and references frames **by index**. The
game therefore depends on knowing which index is what. **Assessment task (Phase 1):**
complete and record the frame map. Known from AstroHop:
- `tiles`: grass top `2`, dirt fill `122`, cave floor `42`, packed dirt `142`,
  snow top `81`.
- `chars`: player base `0`; walker walk `18`,`19`; walker squashed `20`.

Record the rest (coins, `?` block, brick, pipe, flag, castle, items) here as it's mapped.

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
{character|enemy|item|tile|prop}-{subject}_{state}_{action}
```
Examples: `nuno-baby_small_idle`, `nuno-baby_big_run`, `nuno-baby_power_throw`,
`item-milk-bottle`, `enemy-windup-toy_walk`. Lowercase, hyphen within a token, underscore
between tokens. Character `state` ∈ `small | big | power`.

- Animation strips export as one PNG (frames left→right) + the frame data in the manifest.
- A **typo cannot be introduced by hand** — the editor composes the name from
  dropdowns/fields and writes it. That's the whole point.

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
// packs/world-1/manifest.json  (shape, illustrative)
{
  "world": 1,
  "sheets": {
    "nuno-baby": { "file": "nuno-baby.png", "frameWidth": 24, "frameHeight": 24 }
  },
  "anims": {
    "nuno-baby_small_run": { "sheet": "nuno-baby", "frames": [0,1,2,3], "frameRate": 12, "repeat": -1 }
  }
}
```

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
