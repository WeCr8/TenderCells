# PRD — Demo Environment Orchestrator

**Document ID:** TC-PRD-DEMO-001
**Status:** Implemented (v1)
**Owner:** WeCr8 Solutions / Tender Cells platform
**Last updated:** 2026-06-13
**Related:** [Testing guide](../testing/demo-environment-testing.md) · [Architecture](../architecture.md) · [Open-source launch](../../../../docs/OPEN_SOURCE_LAUNCH.md)

---

## 1. Summary

The **Demo Environment Orchestrator** (`src/services/demo/demoEnvironment.ts`) is the
open-source on-ramp for Tender Cells. With one opt-in action it seeds a coherent,
end-to-end stack — **structures (products), flocks (animals), eggs, schedules,
property-grid placement, and equipment sim-state** — across **every product family
the platform knows about**, entirely in the owner's own browser. No hardware, no
cloud account, no fabricated data behind the user's back.

This is not a throwaway demo. It is the way a like-minded owner spins up the OS on
**their own network**, sim-only, evaluates it safely, and later swaps in real
hardware — at which point the same verify harness confirms each data layer is wired
for their real devices too.

## 2. Problem

A new owner (or evaluator, or contributor) lands on an **empty app**. Every screen —
Dashboard, Property Layout, Bird Management, ChickenEye, Egg Map, Schedules — needs
data from a *different* service to look or behave like a real deployment. Today they
must hand-create a product, then animals, then schedules, then place things on the
grid, device-by-device, just to see the platform work. That is a high-friction wall
in front of the exact people we want adopting an open platform.

There were also **partial, inconsistent seeders** scattered per page (Bird Management,
ChickenEye each had their own "load demo" path) that seeded one layer without the
others, producing incoherent states (animals on a device with no product, etc.).

## 3. Goals

| # | Goal | Measure |
|---|------|---------|
| G1 | One action seeds a coherent full-stack environment | `seedDemoEnvironment()` returns a report with `ok: true` |
| G2 | Cover **every** product family, not just Chicken Tender | `DEMO_SPECS.length` == animal packs + WatchTower |
| G3 | Private by default — nothing leaves the owner's machine | every seeded product carries `telemetry_consent: 'local_only'` |
| G4 | Safe to run on a real account — never clobber the owner's data | reset preserves non-demo flock/schedules (tested) |
| G5 | Idempotent — re-running never duplicates | counts stable across repeated seeds (tested) |
| G6 | Fully reversible — one action removes only demo-tagged data | `resetDemoEnvironment()` clears marker + tagged rows |
| G7 | Self-verifying — owner can confirm each layer is wired | `verifyDemoEnvironment()` per-device per-layer report |

## 4. Non-goals

- **No real hardware / MQTT traffic.** Equipment state is local sim-state only; no
  motion commands are issued. (Hardware control stays behind the existing MQTT path
  and confirmation modals — out of scope here.)
- **No automatic seeding.** Nothing seeds on load, login, or first run. Strictly opt-in.
- **No Firebase writes required.** Works on the sim (localStorage) backend; on a
  Firebase-configured deployment the same service calls persist through the normal
  dual-backend services.
- **Not a load/performance test harness.**

## 5. Users & use cases

| User | Use case |
|------|----------|
| **Prospective owner / evaluator** | "Show me what a full deployment looks like before I buy or build anything." |
| **Open-source adopter** | Spin the OS up on their own network, learn the data model, then register their real devices. |
| **Contributor / QA** | Deterministic, coherent fixture to exercise every screen and the automated test suite. |
| **Demo presenter** | Load → present → reset, leaving no residue. |

## 6. Requirements

### 6.1 Functional

- **FR1 — Seed.** `seedDemoEnvironment()` seeds, in order: products (Chicken Tender
  keeps its dedicated garage build; all other families get a generic demo product) →
  flocks → eggs (laying devices) → schedules → property-grid placement → equipment
  sim-state. Sets the seeded marker, emits `DEMO_EVENT`, returns a `DemoReport`.
- **FR2 — Data-driven device list.** The device set derives from birdsService
  `DEMO_ANIMAL_PACKS` (single source of truth) plus a sensor-only WatchTower spec.
  Adding a pack there automatically extends the whole pipeline — no edits here.
- **FR3 — Coherent ids.** For each device, `product.device_id`, `animal.device`,
  egg-map `deviceId`, schedule `deviceId`, and grid item `deviceId` are the **same id**.
- **FR4 — Idempotent.** Every step upserts by fixed id. Re-running never duplicates
  and never overwrites the owner's own (non-demo) records. Schedules/layout skip
  devices that already have entries.
