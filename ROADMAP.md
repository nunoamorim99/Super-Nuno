# Super Nuno — Build Roadmap (evolve-from-AstroHop)

An autobiographical Mario-style 2D platformer. Original IP. Five worlds = five life
stages; the character **grows baby → kid → teen → adult → love** as you progress.
Playable on desktop and mobile from one URL, shipped as a static bundle.

**This project is not a from-scratch build.** It starts from a *fresh repo seeded with
[AstroHop](https://github.com/nunoamorim99/AstroHop)* — a working Phaser 3 platformer
whose feel, physics, power-up state machine, enemy AI, touch controls, data-driven
levels, and deploy already work and are already tuned to values Nuno likes. We **keep the
engine and evolve it into Super Nuno**, adding the story layer on top. Every phase below
is a transformation of that base, not a re-implementation of it.

We work **one phase per session**, in small testable increments, and **commit + tag after
every phase**. Each phase has a goal, a brief, and a "test before moving on" gate — on
desktop **and a real phone** where relevant. Do not start the next phase until the gate
passes.

---

## Why we evolve instead of rewrite (context, so the decision isn't re-litigated)

- The **feel** Nuno wants is not just the constants — it's the tuned interplay of
  acceleration, drag, jump-cut, extra-fall-gravity, and squash/stretch already in
  `src/objects/Player.js`. Keeping the code keeps the feel exactly; copying numbers into a
  new framework risks losing it.
- The two original reasons to move to Phaser 4 + TypeScript have **evaporated**: Phaser 4
  was for high-res illustrated art's GPU cost (we now use low-res Kenney pixel art, which
  Phaser 3 runs trivially), and TypeScript was to catch asset-key typos from the old AI
  pipeline (a small manifest makes that a non-issue). So we stay **Phaser 3 + JavaScript +
  Vite**, AstroHop's stack.
- The goal is **telling Nuno's story**, not building engine tech. Effort goes to the five
  Nunos, the worlds, and the finale scenes.

---

## Locked decisions

1. **Stack:** Phaser 3 (`^3.90`) + JavaScript + Vite (`^7`), inherited from AstroHop.
   Relative base path (`base: './'`). Deploy: **GitHub Pages** (AstroHop's existing
   `.github/workflows/deploy.yml` already works) — keep it.
2. **All art is Kenney CC0, edited.** We **do not** generate any art with AI (no
   Higgsfield, no SVG generator — both earlier attempts are abandoned). The base is the
   **Kenney "Pixel Platformer"** pack (CC0, 18×18 tiles) already vendored in AstroHop at
   `public/assets/kenney_pixel-platformer/`. New/edited sprites come from the **component
   editor** (Phase 4), which imports a Kenney sprite, lets Nuno edit it, and exports it
   engine-ready. See `ASSET-WORKFLOW.md`.
3. **Reduced per-world variation (the rework-killer).** For v1, the ONLY thing that truly
   changes per world is **the aging Nuno character** and **the finale scenes**. Enemies,
   coins, blocks, items, and the whole "game grammar" are a **shared `common` set** reused
   across all five worlds. (Palette re-theming of shared tiles per world is a cheap later
   lever, not a v1 requirement.)
4. **Shared collision size across all ages.** Nuno's collision box is **fixed** at the two
   proven sizes (SMALL 16×20, BIG 16×30) for *every* age. Age changes **only the art**
   inside those boxes. This keeps physics, jump distances, and level geometry identical
   across all worlds — levels and feel transfer everywhere.
