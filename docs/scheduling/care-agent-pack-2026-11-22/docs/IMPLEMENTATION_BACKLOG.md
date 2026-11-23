# Implementation backlog: incremental PR plan

**PR0:** Add docs, fixtures and `tests/validate_package.py`; source reference reviewed. Verify no production changes. Acceptance: ZIP validator passes, README links and risk statuses accurate.

**PR1 P0 Fixes:** Make UI support door close state, reconcile water UI unit with generic relay; reconcile feed max; ensure fail-closed queue claim and add regression tests. Do not turn on new physical automation. Acceptance: all old CRUD and relay tests green, new mismatch tests green.

**PR2 Read-only solar engine:** Pure portable calculator for sunrise/sunset/civil dusk, property timezone and geographic location uncertainty; add `SolarDay` DTO, no commands. Acceptance: year/day, leap-year, DST regression, accuracy cross-check and 365-day preview.

**PR3 GUI:** Add Care Calendar / Today+Week+Month, wizard with trigger type, manual reminders, state/provenance badges, quick 'why', safe import/export. Acceptance: phone/tablet/desktop Playwright and keyboard, sim offline, never show unverified output as live.

**PR4 Observations:** `roosting_seen_by` vs `firstRoostAt`, `lastBirdInsideAt`, weather/shade observations, ability to log notes. Local low-confidence estimator and chart, read-only. Acceptance: estimate withheld until 7–14 confirmed entries, cloud outlier handling, no automatic door close.

**PR5 Weather:** NWS adapter with `User-Agent`, caching, alert freshness, stale, network failure UI, manual review triggers. Acceptance: no API calls in demo without explicit opt-in; cache/resilience and no forecast-to-actuator path.

**PR6 Exports:** Shared CSV/JSON/XML schemas, read-only export and import draft preview, optional human reminder ICS. Acceptance: exact units, timezone, ID, schema validation, round-trip, formula-injection defenses and no autoenable.

**PR7 Hardware (independent and blocked until validation):** Only qualified safe on-device safety interlocks for specific door/feeder/waterer. Document E-STOP, physical limit, obstruction, headcount and max runtime. Acceptance: bench videos, wiring checklists, regression and pilot owner sign-off.

## Release checklist
- PR description contains scope, screenshots, validation commands and flags.
- No source-controlled secrets, private URLs, live home cameras, exact private household coordinates or hardware tokens.
- All old `demoEnvironment.test.ts`, product family, MQTT and mower tests remain green.
- New feature rollout read-only then opt-in; operator can disable locally.
- `npm run describe:xml -- --check` after updating generator source when API endpoints added.
- Export includes schemaVersion, timestamps and source-type metadata; no Excel spreadsheet acts as scheduler.
- User docs use 4:18 **already-roosting-by** upper bound and low-confidence notes.
