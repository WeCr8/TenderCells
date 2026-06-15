# Tender Cells Field Kit (Flipper Zero)

A field-diagnostic FAP for bringing up and debugging Tender Cells hardware —
ESP32 coop controllers, Starter Nodes, and WatchTower. Built for the **official
Flipper firmware** with `ufbt`.

The Flipper connects to your laptop over **USB-C**, so the headline tool turns the
Flipper into a USB-to-UART bridge: a laptop reads ESP32 coop logs *through* the
Flipper, no separate FTDI/CP210x adapter required.

## Tools

| # | Tool | Status | Hardware needed |
|---|------|--------|-----------------|
| 1 | **Serial Log Reader** | ✅ working | data USB-C cable + 3 jumper wires |
| 2 | **915 MHz RF Survey** | ℹ️ guided (live sweep v1.1) | none |
| 3 | **WiFi AP Survey** | ℹ️ guided (live scan v1.1) | Flipper WiFi Dev Board (ESP32) |
| 4 | **GPIO Hardware Test** | ℹ️ guided pin map (live probe v1.1) | jumper wires |

### 1. Serial Log Reader (USB-first)
Reads the ESP32 console at **115200** over the Flipper GPIO UART and shows live
scrollback. Two ways to use it:

- **Through the Flipper to your PC (USB-UART bridge):** host PC ↔ Flipper USB-C ↔
  Flipper GPIO 13/14 ↔ ESP32. The Flipper is the USB-serial adapter — open the
  Flipper serial port on the PC, or watch logs right on the Flipper screen.
- **On-device only (no PC):** wire the ESP32 to the Flipper GPIO and read on the
  Flipper screen in the field.

This is the fastest way to see *why a freshly flashed board isn't connecting* —
you'll see the `MQTT connect failed rc=` / WiFi join lines directly.

### 2. 915 MHz RF Survey
Surveys sub-GHz RF energy around WatchTower's 915 MHz band.

> **Hard limit — read this.** The Flipper's CC1101 radio does **OOK / 2-FSK /
> GFSK only**. It **cannot demodulate Semtech LoRa (CSS)**. WatchTower uses real
> LoRa (SX1276, 915 MHz, SF9), so the Flipper can confirm RF *presence* and find
> *interference* at 915 MHz but will **never decode WatchTower alert packets**.
> To read mesh packets you need a real LoRa radio (an SX127x module / another
> WatchTower node), not a Flipper.

### 3. WiFi AP Survey
Scans for the device setup access points (`TenderNode-Setup`,
`ChickenTender-Setup`) and reports RSSI so you can pick a good mount location.
**Requires the Flipper WiFi Dev Board** (ESP32) on the GPIO header — the Flipper
itself has no 2.4 GHz radio.

### 4. GPIO Hardware Test
Pin map + voltage cautions for checking reed-switch (door) continuity and 3V3/5V
logic during bring-up. See the wiring doc for the full harness.

## Wiring (Serial Log Reader)

```
Flipper GPIO        ESP32 (coop / node)
-----------         -------------------
 pin 13  TX  ─────► RX
 pin 14  RX  ◄───── TX
 pin 8/11 GND ───── GND   (common ground required)
```

3.3 V logic on both sides — do **not** cross 5 V into a data pin. Full pinout and
the bring-up test harness: [`docs/hardware/flipper-field-kit.md`](../../docs/hardware/flipper-field-kit.md).

## Build & install

```bash
pip install --upgrade ufbt        # one-time
cd flipper/tendercells_fieldkit
ufbt                              # build the .fap
ufbt launch                       # build + deploy to a connected Flipper
```

The app appears under **Apps → Tools → Tender Cells Field Kit**.

## Roadmap
- v1.1: live sub-GHz RSSI sweep (energy only), live WiFi scan via dev board,
  live GPIO/reed probe.
- A lightweight `ufbt` build check can be added to CI later; it does not gate the
  existing firmware/website pipelines.

Apache-2.0 · WeCr8 Solutions
