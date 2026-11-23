# /demo/coop improvement loop (Hermes runbook)

How a local agent (Hermes, qwen) improves the Chicken Tender coop 3D demo safely,
one small change per card. Written 2026-11-22.

## What the demo is

- Route: `/demo/coop` (the existing `/demo` stays the public no-signup front door;
  it now links to `/demo/coop` from its use-case cards, and the side menu has "Coop 3D Demo").
- App root: `applications/tendercells_ui/test_output/tendercells-ui` (Vite + React 18 + MUI + three).
  Call it `APP` below. There is no other live app copy; ignore the other `test_output/*` folders.
- Files:
  - `APP/src/pages/CoopDemoPage.tsx` - page, three.js viewer, tier switch, view presets, door controls, simulated E-STOP. Lazy-loaded from `APP/src/routes/AppRoutes.tsx`.
  - `APP/src/lib/coop/doorKinematics.ts` - pure door math (travel 0-280 mm, m1.25 z18 pinion, pitch radius 11.25 mm, angle = travel / 11.25 rad, pivot about the pinion centre, status text, step/E-STOP freeze).
  - `APP/src/__tests__/coop/doorKinematics.test.ts` - unit tests for that math.
  - `APP/tests/ui/coop-demo.spec.ts` - Playwright: every tier renders, door 0/140/280 mm, Open + E-STOP freeze, no console errors.
  - `APP/public/models/chicken-tender/CT_COOP_A_showcase_{base,starter,plus,pro}.glb` - exported from `cad/chicken-tender-coop/reports/glb/` (3.3-6.3 MB, not Draco). The cad `reports/` folder is gitignored, so these copies must exist in APP before anything renders.
- Model facts: root node scale 0.001 (mm -> m) and -90° X rotation (CAD Z-up -> Y-up). Parts are named `<group>|s<step>|<material>`; the door is every `pop_door|...` node, the pinion every `door_pinion|...` node. The pop door is on the house wall facing the run (CAD y ~2.4 m, glTF -2.4 m z), slides +X. The embedded "day_in_the_coop_and_build_*" animation is NOT played.
- URL params for tests/screenshots: `?tier=base|starter|plus|pro&door=<0-280>&view=overview|door`.
- Test hooks: `data-testid` `coop-demo-canvas` (`data-loaded-tier`), `coop-door-status` (`data-status`, `data-travel`), `coop-door-toggle`, `coop-estop`, `coop-estop-banner`, `tier-<tier>`, `view-overview`, `view-door`.

## Commands (run from APP)

```bash
cd applications/tendercells_ui/test_output/tendercells-ui
npm ci --no-audit --no-fund            # only on a deps card; never npm install <pkg>
npx tsc -b                              # type check (~60-90 s)
npx eslint .                            # 0 errors required; 3 old warnings are known (useBirds, ChickenEyeDashboardPage, ProductDashboardPage)
npx vitest run                          # all unit tests (28 files / 196 tests on 2026-11-22)
npx vitest run src/__tests__/coop       # just the door math
npx vite build --outDir /tmp/tc-dist --emptyOutDir   # build outside the repo
du -sb /tmp/tc-dist/assets              # bundle size (JS/CSS/wasm, excludes public/ models)
npx vite preview --outDir /tmp/tc-dist --port 4319 --strictPort &   # serve the build
TENDERCELLS_DEV_URL=http://localhost:4319 COOP_DEMO_SHOTS=$OUT/shots \
  npx playwright test tests/ui/coop-demo.spec.ts --project=desktop-chromium --workers=1 --reporter=line
```

- Playwright needs its Chromium (`npx playwright install chromium`, already present on the laptop). Each GLB takes 20-50 s to load under software WebGL; run the spec one test group at a time with `-g "renders the plus tier"` etc. if a card has a short cap.
- Screenshots land in `$COOP_DEMO_SHOTS` (default `APP/test-results/coop-demo/`, gitignored): `tier_<tier>.png`, `door_0.png`, `door_140.png`, `door_280.png`.
- Kill the preview server at the end of the card (`kill %1` or `pkill -f "vite preview"`).

## Baseline (2026-11-22, before /demo/coop)

