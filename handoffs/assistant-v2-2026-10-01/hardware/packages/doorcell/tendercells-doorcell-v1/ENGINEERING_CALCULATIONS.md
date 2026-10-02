# DoorCell V1.4 Engineering Calculations

This document records the engineering pass for DoorCell V1.4. It keeps the proven tooth and joint sizing from the prior pass, then adds electronics insert posts, an integrated CN3065 solar charger footprint, and a two-piece adjustable solar panel mount.

Status: prototype assumptions for 3D printed PETG/ASA/nylon parts. These calculations are suitable for concept validation and bench testing, not certification.

## 1. Print-Bed Requirement

Target home printers:

| Printer Class | Typical Bed |
| --- | ---: |
| Creality Ender 3 / V3 | 220 x 220 mm |
| Prusa MK3/MK4 | 250 x 210 mm |
| Bambu A1/P1/X1 | 256 x 256 mm |

Design rule:

- Main frame sections should stay under about 180 mm nominal length.
- Small parts stay one-piece.
- Door is split because its functional height is larger than common bed depth.

Current modular split:

| Assembly Area | Pieces | Max Nominal Dimension |
| --- | ---: | ---: |
| Top rail | 3 | 146 mm |
| Bottom rail | 3 | 146 mm |
| Left jamb | 2 | 184 mm |
| Right motor jamb | 3 | 156 mm |
| Sliding door | 4 | about 171 mm high per section |

## 2. Rack and Pinion Standard

DoorCell V1.4 uses metric module gear sizing.

Chosen values:

| Parameter | Value |
| --- | ---: |
| Module, `m` | 2.0 mm |
| Pressure angle, `phi` | 20 deg |
| Pinion teeth, `N` | 16 |
| Backlash allowance | 0.20 mm |
| Pinion face width | 12 mm |
| Rack face width | 18 mm |

Formulas:

```text
circular pitch p = pi * m
pitch diameter d = m * N
pitch radius r = d / 2
outside diameter do = m * (N + 2)
root diameter dr = m * (N - 2.5)
rack addendum = m
rack dedendum = 1.25m
rack total tooth height = 2.25m
```

Calculated pinion:

| Dimension | Formula | Value |
| --- | --- | ---: |
| Circular pitch | `pi * 2.0` | 6.283 mm |
| Pitch diameter | `2.0 * 16` | 32.000 mm |
| Pitch radius | `32 / 2` | 16.000 mm |
| Outside diameter | `2.0 * (16 + 2)` | 36.000 mm |
| Outside radius | `36 / 2` | 18.000 mm |
| Root diameter | `2.0 * (16 - 2.5)` | 27.000 mm |
| Root radius | `27 / 2` | 13.500 mm |

Calculated rack:

| Dimension | Formula | Value |
| --- | --- | ---: |
| Pitch | `pi * 2.0` | 6.283 mm |
| Addendum | `m` | 2.000 mm |
| Dedendum | `1.25m` | 2.500 mm |
| Total tooth height | `2.25m` | 4.500 mm |
| Tooth count per strip | selected | 15 |
| Strip pitch length | `15 * 6.283` | 94.248 mm |

Rack tooth widths:

```text
tooth thickness at pitch line = p / 2 - backlash
top width = pitch thickness - 2 * addendum * tan(phi)
root width = pitch thickness + 2 * dedendum * tan(phi)
```

Calculated:

| Dimension | Value |
| --- | ---: |
| Pitch-line tooth thickness | 2.942 mm |
| Top tooth width | 1.486 mm |
| Root tooth width | 4.762 mm |

## 3. Travel Per Pinion Revolution

One full pinion revolution moves the rack by the pitch circumference:

```text
travel per rev = pi * pitch diameter
travel per rev = pi * 32 = 100.53 mm
```

If the door needs about 240 mm of travel:

```text
pinion revs = 240 / 100.53 = 2.39 rev
```

With a 60 RPM gearmotor:

```text
time = 2.39 rev / 60 rev/min = 0.0398 min = 2.39 sec
```

With a 30 RPM gearmotor:

```text
time = 4.78 sec
```

Recommended initial motor speed: 30 to 60 RPM for safer motion and better obstruction detection.

## 4. Motor Torque and Door Force

Assumptions:

| Assumption | Value |
| --- | ---: |
| Door panel mass | 0.4 to 0.8 kg printed PETG/ASA |
| Track friction coefficient, dry printed plastic | 0.25 to 0.35 |
| Dirt/weather/friction multiplier | 3x to 5x |
| Target linear force | 25 to 40 N |

Torque at pinion:

```text
torque = force * pitch radius
```

Using 40 N and 16 mm pitch radius:

```text
torque = 40 N * 0.016 m = 0.64 N*m
```

Conversion:

```text
1 N*m = 10.197 kg*cm
0.64 N*m = 6.53 kg*cm
```

Recommendation:

- Use a 12V metal gearmotor rated comfortably above 6.5 kg*cm at operating speed.
- Prefer a stall torque above 15 kg*cm so the controller can current-limit before mechanical damage.
- Use current sensing and timeout; do not rely on motor stall as a normal stop.

