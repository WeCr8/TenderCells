# Route / Screen Plan

Recommended incremental routes:

- `/app/control-demo` — simulation-only first
- `/app/devices/:deviceId/control` — capability-gated live controller

Do not make Control Deck a mandatory global screen initially.

## Product entry points

Roaming Roost:
- primary first live target
- FreeTouch
- Arcade
- Mecanum if hardware truly uses mecanum drive
- physical gamepad

Rail/arm:
- reuse session framework later
- keep current discrete/specialized controls until an arm motion protocol is designed

Drone:
- SITL only during initial implementation
- use MAVLink bridge later
