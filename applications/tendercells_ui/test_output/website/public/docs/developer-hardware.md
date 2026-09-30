<!-- Generated from docs/developer/hardware.md by website/scripts/sync-docs.mjs - edit the source, then run npm run sync:docs. -->

# TenderCells Hardware Developer Index

This is the hardware entrypoint for builders. The goal is FarmBot-style clarity: a contributor should know what hardware exists, where the bill of materials lives, which firmware target drives it, and what documentation is still missing.

## Current Hardware Coverage

| Product or module | Status | Hardware docs | Firmware | Notes |
| --- | --- | --- | --- | --- |
| Chicken TenderCell | Primary reference | [Hardware catalog](/docs/hardware-catalog), [master spec](/docs/chicken-tender-master-spec), [product folder](/docs/chicken-tender) | `firmware/chicken-tender` | Best documented product family today. |
| WatchTower AI | Early hardware list | [Hardware catalog section](/docs/hardware-catalog#16-watchtower-ai-hardware), `docs/TenderCells_Predator_Monitor_Hardware_List.xlsx` | `firmware/watchtower` | Needs product folder with BOM, wiring, firmware, and safety validation. |
| Roaming Roost | Early product docs | [Product folder](/docs/roaming-roost), [hardware catalog compatibility](/docs/hardware-catalog#2-compatible-product-families) | `firmware/roaming-roost` | Needs a full BOM and wiring guide. |
| Rail and tool changer | Cataloged concept | [Rail system section](/docs/hardware-catalog#13-tendercells-rail-system-motion-platform), [tool changer section](/docs/hardware-catalog#15-tool-changer-system) | Prototype only | Must include E-STOP, limits, homing, and no-go-zone validation before field use. |
| Common sensors | Cataloged | [Environmental sensors](/docs/hardware-catalog#12-environmental-monitoring-sensors), [feed](/docs/hardware-catalog#10-feed-system), [water](/docs/hardware-catalog#11-water-system) | Product-specific | Use standard sensor names and units across telemetry. |
| Power and networking | Cataloged | [Solar power](/docs/hardware-catalog#18-solar-power-system), [networking](/docs/hardware-catalog#19-networking--communication), [control box](/docs/hardware-catalog#20-control-box-hardware) | Product-specific | Needs installation photos and field validation notes. |

## Hardware Contribution Checklist

- Add or update `docs/products/<product-slug>/README.md`.
- Add a BOM with preferred and substitute parts.
- Add wiring or pinout documentation.
- Link CAD, STL, STEP, or source model files.
- Link the matching firmware target.
- Document the simulator representation.
- Add safety validation for motion, water, heat, electricity, predator response, and animal entrapment risks.
- State maturity: `simulation-only`, `garage-test`, `beta`, or `field-ready`.

## Standard Product Folder

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

Use [Product Documentation Standard](/docs/product-documentation-standard) as the acceptance checklist.

## Safety Baseline

Before any contributor marks a product as beta or field-ready:

- E-STOP behavior is documented and tested.
- Manual override is documented and reachable without cloud access.
- Moving parts have timeout, limit, and interlock behavior.
- Water, heat, and power faults fail safe.
- Network loss leaves the animal-care system in a known state.
- The app clearly distinguishes simulation controls from live hardware controls.
