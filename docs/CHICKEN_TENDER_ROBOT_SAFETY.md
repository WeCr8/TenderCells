# Chicken Tender robot safety: cleaning and egg routines (Plus / Pro ceiling gantry + SO-101)

*Draft 2026-11-22 for PR #189 (branch `docs/chicken-tender-build-2026-11-20`). Code: `cad/chicken-tender-coop/showcase/routines.py`, `clean_params.py`, `tools_cad.py`, `clean_reach.py`, tests in `test_routines.py`. Prices and parts marked **ASSUMED** have not been checked against a real listing.*

---

## Part 1: for the family (and kids)

**The robot only works when the coop is empty and closed.** It is a helper that stirs the bedding and collects eggs. It is not a toy, and it never works while a hen or a person is inside.

Before the robot moves, **all** of these must be true:

1. **No hens inside.** The camera has seen no bird or person for a full minute. The motion sensor (PIR) is quiet. The scales under the roost and the nest boxes read empty.
2. **The hens' pop door is shut.** The door sensor says closed, and the door motor is not running.
3. **The red E-STOP button is out.** Push it and everything stops right away.
4. **Every people door is shut.** That means the side service door, the back cleanout door and the egg-bay door.
5. **It's daytime, the hens are out in the run, and it isn't raining.**

If anything changes while it's working, it stops at once:

- **A hen walks in:** the robot **freezes** and goes soft. When she has been gone for a full minute, it slowly lifts the scoop out and moves up out of the way. Then it stops and tells you.
- **A door opens or the E-STOP is pressed:** the robot stops and **stays off**. To start it again, close the door (or twist the E-STOP button out) **and** press "Re-arm" in the app or on the panel. Opening the door again never makes it start by itself.
- **Something looks wrong** (a sensor stops talking, a move takes too long, the two "is a hen here?" sensors disagree): it stops and sends you a message.

**Rules for kids:**
- Never reach into the coop when the app says the robot is working. Open the egg door instead: that stops it.
- If you open a service door, an adult has to press Re-arm afterwards.
- Hens are locked out in the run while it cleans (up to an hour), so make sure the run has water and shade.

---

## Part 2: for the engineer

### 2.1 Layers
1. **Hardware chain (no software):** E-STOP NC block 3, plus the reeds on RS-SD1, RS-SD2 and RS-EGGBAY, all in series with the EB2 motor-rail relay coil. Opening any of them drops gantry, SO-101 bus, tiller and cassette power. This matches `service_params.DOOR_INTERLOCK` and `ebay_params.ESTOP_NC_BLOCKS`.
2. **Motion-controller local stops** (FluidNC-class ESP32 in EB2, **ASSUMED** pin mapping):
   - The PIR goes to `feed_hold_pin`.
   - A second pop-door closed reed (RS1B) goes to `safety_door_pin`.
   - A retriggerable hardware watchdog (the host must pulse it) sits in series with the relay coil.
3. **Host state machine** (`routines.py`, on the Pi 5 or Jetson). It handles permissives, debounce, fault actions, soft limits, timeouts, logs and notifications.

### 2.2 Permissives (every one must be true before any gantry or arm motion)

| # | Permissive | Source | Rule |
|---|---|---|---|
| a1 | Camera clear | XIAO Sense person/bird detector (CAM_Z), MQTT | Clear continuously for **≥ 60 s** (`CAM_CLEAR_HOLD_S`) |
| a2 | PIR quiet | AM312 (new) | Not active. **Camera clear + PIR active = `sensor_disagree`, abort** |
| a3 | Load cells (optional for CLEAN) | Roost ×1, nest ×2 | Roost < 0.30 kg, nest < 0.15 kg (**ASSUMED**; one egg is about 0.06 kg) |
| a4 | Nest load cells (required for EGG) | Nest ×2 | Fitted **and** empty. If they are missing, the egg routine never starts |
| b | Pop door closed | XIAO D8 REED_CLOSED, D9 REED_OPEN, DRV8874 current | Closed reed stable ≥ 0.3 s, open reed off, current ≤ 80 mA |
| c | E-STOP | ESTOP_SENSE (XIAO D10, WROOM GPIO32) | High |
| d | Person doors | `service_params.DOOR_REEDS` (now RS-SD1, RS-SD2; SD2 is the enlarged cleanout), plus RS-EGGBAY (new). Placeholders SD_LEFT / SD_RIGHT_LOW / SD_BACK are used until that file exists | All closed |
| e | Window | Clock and rain input | 09:00–15:30 (**ASSUMED**), not raining |
| f | Not latched | — | No E-STOP latch and no maintenance lockout |
| g | Fresh data | Every safety input | Each value must be ≤ 5 s old. Host heartbeat ≤ 0.5 s |

