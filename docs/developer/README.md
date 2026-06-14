# TenderCells Developer Documentation

Target audience: software developers, firmware contributors, hardware builders, simulation authors, educators, and integrators. For product-by-product build documentation, start with [Product Documentation](../products/README.md).

This page is the TenderCells developer hub. It follows the same broad documentation pattern that makes FarmBot approachable: one place for quick links, software architecture, APIs, firmware, hardware, simulation, licensing, security, and next steps.

## Quick Links

| Area | Start here |
| --- | --- |
| Live demo | [Public demo](https://tendercells.com/app/demo) |
| Source code | [GitHub repository](https://github.com/WeCr8/TenderCells) |
| Contributing | [CONTRIBUTING.md](../../CONTRIBUTING.md) |
| Security | [SECURITY.md](../../SECURITY.md) |
| License | [Apache-2.0](../../LICENSE) |
| Hardware | [Hardware developer index](./hardware.md) |
| Product ideas | [Product ideas and visual asset index](./product-ideas.md) |
| Product docs | [Product documentation index](../products/README.md) |
| Product standard | [Product documentation standard](../PRODUCT_DOCUMENTATION_STANDARD.md) |
| Demo testing | [Demo environment testing](../../applications/tendercells_ui/test_output/tendercells-ui/docs/testing/demo-environment-testing.md) |
| Production readiness | [Production readiness](../../applications/tendercells_ui/test_output/tendercells-ui/docs/production-readiness.md) |

## System Overview

TenderCells is a local-first animal-care automation platform:

- Website and public demo: `applications/tendercells_ui/test_output/website`
- Main web app: `applications/tendercells_ui/test_output/tendercells-ui`
- Product API prototype: `applications/tendercells_ui/test_output/express-api`
- Firmware targets: `firmware/chicken-tender`, `firmware/roaming-roost`, and `firmware/watchtower`
- Product documentation: `docs/products`
- Hardware catalogs and workbooks: `docs/CHICKEN_TENDER_HARDWARE_CATALOG.md`, `docs/CHICKEN_TENDER_MASTER_SPEC.md`, and tracked Excel workbooks in `docs/`

The app intentionally separates high-latency cloud workflows from safety-critical local control. Real hardware motion belongs on MQTT/local controllers with E-STOP behavior, watchdogs, and manual override paths.

## Web App

The active app is a Vite/React dashboard with product registry, property layout, schedules, flock data, egg maps, settings, and a public no-signup demo.

Common commands:

```bash
cd applications/tendercells_ui/test_output/tendercells-ui
npm install
npm run dev
npm run build
npm run quality:loop
```

Public demo build:

```bash
cd applications/tendercells_ui/test_output/website
npm run build:with-app
```

Public demo builds must leave `VITE_FIREBASE_PROJECT_ID` unset so visitors use browser-local demo state instead of live Firestore.

## API And Message Broker

Current API work lives in `applications/tendercells_ui/test_output/express-api`. Treat those routes as an integration surface under active development, not a final public contract.

Hardware control should use a local message broker contract:

- Telemetry topics report sensors, device state, fault state, and heartbeat.
- Command topics request door, feed, water, cleaning, lighting, and sensor actions.
- E-STOP topics must be retained and high priority.
- Firmware must reject unsafe commands when interlocks, watchdogs, or sensor checks fail.

When adding or changing topics, update the product folder's `api-mqtt.md` file and add tests or simulator coverage where possible.

## Firmware

Firmware targets use PlatformIO-style ESP32 projects.

```bash
cd firmware/chicken-tender
pio run
```

Expected firmware docs per product:

- Board and MCU.
- Pinout revision.
- Sensor and actuator list.
- MQTT topics and payload schema.
- E-STOP and watchdog behavior.
- Manual override behavior.
- Hardware validation checklist.

## Hardware

Use [Hardware developer index](./hardware.md) as the canonical hardware entrypoint. It links the current catalog, workbook, firmware targets, and product documentation standard.

Use [Product ideas and visual asset index](./product-ideas.md) to see which images are already available for demos, product pages, good-first-issues, and build prompts.

Each hardware contribution should add or update the relevant product folder:

```text
docs/products/<product-slug>/
  README.md
  bom.md
  wiring.md
  firmware.md
  assembly.md
  troubleshooting.md
  api-mqtt.md
  safety-validation.md
  simulation.md
```

## Simulation

Simulation lets contributors add product families before they have hardware. The public demo seeds product families, flocks, egg maps, schedules, property layout, and equipment readouts from local data.

Start with:

- `applications/tendercells_ui/test_output/tendercells-ui/src/services/demo/demoEnvironment.ts`
- `applications/tendercells_ui/test_output/tendercells-ui/src/services/birdsService.ts`
- `applications/tendercells_ui/test_output/tendercells-ui/docs/testing/demo-environment-testing.md`

## Licensing

Repository software is Apache-2.0 unless a file or third-party asset states otherwise. Hardware documentation and external assets may have their own terms; keep attribution near the files, as done in `applications/tendercells_ui/test_output/tendercells-ui/docs/third-party-attribution.md`.

## What Is Next?

- Fill product folders for WatchTower AI, Roaming Roost, and common modules.
- Promote API/MQTT contracts from examples into per-product docs.
- Add hardware photos, wiring diagrams, and CAD/STL source files.
- Add firmware validation reports for each controller.
- Add more simulator examples that can become good-first-issues.
