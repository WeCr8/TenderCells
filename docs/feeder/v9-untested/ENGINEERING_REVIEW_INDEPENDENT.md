# Feeder v9: independent engineering review (2026-11-22)

**Status: paper and CAD-geometry review only. Nothing was built, powered, flashed or tested with feed.** The design remains UNTESTED (see `STATUS_UNTESTED.md`).
Method: measured the package STEP files with build123d (`verification/*.py`, rerunnable), then read the electrical docs, BOM, pinout and firmware by hand. Numbers marked (datasheet) come from general knowledge of the named parts, not from this package, and should be checked against the purchased part's own datasheet.

## Verdict
Do not build from this package as received. The three blockers (A1, E1, E2) and the hole collision (A10) now have PROPOSED fixes checked with the tools (section F); none is built or tested. The rest need a decision or a bench test.

## A. Mechanical
| # | Finding | Severity | Evidence |
|---|---|---|---|
| A1 | **Closure plates overlap the housing in the V9 assembly STEP.** The two 7 mm closure plates sit at Y 26..33 and -33..-26, inside the housing's own end walls (Y -33..33). A boolean intersection gives **44.2 cm3 of shared volume per side** (bbox X -102..2, Y 26..33, Z 63.7..169.7). The housing has no matching 104 x 106 x 7 mm recess (its section area barely changes between Y 24.5 and 29.5: 9046 vs 8023 mm2). The claimed 52 mm plate spacing (0.6 mm axial gap per rotor side) therefore exists only on paper. If the plates are printed outside the housing end faces instead, the spacing is **66 mm and the axial gap becomes about 7.6 mm per side**: the V8 feed-loss problem the review says was fixed. | **Blocker** | `verification/asm.py`, `asm2.py` |
| A2 | Radial clearance 0.60 mm per side is real: rotor OD 70.8 mm, housing bore R36.0 (72 mm). Rotor width 50.8 mm. Axial positions in the assembly (rotor Y +/-25.4, plates at +/-26) also give 0.6 mm per side, subject to A1. | Verified | `rotor_profile.py`, `asm.py` |
| A3 | Pocket volume claim verified: cylinder (R35.4 x 50.8) minus the rotor solid, less the 6 mm bore, divided by 6 = **19.9 cm3 per pocket**. At the planning density 0.58-0.68 g/cm3 that is 11.6-13.6 g if the pocket fills completely. It will not fill completely (22 degree mouth, about 13.6 mm chord), so the real dose is lower and must be weighed. | Verified (geometry); dose unknown | `rotor_profile.py` |
| A4 | Rotor profile: six 38 degree lands at R35.4 and six 22 degree pocket openings. With 0.6 mm clearance, any pellet or crumble piece wider than 0.6 mm can be pinched between a land edge and the inlet edge of the bore. | Risk | `rotor_profile.py` |
| A5 | **Drive torque margin is unknown and probably thin.** A 28BYJ-48 delivers on the order of 34 mN*m (datasheet, typical). At the rotor rim (R35.4 mm) that is roughly **1 N of tangential force**. Crushing or shearing a pellet takes far more than that (hardness of the actual feed is unmeasured). Expect stalls with pellets; crumble may be marginal. A stall is silent in the firmware (open loop, no stall or jam detection). | **Major, needs jam test** | calculation; `PHYSICAL_VALIDATION_PROTOCOL.md` |
| A6 | Printed-fit risks: rotor D-bore modelled at exactly 6.00 mm (the shaft is 6 mm), bearing seats at 15.08 mm for a 15.00 mm 696 bearing (0.04 mm per side), M3 heat-set holes at 4.5 mm. FDM prints shrink holes; the package's own tolerance note recommends 0.25-0.40 mm per side for new mating features, which these do not follow. Print the coupon first and ream or enlarge as measured. | Moderate | plate and rotor cylinder radii from the STEP files |
| A7 | Small overlaps between hopper adapter and hopper (2.75 cm3) and hopper and its lid (1.38 cm3). May be intentional gasket or lip interference; confirm in CAD. | Check | `asm.py` |
| A8 | Load-cell budget arithmetic is correct: 1671 g plastic + 300 g hardware + 1773 g feed = 3744 g, 74.9 % of 5000 g. This is an estimated static maximum, not a safe-capacity statement; a bar cell with an offset platform sees moment error, and the package itself requires a push-load test and overload guard. | Verified (arithmetic) | `MASTER_PARAMETERS_RECONCILED_V9.json` |
| A10 | **M4 insert holes break into the vertical holes.** The housing's four M4 insert holes (X +/-42, along Y) overlap the four full-height Ø4.5 vertical holes (X +/-46, Y +/-30) by 1.05 mm of wall (8 collisions, one per hole pair and end). | **Blocker** | `eng_cad_hole_collision` |
| A9 | Hopper volume (2.61 L) and the plastic mass estimate were **not** re-derived here. | Unverified | n/a |

