# Product Documentation Standard

Every TenderCells product, module, or community custom build should have enough documentation for a careful builder to assemble, flash, test, repair, and simulate it without direct support.

## Required Product Folder

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

## Required Fields

- Product name and product family.
- Intended animal or property use case.
- Hardware revision.
- Firmware target and firmware contract version.
- Pinout revision.
- CAD revision.
- Supported simulation backend: browser Three.js, Isaac Sim, or both.
- Minimum safety validation before motors, latches, heaters, pumps, or other moving/energized hardware can run.

## Simulation Requirements

- Include a rough physical footprint.
- List movable axes, joints, wheels, doors, latches, pumps, or tool modules.
- Define property placement needs.
- Document obstacle/no-go-zone behavior.
- Include Isaac Sim setup notes if the product has robotics movement.

## Safety Requirements

- Identify pinch, crush, entrapment, water, heat, electrical, and predator-response hazards.
- Define E-STOP behavior.
- Define manual override behavior.
- Define failure states for sensor loss, network loss, low battery, and actuator timeout.
- State whether the product is simulation-only, garage-test, beta, or field-ready.
