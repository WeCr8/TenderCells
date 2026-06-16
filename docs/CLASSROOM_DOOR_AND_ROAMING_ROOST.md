# Classroom: Build a Door + a Basic Roaming Roost

A **teacher-led, hands-on lesson** where students 3D-print a coop door and a small
rover, wire one cheap servo (or two), flash a real ESP32, **register the device to
their account**, and then **open/close the door and drive the rover from the Tender
Cells OS** — manually or on a schedule. Same firmware contract, same safety rules the
real robot coops use.

Builds directly on [Build Your Own Device](CLASSROOM_BUILD_YOUR_OWN_DEVICE.md) (threat
alerts) and [Classroom Quickstart](CLASSROOM_QUICKSTART.md) (no-hardware first run).
Do those first if you've never flashed a board.

> **One firmware, two actuators.** The same Starter Node binary becomes a *door* or a
> *basic Roaming Roost* depending on the **peripheral** you pick during WiFi setup.
> Nothing is baked into the chip — students choose at setup time.

---

## What you're building

```text
 peripheral=door            peripheral=drive
 ┌───────────────┐          ┌────────────────────┐
 │ 1 hobby servo │          │ 2 continuous servos │
 │ swings a 3D-  │          │ = differential-drive │
 │ printed door  │          │ rover (basic Roaming │
 └──────┬────────┘          │ Roost)              │
        │                   └─────────┬───────────┘
        ▼                             ▼
   tc/<id>/cmd/door             tc/<id>/cmd/drive
        ▲                             ▲
   App / tc CLI  ──REST──▶  express-api  ──MQTT (local LAN)──▶  ESP32
```

Motion is **local only** — commands never go through the cloud, so the door and rover
respond fast and keep working with no internet. The cloud handles login, who owns the
device, and schedules.

---

## Materials (per student or pair)

| Item | For | Note |
|------|-----|------|
| Seeed XIAO ESP32-S3 (or any ESP32-S3) | both | the cheap on-ramp board |
| **Data** USB-C cable | both | not charge-only (#1 "not detected" cause) |
| 1× SG90/MG90 hobby servo | door | standard (positional) servo |
| 2× **continuous-rotation** servos (e.g. FS90R) | rover | these spin; not the door kind |
| 3D-printed parts | both | door + hinge; rover chassis + 2 wheels |
| Jumper wires, common GND | both | servo signal → GPIO, V+ → 5V, GND → GND |
| 2.4 GHz WiFi | both | ESP32 can't see 5 GHz-only networks |

No soldering required. A USB power bank runs the rover untethered after flashing.

---

## Wiring (matches the firmware pins)

Signal wire to these GPIOs; servo power to **5V**, all grounds **common**.

| peripheral | GPIO | Wire |
|------------|------|------|
| `door`  | **GPIO2** (D1) | door servo signal |
| `drive` | **GPIO3** (D2) | left drive servo signal |
| `drive` | **GPIO4** (D3) | right drive servo signal |

> Pins are defined at the top of
> [firmware/starter-node/src/main.cpp](../firmware/starter-node/src/main.cpp) —
> `PIN_DOOR_SERVO`, `PIN_DRIVE_LEFT`, `PIN_DRIVE_RIGHT`. Change them there if your
> board breaks the pins out differently.

⚠️ Two servos can pull more current than a laptop USB port likes. For the rover, power
the servos from a separate 5V supply / power bank (share GND with the board), not the
USB data port alone.

---

## Step 1 — Flash

Open the web flasher at **tender-cells.web.app/flash** (Chrome/Edge), pick
**Starter Node**, **Connect & Install**. Full walkthrough on that page. One binary
works for both lessons.

## Step 2 — WiFi setup — pick the peripheral

After flashing, join the board's `TenderNode-Setup` WiFi; a setup page opens. Set:

- **WiFi** — your 2.4 GHz network + password.
- **Broker IP** — leave blank to auto-find the `npm run demo` broker.
- **Product type** — `chicken-tender` for the door, `roaming-roost` for the rover
  (any product works; this just labels it).
- **peripheral** — **`door`** or **`drive`**. *This is the switch that decides what
  the board does.*

Save. The board reboots, connects, and appears in `tc status` and the dashboard.

---

## Step 3 — Register the device to your account

> Needed only on a **logged-in instance** (a deployment with Firebase configured). On a
> bare classroom LAN (`npm run demo`, no accounts) skip this — every board is open and
> claiming is a friendly no-op.

When accounts are on, a device must be **claimed** before anyone can actuate it, and
**only the owner** can control it afterward — that's how each student works in *their
own instance*.

```bash
# Sign in to the app, then claim the board by its device id (shown in `tc status`):
curl -X POST http://<api-host>:<port>/api/mqtt/devices/<deviceId>/claim \
  -H "Authorization: Bearer <your-firebase-id-token>"
# → { "success": true, "claimed": true, "ownerId": "<your-uid>" }
```

First claim wins. A second account trying to claim the same board gets `409 already
claimed`. After claiming, door/drive commands from anyone else get `403`.

---

## Step 4 — Open/close + drive from the OS

**Door** — open or close:

```bash
curl -X POST http://<api-host>:<port>/api/mqtt/devices/<deviceId>/door \
  -H "Content-Type: application/json" -d '{"state":"open"}'   # or "close"
```

**Rover** — drive (`dir`: forward | back | left | right | stop, `speed` 0–1):

```bash
curl -X POST http://<api-host>:<port>/api/mqtt/devices/<deviceId>/drive \
  -H "Content-Type: application/json" -d '{"dir":"forward","speed":0.6}'
```

(On a logged-in instance, add `-H "Authorization: Bearer <token>"`.) The app's device
controls do the same thing with buttons — no curl needed.

**Schedule it** — in the app's **Schedules** screen add an action like *door open at
sunrise / close at dusk*, or a timed rover patrol. The scheduler fires the same
command at the set time.

---

## Safety — built in, teach it

| Protection | Where | What it does |
|------------|-------|--------------|
| **E-STOP** | firmware + `POST /devices/:id/estop` | Freezes the board instantly; stops the rover; latched until cleared. QoS 2, retained — new subscribers still see it. |
| **Drive deadman** | firmware | If a moving rover gets no fresh command within ~1.5 s (WiFi drop, app closed), it **stops itself**. |
| **Safe boot state** | firmware | Door boots **closed**; rover boots **stopped** — never lurches on power-up. |
| **Ownership gate** | express-api | On a logged-in instance, only the device's owner can actuate it (`403` otherwise). Unclaimed = not actuatable. |
| **Local-only motion** | architecture | Door/drive commands travel local MQTT, never the cloud — fast, and work offline. |

Try it: start the rover, then pull the laptop's WiFi — the rover stops on its own
(deadman). Press E-STOP in the app — everything freezes until you clear it.

---

## How it works (for the curious)

The board subscribes to `tc/<id>/cmd/door` and/or `tc/<id>/cmd/drive` **only for the
peripheral you chose**, and reports `doorState` / `driveDir` in its 10 s heartbeat so
the dashboard shows live position. The real
[Chicken Tender](../firmware/chicken-tender/src/main.cpp) door and
[Roaming Roost](../firmware/roaming-roost/src/main.cpp) drive use the **same MQTT
topics** — your classroom servo and the real DC-motor rover are controlled identically.
That's the whole point: start tiny, grow into the real thing.
