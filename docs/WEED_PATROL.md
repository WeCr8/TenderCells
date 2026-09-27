# Weed Patrol — weed finding + laser treatment, human in the loop

A FarmBot-style gantry scans a garden bed with a downward camera, flags every weed it
finds on the Tender Cells 3D property map, and treats a weed **only after a person
approves that exact weed**. Students start in **student mode**, where the robot only points a
low-power aiming dot and the laser never fires.

```
OS  /weed-patrol  ──HTTP──▶ express-api ──MQTT tc/{id}/cmd/weed──▶ weed_patrol_service.py
    3D map flags  ◀─poll─── /devices/:id/events ◀── tc/{id}/event ──  (detector + gantry + laser)
```

Code:
- Robot side: `firmware/jetson-nano/weed_patrol.py` (planning, detectors, gantry, laser interlocks) and `weed_patrol_service.py` (MQTT).
- API: `express-api/backend/src/yardEvents.ts` and the weed handlers in `mqtt.controller.ts`.
- UI: `pages/WeedPatrolPage.tsx`, `components/viewport/yardFlags.ts`, `hooks/useYardEvents.ts`, and `lib/yard/weedSim.ts` (the in-browser demo robot).

## Try it (no hardware)

- **Public demo:** open **Weed Patrol** in the side menu and press **Start pass**. A simulated robot scans the Genesis bed, and amber pins appear on the map and in the review queue. You then choose **Aim**, **Burn** or **Not a weed** for each one. Burn is refused until you turn off *Student mode*, turn on *Burn enabled* and close the enclosure (all simulated).
- **Full stack on a laptop:**
  ```bash
  cd applications/tendercells_ui/test_output/express-api && npm run dev          # API + MQTT broker
  cd firmware/jetson-nano && WEED_MODE=simulation DEVICE_ID=garden_weeder \
    ITEM_ID=item-garden-genesis MQTT_BROKER=mqtt://localhost:1883 python3 weed_patrol_service.py
  # OS with VITE_MQTT_API_BASE_URL=http://localhost:4000/api/mqtt → Weed Patrol
  ```

## Our robot types

| Type | Build | Laser | Why |
|---|---|---|---|
| **1. Genesis laser head (start here)** | FarmBot Genesis with a laser module on the UTM, driven through FarmBot's official `farmbot-py` (`WEED_GANTRY=farmbot`). This is the [Project Cyclops](https://github.com/rahularepaka/Project-Cyclops) design (CC0). | 500 mW 405 nm dot module, **Class 3B** (`LASER_PROFILE=diode-500mw`) | Matches the Genesis beds already on the property map. Cheapest path, well suited to students. |
| **2. Rover (next)** | A LiteWeed-style stop-and-align rover with a 2-DOF arm, running on-board detection. | 4 W 450 nm blue diode, **Class 4** (`LASER_PROFILE=diode-4w`) | For rows and open ground a gantry can't span. [LiteWeed](https://www.sciencedirect.com/science/article/pii/S2772375526005654) (Simon Fraser University, 2026) is about $500 CAD and reported 96–97% weed removal in field trials. |
| GRBL gantry | Any GRBL CNC-style gantry (`WEED_GANTRY=grbl`) | either profile | For DIY and classroom gantries |

