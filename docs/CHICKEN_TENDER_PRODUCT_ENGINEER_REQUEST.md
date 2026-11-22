# Request to Product Engineering - Chicken Tender coop electronics and door models

**Document ID:** TC-CHKN-PE-REQ-001 | **Date:** 2026-11-20 | **From:** Zach Goodbody (WeCr8) | **Status:** Open

We are building the first real Chicken Tender coop at home (replacing an old coop, built with
kids). The structure is in `docs/CHICKEN_TENDER_BUILD_GUIDE.md`; the electronics are the
Starter door controller (`hardware/chicken-tender-starter`, PR #180) plus the Pro coop
sensor/feeder controller (`firmware/chicken-tender`, fixes in the PR stacked on #180).
Single pinout sheet: `docs/CHICKEN_TENDER_PINOUT.md` (same stacked PR).

Please produce the four deliverables below. Keep them low cost and buildable with hand tools
and a hobby 3D printer.

## Deliverables

| # | Deliverable | Format | Notes |
|---|---|---|---|
| 1 | **KiCad schematic** for the control box: (a) Starter door controller, (b) Pro coop controller | KiCad 8 project (`.kicad_pro/.kicad_sch`), PDF export | (a) already exists as a generated netlist: start from `hardware/chicken-tender-starter/out/netlist.net` and `hw/chicken-tender-starter.hw.yaml`, do not re-invent it. (b) is new: from the pinout table below |
| 2 | **Sourced parts list** | CSV + Markdown (same columns as `hardware/chicken-tender-starter/out/BOM.md`: ref, part, MPN, vendor URL, qty, unit price, price date, checked/estimate) | Pick the Starter linear actuator listing (>= 290 mm stroke, >= 150 N, built-in limits, IP54+, M6 pin holes); prices with the date you checked them |
| 3 | **Electronics enclosure** | STEP + STL (+ source CAD) | Outdoor, mounted on the outside of the coop back wall under a 6 in roof overhang |
| 4 | **Door mechanism model** | STEP + STL (+ source CAD) | cord-lift pop door: actuator mount, clevis bracket, cord eye, door anchor, reed mounts, guide segments |

## Pinout (settled)

**Door controller - Seeed XIAO ESP32-S3** (`seeed_xiao_esp32s3`, firmware `chicken-tender-starter`)

| Pin | Net | To |
|---|---|---|
| D0 | MOT_EN | DRV8874 EN/IN1 (20 kHz PWM) |
| D1 | MOT_PH | DRV8874 PH/IN2 (HIGH = retract = open) |
| D2 | DRV_nFAULT | DRV8874 nFAULT (pull-up) |
| D3 | DRV_CS | DRV8874 CS (~1.1 V/A) |
| D4 | DHT_DATA | DHT22 / AM2302 single-wire (10 k pull-up to 3V3); D5 spare. The I2C DHT20 was dropped 2026-11-22 (I2C is unreliable on the ~3.8 m run) |
| D6 | spare | (toggles at boot - not a motor input) |
| D7 | DRV_EN_RAW | NC E-STOP contact 1 -> DRV8874 SLEEP |
| D8 | REED_CLOSED | door-closed reed to GND |
| D9 | REED_OPEN | door-open reed to GND |
| D10 | ESTOP_SENSE | SLEEP node after the E-STOP |
| 5V | V5_XIAO | Pololu D36V6F5 5 V via 1N5817 |

Power: 12 V 3 A Class 2 adapter -> 5.5 x 2.1 panel jack -> 3 A blade fuse -> DRV8874 VIN and
D36V6F5 VIN only. DRV8874 current limit ~2.0 A (20 k VREF to GND), PMODE to GND.

**Coop sensor / feeder controller - ESP32-WROOM-32 DevKit V1** (`esp32doit-devkit-v1`, firmware `chicken-tender`)

| GPIO | Function | To |
|---|---|---|
| 4 | DHT22 data | DHT22 (10 k pull-up to 3V3) |
| 35 | MQ-137 analog | MQ-137 AOUT via **15 k top / 12 k bottom** divider, **100 nF** GPIO35-GND (5.0 V -> 2.22 V) |
| 13 | door servo | not fitted when the XIAO door controller is used |
| 33 | stepper ENABLE (active LOW) | TB6600 ENA- (add 10 k pull-up so it stays disabled at boot) |
| 14 / 27 | stepper STEP / DIR | TB6600 PUL- / DIR- |
| 26 / 25 | feeder motor ON / DIR | second DRV8874 EN / PH (12 V gearmotor) |
| 32 | NC E-STOP sense | NC contact 2 -> GND (internal pull-up) |
| VIN | 5 V | 5 V buck from the 12 V rail (MQ-137 heater ~180 mA at 5 V) |

One 22 mm mushroom E-STOP with **two NC contact blocks** serves both boards.

## Mounting dimensions (from the build guide)

Coop: 48 x 48 in outside, floor surface 28-1/4 in above ground, front wall top 72 in, back wall
top 60 in, walls 15/32 in plywood on 2x4 corner posts (1.5 x 3.5 in), 2x2 top nailers
(1.5 x 1.5 in). Roof: corrugated steel on 2x4 rafters, 6 in overhang at the back.

**Enclosure (deliverable 3)**
- Mounts on the outside of the back wall (15/32 in plywood), upper right; top of box ~56 in above
  ground, 4 in clear below the roof overhang; fixed with #8 x 3/4 in exterior wood screws through
  4 external mounting ears (wood screws only reach 15/32 in ply - use through-bolts or a 2x2
  backer inside if the box is heavy).
- Holds: XIAO ESP32-S3, DRV8874 carrier, D36V6F5, fuse holder, 2 x 5.08 mm 2-pos terminals,
  panel DC jack; Pro option: ESP32 DevKit V1 (30-pin, ~51 x 28 mm), 5 V buck, second DRV8874,
  TB6600 (optional, ~96 x 56 x 33 mm) - either one larger box or a Starter box + clip-on Pro box.
- 22 mm E-STOP hole in the lid, reachable from the front.
- 3 x PG7 glands on the **bottom face** (cables exit down into the wall through glands), no
  openings on top; rain lip on the lid; drip loop clearance.
- Rated IP54 or better; PETG/ASA (UV) for printing; M3 heat-set inserts (BOM uses CNC Kitchen /
  Ruthex M3 standard, L 5.7, OD 4.6).
- Separate small sensor housings for inside the coop: DHT22 and MQ-137 (vented, with a
  1/2 in hardware-cloth guard; the MQ-137 heater makes the sensor cap hot - keep plastic clear of it),
  mounted on the left side wall 12-14 in above the coop floor.

**Door mechanism (deliverable 4)**
- Pop door opening in the front wall: **10 in wide x 11 in tall**, sill 2-1/2 in above the coop
  floor (30-3/4 in above ground). Door panel 12 x 13 in, 15/32 in plywood, under 1 kg.
- Door slides in 2x2 + 1x2 wooden guides on the inside of the front wall (1/8 in slack), or
  printed guide segments if you prefer; travel **280 mm (11 in)**.
- Actuator lies **horizontally along the inside top of the front wall** on a 2x4 mounting board
  screwed to the two front posts (41 in clear between the posts), ~3 in below the 2x2 top
  nailer. Clevis brackets for M6 pins at both ends; 300 mm stroke actuator, retracted length
  per the chosen listing.
- Cord (1.8 mm Dyneema) from the rod end through a **cord eye centered over the door** (~6 in
  above the open-door top edge) down to a **door anchor** on the door's top edge. Retract = door
  up; extend = door falls closed by gravity (never pushes down on a hen).
- **Reed mounts**: magnet on the door edge; closed reed at the bottom of a guide, open reed at
  +280 mm.
- A manual-release / hand-open position (pull pin) for power cuts.

## Acceptance

- Schematic nets match `docs/CHICKEN_TENDER_PINOUT.md` exactly (or the PR updates both).
- ERC clean in KiCad; DRC n/a (no PCB yet unless you think a carrier board is cheaper).
- Parts list totals with price dates; no unsourced line without "estimate".
- STEP files open in Onshape; STL printable without supports where possible, 0.2 mm layers.
- Door model shows the full 280 mm travel without hitting the nailer, roof or guides.

## Questions for Product Engineering
1. One enclosure for Starter + Pro, or two? (We lean two: cheap Starter box, Pro clip-on.)
2. Is a small carrier PCB (XIAO + DRV8874 + regulator + terminals) cheaper than hand wiring at
   qty 1-10?
3. Any objection to the 15 k / 12 k MQ-137 divider (we chose it to stay in the ESP32's
   150-2450 mV accurate ADC range)?
