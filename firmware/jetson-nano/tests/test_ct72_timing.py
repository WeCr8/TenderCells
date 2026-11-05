import json

import pytest

from ct72 import timestamp_audit
from ct72.jitter_augment import JitterInjector
from ct72.so101_limits import EGG_BREAK_N, GRIP_FORCE_LIMIT_N, TORQUE_PCT, bus_budget, grip_force_from_torque_pct
from ct72.timing import DeviceClockSync, SessionGate, evaluate_audit, jitter_profile


def test_audit_pass_and_fail(tmp_path):
    assert timestamp_audit.main(["--simulate", "--seconds", "10", "--out", str(tmp_path / "a.json"), "--profile", str(tmp_path / "p.json")]) == 0
    assert timestamp_audit.main(["--simulate", "--seconds", "10", "--sim-skew-us", "900", "--out", str(tmp_path / "b.json"), "--profile", str(tmp_path / "q.json")]) == 1
    res = json.load(open(tmp_path / "b.json"))
    assert not res["ok"] and any("skew" in r for r in res["reasons"])


def test_missing_camera_frames_fail():
    sets = [{"cam0": i * 33_333_333} for i in range(300)]
    r = evaluate_audit(sets, [0] * 300, [1_000_000] * 300, ["cam0", "cam1"], 10.0)
    assert not r.ok


def test_session_gate_refuses_without_fresh_passing_audit():
    g = SessionGate(max_age_s=60)
    with pytest.raises(PermissionError):
        g.check(t=0)
    sets, offs, ju, _ = timestamp_audit.simulate(["c0", "c1"], 5)
    ok = evaluate_audit(sets, offs, ju, ["c0", "c1"], 5)
    g.record_audit(ok, t=100)
    g.check(t=120)
    with pytest.raises(PermissionError):
        g.check(t=1000)


def test_device_clock_sync_recovers_offset_and_drift():
    s = DeviceClockSync()
    for k in range(40):
        dev = 1_000_000 + k * 50_000
        host = 5_000_000_000 + int(dev * 1000 * 1.00002)
        s.add_exchange(host - 40_000, dev, host + 40_000)
    assert abs(s.to_host_ns(3_000_000) - (5_000_000_000 + int(3_000_000 * 1000 * 1.00002))) < 1000


def test_jitter_injector_lags_frames():
    prof = jitter_profile({"camera_latency": [40_000.0] * 10, "joint_read": [16_666.0] * 10})
    j = JitterInjector(prof, seed=0)
    assert j.frame_index(10) == 9
    st = j.lag_state([[0.0], [1.0], [2.0]], 2)
    assert 1.4 < st[0] < 1.6


def test_grip_force_cap_and_bus_budget():
    assert grip_force_from_torque_pct(TORQUE_PCT["gripper"]) <= GRIP_FORCE_LIMIT_N + 0.05
    assert GRIP_FORCE_LIMIT_N * 5 <= EGG_BREAK_N + 1
    assert bus_budget().ok
