"""pytest for routines.py: the CLEAN / EGG interlocks and the state machine (pure simulation, no hardware).

    cd cad/chicken-tender-coop/showcase && python -m pytest test_routines.py -q
"""
import sys
import pytest
import sc_params as P
import clean_params as C
import routines as R
from routines import RoutineController, base_inputs, run_scenario, Step

PLAN = R.clean_plan()
EGG = R.egg_plan()
HOLD = C.CAM_CLEAR_HOLD_S


def moved_between(ctl, t0, t1):
    return [m for m in ctl.sim.motion_log if t0 < m[0] < t1]


def first(ctl, kind):
    return next((e for e in ctl.log if e.kind == kind), None)


class Trigger:
    """Inputs function that flips to a scenario the first time `cond(ctl)` is true, from then on applies `mod(t, t0)`."""
    def __init__(self, ctl, cond, mod):
        self.ctl, self.cond, self.mod, self.t0 = ctl, cond, mod, None

    def __call__(self, t):
        if self.t0 is None and self.ctl.state == "RUNNING" and self.cond(self.ctl):
            self.t0 = t
        return self.mod(t, self.t0) if self.t0 is not None else base_inputs(t)


def tool_in_bed(ctl):
    return ctl.sim.in_bed


# ------------------------------------------------------------------------- plan + limits
def test_plan_respects_soft_limits():
    assert R.validate_plan(PLAN) == []
    assert R.validate_plan(EGG) == []
    for s in PLAN["steps"]:
        if s.kind == "xy":
            assert max(s.start[2], s.end[2]) <= P.GZ_TRAVEL_MAX
            assert s.speed <= P.G_SPEED["xy_max"]
        if s.kind == "z":
            assert s.speed <= P.G_SPEED["z_max"]


def test_soft_limit_checker_rejects_bad_moves():
    a, b = (500.0, 2800.0, 1280.0), (600.0, 2800.0, 1280.0)
    assert R.check_soft_limits(Step("xy", "fast", 1, a, b, 150.0))                       # > xy_max
    assert R.check_soft_limits(Step("xy", "high", 1, (500, 2800, 1300.0), (600, 2800, 1300.0), 50.0))   # gz > travel max
    assert R.check_soft_limits(Step("xy", "near wall", 1, (140, 2800, 1280), (300, 2800, 1280), 100.0))  # near-wall clamp
    assert R.check_soft_limits(Step("z", "zfast", 1, a, (500, 2800, 1200), 30.0))
    assert R.check_soft_limits(Step("xy", "tool in bed", 1, a, b, 50.0, in_bed=True))
    assert R.check_soft_limits(Step("xy", "ok", 1, a, b, 100.0)) == ""


def test_soft_limit_trips_at_runtime():
    bad = {"steps": [Step("xy", "too fast", 2.0, (500, 2800, 1280.0), (700, 2800, 1280.0), 180.0)]}
    ctl = run_scenario(bad, "clean", lambda t: base_inputs(t), HOLD + 5)
    assert ctl.fault == "soft_limit" and ctl.state == "STOPPED"
    assert not ctl.sim.motion_log


# ------------------------------------------------------------------------- nominal
def test_nominal_clean_waits_for_camera_hold_then_completes():
    t_end = R.cycle_time(PLAN)["total_s"] + HOLD + 30
    ctl = run_scenario(PLAN, "clean", lambda t: base_inputs(t), t_end)
    assert ctl.state == "DONE", ctl.log[-3:]
    assert ctl.fault is None
    assert first(ctl, "start").t >= HOLD
    assert min(m[0] for m in ctl.sim.motion_log) >= HOLD


