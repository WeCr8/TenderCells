"""Shared-clock timestamping, the pre-session timestamp audit and the jitter profile (CT72 rev A1.2).

Project rules (TenderCells "Sensor timing / sim-to-real requirements"):
  * stamp every camera frame, gantry position and SO-101 joint reading at CAPTURE time from ONE clock
    and log the clock offset per sample in the dataset itself;
  * cell cameras share one hardware trigger line (target skew < 1 ms);
  * a ~60 s timestamp audit runs before each collection session and REFUSES the session over budget;
  * the measured latency/jitter is fed back into sim/training (see jitter_augment.py);
  * cameras run at a modest 30 fps in step with control.

The cell clock is CLOCK_REALTIME disciplined by PTP (ptp4l + phc2sys, Pi 5 / Jetson Ethernet PHC as grandmaster)
or chrony on the wired LAN. Every stamp is CLOCK_MONOTONIC (ns) on the host plus the host's measured offset
to the cell clock at that moment, so a sample can always be put back on the shared timeline.

Device clocks join the cell clock as follows:
  * XIAO cell-IO node (makes the trigger): a USB-CDC ping/pong sync (NTP-style, 4 timestamps). The node
    stamps each trigger edge with its own microsecond counter; the host maps it with the fitted offset/drift.
  * Klipper MCU (gantry): Klipper already keeps an MCU-clock -> host-time estimate; we log its reported
    estimated offset and read the toolhead position history (trapq) to interpolate gantry XYZ at the
    trigger time.
  * Feetech bus (SO-101 joints): the read has no device timestamp, so the capture time is the midpoint of the
    sync_read request/response, and the half-round-trip is logged as the uncertainty.
"""
from __future__ import annotations

import json
import math
import statistics
import subprocess
import time
from dataclasses import asdict, dataclass, field
from typing import Callable, Dict, Iterable, List, Optional, Sequence, Tuple

CAM_FPS = 30
SKEW_BUDGET_US = 1000.0          # max camera-to-camera skew for a frame set
OFFSET_BUDGET_US = 500.0         # max |host <-> cell clock offset| during the audit
JOINT_UNCERT_BUDGET_US = 4000.0  # max half round-trip on the servo bus read (~1 Mbps bus, 6 servos)
AUDIT_SECONDS = 60.0


def now_ns() -> int:
    return time.monotonic_ns()


@dataclass
class Stamp:
    """One capture-time stamp: host monotonic ns + offset to the cell clock + uncertainty."""
    source: str
    t_capture_ns: int
    clock_offset_ns: int = 0
    uncertainty_ns: int = 0
    seq: int = -1

    @property
    def t_cell_ns(self) -> int:
        return self.t_capture_ns + self.clock_offset_ns


class ClockOffsetSource:
    """Reads the host's current offset to the cell (PTP/chrony) clock.

    Uses `chronyc -c tracking` (field 'System time' offset, seconds) when chrony runs, or `pmc` for ptp4l.
    `reader` is injectable for tests and for hosts with neither (offset 0, flagged)."""

    def __init__(self, reader: Optional[Callable[[], Optional[float]]] = None):
        self._reader = reader or self._chrony
        self.last_ok = True

    @staticmethod
    def _chrony() -> Optional[float]:
        try:
            out = subprocess.run(["chronyc", "-c", "tracking"], capture_output=True, text=True, timeout=1.0).stdout
            # CSV: refid,refname,stratum,reftime,system_time_offset,...
            return float(out.split(",")[4])
        except Exception:
            return None

    def offset_ns(self) -> int:
        v = self._reader()
        self.last_ok = v is not None
        return int(round((v or 0.0) * 1e9))


