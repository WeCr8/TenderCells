# TenderCells — Solar, Shade, Weather & Flock-Aware Care Scheduling

**Agent handoff package** · 2026-11-22 · **Specification and sample data; not deployed code**

## Why this exists
On 2026-11-22 at approximately 4:18 PM Pacific Standard Time, the owner of a flock at a Southern California property noted the chickens were **already roosting** after their yard fell into shade. Astronomical sunset at the approximate demo-site location was around 4:44 PM. The observation establishes **roosting by 4:18**, **not** first-roost precisely at 4:18, and does not tell us the last bird's entrance. Existing TenderCells schedules are mainly cron-based. Local property shade, weather, sensors, and bird presence should inform *reminders and safe decisions*, not blindly command doors or feeders.

**Mission:** upgrade TenderCells OS from fixed-time routines toward a transparent, local-first, weather-aware, solar-aware, animal-safe care calendar while preserving all existing features and simulator behavior.

## What is in this ZIP
| Item | Purpose | Status |
|---|---|---|
| `spreadsheets/TenderCells_Care_Scheduling_Expanded_v2.xlsx` | Human-editable, 365-day solar schedule, day planner, care routines, weather conditions, feed tracker, observations, GUI tasks, schema/data map | Planning workbook, not a live data feed |
| `data/*.csv` | Portable machine-readable planning templates and solar calendar for agents/tests | Sample/import templates; never auto-execute |
| `xml/tendercells-care-config.xml` | Example versioned interchange configuration | Disabled example, NOT deployable XML API |
| `xml/tendercells-care-config.xsd` | XSD validation for the example configuration | Proposed contract |
| `xml/tendercells-care-api-extension.xml` | Proposal for new route metadata | Not the generated backend XML |
| `schema/*.schema.json` | Versioned JSON payload examples/contracts | Proposed v1 schemas |
| `gui/care-calendar-prototype.html` | Standalone clickable frontend mock; no external libraries/network/control | **Simulation only** |
| `docs/GUI_GAP_AUDIT.md` | What's present, what's missing, and exact files | Repo-audited 2026-11-22 |
| `docs/GUI_UX_SPEC.md` | Screens, controls, states, mobile layout, accessibility, acceptance | Proposed |
| `docs/SCHEDULER_ENGINE.md` | Trigger resolution, site shade, DST, idempotency and safety logic | Proposed |
| `docs/FEED_WATER_WEATHER.md` | Care rules, calibrated volume semantics, provider reliability | Proposed |
| `docs/DATA_AND_EXPORTS.md` | XLSX ⇄ CSV ⇄ XML precedence, schema version, Google Drive procedures | Proposed |
| `docs/SECURITY_SAFETY_TESTS.md` | Failure states, gates, regression matrix | Required |
| `docs/REPO_MAP_AND_SOURCE_EVIDENCE.md` | Existing implementation paths and direct-source links | Verified from GitHub and Drive |
| `docs/IMPLEMENTATION_BACKLOG.md` | PR sequence, acceptance gates, definition of done | Agent execution plan |
| `AGENT_PROMPT.md` | Paste directly to Codex/Claude to start the branch-by-branch implementation | Ready for agent |
| `tests/validate_package.py` | CSV, XML (structure), JSON schema parsing, and rule-ID sanity check | Executable standard-library smoke test |

## Where to put files in the TenderCells repository
- Specifications: `docs/scheduling/` (add documents; don't overwrite existing docs).
- Source CSV: `docs/scheduling/examples/` or `applications/.../tendercells-ui/src/data/scheduling/` for vetted demo-only fixtures.
- XML & JSON contracts: `docs/scheduling/contracts/`; schema promotion to `express-api/backend/src/` only after tests.
- Prototype: `docs/scheduling/prototypes/care-calendar-prototype.html` (never expose it as a connected/live controller).
- Tests: colocate with chosen TS modules; Python validation script can live under `scripts/`.
- XLSX: use as operator reference in Google Drive; keep only a compact template in Git if repository binary-file policy permits.

## First agent actions
1. Read `AGENTS.md`, `.claude/CLAUDE.md`, `docs/HANDOFF.md`, `docs/CONNECT_A_DEVICE.md`, and `docs/TENDERCELLS_DIGITAL_TWIN_ARCHITECTURE.md` from the **current** main branch.
2. Run existing build/tests before changes. Make a new branch; do not merge or deploy without review.
3. Audit schedule UI/service and hub/cloud command mappings; fix semantic and safety mismatches with regression tests **before** new automated actions.
4. Introduce shared read-only solar/calendar forecasts and the calendar preview GUI, with simulated data labels.
5. Add shade/roost observation capture, weather adapter and stale-state indicators.
6. Only after hardware bench validation, add any supervised actuator flow; keep automation off by default.

## Source-of-truth rules
**Hardware:** device and hub telemetry with source timestamps. **Cloud forecast:** advisory with provider, issued/valid time and freshness; cannot prove conditions at a coop. **Solar:** calculated, not sensed, and cannot predict a tree's shade. **Human observations:** explicit and attributed. **Spreadsheet/CSV/XML:** templates, reports and import/export, NOT a second command authority. **Google Calendar:** optional human reminder output only. Never route motion through Drive or Calendar.

## Existing sources
- GitHub: https://github.com/WeCr8/TenderCells
- Original Google workbook: https://docs.google.com/spreadsheets/d/1eWP7euQiFdnE7IvQSx-ExBHr4cheJM8CpA0hYmVBfOM/edit
- Original Google Doc: https://docs.google.com/document/d/1DRV3ioPwMwSm25jDqXDi5fCheL4EDsKwHotIl_SfAVM/edit
- Tender Cells Drive folder: https://drive.google.com/drive/folders/1VqBE-Sn-PfpDbLCLIkD1WoEtHfB4tNps

## Limits and launch gate
The pack was designed against accessible docs/source but not deployed to TenderCells or validated on real coop hardware. Imported templates are **review-only** until owner approval, device capability validation and physical sensor/obstruction/headcount interlocks. The new scheduling UI must not imply real automation is active when only plan data exists.
