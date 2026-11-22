# Chicken Tender: under-coop electronics bay (draft, 2026-11-22)

**Status:** draft for review. The CAD is `cad/chicken-tender-coop/showcase/ebay.py`, with parameters in `ebay_params.py`. It is wired into `sc_model.parts()`, so the STEP, GLB, USD and render outputs pick it up. `EBAY=0` brings back the old back-wall control box.
Hand-calcs only, nothing has been tested on hardware. **ASSUMED** marks any value that doesn't come from PR #188 or #189 (part sizes, prices, the pin proposals).

## Why move the electronics
- The build-guide s7 control box (outside the back wall, top at 56 in) clashed with the cleanout door. Only a 6 in strip was left beside it, and the bigger SD2 back service door now takes that whole wall.
- Under the raised coop is shaded, out of the rain (the pit pan acts as a roof) and inside the predator skirt. It is also close to the motors that need the most current (the cassette gearmotor, and the gantry cable chain on the left wall).

## Layout
| Item | Where | Size / numbers |
|---|---|---|
| **EB1**: door + sensor box (all tiers) | Under the back-left of the pit pan, x 165..465 mm (its hanger legs clear the back-left post) | IP66 polycarbonate box **300 x 200 x 130 mm**, clear hinged lid, mounting plate (**ASSUMED** generic size class) |
| **EB2**: motion box (Plus/Pro) | Under the back-right of the pan, x 754..1054 mm | Same box |
| Cassette worm gearmotor | Between the two boxes, x 580..680 | 115 mm gap to EB1 and 75 mm to EB2 in x |
| Box bottom (stowed) | 171 mm (6.7 in) above grade | Gland tips at 6.0 in. Splash rule is 6 in or more: met |
| Box top (stowed) | 371 mm (tray plate 381) | 66 mm under the pit pan (pan underside is at 437 mm = 17.2 in) |
| Drip roof | 18 ga aluminium, 40 mm overhang, front drip edge, on 5 mm nylon spacers under the pan | Top at 432 mm |
| Bay top to bottom of the floor frame | **177 mm (7.0 in)** | Meets the 4 in or more rule where the service doors open |
| Inset from the side-wall planes | 150 mm or more | SD1 (left door) swings outside the left wall and starts at z 756. The bay is 324 mm below that and 150 mm inside the wall line. The right wall has no lower door (`service_params`); a panel there would still be above the floor frame and outside the skirt |
| Inside the predator skirt | 176 mm or more from the side chain-link; 23 mm in front of the back chain-link | |
| Tray swing | Hinged on the bottom-back edge, tips back 90 deg onto 2 stay arms | Swing peaks at z 421, **10 mm under the drip roof**. A 250 mm-tall box would hit the pan, which is why 200 mm was chosen |
| Open position | Box lies flat behind the skirt, **lid facing up, about 12 in above grade (299 mm)**, reaching 179 mm past the chain-link through the service hatch | 176 mm below the bed-cassette slot, so the cassette and the open tray never meet |
| Service hatch (one per box) | Back under-coop skirt: 1x2 PT frame, 1/2 in hardware cloth, hinged at the bottom (drops to the ground as a shelf), barrel bolt + locking carabiner + padlock hasp | Opening = box ±40 mm, z 100..420 |
| Cable chase | One 1-1/2 in Sch40 grey PVC on the front face of the back-left post. Bell end faces **down** at 8 in, packed with duct seal, with a 1/2 in hardware-cloth peck sleeve over the drip loops. It rises through the floor ledge to an LB body 300 mm above the ledge | 6 mm to the droppings board, 7 mm to the post (standoff straps). Bored through the floor ledge |
| EB2 → chase | 1 in PVC raceway under the pan, in front of the gearmotor (y 3458) | |
| Cables inside the coop | Split loom up the front face of the back-left post (x 105), then forward under the left top plate at x 70 | Stays clear of the SD1 latch jack (x 0..38), the left Y motor (x 34..76), the SD1 window stud and the V1 fan (x 10..48); drops to the sensors just behind the actuator board |
| E-STOP | 1-hole IP65 22 mm station on the back wall, left of SD2 (x 76, 43 in) | 41 mm clear of the SD2 skin. Its cable runs down the outside of the siding in 3/8 in liquid-tight flex (the corner cavity is full of SD1/SD2 kings), in under the siding's bottom edge, then behind the back-left post into EB1 |
| In-coop sensors | DHT20, DHT22 and the MQ-137 cage moved to the back face of the front-left post (from `service_params.SENSOR_RELOCATE`) because SD1 took the left wall | |

`python ebay.py` re-checks all of this for base/starter/plus/pro. It intersects the stowed **and** open bay with the gearmotor, pinion, pit pan and walls, slides, rack, cassette and slot flap. The result is **0 hits** in all four configs. A full-model sweep also found nothing hitting the service doors, studs, fan, gantry or posts; the only overlaps left are the intended bores (chase and cables through the floor ledge, cable sleeves through the skirt and hatch).

