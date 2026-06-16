# Classroom: Build a Feeder + a Waterer (and your own peripheral)

A **hands-on lesson** to add automatic **feeding** and **watering** to a coop, control
them from the TenderCells OS, run them on a **schedule**, and — the real goal — learn
to **invent your own peripheral**. Builds on the
[door + Roaming Roost lesson](CLASSROOM_DOOR_AND_ROAMING_ROOST.md); same Starter Node
binary, same safety rules, same MQTT contract.

> **Key idea:** a feeder and a waterer are just *outputs on a timer*. You already have
> the parts — a **servo** (gate) or a **relay** (motor/pump/valve). Pick a peripheral
> at WiFi setup, wire it, control it from the OS. No new firmware to flash.

---

## 🧱 LEGO-style quick build (ages 7+)

> Do [🐣 Your First Coop Brain](lessons/00-your-first-coop-brain.md) first. Hard words:
> [Picture Dictionary](lessons/00-your-first-coop-brain.md#-picture-dictionary-hard-words-made-easy).

```text
 ┌──────────────────────────────────────────────┐
 │  BAG 4 — Feed & Water by Itself                │
 │  [1] 🟩 flashed board  ............ x1         │
 │  [2] 🔁 relay module  ............. x1         │
 │  [3] 💧 pump / 🍚 feeder motor  ... x1         │
 │  [4] 🔋 separate 12V power + wires             │
 └──────────────────────────────────────────────┘
```
1. **Step 1 of 4 — Wire the relay.** Relay IN → **GPIO5**, + → 5V, − → GND. *✓ click.*
   (Grown-up runs the pump's 12V through the relay — never off USB.)
2. **Step 2 of 4 — Set it.** Setup page → **peripheral = `relay`**. Save.
3. **Step 3 of 4 — Turn on.** App → relay **on** → it runs. *✓*
4. **Step 4 of 4 — Turn off** (always pair on+off!). *✓* 🎉

> 🦺 **E-STOP** cuts it instantly — try it.

**👉 Next:** [Sensors → Automation](CLASSROOM_SENSORS_AND_AUTOMATION.md) · [Learning Tracks](LEARNING_TRACKS.md)

---

## What you're building

```text
 FEEDER                                  WATERER
 ┌──────────────────────────┐           ┌──────────────────────────┐
 │ A) servo gate (peripheral │           │ A) relay → 12V pump        │
 │    = door): opens a hopper│           │    fills the bowl          │
 │    flap for N seconds     │           │ B) relay → solenoid valve  │
 │ B) relay (peripheral=relay│           │    opens water line        │
 │    → auger/disc motor     │           └─────────────┬────────────┘
 └────────────┬─────────────┘                          │
              ▼                                          ▼
   cmd/door {open} … {close}                   cmd/light {on:true} … {on:false}
              ▲                                          ▲
        App / tc CLI / schedule ──REST──▶ express-api ──MQTT (local)──▶ ESP32
```

Both map onto actuators that already exist in the firmware — feeding/watering is a
**timed pulse**: turn on → wait → turn off. The schedule or the app does the timing.

---

## Materials (per student or pair)

| Item | For | Note |
|------|-----|------|
| Starter Node board (XIAO ESP32-S3) | both | already flashed from earlier lesson |
| **Relay module** (5V, opto-isolated) | feeder B / waterer | switches the motor/pump/valve |
| Hobby servo (SG90/MG90) | feeder A | swings a printed hopper gate |
| 12V DC water pump **or** solenoid valve | waterer | pick one; valve needs line pressure |
| 12V auger/disc motor (or peristaltic) | feeder B | meters out feed |
| Separate 12V supply + buck to 5V | both | motors/pumps never off the USB port |
| 3D-printed hopper + chute / bowl | both | gravity hopper is simplest |
| Food-safe tubing (waterer) | waterer | no leaching into water |

⚠️ **Never** power a pump/motor from the board's USB port. Use a separate 12V supply,
share **ground** with the board, switch it through the **relay**.

---

## Wire it (matches firmware pins)

| Peripheral | GPIO | Wire |
|------------|------|------|
| `door` (servo gate feeder) | **GPIO2** | servo signal |
| `relay` (auger / pump / valve) | **GPIO5** | relay IN |

Pins are at the top of
[firmware/starter-node/src/main.cpp](../firmware/starter-node/src/main.cpp). Relay is
active-HIGH; it boots **OFF** so nothing runs on power-up.

---

## Flash + pick the peripheral

Already flashed the Starter Node? You **don't re-flash** — just re-open WiFi setup to
change the peripheral. (New board: flash at **tender-cells.web.app/flash**, pick
Starter Node — full steps on that page.)

1. Power the board; join its `TenderNode-Setup` WiFi; the setup page opens.
2. Set **peripheral**:
   - **`door`** → servo-gate feeder
   - **`relay`** → motor/pump/valve feeder or waterer
3. Leave **Broker IP** blank (auto-finds the `npm run demo` broker). Save.

The board reboots, connects, and appears in `tc status` + the dashboard.

---

## Control from the OS

**Servo-gate feeder** (open to dispense, close to stop):

```bash
curl -X POST http://<api-host>:<port>/api/mqtt/devices/<id>/door -H "Content-Type: application/json" -d '{"state":"open"}'
# wait a few seconds (the "portion")
curl -X POST http://<api-host>:<port>/api/mqtt/devices/<id>/door -H "Content-Type: application/json" -d '{"state":"close"}'
```

**Relay feeder / pump / valve** (on to run, off to stop):

```bash
curl -X POST http://<api-host>:<port>/api/mqtt/devices/<id>/light -H "Content-Type: application/json" -d '{"on":true}'
# wait the run/fill time
curl -X POST http://<api-host>:<port>/api/mqtt/devices/<id>/light -H "Content-Type: application/json" -d '{"on":false}'
```

(On a logged-in instance add `-H "Authorization: Bearer <token>"`; the app's buttons do
the same with no curl.)

**Full Chicken Tender coop** has a calibrated dispenser instead — one call, by grams:

```bash
curl -X POST http://<api-host>:<port>/api/mqtt/devices/<id>/feed -H "Content-Type: application/json" -d '{"amount":100}'
```

---

## Schedule it (the whole point of automation)

In the app's **Schedules** screen add timed actions:
- **Feed** — `door open` at 7:00, `door close` at 7:00:05 (5 s portion); repeat 17:00.
  Relay feeder: `light on` → `light off` after the run time.
- **Water** — `light on` at 8:00 for a 20 s top-up, daily; or trigger off a low-water
  reading once you add a float sensor.

The scheduler fires the same command at the set time. Set it and walk away.

---

## Safety — built in, teach it

| Protection | What it does |
|------------|--------------|
| **E-STOP** | Cuts the relay (feeder motor/pump off) and freezes the board instantly. `POST /devices/:id/estop`. |
| **OFF on boot** | Relay starts OFF, servo gate starts closed — no runaway feed/flood on power-up. |
| **Owner gate** | On a logged-in instance, only the device's owner can run the feeder/waterer. |
| **Always pair on+off** | A feed/fill command must have a matching stop. Schedules do this for you — never leave a pump latched on. |
| **Overflow sense (recommended)** | Add a float/level sensor so the waterer stops on full, not just on a timer. |

Try it: start the pump, hit **E-STOP** in the app — it stops immediately and won't
restart until cleared.

---

## Implement your own peripheral (the real skill)

Any new output follows the **same five-step pattern**. Add it to
[firmware/starter-node/src/main.cpp](../firmware/starter-node/src/main.cpp), copying how
`relay`/`door` are done:

1. **Pick a pin + a `peripheral` value.** Add `static const int PIN_MYTHING = 6;` and
   handle `peripheral == "mything"` in `setup()` (set `pinMode`, safe default).
2. **Add a command topic.** `String topicMyThing(){ return "tc/"+deviceId+"/cmd/mything"; }`
3. **Subscribe** to it in `subscribeCommands()` (guarded by your enable flag).
4. **Act** on it in `onMqttMessage()` — read the JSON, drive the pin. *Refuse while
   `eStopActive`.*
5. **Report + protect.** Add your state to `publishHeartbeat()` so the dashboard shows
   it, and turn it OFF in `enterEStop()`.

Then expose it through the OS (optional): add a `cmd/mything` schema + a
`sendMyThingCommand` + an owner-gated route in express-api
([mqtt.controller.ts](../applications/tendercells_ui/test_output/express-api/backend/src/controllers/mqtt.controller.ts),
[mqtt.routes.ts](../applications/tendercells_ui/test_output/express-api/backend/src/routes/mqtt.routes.ts)) — copy the `light` command.

That's the whole platform: **pin → topic → subscribe → act → report**, with E-STOP and
ownership wrapped around it. Feeder, waterer, a coop fan, a UV lamp, a misting line —
all the same recipe.

---

## Link to the TenderCells OS

Once running, the device shows in the dashboard (live state in its heartbeat) and — on a
[logged-in instance](CLASSROOM_DOOR_AND_ROAMING_ROOST.md#step-3--register-the-device-to-your-account) —
under your account after you claim it. Telemetry mirrors to Firestore, so you watch and
trigger feeding/watering from anywhere, not just the coop's WiFi.