## B. Electrical
| # | Finding | Severity |
|---|---|---|
| E1 | **Firmware pins do not match `PINOUT.csv`.** Firmware: IN1-IN4 = 2,3,4,5; HX711 = 6,7; Hall = 8. Pinout: HX711 on D1/D2, Hall on D3, ULN2003 inputs on D4-D7. On a XIAO ESP32-C3 the `Dn` labels are not GPIO numbers. The firmware's choices also land on boot-strapping pins (GPIO2 and GPIO8 as I understand the C3; verify against the board's pin map): a Hall output or ULN2003 input pulling those pins at reset can change boot mode. Wire to the pinout (which avoids D0 and D8) and fix the firmware, not the reverse. | **Blocker** |
| E2 | **Homing cannot work as written.** `homeRotor()` stops after `guard < 6000` loop iterations, but `runSpeed()` only steps every 1/180 s. 6000 iterations take a few tens of milliseconds, so the rotor moves a handful of steps and gives up silently, far short of the up to about 4096 half-steps needed to find the Hall magnet. It also never reports failure. | **Blocker** |
| E3 | HX711 supply is not specified ("3.3/5V compatible"). Power it from 3.3 V: at 5 V its DOUT swings to 5 V, above the ESP32-C3's 3.3 V pin tolerance. | Major (wiring rule missing) |
| E4 | A3144 Hall sensors need about 4.5-24 V supply (datasheet), so they will not work reliably from 3.3 V. Power it from 5 V with the open-collector output pulled up to 3.3 V. `PINOUT.csv` only says "pull-up as required". | Major (wiring rule missing) |
| E5 | The ULN2003 drops roughly 1 V per active coil (datasheet), so a "5 V" 28BYJ-48 sees about 4 V and loses torque, on top of A5. Check torque with the real supply and driver. | Moderate |
| E6 | After each move the stepper coils stay energised (no `disableOutputs()`), wasting about 0.2 A and heating the motor and driver. | Moderate |
| E7 | The firmware has no dose logic: `D` indexes one pocket, `H` homes, `W` reads the scale. No weight-based correction, no timeout on moves, no stall/jam check, no re-home after N pockets (the 28BYJ-48 steps-per-rev is not exactly 4096, so 683 steps per pocket drifts). | Moderate |
| E8 | Power budget (5 V, 2 A or better, 470-1000 uF bulk capacitor, fuse/PTC) is consistent with a stepper-only build. | OK |

## C. Documentation errors
- `Docs/ELECTRONICS_AND_POWER.md` still describes an MG996R servo as the actuator and sizes the supply for its 1.4 A stall current. The default actuator is the 28BYJ-48 stepper. (Banner added in this branch; text left as received.)
- `Manufacturing/TOLERANCES_AND_FITS.md` is titled "Smart Feeder v5" and its 0.25-0.40 mm fit rule is not what the V9 CAD uses (A6).
- `00_V9_...` and the review claim 0.6 mm axial gap per side; A1 shows the assembly does not support that as modelled.

## D. Proposed firmware (not compiled, not flashed)
`Firmware/PROPOSED_v3a_pinout_aligned_homing_fix.ino` aligns pins to `PINOUT.csv`, replaces the iteration guard with a 30 s time-out that reports failure, adds a per-move time-out and `disableOutputs()` after each move. It needs the board package and libraries installed, a compile check, and calibration on the real motor.

## F. Fix proposal V9b (checked with tools; not built, not fit-tested)
Files: `CAD_proposed/` (housing, assembly, generator script, report), `Firmware/PROPOSED_v3a_pinout_aligned_homing_fix.ino`, wiring rules in `Electronics/PINOUT.csv`.
- **A1 + A10 (CAD):** the housing's M4 insert holes open on the END FACE (|Y| 33), so the plates belong outside it (|Y| 33..40), not inside the wall. A 7 mm spigot (R35.7, 0.3 mm under the R36 bore) on each plate keeps the inner spacing at 52 mm (0.6 mm axial gap per rotor side). The M4 pattern moves to X +/-38.7 (housing and plates), clearing the vertical holes (2.25 mm wall) and matching the plate pattern, which also fixes the 4.34 mm Z offset.
- **Checks on V9b:** no overlap involving housing, plates, rotor or bearing; housing hole collisions 0 (was 8); housing/plate bolt patterns aligned on both sides; feature diff against the original housing: 4 old M4 holes replaced by 4 new, nothing shortened. Remaining overlaps are the original hopper adapter/hopper (2.75 cm3) and hopper/lid (1.38 cm3), unchanged.
- **First attempt rejected (kept for the record):** cutting a recess for the plates in the housing removed the overlap and aligned the bolts, but turned the four 118 mm vertical holes into 11.4 mm stubs. `eng_cad_feature_diff` caught it (it did not exist when the attempt was made; it was added because of it). A second attempt that filled the old holes left a bump inside a vertical hole; fixed by cutting the vertical holes out of the plugs.
- **E1, E2 (firmware):** the proposed `.ino` uses the pinout's `Dn` pins and a time-based homing time-out. It is not compiled or flashed. The eng_guardian pin audit and lint pass on it.
- **E3, E4 (wiring):** rules written into `PINOUT.csv` (HX711 from 3.3 V; Hall from 5 V pulled up to 3.3 V).
- **Not fixed (needs data or a decision):** A5 motor torque vs pellets, A6 printed fits, A9 hopper volume, E5-E7, the hopper overlaps, and all physical validation.

## E. What must happen before this is called correctly engineered
1. Adopt or reject the V9b CAD proposal (section F), print a plate-spigot fit coupon, re-run the tools on the final files, re-export STEP, STL and GLB.
2. Settle the pin map (E1) against the actual XIAO board and update both files.
3. Compile and bench the corrected firmware with the motor unloaded: homing, 6 indexes return to the Hall mark, repeat 100 times.
4. Measure the motor's real torque at the real supply, then run the jam test with the actual feed and measure feed pellet size and hardness (A5).
5. Weigh 30 or more dispenses per feed type; set grams per pocket from data (A3).
6. Wiring rules for HX711 (3.3 V) and Hall (5 V, pulled up to 3.3 V) go into the pinout (E3, E4).
7. Then run the load-cell, washdown and cleaning tests in the package's validation protocol.

## Reproduce
```
python -m venv venv && venv/Scripts/pip install build123d
venv/Scripts/python verification/rotor_profile.py   # edit the path at the top of each script first
venv/Scripts/python verification/asm.py
venv/Scripts/python verification/asm2.py
```
The scripts need the full original package (CAD folder), which is not in this repo.
