// Host tests for lib/door_logic (no Arduino, no Unity): build with any C++17 compiler.
//   make -C firmware/chicken-tender-starter/test/host
#include <cstdio>
#include <cstdint>
#include "door_logic.h"

using namespace door;

static int g_fail = 0, g_pass = 0;
#define CHECK(cond) do { if (cond) { g_pass++; } else { g_fail++; std::printf("FAIL %s:%d  %s\n", __FILE__, __LINE__, #cond); } } while (0)

static Inputs moving(uint16_t mA = 900) { Inputs in; in.current_mA = mA; return in; }

static void test_open_then_reed_stops() {
  Controller c; Inputs in = moving();
  CHECK(c.command(Cmd::Open, in, 0));
  CHECK(c.state() == State::Opening);
  CHECK(c.update(in, 100) == +1);
  in.reedOpen = true;
  CHECK(c.update(in, 5000) == 0);
  CHECK(c.state() == State::Open);
  CHECK(c.commanded() == Pos::Open);
  CHECK(c.takeCommandedChanged());
  CHECK(!c.takeCommandedChanged());
}

static void test_close_then_reed_stops() {
  Controller c; Inputs in = moving();
  c.command(Cmd::Close, in, 0);
  CHECK(c.update(in, 10) == -1);
  in.reedClosed = true;
  CHECK(c.update(in, 3000) == 0);
  CHECK(c.state() == State::Closed);
}

static void test_already_there_does_not_move() {
  Controller c; Inputs in; in.reedClosed = true;
  c.command(Cmd::Close, in, 0);
  CHECK(c.motor() == 0);
  CHECK(c.state() == State::Closed);
}

static void test_timeout() {
  Config cfg; cfg.travelTimeout_ms = 10000;
  Controller c(cfg); Inputs in = moving();
  c.command(Cmd::Open, in, 0);
  CHECK(c.update(in, 9999) == +1);
  CHECK(c.update(in, 10000) == 0);
  CHECK(c.state() == State::Fault && c.fault() == Fault::Timeout);
}

static void test_estop_mid_motion_latches() {
  Controller c; Inputs in = moving();
  c.command(Cmd::Close, in, 0);
  in.estopOk = false;
  CHECK(c.update(in, 500) == 0);
  CHECK(c.state() == State::EStop);
  in.estopOk = true;                          // button released: still stopped
  CHECK(c.update(in, 600) == 0);
  CHECK(c.state() == State::EStop);
  CHECK(c.estopLatched() && c.takeLatchChanged());
  CHECK(!c.command(Cmd::Close, in, 700));     // latched: a plain command does NOT resume
  CHECK(c.update(in, 750) == 0);
  CHECK(c.clearEStop(in));                    // explicit reset with the loop closed
  CHECK(!c.estopLatched() && c.takeLatchChanged());
  CHECK(c.motor() == 0 && c.state() == State::Idle);   // reset never moves the door
  CHECK(c.command(Cmd::Close, in, 800));
  CHECK(c.update(in, 900) == -1);
}

static void test_clear_refused_while_loop_open() {
  Controller c; Inputs in = moving(); in.estopOk = false;
  c.update(in, 0);
  CHECK(!c.clearEStop(in));
  CHECK(c.estopLatched() && c.state() == State::EStop);
}

static void test_reboot_with_persisted_latch_stays_still() {
  // App E-STOP, then reboot / WDT reset: loop reads closed again, last command was OPEN.
  Controller c; Inputs in;
  c.begin(Pos::Open, in, 0, /*estopLatched=*/true);
  CHECK(c.state() == State::EStop && c.motor() == 0);
  CHECK(c.update(in, 1000) == 0);
  CHECK(!c.command(Cmd::Open, in, 1100));
  CHECK(c.clearEStop(in) && c.motor() == 0);
}

