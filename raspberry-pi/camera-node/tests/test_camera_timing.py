import io
import json
import math
import os
import random
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import camera_timing as ct  # noqa: E402


def frame(seq, cap_us, recv_epoch_us=None, synced=True, epoch_offset=1_700_000_000_000_000, cam="cam0"):
    return ct.FrameRecord(
        camera=cam, seq=seq, stream_seq=seq, capture_mono_us=cap_us,
        capture_epoch_us=cap_us + epoch_offset if synced else None, clock_synced=synced,
        clock_source="sntp" if synced else "none", host_recv_mono_ns=0,
        host_recv_epoch_us=recv_epoch_us if recv_epoch_us is not None else cap_us + epoch_offset, size=1000)


def test_headers_roundtrip():
    h = ct.build_part_headers(1234, 7, 3, 5_000_000, 1_700_000_005_000_000, True, "sntp")
    t = ct.parse_part_headers(h)
    assert t["seq"] == 7 and t["stream_seq"] == 3
    assert t["capture_mono_us"] == 5_000_000
    assert t["capture_epoch_us"] == 1_700_000_005_000_000
    assert t["clock_synced"] and t["clock_source"] == "sntp"
    assert t["content_length"] == 1234


def test_unsynced_headers_drop_epoch():
    h = ct.build_part_headers(10, 1, 1, 99, 12345, False, "sntp")
    assert "X-Capture-Epoch-Us" not in h and h["X-Clock-Source"] == "none"
    assert ct.parse_part_headers({"x-capture-epoch-us": "5", "X-Clock-Synced": "0"})["capture_epoch_us"] is None


def _esp_bytes(frames):
    out = b""
    for i, body in enumerate(frames, 1):
        out += b"\r\n--123456789000000000000987654321\r\n"
        out += (f"Content-Type: image/jpeg\r\nContent-Length: {len(body)}\r\n"
                f"X-Frame-Seq: {i}\r\nX-Capture-Mono-Us: {i * 66666}\r\nX-Clock-Synced: 0\r\n\r\n").encode()
        out += body
    return out


def _pi_bytes(frames):
    out = b""
    for i, body in enumerate(frames, 1):
        out += b"--FRAME\r\n"
        out += f"Content-Type: image/jpeg\r\nContent-Length: {len(body)}\r\nX-Frame-Seq: {i}\r\n\r\n".encode()
        out += body + b"\r\n"
    return out


def test_iter_mjpeg_both_framings():
    bodies = [b"\xff\xd8abc\r\n--fake\xff\xd9", b"\xff\xd8" + bytes(range(256)) + b"\xff\xd9"]
    for raw in (_esp_bytes(bodies), _pi_bytes(bodies)):
        parts = list(ct.iter_mjpeg_parts(io.BytesIO(raw)))
        assert [b for _, b in parts] == bodies
        assert ct.parse_part_headers(parts[1][0])["seq"] == 2


def test_iter_mjpeg_truncated_stream_stops_cleanly():
    raw = _esp_bytes([b"x" * 100])[:-10]
    assert list(ct.iter_mjpeg_parts(io.BytesIO(raw))) == []


def test_summarize_and_percentile():
    s = ct.summarize([1, 2, 3, 4, 5])
    assert s["n"] == 5 and s["mean"] == 3 and s["p50"] == 3 and s["max"] == 5
    assert math.isclose(s["std"], math.sqrt(2.5), rel_tol=1e-3)
    assert ct.summarize([]) == {"n": 0}
    assert ct.percentile([10.0], 99) == 10.0


def test_estimate_offset_uses_min_rtt():
    # True offset +500 us. Slow probe is asymmetric and would mislead.
    probes = [
        (1_000_000, 1_000_000 + 500 + 20_000, 1_030_000),  # rtt 30 ms, biased
        (2_000_000, 2_000_000 + 500 + 1_000, 2_002_000),   # rtt 2 ms, symmetric
    ]
    est = ct.estimate_offset(probes)
    assert est.rtt_us == 2000 and est.uncertainty_us == 1000
    assert abs(est.offset_us - 500) < 1
    assert ct.estimate_offset([]) is None


def test_drift_and_interpolation():
    a = ct.OffsetEstimate(offset_us=0, uncertainty_us=500, rtt_us=1000, samples=5, at_host_epoch_us=0)
    b = ct.OffsetEstimate(offset_us=1200, uncertainty_us=500, rtt_us=1000, samples=5, at_host_epoch_us=60_000_000)
    assert math.isclose(ct.drift_ppm(a, b), 20.0)
    assert math.isclose(ct.offset_at(a, b, 30_000_000), 600)
    assert ct.offset_at(a, None, 30_000_000) == 0


def test_detect_drops_and_seq_gaps():
    period = 66_667
    caps = [i * period for i in range(10)] + [12 * period, 13 * period]  # 2 frames missing
    d = ct.detect_drops(caps, period)
    assert d["missing"] == 2 and d["gap_events"] == 1
    assert math.isclose(d["drop_rate"], 2 / 14)
    g = ct.seq_gaps([1, 2, 3, 6, 7, 7])
    assert g["missing"] == 2 and g["non_monotonic"] == 1


