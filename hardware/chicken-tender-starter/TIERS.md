# Chicken Tender - product tiers (Starter / Plus / Pro)

One product line, from a cheap door kit up to a full robotic coop. Each tier adds electronics,
sensors, robots and cameras on top of the one below; the safety contract (hardware NC E-STOP in
the driver enable line, gravity-closing door, MQTT `tc/{id}/...` topics) is the same in every tier.

| Tier | Electronics | Door actuator | Sensors | Robots | Cameras | Firmware in this repo | Status |
|---|---|---|---|---|---|---|---|
| **Starter** | Seeed XIAO ESP32-S3, Pololu DRV8874 (~2.0 A limit), Pololu D36V6F5 5 V, NC E-STOP, 12 V 3 A Class 2 adapter, 3 A fuse | Generic 12 V linear actuator, 12 in / 300 mm, built-in limit switches - **verify listing/force** (no ASIN or price given) | 2 door reeds (open/closed), DHT20 temp/humidity, driver current sense + nFAULT | none | none | `firmware/chicken-tender-starter` env `xiao_starter` | rev A1: firmware, host tests, electrical checks and BOM in this folder |
| **Plus** | Starter electronics + a second XIAO ESP32-S3 Sense as a camera node | Starter generic actuator, or the Pro Glideforce (same wiring; pick the matching firmware env) | Starter sensors + light level (LDR) for dusk/dawn door timing | optional classroom Roaming Roost (servo drive via `firmware/starter-node`) | 1 door/run camera (OV2640 MJPEG via `firmware/camera-node`) | `chicken-tender-starter` + `camera-node` (+ `starter-node`) | planned: built from existing firmware; no combined BOM or wiring yet |
| **Pro** | Chicken Tender ESP32-WROOM coop controller (feeder + cleaning steppers) alongside the door controller; Jetson-class edge AI box | **Glideforce LACT12-12V-05** (Pololu #2326, 150 N, 43.9 mm/s, IP65, $167.91 checked 2026-10-16) | Starter sensors + MQ-137 ammonia, feed weight (500 g cap), chicken headcount | Roaming Roost yard robot (`firmware/roaming-roost`), Chicken TenderCell gantry / arm (`firmware/jetson-nano` arm service) | camera node(s) + ChickenEye headcount on the edge box | `chicken-tender-starter` env `xiao_pro`, `chicken-tender`, `camera-node`, `roaming-roost`, `jetson-nano` | door: rev A1 here (`xiao_pro`, BOM); the rest is planned / prototype |

Notes

* The door controller is identical in all three tiers; only the actuator and the travel timeout
  differ (`xiao_starter` 55 s, `xiao_pro` 14 s).
* Starter actuator minimums: >= 290 mm stroke, >= 150 N, built-in end-of-stroke limit switches,
  IP54 or better, holes that take an M6 pin. Check the listing's force, stroke, current and hole size
  before buying; a slower actuator (< ~8 mm/s) needs a longer `CT_TRAVEL_TIMEOUT_MS`.
* Plus and Pro rows describe direction (Zach, 2026-10-16: "cheap up to pro versions with different
  levels of electronics, sensors, robots and cameras"). Only the door controller is BOM'd and checked.
