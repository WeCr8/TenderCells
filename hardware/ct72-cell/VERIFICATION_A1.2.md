# CT72 Chicken Tender Cell 72x72 – rev A1.2 verification (2026-10-16)

A1.2 = A1.1 + Zach's Oct 16 requirements: Hugging Face LeRobot (SO-101) hanging from a 3D-printer-style belt gantry, a nest-box bank where the robot picks the eggs itself from flat floors (TOP or SIDE access), movable roost bars, egg/cleaning routines and sim-to-real timing. **A1 and A1.1 are unchanged.** Draft only, not released for fabrication. Everything was built and checked locally with build123d/OCP and numpy; no cloud CAD, no paid tools.

## What was added
| Area | A1.2 design |
|---|---|
| Gantry | **Cartesian, dual-motor X** belt gantry on the 20-series frame: GT2 10 mm belts, NEMA17 0.59 Nm, V-wheels (Starter) or MGN12 (Plus/Pro), Tr8x2 self-locking Z that homes **up**, mechanical endstops (dual X squaring), Klipper on an SKR Mini E3 V3. CoreXY was rejected: at 72 in it needs two ~7.5 m belt loops, so it is softer, and it costs about the same. See `GANTRY_SIZING.md`. |
| Universal plate | 250x250x12.7 6061, 5x5 M6 grid. Rated for a UR3e (11.2 kg + 3 kg payload): SF 14.9 in bending. Swappable adapter rings: SO-101 printed ring, Starter vacuum-tool outrigger, UR3e 6061 ring. |
| Arms | Plus/Pro: **SO-101 follower hung inverted**, plus an SO-101 leader for teleop. Starter: soft vacuum-cup egg tool, no arm. **pro_heavy option**: UR3e on a stiff variant (HTD-5M 15 mm, MGN15-class rails, NEMA23 3 Nm closed-loop, SFU1605 ball-screw Z with brake). |
| Flock + nest boxes | **Assumed 8 standard hens** (4.1 sq ft/bird inside). 1 box per 4 hens gives **2 boxes**, 12x12x12 in interior, on the LEFT wall with floors at 30 in. Flat floors with removable pad liners. Each box has an open aisle side above a 60 mm lip (hen entrance + arm SIDE access) and a hinged top lid (arm TOP access). One 12 V actuator opens both lids, and a reed switch confirms open. |
| Egg basket | Registered pocket front-left with printed corner locators and an AprilTag (tag36h11 id 0) tab. Open top + open aisle side, so the arm can place from the top or the side. An exterior hatch in the left guard lets people collect eggs without entering. |
| Roost bars | RIGHT wall. 2 x 42 in flat-top bars (2 in wide) = 84 in for 8 birds at 10 in each. Bar A at 48 in (24 in out), bar B at 56 in (12 in out), both above the nest-box top (42 in). Each **swings DOWN 90° to stow flat on the wall** on a 12 V linear actuator. Manual fallback: quick-release pin + detent. |
| Roost interlocks | 2 load cells per bar, plus a camera occupancy check, plus limit switches in both positions. Motion is slow (soft start, about 60% duty). The node stops on load rise, over-current (pinch) or a 20 s timeout. Pinch guards cover the levers and clevises. A bar never moves unless the gantry is PARKED. |
| Gripping | SO-101 with printed TPU Fin Ray fingers + EVA foam, **fingertip force capped at 6 N** through the gripper torque limit (11.2% of stall). Eggs fail at 34 ± 6 N (equatorial, ICF11 paper). Starter: 25 mm silicone bellows cup, vacuum limited to 20 kPa. |
| Electronics | XIAO cell-IO node (camera trigger, roost and lid drivers with DRV8874 current sense, HX711, E-stop sense, vacuum). Pi 5 (Plus) / Jetson Orin Nano (Pro) run LeRobot + the Klipper host. Pi Zero 2 W hosts Klipper on Starter. Servo bus: 12 V 12.5 A Mean Well, fused star feed (6 x 2.7 A stall; the kit's 12 V 5 A brick browns out). E-stop relay cuts the 24 V motor, 12 V servo and 12 V actuator supplies. Pro adds a safety relay + door interlock. |
| Timing | One trigger line from the XIAO to 2 global-shutter cams (Pi GS IMX296 / Arducam OV9281), 30 fps, < 1 ms skew target. Wired PTP/chrony. Every frame, gantry position and SO-101 reading is stamped at capture time with a per-sample clock offset in the LeRobot dataset. A 60 s audit gates each session. Measured jitter feeds sim. |

## Tier BOM totals (`BOM_A1.2.csv`, +/-30 %, USD, parts only)
| Starter | Plus | Pro | pro_heavy (UR3e option, full variant) |
|---|---|---|---|
| **$3,392** | **$4,306** | **$6,511** | **$39,857** |

The frame, guards and coop furniture (about $2.6k) are common to every tier. Plus vs Starter adds about $900: SO-101 follower + leader, Pi 5, two triggered GS cams, servo PSU, PTP LAN and MGN12 rails. Pro adds the Jetson ($290; Zach already owns one), machine-guard mesh ($1,950) and the safety relay + interlock. Vendor part numbers and links are given where a specific part is meant. Commodity lines are marked generic, and prices are estimates unless the basis column says checked.

## Clash and reach results
Method: OCC B-rep booleans (`cad/checks_a12.py`) for every variant x roost {deployed, stowed} x lid {closed, open}. Moving hardware is swept over full travel, and the moving parts are also checked at PARK + 8 corners. A numeric capsule model (`cad/reach_routines.py`) covers the hanging SO-101 (URDF link lengths), the gantry hardware and the routine paths, and requires >= 10 mm clearance.

| Check | Starter | Plus | Pro | pro_heavy |
|---|---|---|---|---|
| Static vs static (both roost and both lid states) | 0 | 0 | 0 | 0 |
| Moving sweep vs static: **HARD** | 0 | 0 | 0 | 0 |
| Moving sweep vs **deployed** roost (CONDITIONAL: interlocked) | 69 | 72 | 72 | 54 |
| Moving sweep vs **stowed** roost | **0** | **0** | **0** | **0** |
| Moving sweep vs nest bank/basket (SOFT-ZONE -> host no-go zones) | 145-163 | 89-113 | 89-113 | 58-76 |
| Moving parts vs each other (9 states) | 0 | 0 | 0 | 0 |
| Egg transit path, roosts **stowed** | clear, 23.5 mm | clear, 20.1 mm | clear, 20.1 mm | – |
| Egg transit path, roosts **deployed** | **CLASH** mast vs bar A (-41 mm) | **CLASH** mast vs bar A (-45 mm) | same | – |
| Cleaning pass kept with roosts stowed | 82 % | 87 % | 87 % | – |
| Cleaning path blocked if roosts deployed | 18 % (mast/screw vs bars A+B) | 18 % | 18 % | – |

**Both roost positions vs the arm sweep:** deployed bars sit in the path of the fixed Z mast. They block the egg-routine transit from PARK and 18% of the cleaning pass, so both routines retract first. Stowed bars are clear of every sweep. The tightest stowed gap is mast vs bar B's swing arms at GX_MAX: 9 mm, flagged below. Near the boxes themselves the approach paths are clear even with the roosts deployed, because the boxes and roosts are on opposite walls.

**Reach into every box** (eggs at the centre and 4 corners inset 45 mm, both approaches, lids open, roosts stowed; includes the unfold → descend → straight-insert path):
- **Plus/Pro (SO-101):** TOP 5/5 in both boxes, clearance 13-17 mm. SIDE 3/5 per box: the wall-side corners and centre pass at 13-17 mm. The 2 **aisle-side corner targets fail SIDE** (gripper vs the 60 mm lip, -1.7 mm), so the routine uses TOP there. Basket: TOP 3/3, SIDE 2/3; the aisle-side spot fails SIDE because of the basket rim.
- **Starter (vacuum, vertical only):** TOP 5/5 per box (15-58 mm) and basket TOP 3/3. SIDE is not possible by design. Wall-side reach needs the tool on an outrigger 400 mm out from the bridge centre, because the fixed mast must stay out of the bank front.
- The routine picks TOP when the lid is open and clear, otherwise SIDE, per box and for the basket (`ct72/routines.py`; tested).

**UR3e (pro_heavy, real vendor STEP, as-supplied pose):** at PARK it hits deployed roost bar B (18,341 mm³) and the back guard (345 mm³, the same as A1.1). At low corners it hits the bed tray, nest shelf and basket. Stowed roosts remove the bar-B hit. As in A1.1 (F2), it still needs a UR park joint pose + UR safety planes. pro_heavy is reported as an option only; no UR3e routine was planned.

**STEP:** 170 files (layers, assemblies including `*_EGGPICK` showing the stowed-roost, open-lid TOP pick, and parts) re-imported with 0 errors.

## Software / firmware (draft PR, not merged)
- `firmware/jetson-nano/ct72/`: cell geometry + host no-go zones generated from the CAD (`ct72_cell_a12.json`), Klipper/sim gantry with timestamped position history, roost controller (independent camera check), egg/cleaning state machine, egg detector, SO-101 limits (6 N grip, torque caps, bus budget), timing + 60 s audit CLI + jitter injector.
- `firmware/jetson-nano/lerobot_ct72/`: LeRobot plugins `tendercells_ct72` (gantry + SO-101 robot, per-sample `timing.*` columns) and `tendercells_ct72_teleop` (leader arm + gamepad with dead-man), plus record (audit-gated), ACT/SmolVLA local training and inference scripts (`push_to_hub=false`, W&B off).
- `firmware/ct72-cell-io/`: XIAO trigger, roost, lid, vacuum and E-stop firmware. `firmware/ct72-gantry-klipper/printer.cfg`.
- 23 new pytest tests (routines in all 3 tiers, TOP/SIDE choice, hen-in-box skip, roost refusals, zones, audit pass/fail, clock sync, jitter, grip cap, LeRobot sim robot/teleop).

## Open / flagged
1. **Flock size 8 is an assumption.** 10 hens would need 3 boxes and 100 in of roost.
2. Actuator choice: generic 12 V 4 in actuators (~$32) vs Glideforce/Progressive. A stepper + worm pivot is the alternative.
3. Pole mechanism: swing-down was chosen. Swing-up would park the bars at 69-72 in, in the arm's transit height band along the right wall. Fold/slide variants were not modelled.
4. Mast vs stowed bar B swing arm is only 9 mm at GX_MAX. Either cap GX_MAX by 15 mm in Klipper or move bar B's pivot 15 mm toward the wall.
5. The fixed Z mast bottom sits at 830 mm (about 21 in above the bed). **Routines require the flock out of the cell** (pop door closed with the hens in the run). A telescoping Z would remove that limit but adds cost.
6. Park position: transit from back-right PARK crosses the roost zone. A back-LEFT park would let the egg routine run without retracting the roosts. Zach still wants retraction; this is listed as an option.
7. SO-101 joint ranges are approximated about the straight-arm reference. Re-check the marginal 13 mm cases in MuJoCo with the real URDF. The SO-101 adapter-ring screw pattern must be taken from the SO-ARM100 STL.
8. Timing: lerobot-train has no time-shift augmentation hook. The jitter profile is applied in sim; wiring it into training is A1.3 work. The Pi GS external trigger needs the board-level XTR mod and a 1.8 V level shifter. Nothing has been run on hardware.
9. Klipper pin names must be checked against the SKR Mini E3 V3 pinout. The pro_heavy Octopus config is not written. The `Torque_Limit` register name must be checked against LeRobot's Feetech table.
10. Tr8x2 Z is slow (15 mm/s whip limit on the 1.45 m screw). That is fine for short routine moves; full travel takes about 85 s.
11. Still open from A1.1: no 2D drawings/DXF, MGN12 rails longer than common 1.5 m stock, 2438 mm posts.
