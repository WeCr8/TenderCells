# Product Documentation Index

Each TenderCells product or community module should get its own folder here.

For the broader software, firmware, hardware, API, and simulation entrypoint,
start with the [Developer Documentation](../developer/README.md). For the
current hardware coverage map, see the [Hardware Developer Index](../developer/hardware.md).

Recommended structure:

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

Current priority product families:

- `chicken-tendercell`
- `watchtower-ai`
- `roaming-roost`
- `coop-door-kit`
- `water-monitor`
- `feed-monitor`
- `community-custom`

Use `docs/PRODUCT_DOCUMENTATION_STANDARD.md` as the acceptance checklist.
