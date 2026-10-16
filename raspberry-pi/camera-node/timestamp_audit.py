#!/usr/bin/env python3
"""
Tender Cells camera timestamp audit — run for ~60 s before every data-collection
session. Works against the ESP32 camera node and the Pi camera node (stdlib only,
runs on the Pi, a laptop, or the rover computer that will record).

What it measures, per camera:
  * capture-interval jitter and effective fps (device capture clock)
  * drops (capture-time gaps > 1.5x the nominal period) and seq gaps
  * host<->device clock offset at start and end (NTP-style /time probes, min-RTT
    filter) -> offset uncertainty and crystal drift (ppm)
  * end-to-end latency: host receive time - capture time (offset-corrected)
  * camera-to-camera capture skew when several URLs are given
and checks them against a budget ("wifi" default, or "triggered" for <1 ms work).

Outputs: a JSON report (--out), a sim jitter profile per camera (--profile-out,
schema tendercells.camera_jitter_profile/v1) and an optional per-frame sidecar
JSONL (--sidecar) carrying clock_offset_us as a first-class field.

Exit code: 0 pass, 1 budget fail, 2 could not measure.

  python3 timestamp_audit.py http://cam_ABCD.local/stream --duration 60 \\
      --out audit.json --profile-out jitter_profile.json --sidecar frames.jsonl
"""

from __future__ import annotations

import argparse
import json
import os
import sys
import threading
import time
import urllib.parse
import urllib.request
from typing import Optional

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
import camera_timing as ct  # noqa: E402

# Cameras live on the LAN: never route through an HTTP(S)_PROXY from the environment
# (a corporate/system proxy would turn every probe into a 404 or add latency).
OPENER = urllib.request.build_opener(urllib.request.ProxyHandler({}))


def candidate_endpoints(stream_url: str, name: str) -> list:
    """ESP32 serves /time on :81; the Pi serves it on the stream port."""
    u = urllib.parse.urlsplit(stream_url)
    host = u.hostname or ""
    if ":" in host:
        host = f"[{host}]"
    out = []
    if u.port in (None, 80):
        out.append(f"{u.scheme}://{host}:81/{name}")
    out.append(urllib.parse.urlunsplit((u.scheme, u.netloc, f"/{name}", "", "")))
    return out


def http_json(url: str, timeout: float = 2.0) -> dict:
    with OPENER.open(url, timeout=timeout) as r:  # noqa: S310 - LAN URL from operator
        return json.loads(r.read().decode())


def find_endpoint(stream_url: str, name: str) -> Optional[str]:
    for url in candidate_endpoints(stream_url, name):
        try:
            http_json(url, timeout=1.5)
            return url
        except Exception:  # noqa: BLE001
            continue
    return None


def probe_offsets(time_url: str, n: int, key: str) -> list:
    probes = []
    for _ in range(n):
        try:
            t0 = time.time_ns() // 1000
            d = http_json(time_url, timeout=1.0)
            t3 = time.time_ns() // 1000
            v = d.get(key)
            if key == "epochUs" and not d.get("synced"):
                v = None
            if v:
                probes.append((t0, int(v), t3))
        except Exception:  # noqa: BLE001
            pass
        time.sleep(0.05)
    return probes


class StreamReader(threading.Thread):
    def __init__(self, name: str, url: str, duration_s: float):
        super().__init__(daemon=True)
        self.name_ = name
        self.url = url
        self.duration_s = duration_s
        self.frames: list = []
        self.error: Optional[str] = None
        self.reconnects = 0

    def run(self):
        deadline = time.monotonic() + self.duration_s
        while time.monotonic() < deadline:
            try:
                with OPENER.open(self.url, timeout=5) as resp:  # noqa: S310
                    for headers, body in ct.iter_mjpeg_parts(resp):
                        mono = time.monotonic_ns()
                        epoch = time.time_ns() // 1000
                        t = ct.parse_part_headers(headers)
                        self.frames.append(ct.FrameRecord(
                            camera=self.name_, seq=t["seq"], stream_seq=t["stream_seq"],
                            capture_mono_us=t["capture_mono_us"], capture_epoch_us=t["capture_epoch_us"],
                            clock_synced=t["clock_synced"], clock_source=t["clock_source"],
                            host_recv_mono_ns=mono, host_recv_epoch_us=epoch, size=len(body),
                            trigger_seq=t["trigger_seq"], trigger_mono_us=t["trigger_mono_us"]))
                        if time.monotonic() >= deadline:
                            return
            except Exception as exc:  # noqa: BLE001
                self.error = f"{type(exc).__name__}: {exc}"
                self.reconnects += 1
                time.sleep(0.5)


