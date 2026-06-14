# Product Ideas And Visual Asset Index

This page lists the current visual assets that can help contributors understand what TenderCells products and modules can become. Use it when proposing new products, writing good-first-issues, or adding product documentation.

## Current Visual Assets

| Asset | Path | Use it for |
| --- | --- | --- |
| Door/device CRUD demo | `applications/tendercells_ui/test_output/website/public/assets/images/demos/door-device-crud-demo.png` | Door kits, latch controllers, device registry, live hardware vs simulation states. |
| Chicken Tender concept render | `applications/tendercells_ui/test_output/website/public/assets/images/products/chicken-tender-concept.png` | Physical Chicken Tender coop preview, automated service-side hardware, rail/arm concept. |
| Predator monitor pole render | `applications/tendercells_ui/test_output/website/public/assets/images/products/predator-monitor-pole-mount.png` | WatchTower/predator monitor product card and physical appearance reference. |
| Predator monitor top view | `applications/tendercells_ui/test_output/website/public/assets/images/products/predator-monitor-top-view.png` | 360-degree camera cradle layout and camera carrier discussion. |
| Predator monitor split view | `applications/tendercells_ui/test_output/website/public/assets/images/products/predator-monitor-split-view.png` | ESP32, battery, solar, and camera placement inside the monitor head. |
| Predator monitor early sketch | `applications/tendercells_ui/test_output/website/public/assets/images/products/predator-monitor-sketch-idea.png` | Early housing concept and design discussion. |
| Coop camera demo | `applications/tendercells_ui/test_output/website/public/assets/images/demos/coop-camera-demo.png` | Camera modules, coop monitoring, WatchTower integration, remote inspection. |
| ChickenEye eggs demo | `applications/tendercells_ui/test_output/website/public/assets/images/demos/chickeneye-eggs-demo.png` | Egg-map modules, nest-box detection, vision AI, flock production analytics. |
| Animal roster demo | `applications/tendercells_ui/test_output/website/public/assets/images/demos/animal-roster-demo.png` | Flock identity, health profiles, RFID, weigh stations, per-animal records. |
| Roaming Roost SVG | `applications/tendercells_ui/test_output/tendercells-ui/public/assets/images/products/roaming-roost.svg` | Mobile coops, pasture rotation, drive bases, autonomous docking, GPS boundaries. |

## Current CAD Concept Source

The June 2026 concept zip added SolidWorks/STEP source material for the Chicken Tender cell under `docs/products/chicken-tendercell/cad/`:

| CAD asset | Meaning |
| --- | --- |
| `72x72_Chicken_Tender_Cell.SLDASM` | Main Chicken Tender cell assembly concept. |
| `Chicken_Tender_Cell_72SQ.SLDPRT` | 72-inch square cell body concept. |
| `Chicken_tender_X_Rails.SLDPRT` | X-axis rail part concept. |
| `Chicken_tender_Y_Rail.SLDPRT` | Y-axis rail part concept. |
| `Chicken_tender_Z_Rails.SLDPRT` | Z-axis rail part concept. |
| `Chicken_tender_6DOF_Mounting_Plate.SLDPRT` | Robot arm / 6DOF mounting plate concept. |
| `UR3e.step` | Universal Robots UR3e reference model with third-party terms. |

Keep CAD source files in product docs or CAD folders, and generate web-friendly PNG/WebP renders for website pages.

## Product Ideas Builders Can Make

| Idea | Starting asset | First useful contribution |
| --- | --- | --- |
| Coop door kit | Door/device CRUD demo | `docs/products/coop-door-kit/README.md`, BOM, pinout, MQTT topic contract. |
| Nest box egg sensor | ChickenEye eggs demo | `docs/products/nest-box-egg-sensor/README.md`, sensor options, simulator notes. |
| Camera inspection node | Coop camera demo | WatchTower product folder, camera BOM, enclosure notes, sample events. |
| Flock RFID station | Animal roster demo | RFID reader wiring, data model, animal profile UI issue. |
| Mobile pasture roost | Roaming Roost SVG | Roaming Roost BOM, wheel/drive wiring, docking and boundary safety notes. |
| Water quality monitor | Door/device CRUD demo | pH/turbidity sensor list, leak/freeze fail-safe docs, MQTT telemetry schema. |
| Feed level monitor | Door/device CRUD demo | Load-cell BOM, calibration guide, low-feed alert contract. |
| Predator alert relay | Coop camera demo | WatchTower-to-coop MQTT alert contract and E-STOP-safe response behavior. |

## Rules For Adding New Visuals

- Prefer real product photos, screenshots, CAD renders, or generated concept images tied to a documented module.
- Put reusable website images under `applications/tendercells_ui/test_output/website/public/assets/images/`.
- Put app-only product assets under `applications/tendercells_ui/test_output/tendercells-ui/public/assets/images/products/`.
- Add every new asset to this index with a path and intended use.
- Avoid unlabeled decorative images; every visual should help a builder understand a product, subsystem, or contribution path.
