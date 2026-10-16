"""Pi node HTTP contract + end-to-end audit against a local fake camera (no Pi needed)."""

import json
import os
import sys
import threading
import time
import types

import pytest

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import camera_node as cn  # noqa: E402
import camera_timing as ct  # noqa: E402
import timestamp_audit as ta  # noqa: E402


class FakeClock:
    def __init__(self, synced=True):
        self._st = ct.ClockStatus(synced=synced, source="chrony" if synced else "none", est_error_us=50, max_error_us=500)

    def status(self):
        return self._st, None


def test_default_device_id_is_stable_and_safe(monkeypatch):
    monkeypatch.setattr(cn.socket, "gethostname", lambda: "rover pi.local")
    assert cn.default_device_id() == "pi_cam_rover_pi_local"
    assert cn.default_device_id() == cn.default_device_id()


def test_realtime_minus_monotonic_is_consistent():
    off = cn.realtime_minus_monotonic_ns()
    assert abs((time.monotonic_ns() + off) - time.time_ns()) < 5_000_000


def test_framebuffer_seq_stamps_and_fallback(tmp_path):
    log = tmp_path / "frames.jsonl"
    fb = cn.FrameBuffer(FakeClock(), str(log))
    now = time.monotonic_ns()
    m1 = fb.push(b"a", now - 20_000_000)          # sensor stamp 20 ms ago
    assert m1["seq"] == 1 and fb.stamp_source == "sensor"
    assert abs(m1["capture_mono_us"] - (now - 20_000_000) // 1000) <= 1
    assert abs(m1["capture_epoch_us"] - time.time_ns() // 1000 + 20_000) < 5_000
    m2 = fb.push(b"b", 5)                          # implausible -> fallback
    assert m2["seq"] == 2 and fb.stamp_source == "encoder_out"
    fb.write(b"c")                                 # FileOutput path
    assert fb.seq == 3
    fb.close()
    lines = [json.loads(x) for x in log.read_text().splitlines()]
    assert [x["seq"] for x in lines] == [1, 2, 3]
    assert lines[0]["clock_synced"] and lines[0]["stamp_source"] == "sensor"


def test_wait_newer_times_out_instead_of_hanging():
    fb = cn.FrameBuffer(FakeClock())
    t0 = time.monotonic()
    assert fb.wait_newer(0, 0.2) is None
    assert time.monotonic() - t0 < 1.0


def test_timestamped_output_uses_encoder_first_timestamp():
    fb = cn.FrameBuffer(FakeClock())
    first_us = time.monotonic_ns() // 1000 - 100_000
    enc = types.SimpleNamespace(firsttimestamp=first_us)
    out = cn.TimestampedOutput(fb, enc)
    out.outputframe(b"jpeg", True, 50_000)          # 50 ms after first frame
    assert fb.meta["capture_mono_us"] == first_us + 50_000
    assert fb.stamp_source == "sensor"


def test_make_mqtt_client_supports_paho_v1_and_v2(monkeypatch):
    calls = []

    class V2Client:
        def __init__(self, *a, **k):
            calls.append((a, k))

    v2 = types.ModuleType("paho.mqtt.client")
    v2.CallbackAPIVersion = types.SimpleNamespace(VERSION2="v2")
    v2.Client = V2Client
    pkg, sub = types.ModuleType("paho"), types.ModuleType("paho.mqtt")
    pkg.mqtt, sub.client = sub, v2
    monkeypatch.setitem(sys.modules, "paho", pkg)
    monkeypatch.setitem(sys.modules, "paho.mqtt", sub)
    monkeypatch.setitem(sys.modules, "paho.mqtt.client", v2)
    cn.make_mqtt_client("x")
    assert calls[-1] == (("v2",), {"client_id": "x"})
    del v2.CallbackAPIVersion
    cn.make_mqtt_client("y")
    assert calls[-1] == ((), {"client_id": "y"})


@pytest.fixture
def fake_camera():
    """Pi node HTTP server fed by a 30 fps synthetic camera with 2 ms jitter."""
    fb = cn.FrameBuffer(FakeClock(synced=True))
    args = types.SimpleNamespace(width=640, height=480, fps=30, frame_log="")
    started = time.monotonic()
    srv = cn.make_server(0, fb, lambda: cn.build_status("pi_cam_test", fb, args, started, True), frame_timeout_s=2.0)
    threading.Thread(target=srv.serve_forever, daemon=True).start()
    stop = threading.Event()

    def produce():
        import random
        rng = random.Random(7)
        period = 1 / 30
        nxt = time.monotonic()
        i = 0
        while not stop.is_set():
            nxt += period
            time.sleep(max(0.0, nxt - time.monotonic()))
            i += 1
            if i % 50 == 0:
                continue      # deliberate drop: 2 %
            cap = time.monotonic_ns() - int(abs(rng.gauss(0, 0.002)) * 1e9) - 5_000_000
            fb.push(b"\xff\xd8" + os.urandom(2000) + b"\xff\xd9", cap)

    t = threading.Thread(target=produce, daemon=True)
    t.start()
    yield f"http://127.0.0.1:{srv.server_address[1]}"
    stop.set()
    srv.shutdown()
    fb.close()


def test_time_and_status_endpoints(fake_camera):
    d = json.loads(ta.OPENER.open(fake_camera + "/time", timeout=2).read())
    assert d["synced"] is True and abs(d["epochUs"] - time.time_ns() // 1000) < 1_000_000
    time.sleep(0.2)
    s = json.loads(ta.OPENER.open(fake_camera + "/status", timeout=2).read())
    assert s["deviceId"] == "pi_cam_test" and s["healthy"] is True
    assert s["clock"]["synced"] and s["camera"]["targetFps"] == 30 and s["camera"]["frameSeq"] > 0


def test_stream_parts_carry_timing_headers(fake_camera):
    with ta.OPENER.open(fake_camera + "/stream", timeout=3) as r:
        parts = []
        for h, _body in ct.iter_mjpeg_parts(r):
            parts.append(ct.parse_part_headers(h))
            if len(parts) == 5:
                break
    assert all(p["capture_mono_us"] and p["capture_epoch_us"] and p["clock_synced"] for p in parts)
    assert [p["stream_seq"] for p in parts] == [1, 2, 3, 4, 5]
    seqs = [p["seq"] for p in parts]
    assert seqs == sorted(seqs)


def test_candidate_endpoints():
    assert ta.candidate_endpoints("http://10.0.0.5/stream", "time") == ["http://10.0.0.5:81/time", "http://10.0.0.5/time"]
    assert ta.candidate_endpoints("http://pi.local:8000/stream", "status") == ["http://pi.local:8000/status"]


def test_end_to_end_audit_against_fake_camera(fake_camera, tmp_path):
    out, prof, side = tmp_path / "audit.json", tmp_path / "profile.json", tmp_path / "frames.jsonl"
    rc = ta.main([fake_camera + "/stream", "--duration", "3", "--probes", "5",
                  "--max-drop-rate", "0.05", "--max-latency-p95-ms", "200",
                  "--out", str(out), "--profile-out", str(prof), "--sidecar", str(side)])
    report = json.loads(out.read_text())
    cam = report["cameras"]["cam0"]
    assert cam["frames"] > 60
    assert cam["nominal_fps"] == 30
    assert cam["drops"]["missing"] >= 1                     # the deliberate drops are seen
    # Source-side drops never get a seq (seen only as capture-time gaps); a reader that
    # keeps up misses no seq numbers.
    assert cam["seq"]["missing"] == 0
    assert 0 < cam["latency_ms"]["p50"] < 100               # 5 ms+ synthetic pipeline delay
    assert report["clock_offsets"]["cam0"]["uncertainty_ms"] < 50
    assert rc == (0 if report["pass"] else 1)
    p = json.loads(prof.read_text())
    assert p["schema"] == ct.PROFILE_SCHEMA and p["samples"]["interval_ms"]
    rows = [json.loads(x) for x in side.read_text().splitlines()]
    assert rows and all("clock_offset_us" in r and r["capture_host_epoch_us"] for r in rows)


def test_audit_fails_on_tight_budget(fake_camera, tmp_path):
    rc = ta.main([fake_camera + "/stream", "--duration", "1.5", "--probes", "3", "--budget", "triggered",
                  "--out", str(tmp_path / "a.json")])
    assert rc == 1   # 2 % drops + ms jitter can never meet the triggered budget


def test_audit_reports_no_frames_as_error():
    assert ta.main(["http://127.0.0.1:9/stream", "--duration", "1", "--probes", "1"]) == 2