def offset_dict(start: Optional[ct.OffsetEstimate], end: Optional[ct.OffsetEstimate], clock: str) -> dict:
    if start is None:
        return {}
    d = {
        "against": clock,
        "offset_ms": round(start.offset_us / 1000.0, 4),
        "uncertainty_ms": round(max(start.uncertainty_us, end.uncertainty_us if end else 0) / 1000.0, 4),
        "best_rtt_ms": round(start.rtt_us / 1000.0, 4),
        "probes": start.samples + (end.samples if end else 0),
    }
    if end is not None:
        d["offset_end_ms"] = round(end.offset_us / 1000.0, 4)
        dp = ct.drift_ppm(start, end)
        d["drift_ppm"] = round(dp, 3) if dp is not None else None
    return d


def run_audit(urls: list, duration_s: float, probes: int, budget: dict,
              nominal_fps: Optional[float] = None) -> dict:
    names = [f"cam{i}" for i in range(len(urls))]
    meta: dict = {}
    for name, url in zip(names, urls):
        time_url = find_endpoint(url, "time")
        status_url = find_endpoint(url, "status")
        status = {}
        if status_url:
            try:
                status = http_json(status_url)
            except Exception:  # noqa: BLE001
                status = {}
        meta[name] = {"url": url, "time_url": time_url, "status_url": status_url,
                      "device_id": status.get("deviceId"), "status_start": status}
        # Offsets against the device MONOTONIC clock map capture stamps into host time
        # even when the device is not SNTP-synced; epoch probes validate its sync.
        if time_url:
            meta[name]["mono_start"] = ct.estimate_offset(probe_offsets(time_url, probes, "monoUs"))
            meta[name]["epoch_start"] = ct.estimate_offset(probe_offsets(time_url, probes, "epochUs"))

    readers = [StreamReader(n, u, duration_s) for n, u in zip(names, urls)]
    for r in readers:
        r.start()
    for r in readers:
        r.join(duration_s + 15)

    cameras, offsets, frames_by_cam = {}, {}, {}
    for name, r in zip(names, readers):
        m = meta[name]
        if m.get("time_url"):
            m["mono_end"] = ct.estimate_offset(probe_offsets(m["time_url"], probes, "monoUs"))
            m["epoch_end"] = ct.estimate_offset(probe_offsets(m["time_url"], probes, "epochUs"))
        ms, me = m.get("mono_start"), m.get("mono_end")
        if ms is not None:
            ct.apply_offsets(r.frames, ms, me, "mono")
        nominal = nominal_fps or (m["status_start"].get("camera", {}) or {}).get("targetFps")
        a = ct.analyze_camera(r.frames, nominal)
        a["reconnects"] = r.reconnects
        if r.error:
            a["last_error"] = r.error
        a["device_id"] = m.get("device_id")
        cameras[name] = a
        frames_by_cam[name] = r.frames
        od = offset_dict(ms, me, "device_monotonic")
        ep = offset_dict(m.get("epoch_start"), m.get("epoch_end"), "device_epoch")
        if ep:
            od["device_epoch_vs_host_ms"] = ep["offset_ms"]   # SNTP/NTP error of the device
            od["device_epoch_uncertainty_ms"] = ep["uncertainty_ms"]
        offsets[name] = od

    skews = {}
    for i in range(len(names)):
        for j in range(i + 1, len(names)):
            skews[f"{names[i]}-{names[j]}"] = ct.pair_skew_ms(frames_by_cam[names[i]], frames_by_cam[names[j]])

    checks = evaluate(cameras, offsets, skews, budget)
    host = ct.read_host_clock_status()
    return {
        "schema": "tendercells.camera_timestamp_audit/v1",
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "duration_s": duration_s,
        "host_clock": {"synced": host.synced, "source": host.source,
                       "est_error_us": host.est_error_us, "max_error_us": host.max_error_us,
                       "chrony": ct.chrony_tracking()},
        "budget": budget,
        "endpoints": {n: {k: v for k, v in m.items() if k in ("url", "time_url", "status_url", "device_id")}
                      for n, m in meta.items()},
        "cameras": cameras,
        "clock_offsets": offsets,
        "skew_ms": skews,
        "checks": checks,
        "pass": bool(checks) and all(c["pass"] for c in checks),
        "notes": [
            "Latency is host receive-complete time minus capture time; it includes JPEG transfer.",
            "Without a hardware trigger, camera-to-camera skew is free-running phase, not sync error.",
            "Wi-Fi SNTP and /time probes cannot certify <1 ms; use a wired, hardware-triggered setup for that.",
        ],
        "_frames": frames_by_cam,
    }


