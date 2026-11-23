# Agent implementation mandate — TenderCells Care Scheduling

You are implementing a backwards-compatible upgrade in `WeCr8/TenderCells`, not a rewrite. First read `README.md` and all `docs/` and `schema/` in this handoff package. Then inspect the latest repo `main`, commit SHA, repo instructions `AGENTS.md`, `.claude/CLAUDE.md`, `docs/HANDOFF.md`, and existing tests. The source paths in the handoff are suggestions based on inspection; reconcile them against current code before edits.

**Deliver one narrow PR at a time** with tests, screenshots and status/report. Do not merge automatically; do not claim hardware works without real validation. Feature flags default off for physical action. Demo remains browser-local and clearly `SIMULATED`. DO NOT publish weather credentials, secrets, homeowner coordinates, or local IPs.

Phase 0 — audit and bugs:
- Audit `SchedulesPage.tsx` form, `schedulesService.ts`, hub `schedules.ts` and cloud `scheduleExec.ts`; confirm `door` creation serializes close state and water-volume UI is not silently mapped to `light on`.
- Address feed UI 5000g vs backend clamp at 1000g; document and calibrate per device.
- Inspect hub queue-claim failure branch that logs `firing locally anyway`; design fail-closed/idempotent policy with tests.
- Confirm clock and daylight saving handling, duplicate queue keys, and device ownership E-STOP are intact. Preserve legacy relay ability separately as relay mode; do not call it milliliters.

Phase 1 — read-only calendar UI:
- Add a Care Calendar tab or route with Today/7-day/Month, `next action`, sun and forecast, first-roost estimated, observed, and clear provenance badges. Include header toggle `Simulated/Live` with strict actual mode gating.
- Build schedule wizard trigger selection `Fixed / Sunrise-Sunset / Local Shade / Sensor / Combined`, preview with rationale and notifications only until enabled.
- Add accessible 44px targets, keyboard navigation, no fake telemetry, responsive phone/tablet.

Phase 2 — observation/provenance:
- Add local property solar profile (geo anchor, timezone, elevation optional), privacy-safe approximate coordinates fallback; observation entry for `roosting_seen_by`, `last_bird_inside`, `shade_onset`, light/lux, weather and confidence. Do not equate roosting_seen_by with exact first roost.
- Use cautious rolling median of sunset-to-roosting-observed-by offset only for **monitoring cue**, never door closure. Show count/sample count/confidence.

Phase 3 — data adapters + exports:
- Implement NWS `points → forecast/hourly`, alerts and cache/freshness; identifying User-Agent. Add license-reviewed configurable alternate provider, not silently commercial Open-Meteo free API.
- Add XLSX/CSV/XML exports and safe imports with preview/validate/diff; never import secrets or actuator commands, never auto-enable schedules. Version schemas.

Phase 4 — hardware validation gates (separate PR):
- Only with physical door position, obstruction status, verified bird count or supervised keeper confirmation, local E-STOP, watchdog and manual override verified; keep unknown occupancy from being declared safe.
- Water/feeder commands require calibrated measurement, runtime cutoff, sensor health, and a hardware stop independent of cloud.

Run code/test gates in `docs/HANDOFF.md`. Add test cases in `docs/SECURITY_SAFETY_TESTS.md` and baseline all preexisting functionality: demo environment, mower interactions, property twin, firmware flasher, camera, MQTT, Firebase Auth, scheduling CRUD and robot safety. Fail if simulation is shown as live. On completion report: changed files, tests run/results, screenshots, unresolved risks, migration notes, scope exclusions, and next step. No speculative claims.