# ------------------------------------------------------------------------- chicken enters mid-clean
def test_chicken_enters_mid_clean_freezes_then_retreats_when_clear():
    ctl = RoutineController()
    def mod(t, t0):
        hen = t0 <= t < t0 + 20.0                                  # hen in view for 20 s, PIR sees her too
        return base_inputs(t, cam_clear=not hen, pir_active=hen)
    trig = Trigger(ctl, tool_in_bed, mod)
    run_scenario(PLAN, "clean", trig, 400, ctl=ctl)
    t0 = trig.t0
    f = first(ctl, "fault")
    assert f.t == pytest.approx(t0) and "presence_camera" in f.msg
    assert not moved_between(ctl, t0, t0 + 20.0 + HOLD - 0.05)    # frozen: no motion while she is there + the 60 s hold
    assert ctl.sim.compliant or ctl.state != "FREEZE"
    clr = first(ctl, "clear")
    assert clr.t >= t0 + 20.0 + HOLD - 0.15                       # retreat only after 60 s of clear camera
    assert ctl.state == "STOPPED" and not ctl.sim.in_bed
    assert any(lvl == "alert" for lvl, _ in ctl.notes)
    for st in ctl.retreat_steps:                                  # reduced-speed retreat
        if st.kind == "z":
            assert st.speed <= C.SAFE_Z_SPEED and st.end[2] == P.GZ_TRAVEL_MAX


def test_chicken_stays_means_no_retreat():
    ctl = RoutineController()
    trig = Trigger(ctl, tool_in_bed, lambda t, t0: base_inputs(t, cam_clear=False, pir_active=True))
    run_scenario(PLAN, "clean", trig, 400, ctl=ctl)
    assert ctl.state == "FREEZE"
    assert not moved_between(ctl, trig.t0, 400)


# ------------------------------------------------------------------------- pop door reed bounce
def test_reed_bounce_blocks_start_until_stable():
    def bouncy(t):
        b = t < 100 and int(t * 10) % 3 == 0                      # closed reed drops every 0.3 s for the first 100 s
        return base_inputs(t, reed_closed=not b)
    ctl = run_scenario(PLAN, "clean", bouncy, 130)
    assert first(ctl, "start").t >= 100 + C.REED_DEBOUNCE_S - 0.05


def test_reed_bounce_mid_clean_stops_and_retreats():
    ctl = RoutineController()
    trig = Trigger(ctl, tool_in_bed, lambda t, t0: base_inputs(t, reed_closed=not (t0 <= t < t0 + 0.1)))   # one 0.1 s bounce
    run_scenario(PLAN, "clean", trig, 300, ctl=ctl)
    f = first(ctl, "fault")
    assert "pop_door_not_closed" in f.msg and f.t == pytest.approx(trig.t0)
    assert ctl.state == "STOPPED" and not ctl.sim.in_bed            # no presence -> tool lifted out, Z up
    plan_moves = [m for m in ctl.sim.motion_log if m[0] > trig.t0 and not m[1].startswith("RETREAT")]
    assert not plan_moves                                            # never resumes the plan on its own


# ------------------------------------------------------------------------- E-STOP
def test_estop_cuts_power_latches_and_needs_rearm():
    ctl = RoutineController()
    trig = Trigger(ctl, tool_in_bed, lambda t, t0: base_inputs(t, estop_ok=not (t0 <= t < t0 + 5.0)))
    acts = {}
    run_scenario(PLAN, "clean", trig, 250, ctl=ctl, actions=acts)
    t0 = trig.t0
    assert ctl.state == "ESTOP" and not ctl.sim.power
    assert not moved_between(ctl, t0, 250)
    assert ctl.request("clean", PLAN) is False                      # refused while latched
    # re-arm while pressed is refused, after release it clears
    ctl2 = RoutineController()
    trig2 = Trigger(ctl2, tool_in_bed, lambda t, t0: base_inputs(t, estop_ok=not (t0 <= t < t0 + 5.0)))
    def press_rearm(c):
        c.rearm()
    run_scenario(PLAN, "clean", trig2, 400, ctl=ctl2, actions={300.0: press_rearm})
    assert ctl2.state == "STOPPED" and ctl2.sim.power
    assert first(ctl2, "rearm") is not None