static void test_momentary_press_latches() {
  // A press shorter than one loop is still seen as one estopOk=false sample (ISR flag).
  Controller c; Inputs in = moving();
  c.command(Cmd::Open, in, 0);
  Inputs pressed = in; pressed.estopOk = false;
  c.update(pressed, 100);
  CHECK(c.update(in, 200) == 0 && c.state() == State::EStop);
}

static void test_command_refused_while_estop_open() {
  Controller c; Inputs in = moving(); in.estopOk = false;
  CHECK(!c.command(Cmd::Open, in, 0));
  CHECK(c.motor() == 0 && c.state() == State::EStop);
}

static void test_overcurrent_jam() {
  Controller c; Inputs in = moving(1900);
  c.command(Cmd::Open, in, 0);
  CHECK(c.update(in, 100) == +1);             // inside start grace: inrush ignored
  CHECK(c.update(in, 500) == +1);             // over threshold starts the hold timer
  CHECK(c.update(in, 1000) == +1);
  CHECK(c.update(in, 1100) == 0);             // held 600 ms -> jam
  CHECK(c.fault() == Fault::Overcurrent);
}

static void test_short_spike_is_not_a_jam() {
  Controller c; Inputs in = moving();
  c.command(Cmd::Open, in, 0);
  in.current_mA = 1900; c.update(in, 500);
  in.current_mA = 900;  CHECK(c.update(in, 700) == +1);
  in.current_mA = 1900; CHECK(c.update(in, 900) == +1);
  CHECK(c.update(in, 1400) == +1);
  CHECK(c.state() == State::Opening);
}

static void test_limit_without_reed() {
  Controller c; Inputs in = moving(0);
  c.command(Cmd::Open, in, 0);
  CHECK(c.update(in, 200) == +1);             // grace
  CHECK(c.update(in, 500) == +1);             // idle timer starts
  CHECK(c.update(in, 1299) == +1);
  CHECK(c.update(in, 1300) == 0);
  CHECK(c.fault() == Fault::LimitNoReed);
}

static void test_driver_fault_held() {
  Controller c; Inputs in = moving(); in.driverFault = true;
  c.command(Cmd::Close, in, 0);
  CHECK(c.update(in, 10) == -1);
  CHECK(c.update(in, 610) == 0);
  CHECK(c.fault() == Fault::Driver);
}

static void test_reed_conflict() {
  Controller c; Inputs in = moving(); in.reedOpen = in.reedClosed = true;
  CHECK(!c.command(Cmd::Open, in, 0));
  CHECK(c.fault() == Fault::ReedConflict);
}

static void test_reboot_restores_open() {
  Controller c; Inputs in;                    // door hanging half-way, last command was OPEN
  c.begin(Pos::Open, in, 0);
  CHECK(c.state() == State::Opening && c.motor() == +1);
  CHECK(!c.takeCommandedChanged());
}

static void test_reboot_restores_closed_already_there() {
  Controller c; Inputs in; in.reedClosed = true;
  c.begin(Pos::Closed, in, 0);
  CHECK(c.state() == State::Closed && c.motor() == 0);
}

static void test_first_boot_unknown_closes() {
  Controller c; Inputs in;
  c.begin(Pos::Unknown, in, 0);
  CHECK(c.commanded() == Pos::Closed && c.motor() == -1);
  CHECK(c.takeCommandedChanged());            // persist the safe default
}

static void test_reboot_with_estop_open_stays_still() {
  Controller c; Inputs in; in.estopOk = false;
  c.begin(Pos::Open, in, 0);
  CHECK(c.state() == State::EStop && c.motor() == 0);
}

static void test_millis_rollover() {
  Config cfg; cfg.travelTimeout_ms = 10000;
  Controller c(cfg); Inputs in = moving();
  const uint32_t t0 = 0xFFFFF000u;            // 4096 ms before wrap
  c.command(Cmd::Open, in, t0);
  CHECK(c.update(in, t0 + 5000u) == +1);      // wrapped: 5 s elapsed, still moving
  CHECK(c.update(in, t0 + 9999u) == +1);
  CHECK(c.update(in, t0 + 10000u) == 0);
  CHECK(c.fault() == Fault::Timeout);
}

