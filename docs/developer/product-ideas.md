# Product Ideas And Visual Asset Index

This page lists the current visual assets that can help contributors understand what TenderCells products and modules can become. Use it when proposing new products, writing good-first-issues, or adding product documentation.

## Current Visual Assets

| Asset | Path | Use it for |
| --- | --- | --- |
| Door/device CRUD demo | `applications/tendercells_ui/test_output/website/public/assets/images/demos/door-device-crud-demo.png` | Door kits, latch controllers, device registry, live hardware vs simulation states. |
| Coop camera demo | `applications/tendercells_ui/test_output/website/public/assets/images/demos/coop-camera-demo.png` | Camera modules, coop monitoring, WatchTower integration, remote inspection. |
| ChickenEye eggs demo | `applications/tendercells_ui/test_output/website/public/assets/images/demos/chickeneye-eggs-demo.png` | Egg-map modules, nest-box detection, vision AI, flock production analytics. |
| Animal roster demo | `applications/tendercells_ui/test_output/website/public/assets/images/demos/animal-roster-demo.png` | Flock identity, health profiles, RFID, weigh stations, per-animal records. |
| Roaming Roost SVG | `applications/tendercells_ui/test_output/tendercells-ui/public/assets/images/products/roaming-roost.svg` | Mobile coops, pasture rotation, drive bases, autonomous docking, GPS boundaries. |

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