- **FR5 — Reset.** `resetDemoEnvironment()` removes only demo-tagged data: products by
  `source` (`demo-environment`, `garage-dev-seed`), the fixed demo animal ids, the
  orchestrator's own schedule labels (scoped per device), demo grid items + unlinks
  device ids it attached, equipment state, and the marker.
- **FR6 — Verify.** `verifyDemoEnvironment()` iterates `DEMO_SPECS` and returns a
  per-device, per-layer pass/fail report (`product`, `flock`, `eggs`, `schedules`,
  `layout`, `equipment`) plus a top-level `ok`.
- **FR7 — Status.** `isDemoSeeded()` / `demoSeededAt()` expose seeded state for the UI.
- **FR8 — UI.** Settings → "Demo & Developer" accordion: Load / Verify / Reset buttons,
  a status chip, a privacy note, and a rendered per-device report. Reset is gated by a
  confirmation dialog.

### 6.2 Non-functional / platform rules

- **Privacy / local-first (G3).** Seeded products set `telemetry_consent: 'local_only'`,
  `hardware_setup_mode: 'sim_only'`, `simulation_backend: 'browser_threejs'`. No animal
  data leaves the machine unless the owner explicitly enables a backend.
- **No fabricated data behind the user's back.** Opt-in only; deterministic values
  (device-specific hashing, no per-render `Math.random`).
- **Dual-backend.** Uses the existing services (productsService, birdsService,
  eggService, schedulesService, propertyLayoutStore), so it persists to localStorage in
  sim mode and to Firestore when Firebase is configured — no new persistence path, no
  new collection, no security-rules change.
- **UI conventions.** Brand color tokens only; hardware-adjacent/destructive action
  (Reset) behind a confirmation dialog.

## 7. Design

```
                 birdsService.DEMO_ANIMAL_PACKS  ← single source of truth
                              │
                              ▼
        DEMO_SPECS = packs.map(→ DemoDeviceSpec) + WATCHTOWER_SPEC
                              │
  ┌───────────────┬──────────┼───────────┬──────────────┬───────────────┐
  ▼               ▼          ▼           ▼              ▼               ▼
ProductsService  birdsService eggService schedulesService propertyLayout  equipment
(products)       (flocks)    (eggs)     (schedules)      (grid)          (sim-state)
  │               │          │           │              │               │
  └───────────────┴──────────┴─── one shared deviceId per device ───────┘
                              │
                  seed / reset / verify  →  DemoReport
                              │
                   Settings → Demo & Developer panel
```

Key types: `DemoDeviceSpec`, `DemoEquipment`, `DemoLayerResult`, `DemoDeviceReport`,
`DemoReport`. Constants: `DEMO_SOURCE`, `DEMO_EVENT`, `DEMO_DEVICES`, `DEMO_SPECS`.

## 8. Acceptance criteria

1. On a clean store, `isDemoSeeded()` is false and `verifyDemoEnvironment().ok` is false.
2. After `seedDemoEnvironment()`, the report is `ok: true` with one row per `DEMO_SPECS`
   entry and every layer of every device passing.
3. Every seeded device product has `telemetry_consent: 'local_only'`.
4. Re-seeding does not change animal / product / schedule counts.
5. After `resetDemoEnvironment()`, no demo-tagged product or animal id remains, the
   marker is cleared, and the report is no longer `ok`.
6. A reset run **after** the owner created their own flock/schedule leaves those intact.

All six are covered by `src/services/demo/demoEnvironment.test.ts` (7 tests, green).

## 9. Risks & mitigations

| Risk | Mitigation |
|------|-----------|
| Seeding clobbers a real owner's data | Tag-scoped reset; idempotent upserts; preservation test (AC6). |
| Live Firestore writes during automated tests | Tests force the sim backend via `test.env.VITE_FIREBASE_PROJECT_ID=''`. |
| Pack additions silently miss a layer | Data-driven from `DEMO_ANIMAL_PACKS`; verify harness flags any unwired layer. |
| Demo data mistaken for real telemetry | `safety_validation_status: 'simulated'`, `source` tag, explicit `notes`. |

## 10. Future work

- Wire the legacy per-page "Load Demo" buttons (Bird Management, ChickenEye) to
  delegate to this orchestrator so there is a single seeding path.
- Optional Firebase-emulator e2e that drives the Settings panel through real auth.
- Per-family equipment depth (e.g. pond level for Duck Dock, browse rack for Goat
  Guardian) as those product UIs mature.
