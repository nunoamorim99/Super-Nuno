# Super Nuno — Project Instructions

An autobiographical Mario-style 2D platformer. Original IP. Five worlds = five life
stages; Nuno grows **baby → kid → teen → adult → love** as you progress. Desktop + mobile
from one URL, shipped static.

**This project evolves [AstroHop](https://github.com/nunoamorim99/AstroHop)** — a working
Phaser 3 platformer — into Super Nuno. We keep its proven engine and feel and add the story
layer on top. We do **not** rewrite from scratch, and we do **not** change the stack.

## Stack (fixed)
- **Phaser 3 (`^3.90`) + JavaScript + Vite (`^7`)**, relative base path (`base: './'`).
- Deploy: **GitHub Pages** via the existing `.github/workflows/deploy.yml`.
- Windows dev machine (PowerShell): use **`npm.cmd` / `npx.cmd`**, or set once:
  `Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`.

## Source of truth
- **`ROADMAP.md`** — the phase plan. Work **one phase per session**. Read it at the start
  of every session for the current phase, its brief, and its Test gate.
- **`ASSET-WORKFLOW.md`** — the Kenney-edit → export → place workflow, the naming contract,
  the manifest rule, pack structure, the frame map, and the two editors' scope.

## Hard rules (never violate)
- **Do not start the next phase** until the current phase's Test gate passes on desktop
  **and a real phone** (where the gate calls for it). Commit and tag `phase-N` at the end.
- **No AI-generated art, ever.** All art is Kenney CC0, edited. No Higgsfield, no SVG
  generator (both earlier attempts are dead). Backgrounds are composed from edited Kenney
  tiles, not painted.
- **Nuno's collision box is FIXED** at SMALL 16×20 / BIG 16×30 for **every age**. Age
  changes only the art inside those boxes. Never resize the body per world.
- **Foundation numbers are LOCKED** (tile 18, char frame 24×24, resolution 800×450 /
  540×450, gravity 1000, and the feel constants — see `ROADMAP.md`). Do not change them
  after any level exists.
- **Reduced per-world variation:** only the aging character and the finale scenes change
  per world in v1. Enemies, coins, blocks, and items are the shared `common` set.
- **Collision stays decoupled from art** (`Player.syncBodyToScale()` pattern). **Gameplay
  never reads a raw key** — it reads the merged input intent. **Levels stay data** in the
  ASCII-grid format. Keep these invariants when evolving.
- **The two editors are dev-only** and must be stripped from the public build. Level editor
  scope is hard-capped: no undo/redo, multi-select, autotiling, or layers.
- **Never hand-name exported sprites.** The component editor bakes the correct filename per
  the naming contract; a wrong name loads a black square.
- **The game loads from a manifest, not a folder scan.** Replacing a sprite at the same
  path is automatic on reload; a brand-new component costs one manifest line.

## Workflow
- Small, testable increments matching the current phase. **Explain decisions and reasoning
  as you go** — Nuno is learning game development through this build.
- Reuse AstroHop's existing systems (feel, state machine, enemy AI, input, levels, scenes,
  deploy). Transform them; don't re-create them.
- After each phase, satisfy that phase's Test gate, then commit and tag.

## Repo layout
```
art-source/kenney/              # raw Kenney packs — reference only, never loaded
public/assets/packs/
  common/                       # shared game grammar (blocks, coins, pipes, flag, ...)
  world-1/ ... world-5/         # per-world: aging Nuno, finale scenery, palette
  <pack>/manifest.json          # what the game loads
src/                            # AstroHop engine, evolving
  config/                       # locked numbers + WorldConfig registry
  objects/  scenes/  levels/  input/  audio/
tools/editors/                  # dev-only component + level editors (stripped from build)
```
