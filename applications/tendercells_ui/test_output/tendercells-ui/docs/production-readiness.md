# TenderCells Production Readiness

This tracker turns repair work into production engineering requirements for open-source users, kit builders, and prebuilt unit customers.

## Release Gates

| Gate | Status | Notes |
| --- | --- | --- |
| Local quality loop | Started | `npm run quality:loop` runs build and non-blocking tests, then writes a report. |
| Responsive app shell | Started | Mobile drawer, tablet stacking, safe-area spacing, and themed scrollbars are in place. |
| Product CRUD | Started | Product service has API plus localStorage fallback. Needs API contract tests. |
| Product registry governance | Started | Metadata, consent, safety, versioning, module links, and simulation considerations are in `docs/product-registry-considerations.md`. |
| Property CRUD and simulation | Started | Property size, hardware placement, obstacles, and route preview are available. |
| NVIDIA robotics simulation | Started | Optional simulation metadata and workflow notes are in `docs/nvidia-robotics-simulation.md`. |
| FarmBot-inspired homestead OS | Started | Architecture cues for local OS, firmware, web app, API, broker, SDKs, offline use, simulation, kits, and community docs are in `docs/farmbot-inspired-homestead-os.md`. |
| Device section CRUD | Started | Product-specific side menu sections support local device CRUD. Needs persistence contract docs. |
| Firebase Auth | Started | Email/password and Google are enabled in UI. Needs graceful offline/demo mode hardening. |
| API availability | Partial | UI falls back locally, but express-api health and startup need a one-command workflow. |
| Mobile packages | Planned | PWA-first. Capacitor Android/iOS wrapper documented, not yet installed. |
| Release SHA badge | Planned | Badge placeholder exists. CI should replace with current short SHA on release. |
| Hardware kit docs | Planned | Need BOM, wiring, flashing, pairing, reset, and safety docs per product. |
| First demo coop | Started | `docs/garage-first-coop-build.md` defines `ct_001` with browser-local demo ownership. |

## Product Engineering Needs

### Chicken Tender

- Coop preset placeholders must match future CAD/solid assembly dimensions.
- Door/latch, rail/motor, robot arm, sensor, feed, waste, and egg map sections need API-backed CRUD.
- Camera view needs pairing flow, camera health, and recording/storage policy.
- Emergency stop needs firmware/API contract and logged acknowledgement.

### Roaming Roost

- Property layout obstacles must feed route planning.
- Simulation needs route constraints, docking behavior, no-go zones, battery, and stuck detection.
- Kit docs need motor controller, wheel/track drive, battery, charging, and enclosure requirements.

### Predator Monitor / WatchTower

- Camera and detection sections need model/event CRUD.
- Alert routing needs SMS/email/push policy.
- Solar/battery telemetry needs firmware contract and low-power behavior.

### Shared Platform

- Product registration, QR pairing, firmware version display, and update status.
- TenderCells OS runtime split between firmware, edge runtime, web app, API server, message broker, SDKs, scripting, and simulation adapters.
- Product metadata validation for telemetry consent, safety status, parent-child module links, simulation backend, asset licensing, and revision tracking.
- Local demo mode with no hardware attached.
- Export/import property and product config for community sharing.
- Clear license, contribution guide, code of conduct, and safety disclaimer.
- BOM with affiliate/kit/prebuilt distinctions.

## CI Targets

- UI build: `npm run build`.
- UI quality loop: `npm run quality:loop`.
- Firmware compile per product.
- Secret scan excluding `.env` but catching committed keys.
- Release job that stamps SHA badge and attaches built artifacts.

## Next Native Packaging Tasks

- Add Capacitor only after PWA workflows are stable.
- Generate Android debug and release SHA fingerprints.
- Register Android app in Firebase.
- Register iOS bundle in Firebase.
- Keep keystores and Apple provisioning outside git.
