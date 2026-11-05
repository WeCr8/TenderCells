"""
Tender Cells camera timing helpers (stdlib only).

Shared by the Pi camera node, the 60 s timestamp audit and dataset recorders.
Everything here is pure / IO-light so it can be unit tested without a camera.

Timing contract carried in each MJPEG multipart part (ESP32 and Pi nodes):
  X-Frame-Seq         frame counter at the source (Pi: every sensor frame, so a
                      gap is a real drop; ESP32: global across clients)
  X-Stream-Seq        per-connection counter
  X-Capture-Mono-Us   device monotonic clock (µs) at capture
  X-Capture-Epoch-Us  device Unix epoch (µs) at capture, only when clock-synced
  X-Clock-Synced      1 / 0
  X-Clock-Source      sntp | ntp | chrony | ptp | none
  X-Trigger-Seq / X-Trigger-Mono-Us  last shared trigger edge (optional)
"""

from __future__ import annotations

import json
import math
import time
from dataclasses import asdict, dataclass, field
from typing import BinaryIO, Iterable, Iterator, Optional, Sequence

PROFILE_SCHEMA = "tendercells.camera_jitter_profile/v1"
FRAME_SCHEMA = "tendercells.camera_frame/v1"

# Pass/fail budgets. "wifi" is what a XIAO/Pi over Wi-Fi can honestly meet;
# "triggered" is the sim-to-real target for multi-sensor alignment (<1 ms) and
# needs a hardware trigger + wired PTP/chrony, not Wi-Fi SNTP.
BUDGETS = {
    "wifi": {
        "max_interval_jitter_ms": 8.0,
        "max_drop_rate": 0.02,
        "max_offset_uncertainty_ms": 5.0,
        "max_latency_p95_ms": 150.0,
        "max_skew_p95_ms": None,
        "require_clock_synced": True,
    },
    "triggered": {
        "max_interval_jitter_ms": 1.0,
        "max_drop_rate": 0.001,
        "max_offset_uncertainty_ms": 1.0,
        "max_latency_p95_ms": 100.0,
        "max_skew_p95_ms": 1.0,
        "require_clock_synced": True,
    },
}


@dataclass
class FrameRecord:
    camera: str
    seq: Optional[int]
    stream_seq: Optional[int]
    capture_mono_us: Optional[int]
    capture_epoch_us: Optional[int]
    clock_synced: bool
    clock_source: str
    host_recv_mono_ns: int
    host_recv_epoch_us: int
    size: int
    trigger_seq: Optional[int] = None
    trigger_mono_us: Optional[int] = None
    # Filled by the audit/recorder once a host<->device offset is known.
    capture_host_epoch_us: Optional[int] = None
    clock_offset_us: Optional[int] = None

    def to_json(self) -> str:
        d = asdict(self)
        d["schema"] = FRAME_SCHEMA
        return json.dumps(d, separators=(",", ":"))


# ── Header building / parsing ───────────────────────────────────────────────

def build_part_headers(
    size: int,
    seq: int,
    stream_seq: int,
    capture_mono_us: int,
    capture_epoch_us: Optional[int],
    clock_synced: bool,
    clock_source: str,
    content_type: str = "image/jpeg",
) -> dict:
    """Ordered header dict for one MJPEG part (same contract as the ESP32)."""
    h = {
        "Content-Type": content_type,
        "Content-Length": str(size),
        "X-Frame-Seq": str(seq),
        "X-Stream-Seq": str(stream_seq),
        "X-Capture-Mono-Us": str(capture_mono_us),
        "X-Clock-Synced": "1" if clock_synced else "0",
        "X-Clock-Source": clock_source if clock_synced else "none",
    }
    if clock_synced and capture_epoch_us is not None:
        h["X-Capture-Epoch-Us"] = str(capture_epoch_us)
    return h


def _int_or_none(v: Optional[str]) -> Optional[int]:
    if v is None or v == "":
        return None
    try:
        return int(v)
    except ValueError:
        return None


def parse_part_headers(raw: dict) -> dict:
    """Case-insensitive header dict -> typed timing fields."""
    h = {k.lower(): v.strip() for k, v in raw.items()}
    synced = h.get("x-clock-synced", "0") in ("1", "true", "yes")
    return {
        "seq": _int_or_none(h.get("x-frame-seq")),
        "stream_seq": _int_or_none(h.get("x-stream-seq")),
        "capture_mono_us": _int_or_none(h.get("x-capture-mono-us")),
        "capture_epoch_us": _int_or_none(h.get("x-capture-epoch-us")) if synced else None,
        "clock_synced": synced,
        "clock_source": h.get("x-clock-source", "none"),
        "trigger_seq": _int_or_none(h.get("x-trigger-seq")),
        "trigger_mono_us": _int_or_none(h.get("x-trigger-mono-us")),
        "content_length": _int_or_none(h.get("content-length")),
    }


