# CT72 rev A1.2 - belt gantry sizing (draft hand-calc)

## Layout choice: Cartesian with dual-motor X (not CoreXY)

- **Stiffer at 72 in.** A CoreXY at 1.75 m x 1.75 m needs two ~7.5 m belt loops that both carry every move. Belt stretch scales with length, and the hanging arm's reaction loads go through both long loops. A Cartesian gantry has a ~3.7 m loop per X side and a ~3.4 m loop for Y. The two X sides each carry half the bridge load.
- **Cheaper overall.** It needs one more motor and driver (about $15 + $5), but much less belt: about 11 m of GT2 against about 16 m for CoreXY. It also skips CoreXY's crossed-belt idler stack. And it keeps dual X endstops, so the gantry squares itself on homing.
- **Simpler to build and fault-find.** Each axis moves on its own, so a kid/classroom build can test one axis at a time. Klipper or Marlin both drive dual X with `stepper_x1` and per-side endstops.
- The moving Y motor rides the bridge (+0.35 kg). That is negligible at the slow accelerations an animal enclosure needs.

Assumptions: accel 1.0 m/s^2, routine speed cap 150 mm/s, usable torque = 45% of holding torque, friction/drag and arm reaction forces estimated (est).

## X / Y belts and motors

| Case | Arm | Belt | Guide | m_X kg | X pull/belt N | Y pull N | Allow N | Belt util X/Y | Motor | Motor util |
|---|---|---|---|---|---|---|---|---|---|---|
| starter | vacuum tool (0.35 kg + 0.07 kg) | GT2-10mm | vwheel | 13.5 | 11.0 | 15.9 | 44.5 | 0.25 / 0.36 | NEMA17 0.59 Nm | 0.38 |
| plus | SO-101 (1.2 kg + 0.25 kg) | GT2-10mm | mgn12 | 14.5 | 10.7 | 15.5 | 44.5 | 0.24 / 0.35 | NEMA17 0.59 Nm | 0.37 |
| pro | SO-101 (1.2 kg + 0.25 kg) | GT2-10mm | mgn12 | 14.5 | 10.7 | 15.5 | 44.5 | 0.24 / 0.35 | NEMA17 0.59 Nm | 0.37 |
| lite6_on_plate | Lite 6 class (optional arm on the plate) (8.0 kg + 0.6 kg) | GT2-10mm | mgn12 | 21.6 | 20.3 | 34.6 | 44.5 | 0.46 / 0.78 | NEMA17 0.59 Nm | 0.83 |
| pro_heavy | UR3e (11.2 kg + 3.0 kg) | HTD5M-15mm | mgn15 | 33.7 | 41.9 | 74.7 | 445.0 | 0.09 / 0.17 | NEMA23 3.0 Nm closed-loop | 0.88 |

Belt util > 1.0 = over the allowable working tension. The GT2-10 belt gantry covers the SO-101 tiers with a large margin. It also covers an 8 kg Lite 6-class arm on the universal plate, with lower margin: tune accel down. **The UR3e needs the stiff variant**: HTD-5M 15 mm or steel-core belts on MGN15/HGR15 rails, NEMA23 closed-loop, and a ball-screw Z with brake. The belt pull alone isn't the reason. A UR3e base reaction (est. 45 N, plus tens of N·m of moment) on a belt-and-V-wheel carriage would make the gantry ring and drift, and the ~15 kg hanging Z mass needs a brake.

## Z axis (hanging arm)

| Case | Drive | Hanging kg | Thrust N | Motor | Torque Nm | Util | Lead angle / friction angle | Holds unpowered | Z speed @600 rpm |
|---|---|---|---|---|---|---|---|---|---|
| starter | Tr8x2 lead screw | 3.6 | 78 | NEMA17 0.59 Nm | 0.083 | 0.31 | 5.2 / 8.5 deg | yes (self-locking) | 20.0 mm/s |
| plus | Tr8x2 lead screw | 4.6 | 94 | NEMA17 0.59 Nm | 0.1 | 0.38 | 5.2 / 8.5 deg | yes (self-locking) | 20.0 mm/s |
| pro | Tr8x2 lead screw | 4.6 | 94 | NEMA17 0.59 Nm | 0.1 | 0.38 | 5.2 / 8.5 deg | yes (self-locking) | 20.0 mm/s |
| lite6_on_plate | Tr8x2 lead screw | 11.7 | 210 | NEMA17 0.59 Nm | 0.223 | 0.84 | 5.2 / 8.5 deg | yes (self-locking) | 20.0 mm/s |
| pro_heavy | SFU1605 ball screw | 18.8 | 326 | NEMA23 + 24 V brake | 0.288 | 0.32 | 6.7 / 8.5 deg | NO -> brake required | 50.0 mm/s |

