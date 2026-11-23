# Spreadsheet, CSV, XML, JSON and Google Drive data contracts

## Why four formats?
- **Google Sheets / XLSX**: keeper-edited planning and reporting, formula-driven solar/feeding views, checklists and educational worksheet. User-facing source of planning input, never hardware truth.
- **CSV (UTF-8, RFC4180)**: low-overhead rows for imports, tests, third-party reporting and durable GitHub fixture diffs. One table per CSV; all timestamps must be ISO8601 with offset or UTC; date-only `YYYY-MM-DD` for solar table. No secrets.
- **XML v1**: typed configuration interchange, offline/industrial system import and future machine-validation tooling; XSD verifies required fields and bounds. XML is NOT the repo's generated `tendercells-backend.xml`, not an MQTT message and not a live API without implementation.
- **JSON Schema**: runtime DTO/REST validation and easily testable frontend/backend contract. Version 1; code should produce its own reviewed TS types and Zod/Ajv or existing validation approach, not blindly trust input.

## Ownership and precedence
`Sensed telemetry > human verified observation > weather EXTERNAL forecast > calculated solar > simulated demo`. This ordering concerns claims about the *physical world*, not authority to actuate. Physical interlocks remain authoritative. Do not merge source columns into one ambiguous 'value'.

## CSV import rules
1. Decode strict UTF-8, max rows/bytes, reject formula injection on re-export (prefix dangerous formula-leading cells for spreadsheet targets), strict header check and stable IDs.
2. Validate with `schema/data_dictionary.csv` then JSON schema/XSD equivalents; preview row count, conflicts and changes, never act on upload.
3. `event_id` stable; `timeZone` must be valid IANA name, `utc` must be absolute, ensure property is owned by authenticated user.
4. User edits made in a Sheet are not synced to TenderCells until explicit import, owner acknowledgement, dry-run diff and save as **disabled/draft**.
5. Exports must redact precise coordinates when shared, camera URLs, API credentials, tokens, personal animal notes as configured.
6. Round-trip fixtures for CSV↔XML↔JSON must not mutate `source_type` or timezone. Numeric mass is `g`, volume `ml`, temperature is Celsius in machine fields with display conversion.

## Source files
- `data/solar_calendar_365.csv`: approximate solar events and estimated monitor cue; informational only.
- `data/care_routines.csv`: schedules as human advisory draft; no actuation.
- `data/weather_rules.csv`: conditional advisory rules, testable rule IDs.
- `data/observation_template.csv`: 1 reported observation (`roosting_seen_by`), does not assert first-roost time.
- `data/feed_log_template.csv`: blank recording template.
- `data/gui_backlog.csv`: implementation tasks with acceptance criteria.
- `data/data_dictionary.csv`: field types, units, nullable constraints, provenance.

## Google Drive plan
Existing originals remain untouched. Create a **new v2** native Sheet and Google Doc in the existing Tender Cells folder; include links back to originals, record new URLs in README/manifest only after verified upload/readback. Keep the JSON/XML contract and GUI prototype in the ZIP so code agent uses the same source. Google Drive/Sheets does not execute robotic commands and does not become another scheduler.

## Changes to generated XML
Existing repository note: edit `applications/tendercells_ui/test_output/express-api/backend/src/describe.ts`, then run `npm run describe:xml`; the generated output is `applications/tendercells_ui/test_output/website/public/api/tendercells-backend.xml`. Do NOT overwrite the generated artifact with the sample `xml/tendercells-care-api-extension.xml`. Agent should update generator source only when proposing actual API routes, and rerun the check.

## Date and DST
All machine event timestamps have offset/UTC. Solar calendar includes local display time AND UTC instant, with IANA zone `America/Los_Angeles`. Cron inputs are local to the property; don't recalculate them by browser timezone. DST transition days must never run a schedule twice or accidentally issue a stale action. Future seasonal roost estimate must not claim certainty from one evening.
