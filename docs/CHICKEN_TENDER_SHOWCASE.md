# Chicken Tender: animated showcase, robot options and engineering check (draft, 2026-11-21)

**Status:** draft for review. The numbers are hand-calcs from the parametric model, not tests on hardware.
Every assumption is marked **ASSUMED** here or in `cad/chicken-tender-coop/showcase/sc_params.py`.

**Sources:**
- `docs/CHICKEN_TENDER_BUILD_GUIDE.md` (this PR, #189)
- `hardware/chicken-tender-starter/hw/*.yaml`, `out/BOM.md` and `docs/CHICKEN_TENDER_PINOUT.md` (PR #188)
- The CT72 A1.2 cell work: the SO-101 on Plus/Pro, the soft vacuum tool on Starter, the egg-basket pocket with an AprilTag, and the UR3e as a heavy-duty Pro option
- The public SO-101 URDF (TheRobotStudio/SO-ARM100, Apache-2.0)

## What's here
| Output | Path |
|---|---|
| Parametric model (build123d) | `cad/chicken-tender-coop/showcase/` (`sc_params.py` is the only file to edit) |
| Chain-link run, small gable roof, predator toggles | `showcase/run_chainlink.py` |
| Door firmware in the loop | `showcase/fw_sim.py`: a line-by-line port of `firmware/chicken-tender-starter/lib/door_logic/door_logic.cpp` (PR #188), driven by a physical door model. Trace in `reports/CT_COOP_A_showcase_fw_trace.json` |
| SO-101 kinematics, reach and clearance | `showcase/so101.py`, `arm.py`, `reach.py` → `reports/CT_COOP_A_showcase_reach.{md,json}` |
| Engineering hand-calcs | `showcase/engineering.py` → `reports/CT_COOP_A_showcase_engineering.json` |
| BOM cross-check (one table) | `showcase/bom_check.py` → `reports/CT_COOP_A_showcase_bom_check.csv` |
| STEP, one file per option | `step/CT_COOP_A_showcase_{base,starter,plus,pro}.step` |
| STEP, one file per part | `step/parts/CT_COOP_A_<ID>_<name>.step` (153 files) |
| Animated GLB, one per option | `reports/glb/CT_COOP_A_showcase_{base,starter,plus,pro}.glb`. Opens in any glTF viewer, e.g. gltf-viewer.donmccurdy.com |
| Isaac Sim / Isaac Lab | `sim/isaac/` (start with `RUN_ON_WCR8.md`) |
| MP4 renderer (headless, numba rasterizer) | `showcase/sc_render.py`. Plus full cut: 1148/1416 frames rendered; the encodes are not in git |

**SolidCraft.** Re-import `step/CT_COOP_A_showcase_<option>.step` (File > Open), one per option. Use `step/parts/*.step` for single parts.
The PR #189 files (`CT_COOP_A_assembly.step` etc.) are unchanged; the new files use the same `CT_COOP_A_` prefix.
In the showcase files, the chain-link run, gable roof and inside pop-door guides replace the old run, so treat those as the current design.

**Rebuild:**
```
pip install build123d trimesh fast-simplification usd-core numba
cd cad/chicken-tender-coop/showcase
python fw_sim.py && python reach.py && python engineering.py && python bom_check.py
python export_step.py options && python export_step.py parts
python export_glb.py base,starter,plus,pro ../reports/glb
python export_usd.py base,starter,plus,pro ../../../sim/isaac/usd && python export_usd_lab.py ../../../sim/isaac/usd
```

Predator layer toggle (environment variables): `RUN_GUARD=none|chicken_wire|hardware_cloth_skirt`, `RUN_GUARD_H_IN=36|72`, `RUN_APRON=buried|surface|none`.

## Design changes in this showcase (vs. the guide / PR #189 CAD)
1. **Run = chain-link (Zach, 2026-11-21).** It replaces the wood run frame R1-R10 and the hardware-cloth run walls and roof.
   - Posts: 2-3/8 in terminal posts at the 4 corners and 1-7/8 in line posts at mid-span, all set 24 in deep in concrete. Two short back-corner posts carry the under-coop fabric.
   - Rails and fabric: 1-3/8 in top rail; 6 ft x 2 in mesh fabric on the open run with tension bars, bands and a bottom tension wire.
   - Under the coop: 3 ft fabric, 24 in exposed plus about 11 in buried as a footer.
   - A chain-link walk gate for the ~43 in opening replaces the run door. Gate and coop doors keep two-step latches.
2. **Small gable roof over the run, still corrugated.**
   - Pitch 3:12, chosen over 4:12 so the ridge stays under the coop's front eave. The ridge runs along the 12 ft length and sits at about **83 in**.
   - Framing: 5 trusses at ≤ 24 in centres (2x2 chords and king post) clamped to the top rails, 3 purlins per slope, 4 in overhangs.
   - Covering: panels with ribs running down-slope, a ridge cap, foam closures.
   - Hardware cloth closes the two gable triangles and the strip from the run roof to the coop front wall.
3. **Predator note (kept, not dropped).**
   - 2 in chain-link alone lets raccoons reach through, and snakes, weasels and rats get in.
   - Chicken wire (the `chicken_wire` toggle) keeps chicks and small birds in or out, but raccoons tear it and reach through it.
   - **½ in hardware cloth on the bottom 2-3 ft (`hardware_cloth_skirt`, the default) is the predator-proof pick.**
   - Add the **buried 12 in apron** too (recommended; the guide's surface apron is still an option).
4. **Pop-door guides inside the front wall.** This is the guide's step 8 text; the PR #189 CAD had them outside.
5. **Turnaround pulley.** A direct pull from the actuator rod to the cord eye does not fit: it needs 760 mm from the eye to the wall clevis and the coop has 483 mm. A 25 mm sheave by the right front post sends the cord back to the eye over the door.
6. **Robot-ready nest box (robot options only).**
   - The outer wall, back end and divider are cut to a 6 in rim.
   - An egg-bay hood replaces the P6 lid: a weather cover with a hinged exterior collection door, a mount for the arm or rail, and a shallow padded tray with an AprilTag.
   - The arm side of the tray has a lip lowered to 20 mm.
   - Trade-off: hens get less nest privacy, though the hood keeps the nest dark.
7. **C10 side nailers added.** They are in the cut list but were missing from the CAD; the cable route runs under them.

## Run cut list (new; replaces R1-R10)
| ID | Part | Stock | Qty | Length |
|---|---|---|---:|---|
| RR1 | Truss bottom chord | 2x2 | 5 | 47.2 in |
| RR2 | Truss top chord, 14° ends | 2x2 | 10 | 27.6 in |
| RR3 | Truss king post | 2x2 | 5 | 5.7 in |
| RR4 | Purlin | 2x2 x 8 ft | 6 | ~92 in |

The steel parts (posts, rails, fabric, gate, fittings), roofing and predator layers are in the BOM check CSV, with rough prices.

## Door: load, actuator, cord, fail-safe (`engineering.json`)
**Load and margin**
- **Door** (P5, 12 x 13 in of 15/32 ply, 600 kg/m³ **ASSUMED**): **0.75 kg**, 7.4 N. That is under the guide's 1 kg rule.
- **Pull at the actuator:** 10.6 N nominal and **16.0 N worst case** (wet ply +20 %, cord-eye μ 0.25, 5 N side load on the guides). This includes 90° over the cord eye (capstan e^{μθ}) and a 0.95-efficient 180° sheave. hw.yaml estimates 15 N.
- **Actuator:** 150 N rated, so the safety factor is **9.4**.
  - At the 2.0 A driver limit: about 82 N (Starter generic) or 60 N (Glideforce).
  - Worst-case current: 1.03 A or 1.41 A, which is below the 1.8 A firmware jam trip.

**Stroke and opening**
- Stroke used is 290 of 300 mm (280 mm lift plus 10 mm slack).
- **Finding:** with the closed door resting ½ in below the sill, a 280 mm lift leaves a **267 mm (10.5 in)** clear opening, not 11 in.
- Fix: stop the closed door at the sill, or accept 10.5 in. Lifting 292 mm instead would need 302 mm with slack, which is more than the stroke.

**Cord and pulleys**
- **Cord:** the routed path is 1311 mm, or **1.47 m** with knots. **The BOM's 1 m is too short; buy 2 m.**
- Safety factor: 63 at the worst-case load, 12 at a full 2 A stall pull (1.8 mm UHMWPE ≥ 1 kN **ASSUMED**; check the listing).
- Sheave D/d is 14.
- The cord's return leg clears the rod end by 31 mm.

**Timing (firmware in the loop)**
- Starter: opens in 28.5 s (timeout 55 s).
- Pro (Glideforce): opens in 6.6 s.
- The scenario run was: open → day → close → **E-STOP at mid-travel** → door holds (motor 0, latch set; Close is *refused* while latched) → twist release → `clearEStop()` → Close → closed reed → CLOSED.

**Fail-safe**
- The door only ever falls under its own weight; the actuator never pushes down. Net downward force is 6.8 N (7.3 N wet worst case) against guide friction.
- The NC E-STOP breaks the DRV8874 SLEEP line in hardware, and the firmware latches it.
- Reeds at both ends; the actuator's built-in limit switches are the backup.
- If the cord breaks, the door drops 280 mm with 2.1 J. **Add a foam strip on the bottom edge.**

## Arms: payload, gripper, vacuum
- **SO-101 payload:** shoulder-lift torque at full horizontal reach (322 mm lever) is 0.60 N·m with a 70 g egg; the egg is 37 % of that load.
  - Against stall: safety factor 4.9 with the 12 V STS3215 (30 kg·cm), 3.2 with the 7.4 V version.
  - Use the 12 V servos with a 12 V supply of at least 8 A (a 5 A supply browns out, per SO-ARM100 issue #132).
- **Gripper:** needs ≥ 2.1 N normal force (2 jaws, μ 0.5 silicone, 5 m/s², safety factor 2).
  - Cap it at 6 N (about 0.3 N·m, 10 % of stall), against an egg failure load of 34 N equatorial.
- **Starter vacuum:** a 20 mm 1.5-fold bellows cup at -20 kPa holds 6.3 N in theory, or 3.1 N derated ×0.5 for the curved shell and leaks.
  - That is a safety factor of 3.8 on a 70 g egg at 2 m/s².
  - Add a vacuum sensor so it can confirm an egg is on the cup.

## Reach and clearances (`reports/CT_COOP_A_showcase_reach.md`)
Egg grid: 3 x 3 per box at -80/0/+80 mm (18 slots, **ASSUMED**). The SO-101 is checked with IK on the URDF (approach within 35° of vertical) and clearance to the closest URDF-mesh vertex.
| Option | Mount | Egg slots reached | Pick-and-place sweep (egg B1_CM), minimum clearances |
|---|---|---|---|
| **Starter**: vacuum cup on a Y/Z rail | Rail at the box centre line, under the hood | **6/18 on a flat pad** (centre line only). **18/18 with a centering (dished) nest pad**; the box floor stays flat | Plunger 140 mm to the coop wall and outer rim. Held egg 23.5 mm over the 6 in rims. Roost is behind the wall (202 mm). Y travel 963 mm, Z stroke 189 mm |
| **Plus**: SO-101 inverted under the hood | Base face at z 1240 mm over the divider, yaw 0 | **14/18.** Misses: B1_LB, B1_CB, B2_LF, B2_CF, the 4 slots right under the base next to the divider (approach blocked or < 3 mm). The centering pad keeps eggs out of these | Pad 8.0, tray rim 12.0, divider 29.2, outer rim 37.5, hood roof 76.1, coop wall 110, roost 256 |
| **Pro**: SO-101 inverted on a short Y gantry | Carriage parks 157 mm along Y from the egg | **18/18** (tightest grasp clearance 3.2 mm) | Same sweep as Plus for B1_CM |
| UR3e "pro_heavy" | n/a | **Does not fit.** It weighs 11.2 kg, has a 500 mm reach and needs a 128 mm base on a stiff mount. Its working envelope is about 3x the 480 mm of free space beside the 4 ft coop, and it would need a ~1 m³ guarded bay | |

## Electronics placement (guide section 7 + PR #188)
- Every part is placed and labelled in the model with its enclosure and cable runs. Full list in `bom_check.csv`.
- Control box (XIAO ESP32-S3, DRV8874, D36V6F5, 1N5817, R1-R3, TB1/TB2, F1): outside the back wall, with NC E-STOP on the lid, J1 underneath, and 3 x PG7 glands below.
- Cable route: up the back-left post, under C10, then along C9.
- Sensors on the left wall:
  - DHT20 at 14 in.
  - MQ-137 caged at 12 in, ≥ 18 in from the roost.
  - DHT22 alongside, for the Pro board.
- XIAO Sense camera node in the front-left upper corner.
- WROOM box with the 15 k/12 k + 100 nF divider and the 5 V buck (Plus/Pro models).
- 12 V Class 2 adapter at a GFCI outlet (location **ASSUMED**).
- Feeder hung from C3.

## BOM cross-check: findings (full table: `reports/CT_COOP_A_showcase_bom_check.csv`, 76 rows)
**MISMATCH (7)**
1. SW1: 1 NC contact in the BOM vs 2 NC contacts in the guide.
2. Cord: 1 m in the BOM vs 1.47 m needed.
3. Harness lengths: reeds need about 3.0-3.3 m (doc says 1.2 m), the actuator 1.8 m (doc 1.5 m), the DHT 1.6 m (doc 1.2 m).
4. The control box with its top at 56 in collides with the cleanout door's height band. It only fits in the 6 in strip beside the door, 130 mm wide max.
5. Pop-door guides: inside per the guide, outside in the CAD.
6. Clear opening is 10.5 in.
7. P6 nest box is modified for the robot options.

**MISSING-IN-DOC:** the turnaround pulley, every chain-link and run-roof item, and the robot-option parts. All are priced as estimates.

**NOT-MODELLED:** fasteners, and the later-phase TB6600, feeder driver and HX711.

## BOM delta per option (rough street prices, **ASSUMED**, ±30 %, no tax or shipping)
| Option | Adds over the door kit + chain-link coop | ≈ $ |
|---|---|---:|
| Base | Nothing: door kit ($88 + actuator) and the coop | 0 |
| Starter | Hood + tray + tag $70, Y rail + Z plunger $65, 2x NEMA17 + drivers $42, vacuum pump/valve/sensor + cup $43, centering pads $20, bay XIAO Sense $14, 12 V 5 A supply $20 | ~$275 |
| Plus | Hood + tray + tag $70, SO-101 follower $250 + leader $230 (for teaching), mount $15, Pi 5 8 GB $80, bay XIAO Sense $14, 12 V 10 A supply $30, centering pads $20 | ~$710 |
| Pro | Plus + Y gantry (2040 + MGN12 + carriage) $60, NEMA17 + GT2 + driver $30, Jetson Orin Nano Super instead of the Pi $170 more, door interlock + 2nd E-STOP $40 | ~$1,010 |

## Investor summaries
- **Base.** A predator-aware family coop with an automatic door that the firmware has proven safe. The door falls closed under its own weight, the reeds confirm closed, and a hardware E-STOP stops it, for about $130 of door electronics (about $260 with the Pro Glideforce actuator). It is the entry product and the platform every upgrade bolts onto.
- **Starter (~$275 more).** Eggs arrive in a tray on the outside of the coop with no robot arm. A two-axis rail and a soft vacuum cup are a cheap, robust mechanism. Paired with a centering nest pad, it reaches every lay position. It is the volume "no more coop visits" upgrade.
- **Plus (~$710 more).** Adds an open-source LeRobot SO-101 arm. Families teach it by hand with the leader arm, and it learns in NVIDIA Isaac Sim. It reaches 14 of 18 nest spots directly, and all of them with the centering pad. The same data pipeline feeds better policies over time, which is the AI and education story.
- **Pro (~$1,010 more).** The SO-101 on a short gantry reaches all 18 nest spots with margin. The gantry and Jetson leave room for more tasks (feed checks, a cleaning pass, more boxes), and it adds an interlocked door and a second E-STOP. It is the premium and classroom/demo unit. A UR3e-class industrial arm is deliberately out of scope for a 4 x 4 ft coop.

## Open engineering questions
1. Which actual Starter actuator (listing still not chosen)? Its force, speed, current and hole size must be verified.
2. Should the closed door stop at the sill (full 11 in clear) or keep the ½ in overlap (10.5 in)? Firmware limit and reed placement follow from that choice.
3. Who supplies the turnaround sheave, and is the cord-eye radius printable or does it need a second sheave?
4. Update the harness lengths (W13, W14, W18, W19, W20) and buy 2 m of cord.
5. Control-box location versus the cleanout door: a narrow box in the 6 in strip, above 57.25 in, or on the side wall?
6. Plus: is a 14/18 reach with a centering pad acceptable, or should Plus get the gantry?
7. Hen safety in the egg bay: the arm must never move with a hen in the nest. Plan is the bay camera plus a hood-door interlock. Is a light curtain needed?
8. Do hens accept a 6 in rim, and does a dished pad reduce laying? Needs a field test.
9. Local permits and setbacks, and whether chain-link and post footings need any approval in Lakeside / unincorporated San Diego County.
10. Isaac: verify door and arm drive gains and egg contact behaviour on WCR8 (smoke test first).
