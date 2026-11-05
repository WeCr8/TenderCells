"""SO-101 follower limits for the CT72 cell (rev A1.2): servo-bus power budget, torque / pinch limits and the
soft egg-gripper force cap. Applied after LeRobot connects the arm (lerobot_arm.LeRobotArm / our robot class).

Data: STS3215-C047/C018 12 V - stall 2.7 A, 30 kg.cm (~2.94 N.m), Kt ~11 kg.cm/A (Waveshare ST3215 docs).
SO-ARM100 issue #132: a 12 V 5 A supply with daisy-chained power browns out under multi-joint load, so the cell
uses a 12 V 12.5 A supply (Mean Well LRS-150-12) with a fused STAR feed (one 3 A fuse per servo).
Eggs fail at 34 +/- 6 N (equatorial, quasi-static) -> fingertip cap 6 N (>= 5x below the mean, ~2.7x below -3 sigma).
"""
from __future__ import annotations

from dataclasses import dataclass
from typing import Dict

STALL_A = 2.7
IDLE_A = 0.18
STALL_NM = 30 * 0.0981            # 30 kg.cm
SUPPLY_A = 12.5
FUSE_A = 3.0
JOINTS = ("shoulder_pan", "shoulder_lift", "elbow_flex", "wrist_flex", "wrist_roll", "gripper")
FINGER_LEVER_M = 0.055            # gripper horn -> soft-finger contact (Fin Ray, est)
GRIP_FORCE_LIMIT_N = 6.0
EGG_BREAK_N = 34.0

# torque caps in % of stall (STS 'Torque_Limit' register is 0-1000 = 0-100.0 %)
TORQUE_PCT: Dict[str, float] = {
    "shoulder_pan": 45.0, "shoulder_lift": 70.0, "elbow_flex": 60.0, "wrist_flex": 45.0, "wrist_roll": 30.0,
    "gripper": round(100.0 * GRIP_FORCE_LIMIT_N * FINGER_LEVER_M / STALL_NM, 1),
}
# hanging arm: 'down' is gravity-assisted -> keep a speed cap too (deg/s) so a policy can't slam into a box
SPEED_CAP_DEG_S = 60.0


@dataclass
class BusBudget:
    worst_case_a: float
    typical_peak_a: float
    supply_a: float
    ok: bool
    note: str


def bus_budget(stall_joints: int = 3) -> BusBudget:
    """Worst realistic case: `stall_joints` joints at their torque caps' stall share, the rest moving (~0.9 A)."""
    caps = sorted((TORQUE_PCT[j] / 100.0 * STALL_A for j in JOINTS), reverse=True)
    stalled = sum(caps[:stall_joints])
    moving = (len(JOINTS) - stall_joints) * 0.9
    worst = 6 * STALL_A
    peak = stalled + moving
    return BusBudget(round(worst, 1), round(peak, 1), SUPPLY_A, peak <= 0.8 * SUPPLY_A,
                     f"all-6-stall {worst:.1f} A only with caps off; with caps, {stall_joints} capped stalls + movers = {peak:.1f} A "
                     f"vs {SUPPLY_A} A supply (80% rule {0.8 * SUPPLY_A:.1f} A); per-servo fuse {FUSE_A} A > 2.7 A stall")


def grip_force_from_torque_pct(pct: float) -> float:
    return pct / 100.0 * STALL_NM / FINGER_LEVER_M


def apply_limits(robot) -> Dict[str, float]:  # pragma: no cover - needs the bus
    """Write torque caps to the follower's Feetech bus (LeRobot >= 0.6 FeetechMotorsBus.write)."""
    bus = getattr(robot, "bus", None)
    if bus is None:
        raise RuntimeError("robot has no Feetech bus")
    applied = {}
    for j, pct in TORQUE_PCT.items():
        val = int(round(pct * 10))                 # 0-1000
        bus.write("Torque_Limit", j, val)
        applied[j] = pct
    return applied
