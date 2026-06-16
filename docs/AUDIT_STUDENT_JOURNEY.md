# Audit — Student / 4-H Journey: Build → Register → Operate → Debug

Date: 2026-06-15. Traces a student building a device, registering it to their account,
operating it in the TenderCells OS, and testing/debugging. Severity:
**BLOCKER** (stops the journey) · **MAJOR** (works but confuses/fails often) · **MINOR**.

---

## 🔴 BLOCKER 1 — Device data model is split-brained (register + operate broken)

Two incompatible device records exist:

| | App (`deviceService.ts`) | Backend claim/ownership (`mqtt.controller.ts` + `auth.ts`) |
|--|--|--|
| Doc id | random `${type}_${Date.now()}` | the **MQTT device id** (e.g. `node_1A2B`) |
| Owner field | **`userId`** | **`ownerId`** |
| MQTT id | separate `mqttDeviceId` field | = the doc id |

Consequences:
- App lists devices with `where('userId','==',uid)` ([deviceService.ts:51](../applications/tendercells_ui/test_output/tendercells-ui/src/services/deviceService.ts#L51)) — **a claimed device sets `ownerId`, so it never appears** in the student's list.
- Backend `requireDeviceOwner` reads `devices/{mqttId}.ownerId` ([auth.ts](../applications/tendercells_ui/test_output/express-api/backend/src/middleware/auth.ts)). An **app-registered device** lives under a random doc id with `userId` → lookup misses → **403 "not claimed"** on every command.

**Fix (pick one model, apply everywhere):**
1. Make the **MQTT device id the Firestore doc id** everywhere (drop random ids; `mqttDeviceId === doc.id`).
2. Standardize the owner field — use **`ownerId`** in both app and backend (update `registerDevice`, `getUserDevices` query, and the telemetry/state mirror which already writes `ownerId`).
3. Telemetry/state bridge already writes `devices/{mqttId}` — align app reads to that doc.

Until reconciled, **register-then-operate cannot work on a logged-in instance.**

---

## 🔴 BLOCKER 2 — No claim UI (students can't register a device)

`POST /devices/:id/claim` exists, but the only documented way to call it is **curl with a
hand-pasted Firebase ID token** ([lesson](CLASSROOM_DOOR_AND_ROAMING_ROOST.md#step-3--register-the-device-to-your-account)).
Unrealistic for 4-H / classroom.

**Fix:** add a "Claim a device" button in the app — input the device id from `tc status`
/ the board's serial banner, call `/claim` with the signed-in user's token (the
`useHardwareControl` auth pattern). Auto-list it after claim.

---

## 🔴 BLOCKER 3 — Web flasher serves stale firmware

`/flash` flashes prebuilt binaries from `public/flash/firmware/…`, exported by
[export-web-flasher.mjs](../firmware/tools/export-web-flasher.mjs). The new
**door / drive / relay / gantry** peripherals were added to firmware but the web
binaries are **not regenerated** → a web-flashed board has none of them.

**Fix:** after any firmware change, run `pio run` then
`node firmware/tools/export-web-flasher.mjs starter-node`, commit the updated binaries.
Add this to CI so it never drifts.

---

## 🟠 MAJOR 4 — Setup portal hides the new peripherals

The WiFi-setup peripheral field lists only `none, camera, temp-humidity, ammonia, door,
load-cell` ([main.cpp:373](../firmware/starter-node/src/main.cpp#L373)). Students won't
know to type `drive`, `relay`, or `gantry`. *(Fixed in this pass — see commit.)*

## 🟠 MAJOR 5 — API base port mismatch (Windows)

`useHardwareControl` defaults to `http://localhost:4000` but the API is documented to run
on **4100** on Windows (4000 is phantom-reserved). No `.env` ships for the UI → fetch
fails silently as a CORS/connection error.

**Fix:** ship `tendercells-ui/.env.example` with
`VITE_MQTT_API_BASE_URL=http://localhost:4100/api/mqtt` and document it in the lesson.

## 🟠 MAJOR 6 — `deviceId` passed to controls may be the wrong id

[DeviceDetailPage](../applications/tendercells_ui/test_output/tendercells-ui/src/pages/DeviceDetailPage.tsx)
passes its `deviceId` (likely the Firestore doc id) straight to `RobotControlPanel` /
`useHardwareControl`, which call `/devices/:id/...`. Control needs the **MQTT id**. If
doc id ≠ mqtt id (Blocker 1), every command targets the wrong topic. Resolves once
Blocker 1 picks one id.

## 🟠 MAJOR 7 — No device auto-registration on first heartbeat

A freshly flashed board publishes telemetry but has no Firestore doc until claimed, and
claim requires the student to already know the id. There's no "unclaimed devices seen on
your network" discovery.

**Fix:** when the bridge sees a new `tc/{id}/sensors`, upsert `devices/{id}` as
`{ unclaimed: true, lastSeen }` so a "claim nearby device" list can show it.

---

## 🟡 MINOR
- **Firestore security rules** not verified for `ownerId` on `devices/*` (server gates;
  rules should too — defense in depth).
- **Auth project parity** — the web app and the API's Admin SDK must use the **same
  Firebase project**, else `verifyIdToken` 401s. Document it.
- **Debug aids exist** (Serial Monitor in flasher Learn mode, `tc status`) but there's no
  in-app "device online / last seen" badge for quick triage.
- **E-STOP clear** — UI sends estop; clearing it (`{active:false}`) isn't exposed as a
  button.

---

## Minimum to unblock a student end-to-end
1. Reconcile the device model — **mqtt id = doc id, `ownerId` everywhere** (Blocker 1).
2. **Claim button** in the app (Blocker 2).
3. **Re-export flasher binaries** + CI step (Blocker 3).
4. Ship UI **`.env.example`** with the right port (Major 5).
5. (Done) portal peripheral text (Major 4).

After 1–4, the path is: flash → portal sets peripheral → board heartbeats → claim in app
→ device appears → operate (door/drive/relay/gantry/arm) → debug via serial + live state.