class DeviceClockSync:
    """NTP-style 4-timestamp sync to a device microsecond counter (XIAO cell-IO node over USB-CDC).
    Keeps a least-squares fit device_us -> host_ns (offset + drift) over the last N exchanges."""

    def __init__(self, window: int = 64):
        self.window = window
        self.pairs: List[Tuple[float, float, float]] = []   # (device_us, host_mid_ns, half_rtt_ns)

    def add_exchange(self, t0_host_ns: int, device_us: int, t3_host_ns: int) -> None:
        mid = (t0_host_ns + t3_host_ns) / 2.0
        self.pairs.append((float(device_us), mid, (t3_host_ns - t0_host_ns) / 2.0))
        self.pairs = self.pairs[-self.window:]

    def fit(self) -> Tuple[float, float, float]:
        """Return (a, b, resid_ns) with host_ns = a + b * device_us, using the lowest-RTT half of samples."""
        if len(self.pairs) < 2:
            raise ValueError("need >= 2 sync exchanges")
        good = sorted(self.pairs, key=lambda p: p[2])[: max(2, len(self.pairs) // 2)]
        xs = [p[0] for p in good]; ys = [p[1] for p in good]
        mx, my = statistics.fmean(xs), statistics.fmean(ys)
        sxx = sum((x - mx) ** 2 for x in xs)
        b = 1000.0 if sxx == 0 else sum((x - mx) * (y - my) for x, y in zip(xs, ys)) / sxx
        a = my - b * mx
        resid = max(abs(y - (a + b * x)) for x, y in zip(xs, ys))
        return a, b, resid

    def to_host_ns(self, device_us: int) -> int:
        a, b, _ = self.fit()
        return int(round(a + b * device_us))


def stamp_bus_read(read: Callable[[], dict], source: str = "so101_joints", offset: int = 0) -> Tuple[dict, Stamp]:
    """Read the servo bus and stamp it at the request/response midpoint (uncertainty = half round trip)."""
    t0 = now_ns(); vals = read(); t1 = now_ns()
    return vals, Stamp(source, (t0 + t1) // 2, offset, (t1 - t0) // 2)


# ---------------------------------------------------------------------------------------------- audit
@dataclass
class AuditResult:
    ok: bool
    seconds: float
    frames: int
    skew_us_p50: float
    skew_us_p99: float
    skew_us_max: float
    offset_us_max: float
    joint_uncert_us_p99: float
    dropped_frame_sets: int
    period_jitter_us_std: float
    reasons: List[str] = field(default_factory=list)

    def to_json(self) -> str:
        return json.dumps(asdict(self), indent=1)


def _pct(xs: Sequence[float], p: float) -> float:
    if not xs:
        return float("nan")
    s = sorted(xs)
    k = min(len(s) - 1, max(0, int(math.ceil(p / 100.0 * len(s))) - 1))
    return float(s[k])


def evaluate_audit(frame_sets: Iterable[Dict[str, int]], offsets_ns: Iterable[int], joint_uncert_ns: Iterable[int],
                   expected_cams: Sequence[str], seconds: float, fps: int = CAM_FPS,
                   skew_budget_us: float = SKEW_BUDGET_US, offset_budget_us: float = OFFSET_BUDGET_US,
                   joint_budget_us: float = JOINT_UNCERT_BUDGET_US) -> AuditResult:
    """frame_sets: per trigger, {camera: capture_cell_ns}. A set missing a camera counts as dropped.
    Pass/fail rules: p99 and max camera skew <= budget, |clock offset| <= budget, joint read uncertainty p99 <=
    budget, dropped sets <= 1% of expected, trigger period jitter std <= 10% of the period."""
    skews, starts, dropped, n = [], [], 0, 0
    for fs in frame_sets:
        n += 1
        if any(c not in fs for c in expected_cams):
            dropped += 1
            continue
        ts = [fs[c] for c in expected_cams]
        skews.append((max(ts) - min(ts)) / 1000.0)
        starts.append(min(ts))
    offs = [abs(o) / 1000.0 for o in offsets_ns]
    ju = [u / 1000.0 for u in joint_uncert_ns]
    periods = [(b - a) / 1000.0 for a, b in zip(starts[:-1], starts[1:])]
    jit = statistics.pstdev(periods) if len(periods) > 1 else float("nan")
    reasons = []
    exp_sets = int(seconds * fps)
    if n < 0.95 * exp_sets:
        reasons.append(f"only {n} trigger sets in {seconds:.0f} s (expected ~{exp_sets} at {fps} fps)")
    if dropped > max(1, 0.01 * exp_sets):
        reasons.append(f"{dropped} frame sets missing a camera (> 1%)")
    if skews and (_pct(skews, 99) > skew_budget_us or max(skews) > skew_budget_us):
        reasons.append(f"camera skew p99 {_pct(skews, 99):.0f} us / max {max(skews):.0f} us > {skew_budget_us:.0f} us budget")
    if offs and max(offs) > offset_budget_us:
        reasons.append(f"clock offset reached {max(offs):.0f} us > {offset_budget_us:.0f} us (PTP/chrony not locked?)")
    if ju and _pct(ju, 99) > joint_budget_us:
        reasons.append(f"servo read uncertainty p99 {_pct(ju, 99):.0f} us > {joint_budget_us:.0f} us")
    if periods and jit == jit and jit > 0.1 * 1e6 / fps:
        reasons.append(f"trigger period jitter {jit:.0f} us > 10% of the {1e6 / fps:.0f} us period")
    if not skews:
        reasons.append("no complete frame sets")
    return AuditResult(not reasons, seconds, n, round(_pct(skews, 50), 1), round(_pct(skews, 99), 1),
                       round(max(skews) if skews else float("nan"), 1), round(max(offs) if offs else 0.0, 1),
                       round(_pct(ju, 99), 1) if ju else 0.0, dropped, round(jit, 1) if jit == jit else float("nan"), reasons)


def jitter_profile(audit_samples: Dict[str, List[float]]) -> dict:
    """Summarise measured latencies (us) per channel into a profile the sim and the training augmenter use."""
    prof = {}
    for ch, xs in audit_samples.items():
        if not xs:
            continue
        prof[ch] = {"mean_us": round(statistics.fmean(xs), 1), "std_us": round(statistics.pstdev(xs), 1) if len(xs) > 1 else 0.0,
                    "p99_us": round(_pct(xs, 99), 1), "max_us": round(max(xs), 1)}
    return {"version": 1, "fps": CAM_FPS, "channels": prof}


class SessionGate:
    """Refuses a recording session unless a passing audit younger than max_age_s exists."""

    def __init__(self, max_age_s: float = 15 * 60):
        self.max_age_s = max_age_s
        self.last: Optional[Tuple[float, AuditResult]] = None

    def record_audit(self, res: AuditResult, t: Optional[float] = None) -> None:
        self.last = (time.time() if t is None else t, res)

    def check(self, t: Optional[float] = None) -> None:
        t = time.time() if t is None else t
        if not self.last:
            raise PermissionError("No timestamp audit yet - run `python -m ct72.timestamp_audit` (60 s) first")
        ts, res = self.last
        if not res.ok:
            raise PermissionError("Last timestamp audit FAILED: " + "; ".join(res.reasons))
        if t - ts > self.max_age_s:
            raise PermissionError(f"Timestamp audit is {int(t - ts)} s old (> {int(self.max_age_s)} s) - re-run it")
