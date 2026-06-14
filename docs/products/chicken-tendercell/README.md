# Chicken TenderCell

## Summary

- Product family: Chicken TenderCell
- Product type: automated coop system
- Intended animals/use case: backyard chickens, coop automation, feeding, water, cleaning, egg mapping, cameras, doors, latches, motors, and rails
- Build status: open-source concept / local prototype
- Hardware revision: demo and builder prototypes

Chicken TenderCell is the first TenderCells OS hardware cell. It is not meant to lock builders into one robot, one camera, or one controller forever. The goal is an open-source animal-care OS where builders can test different robot arms, gantries, end effectors, camera systems, health sensors, and edge controllers while keeping shared safety, MQTT, registry, and routine contracts.

Public framing: buy a TenderCells kit/product from us when official hardware becomes available, or use the developer docs to make your own Chicken TenderCell-compatible hardware and insert it into the TenderCells OS with a product record, MQTT topics, safety metadata, and a custom 3D/GLB asset.
- Firmware target: ESP32 coop controller
- Firmware contract version: pending
- Pinout revision: pending
- CAD revision: placeholder coop presets until full assembly is finalized

## Current MVP

- Firebase-authenticated dashboard.
- Product and device registry.
- Local dev fallback when Express API on port 4000 is unavailable.
- Coop CAD/camera view toggle.
- Door, latch, motor, rail, swappable robot arm, sensors, feeding, water, waste, egg map, schedule, property, health, camera, and device sections.
- Placeholder coop presets for 3x3x5, 4x4x6, and 6x6x8 development.
- Jetson Nano-class edge AI path for local camera inference, animal health monitoring, and robotics experiments.
- Barn Brain compatibility for local MQTT, routines, safety events, device registry, and offline-first farm automation.

## Open Robotics And Edge AI Direction

Chicken TenderCell should support community hardware as long as it preserves safety contracts. Builders may experiment with:

- Different robot arms or gantry layouts.
- End effectors for cleaning, egg handling, inspection, water, feed, and health checks.
- Camera systems for ChickenEye, nest-box monitoring, predator context, and animal headcount.
- Health-monitoring sensors such as weight, temperature, humidity, air quality, visual behavior checks, and last-seen status.
- Jetson Nano-class edge AI controllers, with Jetson Orin Nano Super as the preferred current NVIDIA developer-kit path for new camera/robotics prototypes.
- Barn Brain as the local farm automation brain for MQTT, routines, safety events, device registry, and offline-first operation.
- Custom 3D/GLB assets inserted into the OS product registry so community hardware can appear in simulation and product views.

## Immediate Validation

- Register the first demo or local prototype Chicken TenderCell product.
- Link first hardware controller as `ct_001`.
- Confirm MQTT base topic `tc/ct_001/...`.
- Test E-STOP before any moving hardware.
- Simulate rail and door movement before physical actuation.
- Document wiring and pinout before field deployment.

## Required Docs

- [ ] BOM
- [ ] Wiring diagram or pinout
- [ ] CAD/STL/source model files
- [ ] Firmware setup
- [ ] Assembly instructions
- [ ] Troubleshooting guide
- [ ] API/MQTT documentation
- [ ] Safety validation notes
- [ ] Simulation notes
