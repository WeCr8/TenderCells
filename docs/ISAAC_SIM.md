# NVIDIA Isaac Sim with Tender Cells

Isaac Sim lets students, model builders and operators rehearse robots on a copy of the real
property before anything moves outside. There are three pieces:

| Piece | Where | What it does |
|---|---|---|
| **Property → USD** | OS: Property Layout → **Isaac Sim (.usda)** (`src/lib/yard/usdExport.ts`) | Exports the layout as an OpenUSD stage (Z-up, metres). It includes terrain ground, every product and obstacle, each camera mount as a `Camera` prim, and a physics scene. |
| **Arm driver** | `ARM_TYPE=isaac` (`firmware/jetson-nano/isaac/isaac_arm.py`) | The same MQTT arm service, routines, LeRobot policies and safety rules (E-STOP latch, joint limits), driving a robot articulation inside Isaac Sim. |
| **Synthetic weed data** | `firmware/jetson-nano/isaac/weed_dataset.py` | Uses Replicator to scatter weeds over a bed from the exported stage. It writes RGB images plus tight 2D boxes for training the Weed Patrol detector. |

## Requirements

- Isaac Sim needs an NVIDIA RTX GPU. The documented minimum is an RTX 4080 with 16 GB VRAM ([requirements](https://docs.isaacsim.omniverse.nvidia.com/5.1.0/installation/requirements.html)).
- Schools without that hardware can run it in the cloud with the [Isaac launchable](https://github.com/isaac-sim/isaac-launchable), which is a browser-streamed Isaac Sim on a rented GPU.
- Source and releases: [github.com/isaac-sim/IsaacSim](https://github.com/isaac-sim/IsaacSim).

## 1. Export the property

1. In the OS, open **Property Layout** and click **Isaac Sim (.usda)**.
2. In Isaac Sim, choose **File → Open**, then pick the file.

Stage layout:

- `/World/Property/<itemId>` is an `Xform` with a box stand-in. It carries these custom attributes: `tc:type`, `tc:kind`, `tc:deviceId`.
- Replace the box with the real robot by adding a reference to its USD on that prim.
- `/World/Property/<itemId>/cam_<mountId>` are the same inside and outside camera views as the OS 3D view. Replicator can render them.
- `/World/Property/Ground` is the terrain height field, with collision.

Axes: USD X points east, Y points north (up the map) and Z points up. The property centre is the origin.

## 2. Drive a simulated arm over MQTT

Run this inside Isaac Sim's Python, with a robot articulation at /World/arm on the open stage:

```bash
ARM_TYPE=isaac ISAAC_ARM_PRIM=/World/arm DEVICE_ID=ct_001 MQTT_BROKER=mqtt://localhost:1883 \
  ./python.sh firmware/jetson-nano/arm_service.py
```

- `ISAAC_API=auto` (the default) uses `isaacsim.core.prims.SingleArticulation` on Isaac Sim 5.x/6.x. It falls back to `isaacsim.core.experimental.prims.Articulation` on 7.0+. Force either one with `stable` or `experimental`.
- Angles stay in degrees on MQTT. The driver converts to radians and steps physics until the joints settle.
- The joint layout is read from the USD robot.
- E-STOP holds the current pose and latches, exactly like hardware.

## 3. Generate weed training data

```bash
./python.sh firmware/jetson-nano/isaac/weed_dataset.py --stage yard.usda --bed <garden item id> --frames 500 --out _weeds
```

- Each frame moves the overhead (tool) camera and re-scatters the weeds.
- Output is Replicator `BasicWriter` RGB + `bounding_box_2d_tight`.
- Convert the boxes to YOLO format and train. Then point the robot at the result with `WEED_DETECTOR=yolo WEED_MODEL=hf://owner/repo/best.pt`.
- Use `--weed-usd` with real weed assets for better sim-to-real transfer.

## Ideas for classes

- **Students:** export their own yard, then test a Roaming Roost patrol route against the no-go zones (the same zones the real robot gets).
- **Model builders:** generate a few thousand labelled weed frames, fine-tune YOLO, and compare against the HSV detector.
- **Operators:** rehearse an arm routine or a LeRobot policy in Isaac Sim with `ARM_TYPE=isaac`, then switch to `ARM_TYPE=ur` or `lerobot`.
