# Chicken Tender - pinout sheet (single source)

**Document ID:** TC-CHKN-PIN-001 | **Revision:** A | **Date:** 2026-11-20

This is the one place to look up which wire goes to which pin on the Chicken Tender coop.
Firmware headers and the hardware catalog point here. If code and this sheet ever disagree,
the code is what runs: fix this sheet in the same PR.

## Which ESP32 boards

The coop uses **two** small boards, each matching the firmware that already exists in the repo.
There is no third "ESP32-S3 main controller" (the old catalog entry); it matched no firmware.

| Job | Board | PlatformIO `board` | Firmware | Tier |
|---|---|---|---|---|
| Door controller (12 V linear actuator, door reeds, temp/humidity) | **Seeed XIAO ESP32-S3** | `seeed_xiao_esp32s3` | `firmware/chicken-tender-starter` (envs `xiao_starter`, `xiao_pro`) | Starter and up |
| Coop sensor / feeder controller (ammonia, DHT22, feeder motor, cleaning stepper, NC E-STOP authority) | **ESP32-WROOM-32 DevKit V1 (DOIT, 30-pin)** | `esp32doit-devkit-v1` | `firmware/chicken-tender` (env `esp32-wroom-32`) | Pro (add-on to Starter) |
| Camera (optional) | Seeed XIAO ESP32-S3 **Sense** | `seeed_xiao_esp32s3` | `firmware/camera-node` | Plus and up |

Give each board its own MQTT device id (for example `ct_door_001`, `ct_coop_001`, `ct_cam_001`).
When the XIAO door controller is fitted, the WROOM's door-servo output (GPIO13) is left
unconnected and the app sends door commands to the door controller's id only.

## Door controller - Seeed XIAO ESP32-S3

Source of truth: `hardware/chicken-tender-starter/hw/chicken-tender-starter.hw.yaml`
(`firmware/chicken-tender-starter/include/pins.h` is generated to match).

| XIAO pin | GPIO | Net | Connects to | Notes |
|---|---|---|---|---|
| D0 | 1 | MOT_EN | DRV8874 EN/IN1 | 20 kHz PWM (speed) |
| D1 | 2 | MOT_PH | DRV8874 PH/IN2 | direction, HIGH = retract = door opens |
| D2 | 3 | DRV_nFAULT | DRV8874 nFAULT | open drain, internal pull-up |
| D3 | 4 | DRV_CS | DRV8874 CS | ~1.1 V/A current sense (ADC1), jam trip 1.8 A |
| D4 | 5 | DHT_DATA | DHT22 / AM2302 data (Base/Starter) | 10 k pull-up to 3V3 (R2; most breakouts already have it). Unpopulated on Plus/Pro: the WROOM GPIO4 DHT22 is the coop sensor there |
| D5 | 6 | spare | - | was DHT20 SCL; the I2C DHT20 is dropped (2026-11-22): I2C is unreliable on the ~3.8 m run from the under-coop bay |
| D6 | 43 | spare | - | UART0 TX toggles at boot: never a motor input |
| D7 | 44 | DRV_EN_RAW | NC E-STOP contact -> DRV8874 SLEEP | E-STOP breaks this line in hardware |
| D8 | 7 | REED_CLOSED | door-closed reed -> GND | internal pull-up |
| D9 | 8 | REED_OPEN | door-open reed -> GND | internal pull-up |
| D10 | 9 | ESTOP_SENSE | SLEEP node after the E-STOP | LOW = loop open / stopped |
| 5V | - | V5_XIAO | D36V6F5 5 V out via 1N5817 | never 12 V |
| GND | - | GND | common ground | |

Power: 12 V 3 A Class 2 adapter (Base, Plus/Pro logic rail; **12 V 5 A on Starter**, which also feeds the picker) -> panel jack -> 3 A fuse -> DRV8874 VIN and D36V6F5 VIN only.
Plus/Pro add PS2, a separate 12 V 8 A (96 W) Class 2 adapter for the motor rail (gantry, cassette, SO-101), switched by the motor-rail relay.
Driver current limit ~2.0 A (20 k VREF to GND).

## Coop sensor / feeder controller - ESP32-WROOM-32 DevKit V1

Source of truth: `firmware/chicken-tender/src/main.cpp` (`#define PIN_*`).