def test_analyze_camera_jitter_drops_latency():
    rng = random.Random(1)
    period = 1_000_000 / 15
    frames = []
    for i in range(300):
        cap = int(i * period + rng.gauss(0, 2000))        # 2 ms capture jitter
        if i in (100, 101, 200):
            continue                                       # 3 drops
        frames.append(frame(i + 1, cap, recv_epoch_us=None))
    # pretend host receives 40 ms after capture and host clock == device mono + 1e6
    for f in frames:
        f.host_recv_epoch_us = f.capture_mono_us + 1_000_000 + 40_000
    start = ct.OffsetEstimate(offset_us=-1_000_000, uncertainty_us=1000, rtt_us=2000, samples=10, at_host_epoch_us=0)
    ct.apply_offsets(frames, start, None, "mono")
    a = ct.analyze_camera(frames, 15)
    assert a["frames"] == 297
    assert a["drops"]["missing"] == 3
    assert a["seq"]["missing"] == 3
    assert 1.5 < a["interval_jitter_ms"] < 4.5
    assert abs(a["latency_ms"]["p50"] - 40.0) < 0.01
    assert 14.0 < a["measured_fps"] < 15.5
    assert frames[0].clock_offset_us == -1_000_000


def test_analyze_infers_nominal_fps():
    frames = [frame(i, int(i * 33_333)) for i in range(60)]
    a = ct.analyze_camera(frames)
    assert abs(a["nominal_fps"] - 30) < 0.1
    assert a["drops"]["missing"] == 0
    assert "latency_ms" in a and "device epoch" in a["latency_method"]


def test_pair_skew():
    a = [frame(i, i * 33_333, cam="a") for i in range(30)]
    b = [frame(i, i * 33_333 + 700, cam="b") for i in range(30)]
    for f in a + b:
        f.capture_host_epoch_us = f.capture_mono_us
    s = ct.pair_skew_ms(a, b)
    assert s["n"] == 30 and abs(s["p50"] - 0.7) < 1e-6 and abs(s["abs_p95"] - 0.7) < 1e-6
    assert ct.pair_skew_ms([], b) == {"n": 0}


def test_evaluate_budget_pass_and_fail():
    cams = {"cam0": {"interval_jitter_ms": 3.0, "drops": {"drop_rate": 0.0}, "seq": {"non_monotonic": 0},
                     "latency_ms": {"p95": 80.0}, "clock_synced_fraction": 1.0}}
    offs = {"cam0": {"uncertainty_ms": 2.0}}
    checks = ct.evaluate_budget(cams, offs, {}, ct.BUDGETS["wifi"])
    assert checks and all(c["pass"] for c in checks)
    trig = ct.evaluate_budget(cams, offs, {"cam0-cam1": {"abs_p95": 4.0}}, ct.BUDGETS["triggered"])
    failed = {c["check"] for c in trig if not c["pass"]}
    assert {"cam0.interval_jitter_ms", "cam0.offset_uncertainty_ms", "cam0-cam1.skew_abs_p95_ms"} <= failed


def test_unsynced_camera_fails_wifi_budget():
    cams = {"cam0": {"interval_jitter_ms": 1.0, "drops": {"drop_rate": 0.0}, "seq": {}, "clock_synced_fraction": 0.0}}
    checks = ct.evaluate_budget(cams, {"cam0": {"uncertainty_ms": 1.0}}, {}, ct.BUDGETS["wifi"])
    assert any(c["check"] == "cam0.clock_synced" and not c["pass"] for c in checks)


def test_jitter_profile_export():
    frames = [frame(i, i * 66_667) for i in range(100)]
    for f in frames:
        f.capture_host_epoch_us = f.capture_mono_us
        f.host_recv_epoch_us = f.capture_mono_us + 50_000
    a = ct.analyze_camera(frames, 15)
    prof = ct.jitter_profile("cam0", a, frames, {"uncertainty_ms": 2.5}, {"url": "http://x/stream"}, max_samples=20)
    assert prof["schema"] == ct.PROFILE_SCHEMA
    assert len(prof["samples"]["interval_ms"]) == 20 and len(prof["samples"]["latency_ms"]) == 20
    assert prof["sim_hint"]["timestamp_noise_ms"] == 2.5 and prof["drop_probability"] == 0.0
    json.dumps(prof)


def test_frame_record_json_has_offset_field():
    f = frame(1, 10)
    f.clock_offset_us = -42
    d = json.loads(f.to_json())
    assert d["schema"] == ct.FRAME_SCHEMA and d["clock_offset_us"] == -42


def test_clock_status_from_timex():
    ok = ct.clock_status_from_timex(0, 0x0001, 1500, 200, 4000)
    assert ok.synced and ok.offset_us == 1500 and ok.est_error_us == 200
    nano = ct.clock_status_from_timex(0, ct.STA_NANO, 1500, 1, 1)
    assert nano.offset_us == 1.5
    bad = ct.clock_status_from_timex(ct.TIME_ERROR, ct.STA_UNSYNC, 0, 16_000_000, 16_000_000)
    assert not bad.synced and bad.source == "none"


def test_read_host_clock_status_never_raises():
    st = ct.read_host_clock_status()
    assert isinstance(st.synced, bool)


def test_parse_chronyc_tracking():
    text = """Reference ID    : C0A80132 (192.168.1.50)
Stratum         : 3
Ref time (UTC)  : Fri Oct 16 20:00:00 2026
System time     : 0.000012345 seconds slow of NTP time
Last offset     : +0.000003210 seconds
RMS offset      : 0.000045000 seconds
Frequency       : 12.345 ppm fast
Root delay      : 0.001200000 seconds
Root dispersion : 0.000300000 seconds
Leap status     : Normal
"""
    t = ct.parse_chronyc_tracking(text)
    assert t["synced"] and t["stratum"] == 3
    assert math.isclose(t["system_time_offset_us"], -12.345, rel_tol=1e-6)
    assert math.isclose(t["rms_offset_us"], 45.0, rel_tol=1e-6)
    assert not ct.parse_chronyc_tracking("Leap status     : Not synchronised\nStratum : 0")["synced"]