def iter_mjpeg_parts(stream: BinaryIO, max_part_bytes: int = 8 * 1024 * 1024) -> Iterator[tuple[dict, bytes]]:
    """Yield (headers, body) from a multipart/x-mixed-replace byte stream.

    Works with both nodes' framing (ESP32 '\\r\\n--B\\r\\n', Pi '--FRAME\\r\\n').
    Requires Content-Length (both nodes send it).
    """
    while True:
        line = stream.readline()
        if not line:
            return
        if not line.startswith(b"--"):
            continue  # blank separator lines / trailing CRLF after a body
        headers: dict = {}
        while True:
            hl = stream.readline()
            if not hl:
                return
            hl = hl.rstrip(b"\r\n")
            if not hl:
                break
            if b":" in hl:
                k, v = hl.split(b":", 1)
                headers[k.decode("latin-1").strip()] = v.decode("latin-1").strip()
        length = _int_or_none(next((v for k, v in headers.items() if k.lower() == "content-length"), None))
        if length is None or length < 0 or length > max_part_bytes:
            raise ValueError(f"multipart part without usable Content-Length: {headers!r}")
        body = stream.read(length)
        if len(body) < length:
            return
        yield headers, body


# ── Statistics ──────────────────────────────────────────────────────────────

def percentile(sorted_vals: Sequence[float], p: float) -> float:
    if not sorted_vals:
        return math.nan
    if len(sorted_vals) == 1:
        return float(sorted_vals[0])
    k = (len(sorted_vals) - 1) * p / 100.0
    lo, hi = math.floor(k), math.ceil(k)
    if lo == hi:
        return float(sorted_vals[lo])
    return float(sorted_vals[lo] + (sorted_vals[hi] - sorted_vals[lo]) * (k - lo))


def summarize(values: Iterable[float]) -> dict:
    vals = sorted(float(v) for v in values)
    n = len(vals)
    if n == 0:
        return {"n": 0}
    mean = sum(vals) / n
    var = sum((v - mean) ** 2 for v in vals) / (n - 1) if n > 1 else 0.0
    return {
        "n": n,
        "mean": round(mean, 4),
        "std": round(math.sqrt(var), 4),
        "min": round(vals[0], 4),
        "p50": round(percentile(vals, 50), 4),
        "p95": round(percentile(vals, 95), 4),
        "p99": round(percentile(vals, 99), 4),
        "max": round(vals[-1], 4),
    }


# ── Clock offset (NTP-style, min-RTT filter) ────────────────────────────────

@dataclass
class OffsetEstimate:
    offset_us: float          # device_clock - host_epoch at the same instant
    uncertainty_us: float     # half of the best round trip (bound, not a std)
    rtt_us: float
    samples: int
    at_host_epoch_us: float


def estimate_offset(probes: Sequence[tuple[int, int, int]]) -> Optional[OffsetEstimate]:
    """probes: (host_send_epoch_us, device_clock_us, host_recv_epoch_us).

    Uses the sample with the smallest round trip; the true offset lies within
    ±rtt/2 of the estimate (assuming the device stamped between send and recv).
    """
    good = [p for p in probes if p[2] >= p[0] and p[1] is not None]
    if not good:
        return None
    t0, dev, t3 = min(good, key=lambda p: p[2] - p[0])
    rtt = t3 - t0
    mid = (t0 + t3) / 2.0
    return OffsetEstimate(offset_us=dev - mid, uncertainty_us=rtt / 2.0, rtt_us=float(rtt),
                          samples=len(good), at_host_epoch_us=mid)


def drift_ppm(start: OffsetEstimate, end: OffsetEstimate) -> Optional[float]:
    dt = end.at_host_epoch_us - start.at_host_epoch_us
    if dt <= 0:
        return None
    return (end.offset_us - start.offset_us) / dt * 1e6


def offset_at(start: OffsetEstimate, end: Optional[OffsetEstimate], host_epoch_us: float) -> float:
    """Linearly interpolate the device-host offset (handles crystal drift)."""
    if end is None or end.at_host_epoch_us <= start.at_host_epoch_us:
        return start.offset_us
    f = (host_epoch_us - start.at_host_epoch_us) / (end.at_host_epoch_us - start.at_host_epoch_us)
    return start.offset_us + f * (end.offset_us - start.offset_us)