## 5. Obstruction Detection

Minimum detection paths:

1. Closed/open limit switches.
2. Motor timeout.
3. Current spike.
4. Optional encoder count mismatch.

Example first-pass thresholds:

| Condition | Action |
| --- | --- |
| Current exceeds calibrated moving current by 2.5x | Stop immediately |
| Close obstruction detected | Reverse 10 to 20 mm, stop, alert |
| Open obstruction detected | Stop and alert |
| No limit reached by expected time + 50% | Stop and mark fault |
| State unknown at boot | Require calibration or manual command |

## 6. Electronics Envelope and Controller Pod

The Basic electronics package uses common generic modules instead of a custom PCB. The controller pod is intentionally larger than the first placeholder box because the LM2596, fuse holder, cable glands, and service wiring need real volume.

Chosen module envelopes:

| Module | Nominal Envelope |
| --- | ---: |
| ESP32 DevKit / ESP32-WROOM dev board | 58 x 31 x 8 mm |
| DRV8871 module | 31 x 26 x 7 mm |
| INA219 / ACS712 module | 26 x 22 x 7 mm |
| LM2596 buck converter | 44 x 22 x 14 mm |
| CN3065 solar charger | 44 x 24 x 8 mm |
| Inline fuse holder | 45 x 15 x 14 mm |

Controller pod:

| Feature | Value |
| --- | ---: |
| Outside width | 170 mm |
| Outside height | 115 mm |
| Outside depth | 46 mm |
| Wall thickness | 3 mm |
| Internal clear width | 164 mm |
| Internal clear height | 109 mm |
| Internal working depth | about 41 mm |

Fit check:

```text
usable internal width = 170 - 2*3 = 164 mm
usable internal height = 115 - 2*3 = 109 mm
working depth = 46 - 3 - lid allowance ~= 41 mm
```

Depth margin:

```text
LM2596 height = 14 mm
retention tray = 1.4 mm
wire bend/service allowance target >= 12 mm
required practical stack ~= 27.4 mm
available working depth ~= 41 mm
depth margin ~= 13.6 mm
```

Cable entries:

| Entry | CAD Diameter | Intended Use |
| --- | ---: | --- |
| M12 gland 1 | 12.8 mm | 12V power input |
| M12 gland 2 | 12.8 mm | motor leads |
| M10 gland 1 | 10.6 mm | switches, button, sensor leads |
| M8 gland 1 | 8.4 mm | optional solar panel leads |
| M8 gland 2 | 8.4 mm | optional 1S battery/service leads |
| Button cutout | 16.2 mm | optional local waterproof push button |

The trays use M3 brass-insert posts and printed hold-down straps instead of fixed board-hole spacing because budget ESP32, LM2596, DRV8871, INA219, ACS712, and CN3065 boards are not dimensionally standardized.

Power budget:

| Load | Design Allowance |
| --- | ---: |
| ESP32 plus sensors | 500 mA at 5V |
| 25GA motor moving load | 1.5A at 12V |
| Status LED/button | 100 mA |
| CN3065 charge path | 500 mA max charge current |
| Basic supply | 12V 2A |
| Basic fuse | 2A inline |

The fuse protects wiring. It does not replace firmware current sensing or timeout.

## 6A. Optional Solar Panel Mount

The Solar Lite add-on is sized for the attached 6V 3W 500mA mini solar panel class.

| Feature | Value |
| --- | ---: |
| Solar panel nominal size | 145 x 145 mm |
| Back tray outside size | 165 x 165 mm |
| Front bezel outside size | 165 x 165 mm |
| Bezel lip overlap | 3 mm per side |
| Back tray depth | 14 mm |
| Ball diameter | 22 mm |
| Ball socket clearance | 0.45 mm radial |

Panel housing fit:

```text
outer size = 145 + 2*10 = 165 mm
visible window = 145 - 2*3 = 139 mm
panel pocket clearance = 0.8 mm total
```

The housing remains under a common 220 x 220 mm print bed. The ball socket is printed as two clamp halves so it can capture the ball and be tightened after aiming.

Solar power caution:

```text
solar panel nominal power = 6 V * 0.5 A = 3 W
12 V motor moving allowance ~= 12 V * 1.5 A = 18 W
```

The small panel cannot directly power the 12V door motor. It is suitable for charging a single-cell LiPo/Li-ion support path through the CN3065, then only after battery, boost, sleep-current, low-voltage cutoff, and temperature safety are validated.

## 7. 25GA Motor Cassette Fit

Common 25GA/JGA25-370 motors use an approximately 25 mm round body. Encoder versions add rear length and wires.

| Feature | Value |
| --- | ---: |
| Motor body assumed diameter | 25.0 mm |
| CAD body pocket diameter | 27.2 mm |
| Radial clearance | 1.1 mm |
| Motor body length allowance | 65 mm |
| Encoder/wire extra clearance | 16 mm |
| Motor mount plate | 72 x 92 x 12 mm |
| Cradle volume | 54 x 74 x 28 mm |

Radial clearance:

```text
diameter clearance = 27.2 - 25.0 = 2.2 mm
radial clearance = 2.2 / 2 = 1.1 mm
```

This is intentionally loose enough for FDM print tolerance, minor motor-label thickness, and light weather sealing. The motor is retained by the face screws and printed cassette, not by a press fit.

The mount includes slotted frame holes for rack mesh adjustment. This is required because printed gear/rack dimensions, filament shrink, and door drag vary by printer and material.

## 8. Tongue-and-Groove Joint Sizing

The frame joints are for alignment and clamping, not the only structure. The coop mounting screws and M3 cross-bolts provide final restraint.

Chosen tongue:

| Feature | Value |
| --- | ---: |
| Tongue length | 18 mm |
| Tongue width | 22 mm |
| Tongue depth/thickness | 10 mm |
| Clearance per side | 0.25 mm |
| Socket extra depth | 0.60 mm |

Socket dimensions:

```text
socket length = tongue length + 0.60 = 18.60 mm
socket width = tongue width + 2 * 0.25 = 22.50 mm
socket depth = tongue depth + 2 * 0.25 = 10.50 mm
```

Clearance logic:

- 0.20 mm per side is tight on many printers.
- 0.25 mm per side is a good first PETG/ASA fit.
- 0.30 mm per side may be needed for rough printers or elephant-foot conditions.

Tongue shear area:

```text
area = width * depth
area = 22 * 10 = 220 mm^2
```

Using conservative printed PETG allowable shear of 6 MPa after print-orientation and safety reductions:

```text
capacity = 220 mm^2 * 6 N/mm^2 = 1320 N
```

This is far above expected frame-alignment loads, but it should not be treated as the primary coop mounting structure. Use the M4 frame mounting screws and M3 cross-bolts.

## 9. Fastener Sizing

Recommended fasteners:

| Location | Fastener | Purpose |
| --- | --- | --- |
| Frame-to-coop | M4 screws + washers | Primary structure |
| Frame split joints | M3 screws + inserts/locknuts | Clamp tongue-and-groove joints |
| Rack-to-door | M3 screws + heat-set inserts | Replaceable wear strip |
| Motor mount | M3 screws + inserts | Serviceable motor cassette |
| Controller cover | M3 screws + inserts | Service access |

M3 clearance hole:

- CAD: 3.4 mm
- Heat-set insert pilot: 4.6 mm, adjust for insert brand.

M4 clearance hole:

- CAD: 4.5 mm

## 10. Wear and Material Guidance

Rack and pinion are wear parts.

Prototype:

- PETG rack and PETG/ASA pinion are acceptable for bench testing.

Better:

- Nylon rack and pinion.
- PETG-CF pinion and replaceable PETG rack.

Best kit version:

- Molded or machined M2 pinion.
- Replaceable molded rack strip.

## 11. Current CAD Limitations

- Pinion is module-correct and dimensionally traceable, but still an FDM-friendly generated approximation.
- It is not yet a fully standards-compliant involute production gear.
- For production, either generate a true involute M2 16T gear or use an off-the-shelf M2 gear with matching shaft.
- The rack profile is standard 20 degree rack geometry by dimensions, but field wear must be tested.
- Seal design, UV exposure, and dirt ingress need field iterations.
- The controller pod is suitable for prototype outdoor electronics only when printed in PETG/ASA, fitted with glands, and mounted with a drip loop.
- Board retention trays fit common module classes, not every vendor's exact board.

## 12. V1.4 Acceptance Checks

- [ ] Gear pitch diameter is 32 mm.
- [ ] Gear outside diameter is 36 mm.
- [ ] Gear root diameter is 27 mm.
- [ ] Rack pitch is 6.283 mm.
- [ ] Rack tooth count per strip is 15.
- [ ] Rack length is about 94.25 mm.
- [ ] Rack addendum is 2.0 mm.
- [ ] Rack dedendum is 2.5 mm.
- [ ] Tongue socket clearance is 0.25 mm per side.
- [ ] Frame split pieces fit common 220 mm print beds.
- [ ] Controller pod outside dimensions are 170 x 115 x 46 mm.
- [ ] ESP32 tray accepts a 58 x 31 mm board envelope.
- [ ] LM2596 tray accepts a 44 x 22 x 14 mm module envelope.
- [ ] DRV8871 tray accepts a 31 x 26 mm module envelope.
- [ ] Current sensor tray accepts a 26 x 22 mm module envelope.
- [ ] CN3065 tray accepts a 44 x 24 mm module envelope.
- [ ] Fuse channel accepts a 45 x 15 x 14 mm inline fuse holder envelope.
- [ ] Electronics trays include M3 brass-insert hold-down posts.
- [ ] Solar panel housing accepts a 145 x 145 mm panel.
- [ ] Solar panel ball mount uses a 22 mm ball and two clamp halves.
- [ ] Motor cassette clears a 25 mm 25GA/JGA25-370 body with 1.1 mm radial clearance.
- [ ] Motor mount slots allow rack mesh adjustment.
- [ ] All exported STL files are valid OpenSCAD simple solids.
