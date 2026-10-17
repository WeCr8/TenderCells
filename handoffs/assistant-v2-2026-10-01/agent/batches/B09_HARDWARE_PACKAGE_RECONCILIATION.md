# B09 — Feeder + DoorCell Hardware Package Reconciliation

The two engineering packages are included under `hardware/`.

This batch is intentionally split into small PRs.

## B09-A Inventory and contracts

Read:
- `hardware/README.md`
- `hardware/integration/FEEDER_INTEGRATION.md`
- `hardware/integration/DOORCELL_INTEGRATION.md`

Compare each package against:
- current TenderCells MQTT contract;
- current product documentation standard;
- Builder asset IDs/schemas;
- firmware safety rules.

Deliver a mismatch/reconciliation report before importing implementation code.

## B09-B DoorCell → existing door book

Use the DoorCell package to audit the existing Chicken Tender Door concept book.

Do not remove `concept: true` yet.

Produce:
- page-by-page mismatch list;
- real BOM mapping;
- part-ID mapping;
- wiring/pinout conflicts;
- test prerequisites.

## B09-C Feeder product integration

Reuse the feeder package's existing app/digital-twin work where compatible.

Do not build a second:
- model uploader;
- GLB loader;
- Firebase asset service;
- device state system.

First integration should be read/visualization/simulation.

## B09-D Builder hardware books

After B09-A/B/C:
- DoorCell verified book
- Smart Feeder book

Use one-action-per-screen format and stable asset IDs.

## B09-E Validation

Do not mark instruction-ready until applicable engineering and safety tests are actually executed and recorded.

## Hard rules

- STEP authority beats GLB for manufacturing.
- DoorCell remains prototype status until tests pass.
- Feeder MCU/pinouts must be reconciled explicitly.
- No cloud-direct actuator path.
- Do not introduce a second product/twin/content system.
