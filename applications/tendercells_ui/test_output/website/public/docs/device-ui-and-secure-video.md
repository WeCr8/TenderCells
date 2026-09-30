<!-- Generated from docs/DEVICE_UI_AND_SECURE_VIDEO.md by website/scripts/sync-docs.mjs - edit the source, then run npm run sync:docs. -->

# Device UI, Telemetry, and Secure Video

This document records the implemented UI contract, known hardware limits, and validation steps for TenderCells camera and starter nodes.

## Young-builder rule

Flashing, registration, and normal controls must be understandable by a child age seven or older working with an adult. The UI uses one primary action per step, 44 px touch targets, plain-language recovery, and hides expert controls by default. An adult must handle wiring, batteries, pumps, motors, heaters, mains power, and moving mechanisms.

## Stream modes

| Mode | UI label | Scope | Security |
|---|---|---|---|
| `https://...` | Secure | Local or remote | Encrypted transport; relay must also authenticate device ownership |
| Private `http://`, `.local` | Local only | Same LAN | Not encrypted; never describe as secure |
| Public `http://...` | Unsecured | Remote | Must be blocked from automatic embedding |

The Seeed XIAO ESP32-S3 Sense MJPEG server may support only one active viewer. TenderCells unmounts the stream while its tab is hidden, reconnects when visible, and provides manual refresh, rotate, horizontal flip, and vertical flip. Orientation is stored per device in the browser.

The product dashboard and ChickenEye view both read the selected registered device's `camera_stream_url`. ChickenEye labels its generated recognition boxes as a preview; choosing a live camera does not imply that the current recognition overlay came from inference on that video.

Remote viewing is not complete until an authenticated HTTPS/WebRTC relay exists. A relay must verify the Firebase user owns the device, issue short-lived authorization, avoid public source URLs, and rate-limit concurrent viewers.

## Truthful device state

Registration describes what the board can support. Telemetry describes what is installed, enabled, and currently reporting. The UI must not turn a capability declaration into a sensor reading.

Recommended sensor payload fields are:

```json
{
  "temperature": 21.4,
  "humidity": 54,
  "batteryPercent": 82,
  "batteryVoltage": 4.02,
  "soundLevelDb": 38.5,
  "storageFreeMb": 14520,
  "wifiRssi": -57,
  "uptimeSeconds": 8124,
  "lastSeen": "2026-09-28T04:00:00Z"
}
```

Missing hardware reads `Not installed`. Installed hardware without a current value reads `Not reporting`. USB-powered devices identify the USB/external supply and do not show a fictional battery percentage.

## Animal identity

Animals belong to the signed-in account in Firestore `animals/{animalId}`. A camera, RFID reader, location, or product is an optional association and does not own the record. Existing local non-demo animals migrate once after sign-in; demo animals remain local.

Identity options are roster only, camera-assisted, RFID, microchip record, or camera plus RFID. Camera matching is probabilistic and must remain reviewable. RFID or a verified tag is the stronger identity signal. Profile tiles can use a species label, animal icon, ID badge, or a resized device/gallery photo.

## Low-cost starter profiles

- Camera: Seeed XIAO ESP32-S3 Sense with OV2640, USB-C or a protected battery system.
- Watering: Seeed XIAO ESP32-C3/S3 with optional water-level, flow, temperature, and low-voltage pump-relay modules.
- Feeding: Seeed XIAO ESP32-C3/S3 with optional hopper sensor, load cell, and motor driver.
- RC vehicle: ESP32 Starter Node with a low-voltage motor driver and steering servo; motors default to stopped.
- Drone monitor: ArduPilot/PX4 telemetry, routes, reports, schedules, and tasks. TenderCells does not replace stabilization, arming, geofence, return-to-home, or flight-controller failsafes.

Only installed board features may be enabled. Never connect a pump or motor directly to an ESP32 GPIO.

## Diagnostics findings

- An absent hardware API previously fell back to plausible simulated telemetry. Simulation is now allowed only after explicit Demo Mode seeding.
- Analytics previously generated seeded charts for real products. Real accounts now receive an empty state until telemetry history exists.
- Diagnostics previously displayed `localhost` and reference thresholds as active deployment state. The UI now distinguishes unconfigured, offline, and connected services and labels thresholds as reference values.
- Yard flags previously fell back to simulated events whenever the API was absent. That fallback is now gated by Demo Mode.
- ChickenEye previously ignored registered stream URLs and always labeled the viewport as simulated. It now follows the selected account device, reconnects after tab switching, and applies the same public-HTTP blocking rule.

## Local regression checklist

1. Type-check and build both the app and website.
2. Run camera URL classification and UI contract tests.
3. Verify MJPEG refresh, tab hide/restore, and all orientation controls against the physical ESP32-S3 Sense.
4. Verify unavailable temperature, sound, storage, GPIO, and battery readings never display invented values.
5. Add an animal with a gallery photo on desktop and mobile; verify Firestore synchronization and ownership isolation.
6. Test `/app/animals`, legacy `/app/birds` redirect, phone navigation, and tablet property layout.
7. Test the flasher at phone, tablet, and desktop widths; flashing itself remains Chrome/Edge desktop only.
8. Exercise network/API failures and confirm every failure offers a usable retry or setup explanation.

## Open work

- Authenticated HTTPS/WebRTC video relay: **client viewer built** 2026-09-30
  (`CameraFeedViewer`'s "🔒 Try secure relay" button, `lib/camera/cameraRelay.ts` -
  creates the session via `createCameraRelaySession`, exchanges offer/answer/ICE
  via `cameraRelaySignal`, renders the resulting track). **Device/bridge side is
  still not built** - nothing today answers the offer, so this correctly reaches
  "waiting for the camera to answer" and times out until an ESP32-CAM-facing
  bridge (something that speaks WebRTC toward the browser and MJPEG toward the
  camera's local `http://` stream) exists. That bridge, and multi-viewer
  fan-out, remain open.
- Firebase Storage-backed animal reference-image sets for recognition training.
- Persistent telemetry history and user-defined alert thresholds.
- End-to-end MQTT implementations for microphone events, microSD recording, GPIO pin maps, waterer, feeder, RC vehicle, and flight-controller bridge.
- School identity and supervised deployment guidance: [DREAM Academy School Pilot](https://github.com/WeCr8/TenderCells/blob/main/docs/DREAM_ACADEMY_SCHOOL_PILOT.md).