| GPIO | Function | Connects to | Notes |
|---|---|---|---|
| 4 | DHT22 data | DHT22 pin 2 | 10 k pull-up to 3V3 (most DHT22 breakout boards already have it) |
| 35 | MQ-137 analog in (ADC1_CH7) | MQ-137 AOUT through a **15 k / 12 k** divider | input-only pin, 11 dB attenuation; see the ammonia section below |
| 13 | door servo PWM | (unused when the XIAO door controller is fitted) | 50 Hz |
| 33 | cleaning stepper ENABLE (active LOW) | TB6600 ENA- (not fitted on gantry coops: Plus/Pro clean with the gantry tools, so leave it unconnected and HIGH) | moved off GPIO12 (boot strapping pin). Recommended: 10 k pull-up so the driver stays disabled while the ESP32 boots (not yet verified on hardware) |
| 14 | cleaning stepper STEP | TB6600 PUL- | 400 Hz square wave; GPIO14 can toggle at boot, harmless while ENABLE is high |
| 27 | cleaning stepper DIR | TB6600 DIR- | |
| 26 | feeder motor ON | DC motor driver EN/IN1 (e.g. a second Pololu DRV8874) | on/off, 30 ms per gram, 500 g cap per command |
| 25 | feeder motor DIR | DC motor driver PH/IN2 | |
| 32 | NC E-STOP sense | NC contact -> GND | internal pull-up; open = E-STOP. Build flag `CT_ESTOP_INPUT=1` (default) |
| 3V3 | sensor logic supply | DHT22 VCC | |
| VIN (5 V) | board supply | 5 V buck from the 12 V rail | MQ-137 heater draws ~180 mA at 5 V: feed it from the 5 V buck, not the 3V3 pin |
| GND | common ground | | |

Avoid for new wiring: GPIO0, 2, 5, 12, 15 (strapping pins), 6-11 (flash), 34-39 are input-only,
ADC2 pins (0, 2, 4, 12-15, 25-27) cannot be read as analog while Wi-Fi is on.

One E-STOP head serves every board. Use only **normally-closed (NC)** contact blocks (fail-safe):

| Tier | NC blocks | Block 1 | Block 2 | Block 3 |
|---|---|---|---|---|
| Base | 2 | XIAO D7 -> DRV8874 SLEEP | spare (pre-wired for the Starter upgrade) | - |
| Starter | 2 | XIAO D7 -> DRV8874 SLEEP | picker TMC2209 EN | - |
| Plus / Pro | 3 | XIAO D7 -> DRV8874 SLEEP | WROOM GPIO32 sense | motor-rail relay coil (cuts every motor in hardware) |

## Ammonia sensor (MQ-137) - divider, ADC and ppm

### Divider (hardware)

The MQ-137 module runs on 5 V and its AOUT swings 0-5 V. The ESP32 pin is 3.3 V-only, and
Espressif's *suggested* accurate range at 11 dB attenuation is **150-2450 mV** (ESP-IDF ADC
reference, ESP32 table:
https://docs.espressif.com/projects/esp-idf/en/v4.4.7/esp32/api-reference/peripherals/adc.html).

```
MQ-137 AOUT ──[ R_top 15 k ]──┬── GPIO35
                              ├──[ R_bottom 12 k ]── GND
                              └──[ 100 nF ]───────── GND   (at the ESP32 pin, ADC noise)
```

| Module AOUT | At GPIO35 (x 12/27 = 0.444) |
|---|---|
| 0.6 V (typical clean air) | 0.27 V |
| 2.5 V | 1.11 V |
| 5.0 V (full scale) | 2.22 V |
| 5.25 V (module rail +5 %) | 2.33 V (still inside 2450 mV) |

PR #180 used 12 k top / 15 k bottom: 5.0 V -> 2.78 V, which is safe for the pin but above
the accurate range. Swapping the two resistors fixes that with the same parts. Firmware has a
`static_assert` that fails the build if the divider ever lets 5.25 V exceed 2.45 V.

The 27 k divider also sits in parallel with the module's own load resistor RL. Firmware
accounts for it (`effectiveRl`). Set `MQ137_RL_KOHM` (build flag, default 10) to the SMD
resistor on your module (markings: `102` = 1 k, `103` = 10 k, `473` = 47 k). RL only changes
the reported Rs; ppm is unaffected because R0 is calibrated on the same circuit.

### Firmware conversion (counts -> volts -> Rs/R0 -> ppm)

Code: `firmware/chicken-tender/lib/mq137/mq137.h`, host test `firmware/chicken-tender/test/host/test_mq137.cpp`.

