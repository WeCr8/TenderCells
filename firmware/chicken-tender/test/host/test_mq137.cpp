// Host test for lib/mq137 (no Arduino). Build: make -C firmware/chicken-tender/test/host
#include "../../lib/mq137/mq137.h"
#include <cstdio>
#include <cmath>
#include <initializer_list>

static int fails = 0, checks = 0;
#define CHECK(c) do { ++checks; if (!(c)) { ++fails; std::printf("FAIL %s:%d %s\n", __FILE__, __LINE__, #c); } } while (0)
static bool near(float a, float b, float tol) { return std::fabs(a - b) <= tol; }

int main() {
  // Divider 15k/12k: gain 2.25, 5.25 V module -> 2.333 V at the ADC (<= 2.45 V suggested range).
  CHECK(near(mq137::dividerGain(15, 12), 2.25f, 1e-4f));
  CHECK(5.25f / mq137::dividerGain(15, 12) <= 2.45f);
  CHECK(near(mq137::moduleVolts(2222.2f, 15, 12), 5.0f, 1e-3f));

  // Effective RL: 10k || 27k = 7.297k
  CHECK(near(mq137::effectiveRl(10, 15, 12), 7.2973f, 1e-3f));

  // Rs = RL (Vc - V)/V : 2.5 V across 10k -> 10k
  CHECK(near(mq137::rsKohm(2.5f, 10.0f), 10.0f, 1e-4f));
  CHECK(std::isnan(mq137::rsKohm(0.0f, 10.0f)));     // unplugged
  CHECK(std::isnan(mq137::rsKohm(4.99f, 10.0f)));    // saturated

  // Clean air: Rs/R0 = 3.6 -> ~0.3 ppm (essentially zero)
  CHECK(mq137::ppmFromRatio(3.6f) < 1.0f);
  // Curve points: ratio = 10^(B + M log10(ppm))
  for (float ppm : {5.0f, 10.0f, 25.0f, 50.0f, 100.0f, 200.0f}) {
    const float ratio = std::pow(10.0f, mq137::CURVE_B + mq137::CURVE_M * std::log10(ppm));
    CHECK(near(mq137::ppmFromRatio(ratio), ppm, ppm * 0.001f));
  }
  // Lower ratio = more ammonia (monotonic)
  CHECK(mq137::ppmFromRatio(0.8f) > mq137::ppmFromRatio(1.2f));
  // Clamp to the 500 ppm datasheet range
  CHECK(mq137::ppmFromRatio(0.01f) == mq137::PPM_MAX);
  CHECK(std::isnan(mq137::ppmFromRatio(0.0f)));

  // Full chain: calibrate in clean air, then a higher module voltage reads higher ppm.
  const float rl = mq137::effectiveRl(10, 15, 12);
  const float vClean = 0.6f;                              // module volts in clean air
  const float r0 = mq137::r0FromCleanAir(mq137::rsKohm(vClean, rl));
  const float mvClean = vClean / mq137::dividerGain(15, 12) * 1000.0f;
  CHECK(mq137::ppmFromAdc(mvClean, 15, 12, 10, r0) < 1.0f);
  const float mv25 = 1.6f / mq137::dividerGain(15, 12) * 1000.0f;   // 1.6 V module out
  const float p = mq137::ppmFromAdc(mv25, 15, 12, 10, r0);
  CHECK(p > 10.0f && p < 100.0f);
  // RL cancels out of ppm when R0 is calibrated on the same circuit.
  const float rl47 = mq137::effectiveRl(47, 15, 12);
  const float r0b = mq137::r0FromCleanAir(mq137::rsKohm(vClean, rl47));
  CHECK(near(mq137::ppmFromAdc(mv25, 15, 12, 47, r0b), p, p * 0.001f));
  // Not calibrated -> NAN
  CHECK(std::isnan(mq137::ppmFromAdc(mv25, 15, 12, 10, 0.0f)));

  // WatchTower battery divider 100k/10k: gain 11 (not 12.1); 12.6 V pack -> 1.145 V at the ADC.
  CHECK(near(mq137::dividerGain(100, 10), 11.0f, 1e-5f));
  // Solar divider 47k/10k: gain 5.7
  CHECK(near(mq137::dividerGain(47, 10), 5.7f, 1e-5f));

  std::printf("%d/%d mq137 checks passed (example: 1.6 V module out after clean-air cal = %.1f ppm)\n",
              checks - fails, checks, p);
  return fails ? 1 : 0;
}
