# Chicken TenderCell

## Summary

- Product family: Chicken TenderCell
- Product type: automated coop system
- Intended animals/use case: backyard chickens, coop automation, feeding, water, cleaning, egg mapping, cameras, doors, latches, motors, and rails
- Build status: garage-test
- Hardware revision: first garage build
- Firmware target: ESP32 coop controller
- Firmware contract version: pending
- Pinout revision: pending
- CAD revision: placeholder coop presets until full assembly is finalized

## Current MVP

- Firebase-authenticated dashboard.
- Product and device registry.
- Local dev fallback when Express API on port 4000 is unavailable.
- Coop CAD/camera view toggle.
- Door, latch, motor, rail, robot arm, sensors, feeding, water, waste, egg map, schedule, property, and device sections.
- Placeholder coop presets for 3x3x5, 4x4x6, and 6x6x8 development.

## Immediate Validation

- Register first garage Chicken TenderCell product.
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