### What goes where (DIN rails, 2 per box)
**EB1** (all tiers)
- Upper rail: the printed PETG DIN carrier with the door controller (XIAO ESP32-S3, DRV8874 #4035 at a ~2.0 A limit, D36V6F5 5 V buck, 1N5817, 20 k VREF, 4.7 k pull-ups, TB1/TB2), the F1 3 A fuse holder, and terminal blocks (12 V / GND / 5 V buses, E-STOP loop, field terminals).
- Lower rail, Plus/Pro: a carrier with the ESP32-WROOM-32 DevKit, the 15 k/12 k + 100 nF MQ-137 divider, the 5 V buck and the feeder DRV8874.
- Lower rail, Starter: the picker's 2 x TMC2209 drivers and the pump MOSFET.
- Bottom face: 3 x PG7 (actuator, reeds, DHT20 + camera), 1 x PG7 (E-STOP loop), an IP67 DC jack (PS1), and on Plus/Pro 2 x PG9 (MQ-137/DHT22/feeder, plus the EB1↔EB2 link). M12 breather at the lowest point.

**EB2** (Plus/Pro)
- Upper rail: 6-way blade fuse block (motor rail), motor-rail relay (30 A, coil wired through E-STOP NC block 3 and the service-door reeds in series), terminal blocks.
- Lower rail: 4-axis ESP32 motion controller with 4 x TMC2209 (FluidNC-class, **ASSUMED**), the Pololu G2 18v17-class cassette driver, the SO-101 bus-servo adapter, and a 12→6 V 5 A buck for the damper servos and the tiller fold servo.
- Bottom face: PG13.5 (PS2 motor rail), 5 x PG9, M12 breather.
- The arm host (Pi 5 or Jetson) does **not** go in the bay (too much heat). It stays in the egg bay or indoors.

### Power (no mains in the bay)
- PS1 is the 12 V 3 A Class 2 adapter (PR #188). It runs the door and sensors on all tiers.
- PS2 is a **12 V 8 A (96 W) Class 2** adapter for the motor rail on Plus/Pro (**ASSUMED**). The Class 2 limit is 100 VA at 12 V.
- Both bricks sit in the outlet's in-use cover. Their leads run along the ground and through a sleeve in the hatch frame, with a drip loop up into the box bottom.
- 12 V peak if every load ran at once is about 10.6 A. The firmware never runs the gantry and the cassette together, which brings it to about 8 A.
- Starter with the picker should upsize PS1 to 12 V 5 A Class 2.

## Service: swap a board in under 5 minutes, no tools
1. In the app, send the gantry to `SERVICE_POSE`. Then **press the E-STOP** at the back station: the motor rail drops in hardware. (0:30)
2. Unplug PS1 (and PS2) at the outlet. (0:15)
3. Hatch: lift the carabiner, slide the barrel bolt and let the hatch fold down onto the ground. (0:20)
4. Pull the spring-pin handle on top of the tray. The tray tips back onto its stay arms and the lid ends up facing up at knee height. (0:15)
5. Open the lid's quarter-turn latches. (0:15)
6. Unplug the pluggable field terminals on the board you're replacing. They are labelled, one plug per harness. Lift the DIN carrier off by its pull tab, clip in the spare (pre-flashed with the same MQTT id, `ct_door_001` / `ct_coop_001`) and re-plug. (2:00)
7. Close the lid, lift the tray until the pin clicks, close and latch the hatch, plug in power. Twist the E-STOP to release it, then re-arm in the app (motion never restarts by itself). (1:00)

That's about 4.5 minutes. Keep a spare door-controller carrier and a spare WROOM carrier, both pre-flashed, in a zip bag inside EB1's lid.

## Heat and condensation (Lakeside, CA)
Lakeside summers are hot and dry: afternoons are often in the mid-90s °F and can pass 100 °F on heat-wave days and during Santa Ana winds, which also carry dust. Winters are mild and wet, with most of the ~13-15 in of yearly rain falling Nov-Mar, plus cool, damp nights near 40 °F and the odd light frost. (Typical inland San Diego County climate; approximate, not a site measurement.)
- **Heat.** Each box has about 0.25 m² of surface; still-air convection is ~5.5 W/m²K. EB2 makes about 8 W while moving (4 x TMC2209 + G2 + relay + ESP32, **ASSUMED**), so the inside runs about 6 K above the air under the coop. EB1 makes about 3 W, about 2 K. On a 105 °F (41 °C) shaded afternoon that is about 47 °C inside EB2. ESP32 boards, bucks and TMC2209s are rated 85 °C or higher, so this is fine.
  - Keep the boxes out of direct sun: the skirt and the overhang already shade them. Don't paint them dark. Run the TMC2209s at no more than 1.0 A rms, with StealthChop off during long moves.
  - The arm host stays out of the bay.
- **Condensation.** Cool, damp winter nights after a warm day make a sealed box "breathe" moist air in. The fixes:
  - The M12 ePTFE breather equalises pressure without pulling water in.
  - Cable glands and the breather sit on the **bottom only**, and every cable gets a **drip loop** (low point about 4.3 in) before it enters a gland or the chase bell.
  - A 40 g rechargeable silica-gel pack is tied inside each lid. Swap it each November.
  - Acrylic **conformal coating** (MG 419D-class) goes on every PCB in the bay. Mask the connectors, the XIAO/WROOM antennas and the DRV8874/G2 potentiometers.
  - The boards' own warmth (2-6 K) keeps them above dew point once they are powered. Leave the bay powered through winter.
  - The drip roof's air gap stops water wicking along the pan. Duct seal in the chase bell and the LB keeps the coop's ammonia-laden air out of the boxes.
- **Hens and rodents.** The under-coop space is part of the run. The boxes are sealed, the drip loops sit inside a hardware-cloth peck sleeve, and loose cable is in split loom. Check for chewed loom each spring.

## Parts list (estimates, **ASSUMED**, no purchases)
| Ref | Item | Qty | Est. USD |
|---|---|---|---|
| EB-ENCL | IP66 PC enclosure 300x200x130, clear lid, mounting plate | 1 (B/S), 2 (P/P) | 45 each |
| EB-TRAY | 6 mm HDPE tray, 2 lift-off hinges, 2 stay arms + chain, spring pin, handle | 1 per box | 28 each |
| EB-HANGER | 1-1/2 in aluminium angle frame, M6 through-bolts + fender washers | 1 per box | 18 each |
| EB-DRIP | 18 ga aluminium drip roof + nylon spacers | 1 per box | 12 each |
| EB-DIN / EB-TB | 2 x 260 mm DIN rail; terminal blocks, end stops, jumpers | per box | 6 + 20 |
| EB-GLAND / EB-VENT | PG7/PG9/PG13.5 glands + blanking plugs; M12 ePTFE breather | per box | ~12 + 4 |
| J1 | IP67 panel DC jack (replaces the bare 5.5x2.1) | 1 | 6 |
| EB-CHASE / EB-RACE | 1-1/2 in PVC chase, LB, duct seal, straps, peck sleeve; 1 in raceway (P/P) | 1 | 25 + 12 |
| EB-HATCH | Service hatch: PT frame, hardware cloth, T-hinges, barrel bolt + carabiner, hasp | 1 per box | 22 each |
| EB-ESTOP + SW1 | 1-hole IP65 station + 22 mm mushroom head + **3 NC blocks** (Base/Starter 2) | 1 | 12 + 3 per extra block |
| EB-FUSE / EB-RLY | 6-way blade fuse block; 30 A motor-rail relay + socket + diode (P/P) | 1 | 18 + 15 |
| EB-GCTL | 4-axis ESP32 controller with 4 x TMC2209 (FluidNC-class) (P/P) | 1 | 45 |
| EB-BUS / EB-DCDC | SO-101 bus adapter; 12→6 V 5 A buck (P/P) | 1 | 12 + 10 |
| PS2 | 12 V 8 A Class 2 adapter, motor rail (P/P) | 1 | 30 |
| EB-COAT / EB-DESIC / EB-LOOM | Conformal coating, desiccant packs, split loom + UV ties | - | 20 + 8 + 8 |

Bay total, estimated: about **$245 for Base/Starter** and **$560 for Plus/Pro** (bay parts only; the controller boards were already in the BOM). The rows are in `reports/CT_COOP_A_showcase_bom_check.csv`.

## Proposed pin additions (WROOM, **ASSUMED**, not in firmware)
| Function | Proposal |
|---|---|
| Exhaust fan PWM (25 kHz) / tach | GPIO23 (LEDC) / GPIO34 |
| Damper servos x3 + tiller fold | PCA9685 on I2C GPIO21/22 |
| Cassette G2: PWM / DIR / current sense | GPIO18 / GPIO19 / GPIO36 (ADC1) |
| Cassette limits x3 + slot flap; service-door reeds x3 | MCP23017 on the same I2C bus |
| Bed temperature DS18B20 (1-wire, 4.7 k) | GPIO16 |
| Gantry controller UART | GPIO17 TX / GPIO39 RX (or a second I2C/UART pair) |

Before wiring any of this, merge PR #188's fix 818cf10 (stepper ENABLE moved off GPIO12 to GPIO33, NC E-STOP sense on GPIO32). This branch's `firmware/chicken-tender/src/main.cpp` still has `PIN_STEPPER_ENABLE 12` and no E-STOP input.

## Open items
- `run_chainlink.py` still draws the back under-coop fabric solid across the two hatch openings. It needs a cut-out there, with the fabric bound to the hatch frame.
- Harness lengths grow with the bay: reeds about 4.5-4.8 m, actuator 3.3 m, DHT20 and MQ-137 about 3.8 m (the sensors moved to the front-left post for SD1), camera 2.9 m. Update `len_mm` for W13/W14/W18/W19/W20 in the hw.yaml. The DHT20 I2C run is over 3 m: drop the bus to 50 kHz or add a P82B715 extender.
- Pick and verify the real enclosure, motion controller and PS2 listings, then re-run `python ebay.py`.