# ── Per-camera analysis ─────────────────────────────────────────────────────

def detect_drops(capture_us: Sequence[int], nominal_period_us: float, tolerance: float = 1.5) -> dict:
    """Count frames missing from gaps in capture timestamps (> tolerance × period)."""
    missing = 0
    gaps = 0
    for a, b in zip(capture_us, capture_us[1:]):
        d = b - a
        if d > tolerance * nominal_period_us:
            gaps += 1
            missing += max(0, round(d / nominal_period_us) - 1)
    received = len(capture_us)
    total = received + missing
    return {"received": received, "missing": missing, "gap_events": gaps,
            "drop_rate": (missing / total) if total else 0.0}


def seq_gaps(seqs: Sequence[Optional[int]]) -> dict:
    s = [x for x in seqs if x is not None]
    missing = sum(max(0, b - a - 1) for a, b in zip(s, s[1:]))
    non_monotonic = sum(1 for a, b in zip(s, s[1:]) if b <= a)
    return {"missing": missing, "non_monotonic": non_monotonic}


def apply_offsets(frames: list, start: Optional[OffsetEstimate], end: Optional[OffsetEstimate],
                  clock: str) -> None:
    """Fill capture_host_epoch_us / clock_offset_us on each frame in place.

    clock='mono': offsets were measured against X-Capture-Mono-Us (/time monoUs);
    clock='epoch': against the device's synced epoch.
    """
    if start is None:
        return
    for f in frames:
        dev = f.capture_mono_us if clock == "mono" else f.capture_epoch_us
        if dev is None:
            continue
        off = offset_at(start, end, f.host_recv_epoch_us)
        f.clock_offset_us = int(round(off))
        f.capture_host_epoch_us = int(round(dev - off))


def analyze_camera(frames: Sequence[FrameRecord], nominal_fps: Optional[float] = None) -> dict:
    cap = [f.capture_mono_us for f in frames if f.capture_mono_us is not None]
    intervals_us = [b - a for a, b in zip(cap, cap[1:])]
    if not nominal_fps:
        med = percentile(sorted(intervals_us), 50) if intervals_us else math.nan
        nominal_fps = 1e6 / med if med and med > 0 and not math.isnan(med) else None
    period_us = 1e6 / nominal_fps if nominal_fps else None
    duration_s = (cap[-1] - cap[0]) / 1e6 if len(cap) > 1 else 0.0
    out: dict = {
        "frames": len(frames),
        "frames_with_capture_stamp": len(cap),
        "duration_s": round(duration_s, 3),
        "nominal_fps": round(nominal_fps, 3) if nominal_fps else None,
        "measured_fps": round((len(cap) - 1) / duration_s, 3) if duration_s > 0 else None,
        "interval_ms": summarize(v / 1000.0 for v in intervals_us),
        "clock_synced_fraction": round(sum(1 for f in frames if f.clock_synced) / len(frames), 4) if frames else 0.0,
        "seq": seq_gaps([f.seq for f in frames]),
        "stream_seq": seq_gaps([f.stream_seq for f in frames]),
    }
    if period_us:
        out["drops"] = detect_drops(cap, period_us)
        # Jitter around the nominal grid: std of interval error, excluding drop gaps.
        clean = [v for v in intervals_us if v <= 1.5 * period_us]
        out["interval_jitter_ms"] = summarize(v / 1000.0 for v in clean).get("std", math.nan) if clean else None
    lat = [(f.host_recv_epoch_us - f.capture_host_epoch_us) / 1000.0
           for f in frames if f.capture_host_epoch_us is not None]
    if lat:
        out["latency_ms"] = summarize(lat)
        out["latency_method"] = "host_recv - capture (offset-corrected via /time probes)"
    else:
        lat2 = [(f.host_recv_epoch_us - f.capture_epoch_us) / 1000.0
                for f in frames if f.capture_epoch_us is not None]
        if lat2:
            out["latency_ms"] = summarize(lat2)
            out["latency_method"] = "host_recv - device epoch (assumes both clocks synced; includes sync error)"
    return out