Debounce is asymmetric. A "closed" reading must be stable before it counts. An "open" reading acts on the first sample.

### 2.3 Fault table (`routines.FAULTS`)

| Code | Action | Latch | Notes |
|---|---|---|---|
| estop, watchdog | Power cut (hardware) | E-STOP: ESTOP_SENSE high **+ re-arm** | Re-arm while still pressed is refused |
| service_door_open (any person door, any state including idle) | Freeze | **Maintenance lockout**: doors closed ≥ 2 s **+ re-arm**. Never auto-restarts | A re-arm press while the door is open, or < 2 s after closing, is refused and logged |
| presence_camera, presence_pir, sensor_disagree, presence_roost_load, nest_occupied, presence_stale | **Freeze** (servos compliant, steppers hold) | — | Auto-retreat only after all presence sensors are clear for the 60 s hold |
| pop_door_not_closed, door_reed_conflict, door_actuator_moving, door_stale | Retreat | — | A single reed bounce counts |
| step_timeout (> 2× planned), routine_timeout (clean 60 min, egg 10 min), soft_limit, servo_overload | Retreat | — | |
| raining, outside_window | Finish the cell, then retreat | — | |

**Retreat:**
1. Lift the tool straight out of the bedding at half speed.
2. Raise Z to `GZ_TRAVEL_MAX` (1280) at `SAFE_Z_SPEED` (10 mm/s).

Any presence during the retreat switches it to Freeze. A retreat ends in STOPPED (notify). The plan never resumes on its own.

**Soft limits** (checked for every step):
- XY speed ≤ 100 mm/s, or ≤ 50 mm/s within 80 mm of a travel end.
- Z speed ≤ 20 mm/s; acceleration 500 mm/s².
- XY moves only with gz ≤ 1280, and never with the tool in the bedding. XY and Z never move together.
- Position stays inside GX_RANGE, the Y carriage stops and GZ 900–1380.

### 2.4 Tests (`python -m pytest test_routines.py -q`): 25 pass
- Chicken enters mid-clean: freezes, then retreats once she has been clear for 60 s.
- Chicken stays: no motion.
- Reed bounce: blocks the start, and a bounce mid-clean triggers a retreat with no resume.
- E-STOP: latches, and re-arm is refused while pressed.
- Sensor disagree: aborts mid-run and blocks the start. A stale camera freezes.
- Service door: lockout and re-arm sequence, lockout from idle, placeholder fallback.
- Egg routine: needs empty nests, freezes if a hen steps in, stops if the pop door opens.
- Watchdog, rain, out-of-window, jam timeout, soft limits.

### 2.5 New BOM parts (safety)

| Ref | Part | Qty | Wiring | Est. USD |
|---|---|---|---|---|
| PIR1 | AM312 mini PIR 3.3 V | 1 | Upper front-right corner, looking down. Goes to the WROOM MCP23017 (INT), and through a 2N7000 to FluidNC `feed_hold_pin` | 2 **ASSUMED** |
| RS-EGGBAY | Surface alarm reed contact, NC-when-home | 1 | Series relay-coil chain + MCP23017 | 3 **ASSUMED** |
| RS-CLEANOUT | Same | 0–1 | Only if the service doors (SD2) are not built | 3 **ASSUMED** |
| RS1B | Second pop-door closed reed | 1 | FluidNC `safety_door_pin` (local stop, independent of Wi-Fi) | 3 **ASSUMED** |
| LC-ROOST | 4 × 50 kg half-bridge cells + amplifier | 1 set | See the load-cell ADC note below | 8 **ASSUMED** |
| LC-NEST | 5 kg bar cell + amplifier, one per box | 2 | Same | 12 **ASSUMED** |
| LC-ADC | NAU7802 ×3 + TCA9548A I2C mux (preferred over HX711) | 1 | WROOM I2C GPIO21/22 | 15 **ASSUMED** |
| RAIN1 | Rain plate (YL-83 class) on the run roof | 1 | MCP23017 (or use a weather API) | 3 **ASSUMED** |
| WD1 | Retriggerable hardware watchdog (TPL5010 / 555 class) + coil-chain contact | 1 | Host GPIO pulse; drops the EB2 relay if the pulses stop | 4 **ASSUMED** |
| T6 | Slotted trowel 150 × 80, PETG-CF print (~58 g), fork + rail extension | 1 | Dock x 824 | 4 **ASSUMED** |

