# Camera Relay Bridge

Closes the gap identified while reviewing remote camera viewing: the
authenticated HTTPS/WebRTC relay (`createCameraRelaySession` / `cameraRelaySignal`,
`functions/src/schoolPlatform.ts`) and the browser-side viewer
(`lib/camera/cameraRelay.ts`, `CameraFeedViewer`'s "🔒 Try secure relay" button)
already existed. Nothing on the device side ever answered them - a camera's
video never leaves the LAN today. `applications/tendercells_ui/test_output/express-api/tools/camera-bridge.mts`
is that missing device-side half.

**Status: written, not yet tested against a real camera.** No ffmpeg binary
was available in the environment this was built in, so the pipeline below is
verified against werift's actual type definitions (inspected directly, not
guessed) and the existing signaling contract, but not run end-to-end. Test it
on your own hardware before relying on it.

## Architecture

```
ESP32-CAM (LAN, MJPEG /stream)
        │  ffmpeg: -c:v libvpx -f rtp rtp://127.0.0.1:<port>
        ▼
  loopback UDP  →  werift MediaStreamTrack.writeRtp()  →  RTCPeerConnection
        │                                                        │
        │  Firestore (cameraRelaySessions/{id}/signals)          │  DTLS-SRTP
        │  - bridge posts "answer" + its own ICE candidates      │  via TURN
        │  - bridge reads the viewer's "offer" + ICE candidates  ▼
        └───────────────────────────────────────────►  Browser (CameraFeedViewer)
```

**Why ffmpeg does the encode, not werift/JS.** werift's own media dependency
(`mediabunny`) demuxes/muxes containers but expects you to supply a
`CustomVideoEncoder` - it ships no software VP8 encoder. A real-time software
encoder in pure JS is a bigger, slower undertaking than shelling out to
ffmpeg, which is a mature, well-tested RTP muxer already doing exactly this
job in production elsewhere. werift's only job here is the WebRTC transport:
ICE, DTLS-SRTP, and the signaling exchange.

**Why the bridge polls/listens to Firestore, not `cameraRelaySignal` over
HTTP.** `createCameraRelaySession` only ever writes to Firestore - a Cloud
Function has no path into your home LAN to *tell* a bridge a viewer is
waiting. The bridge instead runs on your LAN with its own Firebase Admin
credentials and listens to `cameraRelaySessions` directly
(`.onSnapshot()` - a real push, not manual polling) for sessions matching its
own `deviceId`s. No changes were needed on the Cloud Functions side - the
session document already carries everything (`deviceId`, `status`) the
bridge needs to find its own sessions.

## Prerequisites

- **ffmpeg** on `PATH`. Confirm with `ffmpeg -version`. Needs `libvpx` encoder
  support (`ffmpeg -encoders | grep vp8`) - most standard builds include it.
- A **Firebase service account JSON** - reuses the same
  `FIREBASE_ADMIN_SDK_PATH` / `GOOGLE_APPLICATION_CREDENTIALS` config
  `express-api`'s own `backend/src/config/firebase-admin.ts` already uses.
- **`TURN_URLS`** / **`TURN_SHARED_SECRET`** - same variables and same
  coturn REST-auth scheme as `functions/.env` (see README's self-hosting
  section and `docs/SCHOOL_PLATFORM_OPERATIONS.md`). The bridge mints its own
  short-lived TURN credential locally using the same shared secret; it does
  not need to match the viewer's credential.
- **`CAMERA_BRIDGE_DEVICES`** - which local camera(s) this bridge instance
  serves, as `deviceId=streamUrl` pairs:
  ```env
  CAMERA_BRIDGE_DEVICES=garden_cam_01=http://garden_cam_01.local/stream,coop_cam=http://192.168.1.42/stream
  ```

Put all of these in `express-api/.env` (or your shell environment).

## Run it

```bash
cd applications/tendercells_ui/test_output/express-api
npm run camera-bridge
```

Runs standalone - a separate process from the MQTT broker/API server
(`npm run dev` / `npm run demo`), deliberately, so it can run on different
hardware than the rest of `express-api` if that fits your setup better (a
Raspberry Pi near the cameras, while the broker runs elsewhere, for example).
It only needs LAN access to the cameras it's configured for and outbound
internet for Firestore/TURN.

## Testing checklist (do this before trusting it)

1. `ffmpeg -i <your camera's MJPEG URL> -c:v libvpx -f rtp rtp://127.0.0.1:5000`
   by hand first - confirm ffmpeg can actually read and transcode your
   specific camera's stream before involving WebRTC at all. Watch its stderr
   for encoder errors or a frame rate collapse.
2. Start the bridge, then click "🔒 Try secure relay" in `CameraFeedViewer`
   from a browser on a *different* network than the camera (the whole point
   is proving it works off-LAN). Confirm the video actually renders, not
   just that the connection reaches "connected".
3. Watch CPU/thermal on whatever runs ffmpeg during a multi-minute viewing
   session - this is the realistic failure mode on a Pi, not a quick
   glance.
4. Kill the bridge process mid-session; confirm the viewer surfaces a clear
   error (via its existing timeout/error states) rather than hanging.
5. Test with the camera's WiFi dropped and reconnected; confirm the bridge's
   ffmpeg process doesn't wedge silently.

## Known gaps (not built yet)

- **One viewer per session, no fan-out.** Two people watching the same
  camera means two ffmpeg processes today - `docs/SCHOOL_PLATFORM_OPERATIONS.md`
  already flags validating concurrent-viewer limits as required before
  production use; this doesn't yet enforce or even track a limit.
- **No reconnect/retry logic** if ffmpeg crashes mid-session - the session
  just goes dark until the viewer gives up (their existing 20s timeout in
  `cameraRelay.ts` still fires, so it fails visibly, just not gracefully).
- **Only the coturn shared-secret REST scheme is wired** (`mintTurnCredential`).
  That same scheme also works for Cloudflare Calls and most self-hosted
  setups. A provider with a different credential-minting flow (Twilio's, for
  example, which requires calling their API rather than computing a local
  HMAC) would need its own adapter - not built.
- **No auto-discovery of `hardware_capabilities` containing `"camera"`** -
  you list devices explicitly in `CAMERA_BRIDGE_DEVICES` rather than the
  bridge reading the product registry itself. Deliberate for this first
  pass (fewer moving parts to debug), worth revisiting once the pipeline is
  proven.