def pair_skew_ms(a: Sequence[FrameRecord], b: Sequence[FrameRecord], max_pair_ms: float = 50.0) -> dict:
    """Capture-time skew between two cameras (host-clock capture stamps).

    Without a hardware trigger this measures free-running phase, not sync error.
    """
    ta = sorted(f.capture_host_epoch_us for f in a if f.capture_host_epoch_us is not None)
    tb = sorted(f.capture_host_epoch_us for f in b if f.capture_host_epoch_us is not None)
    if not ta or not tb:
        return {"n": 0}
    out = []
    j = 0
    for t in ta:
        while j + 1 < len(tb) and abs(tb[j + 1] - t) <= abs(tb[j] - t):
            j += 1
        d = (tb[j] - t) / 1000.0
        if abs(d) <= max_pair_ms:
            out.append(d)
    s = summarize(out)
    s["abs_p95"] = round(percentile(sorted(abs(x) for x in out), 95), 4) if out else None
    return s


# ── Budget + sim export ─────────────────────────────────────────────────────

def evaluate_budget(cameras: dict, offsets: dict, skews: dict, budget: dict) -> list:
    checks = []

    def check(name, value, limit, ok):
        checks.append({"check": name, "value": value, "limit": limit, "pass": bool(ok)})

    for cam, r in cameras.items():
        jit = r.get("interval_jitter_ms")
        if budget.get("max_interval_jitter_ms") is not None:
            lim = budget["max_interval_jitter_ms"]
            check(f"{cam}.interval_jitter_ms", jit, lim, jit is not None and jit <= lim)
        if budget.get("max_drop_rate") is not None:
            dr = r.get("drops", {}).get("drop_rate")
            check(f"{cam}.drop_rate", dr, budget["max_drop_rate"], dr is not None and dr <= budget["max_drop_rate"])
            if r.get("seq", {}).get("non_monotonic"):
                check(f"{cam}.seq_monotonic", r["seq"]["non_monotonic"], 0, False)
        if budget.get("max_latency_p95_ms") is not None and "latency_ms" in r:
            p95 = r["latency_ms"].get("p95")
            lim = budget["max_latency_p95_ms"]
            check(f"{cam}.latency_p95_ms", p95, lim, p95 is not None and p95 <= lim)
        if budget.get("require_clock_synced"):
            frac = r.get("clock_synced_fraction", 0.0)
            check(f"{cam}.clock_synced", frac, 1.0, frac >= 1.0)
        o = offsets.get(cam) or {}
        if budget.get("max_offset_uncertainty_ms") is not None:
            unc = o.get("uncertainty_ms")
            check(f"{cam}.offset_uncertainty_ms", unc, budget["max_offset_uncertainty_ms"],
                  unc is not None and unc <= budget["max_offset_uncertainty_ms"])
    if budget.get("max_skew_p95_ms") is not None:
        for pair, s in skews.items():
            v = s.get("abs_p95")
            check(f"{pair}.skew_abs_p95_ms", v, budget["max_skew_p95_ms"], v is not None and v <= budget["max_skew_p95_ms"])
    return checks


def _downsample(vals: Sequence[float], cap: int) -> list:
    if len(vals) <= cap:
        return [round(v, 3) for v in vals]
    step = len(vals) / cap
    return [round(vals[int(i * step)], 3) for i in range(cap)]


def jitter_profile(camera: str, analysis: dict, frames: Sequence[FrameRecord], offset: Optional[dict],
                   source: dict, max_samples: int = 2000) -> dict:
    """Export a measured timing profile a simulator can replay.

    Sim usage: sample an observation delay from latency_ms (empirical samples or
    the summary), space frames by interval_ms, drop with probability
    drop_probability, and add clock.offset_uncertainty_ms as timestamp noise.
    """
    cap = [f.capture_mono_us for f in frames if f.capture_mono_us is not None]
    intervals = [(b - a) / 1000.0 for a, b in zip(cap, cap[1:])]
    lat = [(f.host_recv_epoch_us - f.capture_host_epoch_us) / 1000.0
           for f in frames if f.capture_host_epoch_us is not None]
    return {
        "schema": PROFILE_SCHEMA,
        "camera": camera,
        "generated_at": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
        "source": source,
        "nominal_fps": analysis.get("nominal_fps"),
        "measured_fps": analysis.get("measured_fps"),
        "interval_ms": analysis.get("interval_ms"),
        "interval_jitter_ms": analysis.get("interval_jitter_ms"),
        "latency_ms": analysis.get("latency_ms"),
        "latency_method": analysis.get("latency_method"),
        "drop_probability": analysis.get("drops", {}).get("drop_rate"),
        "clock": offset or {},
        "samples": {
            "interval_ms": _downsample(intervals, max_samples),
            "latency_ms": _downsample(lat, max_samples),
        },
        "sim_hint": {
            "delay_model": "empirical" if lat else "none",
            "frame_period_model": "empirical",
            "drop_model": "bernoulli",
            "timestamp_noise_ms": (offset or {}).get("uncertainty_ms"),
        },
    }


