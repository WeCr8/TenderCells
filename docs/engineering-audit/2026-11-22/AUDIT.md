# TenderCells engineering audit, 2026-11-22 (firmware, robot controllers, CAD)

**Scope:** what is on `main` under `firmware/` (WatchTower, camera node, starter node, roaming roost, chicken-tender ESP32 firmware, Jetson Python controllers), plus the Plus/Pro showcase STEP assemblies on PR #189's branch (`docs/chicken-tender-build-2026-11-20`, `091952c7`).
**Method:** the `eng_guardian` tools (private repo `hark-local-tools`, branch `hermes/eng-guardian-2026-11-22`): board pin tables, firmware/Python lint, STEP interference. Raw outputs are in `raw/`.
**Not done:** nothing was built, powered, flashed or run on hardware. No product source on any branch was changed; fixes here are proposals. Board pin tables are from public vendor documentation as known to the author: verify for the exact board revision. Lint findings are heuristics: each was confirmed by reading the source line unless marked otherwise.

## Summary
| # | Product | Finding | Severity | Status |
|---|---|---|---|---|
| 1 | WatchTower (`firmware/watchtower`) | Battery and solar voltage read with `analogRead` on GPIO35 and GPIO34. On the ESP32-S3 (`esp32-s3-devkitc-1`) the ADC pins are GPIO1-20, so these pins have no ADC; GPIO35 is also used by the octal PSRAM (`psram_type = opi`). The comments say "ADC1_CH6 / ADC1_CH7", which are classic-ESP32 channel names. | **High** | Confirmed in source (`main.cpp:36-37`, `396`, `402`). Fix needs the real wiring: pick free ADC1 pins (GPIO1-10), update the pin constants and the schematic. |
| 2 | WatchTower | Battery divider: the comment says R1=100k, R2=10k, ratio (R1+R2)/R2 = 11.0, but `readBatteryVolts` multiplies by 12.1. Either the resistors differ from the comment or the constant is a 10 % error. Solar divider (47k/10k = 5.7) matches. | Medium | Confirmed by reading `main.cpp:394-404`. Needs the schematic. |
| 3 | Jetson gantry (`firmware/jetson-nano/gantry_controller.py`) | `GantryController.move_joints` runs every step of every axis with **no E-STOP check inside the loop**, no travel limits, and an unclamped `speed` (`0` divides by zero; very large values shrink the pulse below any driver's minimum). The real class has no `estop_active` flag at all, while `SimulatedGantry` does and refuses to move: simulation and hardware behave differently. After an abort, `position` is updated with the requested distance, and a move shorter than one step still changes `position` (drift). `estop()` disables the drivers but there is no way to re-enable them. | **High** | Confirmed in source. Proposal with tests: `proposals/gantry_controller.diff` (7 tests pass against a fake GPIO). `mm_per_step` and the travel limits are ASSUMED placeholders and must come from the real machine. |
| 4 | chicken-tender (`firmware/chicken-tender`) | `PIN_STEPPER_ENABLE` is GPIO12, the flash-voltage strapping pin on ESP32-WROOM-32. If the driver board pulls its enable line high at reset, the board can fail to boot; if it pulls it low, the motor driver is energised during boot. | Medium | Pin use confirmed (`main.cpp:145`). Whether it is a real problem depends on the driver board's pull resistor: check the schematic. |
| 5 | roaming-roost | `RL_ENA` (PWM) on GPIO15, a boot-log strapping pin. | Low-medium | Confirmed (`main.cpp:126`). |
| 6 | starter-node | `BTN_PIN` on GPIO0 (boot button). Normal for a button, but holding it at reset enters download mode. | Info | Confirmed (`main.cpp:759`). |
| 7 | WatchTower, roaming roost, chicken-tender | A blocking `delay()` of 1 s or more in a path that also handles state transitions (`watchtower main.cpp:244` is 2000 ms in `handleError`). E-STOP and watchdog are not serviced while it runs. | Medium | Confirmed lines; whether it blocks a safety path needs a read of each caller. |
| 8 | Jetson `coordinated_motion_controller.py`, `gantry_controller.py` | `MOTION_NO_GUARD`: `parallel_motion` calls gantry and arm moves in parallel threads with no limit, E-STOP or time-out in the function; it relies on the controllers below it (see finding 3). | Medium | Confirmed for the gantry path; arm controllers not read. |
| 9 | Jetson `habitat_listener.py:80`, `weed_patrol_service.py:194` | Worker loops with no visible stop condition. | Low | `weed_patrol_service._worker` is a job-queue thread (`while True: job = queue.get()`), a normal pattern if it is a daemon thread. Not confirmed for `habitat_listener`. |
| 10 | Plus / Pro showcase assemblies (CAD) | 332 / 331 overlaps above 0.5 cm3 (names are in `raw/cad_showcase_*`). Almost all are modelling by design: the model is plain boxes with no joinery (post in concrete footing, lapped roof panels, SO-101 link proxy boxes sharing joints, cables bundled on the same segment). Two are worth a human look: `CL-GATE_chain-link_walk_gate_frame` overlaps `RR1_truss_bottom_chord_2x2` by 677 cm3 (gate frame versus roof truss: head clearance), and `P2_front_wall` overlaps `CL-TP_terminal_post_coop-end` by 37 cm3. | Check | Static pose only. No gantry or tool-dock part collides with the structure at the 0.5 cm3 threshold, but the swept reach is not checked here (the repo's `reach.py` and `clean_reach.py` cover motion). |
| 11 | camera-node | Camera pins (XCLK 10, SIOD 40, SIOC 39, Y9 48, ...) match the XIAO ESP32-S3 Sense pin table; no conflicts found. | OK | Scanner found no non-camera pins in use. |

## What each tool run covered
| Target | Tool | Result |
|---|---|---|
| `firmware/watchtower` | `eng_project_scan` | FAIL: 3 high (finding 1), 1 medium (7) |
| `firmware/starter-node` | `eng_project_scan` | PASS, 1 medium (6) |
| `firmware/roaming-roost` | `eng_project_scan` | PASS, 2 medium (5, 7) |
| `firmware/chicken-tender` | `eng_project_scan` | PASS, 2 medium (4, 7) |
| `firmware/camera-node` | `eng_project_scan` | PASS, no pin findings |
| `firmware/jetson-nano` | `eng_py_lint` | PASS (no high), 8 findings, 3 confirmed or partly confirmed (3, 8, 9) |
| Plus / Pro STEP | `eng_cad_interference` (min 0.5 cm3) | 332 / 331 overlaps, triaged above |

## Not audited (and why)
- `firmware/shared/tc_mesh` and the PlatformIO unit-test code: not scanned for pins.
- Hardware design files not on `main`: PR #188 (`hardware/chicken-tender-starter`), the CT72 cell (`hardware/ct72-cell`, PR #182), the SolidWorks files under `docs/products/chicken-tendercell/cad` (SLDPRT/SLDASM cannot be read by these tools; the UR3e STEP is vendor reference).
- Electrical schematics and BOMs: none are in a machine-readable form on `main`, so voltage, current and divider checks were limited to what the firmware states (finding 2).
- STEP files of the Base and Starter showcase variants were measured (222 and 237 solids) and interference-tested (299 / 301 overlaps), not triaged by name.
- Anything that needs the hardware: timing, motor torque, thermal, EMC, power-on behaviour.

## Recommended next steps
1. WatchTower: decide the ADC pins from the schematic (finding 1) and fix the divider constant (2). Highest value, small change.
2. Gantry: review `proposals/gantry_controller.diff`, set real `mm_per_step` and travel limits, then test on the bench with the motors unloaded before any load.
3. chicken-tender / roaming roost: check the enable-line pull resistors against the strapping pins.
4. Add the `eng_guardian` scan to CI for `firmware/*` so a new pin conflict is caught on the PR.