static void test_stop_command() {
  Controller c; Inputs in = moving();
  c.command(Cmd::Open, in, 0);
  c.command(Cmd::Stop, in, 100);
  CHECK(c.motor() == 0 && c.state() == State::Idle);
  CHECK(c.update(in, 200) == 0);
}

static void test_reverse_mid_travel_brakes_first() {
  Controller c; Inputs in = moving();
  c.command(Cmd::Open, in, 0);
  c.update(in, 1000);
  c.command(Cmd::Close, in, 1500);
  CHECK(c.motor() == 0 && c.state() == State::Reversing);   // brake, no full-duty flip
  CHECK(c.update(in, 1700) == 0);                            // still inside the 300 ms dwell
  CHECK(c.update(in, 1800) == -1 && c.state() == State::Closing);
  CHECK(c.commanded() == Pos::Closed);
  CHECK(c.update(in, 1900) == -1);                           // inrush grace after the flip
}

static void test_reversal_keeps_travel_timeout() {
  Config cfg; cfg.travelTimeout_ms = 10000;
  Controller c(cfg); Inputs in = moving();
  c.command(Cmd::Open, in, 0);
  c.update(in, 6000);
  c.command(Cmd::Close, in, 6000);
  c.update(in, 6300);                                        // reversed at 6.3 s
  CHECK(c.update(in, 9999) == -1);
  CHECK(c.update(in, 10000) == 0);                           // 10 s from the ORIGINAL start
  CHECK(c.fault() == Fault::Timeout);
}

static void test_reversal_flip_flop_cannot_extend() {
  Config cfg; cfg.travelTimeout_ms = 5000;
  Controller c(cfg); Inputs in = moving();
  c.command(Cmd::Open, in, 0);
  for (uint32_t t = 500; t < 5000; t += 500) {
    c.command((t / 500) % 2 ? Cmd::Close : Cmd::Open, in, t);
    c.update(in, t + 1);
  }
  c.update(in, 5000);
  CHECK(c.state() == State::Fault && c.fault() == Fault::Timeout);
}

static void test_estop_during_reversal_dwell() {
  Controller c; Inputs in = moving();
  c.command(Cmd::Open, in, 0);
  c.command(Cmd::Close, in, 1000);
  Inputs pressed = in; pressed.estopOk = false;
  CHECK(c.update(pressed, 1100) == 0 && c.state() == State::EStop);
  CHECK(c.update(in, 2000) == 0);                            // pending reversal is dropped
}

static void test_names() {
  CHECK(stateName(State::Opening)[0] == 'o');
  CHECK(stateName(State::Reversing)[0] == 'r');
  CHECK(faultName(Fault::LimitNoReed)[0] == 'l');
  CHECK(posName(Pos::Open)[0] == 'o');
}

int main() {
  test_open_then_reed_stops();
  test_close_then_reed_stops();
  test_already_there_does_not_move();
  test_timeout();
  test_estop_mid_motion_latches();
  test_command_refused_while_estop_open();
  test_overcurrent_jam();
  test_short_spike_is_not_a_jam();
  test_limit_without_reed();
  test_driver_fault_held();
  test_reed_conflict();
  test_reboot_restores_open();
  test_reboot_restores_closed_already_there();
  test_first_boot_unknown_closes();
  test_reboot_with_estop_open_stays_still();
  test_millis_rollover();
  test_stop_command();
  test_reverse_mid_travel_brakes_first();
  test_reversal_keeps_travel_timeout();
  test_reversal_flip_flop_cannot_extend();
  test_estop_during_reversal_dwell();
  test_clear_refused_while_loop_open();
  test_reboot_with_persisted_latch_stays_still();
  test_momentary_press_latches();
  test_names();
  std::printf("door_logic host tests: %d passed, %d failed\n", g_pass, g_fail);
  return g_fail == 0 ? 0 : 1;
}
