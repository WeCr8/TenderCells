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

The HTTP server attaches `/api/control/ws`. Live control is **disabled by default**:
the owner-authenticated handshake requires `TC_CONTROL_LIVE=1`, Firebase auth
(`TC_REQUIRE_AUTH=1` or Admin credentials), a claimed Firestore device whose
`productType` is `roaming-roost`, and the `freetouch` profile. Browser clients send
the Firebase ID token as the first WebSocket message, never in the URL. The browser
requires WSS outside localhost; expose a LAN hub through a TLS-terminating reverse
proxy before using this page across machines.

`/control-live` is the opt-in browser surface. It requires sign-in, a claimed device
ID, an explicit clear-area confirmation before connecting, and a reachable physical
E-STOP. The hub maps normalized throttle/steering axes to the existing
`tc/<deviceId>/cmd/drive` payload (`vx`, `vy`, `omega`, `speed`) at a conservative
0.35 speed cap; deadman release, disconnect, stale input, and tab loss neutralize
the command. Firmware advertises `productType: roaming-roost` and retains its local
500 ms stale-drive stop. The dedicated E-STOP request uses the existing retained
QoS 2 route. A successful hub response is not proof that the physical motors stopped.

The gateway foundation is exercised with injected test authorization/publishers:
frame validation, one lease per device (including competing connections that reuse
an ID), sequence rejection, timestamp/lease expiry, close/error neutralization,
and no successful ACK when publishing fails. Unknown axes are rejected. Watchdog
polling is 25 ms; the stale threshold is 500 ms, so actual detection can take up
to one polling interval beyond the threshold plus event-loop delay. Firmware
must enforce its own <=500 ms timeout; the server is not a real-time safety system.

Before setting the live-control flag or testing on a rover: flash the updated firmware,
verify owner claim and the reported product type, and complete supervised bench
acceptance with wheels raised, E-STOP, lost network, browser close, stale input, and
obstacle-stop cases. The feature flag and auth checks must remain on. The hub is not
a real-time safety system. Drone/MAVLink and other advanced profiles remain library
groundwork, not enabled by the practice or live Roaming Roost pages.

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
