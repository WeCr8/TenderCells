# Chicken Tender Starter - hardware (rev A1)

Door controller for a backyard coop: a Seeed XIAO ESP32-S3 drives a 12 V linear actuator through a
Pololu DRV8874 carrier to **lift** a cord-hung door. Closing only pays the cord out, so the door falls
under its own weight and never pushes down on a chicken. Firmware: `firmware/chicken-tender-starter`.

* Product tiers (Starter / Plus / Pro): [TIERS.md](TIERS.md)
* BOM per actuator tier: [out/BOM.md](out/BOM.md) (`out/bom_starter.csv`, `out/bom_pro.csv`)
* Electrical checks: [out/ELECTRICAL_CHECKS.md](out/ELECTRICAL_CHECKS.md)
* Wiring: [out/wiring.svg](out/wiring.svg), netlist `out/netlist.json` / `out/netlist.net`
* Source of truth: `hw/chicken-tender-starter.hw.yaml` (schema `hw/tc-hw.schema.json`, tc-hw/1),
  parts catalog `hw/parts.yaml`, Pro overlay `hw/variants/pro.overlay.yaml`

## Actuator tiers

| Tier | Actuator | Firmware env | Travel timeout |
|---|---|---|---|
| Starter | generic 12 V linear actuator, 12 in / 300 mm, built-in limit switches - **verify listing/force** (no ASIN/price chosen) | `xiao_starter` | 55 s |
| Pro | Glideforce LACT12-12V-05 (Pololu #2326) | `xiao_pro` | 14 s |

## Power and safety rules

1. 12 V (Class 2 wall adapter -> panel jack -> 3 A fuse) reaches **only** the fuse, the 12 V terminal,
   the DRV8874 VIN and the D36V6F5 regulator VIN. It never goes to the XIAO or an expansion board.
2. The XIAO runs from the regulator's 5 V through a 1N5817 Schottky (no USB back-feed).
3. The NC E-STOP sits in series in the driver enable line (D7 -> E-STOP -> DRV8874 SLEEP). Pressing it
   or cutting the wire stops the motor in hardware; D10 reads the SLEEP node so the app sees it.
4. Driver current limit ~2.0 A (20 k VREF to GND); firmware jam threshold 1.8 A.
5. Test the E-STOP before connecting the actuator to the door.

## Regenerate and check

```
pip install pyyaml
python hardware/chicken-tender-starter/gen/build_electronics.py --check   # exits 1 on any FAIL
```

## CAD

There is no starter enclosure/door CAD in the repo yet. The printed-parts line in the BOM (box, lid,
plate, clevis bracket, cord eye, door anchor, reed mount, 2 guide segments) is an estimate until the
CAD is added.
