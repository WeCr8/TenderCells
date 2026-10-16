# Chicken Tender Starter firmware (XIAO ESP32-S3)

Door controller for the **Chicken Tender Door Controller** build book: a Seeed XIAO ESP32-S3
drives a 12 V linear actuator through a Pololu DRV8874 carrier to lift a cord-hung coop door.
The door closes under its own weight. Hardware, wiring and BOM: `hardware/chicken-tender-starter/`.

| Pin | Net | Use |
|-----|-----|-----|
| D0 | MOT_EN | DRV8874 EN/IN1, 20 kHz PWM |
| D1 | MOT_PH | DRV8874 PH/IN2, direction (HIGH = retract = open) |
| D2 | DRV_nFAULT | DRV8874 nFAULT, internal pull-up |
| D3 | DRV_CS | DRV8874 CS, ~1.1 V/A |
| D4 / D5 | I2C SDA / SCL | DHT20 on 3V3 |
| D6 | spare | |
| D7 | DRV_EN_RAW | driver enable -> NC E-STOP -> DRV8874 SLEEP |
| D8 | REED_CLOSED | door-closed reed to GND |
| D9 | REED_OPEN | door-open reed to GND |
| D10 | ESTOP_SENSE | SLEEP node after the E-STOP (LOW = stopped) |

## Build

```
pio run                      # both actuator tiers
pio run -e xiao_starter      # Starter: generic 12 V actuator (verify listing/force) (~8-10 mm/s), 55 s travel timeout
pio run -e xiao_pro          # Pro: Glideforce LACT12-12V-05 (~37-44 mm/s), 14 s travel timeout
```

## Host tests (door logic)

`lib/door_logic` is plain C++ with no Arduino dependency.

```
make -C test/host            # needs g++ (or CXX="zig c++ -mcpu=baseline")
```

Covers: open/close stop at the reeds, travel timeout, E-STOP latch (explicit reset only,
persisted latch at boot, momentary press), reversal brake + dwell that keeps the travel timeout, jam
(over-current held), the actuator's own limit switch cutting power before the reed,
driver nFAULT held, reed conflict, reboot restore of the last *commanded* position,
first-boot default (closed), and `millis()` rollover.

## MQTT

* `tc/{id}/cmd/door` `{"state":"open"|"close"|"stop"}`
* `tc/{id}/cmd/estop` `{"active":true|false}` (software stop; the red button is hardware).
  Only an explicit `{"active":false}` resets, and only with the loop closed; any other payload stops.
* `tc/{id}/state` (retained), `tc/{id}/sensors`, `tc/{id}/alert`

`chickenCount` is published as `null`: the starter has no headcount sensor.

## E-STOP latch

Any stop (red button, cut wire, app) latches. The latch is stored in NVS (`estop`), so a reboot or
watchdog reset boots with the driver asleep and the door still. A press shorter than one loop is
caught by a FALLING-edge interrupt on D10, which also holds D7 low. Reset = `{"active":false}`;
the reset itself never moves the door.

## MQTT credentials

Same model as `firmware/starter-node`: the setup portal asks for an MQTT username and password,
or a Tender Cells API key (`tck_...`) as the password with the username left blank (the board then
connects as its device id). Connects are bounded (1.5 s TCP, 2 s MQTT) so the loop keeps running.

## Direction reversal

A command for the opposite direction mid-move brakes (EN low) for 300 ms, then drives the other
way. The travel timeout keeps counting from the start of the original move.