Safety additions total about **$57–60** (**ASSUMED**).

**Load-cell ADC:** the WROOM has no safe free GPIOs left after the electronics-bay pin plan. HX711s would need 3 DOUT + SCK lines, so the I2C NAU7802 is used. If HX711 is preferred, put the three on a separate small MCU.

**Service-door reeds** RS-SD1 and RS-SD2 are in `service_params.py` (another workstream) and are not repeated here.

### 2.6 Failure modes

| Failure | Effect | Mitigation |
|---|---|---|
| Camera misses a hen (dust, low light) | Possible motion with a hen present | PIR AND camera AND load cells all required. Disagreement aborts. Hardware feed-hold on the PIR |
| PIR false trigger (heat, sun patch) | Nuisance aborts | Treated as safe. Log and tune the aim / hood |
| Reed magnet drifts or a reed is stuck closed | Door reported closed while open | Second pop-door reed on FluidNC. Open reed and current cross-check. Reed-conflict fault |
| Load-cell drift | Empty reads as occupied (safe) or occupied as empty | Tare at each door close. The egg routine also needs a clear camera |
| Wi-Fi / MQTT drop | Stale data | 5 s staleness → freeze. Hardware chain and FluidNC local stops keep working |
| Host crash | No commands | Hardware watchdog drops motor power |
| Servo overload in wet litter | Stall, heat | Torque check below. STS3215 load > 70 % → retreat, and the next pass goes shallower |
| Hen nesting when the door closes | Hen locked inside | Clean and egg routines never start (presence / nest_occupied). Door scheduling stays with the door controller; the routine never commands the door |
| Hens locked out too long | Heat stress | Window 09:00–15:30. Clean timeout 60 min (one full pass is about 14 min) |

### 2.7 T6 trowel, reach and cycle time

**Torque** (`tools_cad.py`, STS3215 at 12 V, working limit = 50 % of 2.94 N·m stall):
- A 100 mm-wide blade is over the limit at wrist_flex: margin 0.90.
- At 90 mm the margin is 0.98.
- **At 80 mm it passes: wrist_flex margin 1.09** (shoulder_lift 1.12, elbow 1.41, wrist_roll 5.8). That is 2.2× the stall torque.
- Payload is 0.25 kg on the full blade, scaled by area; curl drag is 6 N scaled by width and buried length (**ASSUMED**).
- The motion avoids a full-depth shovel drag. It plunges to 190 mm (axial load, to aerate), withdraws to 70 mm, then curls 35°.
- Bases are chosen to keep torque low.

**Reach** (`clean_reach.py`, SO-101 URDF IK with the 220 mm tool offset, mesh clearance ≥ 10 mm to keep-outs, gz ≤ 1280, 3:12 roof):
- **94.7 % of the open bed** in front of the droppings board. The only open-bed cell missed sits on the bed temperature probe, which is a keep-out.
- 66.8 % of the whole tray. The strip under the droppings board cannot be reached, so it is left to T1 / the cassette.
- All four open-bed corners are reached at 9 in and 10 in fill.
- Mast top to rafter underside ≥ 54 mm.

**Cycle time:** one full bed pass of 59 cells takes about **13.8 min** (arm 11.4 s per cell, plus XY/Z moves and the T6 pick and return).
