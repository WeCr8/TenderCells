# Feeder v9 vs the existing repo feeder: comparison notes (2026-11-22)

Hand-checked against the files in this folder and `docs/CLASSROOM_FEEDER_AND_WATERER.md` on `main`. A Hermes draft exists but was not used as source: it quoted lines it did not verify and mislabelled a figure (see "Hermes draft" below). **v9 is untested; every item here is paper-only.**

## Architecture
| Item | Repo today (`CLASSROOM_FEEDER_AND_WATERER.md`) | v9 package |
|---|---|---|
| Actuation | Timed pulse: a servo gate or a relay-driven motor, "turn on, wait, turn off" | 28BYJ-48 stepper through a ULN2003, six-pocket rotor, 60 degrees per pocket |
| Metering | Time, not weight | Count of pockets; the review says dose must be calibrated by weighed dispenses |
| Load cell | None in the basic design | TAL220B-style 5 kg bar cell on an HX711 (`MASTER_PARAMETERS_RECONCILED_V9.json`: capacity 5000 g) |
| Home / index | None | Hall sensor for the rotor home mark |
| Controller | "Starter Node" with the peripheral picked in setup (`servo` or `relay`) | Seeed XIAO ESP32-C3 |
Result: v9 does not fit the current `peripheral = servo | relay` model. Integrating it needs a new peripheral type (for example `stepper_feeder`) in firmware, hub and app. That has not been designed.

## Conflicts found
1. **Firmware pins do not match the pinout.** `Firmware/TenderCells_Feeder_v3_SIX_POCKET_STEPPER.ino` uses raw numbers IN1-IN4 = 2,3,4,5, HX711 = 6 and 7, Hall = 8. `Electronics/PINOUT.csv` puts HX711 DT/SCK on D1/D2, Hall on D3, and the ULN2003 inputs on D4-D7. On a XIAO ESP32-C3 the `Dn` labels are not the same numbers as GPIO 2-8, so these two files cannot both be right for the same wiring. Resolve against the board's pin map before wiring.
2. **Dose units.** The schedule UI offers up to 5000 g and the backend clamps at 1000 g (scheduling pack, `docs/FEED_WATER_WEATHER.md`). v9 dispenses whole pockets: about 19.94 cm3 per pocket, roughly 12-14 g if completely filled at the planning density of 0.58-0.68 g/cm3 (geometric maximum, not a measured dose). A gram request needs a pocket count plus a weighed correction loop that the firmware does not have (it only has `D` = one pocket, `H` = home, `W` = read scale).
3. **Hopper.** About 2.61 L, roughly 1.5-1.8 kg of feed (estimate; "final usable volume must be measured physically"). The repo doc gives no capacity.
4. **Load-cell margin.** 3744 g is the estimated maximum static load with feed (74.9 % of the 5000 g capacity), not a safe capacity. The package's own status: "PASS for static prototype; overload guard and push-load test mandatory".
5. **Power.** `POWER_BUDGET.csv` assumes a 5 V, 2 A or better prototype supply. The repo doc runs pumps at 12 V through a relay; v9 has no 12 V path.

## Unknown until tested
Pellet and crumble flow, bridging, jams, dose repeatability, load-cell bypass, cleaning, and the real 28BYJ-48 steps per pocket (the firmware's 683 is a placeholder).

## Hermes draft
Card `t_573a2728` on the Mac wrote `~/hermes-reports/feeder-v9/comparison.md`. It correctly identifies the servo/relay versus stepper difference but cites line numbers it did not verify, calls the 3744 g figure a "safe capacity", and lists pin assignments as "resolved" without comparing them. Treat as a rough draft only.
