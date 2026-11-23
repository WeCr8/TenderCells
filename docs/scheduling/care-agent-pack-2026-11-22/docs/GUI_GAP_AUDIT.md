# GUI gap audit — confirmed repo surface vs proposed UX

**Evidence:** read from current GitHub default branch on 2026-11-22; not a screenshot-based interactive browser audit. "Not shown in reviewed component" means proposal/gap, not proof the entire repo lacks it.

| Surface | Already present/verified | Missing or unverified in inspected path | Implementation target | Priority |
|---|---|---|---|---|
| Schedule CRUD | `SchedulesPage.tsx` uses MUI add/edit/delete/toggle, device picker, daily/weekdays cron, amount | Calendar/grid view; solar event trigger picker; 7-day preview; reason-for-action; confidence; next action card | Add mode + calendar under existing Schedules page; preserve CRUD | P0 |
| Door action | `Schedule` supports `state:open|close` | Save form does **not** pass a `state` from UI; only `Door Open` menu visible in read code | Explicit open/close and physical-state requirements | P0 |
| Water action | UI exposes `Amount (ml)` | Hub/cloud map to generic `light {on}`; no calibrated volume contract | Separate `relay_onoff` vs `water_dispense_ml` capability | P0 |
| Feed action | UI input max 5000g, service supports amount | Hub/cloud `commandFor` clamps to 1000g, may mislead operator | Bounds derived from hardware capability; unit + calibration warning | P0 |
| Hub/cloud scheduling | existing cron, time zone, dedup queue ID, E-STOP gate | No solar/shade/sensor combined trigger model; ambiguous offline behavior after claim failure | Shared trigger resolver, fail-closed audit ledger | P0 |
| Digital twin | Twin ID & source provenance in `docs/TENDERCELLS_DIGITAL_TWIN_ARCHITECTURE.md`; demo property view | Full live `external/sensed/observed/simulated` data ribbon and event provenance display not established by inspected scheduling UI | Inspector overlays and status badges | P1 |
| Weather | Marketing lists weather-adaptive scheduling as a community idea | No verified live weather-source selection, freshness, data confidence or alert integration in schedule editor | Weather Settings and sensor-vs-forecast status | P1 |
| Shade / roost | No confirmed input in schedule CRUD for `roosting_seen_by` or lux | Site-specific observation form, confidence and seasonal calibration | Observation drawer and trend panel | P1 |
| Nutrition/water | Existing feeder/water classroom docs and `feed`/`water` schedule actions | Flock count/calibrated feeder/water sensor insight not surfaced in scheduling editor | Care dashboard and inputs | P1 |
| Alerts | Existing device alert paths | UI dismissal, missed task escalation, stale forecast badges not confirmed in schedule page | Notification center, explanation | P1 |
| Import / export | Drive workbook + docs serve as planning assets | No verified native care-calendar XLSX/CSV/XML round-trip GUI | Import/export review modal, CSV validator | P2 |
| Demo | `/app/demo` browser-local simulation, missions, product data | New care-calendar mission and timeline not verified | Simulated-only care calendar scenario | P2 |

## Cross-cutting UX behavior
- Always display source, age and reliability: `Observed · 3 min ago`, `NWS forecast · issued 1 hr ago`, `Calculated solar`, `Simulated`.
- Separate states `planned → due → requested → acknowledged → confirmed`, plus `blocked`, `stale`, `manual`, `failed`.
- Never claim "Closed" because `tc/{id}/cmd/door` was published. Require position proof, or say `Command sent; position unconfirmed`.
- Dangerous actions require dialog and privilege; read-only reminders do not.
- Never introduce a direct Firebase motor path; retain existing MQTT/device-control boundary.

## UX test matrix
`desktop 1440x900`, `tablet 834x1112`, `phone 390x844`, `small phone 320x568`; mouse, touch, keyboard; high contrast, offline, slow network; empty account, demo account, one real device, many devices; missing bird, no lux, stale weather, unknown coords, DST Sunday, browser not same zone as property. Screenshot each scenario.