def test_estop_rearm_refused_while_still_pressed():
    ctl = RoutineController()
    trig = Trigger(ctl, tool_in_bed, lambda t, t0: base_inputs(t, estop_ok=False))
    run_scenario(PLAN, "clean", trig, 300, ctl=ctl, actions={250.0: lambda c: c.rearm()})
    assert ctl.state == "ESTOP" and first(ctl, "rearm") is None


# ------------------------------------------------------------------------- sensor disagree
def test_sensor_disagree_camera_clear_pir_active_aborts():
    ctl = RoutineController()
    trig = Trigger(ctl, tool_in_bed, lambda t, t0: base_inputs(t, cam_clear=True, pir_active=t >= t0))
    run_scenario(PLAN, "clean", trig, 300, ctl=ctl)
    f = first(ctl, "fault")
    assert "sensor_disagree" in f.msg and ctl.state == "FREEZE"
    assert not moved_between(ctl, trig.t0, 300)


def test_sensor_disagree_blocks_start():
    ctl = run_scenario(PLAN, "clean", lambda t: base_inputs(t, pir_active=True), 200)
    assert ctl.state == "PRECHECK" and not ctl.sim.motion_log


def test_stale_camera_freezes():
    ctl = RoutineController()
    trig = Trigger(ctl, tool_in_bed, lambda t, t0: base_inputs(t, cam_ts=t0))     # camera stops reporting
    run_scenario(PLAN, "clean", trig, 300, ctl=ctl)
    assert "presence_stale" in first(ctl, "fault").msg and ctl.state == "FREEZE"


# ------------------------------------------------------------------------- service doors + maintenance lockout
def test_service_door_open_mid_clean_locks_out_until_closed_and_rearmed():
    ids, src = R.person_door_ids()
    door = ids[0]
    ctl = RoutineController()
    def mod(t, t0):
        d = R.all_closed_doors(); d[door] = not (t0 <= t < t0 + 30.0)            # person opens it for 30 s
        return base_inputs(t, doors=d)
    trig = Trigger(ctl, tool_in_bed, mod)
    run_scenario(PLAN, "clean", trig, 600, ctl=ctl)
    t0 = trig.t0
    assert first(ctl, "fault").msg.startswith("service_door_open") and first(ctl, "fault").t == pytest.approx(t0)
    assert ctl.state == "LOCKOUT"                                                 # door closed at t0+30, still locked
    assert not moved_between(ctl, t0, 600)
    # replay (the sim is deterministic, so t0 is the same) with re-arm presses: while open (refused), 0.5 s after
    # closing (refused: doors must be closed for the resume time), 10 s after closing (accepted)
    ctl3 = RoutineController()
    trig3 = Trigger(ctl3, tool_in_bed, mod)
    press = lambda c: c.rearm()
    run_scenario(PLAN, "clean", trig3, 600, ctl=ctl3,
                 actions={t0 + 10.0: press, t0 + 30.5: press, t0 + 40.0: press})
    refused = [e for e in ctl3.log if e.kind == "refused"]
    assert len(refused) >= 2                                                       # while open, and too soon after closing
    assert first(ctl3, "rearm").t == pytest.approx(t0 + 40.0, abs=0.11)
    assert ctl3.state == "STOPPED"
    assert not moved_between(ctl3, t0, 600)                                         # no auto restart after re-arm
    # a fresh request after re-arm runs again (after the camera hold)
    assert ctl3.request("clean", PLAN)


def test_service_door_opened_while_idle_locks_out():
    ids, _ = R.person_door_ids()
    ctl = RoutineController()
    d = R.all_closed_doors(); d[ids[-1]] = False
    ctl.tick(base_inputs(0.0, doors=d), 0.1)
    assert ctl.state == "LOCKOUT"
    assert ctl.request("clean", PLAN) is False


def test_service_door_open_blocks_start():
    ids, _ = R.person_door_ids()
    d = R.all_closed_doors(); d[ids[0]] = False
    ctl = run_scenario(PLAN, "clean", lambda t: base_inputs(t, doors=d), 120)
    assert ctl.state == "LOCKOUT" and not ctl.sim.motion_log