- `assets/` 6,385,541 bytes; with /demo/coop 6,396,453 bytes (+0.17%). New lazy chunk `CoopDemoPage-*.js` ~10.3 kB (4.5 kB gzip). Main `index-*.js` 2,707.7 kB (unchanged within 1 kB).
- Size rule below compares against the number recorded in the latest passing card report, not this one, once a card has run.

## Acceptance checklist (every card)

A card is done only when ALL hold, checked twice in a row with the same result:

1. `npx tsc -b` exits 0.
2. `npx eslint .` reports 0 errors (warnings no more than before the card).
3. `npx vitest run` all green; test count not lower than before.
4. `npx vite build` exits 0.
5. Bundle: `du -sb /tmp/tc-dist/assets` not more than 10% above the recorded baseline.
6. Playwright `tests/ui/coop-demo.spec.ts` green, with screenshots of each tier (base, starter, plus, pro) and the door at 0 / 140 / 280 mm. Look at the PNGs: coop visible (not blank/black), door position changes between 0, 140 and 280.
7. No console errors (the spec fails on any `console.error` or page error).
8. The diff touches only files the card names.

## Rules

- Work on a branch named `hermes/demo-<short-name>` cut from the current TenderCells demo branch. Open it as a DRAFT PR. Never commit to or merge into `main`, never force-push.
- Every commit message ends with `[skip ci]`.
- No deploys (no `firebase deploy`, no hosting, no Lovable, no publish). No secrets: never read, print or commit `.env*`, tokens or keys.
- One small improvement per card. If a card would touch more than ~3 source files or ~150 lines, stop and `kanban_block` with a proposal to split it.
- Do not touch `cad/`, `scratch/`, firmware, other apps, `package.json`/`package-lock.json` (no new dependencies), or the GLBs.
- `make`, `g++` and `pio` do not exist on Hermes: never try them.
- Never use `rm -rf`, `git clean`, `git reset --hard` on the repo. Build output goes to `/tmp`.
- Time cap: 20 min for read-only/doc cards, 45 min for build/test cards. At the cap, `kanban_block` with what you have.
- If the same check fails twice after a fix attempt, stop and `kanban_block` with the exact error. Do not loop.
- Done needs 2 consecutive passing runs of the acceptance checks. Paste both in `kanban_complete`.
- Keep the E-STOP labelled "Simulated"; it must never call hardware APIs (`useHardwareControl`, MQTT, fetch to device endpoints).

## Ideas backlog (one per card, roughly in this order)

1. Loading UX: show the MB downloaded next to the %; keep the last coop visible while the next tier loads.
2. Camera presets: add "Side", "Top" and "Nest boxes"; animate between presets (lerp over 400 ms) instead of jumping.
3. Tier comparison card: a small table under the viewer (what Base/Starter/Plus/Pro add), from a const in the page; no network.
4. Live status panel placeholder: a "Live DoorCell" card that says "Not connected - simulated" with fields for state, travel, motor current, last event; wired to the sim only.
5. Mobile layout: controls below the viewer on < 600 px, viewer height 60vh, larger slider thumb; add a `mobile-chromium` screenshot to the spec.
6. Accessibility: keyboard shortcuts (O open/close, Space E-STOP, 1-4 tiers) with visible hints, focus ring on the canvas, `prefers-reduced-motion` = jump to target instead of animating.
7. Door detail: highlight the pop door + pinion (emissive outline) while moving; show the rack travel arrow.
8. Performance: dispose geometries/materials of tiers not shown for 60 s; cap pixel ratio at 1.5 on mobile.
9. Model size: Draco/meshopt-compressed copies of the GLBs (needs a gltf-transform card run by Hark, not Hermes: new tool).

## Known gaps (2026-11-22)

- `/demo/coop` was added instead of replacing `/demo`, because `/demo` and `/try` are the public seeded-demo front door.
- The GLB copies in `public/models/chicken-tender/` are untracked (~19 MB). Decide before committing: commit them, use Git LFS, or host them (Firebase Storage / Hugging Face) and change `tierUrl()`.
- GLBs are not compressed; gltf-transform was not available locally.