@dataclass
class ClockStatus:
    """Host clock discipline as seen by the kernel (Linux adjtimex)."""
    synced: bool
    source: str
    est_error_us: Optional[int] = None
    max_error_us: Optional[int] = None
    offset_us: Optional[float] = None
    detail: dict = field(default_factory=dict)


# ── Host clock discipline (Linux) ───────────────────────────────────────────

STA_UNSYNC = 0x0040
STA_NANO = 0x2000
TIME_ERROR = 5


def _timex_struct():
    import ctypes

    class Timeval(ctypes.Structure):
        _fields_ = [("tv_sec", ctypes.c_long), ("tv_usec", ctypes.c_long)]

    class Timex(ctypes.Structure):
        _fields_ = [
            ("modes", ctypes.c_uint), ("offset", ctypes.c_long), ("freq", ctypes.c_long),
            ("maxerror", ctypes.c_long), ("esterror", ctypes.c_long), ("status", ctypes.c_int),
            ("constant", ctypes.c_long), ("precision", ctypes.c_long), ("tolerance", ctypes.c_long),
            ("time", Timeval), ("tick", ctypes.c_long), ("ppsfreq", ctypes.c_long),
            ("jitter", ctypes.c_long), ("shift", ctypes.c_int), ("stabil", ctypes.c_long),
            ("jitcnt", ctypes.c_long), ("calcnt", ctypes.c_long), ("errcnt", ctypes.c_long),
            ("stbcnt", ctypes.c_long), ("tai", ctypes.c_int), ("_pad", ctypes.c_int * 11),
        ]
    return Timex


def clock_status_from_timex(ret: int, status: int, offset: int, esterror: int, maxerror: int,
                            source: str = "kernel") -> ClockStatus:
    synced = ret != TIME_ERROR and not (status & STA_UNSYNC)
    off_us = offset / 1000.0 if status & STA_NANO else float(offset)
    return ClockStatus(synced=synced, source=source if synced else "none",
                       est_error_us=int(esterror), max_error_us=int(maxerror), offset_us=off_us,
                       detail={"adjtimex_state": ret, "status_bits": status})


def read_host_clock_status() -> ClockStatus:
    """Read-only adjtimex(2) (modes=0). Never changes the clock."""
    try:
        import ctypes
        import ctypes.util

        libc = ctypes.CDLL(ctypes.util.find_library("c") or "libc.so.6", use_errno=True)
        Timex = _timex_struct()
        tx = Timex()
        tx.modes = 0
        ret = libc.adjtimex(ctypes.byref(tx))
        if ret < 0:
            return ClockStatus(synced=False, source="unknown", detail={"error": ctypes.get_errno()})
        return clock_status_from_timex(ret, tx.status, tx.offset, tx.esterror, tx.maxerror)
    except Exception as exc:  # noqa: BLE001 - non-Linux hosts
        return ClockStatus(synced=False, source="unknown", detail={"error": str(exc)})


def parse_chronyc_tracking(text: str) -> dict:
    """Parse `chronyc tracking` output into numbers (seconds -> µs)."""
    out: dict = {}
    for line in text.splitlines():
        if ":" not in line:
            continue
        key, val = (s.strip() for s in line.split(":", 1))
        k = key.lower().replace(" ", "_")
        if k == "reference_id":
            out["reference"] = val
        elif k == "stratum":
            out["stratum"] = _int_or_none(val)
        elif k == "system_time":
            parts = val.split()
            try:
                secs = float(parts[0])
                out["system_time_offset_us"] = secs * 1e6 * (-1 if "slow" in val else 1)
            except (ValueError, IndexError):
                pass
        elif k in ("last_offset", "rms_offset", "root_delay", "root_dispersion"):
            try:
                out[f"{k}_us"] = float(val.split()[0]) * 1e6
            except (ValueError, IndexError):
                pass
        elif k == "leap_status":
            out["leap_status"] = val
    out["synced"] = out.get("leap_status", "").lower() == "normal" and out.get("stratum", 0) not in (0, None)
    return out


def chrony_tracking() -> Optional[dict]:
    import shutil
    import subprocess

    if not shutil.which("chronyc"):
        return None
    try:
        r = subprocess.run(["chronyc", "tracking"], capture_output=True, text=True, timeout=2, check=False)
    except Exception:  # noqa: BLE001
        return None
    return parse_chronyc_tracking(r.stdout) if r.returncode == 0 else None
