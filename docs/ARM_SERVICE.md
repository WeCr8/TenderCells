# Arm service — Universal Robots, Hugging Face LeRobot, and simulation

One MQTT service drives any supported arm with the same commands in **simulation**
and **live**, runs **Hugging Face policies** from the Hub, and reports state to the
Tender Cells OS (Device → **Robot** tab).

```
OS (Robot tab) ──HTTP──▶ express-api ──MQTT──▶ arm_service.py ──▶ driver ──▶ arm
                 (safety gate)        tc/{id}/cmd/*      (latch + gate)   sim | UR | LeRobot
            ◀──────── tc/{id}/state/arm (joints, platform, mode, policy, estop) ◀──────
```

Code: `firmware/jetson-nano/` — `arm_service.py` (MQTT bridge), `arm_factory.py`,
`arm_interface.py` (shared safety rules), `sim_arm.py`, `ur_arm.py`, `lerobot_arm.py`,
`policy_runner.py`. Tests: `firmware/jetson-nano/tests` (run in CI).

## Platforms

| `ARM_TYPE` | Hardware | Needs | Notes |
|---|---|---|---|
| `sim` | none | — | Generic 6-DOF simulator; default |
| `ur` | Universal Robots UR3e/5e/10e/16e/20… | `UR_HOST` | `pip install ur-rtde` for blocking moves, live joint feedback and a real protective stop; otherwise URScript over port 30002. Robot in **Remote Control** mode |
| `lerobot` | Any Hugging Face LeRobot robot: SO-100/SO-101, Koch, OMX, OpenArm, reBot, bimanual variants… | `LEROBOT_TYPE`, `LEROBOT_PORT`, `LEROBOT_ID` | `pip install "lerobot[feetech]"` (SO-10x) or `"lerobot[dynamixel]"` (Koch/OMX). **Python 3.12+**. Calibrate first with `lerobot-calibrate` using the same id |

`ARM_MODE=simulation` runs the simulator with the chosen platform's joint layout
(e.g. SO-101 joint names and gripper range) — rehearse routines and policies, then
set `ARM_MODE=live`. The OS shows **SIMULATION** or **LIVE** next to the platform.

## Run it

```bash
cd firmware/jetson-nano
pip install paho-mqtt
# Simulation (works on any PC):
ARM_TYPE=lerobot LEROBOT_TYPE=so101_follower ARM_MODE=simulation \
DEVICE_ID=garden_arm ANIMAL_AREA=false WITH_GANTRY=false \
MQTT_BROKER=mqtt://192.168.1.50:1883 python3 arm_service.py

# Live SO-101 in a garden bed:
ARM_TYPE=lerobot LEROBOT_TYPE=so101_follower LEROBOT_PORT=/dev/ttyACM0 LEROBOT_ID=garden_arm \
DEVICE_ID=garden_arm ANIMAL_AREA=false WITH_GANTRY=false MQTT_BROKER=mqtt://192.168.1.50:1883 python3 arm_service.py

# Live UR5e on the Chicken Tender gantry (coop - chicken gate ON):
ARM_TYPE=ur UR_HOST=192.168.1.60 DEVICE_ID=ct_001 MQTT_BROKER=mqtt://192.168.1.50:1883 python3 arm_service.py
```

| Variable | Default | Meaning |
|---|---|---|
| `DEVICE_ID` | `ct_001` | Device the service answers for |
| `MQTT_BROKER` | `mqtt://localhost:1883` | express-api's broker |
| `ANIMAL_AREA` | `true` | `true`: refuse motion unless a fresh headcount shows **0 chickens**. `false` for gardens (no chickens to detect); E-STOP still applies |
| `WITH_GANTRY` | `true` | Also drive the XYZ gantry (routines need it); simulated off-Jetson |

## Hugging Face, three ways

1. **Robots** — any LeRobot robot type is a driver (`ARM_TYPE=lerobot`). Joint names
   come from the robot itself (`shoulder_pan`, `shoulder_lift`, … `gripper`).
2. **Policies** — Robot tab → **🤗 Hugging Face policy**: a Hub model id
   (e.g. `lerobot/smolvla_base`, or your own ACT policy) plus a task for
   language-conditioned policies ("pick the ripe tomato and place it in the basket").
   Live runs use LeRobot's `lerobot-rollout` on the arm; simulation runs use
   `lerobot-eval` in a LeRobot sim env (pusht, aloha, libero, metaworld). The service
   hands the serial port to LeRobot for the run and takes it back after.
3. **3D models** — Property Layout → Edit item → **🤗 Hugging Face** field: paste a Hub
   file link or `owner/repo/model.glb`. glTF/GLB only (convert URDF/STL in Blender).

## Safety

- **E-STOP** (`POST /devices/:id/estop`, QoS 2 retained) latches on the service: stops the
  arm (UR protective stop; LeRobot torque off — the arm goes limp), stops the gantry, and
  kills any policy run. Motion is refused until **Clear E-STOP** (confirmed in the UI,
  `POST /devices/:id/estop/clear`, which replaces the retained stop).
- Arm moves, routines and policy runs are refused by **both** express-api and the service
  when E-STOP is active, and — in animal areas — when chickens are detected or the headcount
  is older than 60 s.
- Joint targets outside limits are rejected (never silently clipped). LeRobot moves are
  streamed in capped 30 Hz steps; LeRobot's own `max_relative_target` also applies.
- Policy runs: one at a time, hard time limit (≤ 600 s), Hub id and task validated and
  passed as an argument list (no shell), confirm dialog in the UI.

## API / MQTT

| HTTP (express-api) | MQTT publish | Gated |
|---|---|---|
| `POST /devices/:id/arm {joints, speed}` | `tc/{id}/cmd/arm` | ✅ |
| `POST /devices/:id/routine {routine}` | `tc/{id}/cmd/motion {routine}` | ✅ |
| `POST /devices/:id/policy {repo_id, task?, duration_s?, sim_env?}` | `tc/{id}/cmd/motion {policy}` | ✅ |
| `POST /devices/:id/policy/stop` | `tc/{id}/cmd/motion {policy_stop}` | never |
| `POST /devices/:id/estop` / `estop/clear` | `tc/{id}/cmd/estop {active}` QoS 2 retained | never |
| `GET /devices/:id/state/arm` | ← `tc/{id}/state/arm` | — |

Every command carries a `seq`; the service answers on `tc/{id}/ack {seq, ok, error?}` and
express-api waits up to 3 s for it: **200** = the robot accepted, **409** = the robot refused
(with its reason, e.g. E-STOP), **202** = sent but no ack yet (offline / older firmware).
Presence: the service publishes `tc/{id}/status {"online": true}` retained with an MQTT last
will of `{"online": false}`; `GET /devices/:id/presence` also marks a device stale after 90 s
of silence. The service keeps retrying the broker, so it can boot before express-api.
Weed-finding / laser robots: see [WEED_PATROL.md](WEED_PATROL.md).

## Troubleshooting

| Symptom | Fix |
|---|---|
| "lerobot-rollout not found" | Install LeRobot on the controller (Python 3.12+) |
| "No recent chicken headcount" on a garden arm | Set `ANIMAL_AREA=false` |
| UR ignores moves | Put the robot in Remote Control; with `ur-rtde`, check nothing else holds the RTDE connection |
| LeRobot arm jumps / wrong angles | Recalibrate with `lerobot-calibrate` using `LEROBOT_ID` |
| Arm stays in E-STOP after restart | Use **Clear E-STOP** — the stop is retained on the broker by design |

LeRobot (Apache-2.0) and ur-rtde (MIT) are installed on the controller, not bundled.
