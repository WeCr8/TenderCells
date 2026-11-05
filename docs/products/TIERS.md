# Product Tiers

Every TenderCells product comes in tiers, from a cheap starter build up to a pro build. Tiers
change the electronics, sensors, robots and cameras; they do not change the product's job.

> Not the same as the curriculum "Tier 1–5" in [Learning Tracks](../LEARNING_TRACKS.md).
> Those are lesson levels; these are hardware levels.

## Electronics tiers

| Tier | Compute | Sensors / cameras | Typical use |
| --- | --- | --- | --- |
| **Starter** | XIAO ESP32-S3 only, or RC-only | Basic (bump, limit, XIAO camera where fitted) | Classroom, lowest cost, manual / scheduled control |
| **Plus** | Raspberry Pi 5 + XIAO | Cameras, IMU, ultrasonic / ToF | Logged sensing, simple autonomy, vision on the Pi |
| **Pro** | Jetson Orin Nano + XIAO | Depth or global-shutter camera, lidar | On-board detection, mapping, weed patrol |

The XIAO stays the real-time drive controller at every tier; the Pi or Jetson sends commands
to it. RC radio is optional at every tier and computer-only operation must always work.

## Rover: size × tier

Size is a separate axis. See the [Rover platform family](rover/README.md).

| | Starter | Plus | Pro |
| --- | --- | --- | --- |
| **Small** (TT-motor printed) | XIAO + motor driver, AA NiMH (kids) | Pi 5 bay fitted; power-limited | Jetson bay modeled; payload/power limited (to be confirmed) |
| **Medium** (printed 1/10-style) | XIAO or RC-only, donor ESC/servo | Pi 5 + cameras, IMU, ToF/ultrasonic | Jetson + depth/GS camera, lidar |
| **Large** (printed 1/8-style) | XIAO or RC-only, donor ESC/servo | Pi 5 + cameras, IMU, ToF/ultrasonic | Jetson + depth/GS camera, lidar |

Every Medium and Large build includes the RC/computer mux (when a radio is fitted) and LiPo
LVC + main fuse. Pi 5 and Jetson bays are designed into every size.

## Status

Planning document. Exact parts per cell come with each size's BOM.
