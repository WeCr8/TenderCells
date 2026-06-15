# Tender Cells — Starter Node (Arduino on-ramp)

The **Starter Node** is the smallest real Tender Cells device. It runs on a cheap
ESP32-S3 board with **no coop hardware attached** and proves the whole pipeline:

```
WiFi captive-portal setup  →  MQTT heartbeat  →  E-STOP handling
```

Flash it, set your WiFi + broker IP, pick which **product** it represents, and it shows
up in `tc status` and the dashboard just like a real coop — blinking its LED to say
"I'm alive." One binary stands in for **any** product type, so it's the on-ramp board
for every product in the ecosystem, not just Chicken Tender.

There are two ways to flash it:

| Path | For who | Installs needed |
|---|---|---|
| **Browser flasher** (easy) | kids, first-timers | none — just Chrome/Edge |
| **Arduino IDE** (this doc) | learners who want to read/change the code | Arduino IDE + ESP32 core |

> The easy path lives at **https://tender-cells.web.app/flash** — no installs, click and go.
> Use the Arduino IDE path below when you want to open the code, tweak it, and learn.

---

## 1. What hardware do I need?

**Minimum to see a device come alive:**

- **A board** — one of:
  - **Seeed XIAO ESP32-S3** (USB-C, native USB — no driver needed). *Default target.*
  - **ESP32-WROOM-32 DevKit** (micro-USB — needs a USB-UART driver, see below).
- **A *data* USB cable** — not a charge-only cable. A charge-only cable is the #1 reason
  a board "isn't detected." If nothing shows up, swap the cable first.
- **2.4 GHz WiFi** — ESP32 radios are **2.4 GHz only**. A 5 GHz-only network will not
  appear / will silently fail to join. Use a 2.4 GHz SSID.
- **An MQTT broker on your LAN** — run `npm run demo` in `applications/.../express-api`;
  it starts an embedded broker and prints its IP. You type that IP into the setup portal.
- **Power** — USB power is plenty for a bare node. (A real coop controller needs its
  12 V 5 A supply; the node doesn't.)

**Drivers (WROOM DevKits only — XIAO-S3 needs none):**

- Silicon Labs **CP210x**: https://www.silabs.com/developers/usb-to-uart-bridge-vcp-drivers
- WCH **CH340/CH341**: https://www.wch-ic.com/downloads/CH341SER_EXE.html

**Building a real product device (beyond the node)?** You then wire the per-product
sensors/actuators (DHT22, MQ-137, door servo, load cells, …) to the ESP32. See
[`docs/hardware-bom.md`](../../docs/hardware-bom.md) for the parts and the
product-specific pinouts.

---

## 2. Arduino IDE setup

1. Install the **Arduino IDE** (2.x): https://www.arduino.cc/en/software
2. **Add the ESP32 boards package.** File → Preferences → *Additional Boards Manager URLs*,
   add:
   ```
   https://espressif.github.io/arduino-esp32/package_esp32_index.json
   ```
3. Tools → Board → **Boards Manager** → search **esp32** → install **"esp32 by Espressif
   Systems"**.
   > Pin to a **2.0.x** release to match this firmware's APIs (`esp_task_wdt_init(sec,bool)`
   > and WiFiManager). 3.x changed those signatures.
4. **Install the libraries** (Tools → Manage Libraries):
   - **WiFiManager** by tzapu
   - **PubSubClient** by Nick O'Leary (knolleary)
   - **ArduinoJson** by Benoit Blanchon (**v7**)

---

## 3. Board settings

**Seeed XIAO ESP32-S3:**

- Tools → Board → *esp32* → **XIAO_ESP32S3**
- **USB CDC On Boot: Enabled** ← required, or you'll see no Serial output
- USB Mode: *Hardware CDC and JTAG*
- Upload Speed: 921600

(These match the PlatformIO build flags `-DARDUINO_USB_MODE=1 -DARDUINO_USB_CDC_ON_BOOT=1`.)

**ESP32-WROOM-32 DevKit:**

- Tools → Board → *esp32* → **ESP32 Dev Module**
- Flash Size: 4MB, Upload Speed: 460800
- Select the COM port the CP210x/CH340 driver created.

---

## 4. Flash it

1. Open `src/main.cpp` in the Arduino IDE (rename to `.ino` or use the IDE's sketch
   import; the code is plain Arduino C++).
2. Select your board + COM port (above).
3. Click **Upload**. On boards without auto-reset, hold **BOOT**, tap **RESET**, release
   **BOOT** when "Connecting…" appears.

---

## 5. First boot — set WiFi, broker, and product type

1. After flashing, the board starts a WiFi setup network: **`TenderNode-Setup`**.
2. On your phone/laptop, join that network — a setup page opens (captive portal).
3. Enter:
   - **WiFi** SSID + password (a **2.4 GHz** network)
   - **Broker IP** — the IP printed by `npm run demo`
   - **Broker port** — `1883` (default)
   - **Device ID** — leave the auto `node_XXXX`, or name it
   - **Product type** — one of: `starter`, `chicken-tender`, `roaming-roost`,
     `duck-dock`, `bunny-burrow`, `goat-guardian`, `turkey-tower`, `pigeon-palace`,
     `watchtower`. This is reported in the heartbeat so the dashboard groups/labels it.
4. Save. The board joins WiFi, connects to the broker, and the LED begins a slow "alive"
   blink. It now appears in `tc status` and the dashboard.

> Settings are stored in NVS — you only do this once (until you re-flash, which erases it).

---

## 6. Read what the board is doing (Serial)

- Arduino IDE → Tools → **Serial Monitor**, baud **115200**.
- You'll see the boot banner, the WiFi/broker/product line, and per-connection MQTT logs.
- If the broker IP is wrong or unreachable, you'll see `[MQTT] connect failed rc=...`
  every ~5 seconds — the board stays up and keeps retrying (it does **not** reboot-loop).

---

## 7. Make it yours

Open `src/main.cpp` and try:

- Change `HEARTBEAT_INTERVAL_MS` and watch the dashboard update faster/slower.
- Add a real sensor and publish it in `publishHeartbeat()`.
- When you're ready for a full coop, graduate to `firmware/chicken-tender`.

Safety conventions this firmware follows (keep them if you fork it): no hardcoded WiFi
creds/IDs, E-STOP handled first every loop, watchdog enabled, MQTT socket timeout kept
below the watchdog so a bad broker IP can't reboot-loop the board.
