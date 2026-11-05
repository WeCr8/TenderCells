# Rover Platform Family (S / M / L)

## Summary

- Product family: Rover platform (shared base for Weed Rover, Roaming Roost drive and community builds)
- Product type: mobile robot base
- Intended use case: property patrol, weed scouting, camera/sensor carrier, classroom and maker builds
- Build status: simulation-only (design in progress; nothing printed or field-tested yet)
- Hardware revision: rev A2 (in progress)
- Firmware target: XIAO ESP32-S3 drive controller (Starter); Pi 5 / Jetson Orin Nano companion (Plus / Pro)
- Firmware contract version: same `tc/<id>/cmd/drive` topics as the Starter Node `drive` peripheral
- Pinout revision: pending (rev A2 pin map not published yet)
- CAD revision: rev A2 in progress

Electronics levels (Starter / Plus / Pro) are a separate axis from size. See
[TIERS.md](../TIERS.md) for the size × tier matrix.

## Sizes

| Size | What it is | Drive | Chassis |
| --- | --- | --- | --- |
| **Small (S)** | The current TT-motor printed rover | 4× TT gear motors, skid-steer | Fully 3D-printed |
| **Medium (M)** | 1/10-style rover | Donor 1/10 RC running gear (12 mm hex wheels) | **Fully 3D-printed** 1/10-style chassis |
| **Large (L)** | 1/8-style rover | Donor 1/8 RC running gear (17 mm hex wheels) | **Fully 3D-printed** 1/8-style chassis |

All three sizes share the same design style, mount interface and electronics bays, scaled up.

## Donor RC vehicles: parts only

Medium and Large are **not** "buy an RC car and bolt a plate on top". A donor RC vehicle is
harvested only for parts, which then mount to the printed chassis:

- wheels/tires and 12 mm (1/10) or 17 mm (1/8) hex hubs
- shocks
- axles / differentials (where practical)
- steering servo
- motor and ESC
- RC receiver / transmitter
- battery

Interfaces are **generic** (hex size, shock eye spacing, servo horn, motor mount pattern,
battery tray), so any brand's parts can fit. Redcat is only one example donor, not a
requirement or a supported SKU.

## Control: RC radio is optional

- **Computer-only operation must work.** No RC radio is required at any tier.
- If an RC radio is fitted, an **RC / computer mux** selects which one drives the ESC and
  steering. Both paths fail to neutral (stopped) on signal loss; the computer path also keeps
  the existing ~1.5 s drive deadman.
- E-STOP behaviour is the same as every TenderCells mover (latched, cleared from the OS).

## Required bays and power safety

- **Raspberry Pi 5 bay** and **Jetson Orin Nano bay** are part of the platform design
  (mounts, port access, cooling airflow and keep-outs), even when the board is not fitted.
- **LiPo** (adult-only step): low-voltage cutoff (LVC) on the ESC or a battery monitor, and a
  main fuse at the battery lead sized to the wiring. Kid builds of Small stay on AA NiMH.
- Compute boards get their own regulated supply (BEC), never straight off the pack.
  Electrical ratings must be checked against vendor data before release.

## Related docs

- [Classroom door + basic Roaming Roost](../../CLASSROOM_DOOR_AND_ROAMING_ROOST.md): a 2-servo
  lesson rover; uses the same drive topics but is not the Small rover.
- [Weed Patrol](../../WEED_PATROL.md): Weed Rover scout/laser builds.
- [Robot exclusion zones](../../ROBOT_EXCLUSION_ZONES.md)
- [Roaming Roost](../roaming-roost/README.md)

## Required Docs

- [ ] BOM per size and tier
- [ ] Wiring diagram or pinout (rev A2 pin map, mux, LVC/fuse)
- [ ] CAD/STL/source model files
- [ ] Firmware setup
- [ ] Assembly instructions
- [ ] Troubleshooting guide
- [ ] API/MQTT documentation
- [ ] Safety validation notes
- [ ] Simulation notes

## Safety Notes

Moving hardware with pinch points at wheels and steering; LiPo fire risk (adult-only charging
and wiring); laser builds follow the Weed Patrol rules. A rover never boots moving, stops on
lost commands, and honours property boundary and no-go zones.
