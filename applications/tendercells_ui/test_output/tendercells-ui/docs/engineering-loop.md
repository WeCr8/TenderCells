# TenderCells Engineering Loop

TenderCells should be buildable by open-source users, useful for makers building their own hardware, and dependable for customers buying a prebuilt unit or kit. The engineering loop below keeps those goals tied together.

## Local Repair Loop

Run this before opening a pull request or packaging a release:

```bash
npm run tc -- check
npm run essential:loop
npm run quality:loop
```

For terminal-first contributors, TenderCells also includes its own CLI:

```bash
npm run tc -- help
npm run tc -- status
npm run tc -- demo
npm run tc -- demo:watch
npm run tc -- loop
```

The CLI opens with a UTF-8 TenderCells barn splash and wraps the same local scripts used by maintainers. Published or linked installs can also expose `tendercells` and `tc` binaries through `package.json`.

`npm run essential:loop` is the first required local gate: it runs Vitest contracts and then the seed-demo autonomous OS audit. It writes `docs/essential-loop-report.md`.

`npm run ui:smoke` runs Playwright against the live app on `http://localhost:5173`. It checks real browser rendering, `/birds`, key product routes, console/runtime errors, and local backend health.

`npm run platform:loop` runs the essential loop and Playwright UI smoke together.

`npm run quality:loop` adds optional/non-blocking analysis such as Fallow and writes `docs/quality-loop-report.md`. Fix the first required failure, rerun the loop, then turn repeated failures into tests, docs, or product backlog items.

## Required Gates

- Production bundle builds with `npm run build`.
- No blank screen on `http://localhost:5173/chicken-tender`.
- Mobile, tablet, and desktop layouts stay usable.
- Firebase auth can fail gracefully without blocking local demo mode.
- CRUD flows work for products, property layout, and product section devices.
- Emergency stop controls remain visible and tappable.
- No secrets, Firebase service files, keystores, or provisioning profiles are committed.

## Optional NPX Tools

Use `npx` tools only when they are useful and either pinned by version or installed as project dev dependencies. Avoid letting normal build, test, or quality-loop commands silently download and execute unreviewed packages.

Safe patterns:

```bash
npx --no-install <tool> --help
npx <tool>@<version> <args>
```

Before adding an `npx` tool such as `fallow` to the codebase:

- Confirm the exact package name and purpose.
- Pin the version or add it to `devDependencies`.
- Add it as an optional quality-loop check first.
- Document what failure means and how contributors should repair it.
- Do not make it a release blocker until it has run cleanly in CI.

Current optional analyzer:

```bash
npm run fallow
```

`npm run quality:loop` runs Fallow as a non-blocking check. Treat findings as review signals for dead code, duplication, complexity hotspots, and architecture drift.

## Repair Categories

- `runtime`: blank page, uncaught exception, Vite optimizer issue, Firebase initialization issue.
- `ux`: mobile/tablet overflow, inaccessible controls, unreadable contrast, missing child view.
- `data`: CRUD failure, local fallback failure, API unavailable behavior.
- `hardware`: product spec mismatch, pinout issue, firmware contract mismatch.
- `release`: build failure, missing SHA badge, missing signing artifact, undocumented breaking change.

## Production Loop

1. Reproduce the issue on the route and viewport where it happens.
2. Add or update the smallest check that would catch it again.
3. Fix the behavior.
4. Run `npm run quality:loop`.
5. Update `docs/production-readiness.md` if the fix changes a product, hardware expectation, or release gate.
6. Capture a mobile/tablet screenshot for UI changes.

## Community Hardware Paths

TenderCells should support three user paths:

- Software-only: users bring their own hardware and configure products in the app.
- DIY kit: users buy parts or a kit, flash firmware, and pair devices.
- Prebuilt unit: users buy assembled hardware and use the app for setup, control, and simulation.

Every new product feature should document:

- Supported hardware revision.
- Required sensors, motors, cameras, and power assumptions.
- Pairing and reset process.
- Offline behavior.
- Safety limits and emergency stop behavior.
- Replacement part or kit note when relevant.
- Telemetry consent, data retention, asset license, and release-readiness state.
- Simulation backend expectations, including whether NVIDIA/Isaac, ROS/Gazebo, browser simulation, or hardware-in-loop is expected.

## Open-Source Home Farming Goal

TenderCells should be useful to anyone building home farming, backyard animal care, small homestead automation, research prototypes, school projects, and community hardware.

New product or simulation work should preserve:

- A no-vendor-lock-in path for custom devices.
- A local-first path when cloud services are unavailable.
- A browser-only simulation path for users without NVIDIA hardware.
- An NVIDIA/Isaac path for advanced robotics, synthetic data, terrain, and property-scene simulation.
- Clear device contracts so community firmware can connect through MQTT or ROS 2.
- Consent-based telemetry learning for property and terrain improvements.
