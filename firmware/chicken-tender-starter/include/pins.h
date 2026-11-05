// Chicken Tender Starter - XIAO ESP32-S3 pin map. Source of truth:
// hardware/chicken-tender-starter/hw/chicken-tender-starter.hw.yaml (schema tc-hw/1). Keep in sync.
#pragma once
#include <Arduino.h>

// DRV8874 (Pololu #4035) in PH/EN mode: PMODE tied to GND on the electronics plate.
#define PIN_MOT_EN      D0   // GPIO1  -> DRV8874 EN/IN1 (PWM speed)
#define PIN_MOT_PH      D1   // GPIO2  -> DRV8874 PH/IN2 (direction)
#define PIN_DRV_FAULT   D2   // GPIO3  <- DRV8874 nFAULT (open drain, internal pull-up)
#define PIN_DRV_CS      D3   // GPIO4  <- DRV8874 CS current sense, ~1.1 V/A (ADC1_CH3)
#define PIN_I2C_SDA     D4   // GPIO5  <-> DHT20 SDA (3V3)
#define PIN_I2C_SCL     D5   // GPIO6  -> DHT20 SCL (3V3)
#define PIN_SPARE_D6    D6   // GPIO43 spare (UART0 TX; boot log may toggle it)
#define PIN_DRV_ENABLE  D7   // GPIO44 -> NC E-STOP -> DRV8874 SLEEP (driver enable)
#define PIN_REED_CLOSED D8   // GPIO7  <- door-closed reed to GND (internal pull-up)
#define PIN_REED_OPEN   D9   // GPIO8  <- door-open reed to GND (internal pull-up)
#define PIN_ESTOP_SENSE D10  // GPIO9  <- SLEEP node after the E-STOP (low = loop open)

// Motor direction: retract lifts the door. Swap the actuator leads if it runs backwards.
#define MOT_PH_OPEN     HIGH
#define MOT_PWM_HZ      20000
#define MOT_PWM_BITS    10
#define MOT_PWM_CH      0

// Pololu DRV8874 carrier: CS has 2.49 kOhm to GND -> ~1.1 V/A (vendor page, product 4035).
#define CS_MV_PER_A     1100.0f
