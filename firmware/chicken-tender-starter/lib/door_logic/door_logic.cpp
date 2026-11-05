#include "door_logic.h"

namespace door {

const char* stateName(State s) {
  switch (s) {
    case State::Idle: return "idle";
    case State::Opening: return "opening";
    case State::Closing: return "closing";
    case State::Open: return "open";
    case State::Closed: return "closed";
    case State::Fault: return "fault";
    case State::EStop: return "estop";
    case State::Reversing: return "reversing";
  }
  return "unknown";
}

const char* faultName(Fault f) {
  switch (f) {
    case Fault::None: return "none";
    case Fault::Timeout: return "timeout";
    case Fault::Overcurrent: return "overcurrent";
    case Fault::Driver: return "driver";
    case Fault::ReedConflict: return "reed_conflict";
    case Fault::LimitNoReed: return "limit_without_reed";
  }
  return "unknown";
}

const char* posName(Pos p) {
  switch (p) {
    case Pos::Unknown: return "unknown";
    case Pos::Closed: return "closed";
    case Pos::Open: return "open";
  }
  return "unknown";
}

void Controller::startMove(int8_t dir, uint32_t now) {
  motor_ = dir;
  pendingDir_ = 0;
  state_ = dir > 0 ? State::Opening : State::Closing;
  fault_ = Fault::None;
  moveStart_ = segStart_ = now;
  over_ = drvFault_ = idle_ = false;
}

// Move in `dir`, braking first if the motor is running (or about to run) the other way.
void Controller::requestMove(int8_t dir, uint32_t now) {
  if (motor_ == dir) return;                                   // already going there
  if (state_ == State::Reversing) { pendingDir_ = dir; return; }  // keep braking, new target
  if (motor_ != 0) {                                           // mid-move reversal
    motor_ = 0;
    pendingDir_ = dir;
    state_ = State::Reversing;
    dwellStart_ = now;                                         // moveStart_ kept on purpose
    return;
  }
  startMove(dir, now);
}

void Controller::stop(State s, Fault f) {
  motor_ = 0;
  pendingDir_ = 0;
  state_ = s;
  fault_ = f;
}

void Controller::latch() {
  if (!latched_) { latched_ = true; latchChanged_ = true; }
  stop(State::EStop);
}

void Controller::begin(Pos lastCommanded, const Inputs& in, uint32_t now, bool estopLatched) {
  const Pos target = lastCommanded == Pos::Open ? Pos::Open : Pos::Closed;
  commanded_ = target;
  changed_ = lastCommanded != target;  // Unknown -> Closed gets persisted
  latched_ = estopLatched;
  if (estopLatched || !in.estopOk) { latch(); return; }
  if (in.reedOpen && in.reedClosed) { stop(State::Fault, Fault::ReedConflict); return; }
  if (target == Pos::Open) {
    if (in.reedOpen) stop(State::Open); else startMove(+1, now);
  } else {
    if (in.reedClosed) stop(State::Closed); else startMove(-1, now);
  }
}

bool Controller::command(Cmd c, const Inputs& in, uint32_t now) {
  if (c == Cmd::None) return true;
  if (c == Cmd::Stop) {
    if (motor_ != 0 || state_ == State::Reversing) stop(State::Idle);
    return true;
  }
  if (!in.estopOk) { latch(); return false; }
  if (latched_) return false;                 // needs an explicit clearEStop() first
  const Pos target = c == Cmd::Open ? Pos::Open : Pos::Closed;
  if (target != commanded_) { commanded_ = target; changed_ = true; }
  if (in.reedOpen && in.reedClosed) { stop(State::Fault, Fault::ReedConflict); return false; }
  if (target == Pos::Open) {
    if (in.reedOpen) stop(State::Open); else requestMove(+1, now);
  } else {
    if (in.reedClosed) stop(State::Closed); else requestMove(-1, now);
  }
  return true;
}

bool Controller::clearEStop(const Inputs& in) {
  if (!in.estopOk) return false;
  if (latched_) { latched_ = false; latchChanged_ = true; }
  if (state_ == State::EStop) stop(State::Idle);
  return true;
}

int8_t Controller::update(const Inputs& in, uint32_t now) {
  // E-STOP is hardware (it cuts the driver SLEEP line); mirror it in software and latch.
  if (!in.estopOk) {
    if (state_ != State::EStop || !latched_) latch();
    return motor_;
  }

  if (state_ == State::Reversing) {
    if (in.reedOpen && in.reedClosed) { stop(State::Fault, Fault::ReedConflict); return 0; }
    if (pendingDir_ > 0 && in.reedOpen)   { stop(State::Open);   return 0; }
    if (pendingDir_ < 0 && in.reedClosed) { stop(State::Closed); return 0; }
    if (now - moveStart_ >= cfg_.travelTimeout_ms) { stop(State::Fault, Fault::Timeout); return 0; }
    if (now - dwellStart_ < cfg_.reverseDwell_ms) return 0;   // braking
    motor_ = pendingDir_;
    pendingDir_ = 0;
    state_ = motor_ > 0 ? State::Opening : State::Closing;
    segStart_ = now;
    over_ = drvFault_ = idle_ = false;
    return motor_;
  }
  if (motor_ == 0) return 0;

  if (in.reedOpen && in.reedClosed) { stop(State::Fault, Fault::ReedConflict); return 0; }
  if (motor_ > 0 && in.reedOpen)   { stop(State::Open);   return 0; }
  if (motor_ < 0 && in.reedClosed) { stop(State::Closed); return 0; }

  if (now - moveStart_ >= cfg_.travelTimeout_ms) { stop(State::Fault, Fault::Timeout); return 0; }

  // Driver fault held (over-current / thermal / UVLO, or chopping that never ends).
  if (in.driverFault) {
    if (!drvFault_) { drvFault_ = true; faultSince_ = now; }
    else if (now - faultSince_ >= cfg_.driverFaultHold_ms) { stop(State::Fault, Fault::Driver); return 0; }
  } else {
    drvFault_ = false;
  }

  if (now - segStart_ < cfg_.startGrace_ms) return motor_;

  // Jam: current above threshold for long enough.
  if (in.current_mA >= cfg_.overcurrent_mA) {
    if (!over_) { over_ = true; overSince_ = now; }
    else if (now - overSince_ >= cfg_.overcurrentHold_ms) { stop(State::Fault, Fault::Overcurrent); return 0; }
  } else {
    over_ = false;
  }

  // The actuator's own limit switch cut the motor but the reed never closed.
  if (in.current_mA <= cfg_.idleCurrent_mA) {
    if (!idle_) { idle_ = true; idleSince_ = now; }
    else if (now - idleSince_ >= cfg_.limitNoReed_ms) { stop(State::Fault, Fault::LimitNoReed); return 0; }
  } else {
    idle_ = false;
  }
  return motor_;
}

}  // namespace door