def test_service_reed_ids_fallback_placeholders(monkeypatch):
    monkeypatch.setitem(sys.modules, "service_params", None)        # file not there yet
    ids, src = R.service_door_reeds()
    assert src == "placeholder" and ids == ["SD_LEFT", "SD_RIGHT_LOW", "SD_BACK"]
    pids, _ = R.person_door_ids()
    assert "RS-CLEANOUT" in pids and "RS-EGGBAY" in pids


def test_service_reed_ids_from_service_params():
    ids, src = R.service_door_reeds()
    try:
        import service_params as S
        assert src == "service_params.DOOR_REEDS" and ids == list(S.DOOR_REEDS)
    except ImportError:
        assert src == "placeholder"


# ------------------------------------------------------------------------- egg routine
def test_egg_routine_needs_empty_nests():
    ctl = run_scenario(EGG, "egg", lambda t: base_inputs(t, nest_kg=(2.1, 0.0)), 120)     # a hen is nesting
    assert ctl.state == "PRECHECK" and not ctl.sim.motion_log
    ctl = run_scenario(EGG, "egg", lambda t: base_inputs(t, nest_kg=None), 120)           # no nest load cells fitted
    assert ctl.state == "PRECHECK" and not ctl.sim.motion_log
    ctl = run_scenario(EGG, "egg", lambda t: base_inputs(t, nest_kg=(0.06, 0.12)), 200)   # eggs only -> runs
    assert ctl.state == "DONE"


def test_hen_steps_into_nest_mid_egg_freezes():
    ctl = RoutineController()
    trig = Trigger(ctl, tool_in_bed, lambda t, t0: base_inputs(t, nest_kg=(2.4, 0.0)))   # arm in the box, hen arrives
    run_scenario(EGG, "egg", trig, 200, ctl=ctl)
    assert "nest_occupied" in first(ctl, "fault").msg and ctl.state == "FREEZE"
    assert not moved_between(ctl, trig.t0, 200)


def test_pop_door_opens_while_arm_in_nest_stops():
    ctl = RoutineController()
    trig = Trigger(ctl, tool_in_bed, lambda t, t0: base_inputs(t, reed_closed=False, door_mA=900))
    run_scenario(EGG, "egg", trig, 200, ctl=ctl)
    assert "pop_door_not_closed" in first(ctl, "fault").msg


# ------------------------------------------------------------------------- watchdog, rain, timeouts
def test_watchdog_cuts_power():
    ctl = RoutineController()
    trig = Trigger(ctl, tool_in_bed, lambda t, t0: base_inputs(t, heartbeat_ok=False))
    run_scenario(PLAN, "clean", trig, 200, ctl=ctl)
    f = first(ctl, "fault")
    assert "watchdog" in f.msg and f.t <= trig.t0 + C.WATCHDOG_S + 0.11
    assert ctl.state == "ESTOP" and not ctl.sim.power


def test_rain_finishes_cell_then_retreats():
    ctl = RoutineController()
    trig = Trigger(ctl, tool_in_bed, lambda t, t0: base_inputs(t, raining=True))
    run_scenario(PLAN, "clean", trig, 300, ctl=ctl)
    assert first(ctl, "fault").msg.startswith("raining")
    assert ctl.state == "STOPPED" and not ctl.sim.in_bed


def test_outside_window_never_starts():
    ctl = run_scenario(PLAN, "clean", lambda t: base_inputs(t, hour=18.5), 120)
    assert ctl.state == "PRECHECK" and not ctl.sim.motion_log


def test_step_timeout_on_jam(monkeypatch):
    ctl = RoutineController()
    real = ctl.sim.advance
    def jam(step, f0, dt, now, scale=1.0):
        return f0 if step.kind == "xy" and "cell" in step.name else real(step, f0, dt, now, scale)
    monkeypatch.setattr(ctl.sim, "advance", jam)
    run_scenario(PLAN, "clean", lambda t: base_inputs(t), 400, ctl=ctl)
    assert first(ctl, "fault").msg.startswith("step_timeout")
