# Super Nuno — Repo Setup & First Prompt

Follow this once to create the new project. After setup, this file can be deleted or kept
as a record — it is not needed by the game or by Claude Code.

---

## 1. Create the new repo, seeded from AstroHop

In PowerShell (Windows):

```powershell
# Clone AstroHop as the seed, detached from its history
git clone https://github.com/nunoamorim99/AstroHop.git super-nuno
cd super-nuno
Remove-Item -Recurse -Force .git
git init
git add -A
git commit -m "Seed from AstroHop engine"
```

Then create an empty **super-nuno** repo on GitHub and connect it:

```powershell
git remote add origin https://github.com/nunoamorim99/super-nuno.git
git branch -M main
git push -u origin main
```

> Why detach the history: this is a brand-new project that *starts from* AstroHop's code.
> A clean history keeps the portfolio story clear; `CREDITS.md` records the lineage.

## 2. Drop in the handoff kit

Copy the contents of this kit into the repo root, preserving structure:

```
super-nuno/
  ROADMAP.md              # the phase plan (source of truth)
  CLAUDE.md               # auto-loaded rules for every Claude Code session
  ASSET-WORKFLOW.md       # the Kenney-edit workflow + naming/manifest contract
  CREDITS.md              # Kenney CC0 + AstroHop lineage
  .claude/
    agents/
      game-engineer.md
      component-artist.md
      level-designer.md
      qa-deploy.md
```

Commit: `git add -A ; git commit -m "Add Super Nuno handoff kit (roadmap, rules, agents)"`

## 3. Place the Kenney packs

- Raw packs (reference, never loaded): download from kenney.nl and unzip into
  **`art-source/kenney/`**. Add more CC0 packs here as needed (Pixel Platformer Blocks,
  audio packs).
- The game already has the Pixel Platformer vendored at
  `public/assets/kenney_pixel-platformer/` from AstroHop — leave it; Phase 2 restructures
  loading into `public/assets/packs/{common,world-1..world-5}/`.

## 4. Verify it still runs before any changes

```powershell
npm.cmd install
npm.cmd run dev
```

The AstroHop game should play in the browser. (If PowerShell blocks npm scripts:
`Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned` once.)

## 5. Open Claude Code and start Phase 0

From the repo root, run `claude` and paste the initial prompt below.

---

## THE INITIAL PROMPT (paste into Claude Code)

```
Read ROADMAP.md, CLAUDE.md, and ASSET-WORKFLOW.md in full before doing anything.

This project evolves the AstroHop engine (already in this repo) into Super Nuno, an
autobiographical Mario-style platformer where the character ages across five worlds.
We do NOT rewrite from scratch and we do NOT change the stack (Phaser 3 + JavaScript +
Vite). The foundation numbers, the fixed collision boxes, and the "no AI art — Kenney
CC0 edited only" rule in CLAUDE.md are locked.

Execute Phase 0 from ROADMAP.md: fork/rebrand (AstroHop → Super Nuno in package.json,
title, README), confirm dev/build/deploy still work, create the art-source/ and
public/assets/packs/ folder structure, and verify CREDITS.md is in place.

Work in small testable increments and explain your decisions and reasoning as you go —
I am learning game development through this project. Stop at the Phase 0 Test gate and
walk me through verifying each item (including the real-phone check) before committing
and tagging phase-0. Do not start Phase 1.
```

## Per-phase prompt pattern (every later session)

```
Read ROADMAP.md and CLAUDE.md. We completed phase N-1 (tagged). Execute Phase N.
Explain decisions as you go. Stop at the Test gate and walk me through verification
before committing and tagging phase-N.
```

Tips:
- **One phase per session.** If a session drifts past its gate, stop and start fresh.
- Delegate to the agents when useful: e.g. "use the level-designer agent to author 1-1"
  or "use qa-deploy to run the Phase 2 gate."
- The phone check matters — use the GitHub Pages preview URL from the deploy workflow.
