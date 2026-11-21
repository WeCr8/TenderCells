"""Door firmware-in-the-loop for the showcase animation.

A line-by-line Python port of firmware/chicken-tender-starter/lib/door_logic/door_logic.cpp (PR #188,
branch fix/chicken-tender-mq137-ppm-2026-11-20), driven by a simple physical plant of the cord-lift door
(actuator extension, cord slack, gravity close, reeds at 0 and DOOR_LIFT, DRV8874 current sense).
The animation's door/actuator motion and the on-screen state labels come from this trace, so what the
video shows is what the firmware would do. (No C++ compiler in the sandbox; the port is checked against
the same scenarios as test/host/test_door_logic.cpp where they overlap - see check_port() below.)
"""
from __future__ import annotations
import json
import sc_params as P

U32 = 0xFFFFFFFF


class Cfg:
    travelTimeout_ms = int(P.FW_TRAVEL_TIMEOUT_S * 1000); startGrace_ms = 400; overcurrent_mA = int(P.FW_OVERCURRENT * 1000)
    overcurrentHold_ms = 600; driverFaultHold_ms = 600; idleCurrent_mA = 80; limitNoReed_ms = 800; reverseDwell_ms = 300


class Inputs:
    def __init__(self, reedOpen=False, reedClosed=False, estopOk=True, driverFault=False, current_mA=0):
        self.reedOpen, self.reedClosed, self.estopOk, self.driverFault, self.current_mA = reedOpen, reedClosed, estopOk, driverFault, current_mA


def dt(now, t0):
    return (now - t0) & U32


