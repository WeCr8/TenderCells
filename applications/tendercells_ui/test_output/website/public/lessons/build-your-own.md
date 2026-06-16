# Classroom: Build Your Own Smart-Animal Device

A **teacher-led lesson** where students flash a real ESP32 board, invent their own
animal and the threat it faces, make a live "threat" alert fire, and watch it land
in the Tender Cells software — the same pipeline the real robot coops use.

For **adults and kids alike**: middle-school and up with an instructor; older
students / clubs can run it solo. Pairs with the no-hardware
[Classroom Quickstart](CLASSROOM_QUICKSTART.md) (do that first if you have no boards).

> **Open-source goal:** this is a platform for builders, techies, and kids to
> invent on. Students don't just run a demo — they define a *new* device (any
> species, any threat) and make the software treat it like a real one.

---

## 🧱 LEGO-style quick build (ages 7+)

> Do [🐣 Your First Coop Brain](lessons/00-your-first-coop-brain.md) first. Hard words:
> [Picture Dictionary](lessons/00-your-first-coop-brain.md#-picture-dictionary-hard-words-made-easy).

```text
 ┌──────────────────────────────────────────────┐
 │  BAG 5 — Invent Your Own Animal Alarm          │
 │  [1] 🟩 flashed board (has a BOOT button)      │
 │  [2] 💻 laptop with the app open               │
 └──────────────────────────────────────────────┘
```
1. **Step 1 of 3 — Name your animal.** Setup page → **species** (e.g. `axolotl`) +
   **threat** (e.g. `hawk`). Save. *✓*
2. **Step 2 of 3 — Watch the app.** Find your device on the dashboard. *✓*
3. **Step 3 of 3 — Fire the alarm!** Press the board's **BOOT** button → your threat
   pops up in the app, live. *✓ you invented a real alert!* 🦅

**👉 Next:** make a real door move → [Door lesson](CLASSROOM_DOOR_AND_ROAMING_ROOST.md) ·
[Learning Tracks](LEARNING_TRACKS.md)

---

## What you're building (the big idea)

```text
  [Student's board]  --WiFi-->  [Teacher's laptop: npm run demo]  -->  app / dashboard
   names a species              embedded MQTT broker (auto-found             shows the
   defines a threat             over the network — no IP typing)          live threat
   button = "threat!"
```

Each student board is a **Starter Node** running one firmware that can stand in for
*any* product — including a `custom` device the student invents. Press the board's
button and a threat alert the student named (e.g. "hawk", "raccoon", "heat wave")
shows up in the software live.

---

## Materials (per student or pair)

| Item | Note |
|------|------|
| Seeed XIAO ESP32-S3 (or any ESP32-S3 board) | the cheap on-ramp board |
| **Data** USB-C cable | not a charge-only cable (the #1 "not detected" cause) |
| Chrome or Edge browser | for the web flasher (WebSerial) |
| 2.4 GHz WiFi | ESP32 is 2.4 GHz only; a 5 GHz-only network won't join |

**Teacher provides once for the room:**
- A laptop running `npm run demo` (the broker + software). See
  [Classroom Quickstart](CLASSROOM_QUICKSTART.md) Step 2.
- The same 2.4 GHz WiFi for the laptop and all student boards.

No soldering. No accounts. Nothing leaves the local network.

---

## Teacher prep (10 min, before class)

1. On your laptop, start the software once and leave it running:
   ```bash
   cd applications/tendercells_ui/test_output/express-api
   npm install        # first time only
   LAN=1 npm run demo # LAN=1 shares it with student boards
   ```
2. Confirm two lines appear:
   - `✓ Embedded MQTT broker listening on mqtt://localhost:1883`
   - `✓ mDNS: advertising broker as _mqtt._tcp ...` ← lets boards **auto-find** the
     broker so students never type an IP address.
3. Note the `LAN: http://192.168.x.x:4000` line — open it on the projector so the
   class sees everyone's devices appear live.

> If your school network blocks multicast, mDNS auto-find won't work. Fallback:
> read the `LAN:` IP and have students type it into the board's "Broker IP" field.

---

## Lesson flow

### Part 1 — Flash the board (10 min)
1. Plug the board into the laptop with a **data** USB cable.
2. Open the flash page in Chrome/Edge: **https://tender-cells.web.app/flash**
3. Pick **Starter Node**, click **Connect**, choose the board's serial port, **Install**.
4. When it finishes, the board reboots and (first time) creates a WiFi setup network.

See [`firmware/starter-node/README.md`](../firmware/starter-node/README.md) for the
Arduino IDE path if you'd rather build from source.

### Part 2 — Name your animal + threat (10 min)
The board makes a temporary WiFi network called **`TenderNode-Setup`**.
1. On a phone or laptop, join `TenderNode-Setup`. A setup page opens.
2. Pick your home/class **WiFi** and enter its password.
3. Fill the maker fields — **this is the invention step**:
   - **Product type:** `custom` (or pick a real one like `chicken-tender`).
   - **Species:** anything — `axolotl`, `honeybee`, `penguin`, your class mascot.
   - **Threat label:** the danger your device detects — `hawk`, `frost`, `flood`.
   - **Broker IP:** **leave blank** → the board auto-finds the teacher's broker.
4. Save. The board joins WiFi, finds the broker, and starts its heartbeat (LED blinks).

### Part 3 — Fire a threat (5 min)
- Press the board's **BOOT button**. It publishes the threat the student named.
- Watch the projector / dashboard: the alert appears live, tagged with the student's
  species and threat label, marked `manual: true` (a human pressed it, not an AI).
- Every student's device shows up separately — a whole "barn" of invented animals.

### Part 4 — Talk about it (5–10 min)
Discussion prompts (real engineering, not trivia):
- Why does the alert say `confidence: 1.0` and `manual: true`? When would a *real*
  device be unsure? (Intro to AI confidence.)
- Why must the **emergency stop** always win, even mid-task? (Safety-first design.)
- Your board and the laptop never used the internet — why is "local-first" good for
  a barn that might lose WiFi?

---

## Extension / exploration (take it further)

- **Make it automatic:** instead of a button, have the board fire the threat on a
  sensor (light, temperature, motion) — now it's a real detector.
- **Two boards, one threat:** add a LoRa radio and use the shared mesh
  (`firmware/shared/tc_mesh`) so a far board's alert hops to the laptop with no WiFi.
- **Build the software side:** read live data with `--json` and make a dashboard, a
  phone alert, or an AI that explains readings (Quickstart Level 4).
- **Design the real thing:** sketch an enclosure for your species in CAD; what
  sensors would it actually need? (See the hardware catalog in `docs/`.)
- **Whole-class project:** every student's species becomes one device in a shared
  "Barn Brain" edge hub (see [Barn Brain plan](products/barn-brain/IMPLEMENTATION_PLAN.md)).

---

## Safety & ground rules (for everyone)

- The BOOT-button threat is a **drill**, not a real detection — say so out loud.
- Never put real WiFi passwords, home addresses, or personal info in the species /
  threat / device-name fields. Keep it playful and public-safe.
- USB power is enough for a bare board; don't wire it to mains or motors in class.
- ESP32 pins are **3.3 V** — never feed 5 V into a data pin.

---

## Troubleshooting

| Problem | Try this |
|---|---|
| Board not detected in the flasher | Use a **data** USB cable; use Chrome/Edge; try another port. |
| `TenderNode-Setup` network never appears | Re-plug the board; watch the serial log at 115200 (see README). |
| Board won't join WiFi | It must be **2.4 GHz**; check the password. |
| Device never shows in the software | Broker auto-find may be blocked — type the `LAN:` IP into "Broker IP". |
| Button press does nothing | Confirm the device shows "connected"/heartbeat first; the LED should blink. |

---

*Tender Cells is open-source software by WeCr8 Solutions. Invent a device. Make it
fail. Figure out why. That's the whole point.*
