# Control Deck v0.2 integration

The OS has a **Practice driving** entry on `/demo`, opening `/control-demo`
(`/app/control-demo` on the hosted site). It drives a visible simulated Roaming
Roost through the package's normalized engine, session, mock transport, and rover
simulator. Touch, keyboard, and gamepad use that same path.

## Controls

- Touch: left half for forward/reverse, right half for steering. Release to stop.
- Keyboard: hold Space with arrow keys. Release Space to stop.
- Gamepad: hold the left bumper and move the left stick. Release the bumper to stop.
- E-STOP simulation immediately stops and latches. Reset explicitly to drive again.
- Pointer cancel, lost capture, tab hiding, and blur neutralize input. After tab
  hiding, a held gamepad bumper must be released before rearming.
- Input older than 250 ms becomes neutral. Simulation history is bounded.

The field and telemetry are labeled simulated. No Firebase, MQTT, camera, or live
WebSocket motion request is made by this page. The existing global hardware
E-STOP, discrete controls, and camera viewer remain separate. `cameraSlot` remains
available for a future camera-backed deck; this page supplies the simulator view.

## Backend boundary

The HTTP server now attaches `/api/control/ws`, which **rejects all connections by
default (403)**. Production composition supplies neither an authorization callback
nor a working motion publisher. There is no environment flag that enables this.

The gateway foundation is exercised with injected test authorization/publishers:
frame validation, one lease per device (including competing connections that reuse
an ID), sequence rejection, timestamp/lease expiry, close/error neutralization,
and no successful ACK when publishing fails. Unknown axes are rejected. Watchdog
polling is 25 ms; the stale threshold is 500 ms, so actual detection can take up
to one polling interval beyond the threshold plus event-loop delay. Firmware
must enforce its own <=500 ms timeout; the server is not a real-time safety system.

Before any live enablement: implement verified owner authentication, server-side
capability and profile gating, explicit user confirmation and interlocks,
retained E-STOP integration, the actual analog firmware consumer, firmware stale
watchdog, and bench acceptance. Production live control is intentionally not
claimed complete. Drone/MAVLink and other advanced profiles are library groundwork,
not enabled by the practice page.

## Package provenance

Original ZIP: `TenderCells_ControlDeck_FULL_BUILD_v0_2.zip`.
SHA256: `2480307102af4e8bcd57c3d08f8f8babe924a6fe0059f4cd3ff1add5c07905e9`.
All 88 entries are preserved under `handoffs/controldeck-v0.2`; the 87 supplied
hash entries verified. Source overlay is integrated in the UI and hub workspaces
and hardened there; the original extracted package remains unchanged.
Baseline: `53c934786be821084dec43fb5194f72ae2d7af73`.

## Validation

- Original standalone harness: 19 assertions passed.
- UI: TypeScript, 202 Vitest tests, production build, ESLint (3 pre-existing warnings).
- Hub: TypeScript, 53-test full suite passed, then 11 focused control tests passed after adding a publisher-failure case; description check passed.
- Playwright: 6 cases passed covering drive/release/cancel/blur/E-STOP/reset, gamepad deadman and background
  handling at desktop, tablet, and mobile Chromium sizes; no analog network request.
- Physical gamepad, real touch hardware, Safari, firmware and live robot testing
  require hardware acceptance and are not represented by emulated browser tests.

Run the browser checks with `TENDERCELLS_DEV_URL` set to a running OS Vite server:
`npx playwright test tests/ui/control-deck.spec.ts --workers=1`.

Website TypeScript, ESLint, document sync/check, links, and build passed. Link
checking needed a Windows-compatible basename fix for same-page lesson anchors.