Screw whip: a Tr8 root ~6.2 mm over ~1.45 m, fixed-supported, has a critical speed of about 550 rpm (Thomson formula n = 4.76e6 x d x 1.55 / L^2, inch units). At 80% that is about 440 rpm, so **Z is capped at 15 mm/s** (Klipper `max_z_velocity`).

The belt tiers use a **Tr8x2 lead screw** (self-locking), so the arm can't drop on E-stop or power loss. That matters with birds below. A belt-driven Z would need a brake or counterweight. The trade-off is speed: about 20 mm/s, or about 60 s for full travel. Routines only do short Z moves. pro_heavy uses an SFU1605 ball screw, which is not self-locking, so it gets a 24 V fail-safe brake.

## Bridge sag (2080, simply supported, mid-span point load)

| Case | Sag mm |
|---|---|
| starter | 1.15 |
| plus | 1.31 |
| pro | 1.31 |
| lite6_on_plate | 2.41 |
| pro_heavy | 3.28 |

2080 strong-axis I taken as ~106 cm^4 (typical 20-series catalogue value; verify for the chosen vendor). If UR3e sag or vibration matters, stiffen the bridge with a 40x80 or a steel flat bar.

## Universal robot plate (rated for the heaviest supported arm)

Design case: UR3e 11.2 kg + 3.0 kg payload at 500 mm, 2x dynamic factor, plus an estimated 60 N·m base reaction. Moment 124.3 N·m on a 250 x 12.7 mm section: **18.5 MPa**, against 276 MPa for 6061-T6 (SF 14.9). UR3e ring: 4x M6 8.8 to the grid, each ~10 kN proof (ISO 898-1 class 8.8 M6 proof load ~11.6 kN). The plate is not the limit; the gantry is. Adapter rings swap per arm: SO-101 printed ring, vacuum-tool outrigger, UR3e 6061 ring. Each bolts to the same 5x5 M6 grid at 50 mm pitch.

## Homing / control

- Klipper (preferred) on a BTT SKR Mini E3 V3 (4x TMC2209 UART): X on X, X1 on E, Y, Z. Host is a Pi Zero 2 W (Starter), the Pi 5 (Plus) or the Jetson (Pro), with Moonraker API for the routine controller. pro_heavy uses external closed-loop drivers (step/dir) for the NEMA23s.
- **Mechanical endstops**: X min front + back (Klipper homes each X side to its own switch, so the bridge squares itself), Y min, and Z **max** (Z homes UP, away from birds). Plus/Pro add max-travel switches.
- TMC2209 sensorless homing (StallGuard) is available on X/Y, but not used as the primary homing method. A V-wheel gantry with a hanging load gives a noisy stall signal, so switches are more repeatable. StallGuard stays on as **collision detection** during moves.
- Soft limits + host zone guard: the Klipper `position_min/max` plus host-side no-go zones (nest bank front, basket pocket, roost stow strip) from `ct72_cell_a12.json`.

## Sources

- GT2 6 mm allowable working tension ~25 lbf/in width (SDP-SI timing-belt technical section, as quoted on the Prusa forum): 111 N per 25 mm -> 26.7 N (6 mm), 44.5 N (10 mm)
- GT2 fiberglass breaking strength ~86 N per mm width (OnDrives GT2 belt sheet)
- HTD-5M 15 mm: working tension estimated at ~10x GT2-10 (est; check the Gates PowerGrip HTD tables before release)
- Egg failure 34 +/- 6 N equatorial, 41 +/- 8 N polar (ICF11 'Failure mechanisms of hens' eggs'); ~45 N (Sutanto et al., Commun. Phys. 2025)
- STS3215-C047/C018 12 V: stall 2.7 A, 30 kg.cm (Waveshare ST3215 docs); 12 V 5 A PSU browns out under multi-joint load (SO-ARM100 issue #132)