Commercial references:
- [Carbon Robotics LaserWeeder G2](https://carbonrobotics.com/) is field-scale, CO₂-class lasers, and priced for large farms.
- WeedBot and Escarda make row-crop machines.
- [Tertill](https://tertill.com/) was the home-garden robot (mechanical, not laser) and has been discontinued. That leaves home and school garden laser weeding open.

### Laser profiles

Exposure scales with weed size between the profile's minimum and maximum, the same approach
LiteWeed takes (it tunes exposure by weed size and species). The pulse runs in 50 ms slices so
an E-STOP ends it immediately.

| Profile | Power / wavelength | Class | Exposure (starting values) |
|---|---|---|---|
| `fixed` (default) | module-specific | — | `LASER_PULSE_MS`, capped at 1500 ms |
| `diode-500mw` | 0.5 W / 405 nm | 3B | 2–8 s |
| `diode-4w` | 4 W / 450 nm | 4 | 0.5–3 s |

The exposure values are **starting points**. Calibrate them on test weeds for your module,
focus and working height.

### Genesis laser head wiring

```bash
WEED_MODE=live WEED_GANTRY=farmbot FARMBOT_TOKEN=<token from my.farm.bot> \
LASER_OUTPUT=farmbot FARMBOT_AIM_PIN=7 FARMBOT_LASER_PIN=8 FARMBOT_ENCLOSURE_PIN=9 \
LASER_PROFILE=diode-500mw STUDENT_MODE=true python3 weed_patrol_service.py
```

- Use a FarmBot **API token**, never the account password.
- The pin numbers above are examples. Use the Farmduino peripheral pins your laser relay and
  enclosure switch are wired to.
- An enclosure pin that reads unknown counts as **open**.

## Passes on a schedule

In **Schedules**, add a **Weed pass** action for the robot's device id (e.g. dawn and dusk, 1–10
passes). The express-api schedule runner publishes the pass, but it skips the run while E-STOP is
latched. Passes only *detect*. Treatment always waits for a person in the review queue.

## Live hardware

| Setting | Meaning |
|---|---|
| `WEED_MODE=live` | Real camera + gantry + GPIO |
| `GRBL_PORT=/dev/ttyUSB0` | G-code gantry (FarmBot-style / CNC controller with GRBL) |
| `CAMERA_INDEX=0` | Downward camera |
| `WEED_DETECTOR=hsv` (default) or `yolo` | Green-plant thresholding with known-crop exclusion, or a YOLO model |
| `WEED_MODEL=hf://owner/repo/best.pt` | YOLO weights from the Hugging Face Hub (needs `ultralytics`, `huggingface_hub`) |
| `AIM_PIN`, `LASER_PIN`, `ENCLOSURE_PIN` | BCM GPIO numbers; the enclosure switch reads *closed* when low |
| `STUDENT_MODE=false` | Allow burning (default **true** = aiming dot only) |
| `LASER_BURN_ENABLED=true` | Second, separate opt-in to burn (default false) |
| `LASER_PROFILE` | `fixed` (default), `diode-500mw` or `diode-4w`. Sets exposure by weed size; see Laser profiles |
| `LASER_PULSE_MS` | Pulse for the `fixed` profile, hard-capped at 1500 ms, with a cooldown between pulses |
| `BED_LENGTH_MM`, `BED_WIDTH_MM`, `ITEM_ID` | Bed size and the property-layout item the pins belong to |

## Laser safety (read before enabling burn)

Weeding lasers are **Class 3B** (the 500 mW module) or **Class 4** (the 4 W diode and up): they cause instant eye damage (including from reflections)
and are a fire risk in dry mulch. A burn requires **all** of the following:

1. `LASER_BURN_ENABLED=true` **and** `STUDENT_MODE=false` on the robot. These are env settings on the robot, not UI switches.
2. A closed enclosure / shroud interlock switch (the beam path is blocked otherwise).
3. No E-STOP. E-STOP latches (QoS 2, retained), stops the pass immediately and turns the laser off.
4. A person approves that single weed in the UI and confirms "no people or animals near the bed".
5. A bounded pulse (at most the profile's maximum, and an E-STOP cuts it) and a cooldown.

If any check fails, the robot refuses and the API returns **409** with the reason. The weed then
goes back into the review queue. Wear laser-safety eyewear rated for the wavelength, never
run burn mode unattended, and keep a fire extinguisher nearby. Classrooms should stay in
student mode.

## API / MQTT

| HTTP (express-api) | MQTT | Gated |
|---|---|---|
| `POST /devices/:id/weeds/pass {passes}` | `tc/{id}/cmd/weed {action:"pass"}` | E-STOP |
| `POST /devices/:id/weeds/:eventId/approve {mode:"aim"\|"burn"}` | `tc/{id}/cmd/weed {action:"approve"}` QoS 2 | E-STOP + robot interlocks |
| `POST /devices/:id/weeds/:eventId/reject` | `tc/{id}/cmd/weed {action:"reject"}` | never |
| `GET /devices/:id/events` | ← `tc/{id}/event` | — |
| `GET /devices/:id/state/weed` | ← `tc/{id}/state/weed` | — |

### Station flags

The same event channel carries the other pop-up flags on the 3D map:

- `egg_ready`: eggs ready in a Chicken Tender or Duck Dock. **Picked up** sends `tc/{id}/cmd/event {action:"ack"}`.
- `pickup_ready`: anything else ready to collect at a station.
- `headcount`: birds in the Roaming Roost versus roaming. The map shows the roaming birds walking the patrol area.
- `alert`: a fault or predator.

Events are upserted by `id`. `tools/simulate-device.mjs --kind coop|duck|roost` publishes all of them for testing.

## Existing platforms we looked at (good test beds)

| Project | What it is | Use here |
|---|---|---|
| [OpenWeedLocator (OWL)](https://github.com/geezacoleman/OpenWeedLocator) | MIT, Raspberry Pi + camera green-on-brown / in-crop detection driving relays | Same HSV idea as our `hsv` detector; a good student build |
| [Open Weeding Delta](https://github.com/Agroecology-Lab/Open-Weeding-Delta) | MIT, ROS 2 / Jetson delta robot with optional laser | Hardware reference. It publishes no laser safety process, so add the interlocks above |
| [Autonomous laser weed removal](https://github.com/RishiKrishnah/Autonomous-laser-weed-removal) | Student project: YOLO + galvo laser | Reference for aiming |
| [FarmBot weed detection](https://software.farm.bot/v4/Additional-Information/weed-detection.html) / [plant-detection](https://github.com/FarmBot-Labs/plant-detection) | FarmBot's camera weed detection (HSV + known plants) | Our gantry convention and the HSV approach. We wrote our own implementation because the plant-detection licence could not be confirmed |
| [YOLO weed detection Space](https://huggingface.co/spaces/Rohankumar31/Yolo-weed-detection), [another](https://huggingface.co/spaces/blurerjr/yolo-weed-detection) | Hugging Face demos of YOLO weed models | Try models in the browser, then point `WEED_MODEL` at compatible weights |
| [CottonWeedDet12](https://docs.voxel51.com/dataset_zoo/datasets_hf/cottonweeddet12.html) | 12-class weed detection dataset | Training / fine-tuning data |
| [WeedStemDetection](https://github.com/InternScience/WeedStemDetection) | Stem-point detection (AAAI 2025) | Better aim point than a box centre, for later |

Check each model's and dataset's licence before commercial use.
