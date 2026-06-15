# Flipper Field Kit — Wiring & Test Harness

Pinouts and bring-up harness for the **Tender Cells Field Kit** Flipper app
(`flipper/tendercells_fieldkit`). Connection to the host is over **USB-C**; the
Flipper acts as a USB-to-UART bridge to the ESP32.

## Flipper Zero GPIO header (top edge)

Relevant pins for this kit:

| Flipper pin | Name | Use in kit |
|-------------|------|-----------|
| 1  | 5V  | 5 V out (USB-powered only) — power a small target if needed |
| 9  | 3V3 | 3.3 V out — reference / power low-draw logic |
| 13 | TX (USART1) | → ESP32 **RX** |
| 14 | RX (USART1) | ← ESP32 **TX** |
| 8  | GND | common ground |
| 11 | GND | common ground (alt) |

> ESP32 GPIO is **3.3 V tolerant only**. Never wire Flipper pin 1 (5 V) into an
> ESP32 data pin. Use pin 9 (3V3) or just share GND and let USB power each board.

## Serial Log Reader harness

```
   Laptop (USB serial)
        │  USB-C
   ┌────┴─────┐
   │ Flipper  │  GPIO 13 (TX) ───────────────► ESP32 RX (e.g. GPIO44/RX0)
   │  Zero    │  GPIO 14 (RX) ◄─────────────── ESP32 TX (e.g. GPIO43/TX0)
   │          │  GPIO 8  (GND) ───────────────  ESP32 GND
   └──────────┘
              115200 8N1, matches firmware monitor_speed
```

- Flipper TX → ESP32 RX, Flipper RX → ESP32 TX (cross-over — TX talks to RX).
- A **common ground is mandatory**; without it the UART floats and you get garbage.
- Baud is **115200** to match `monitor_speed` in every `platformio.ini` in this repo.
- If the ESP32 is already USB-powered (e.g. flashing over the browser flasher),
  leave its power alone and only wire TX/RX/GND to the Flipper.

This is the fast triage path for a "flashed but not working" board: watch the
boot banner, WiFi join, and `MQTT connect failed rc=` lines live.

## GPIO Hardware Test — reed switch (door) check

A reed switch reads as **continuity to GND when the magnet is near** (door
closed). Bring-up check:

```
 Flipper GPIO (input, pull-up)  ── reed switch ── GND
```

- Door **closed** (magnet present) → contact closed → pin reads **LOW**.
- Door **open** (magnet away) → contact open → pull-up → pin reads **HIGH**.

This mirrors the ESP32 firmware wiring (reed on a pulled-up input). Confirm the
magnet polarity/spacing here before mounting.

## 915 MHz RF Survey — capability note

The Flipper sub-GHz radio (CC1101) covers the 915 MHz ISM band for **energy /
interference** measurement only. It **cannot demodulate WatchTower LoRa (CSS)**
traffic. To capture and decode mesh packets, use an SX127x LoRa receiver running
the shared `firmware/shared/tc_mesh` PHY config (915 MHz, BW 125k, SF9, CR 4/5,
sync 0x34), not the Flipper.

## WiFi AP Survey — required add-on

Needs the **Flipper WiFi Dev Board** (ESP32-S2/S3) seated on the GPIO header. The
Flipper has no native 2.4 GHz radio. The kit scans for `TenderNode-Setup` and
`ChickenTender-Setup` captive-portal SSIDs and reports RSSI for placement.

See also: [`flipper/tendercells_fieldkit/README.md`](../../flipper/tendercells_fieldkit/README.md).
