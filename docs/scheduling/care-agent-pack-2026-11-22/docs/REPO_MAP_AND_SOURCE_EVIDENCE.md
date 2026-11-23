# Evidence-based repository map and existing Drive artifacts

Sources reviewed on 2026-11-22 via connected GitHub and Google Drive (not a full codebase audit):

| Existing source | Observed behavior | Agent action |
|---|---|---|
| [`SchedulesPage.tsx`](https://github.com/WeCr8/TenderCells/blob/main/applications/tendercells_ui/test_output/tendercells-ui/src/pages/SchedulesPage.tsx) | Schedule CRUD, cron builder, MUI, day/time selection, amounts and device selection | Extend, do not replace; new calendar and wizard |
| [`schedulesService.ts`](https://github.com/WeCr8/TenderCells/blob/main/applications/tendercells_ui/test_output/tendercells-ui/src/services/schedulesService.ts) | Firestore schedules/device/items and demo localStorage; cron, browser zone | Add optional versioned trigger; legacy records remain valid |
| [`schedules.ts`](https://github.com/WeCr8/TenderCells/blob/main/applications/tendercells_ui/test_output/express-api/backend/src/schedules.ts) | Hub cron, source paths, command mappings, deterministic ID | New pure trigger resolution and safe capability limits |
| [`schedule.runner.ts`](https://github.com/WeCr8/TenderCells/blob/main/applications/tendercells_ui/test_output/express-api/backend/src/schedule.runner.ts) | 30-second hub tick; E-STOP, Firebase queue, MQTT, demo/LAN mode no-op | Preserve control path and fix claim-failure branch |
| [`functions/src/scheduleExec.ts`](https://github.com/WeCr8/TenderCells/blob/main/functions/src/scheduleExec.ts) | Timezone cron, 5-min window, queue TTL; water→light & feed clamp | Maintain queue compatibility, resolve semantics |
| [`functions/src/scheduleRunner.ts`](https://github.com/WeCr8/TenderCells/blob/main/functions/src/scheduleRunner.ts) | Cloud scanning, offline/E-STOP skip, owner zone | Preserve cloud dedupe and availability checks |
| [`docs/TENDERCELLS_DIGITAL_TWIN_ARCHITECTURE.md`](https://github.com/WeCr8/TenderCells/blob/main/docs/TENDERCELLS_DIGITAL_TWIN_ARCHITECTURE.md) | Defines source classes and command state vs sensor confirmation | Reuse provenance model |
| [`docs/CLASSROOM_FEEDER_AND_WATERER.md`](https://github.com/WeCr8/TenderCells/blob/main/docs/CLASSROOM_FEEDER_AND_WATERER.md) | Generic `relay` via `cmd/light`, pulses; first devices | Maintain explicit legacy compatibility |
| [`docs/HANDOFF.md`](https://github.com/WeCr8/TenderCells/blob/main/docs/HANDOFF.md) | Build gates, generated docs/XML instructions, E-STOP | Follow unchanged |
| [Original Drive workbook](https://docs.google.com/spreadsheets/d/1eWP7euQiFdnE7IvQSx-ExBHr4cheJM8CpA0hYmVBfOM/edit) | 9 native sheets including Sun & Shade 365, Forecast Snapshot, rules and observations | v2 adds GUI/backlog, schemas and verified export contracts; keep original |
| [Original Drive plan](https://docs.google.com/document/d/1DRV3ioPwMwSm25jDqXDi5fCheL4EDsKwHotIl_SfAVM/edit) | Written solar-shade plan & priority discrepancy | v2 expands GUI/implementation details; keep original |

## Evidence caveats
- The source repository may change after inspection. Confirm SHA and branch at implementation time.
- No UI was clicked in a browser. The GUI audit is evidence-based on component and service source, not a claim that every missing interface is absent across the whole app.
- Physical chicken roosting observation was *already roosting by 4:18*, not confirmed first roost at 4:18. The earlier Drive document expresses first-roost as though exact; v2 corrects data modeling without rewriting history.
- Workbook solar values are approximate calculated city-center events; actual property requires keeper-configured coordinates. Forecast data is not a live feed here.

## Public source links
- NWS API: https://www.weather.gov/documentation/services-web-api
- NWS CAP alerts: https://www.weather.gov/documentation/services-web-alerts
- NOAA solar calculator: https://gml.noaa.gov/grad/solcalc/
- UC Davis poultry nutrition: https://cvet.vetmed.ucdavis.edu/sites/g/files/dgvnsk13661/files/inline-files/CVET%20Avian%20and%20Exotics%20Animal%20Care%20and%20Feeding%20Guide%20010725_0.pdf
- Alabama Extension: https://www.aces.edu/blog/topics/farming/backyard-small-poultry-flock-management-series-feeding-the-laying-hen/
- UMN poultry heat: https://extension.umn.edu/agriculture/animals-and-livestock/poultry/preventing-heat-stress-in-poultry
- Open-Meteo terms: https://open-meteo.com/en/terms
