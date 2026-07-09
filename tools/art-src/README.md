# Art source scripts (dev-only)

These PowerShell scripts are the **source code of the hand-drawn sprites** — each
sprite is an ASCII pixel map (one letter per pixel, one letter per palette colour).
Run a script to regenerate its PNGs straight into `public/assets/packs/world-1/`.

| Script | Regenerates |
|---|---|
| `draw-baby-set.ps1` | `character-nuno.png` — baby-Nuno, all 9 canonical cells |
| `draw-w1-set.ps1` | `w1.png` (gift blocks, milk, pacifier, calçada/braga tiles), `w1-enemy.png`, `w1-dog.png`, `w1-skyline.png` |

Two ways to edit world-1 art — both are fine, but **pick one per sprite**:
- **Component editor** (pixel-by-pixel, in the browser): import the PNG, edit,
  export with "replace imported file". The script becomes stale for that sprite.
- **These scripts** (bulk changes, palette swaps, "make X bigger" iterations):
  edit the map or palette, run, done.

Note: palettes are built with `New-Pal` (case-SENSITIVE keys) because PowerShell
hash literals treat 'B' and 'b' as the same key.