class Controller:
    def __init__(self, cfg=Cfg()):
        self.c = cfg; self.state = "idle"; self.fault = "none"; self.commanded = "unknown"; self.motor = 0
        self.changed = self.latched = self.latchChanged = False
        self.pendingDir = 0; self.moveStart = self.segStart = self.dwellStart = 0
        self.overSince = self.faultSince = self.idleSince = 0; self.over = self.drvFault = self.idle = False

    def startMove(self, d, now):
        self.motor = d; self.pendingDir = 0; self.state = "opening" if d > 0 else "closing"; self.fault = "none"
        self.moveStart = self.segStart = now; self.over = self.drvFault = self.idle = False

    def requestMove(self, d, now):
        if self.motor == d: return
        if self.state == "reversing": self.pendingDir = d; return
        if self.motor != 0:
            self.motor = 0; self.pendingDir = d; self.state = "reversing"; self.dwellStart = now; return
        self.startMove(d, now)

    def stop(self, s, f="none"):
        self.motor = 0; self.pendingDir = 0; self.state = s; self.fault = f

    def latch(self):
        if not self.latched: self.latched = True; self.latchChanged = True
        self.stop("estop")

    def begin(self, last, i, now, estopLatched=False):
        target = "open" if last == "open" else "closed"
        self.commanded = target; self.changed = last != target; self.latched = estopLatched
        if estopLatched or not i.estopOk: self.latch(); return
        if i.reedOpen and i.reedClosed: self.stop("fault", "reed_conflict"); return
        if target == "open":
            self.stop("open") if i.reedOpen else self.startMove(+1, now)
        else:
            self.stop("closed") if i.reedClosed else self.startMove(-1, now)

    def command(self, c, i, now):
        if c == "none": return True
        if c == "stop":
            if self.motor != 0 or self.state == "reversing": self.stop("idle")
            return True
        if not i.estopOk: self.latch(); return False
        if self.latched: return False
        target = "open" if c == "open" else "closed"
        if target != self.commanded: self.commanded = target; self.changed = True
        if i.reedOpen and i.reedClosed: self.stop("fault", "reed_conflict"); return False
        if target == "open":
            self.stop("open") if i.reedOpen else self.requestMove(+1, now)
        else:
            self.stop("closed") if i.reedClosed else self.requestMove(-1, now)
        return True

    def clearEStop(self, i):
        if not i.estopOk: return False
        if self.latched: self.latched = False; self.latchChanged = True
        if self.state == "estop": self.stop("idle")
        return True

    def update(self, i, now):
        c = self.c
        if not i.estopOk:
            if self.state != "estop" or not self.latched: self.latch()
            return self.motor
        if self.state == "reversing":
            if i.reedOpen and i.reedClosed: self.stop("fault", "reed_conflict"); return 0
            if self.pendingDir > 0 and i.reedOpen: self.stop("open"); return 0
            if self.pendingDir < 0 and i.reedClosed: self.stop("closed"); return 0
            if dt(now, self.moveStart) >= c.travelTimeout_ms: self.stop("fault", "timeout"); return 0
            if dt(now, self.dwellStart) < c.reverseDwell_ms: return 0
            self.motor = self.pendingDir; self.pendingDir = 0; self.state = "opening" if self.motor > 0 else "closing"
            self.segStart = now; self.over = self.drvFault = self.idle = False
            return self.motor
        if self.motor == 0: return 0
        if i.reedOpen and i.reedClosed: self.stop("fault", "reed_conflict"); return 0
        if self.motor > 0 and i.reedOpen: self.stop("open"); return 0
        if self.motor < 0 and i.reedClosed: self.stop("closed"); return 0
        if dt(now, self.moveStart) >= c.travelTimeout_ms: self.stop("fault", "timeout"); return 0
        if i.driverFault:
            if not self.drvFault: self.drvFault = True; self.faultSince = now
            elif dt(now, self.faultSince) >= c.driverFaultHold_ms: self.stop("fault", "driver"); return 0
        else:
            self.drvFault = False
        if dt(now, self.segStart) < c.startGrace_ms: return self.motor
        if i.current_mA >= c.overcurrent_mA:
            if not self.over: self.over = True; self.overSince = now
            elif dt(now, self.overSince) >= c.overcurrentHold_ms: self.stop("fault", "overcurrent"); return 0
        else:
            self.over = False
        if i.current_mA <= c.idleCurrent_mA:
            if not self.idle: self.idle = True; self.idleSince = now
            elif dt(now, self.idleSince) >= c.limitNoReed_ms: self.stop("fault", "limit_without_reed"); return 0
        else:
            self.idle = False
        return self.motor


class DoorPlant:
    """Actuator extension e (mm, hole to hole) -> cord -> door lift. Retract (motor +1) lifts the door."""
    def __init__(self, tier=P.ACT_TIER, door_N=10.2):
        a = P.ACT[tier]; self.a = a; self.e = a["extended"] - P.ACT_SLACK_AT_CLOSE + 2.0; self.door_N = door_N

    @property
    def lift(self):
        return max(0.0, self.a["extended"] - P.ACT_SLACK_AT_CLOSE - self.e)

    def step(self, motor, dt_s, estop_ok):
        a = self.a
        if not estop_ok or motor == 0:
            return 0
        load = self.door_N if motor > 0 and self.lift >= 0 and self.e < a["extended"] - P.ACT_SLACK_AT_CLOSE else 0.0
        v = a["speed_noload"] * (1 - 0.17 * load / a["force_N"])
        e_new = self.e - motor * v * dt_s
        at_limit = e_new <= a["retracted"] or e_new >= a["extended"]
        self.e = min(max(e_new, a["retracted"]), a["extended"])
        if at_limit:
            return 0                            # built-in limit switch cuts the motor
        return int(1000 * (a["i_noload"] + (a["i_rated"] - a["i_noload"]) * load / a["force_N"]))

    def inputs(self, estop_ok, cur):
        return Inputs(reedOpen=self.lift >= P.DOOR_LIFT - 2.0, reedClosed=self.lift <= 2.0, estopOk=estop_ok, current_mA=cur)