1. `analogReadMilliVolts(35)` (eFuse-calibrated millivolts, not raw counts), 3-sample average.
2. Module volts `V = mV/1000 x (15 + 12)/12`.
3. Sensor resistance `Rs = RL_eff x (5.0 - V) / V`, with `RL_eff = RL || 27 k`.
   Readings below 0.05 V (unplugged) or within 0.05 V of 5 V (saturated) are rejected.
4. `ppm = 10 ^ ((log10(Rs/R0) - 0.42) / -0.263)`, clamped to 0-500 ppm (datasheet range 5-500).
   The curve is the commonly used straight-line fit of the MQ-137 datasheet Rs/R0-vs-ppm plot
   (slope -0.263, intercept 0.42; clean-air Rs/R0 = 3.6), e.g.
   https://circuitdigest.com/microcontroller-projects/arduino-mq137-ammonia-sensor .
5. Published on `tc/{id}/sensors` as `ammonia` (ppm). It is `null` while the heater warms up
   (first 3 minutes after power-up), before calibration, or on a wiring fault, so the app never
   alarms on garbage. Extra fields: `ammoniaCalibrated`, `ammoniaWarmingUp`, `ammoniaVolts`.

Alert thresholds stay as the app already uses them: 10 ppm warning, 25 ppm critical.

### Calibration step (do this once, and again every few months)

1. **Burn-in:** power the MQ-137 continuously for 24-48 hours the first time (datasheet preheat).
2. Take the sensor box **outside, upwind of the coop** (clean air), power it for at least
   10 minutes.
3. Publish `{"sensor":"ammonia"}` to `tc/{id}/cmd/calibrate`. The controller averages 20
   readings, sets `R0 = Rs / 3.6`, stores it in flash (NVS key `nh3_r0`) and sends an alert
   `ammonia calibrated: R0 = xx.x kOhm`.
4. Re-install in the coop. In fresh air the coop should now read under ~5 ppm.

Other forms: `{"sensor":"ammonia","r0Kohm":23.5}` sets R0 directly;
`{"sensor":"ammonia","reset":true}` clears it (ammonia goes back to `null`).
Calibration is refused during the warm-up window and while E-STOP is active.

Honest limits: MQ sensors drift with temperature, humidity and age and are +/- tens of
percent. Use the number for trends and the 10/25 ppm thresholds, not as a lab value.

## Battery / solar sense dividers (WatchTower)

`firmware/watchtower` reads its 3S pack through **100 k / 10 k**: gain = (100 + 10) / 10 =
**11.0** (the code used 12.1, which read ~10 % high). Solar: 47 k / 10 k, gain 5.7.
Both now use `analogReadMilliVolts`. Open issue: that firmware targets an ESP32-S3, where
GPIO34/35 are not ADC pins; its pin map needs checking against the real WatchTower board.

## Wire runs in the coop

See `docs/CHICKEN_TENDER_BUILD_GUIDE.md` (section "Electronics mounting and wire runs") for
where each part mounts on the 4 ft x 4 ft coop and how the cables are routed.

Lengths are routed from the under-coop electronics bay EB1 (bottom glands, drip loop, chase up the back-left post), worst tier, rounded up (2026-11-22; `cad/chicken-tender-coop/showcase/ebay_params.HARNESS_LEN_MM`).

| Cable | From (bay EB1) | To | Conductors | Length (approx.) |
|---|---|---|---|---|
| Door actuator (W13/W14) | DRV8874 OUT1/OUT2 (TB2) | actuator on the front wall, inside | 2 x 20 AWG | 3.2 m |
| Door reeds (W18 closed / W19 open) | XIAO D8 / D9 + GND | reed pair at the pop door | 2 x 2-core 26 AWG | 4.8 m / 4.5 m |
| Temp/humidity DHT22 (W20) | XIAO 3V3/GND/D4 (Base/Starter) or WROOM 3V3/GND/GPIO4 (Plus/Pro) | back face of the front-left post, 14 in above floor | 3-core | 3.9 m |
| Ammonia (MQ-137) | 5 V / GND / divider input | front-left post, 12 in above floor, away from the roost | 3-core 24 AWG | 3.8 m |
| Camera node | 5 V / GND | front-left upper corner, inside | 2-core 22 AWG (or USB-C) | 1.5 m |
| Feeder motor (Pro) | motor driver OUT | feeder under the coop, in the run | 2 x 20 AWG | 1.5 m |
| 12 V in | Class 2 adapter (GFCI outlet) | panel jack on the box | adapter lead | as needed |
