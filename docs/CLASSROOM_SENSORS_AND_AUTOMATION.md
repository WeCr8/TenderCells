# Classroom: Sensors → Automated Tasks (start with a light sensor)

Outputs (door, feeder, relay) are half the system. The other half is **inputs** —
sensors that let the coop **decide for itself**. This lesson adds a **light sensor** and
uses it to automate the classic chicken-keeper task: **open the door at dawn, close it
at dusk**. Then it generalizes to any sensor + any rule.

Builds on [door + Roaming Roost](CLASSROOM_DOOR_AND_ROAMING_ROOST.md) and
[feeder + waterer](CLASSROOM_FEEDER_AND_WATERER.md). Same board, same contract.

> **Key idea:** a sensor is an *input you publish*; automation is *a rule that watches
> inputs and fires commands*. Light low → close door. Temp low → heat lamp on. Water
> low → pump on. Same shape every time.

---

## What you're building

```text
 [light sensor] ──read──▶ ESP32 ──publishes in heartbeat──▶ tc/<id>/sensors {lux}
                                                                   │
                          ┌────────────────────────────────────────┘
                          ▼
          RULE: lux < 50 at dusk  ─▶  close door + light on
                lux > 100 at dawn ─▶  open door
                          │
        (runs locally on the board, OR in the OS / TenderAI agent)
```

---

## Materials

| Item | Note |
|------|------|
| Starter Node board | already flashed |
| **LDR (photoresistor)** + 10kΩ resistor | cheapest light sensor — voltage divider into an ADC pin |
| *or* **BH1750** light sensor (I2C) | gives real lux; better but needs I2C wiring |
| Jumper wires | LDR mid-point → an analog pin; ends → 3V3 and GND |

LDR divider: 3V3 — LDR — (junction → GPIO ADC) — 10kΩ — GND. Bright = higher reading.

---

## Step 1 — Read the sensor (the input recipe)

In [firmware/starter-node/src/main.cpp](../firmware/starter-node/src/main.cpp), read the
sensor inside `publishHeartbeat()` so it streams to the dashboard every 10 s. Average a
few samples (project rule: smooth before publishing):

```cpp
// near the top
static const int PIN_LDR = 1;   // D0 / ADC

// inside publishHeartbeat(), before serializeJson:
long sum = 0;
for (int i = 0; i < 3; i++) { sum += analogRead(PIN_LDR); delay(2); }
int light = sum / 3;            // 0..4095 (raw); map to lux if using BH1750
doc["light"] = light;
```

Flash (Arduino IDE / PlatformIO — see the flasher's Learn mode), and the reading shows
in `tc status` and the dashboard. **You just added a sense.**

---

## Step 2 — Make it automatic

Two places a rule can live. Teach both — the trade-off is the lesson.

### A) Local rule on the board (fast, works offline)
Best for safety/time-critical tasks. Add to `loop()`:

```cpp
// Dusk/dawn auto-door. Hysteresis (two thresholds) stops it flapping at twilight.
static bool doorIsOpen = false;
if (light < 600 && doorIsOpen)  { applyDoor("close"); doorIsOpen = false; }
if (light > 1200 && !doorIsOpen){ applyDoor("open");  doorIsOpen = true;  }
```

No network needed — the coop closes itself even if WiFi drops. (Motion rules belong
here: local + instant, per the platform's local-first principle.)

### B) Rule in the OS / TenderAI agent (flexible, smart)
Best for rules you want to change without re-flashing, or that need history/AI. The OS
watches the published `light` value and POSTs `cmd/door` / `cmd/light`. The TenderAI
agent already has hooks like *ammonia > 10 ppm → suggest cleaning*, *temp < 35°F →
heat-lamp alert* (see CLAUDE.md). Add *light < dusk → close door* the same way.

**Rule of thumb:** safety + motion → local (A). Convenience + intelligence → OS (B).

---

## More sensor lessons (same recipe each time)

| Sensor | Reads | Automated task |
|--------|-------|----------------|
| **LDR / BH1750** | light | dawn/dusk auto-door, night light |
| **DHT22** | temp + humidity | heat lamp on when cold; fan on when hot |
| **MQ-137** | ammonia | ventilation fan / cleaning alert |
| **Float / ultrasonic** | water level | refill pump until full (close the loop on the waterer) |
| **HX711 + load cell** | feed weight | stop the feeder at target grams |
| **PIR / reed** | motion / door | predator/intrusion alert, door-ajar warning |

Each follows: **read in heartbeat → publish → rule (local or OS) → command.** Pick a
sensor, pick a threshold, pick a response. That's automation.

---

## Safety

- Sensor-driven motion still respects **E-STOP** — `applyDoor`/`applyDrive`/`applyLight`
  all refuse while E-STOP is latched.
- Use **hysteresis** (two thresholds) on any rule that drives a motor, so a noisy
  reading near the line doesn't toggle the actuator repeatedly.
- Test the rule with the actuator **disconnected** first; watch the value in `tc status`,
  confirm it crosses your threshold where you expect, then wire the output.

---

## Link to the OS

Published readings mirror to Firestore on a logged-in instance, so you graph light/temp
history and trigger automations from anywhere — the same loop the real Chicken Tender
uses for its sensors.
