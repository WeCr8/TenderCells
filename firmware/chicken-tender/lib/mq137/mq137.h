// MQ-137 ammonia (NH3) math: ADC millivolts -> module volts -> Rs -> Rs/R0 -> ppm.
// Plain C++ (no Arduino dependency) so it is host-tested in test/host/test_mq137.cpp.
//
// Signal chain (see docs/CHICKEN_TENDER_PINOUT.md):
//   MQ-137 module AOUT (0..5 V, across the module's load resistor RL)
//     -> divider R_top / R_bottom -> ESP32 GPIO35 (ADC1_CH7, 11 dB attenuation)
//
// Calibration curve: the datasheet Rs/R0 vs NH3 ppm plot is a straight line on log-log axes.
// Fit used here (widely used fit of the Winsen/Hanwei MQ-137 datasheet curve, RL = 47 k):
//     log10(Rs/R0) = M * log10(ppm) + B,   M = -0.263, B = 0.42
//     => ppm = 10 ^ ((log10(Rs/R0) - B) / M)
// Clean-air ratio from the same plot: Rs/R0 = 3.6 (so R0 = Rs_clean_air / 3.6).
// Rs/R0 does not depend on RL as long as R0 was measured on the same circuit, so the
// module's RL value only matters for the reported Rs in kOhm.
//
// Accuracy: MQ sensors are +/- tens of percent, drift with temperature/humidity and age, and
// need a 24-48 h first burn-in plus a few minutes of heater warm-up after every power-up.
// Treat the number as a trend / threshold indicator (10 ppm warning, 25 ppm critical), not a
// lab measurement. A two-point calibration against a known NH3 source would replace M/B.
#pragma once
#include <math.h>

namespace mq137 {

constexpr float CURVE_M          = -0.263f;  // slope of log10(Rs/R0) vs log10(ppm)
constexpr float CURVE_B          = 0.42f;    // intercept
constexpr float CLEAN_AIR_RATIO  = 3.6f;     // Rs/R0 in clean air (datasheet curve)
constexpr float PPM_MAX          = 500.0f;   // datasheet detection range 5..500 ppm
constexpr float VC_VOLTS         = 5.0f;     // module loop voltage (Vc), 5 V +/- 0.1 V
constexpr float V_MIN_VALID      = 0.05f;    // below this the module is unplugged / shorted
constexpr float V_MAX_MARGIN     = 0.05f;    // within this of Vc the reading is saturated

// Divider gain: module volts = ADC volts * gain.
constexpr float dividerGain(float rTopK, float rBottomK) { return (rTopK + rBottomK) / rBottomK; }

// Effective load resistor: the divider (rTop + rBottom) hangs in parallel with the module's RL.
constexpr float effectiveRl(float rlK, float rTopK, float rBottomK) {
  return (rlK * (rTopK + rBottomK)) / (rlK + rTopK + rBottomK);
}

// Module output volts from ADC millivolts.
inline float moduleVolts(float adcMilliVolts, float rTopK, float rBottomK) {
  return (adcMilliVolts / 1000.0f) * dividerGain(rTopK, rBottomK);
}

inline bool voltsValid(float vModule, float vc = VC_VOLTS) {
  return vModule >= V_MIN_VALID && vModule <= (vc - V_MAX_MARGIN);
}

// Sensor resistance (kOhm): Rs = RL * (Vc - Vout) / Vout. Returns NAN for an invalid voltage.
inline float rsKohm(float vModule, float rlEffK, float vc = VC_VOLTS) {
  if (!voltsValid(vModule, vc)) return NAN;
  return rlEffK * (vc - vModule) / vModule;
}

// R0 from a clean-air Rs (calibration step).
inline float r0FromCleanAir(float rsCleanK) { return rsCleanK / CLEAN_AIR_RATIO; }

// ppm from Rs/R0, clamped to [0, PPM_MAX]. NAN in -> NAN out.
inline float ppmFromRatio(float ratio) {
  if (isnan(ratio) || ratio <= 0.0f) return NAN;
  float ppm = powf(10.0f, (log10f(ratio) - CURVE_B) / CURVE_M);
  if (ppm < 0.0f) ppm = 0.0f;
  if (ppm > PPM_MAX) ppm = PPM_MAX;
  return ppm;
}

// Full chain: ADC mV -> ppm. r0K <= 0 means "not calibrated" -> NAN.
inline float ppmFromAdc(float adcMilliVolts, float rTopK, float rBottomK, float rlK, float r0K,
                        float vc = VC_VOLTS) {
  if (!(r0K > 0.0f)) return NAN;
  const float v  = moduleVolts(adcMilliVolts, rTopK, rBottomK);
  const float rs = rsKohm(v, effectiveRl(rlK, rTopK, rBottomK), vc);
  if (isnan(rs)) return NAN;
  return ppmFromRatio(rs / r0K);
}

}  // namespace mq137
