# CT72 belt gantry - Klipper config (rev A1.2)

The layout is Cartesian with dual-motor X. Belt-tier hardware: GT2 10 mm belts, NEMA17 0.59 Nm motors and a Tr8x2 Z screw that homes UP. Why it isn't CoreXY, and the motor and belt sizing, are in the CAD pack's `GANTRY_SIZING.md`.

- `printer.cfg` is for a BTT SKR Mini E3 V3. **Check the pin names against the board pinout before first power-up.**
- The endstops are mechanical: one X-min switch per side (`stepper_x1` has its own, so homing squares the bridge), Y min and Z max. TMC2209 StallGuard is set up for collision detection only.
- The soft limits match the CAD travel. The host adds the no-go zones from `ct72_cell_a12.json` on top of them (`firmware/jetson-nano/ct72/cell.py`).
- `pro_heavy` (UR3e) does **not** use this file. It runs NEMA23 closed-loop drivers through step/dir from a BTT Octopus, with a ball-screw Z and brake. That config is still to be written.
