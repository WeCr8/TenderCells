# Safety, security and regression acceptance

## Non-negotiable hardware policy
Keep local E-STOP, obstruction interlocks, verified animal occupancy, hard physical door limit switches, watchdog/timeout, manual release, relay default OFF and actuator runtime caps. Do not expose MQTT credentials or private camera streams. Google Drive, Sheets, exports, weather API and LLMs may never directly actuate physical devices. Cloud schedule `requested` is not `confirmed`; unknown or stale is NOT safe.

## Test matrix (all tests required before enabling any actuation)
| ID | Scenario | Expected |
|---|---|---|
| S01 | 4:18 PM already roosting, first bird unknown | Log `roosting_seen_by` only; no fabricated first-roost timestamp |
| S02 | Shade arrives early, one bird outside | Monitoring reminder, door close blocked, human alert |
| S03 | Cloud temporarily darkens lux | No door actuation; avoid one-sample learned offset |
| S04 | Headcount unknown / inconsistent | No autonomous close, explicit unresolved UI |
| S05 | Door-close publish but limit switch missing | `sent_unconfirmed`; never `closed` green status |
| S06 | E-STOP active | All scheduled physical action blocked; reminders permitted |
| S07 | Rain/wind warning | Advice/hold outdoor robots with existing interlock, not blind coop lock |
| S08 | Weather API 500/timeout/stale > configured | Visible stale; local-only fallback, no sudden command |
| S09 | No water flow / stuck valve | Pump off independently; alert; max runtime validated |
| S10 | Feed UI says 2000g, hub only supports 1000g | Reject with clear device limit; no silent 1000g command |
| S11 | Water UI says 100ml but device only relay | Reject/offer relay mode explicitly; no volume claim |
| S12 | Duplicate cloud and hub ticks same minute | One queue command and audit; no duplicate movement |
| S13 | Firestore queue claim unavailable | Fail closed for actuator; no `firing locally anyway` |
| S14 | DST 2027 spring/fall in LA | Correct local preview, no duplicated unsafe command |
| S15 | Browser timezone differs from property | Property-local day and schedule are consistent |
| S16 | LocalStorage/demo mode | `SIMULATED`, no fetch of home network/no real publish |
| S17 | Offline/reboot hours later | Expired command not replayed; owner notified |
| S18 | CSV includes malicious formula in Notes | Escaped spreadsheet export, no evaluation on import |
| S19 | XML invalid XSD / unknown version | Reject transactionally, no partial import |
| S20 | Cross-property tampered device ID | Forbidden before any command; no leak of sensor history |
| S21 | Camera detection false positive | Mark inferred/confidence; cannot assert last bird inside |
| S22 | Existing 5-field cron schedule | Remains editable, schedules once, old Firestore path works |
| S23 | Legacy classroom generic relay | Works under explicit relay capability, not as calibrated water volume |
| S24 | GitHub mower and demo regression | Existing mower holds, dashboard and product demo work unchanged |

## Minimum CI commands from repository handoff
```
cd applications/tendercells_ui/test_output/tendercells-ui
npx tsc --noEmit -p . && npx eslint . && npx vitest run && npm run build
cd ../express-api
npx tsc --noEmit -p . && npm test && npm run describe:xml -- --check
cd ../website
npx tsc -b && npx eslint . && npm run sync:docs && npm run check:docs && npm run check:links && npm run build
```
Also run `functions` unit tests, Python robot service tests per `docs/HANDOFF.md`, and validation from `tests/validate_package.py`. Extend Playwright tests for phone/tablet schedules.

## Deployment gate
No real-device action path, garden irrigation, fan, feeder, waterer, arm or automated door closure is enabled in the public or school demos by this package. Require documented bench and field validation of the specific hardware model and owner training.