5. **Two dev-only editors, built on what exists.** A **component editor** (pixel
   import/edit/export) and a **level editor** (WYSIWYG placement that reads/writes
   AstroHop's existing ASCII-grid level format). Both are **stripped from the public
   build** (mouse-only dev tools). No LDtk — the ASCII-grid format is our level schema.
6. **Save is local.** Typed `SaveData` in `localStorage`: unlock state, completion, high
   scores, scoreboard. Per-device, per-browser (fine for a portfolio piece). No backend.
7. **Build one age fully, then repeat.** Baby-Nuno complete (all states + animations)
   before starting kid — proving the whole loop on one age, then reusing the method four
   more times.

---

## Foundation numbers — LOCKED (extracted from AstroHop, already feel good)

These are frozen before any level is authored. Changing them after content exists is
expensive, so they are the contract.

| Foundation | Value | Source in AstroHop |
|---|---|---|
| Tile unit | **18 px** | `PreloadScene` `tiles` frame 18×18 |
| Character frame | **24×24** · background frame 24×24 | `PreloadScene` `chars`/`bg` |
| Internal resolution | **800×450** landscape · **540×450** portrait (touch) | `src/main.js` |
| Scaling | `Scale.FIT`, center both, `pixelArt: true` (nearest-neighbour) | `src/main.js` |
| World gravity | **1000** (+900 extra while falling) | `main.js` / `Player.js` |
| Player collision box | **SMALL 16×20 · BIG/POWER 16×30**, feet-anchored | `Player.syncBodyToScale()` |
| Big scale | **1.5×** | `Player.BIG_SCALE` |
| Enemy collision box | **16×14** (offset 4,10) | `Walker.js` |
| Feel | accel **1600** · drag **1300** · max-run **240** · max-fall **900** | `Player.js` |
| Jump | velocity **−480** · jump-cut **−160** (variable height) | `Player.js` |
| Timings | star **8000 ms** · hurt-invuln **2000 ms** · enemy walk **40** · ice drag ×**0.3** | `Player.js` / `Walker.js` / `THEMES` |

---

## Architectural principles (honored in EVERY phase)

Most of these AstroHop already satisfies; the job is to make them explicit and
world-aware.

- **Data-driven worlds.** A `WorldConfig` registry holds each world's character-age pack,
  palette, enemy roster, item keys, background, audio, and finale scenes. AstroHop's
  `THEMES` object is the seed of this — generalize it. Adding a world = a config entry +
  its pack, never engine surgery.
- **Shared where structural, distinct where it carries meaning.** The `common` game
  grammar (blocks, `?` blocks, bricks, coins, pipes, flag, castle, projectile, HUD) is one
  set. The per-world set is the aging Nuno, the finale scenes, and (optionally) palette.
- **Collision decoupled from art.** Already true via `Player.syncBodyToScale()` — the body
  is fixed in unscaled pixels and re-derived from state, never from the displayed frame.
  Every new age inherits this untouched.
- **Source-agnostic input.** Already true — keyboard and on-screen touch are merged into
  one intent object (`{left, right, jumpHeld, jumpPressed}`) passed to
  `Player.handleInput()`. Gameplay never reads a raw key. Keep this contract.
- **Levels are data.** The ASCII-grid format (`src/levels/*.js` via `builder.js`) is the
  schema. The level editor reads and writes it. It round-trips: grid → scene → grid.
- **Audio is data.** Per-world music/SFX keys live in `WorldConfig`. SFX from Kenney CC0
  audio packs (consistent, license-clean). Music per world is optional for v1.
- **Typed content by manifest, not by TS.** Each world's pack ships a small manifest
  listing its sheets and keys; the game loads from the manifest. A wrong filename fails
  loudly and locally, not as a silent black square.

---

## Phases

### Phase 0 — Fork, rebrand & prove the pipeline still runs
**Goal:** A fresh Super Nuno repo that is AstroHop, renamed, still building and deploying.
**Brief:** New repo seeded from AstroHop. Rename Astro Hop → Super Nuno (package.json,
title, README). Confirm `npm run dev`, `npm run build`, and the GitHub Pages deploy all
still work. Add `CREDITS.md` (Kenney CC0, plus AstroHop's own MIT lineage). Establish the
folder structure: `art-source/kenney/` (raw pack, reference, never loaded) and
`public/assets/packs/{common,world-1..world-5}/`. Add `CLAUDE.md` and this `ROADMAP.md`.
**Test gate:**
- [ ] Dev server runs; the (still-AstroHop) game plays on desktop and a **real phone**.
- [ ] Production build deploys to the GitHub Pages preview URL; loads on a real phone.
- [ ] Folder structure + `CREDITS.md` + docs committed and tagged `phase-0`.

### Phase 1 — WorldConfig spine + Kenney frame-map assessment
**Goal:** Turn AstroHop's single-theme setup into a data-driven, per-world registry.
**Brief:** Consolidate the scattered tuning constants into one `config` module (the locked
numbers above). Generalize `THEMES` into a `WorldConfig` registry keyed by world, each
entry pointing at asset keys, palette, roster, audio, and finale scenes; a `common` entry
holds the shared game grammar. Refactor the scenes to read the active world's config
instead of hardcoded frames. **Assessment task:** document the Kenney frame map (which
frame index in `tiles`/`chars`/`bg` is what) — AstroHop already knows several
(`terrainTop: 2`, `terrainFill: 122`, walker frames 18–20); complete and record the rest
in `ASSET-WORKFLOW.md` so sizes/indexes are never guessed.
**Test gate:**
- [ ] All tuning lives in one config; the game still feels identical (regression check).
- [ ] A world's tiles/enemy/palette resolve via `WorldConfig`, not hardcoded frame ints.
- [ ] Kenney frame map documented. Tagged `phase-1`.

### Phase 2 — `common` + per-world pack loading
**Goal:** Realize the shared-common / thin-per-world split at load time.
**Brief:** Split assets into `packs/common/` (shared grammar) and `packs/world-N/`
(per-world). Update `PreloadScene` to load `common` + the active world's pack + its
manifest. Prove worlds are swappable by flipping the active world and seeing terrain,
palette, and character source change with no code edit.
**Test gate:**
- [ ] Game loads `common` + one world pack via manifest; wrong filename fails loudly.
- [ ] Switching the active world swaps its assets with zero code change.
- [ ] Tagged `phase-2`.

> **Order note (2026-07-09):** Phases 3 and 4 are executed in REVERSE order, by
> decision — Nuno wants every frame of art authored with the project's own component
> editor, never an external one. So the editor (Phase 4) is built first, and baby-Nuno
> (Phase 3) is then drawn IN it — which also replaces Phase 4's "re-import trial".
> Phase numbering and tags keep their original names.

### Phase 3 — Baby-Nuno: the first aging character
**Goal:** The story character appears, at the locked shared collision size.
**Brief:** Produce **baby-Nuno's full set** — idle, run, jump, fall, hurt, death, in SMALL
and BIG — by editing Kenney characters (hand work; the component editor lands next phase,
so this first set may be edited in Aseprite/Piskel to unblock, then re-imported later).
Wire the character to load from `world-1`'s pack. Confirm the fixed 16×20 / 16×30 boxes
hold and the feel is unchanged. Baby only.
**Test gate:**
- [ ] Baby-Nuno animates through all states in-engine, art-correct, no pivot drift.
- [ ] Collision box identical to AstroHop's proven values; feel unchanged.
- [ ] Tagged `phase-3`.

### Phase 4 — Component editor (dev-only)
**Goal:** The import → edit → export pixel tool, integrated and enforcing the contract.
**Brief:** An in-repo, **dev-only** pixel editor: 18×18 grid default (24×24 for
characters), palette, pencil/eraser/fill/eyedropper/undo, frames + onion-skin + playback,
**import a Kenney PNG to edit**, and **export a correctly-named sheet + manifest entry**
(the naming contract in `ASSET-WORKFLOW.md`). Save flow: **download, then Nuno drops the
file into the matching `packs/world-N/` folder**; reload picks it up (replacements are
automatic; new components add one manifest line). Stripped from the public build.
**Test gate:**
- [ ] Import a Kenney sprite, edit, export with a correct filename; game loads it on reload.
- [ ] Editor absent from the production build.
- [ ] Re-import baby-Nuno's frames through it (its trial). Tagged `phase-4`.

### Phase 5 — Level editor (dev-only)
**Goal:** WYSIWYG level authoring on top of the existing ASCII-grid format.
**Brief:** An in-game **dev-only** edit mode: pause, free pan/zoom camera, a palette of the
world's placeable entity types, click/drag **place/move/delete + snap**, **real art + a
collision-box overlay** live, and **serialize the scene → the ASCII-grid level format**
(download). Jump from edit mode straight into play. **Hard scope cap:** no undo/redo,
multi-select, autotiling, or layers. Mouse/desktop only. Reuses the existing level loader
and entity creation.
**Test gate:**
- [ ] Enter/exit edit mode; place, move, delete, snap every current entity type.
- [ ] Serialize → reload reproduces the same level (round-trips the ASCII format).
- [ ] Editor absent from the production build. Tagged `phase-5`.

### Phase 6 — Menu, world select & flow
**Goal:** The six-option shell that frames the whole game.
**Brief:** New title menu: **New game · Continue · Select level · Level editor · Component
editor · Scoreboard**. A **world-select map** showing Nuno's portrait at each age; a
**per-world level select**. The two editors are gated behind a **dev flag** (hidden from
the public/portfolio build). Wire title → world select → level → complete → next.
**Test gate:**
- [ ] All six options wired; editors hidden when the dev flag is off.
- [ ] World/level select reflect unlock state; flow runs end to end. Tagged `phase-6`.

### Phase 7 — Save system & scoreboard
**Goal:** Continue, level select, and scores that persist.
**Brief:** Typed `SaveData` in `localStorage`: unlocked worlds/levels, completion, per-level
and total high scores. **Continue** resumes; **Select level** offers unlocked levels; the
**Scoreboard** shows local high scores. A dev "unlock all" so the portfolio piece is always
demoable. AstroHop's existing `highscore.js` is the starting point.
**Test gate:**
- [ ] Progress, unlocks, and scores persist across reloads; dev unlock-all works.
- [ ] Tagged `phase-7`.

### Phase 8 — Finale decorated zones (the autobiography)
**Goal:** The post-flag scenes where the story is actually told.
**Brief:** A finale-scene hook after the flag (themed scenery, no new core logic):
**First Dog, Futbol Champion, The Request, The Future Home, One Year**. Decide the
storytelling mode — visual-only vs. text cards — and if text, the language(s) (PT/EN);
add a Kenney CC0 bitmap font if cards are used. These scenes are the one place per-world
bespoke art is worth it.
**Test gate:**
- [ ] Finale hook plays after the flag with placeholder scenery; text/language decided.
- [ ] Tagged `phase-8`.

### Phase 9 — World 1 full build (vertical slice = v1)
**Goal:** Ship-quality baby world, authored with the new editors.
**Brief:** Build **1-1 Lisbon** and **1-2 Braga** end to end: calçada/azulejo tiles and
skylines **composed from edited Kenney tiles** (Ponte 25 de Abril / Torre de Belém
silhouettes built from tiles — no AI backgrounds), milk-bottle grow item and pacifier
power, the wind-up-toy enemy (a re-skinned shared walker), gift-box `?` blocks, paced
design, secrets, full flow, Kenney CC0 SFX/music, and baby-Nuno's finale ("First Dog").
Author the levels with the Phase 5 editor.
**Test gate:**
- [ ] 1-1 and 1-2 playable start → flag → castle on desktop and phone; secrets present.
- [ ] No placeholder art remains in World 1; performance smooth on a mid-range phone.
- [ ] Tagged `phase-9` — **this is v1.**

### Phase 10 — Ages 2→5 rollout (mostly content)
**Goal:** Kid, teen, adult, love — the same method repeated.
**Brief:** Per world: edit the Kenney base into that age of Nuno (SMALL/BIG/POWER, all
anims), set the world's palette, re-skin the shared enemy, compose backgrounds from tiles,
add the grow/power items, author levels in the editor, add the finale scene (Futbol
Champion / The Request / The Future Home / One Year), and add music/SFX config. Expect
**no engine changes** — if one is needed, that's a signal to fix the config seam instead.
**Test gate (per world):**
- [ ] World playable end to end on desktop + phone; finale plays; unlocks correctly.
- [ ] Added via config + pack only. Tagged `world-N`.

### Phase 11 — Polish, performance budget & portfolio deploy
**Goal:** Public-ready.
**Brief:** Performance budget (sheet sizes, draw calls, load time on mid-range mobile),
loading screen, accessibility pass, dev-editor strip verified, final deploy to the
portfolio URL. `CREDITS.md` complete.
**Test gate:**
- [ ] Meets perf budget on mid-range mobile; editors absent from the public build.
- [ ] Live on the portfolio URL; shareable; no console errors. Tagged `v1`.

---

## What AstroHop already gives us (do not rebuild)

Feel/physics (`Player.js`), collision-decoupled-from-art (`syncBodyToScale`),
SMALL→BIG→FIRE + Star state machine, patrol/edge-detecting enemy (`Walker.js`), merged
keyboard+touch input, responsive portrait/landscape, ASCII-grid data-driven levels
(`levels/*` + `builder.js`), a theme system (`THEMES`), HUD/Title/Intro/Pause/GameOver/End
scenes, high scores (`highscore.js`), SFX (`audio/sfx.js`), and the Vite + GitHub Pages
deploy. The roadmap **transforms** these into Super Nuno; it does not re-create them.
