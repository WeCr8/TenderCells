# Implementation Order

## PR 1 — pure core
Copy:
- types
- math
- mixers
- profile registry
- capability gate
- pointer math
- simulator
- unit tests

No hardware behavior changes.

## PR 2 — simulation UI
Add:
- FreeTouchSurface
- ControlDeck
- MockTransport
- `/app/control-demo`

Prove touch lifecycle and simulator behavior.

## PR 3 — backend session gateway
Add:
- backend control modules
- `ws`
- server composition patch
- Node tests

Do not enable real device motion yet.

## PR 4 — firmware/sim analog consumer
Add:
- `/cmd/drive/analog` consumer
- firmware watchdog
- neutral on stale/deadman false
- bench tests

## PR 5 — Roaming Roost live opt-in
Enable live control only for devices advertising the correct capability.

## PR 6 — gamepad migration
Feed physical controllers through the same engine/session.

## PR 7 — native/advanced transports
Capacitor BLE, serial, MAVLink SITL, etc.
