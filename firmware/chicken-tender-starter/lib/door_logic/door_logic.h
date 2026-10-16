// Chicken Tender Starter - door logic (pure C++, no Arduino). Host-tested in test/host.
//
// Mechanism: cord-lift door. The 12 V actuator RETRACTS to lift the door (motor +1 = open)
// and EXTENDS to let the door fall under its own weight (motor -1 = close). The actuator never
// pushes the door down, so a chicken under the door only ever feels the door's own weight.
// Reed switches mark the real door ends; the actuator's built-in limit switches are the backup.
//
// E-STOP is a LATCH: once the loop opens (hardware button, cut wire or app stop) the controller
// refuses Open/Close until clearEStop() is called with the loop closed again. The caller persists
// the latch (NVS) and passes it back to begin() so a reboot / watchdog reset never moves the door.
// A direction reversal mid-move brakes for reverseDwell_ms first and keeps the original travel
// timeout running, so flip-flopping commands cannot extend a move forever.
//
// All timing uses (now - start) >= duration with uint32_t, so it is millis() rollover-safe.
#pragma once
#include <stdint.h>

namespace door {

enum class Pos : uint8_t { Unknown = 0, Closed = 1, Open = 2 };
enum class State : uint8_t { Idle, Opening, Closing, Open, Closed, Fault, EStop, Reversing };
enum class Fault : uint8_t { None, Timeout, Overcurrent, Driver, ReedConflict, LimitNoReed };
enum class Cmd : uint8_t { None, Open, Close, Stop };

struct Inputs {
  bool reedOpen = false;      // door at the top (open) reed
  bool reedClosed = false;    // door at the bottom (closed) reed
  bool estopOk = true;        // NC E-STOP loop closed (driver SLEEP line high)
  bool driverFault = false;   // DRV8874 nFAULT asserted (low)
  uint16_t current_mA = 0;    // from the DRV8874 CS pin (1.1 V/A on the Pololu carrier)
};

struct Config {
  uint32_t travelTimeout_ms = 55000;   // set per actuator tier (CT_TRAVEL_TIMEOUT_MS); 55 s fits the slow tier
  uint32_t startGrace_ms = 400;        // ignore inrush / no-current right after start
  uint16_t overcurrent_mA = 1800;      // jam threshold, below the ~2.0 A driver limit
  uint32_t overcurrentHold_ms = 600;   // must persist this long to count as a jam
  uint32_t driverFaultHold_ms = 600;   // nFAULT also pulses during current chopping
  uint16_t idleCurrent_mA = 80;        // below this the actuator's own limit switch has cut power
  uint32_t limitNoReed_ms = 800;       // no current this long while moving = limit hit, reed missed
  uint32_t reverseDwell_ms = 300;      // brake (EN low) this long before driving the other way
};

const char* stateName(State s);
const char* faultName(Fault f);
const char* posName(Pos p);

class Controller {
 public:
  explicit Controller(const Config& cfg = Config()) : cfg_(cfg) {}

  // Boot: restore the last COMMANDED position (from NVS). Unknown -> close (safe default).
  // estopLatched = the persisted E-STOP latch: true boots straight into EStop, motor off.
  void begin(Pos lastCommanded, const Inputs& in, uint32_t now, bool estopLatched = false);
  // App / MQTT command. Open/Close are refused (return false) while the E-STOP is latched.
  bool command(Cmd c, const Inputs& in, uint32_t now);
  // Explicit E-STOP reset. Refused (false) while the loop is still open. Never moves the door.
  bool clearEStop(const Inputs& in);
  // Call every loop. Returns the motor demand: +1 open (retract), -1 close (extend), 0 stop.
  int8_t update(const Inputs& in, uint32_t now);

  State state() const { return state_; }
  Fault fault() const { return fault_; }
  Pos commanded() const { return commanded_; }
  int8_t motor() const { return motor_; }
  bool estopLatched() const { return latched_; }
  // True once after the latch changed: the caller persists it to NVS.
  bool takeLatchChanged() { bool c = latchChanged_; latchChanged_ = false; return c; }
  // True once after the commanded position changed: the caller persists it to NVS.
  bool takeCommandedChanged() { bool c = changed_; changed_ = false; return c; }

 private:
  void startMove(int8_t dir, uint32_t now);
  void requestMove(int8_t dir, uint32_t now);
  void stop(State s, Fault f = Fault::None);
  void latch();

  Config cfg_;
  State state_ = State::Idle;
  Fault fault_ = Fault::None;
  Pos commanded_ = Pos::Unknown;
  int8_t motor_ = 0;
  bool changed_ = false;
  bool latched_ = false;
  bool latchChanged_ = false;
  int8_t pendingDir_ = 0;     // direction waiting out the reversal dwell
  uint32_t moveStart_ = 0;    // start of the whole move: the travel timeout runs from here
  uint32_t segStart_ = 0;     // start of the current powered segment: start grace runs from here
  uint32_t dwellStart_ = 0;
  uint32_t overSince_ = 0;  bool over_ = false;
  uint32_t faultSince_ = 0; bool drvFault_ = false;
  uint32_t idleSince_ = 0;  bool idle_ = false;
};

}  // namespace door
