# Tender Cells Field Kit (Flipper Zero)

A field-diagnostic FAP for bringing up and debugging Tender Cells hardware —
ESP32 coop controllers, Starter Nodes, and WatchTower. Version 1.1 targets
**Momentum mntm-012 / API 87.1** and builds with `ufbt`.

The headline screen sends field users to the installed UART Terminal at 115200
or the target's native USB console. A bounded health parser and credential
redaction path are prepared in the source but compile-time disabled until the
exact Momentum/XIAO wiring passes a bench test. This app does **not** bridge
target UART to host USB.

## Tools

| # | Tool | Status | Hardware needed |
|---|------|--------|-----------------|
| 1 | **UART + Health** | fail-closed launcher guidance; direct RX opt-in after bench validation | installed UART Terminal or target USB |
| 2 | **Board Diagnostics** | prepared summary for validated adapter frames | future validated UART adapter |
| 3 | **Frequency Board** | fail-closed adapter screen | external SX127x/SX126x + ESP32 |
| 4 | **WiFi Board** | fail-closed adapter screen | external ESP32 |
| 5 | **Offline Node** | architecture/safety screen | optional edge hardware |
| 6 | **GPIO / Reed Test** | guarded workflow guidance | installed GPIO tool or Hark XIAO console |

### 1. UART + Health
The screen directs field users to the already-installed UART Terminal at
**115200** or the XIAO native USB console. The bounded parser for known WiFi,
MQTT, mesh, and E-STOP lines is present, but direct UART acquisition is disabled
by default until an exact wired Momentum/XIAO bench test passes. When enabled,
lines containing claim codes, passwords, or tokens are replaced with a
redaction marker rather than retained on screen.

Those verified terminal paths are the fastest way to see *why a freshly flashed
board isn't connecting*, including `MQTT connect failed rc=` and WiFi join lines.

### 2. Board Diagnostics

Shows fail-closed WiFi, MQTT, mesh, and E-STOP summary fields. In this release
they remain `not seen`/`unknown` because direct ingestion is disabled.

### 3. Frequency board
The screen is prepared for a receive-only diagnostic adapter built from an
ESP32 plus SX127x/SX126x. The adapter, not the Flipper, measures LoRa frequency,
RSSI, SNR, and packet count. Until a compatible UART frame is observed, the
screen explicitly reports **board not detected**.

> **Hard limit — read this.** The Flipper's CC1101 radio does **OOK / 2-FSK /
> GFSK only**. It **cannot demodulate Semtech LoRa (CSS)**. WatchTower uses real
> LoRa (SX1276, 915 MHz, SF9), so the Flipper can confirm RF *presence* and find
> *interference* at 915 MHz but will **never decode WatchTower alert packets**.
> To read mesh packets you need a real LoRa radio (an SX127x module / another
> WatchTower node), not a Flipper.

### 4. WiFi board
Prepared for an external ESP32 scanner restricted to TenderCells setup SSIDs
(`TenderNode-Setup` and `ChickenTender-Setup`), channel, and RSSI. The contract
does not permit password collection, frame capture, deauthentication, or other
active WiFi operations. The Flipper itself has no 2.4 GHz radio.

### 5–6. Offline and GPIO diagnostics

Offline guidance covers local MQTT/Home Assistant, ESP-NOW, RS-485/CAN, and an
authenticated LoRa mesh through external hardware. Flipper remains a handheld
UI and verifier rather than a safety-critical relay.

Pin map + voltage cautions cover reed-switch continuity and 3.3 V logic during
bring-up. Live pin checks reuse the installed GPIO/I2C tools or Hark's guarded
XIAO Lab Console instead of duplicating output controls here.

## Wiring (Serial Log Reader)

```
Flipper GPIO        ESP32 (coop / node)
-----------         -------------------
 pin 14  RX  ◄───── TX
 pin 8/11 GND ───── GND   (common ground required)
```

The app is RX-only; leave Flipper TX disconnected. Many current XIAO builds log
only to native USB CDC, so they must explicitly mirror diagnostics to D6/TX
before this wiring can receive them. 3.3 V logic only—do **not** cross 5 V into
a data pin. Full pinout and
the bring-up test harness: [`docs/hardware/flipper-field-kit.md`](../../docs/hardware/flipper-field-kit.md).

## Build & install

```bash
pip install --upgrade ufbt        # one-time
cd flipper/tendercells_fieldkit
ufbt                              # build the .fap
ufbt launch                       # build + deploy to a connected Flipper
```

The app appears under **Apps → Tools → Tender Cells Field Kit**.

## Add-on adapter contract

Future frequency and WiFi boards report newline-delimited JSON at 115200 on the
same RX-only connection. Version 1.1 recognizes receive-only evidence frames:

```json
{"tc_diag":1,"type":"rf","radio":"sx127x","receive_only":true,"rssi_dbm":-91,"snr_db":7}
{"tc_diag":1,"type":"wifi","ssid":"TenderNode-Setup","channel":6,"rssi_dbm":-54}
```

Adapters must never include passwords, claim codes, tokens, captured traffic,
or arbitrary nearby SSIDs. Unknown versions remain untrusted text. Transmission
and mesh relay are out of scope until authenticated TenderCells mesh commands
and region-specific radio settings are independently validated.

## Next gates

- Mirror selected TenderCells firmware diagnostics to XIAO D6/TX behind an
  explicit build flag; retain native USB CDC.
- Add fixture-driven parser tests and a pinned API 87.1 build in CI.
- Bench-test exact supported ESP32 and SX127x/SX126x adapters before changing a
  screen from `board not detected` to a live control.

Apache-2.0 · WeCr8 Solutions