def evaluate(cameras, offsets, skews, budget):
    checks = ct.evaluate_budget(cameras, offsets, skews, budget)
    for name, a in cameras.items():
        if a.get("frames", 0) < 2:
            checks.append({"check": f"{name}.frames_received", "value": a.get("frames", 0), "limit": 2, "pass": False})
    return checks


def main(argv=None) -> int:
    p = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    p.add_argument("urls", nargs="+", help="MJPEG stream URL(s), e.g. http://cam_ABCD.local/stream")
    p.add_argument("--duration", type=float, default=60.0)
    p.add_argument("--probes", type=int, default=20, help="/time probes at start and at end")
    p.add_argument("--budget", choices=sorted(ct.BUDGETS), default="wifi")
    p.add_argument("--nominal-fps", type=float, default=None)
    p.add_argument("--max-jitter-ms", type=float)
    p.add_argument("--max-drop-rate", type=float)
    p.add_argument("--max-offset-uncertainty-ms", type=float)
    p.add_argument("--max-latency-p95-ms", type=float)
    p.add_argument("--max-skew-p95-ms", type=float)
    p.add_argument("--allow-unsynced", action="store_true", help="do not require device clock sync")
    p.add_argument("--out", help="write the JSON report here")
    p.add_argument("--profile-out", help="write the sim jitter profile(s) here (JSON)")
    p.add_argument("--sidecar", help="write per-frame JSONL (with clock_offset_us) here")
    a = p.parse_args(argv)

    budget = dict(ct.BUDGETS[a.budget])
    for flag, key in (("max_jitter_ms", "max_interval_jitter_ms"), ("max_drop_rate", "max_drop_rate"),
                      ("max_offset_uncertainty_ms", "max_offset_uncertainty_ms"),
                      ("max_latency_p95_ms", "max_latency_p95_ms"), ("max_skew_p95_ms", "max_skew_p95_ms")):
        v = getattr(a, flag)
        if v is not None:
            budget[key] = v
    if a.allow_unsynced:
        budget["require_clock_synced"] = False

    report = run_audit(a.urls, a.duration, a.probes, budget, a.nominal_fps)
    frames = report.pop("_frames")
    if all(len(f) == 0 for f in frames.values()):
        print(json.dumps({k: report[k] for k in ("endpoints", "cameras")}, indent=2))
        print("AUDIT ERROR: no frames received", file=sys.stderr)
        return 2

    if a.out:
        with open(a.out, "w") as fh:
            json.dump(report, fh, indent=2)
    if a.profile_out:
        profiles = [ct.jitter_profile(name, report["cameras"][name], frames[name],
                                      report["clock_offsets"].get(name), report["endpoints"][name])
                    for name in frames]
        with open(a.profile_out, "w") as fh:
            json.dump(profiles[0] if len(profiles) == 1 else {"profiles": profiles}, fh, indent=2)
    if a.sidecar:
        with open(a.sidecar, "w") as fh:
            for name in frames:
                for f in frames[name]:
                    fh.write(f.to_json() + "\n")

    for c in report["checks"]:
        print(f"{'PASS' if c['pass'] else 'FAIL'}  {c['check']:<36} value={c['value']} limit={c['limit']}")
    print("AUDIT", "PASS" if report["pass"] else "FAIL")
    return 0 if report["pass"] else 1


if __name__ == "__main__":
    sys.exit(main())
