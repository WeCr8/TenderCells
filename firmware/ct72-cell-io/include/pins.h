// CT72 cell-IO node pin map (XIAO ESP32-S3). 3.3 V logic everywhere; 12 V only on the DRV8874 VM side.
#pragma once
#include <Arduino.h>

// direct pins
static const uint8_t PIN_CAM_TRIGGER = D0;   // -> 74LVC1T45 -> 1.8 V XTR on each GS camera (shielded twisted pair)
static const uint8_t PIN_HX_SCK      = D1;   // shared HX711 clock
static const uint8_t PIN_HX_DOUT_A   = D2;   // roost bar A load cells (2 in parallel)
static const uint8_t PIN_HX_DOUT_B   = D3;   // roost bar B load cells
static const uint8_t PIN_SDA         = D4;   // MCP23017 + ADS1115
static const uint8_t PIN_SCL         = D5;
static const uint8_t PIN_EN_ROOST_A  = D6;   // DRV8874 EN (PWM) - PH/EN mode
static const uint8_t PIN_EN_ROOST_B  = D7;
static const uint8_t PIN_EN_LID      = D8;
static const uint8_t PIN_PUMP_PWM    = D9;   // Starter vacuum pump MOSFET (unused on Plus/Pro)
static const uint8_t PIN_ESTOP_OK    = D10;  // HIGH = E-stop chain closed (opto from the 24 V safety loop)

// MCP23017 (I2C 0x20)
enum McpPin : uint8_t {
  MCP_PH_ROOST_A = 0, MCP_PH_ROOST_B = 1, MCP_PH_LID = 2, MCP_NSLEEP = 3,       // driver direction / sleep
  MCP_LIM_A_DEPLOYED = 8, MCP_LIM_A_STOWED = 9, MCP_LIM_B_DEPLOYED = 10, MCP_LIM_B_STOWED = 11,
  MCP_LID_OPEN_REED = 12, MCP_VAC_VALVE = 4, MCP_TOOL_CONTACT = 13, MCP_SPARE = 14
};
// ADS1115 (I2C 0x48): A0..A2 = DRV8874 IPROPI (roost A, roost B, lid), A3 = XGZP6847A vacuum sensor
static const float IPROPI_A_PER_V = 1.0f / (450e-6f * 1500.0f);  // A_IPROPI 450 uA/A into 1.5 k (Pololu 4035 default)
