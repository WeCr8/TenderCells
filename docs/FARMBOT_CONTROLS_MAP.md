# FarmBot-Dependent Controls — Map to Tender Cells

> What a FarmBot **Genesis** garden device can do, and which of those controls
> Tender Cells must add to operate a Genesis-style garden (CNC gantry over a bed).
> Sourced from FarmBot's web app (`frontend/controls/move`, `frontend/sequences/step_tiles`)
> and Celery Script corpus (`app/lib/celery_script`). FarmBot is MQTT-RPC, same as us.

Last updated: 2026-06-17

---

## How FarmBot controls work
FarmBot commands are **Celery Script** nodes sent over **MQTT** to the device's
Raspberry Pi, which talks to the Farmduino firmware (G-code-like). A *sequence* is
an ordered list of these nodes; a *regimen*/*FarmEvent* schedules sequences. This is
the same shape as our `tc/{id}/cmd/*` + `schedule.runner.ts`.

The control surface splits into **motion**, **pins/peripherals**, **tools**,
**camera**, **system**, and **sequence logic**.

---

## Control set (FarmBot step tiles + move controls)

| FarmBot control | Celery node | Purpose | TC status | TC mapping (proposed) |
|---|---|---|---|---|
| Move (to coord) | `move` / `move_absolute` | go to X,Y,Z (+ safe Z, speed) | ⚠ raw only | `cmd/gantry {action:"move", x,y,z, speed, safeZ}` |
| Move relative / Jog | `move_relative` | nudge X/Y/Z ± by step | ❌ | `cmd/gantry {action:"jog", axis, dir, stepMm, speed}` |
| Home / Move home | `move_home` | go to 0 on axis/all | ❌ | `cmd/gantry {action:"home", axis:"x|y|z|all"}` |
| **Find home** | `find_home` | seek endstop → set 0 | ❌ **blocker** | `cmd/gantry {action:"find_home", axis}` (GRBL `$H`) |
| **Calibrate** | `calibrate` | find axis length (stall) | ❌ **blocker** | `cmd/gantry {action:"calibrate", axis}` |
| Set zero | `set_zero` | set current pos = 0 | ❌ | `cmd/gantry {action:"set_zero", axis}` (GRBL `G92`) |
| Write pin | `write_pin` | drive a peripheral (valve, pump, light) | ⚠ relay only | `cmd/pin {pin, mode:"digital|analog", value}` |
| Read pin | `read_pin` | read sensor (soil moisture) | ❌ | `cmd/pin {action:"read", pin, mode}` → `state/pin` |
| Toggle pin | `toggle_pin` | flip a digital peripheral | ⚠ light only | `cmd/pin {pin, action:"toggle"}` |
| Set servo angle | `set_servo_angle` | servo peripheral (0–180) | ❌ | `cmd/servo {pin, angle}` |
| Mount/dismount tool | (sequence + `read_pin` verify) | swap tool head | ❌ | `cmd/tool {action:"mount|dismount", slot}` |
| Take photo | `take_photo` | capture from bot camera | ⚠ stream only | `cmd/camera {action:"capture"}` → photo to gallery |
| Emergency stop | `emergency_lock` | halt all motion | ✅ | `cmd/estop` (QoS2, retain) |
| Unlock / Reset | `emergency_unlock` | clear E-stop | ⚠ | `cmd/estop {active:false}` |
| Reboot / Shutdown | `reboot` / `power_off` | restart Pi/firmware | ❌ | `cmd/system {action:"reboot|shutdown"}` |
| Firmware action/config | `config_update` / `set_pin_io_mode` | steps/mm, motor current, stall sens. | ❌ | `cmd/firmware {key,value}` |
| Wait | `wait` | pause N ms | n/a (sequence) | sequence engine |
| If / Assertion / Lua | `_if` / `assertion` / `lua` | branching/scripting | n/a (sequence) | sequence engine |
| Execute (sub-seq) | `execute` | call another sequence | ⚠ partial | schedule.runner / sequence engine |
| Mark as | `update_resource` | set plant/point status | n/a | app data layer |
| Send message | `send_message` | log/toast/email | ⚠ | alert pipeline |

Legend: ✅ have · ⚠ partial · ❌ missing.

---

## FarmBot tool heads (peripherals the controls drive)
A Genesis uses a magnetic tool changer; each tool = a pin/peripheral the controls above operate:
- **Watering nozzle** → solenoid water valve (`write_pin`)
- **Seed injector** → vacuum pump (`write_pin`) + seed bin pickup move
- **Soil moisture sensor** → analog `read_pin`
- **Weeder** → mechanical, motion only
- **Camera (rotary tool / borne)** → `take_photo`
- Tool verification reed switch → `read_pin` confirms tool mounted

So the *device-dependent* control primitives are just: **structured gantry motion
(move/jog/home/find_home/calibrate/set_zero)** + **pin/servo I/O** + **tool
mount/dismount** + **take_photo** + **read sensor**. Everything else (sequences,
regimens, branching) is OS-side logic we already have the shape for.

---

## Gap summary — what to add for a working Genesis garden

**Blockers (cannot operate a real gantry garden without these):**
1. `find_home` + `calibrate` per axis (GRBL `$H`, homing cycle, soft limits).
2. Structured `move` (absolute X,Y,Z + safe-Z lift) and `jog` (relative).
3. Generic `pin` I/O (`write_pin`/`read_pin`/`toggle_pin`) — water valve, vacuum, soil sensor.

**Important:**
4. `set_servo_angle` (servo peripherals), `cmd/tool` mount/dismount, `cmd/camera` capture.
5. `cmd/system` reboot/shutdown; `cmd/firmware` config (steps/mm, motor current, stall).

**Already covered:** E-stop, relay/light toggle, camera stream, scheduling (≈ sequences/regimens).

### Implementation path (3 layers, mirrors existing gantry flow)
- **Firmware** (`firmware/starter-node`): extend the GRBL gantry handler to accept
  `action` (home/find_home/calibrate/set_zero/jog/move) → emit `$H`, `G92`, `$21`
  soft limits, `G0/G1` with feed; add generic pin write/read + servo; publish
  `state/gantry {x,y,z,homed}` and `state/pin`.
- **Backend** (`express-api .../mqtt.controller.ts`): add `cmd/pin`, `cmd/servo`,
  `cmd/tool`, `cmd/camera`, `cmd/system`, `cmd/firmware` schemas + routes (owner-gated,
  QoS1); keep estop QoS2/retain.
- **UI** (`useHardwareControl` + a `GardenControlPanel`): jog pad (X/Y/Z ± step),
  Home/Find-Home/Calibrate buttons, coordinate move, water/vacuum toggles, tool
  picker, Take Photo — gated behind the confirm modal + E-stop check.

Demo mode drives these against seeded gantry state; live mode against MQTT.

---

*Source of truth for FarmBot control parity. Implement the blockers first.*