def scenario(tier=P.ACT_TIER, estop_at_frac=0.5, estop_hold_s=8.0):
    """Morning open, evening close with an E-STOP press half way, release, clearEStop, close again."""
    ctl, door = Controller(), DoorPlant(tier)
    tr, ev = [], []
    t, dts, cur = 0, 100, 0
    est = True
    ctl.begin("closed", door.inputs(est, 0), t)
    def log(note=""):
        tr.append({"t_s": t / 1000, "state": ctl.state, "fault": ctl.fault, "motor": ctl.motor, "lift_mm": round(door.lift, 1),
                   "ext_mm": round(door.e, 1), "reed_open": door.lift >= P.DOOR_LIFT - 2, "reed_closed": door.lift <= 2,
                   "estop_ok": est, "current_mA": cur, "latched": ctl.latched, "note": note})
    def run_until(pred, limit_s=120):
        nonlocal t, cur
        t_end = t + limit_s * 1000
        while t < t_end:
            m = ctl.update(door.inputs(est, cur), t)
            cur = door.step(m, dts / 1000, est)
            t += dts; log()
            if pred(): return True
        return False
    log("boot: commanded closed, reed closed")
    ev.append(("open_cmd", t / 1000)); ctl.command("open", door.inputs(est, cur), t); log("schedule: sunrise -> Open")
    run_until(lambda: ctl.state != "opening"); ev.append(("open_done", t / 1000))
    t += 60_000; log("day")
    ev.append(("close_cmd", t / 1000)); ctl.command("close", door.inputs(est, cur), t); log("schedule: dusk -> Close")
    run_until(lambda: door.lift <= P.DOOR_LIFT * (1 - estop_at_frac)); ev.append(("estop", t / 1000))
    est = False; log("E-STOP pressed: NC loop open -> DRV8874 SLEEP low")
    run_until(lambda: False, estop_hold_s); ev.append(("estop_release", t / 1000))
    est = True; log("E-STOP released (twist)")
    ok_blocked = ctl.command("close", door.inputs(est, cur), t); log("Close refused while latched" if not ok_blocked else "")
    ctl.clearEStop(door.inputs(est, cur)); log("clearEStop() from the app")
    ctl.command("close", door.inputs(est, cur), t); log("Close again"); ev.append(("close2_cmd", t / 1000))
    run_until(lambda: ctl.state != "closing"); ev.append(("close_done", t / 1000))
    return tr, dict(ev), ok_blocked


def check_port():
    """Spot checks mirroring test_door_logic.cpp behaviours (E-STOP latch, reed stop, refusal while latched)."""
    tr, ev, ok_blocked = scenario()
    assert not ok_blocked, "Close must be refused while the E-STOP latch is set"
    states = [r["state"] for r in tr]
    assert "estop" in states and states[-1] == "closed"
    after = [r for r in tr if ev["estop"] < r["t_s"] < ev["estop_release"]]
    assert all(r["motor"] == 0 for r in after), "motor must stay off during E-STOP"
    assert all(abs(r["lift_mm"] - after[0]["lift_mm"]) < 0.5 for r in after), "door holds during E-STOP"
    o = [r for r in tr if r["state"] == "open"][0]
    assert abs(o["lift_mm"] - P.DOOR_LIFT) < 3
    return True


if __name__ == "__main__":
    import sys, os
    out = {}
    for tier in ("starter", "pro"):
        tr, ev, _ = scenario(tier)
        out[tier] = {"events_s": ev, "open_move_s": round(ev["open_done"] - ev["open_cmd"], 1),
                     "close_total_s": round(ev["close_done"] - ev["close_cmd"], 1), "trace": tr[::5]}
    check_port()
    p = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "reports", "CT_COOP_A_showcase_fw_trace.json")
    json.dump(out, open(p, "w"), indent=0)
    print({k: (v["events_s"], v["open_move_s"], v["close_total_s"]) for k, v in out.items()})
