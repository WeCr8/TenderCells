# Testing Guide — Demo Environment

**Document ID:** TC-TEST-DEMO-001
**Status:** Active
**Last updated:** 2026-06-13
**Covers:** `src/services/demo/demoEnvironment.ts` and the Settings → Demo & Developer panel
**Related:** [PRD](../prd/demo-environment.md)

This guide is the full testing reference for the demo-environment orchestrator:
the automated suite, how to run it, what each test proves, and the manual UI
verification flow for a release check.

---

## 1. Definitions (first use)

- **Sim-only / sim mode** — the app running on the localStorage backend, no Firebase.
  Selected automatically when `VITE_FIREBASE_PROJECT_ID` is unset.
- **Seeded marker** — a localStorage key (`tendercells_demo_seeded_v1`) holding the ISO
  timestamp of the last seed. Its presence is what `isDemoSeeded()` reports.
- **Demo-tagged data** — records the orchestrator created: products with
  `metadata.source` of `demo-environment` or `garage-dev-seed`, the fixed demo animal
  ids, schedules whose label is in the orchestrator's known set, and grid items whose id
  starts with `demo-`. Reset touches **only** these.
- **DemoReport** — the per-device, per-layer pass/fail object returned by
  `seedDemoEnvironment()` and `verifyDemoEnvironment()`.

---

## 2. Automated tests

### 2.1 Location & runner

- File: `src/services/demo/demoEnvironment.test.ts`
- Runner: **Vitest** (`npm test` → `vitest`)
- Environment: default **node** — the test installs a tiny browser-global shim
  (`localStorage`, `window.dispatchEvent`, `CustomEvent`). No `jsdom` / `happy-dom`
  dependency is required.

### 2.2 Backend isolation (important)

This checkout resolves env files from the **repo root** (`vite.config.*` `envDir:
'../../../..'`), and that root `.env` supplies `VITE_FIREBASE_PROJECT_ID`. Left alone,
services would route to **live Firestore** during tests (flaky, network- and
permission-dependent). The `test` block in **both** `vite.config.js` and
`vite.config.ts` therefore sets:

```js
test: {
  include: ['src/**/*.test.{ts,tsx}'],
  env: { VITE_FIREBASE_PROJECT_ID: '' },   // force the deterministic sim backend
}
```

> Edit **both** config files when changing this — the compiled `vite.config.js`
> resolves before `vite.config.ts`, so a `.ts`-only change is dead.

### 2.3 Running

```bash
cd applications/tendercells_ui/test_output/tendercells-ui

npm test                                            # whole suite (vitest run via watch UI off)
npx vitest run                                       # whole suite, single pass
npx vitest run src/services/demo/demoEnvironment.test.ts   # just this file
npm run test:coverage                                # with coverage
```

Expected: **7 passed** in the demo file; **22 passed** across the suite.

### 2.4 What each test proves

| Test | Asserts | Goal (PRD) |
|------|---------|-----------|
| clean start → reports nothing seeded | `isDemoSeeded()` false; `verify().ok` false before any load | baseline |
| seed → coherent, fully-verified env | report `ok: true`, one row per `DEMO_SPECS`, **every** layer of **every** device passes | G1, G2, G7 |
| seed → tags every product `local_only` | each `source==='demo-environment'` product has `telemetry_consent: 'local_only'` | G3 (privacy) |
| seed → writes equipment for every device | `getDemoEquipment().length === DEMO_SPECS.length` | G1 |
| idempotent re-seed | animal / product / schedule counts unchanged after a second seed; still `ok` | G5 |
| reset removes demo data | no demo product/animal id remains, equipment + marker cleared, report no longer `ok` | G6 |
| reset preserves owner's own data | a user-created flock + schedule on a non-demo device survive a seed→reset cycle | G4 (safety) |

### 2.5 Adding a product family

The pipeline is data-driven from `birdsService.DEMO_ANIMAL_PACKS`. When a new pack is
added there, **no test edit is required** — the seed test automatically asserts the new
device seeds and verifies across all six layers (it iterates `DEMO_SPECS`). If the new
family needs schedules, extend `schedulesFor()` in the orchestrator and the
`DEMO_SCHEDULE_LABELS` set so reset stays scoped.

---

## 3. Manual UI verification (release check)

The Settings → Demo & Developer panel exposes the same three operations. Because the
Settings page sits behind Firebase auth, this flow runs against the **real app**, not a
headless harness.

**Preconditions:** app running (`npm run dev`, :5173), signed in.

| Step | Action | Expected |
|------|--------|----------|
| 1 | Settings → expand **Demo & Developer** | Panel shows privacy note (local-only), status chip, Load / Verify / Reset |
| 2 | Note the status chip | "Not seeded" before first load |
| 3 | Click **Load Demo** | Chip flips to "Seeded …", report renders with every device row all-green (✓) |
| 4 | Visit Dashboard / Property Layout / Bird Management / Egg Map / Schedules | Each shows the seeded devices, animals, eggs, schedules, and grid placement |
| 5 | Return to Settings → click **Verify** | Report re-renders `ok` with all layers green |
| 6 | Click **Load Demo** again | No duplicates anywhere; counts unchanged (idempotent) |
| 7 | Click **Reset** → confirm in dialog | Chip returns to "Not seeded"; demo devices/animals/schedules gone from every screen |
| 8 | If you had your own (non-demo) data | It is still present after reset |

### Panel test ids (for any future UI automation)

`demo-panel`, `demo-load`, `demo-verify`, `demo-reset`, `demo-status` (with
`data-seeded`), `demo-report` (with `data-ok`). The reset confirmation dialog renders a
**Confirm** button.

---

## 4. What can go wrong

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Tests hit Firestore / `PERMISSION_DENIED` | `test.env` override missing or only in `.ts` | Ensure `VITE_FIREBASE_PROJECT_ID: ''` is in **`vite.config.js`** too |
| `Cannot find package 'jsdom'` | a test forced `@vitest-environment jsdom` | This file uses the node shim instead — drop the docblock |
| A device row fails one layer | that service didn't persist for the device | Check the layer `detail` string in the report; confirm the family's `schedulesFor`/pack/grid entry exists |
| Reset left some demo data | a record wasn't tagged | Verify new records set `metadata.source = DEMO_SOURCE` (products) or a known schedule label |
| Duplicates after second load | an upsert keyed on a non-fixed id | All demo ids must be deterministic (fixed per device/animal) |

---

## 5. CI

Add to the app CI job (runs on PR):

```bash
cd applications/tendercells_ui/test_output/tendercells-ui
npm ci
npx tsc --noEmit          # typecheck (expect exit 0)
npx vitest run            # unit/integration (expect 22 passed)
npm run build             # tsc -b && vite build (production bundle)
```

The demo-environment suite is part of `vitest run`, so it gates every PR automatically.
