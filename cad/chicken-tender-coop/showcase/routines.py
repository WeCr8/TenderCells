"""CLEAN + EGG routines for the Plus/Pro ceiling gantry + inverted SO-101: safety interlocks, a pure-Python state
machine and a time-stepped simulator (no hardware). Zach 2026-11-22.

    python routines.py            -> reports/CT_COOP_A_routines.json (plan check, cycle time, demo scenarios)
    python -m pytest test_routines.py -q

Hard rule: NO gantry / arm motion starts or continues unless EVERY permissive is true:
  (a) no chicken: camera person/bird detector (coop XIAO Sense cam at CAM_Z) "clear" continuously >= 60 s
      AND PIR (AM312) quiet AND nest load cells under threshold (roost load cells optional, default OFF:
      C.ROOST_LOADCELLS; when fitted they must also read empty). Camera clear but PIR active
      = SENSOR DISAGREE = abort (never trust the camera alone).
  (b) pop door CLOSED: REED_CLOSED stable >= debounce, REED_OPEN off, door actuator current idle.
  (c) E-STOP loop closed (ESTOP_SENSE high).
  (d) cleanout + egg-bay collection door closed, and every HUMAN SERVICE DOOR closed (service_params.DOOR_REEDS;
      placeholders SD_LEFT / SD_RIGHT_LOW / SD_BACK until that file exists).
  (e) time window (daytime, hens out in the run) and not raining.
  (f) not in MAINTENANCE LOCKOUT / E-STOP latch (a person opened a service door, or the E-STOP was pressed:
      the gantry stays disabled until the door is closed AND someone re-arms from the app or the button).
  (g) every safety input fresh (heartbeat), host <-> motion-controller watchdog alive.
EGG routine adds: nest load cells read EMPTY (a hen may be nesting) and the pop door stays closed while the arm
is in the nest box. Debounce is asymmetric: "closed" must be stable, "open" acts on the first reading.

The hardware chain (E-STOP NC block 3 + service-door + cleanout + egg-bay reeds in series with the EB2 motor-rail
relay coil) cuts motor power without software; this module is the software layer above it.
"""
from __future__ import annotations
import json, math, os
from dataclasses import dataclass, field, replace
import sc_params as P
import clean_params as C

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.join(HERE, "..")


# ===================================================================================== door reed IDs
def service_door_reeds():
    """Service-door reed IDs from service_params.DOOR_REEDS (another agent's file). Re-read on every call so the
    IDs appear as soon as that file does; placeholders until then."""
    try:
        import importlib, sys
        mod = sys.modules.get("service_params")
        mod = importlib.reload(mod) if mod else importlib.import_module("service_params")
        reeds = getattr(mod, "DOOR_REEDS", None)
        if reeds:
            ids = list(reeds.keys()) if isinstance(reeds, dict) else [r if isinstance(r, str) else r.get("id") for r in reeds]
            ids = [i for i in ids if i]
            if ids:
                return ids, "service_params.DOOR_REEDS"
    except Exception:       # noqa: BLE001  (missing / half-written file -> placeholders)
        pass
    return ["SD_LEFT", "SD_RIGHT_LOW", "SD_BACK"], "placeholder"


def service_interlock_cfg():
    """Resume rule from service_params.DOOR_INTERLOCK if present (doors closed for N s + re-arm)."""
    cfg = dict(debounce_s=0.05, resume_closed_s=2.0)
    try:
        import service_params as S
        d = getattr(S, "DOOR_INTERLOCK", {})
        if "debounce_ms" in d:
            cfg["debounce_s"] = d["debounce_ms"] / 1000.0
        import re
        m = re.search(r"closed for (\d+(?:\.\d+)?) s", d.get("resume", ""))
        if m:
            cfg["resume_closed_s"] = float(m.group(1))
    except Exception:       # noqa: BLE001
        pass
    return cfg


EGGBAY_REED = "RS-EGGBAY"             # NEW: egg-bay collection (hood) door reed
CLEANOUT_REED_FALLBACK = "RS-CLEANOUT"  # NEW if no service doors exist; with service_params the cleanout IS SD2 (RS-SD2)


def person_door_ids():
    ids, src = service_door_reeds()
    extra = [EGGBAY_REED]
    if src == "placeholder" or not any(i.endswith("SD2") for i in ids):
        extra.append(CLEANOUT_REED_FALLBACK)
    return ids + [e for e in extra if e not in ids], src


# ===================================================================================== inputs
@dataclass
class Inputs:
    """One snapshot of every safety input. *_ts = time (s) the value was last refreshed by its sensor."""
    t: float = 0.0
    cam_clear: bool = True;  cam_ts: float = 0.0        # XIAO Sense person/bird detector (MQTT)
    pir_active: bool = False; pir_ts: float = 0.0       # AM312 (MCP23017 + FluidNC feed-hold)
    roost_kg: float | None = None; nest_kg: tuple | None = (0.0, 0.0); lc_ts: float = 0.0   # NAU7802 load cells (None = not fitted; roost default OFF)
    reed_closed: bool = True; reed_open: bool = False; door_mA: int = 0; door_ts: float = 0.0   # XIAO door controller
    estop_ok: bool = True                               # ESTOP_SENSE high (NC loop closed)
    doors: dict = field(default_factory=dict)           # person-door reed id -> closed? (missing id = OPEN)
    hour: float = 11.0                                  # local time of day
    raining: bool = False
    heartbeat_ok: bool = True                           # host <-> motion controller watchdog (MotionSim also checks)


def all_closed_doors():
    ids, _ = person_door_ids()
    return {i: True for i in ids}


# ===================================================================================== fault table
# action: FREEZE = stop all motion now, servos to compliant low-torque hold, steppers hold (no drop)
#         RETREAT = stop, then (only while no presence) lift the tool out of the bedding and Z up to GZ_TRAVEL_MAX
#                   at reduced speed; any presence during the retreat -> FREEZE
#         POWER_CUT = motor rail already dead (hardware); nothing can move
#         FINISH = end the current cell, then RETREAT (soft stop)
# latch:  ESTOP = needs ESTOP_SENSE high + re-arm;  MAINT = maintenance lockout (doors closed + re-arm);  None
FAULTS = {
    "estop":                dict(action="POWER_CUT", latch="ESTOP", notify="alert", desc="E-STOP loop open (ESTOP_SENSE low)"),
    "watchdog":             dict(action="POWER_CUT", latch="ESTOP", notify="alert", desc="host <-> motion controller heartbeat missed > WATCHDOG_S: controller cut its own drivers"),
    "service_door_open":    dict(action="FREEZE", latch="MAINT", notify="alert", desc="a person opened a service / cleanout / egg-bay door"),
    "presence_camera":      dict(action="FREEZE", latch=None, notify="alert", desc="camera sees a bird or person"),
    "presence_pir":         dict(action="FREEZE", latch=None, notify="alert", desc="PIR active and camera not clear"),
    "sensor_disagree":      dict(action="FREEZE", latch=None, notify="alert", desc="camera clear but PIR active: cannot rule out a hen"),
    "presence_roost_load":  dict(action="FREEZE", latch=None, notify="alert", desc="roost load cell above empty threshold"),
    "nest_occupied":        dict(action="FREEZE", latch=None, notify="alert", desc="nest load cell above empty threshold"),
    "presence_stale":       dict(action="FREEZE", latch=None, notify="alert", desc="camera / PIR / load-cell data older than SENSOR_STALE_S"),
    "pop_door_not_closed":  dict(action="RETREAT", latch=None, notify="alert", desc="pop-door closed reed dropped / open reed on / not yet stable"),
    "door_reed_conflict":   dict(action="RETREAT", latch=None, notify="alert", desc="both door reeds active"),
    "door_actuator_moving": dict(action="RETREAT", latch=None, notify="warn", desc="door actuator current above idle"),
    "door_stale":           dict(action="RETREAT", latch=None, notify="warn", desc="door controller data stale"),
    "step_timeout":         dict(action="RETREAT", latch=None, notify="alert", desc="motion step took > STEP_TIMEOUT_FACTOR x plan (jam / stall)"),
    "routine_timeout":      dict(action="RETREAT", latch=None, notify="alert", desc="routine exceeded ROUTINE_TIMEOUT_S"),
    "soft_limit":           dict(action="RETREAT", latch=None, notify="alert", desc="commanded move outside G_SPEED / travel soft limits"),
    "servo_overload":       dict(action="RETREAT", latch=None, notify="warn", desc="STS3215 load > SCOOP servo_load_abort_pct during a curl"),
    "outside_window":       dict(action="FINISH", latch=None, notify="info", desc="outside the daytime work window"),
    "raining":              dict(action="FINISH", latch=None, notify="info", desc="rain: no cleaning"),
}
PRESENCE = {"presence_camera", "presence_pir", "sensor_disagree", "presence_roost_load", "nest_occupied", "presence_stale"}


# ===================================================================================== interlock evaluation
class Interlocks:
    """Keeps the debounce / hold timers and turns an Inputs snapshot into a set of violated permissives."""

    def __init__(self):
        self.cam_clear_since = None
        self.reed_closed_since = None
        self.doors_closed_since = None
        self.svc = service_interlock_cfg()

    def update(self, i: Inputs, routine: str):
        now = i.t
        v = set()
        # (c) E-STOP + watchdog
        if not i.estop_ok:
            v.add("estop")
        if not i.heartbeat_ok:
            v.add("watchdog")
        # (d)/(f) person doors: open acts at once; "all closed" needs resume_closed_s for the lockout exit
        ids, _ = person_door_ids()
        closed = all(i.doors.get(d, False) for d in ids)
        if not closed:
            v.add("service_door_open"); self.doors_closed_since = None
        elif self.doors_closed_since is None:
            self.doors_closed_since = now
        # (a) presence
        fresh_cam = now - i.cam_ts <= C.SENSOR_STALE_S
        fresh_pir = now - i.pir_ts <= C.SENSOR_STALE_S
        roost_kg = i.roost_kg if C.ROOST_LOADCELLS else None   # roost cells optional (default OFF): reading ignored when not fitted
        if C.ROOST_LOADCELLS and i.roost_kg is None:
            v.add("presence_stale")              # configured as fitted but no reading = sensor fault
        lc_fitted = roost_kg is not None or i.nest_kg is not None
        fresh_lc = (not lc_fitted) or now - i.lc_ts <= C.SENSOR_STALE_S
        if not (fresh_cam and fresh_pir and fresh_lc):
            v.add("presence_stale")
        if i.cam_clear and fresh_cam:
            if self.cam_clear_since is None:
                self.cam_clear_since = now
        else:
            self.cam_clear_since = None
        if not i.cam_clear:
            v.add("presence_camera")
            if i.pir_active:
                v.add("presence_pir")
        elif i.pir_active:
            v.add("sensor_disagree")
        if self.cam_clear_since is None or now - self.cam_clear_since < C.CAM_CLEAR_HOLD_S:
            v.add("cam_hold")                    # permissive only (not a mid-routine fault by itself)
        if roost_kg is not None and roost_kg > C.LOADCELL["roost_empty_kg"]:
            v.add("presence_roost_load")
        if routine == "egg":
            if i.nest_kg is None:
                v.add("nest_occupied")           # egg routine REQUIRES nest load cells
            elif any(k > C.LOADCELL["nest_empty_kg"] for k in i.nest_kg):
                v.add("nest_occupied")
        elif i.nest_kg is not None and any(k > C.LOADCELL["nest_empty_kg"] for k in i.nest_kg):
            v.add("nest_occupied")               # clean too: a hen in a nest box is a hen in the coop
        # (b) pop door: closed must be stable; open/conflict/current act at once
        if now - i.door_ts > C.SENSOR_STALE_S:
            v.add("door_stale")
        if i.reed_closed and i.reed_open:
            v.add("door_reed_conflict")
        if i.reed_closed and not i.reed_open:
            if self.reed_closed_since is None:
                self.reed_closed_since = now
        else:
            self.reed_closed_since = None
            v.add("pop_door_not_closed")
        if self.reed_closed_since is not None and now - self.reed_closed_since < C.REED_DEBOUNCE_S:
            v.add("pop_door_settling")           # permissive only
        if i.door_mA > C.DOOR_IDLE_MA:
            v.add("door_actuator_moving")
        # (e) window + rain
        if not (C.WINDOW["start_h"] <= i.hour < C.WINDOW["end_h"]):
            v.add("outside_window")
        if C.RAIN_BLOCK and i.raining:
            v.add("raining")
        return v


# ===================================================================================== soft limits + plan
def trap_time(d, v, a):
    d = abs(d)
    if d <= 1e-9:
        return 0.0
    return d / v + v / a if d > v * v / a else 2.0 * math.sqrt(d / a)


GY_RAIL = (P.GY_RAIL_Y[0] + 40.0 - P.GY_OFF, P.GY_RAIL_Y[1] - 40.0 - P.GY_OFF)   # arm-base y travel from the carriage stops


def xy_speed_limit(a, b):
    """G_SPEED xy_max, clamped to xy_near_wall when either end is within NEAR_WALL_MM of an X/Y travel end."""
    def near(p):
        return (p[0] - P.GX_RANGE[0] < C.NEAR_WALL_MM or P.GX_RANGE[1] - p[0] < C.NEAR_WALL_MM or
                p[1] - GY_RAIL[0] < C.NEAR_WALL_MM or GY_RAIL[1] - p[1] < C.NEAR_WALL_MM)
    return P.G_SPEED["xy_near_wall"] if near(a) or near(b) else P.G_SPEED["xy_max"]


@dataclass
class Step:
    kind: str                 # xy | z | arm | tool | dwell
    name: str
    planned_s: float
    start: tuple = ()         # gantry (gx, gy, gz) at the start
    end: tuple = ()           # gantry (gx, gy, gz) at the end
    speed: float = 0.0        # commanded mm/s (xy / z) or 0 for arm/tool steps
    in_bed: bool = False      # tool is in the bedding at the END of this step
    cell: int = -1


def check_soft_limits(step: Step):
    """Returns a reason string if the step violates the G_SPEED / travel soft limits, else ''."""
    g = P.G_SPEED
    for p in (step.start, step.end):
        if not p:
            continue
        if not (P.GX_RANGE[0] - 1e-6 <= p[0] <= P.GX_RANGE[1] + 1e-6):
            return f"gx {p[0]:.0f} outside {P.GX_RANGE}"
        if not (GY_RAIL[0] - 1e-6 <= p[1] <= GY_RAIL[1] + 1e-6):
            return f"gy {p[1]:.0f} outside {GY_RAIL}"
        if not (P.GZ_BOTTOM - 1e-6 <= p[2] <= P.GZ_TOP + 1e-6):
            return f"gz {p[2]:.0f} outside {P.GZ_BOTTOM}..{P.GZ_TOP}"
    if step.kind == "xy":
        if max(step.start[2], step.end[2]) > P.GZ_TRAVEL_MAX + 1e-6:
            return f"XY move with gz {max(step.start[2], step.end[2]):.0f} > GZ_TRAVEL_MAX {P.GZ_TRAVEL_MAX}"
        if step.speed > xy_speed_limit(step.start, step.end) + 1e-6:
            return f"xy speed {step.speed} > {xy_speed_limit(step.start, step.end)}"
        if step.start[2] != step.end[2]:
            return "XY and Z in one step (not allowed)"
    if step.kind == "z":
        if step.speed > g["z_max"] + 1e-6:
            return f"z speed {step.speed} > {g['z_max']}"
        if step.start[:2] != step.end[:2]:
            return "Z step with XY change"
    if step.in_bed and step.kind in ("xy", "z"):
        return "gantry move with the tool in the bedding"
    return ""


def _xy(a, b, name, cell=-1, speed=None):
    v = speed or xy_speed_limit(a, b)
    d = math.hypot(b[0] - a[0], b[1] - a[1])
    return Step("xy", name, trap_time(d, v, P.G_SPEED["accel"]), tuple(a), tuple(b), v, cell=cell)


def _z(a, z, name, cell=-1, speed=None):
    v = speed or P.G_SPEED["z_max"]
    b = (a[0], a[1], z)
    return Step("z", name, trap_time(z - a[2], v, P.G_SPEED["accel"]), tuple(a), b, v, cell=cell)


def _arm(name, s, at, in_bed=False, cell=-1):
    return Step("arm", name, s, tuple(at), tuple(at), 0.0, in_bed=in_bed, cell=cell)


def load_reach(path=None):
    path = path or os.path.join(ROOT, "reports", "CT_COOP_A_clean_reach.json")
    if os.path.exists(path):
        return json.load(open(path))
    return None


def cell_arm_steps(depth, at, cell):
    """Per-cell arm sequence (from clean_params.MIX / SCOOP). Tool starts and ends in the LIFT pose (tip bed + 40)."""
    m, s = C.MIX, C.SCOOP
    lift_h = 40.0
    curl_depth = min(s["curl_depth_mm"], depth)
    return [
        _arm("plunge (trowel ~vertical, aerate)", (lift_h + depth) / m["t_plunge_mm_s"], at, True, cell),
        _arm("withdraw to curl depth", (depth - curl_depth) / m["t_lift_mm_s"], at, True, cell),
        _arm(f"shovel curl {s['curl_deg']:.0f} deg (wrist flex)", s["curl_deg"] / s["curl_speed_deg_s"], at, True, cell),
        _arm("lift loaded blade clear (35-75 deg tilt)", (curl_depth + lift_h) / m["t_lift_mm_s"], at, False, cell),
        _arm(f"roll {m['roll_deg']:.0f} deg (turn the clump over)", m["roll_deg"] / m["roll_deg_s"], at, False, cell),
        _arm("dump / shake (fines through the slots)", m["t_dump_s"], at, False, cell),
        _arm("roll back", m["roll_deg"] / m["roll_deg_s"], at, False, cell),
        _arm("settle", m["t_settle_s"], at, False, cell),
    ]


def tool_change_steps(at, tid, pick=True):
    slot_x = C.DOCK["slots"].get(tid, P.DOCK["slots"].get(tid))
    a = (slot_x, C.GY_WORK_MIN, at[2])
    tang_y = P.DOCK["y"] + 32.0
    st = [_xy(at, a, f"to dock row behind {tid}")] if (abs(at[0] - a[0]) + abs(at[1] - a[1])) > 0.1 else []
    b = (slot_x, max(tang_y, GY_RAIL[0]), a[2])
    st += [_xy(a, b, f"Y-only approach to fork {tid}", speed=P.G_SPEED["xy_near_wall"]),
           Step("tool", f"{'pick' if pick else 'return'} {tid} (jaw clamp, tool-present reed)", 6.0, b, b),
           _xy(b, a, f"Y-only retreat from fork {tid}", speed=P.G_SPEED["xy_near_wall"])]
    return st, a


def clean_plan(reach=None, fill_in=P.BED_FILL_IN):
    """Raster mixing plan: lanes along Y (boustrophedon), per cell plunge/withdraw/curl/lift/roll/dump.
    Cells the reach check could not do (under the droppings board, probe keep-outs) are skipped and listed."""
    reach = reach or load_reach()
    if reach is None:
        raise FileNotFoundError("run clean_reach.py first (reports/CT_COOP_A_clean_reach.json)")
    park = (P.G_PARK[0], P.G_PARK[1], P.G_PARK[2])
    st = [_z(park, P.GZ_TRAVEL_MAX, "unpark: Z down to travel height")]
    pos = st[-1].end
    tc, pos = tool_change_steps(pos, "T6", pick=True); st += tc
    done, skipped = [], []
    for k, s in enumerate(reach["solutions"]):
        if not s["ok"]:
            skipped.append((round(s["x"]), round(s["y"]))); continue
        gx, gy, gz = s["base"]
        if (abs(pos[0] - gx) + abs(pos[1] - gy)) > 0.1:
            st.append(_xy(pos, (gx, gy, pos[2]), f"to cell {k}", cell=k)); pos = st[-1].end
        if abs(pos[2] - gz) > 0.1:
            st.append(_z(pos, gz, f"Z to work height cell {k}", cell=k)); pos = st[-1].end
        st += cell_arm_steps(s["depth_mm"], pos, k)
        done.append(k)
    if pos[2] != P.GZ_TRAVEL_MAX:
        st.append(_z(pos, P.GZ_TRAVEL_MAX, "Z to travel height")); pos = st[-1].end
    tc, pos = tool_change_steps(pos, "T6", pick=False); st += tc
    st.append(_xy(pos, (park[0], park[1], pos[2]), "to park")); pos = st[-1].end
    st.append(_z(pos, park[2], "park: Z up"))
    return {"steps": st, "cells_done": done, "cells_skipped": skipped, "n_cells": len(reach["solutions"])}


def egg_plan(n_eggs=3):
    """Egg routine (Plus/Pro gantry): jaws (T0, no tool change), over the nest bay, per egg approach/grasp/lift/to
    the egg chute/release. Arm times ASSUMED; geometry is the reach.py / arm.py egg pick."""
    park = P.G_PARK
    st = [_z(park, P.GZ_TRAVEL_MAX, "unpark: Z down")]
    pos = st[-1].end
    bay = (P.GX_RANGE[1], min(max(P.NB_DIV_Y, GY_RAIL[0]), GY_RAIL[1]), P.GZ_TRAVEL_MAX)
    st.append(_xy(pos, bay, "to the nest bay (right wall)")); pos = bay
    for e in range(n_eggs):
        st += [_arm(f"egg {e}: approach", 3.0, pos, True, e), _arm(f"egg {e}: grasp (6 N cap)", 2.0, pos, True, e),
               _arm(f"egg {e}: lift over the rim", 2.0, pos, True, e), _arm(f"egg {e}: to chute mouth", 3.0, pos, False, e),
               _arm(f"egg {e}: release into the padded chute", 1.5, pos, False, e)]
    st.append(_xy(pos, (park[0], park[1], pos[2]), "to park")); pos = st[-1].end
    st.append(_z(pos, park[2], "park: Z up"))
    return {"steps": st}


def validate_plan(plan):
    bad = [(i, s.name, r) for i, s in enumerate(plan["steps"]) if (r := check_soft_limits(s))]
    return bad


def cycle_time(plan):
    t = {"xy": 0.0, "z": 0.0, "arm": 0.0, "tool": 0.0, "dwell": 0.0}
    for s in plan["steps"]:
        t[s.kind] += s.planned_s
    tot = sum(t.values())
    return {"total_s": round(tot, 1), "total_min": round(tot / 60, 1), **{f"{k}_s": round(v, 1) for k, v in t.items()}}


# ===================================================================================== motion sim + controller
@dataclass
class Event:
    t: float
    kind: str
    msg: str


class MotionSim:
    """The motion controller (FluidNC-class in EB2) + SO-101 bus, as the routine sees it: executes plan steps when
    permitted, holds position otherwise, cuts its own drivers if the host heartbeat stops."""

    def __init__(self, pos=P.G_PARK):
        self.pos = tuple(pos); self.in_bed = False; self.power = True
        self.last_hb = 0.0; self.moving = False; self.speed_scale = 1.0
        self.compliant = False            # servos in low-torque hold (FREEZE)
        self.motion_log = []              # (t, step name, progress) every tick that moved

    def heartbeat(self, now):
        self.last_hb = now

    def watchdog_ok(self, now):
        return now - self.last_hb <= C.WATCHDOG_S

    def advance(self, step: Step, frac0, dt, now, scale=1.0):
        """Advance a step; returns new progress fraction (0..1)."""
        if not self.power:
            return frac0
        f = min(1.0, frac0 + dt * scale / max(step.planned_s, 1e-6))
        if step.start and step.end:
            self.pos = tuple(a + (b - a) * f for a, b in zip(step.start, step.end))
        if f >= 1.0:
            self.in_bed = step.in_bed
        elif step.kind == "arm":
            self.in_bed = step.in_bed or self.in_bed
        self.moving = f > frac0
        if self.moving:
            self.motion_log.append((round(now, 2), step.name, round(f, 3)))
        return f


class RoutineController:
    """States: IDLE -> PRECHECK -> RUNNING -> DONE ; RUNNING -> FREEZE / RETREAT -> STOPPED ;
    any -> LOCKOUT (person door) / ESTOP (E-STOP, watchdog); leaving those needs re-arm."""

    PERMISSIVE_ONLY = {"cam_hold", "pop_door_settling"}

    def __init__(self, sim: MotionSim | None = None, notify=None):
        self.sim = sim or MotionSim()
        self.il = Interlocks()
        self.state = "IDLE"; self.routine = None; self.plan = None; self.k = 0; self.frac = 0.0
        self.step_t = 0.0; self.t_start = 0.0; self.latch = None; self.fault = None
        self.log: list[Event] = []; self.notes = []
        self.notify = notify or (lambda lvl, msg: self.notes.append((lvl, msg)))
        self.retreat_steps = []; self.rk = 0; self.rfrac = 0.0
        self.rearm_req = False; self.last_v = set()

    # -------------------------------------------------- operator / app
    def request(self, routine, plan):
        if self.state not in ("IDLE", "DONE", "STOPPED"):
            self._ev(self.sim.last_hb, "refused", f"request {routine} refused in {self.state}")
            return False
        self.routine, self.plan, self.k, self.frac, self.step_t = routine, plan, 0, 0.0, 0.0
        self.state = "PRECHECK"; self.fault = None
        return True

    def rearm(self):
        """App button / panel button. Only takes effect if the latch cause is gone (checked on the next tick)."""
        self.rearm_req = True

    # -------------------------------------------------- helpers
    def _ev(self, t, kind, msg):
        self.log.append(Event(round(t, 2), kind, msg))

    def _trip(self, now, code, v):
        f = FAULTS[code]
        self.fault = code
        self._ev(now, "fault", f"{code}: {f['desc']} (state {self.state}, step {self.k})")
        self.notify(f["notify"], f"{self.routine or 'gantry'}: {code} - {f['desc']}")
        if f["latch"] == "ESTOP":
            self.sim.power = False; self.state = "ESTOP"; self.latch = "ESTOP"
        elif f["latch"] == "MAINT":
            self.sim.compliant = True; self.state = "LOCKOUT"; self.latch = "MAINT"
        elif f["action"] == "FREEZE":
            self.sim.compliant = True; self.state = "FREEZE"
        elif f["action"] in ("RETREAT", "FINISH"):
            self._start_retreat(now, finish_cell=f["action"] == "FINISH")

    def _start_retreat(self, now, finish_cell=False):
        st = []
        pos = self.sim.pos
        if finish_cell and self.state == "RUNNING" and self.plan:
            # finish the arm steps of the current cell, then retreat
            cur = self.plan["steps"][self.k]
            rest = [s for s in self.plan["steps"][self.k:] if s.kind == "arm" and s.cell == cur.cell and cur.kind == "arm"]
            if rest:
                rest[0] = replace(rest[0], planned_s=rest[0].planned_s * (1 - self.frac))
            st += rest
        if self.sim.in_bed or (st and st[-1].in_bed):
            st.append(_arm("RETREAT: lift the tool straight out (reduced speed)", 2 * (C.T6_LEN - 30) / C.MIX["t_lift_mm_s"], pos, False))
        if pos[2] < P.GZ_TRAVEL_MAX - 0.1:
            st.append(_z(pos, P.GZ_TRAVEL_MAX, "RETREAT: Z up to GZ_TRAVEL_MAX (reduced speed)", speed=C.SAFE_Z_SPEED))
        self.retreat_steps, self.rk, self.rfrac = st, 0, 0.0
        self.sim.compliant = False
        self.state = "RETREAT"
        self._ev(now, "retreat", f"{len(st)} retreat steps")

    # -------------------------------------------------- main tick
    def tick(self, i: Inputs, dt):
        now = i.t
        if i.heartbeat_ok:
            self.sim.heartbeat(now)
        i = replace(i, heartbeat_ok=self.sim.watchdog_ok(now))
        v = self.il.update(i, self.routine or "clean")
        self.last_v = v
        hard = v - self.PERMISSIVE_ONLY - {"outside_window", "raining"}
        # ---- latched states first
        if self.state == "ESTOP":
            if self.rearm_req and not ({"estop", "watchdog"} & v):
                self.sim.power = True; self.latch = None; self.state = "STOPPED"; self._ev(now, "rearm", "E-STOP re-armed")
                self.notify("info", "gantry re-armed after E-STOP; parked state unknown -> home before next routine")
            self.rearm_req = False
            return
        if "estop" in v or "watchdog" in v:
            self._trip(now, "estop" if "estop" in v else "watchdog", v); return
        if self.state == "LOCKOUT":
            if self.rearm_req:
                ok = "service_door_open" not in v and self.il.doors_closed_since is not None and \
                     now - self.il.doors_closed_since >= self.il.svc["resume_closed_s"]
                if ok:
                    self.latch = None; self.state = "STOPPED"; self.sim.compliant = False
                    self._ev(now, "rearm", "maintenance lockout cleared (doors closed + re-arm)")
                else:
                    self._ev(now, "refused", "re-arm refused: a service door is open or not closed long enough")
            self.rearm_req = False
            return
        self.rearm_req = False
        if "service_door_open" in v:
            self._trip(now, "service_door_open", v); return
        # ---- moving states
        if self.state == "PRECHECK":
            if not v:
                self.state = "RUNNING"; self.t_start = now; self._ev(now, "start", f"{self.routine}: all permissives true")
                self.notify("info", f"{self.routine} started")
            return                                   # wait (no motion) until every permissive is true
        if self.state == "RUNNING":
            pres = hard & PRESENCE
            if pres:
                self._trip(now, sorted(pres, key=lambda c: list(FAULTS).index(c))[0], v); return
            other = [c for c in FAULTS if c in hard]
            if other:
                self._trip(now, other[0], v); return
            soft = [c for c in ("outside_window", "raining") if c in v]
            if soft:
                self._trip(now, soft[0], v); return
            if now - self.t_start > C.ROUTINE_TIMEOUT_S[self.routine]:
                self._trip(now, "routine_timeout", v); return
            step = self.plan["steps"][self.k]
            if self.step_t == 0.0:
                r = check_soft_limits(step)
                if r:
                    self._ev(now, "soft_limit", r); self._trip(now, "soft_limit", v); return
            self.frac = self.sim.advance(step, self.frac, dt, now)
            self.step_t += dt
            if self.step_t > C.STEP_TIMEOUT_FACTOR * step.planned_s + 1.0 and self.frac < 1.0:
                self._trip(now, "step_timeout", v); return
            if self.frac >= 1.0:
                self.k += 1; self.frac = 0.0; self.step_t = 0.0
                if self.k >= len(self.plan["steps"]):
                    self.state = "DONE"; self._ev(now, "done", f"{self.routine} complete"); self.notify("info", f"{self.routine} complete")
            return
        if self.state == "FREEZE":
            # hold. Auto-retreat only when every presence sensor is clear again for the full camera hold and nothing
            # else is wrong; a person door would have gone to LOCKOUT instead.
            if not (hard & PRESENCE) and "cam_hold" not in v:
                self._ev(now, "clear", "presence cleared for CAM_CLEAR_HOLD_S -> retreat")
                self._start_retreat(now)
            return
        if self.state == "RETREAT":
            if hard & PRESENCE:
                self._trip(now, sorted(hard & PRESENCE)[0], v); return
            if self.rk >= len(self.retreat_steps):
                self.state = "STOPPED"; self._ev(now, "stopped", "retreat complete, tool out, Z at travel height")
                self.notify("info", f"{self.routine}: stopped safely ({self.fault})"); return
            st = self.retreat_steps[self.rk]
            self.rfrac = self.sim.advance(st, self.rfrac, dt, now)
            if self.rfrac >= 1.0:
                self.rk += 1; self.rfrac = 0.0
            return


# ===================================================================================== simulator
def run_scenario(plan, routine, inputs_at, t_end, dt=0.1, ctl=None, actions=None):
    """inputs_at(t) -> Inputs; actions: {t: callable(ctl)} (e.g. re-arm presses). Returns the controller."""
    ctl = ctl or RoutineController()
    ctl.request(routine, plan)
    t = 0.0
    acts = dict(actions or {})
    while t <= t_end + 1e-9:
        for ta in [k for k in acts if k <= t + 1e-9]:
            acts.pop(ta)(ctl)
        ctl.tick(inputs_at(t), dt)
        t = round(t + dt, 6)
    return ctl


def base_inputs(t, **kw):
    """All-good inputs at time t (fresh sensors, everything closed, daytime, no rain)."""
    d = dict(t=t, cam_ts=t, pir_ts=t, lc_ts=t, door_ts=t, doors=all_closed_doors())
    d.update(kw)
    return Inputs(**d)


def demo():
    reach = load_reach()
    plan = clean_plan(reach)
    eggs = egg_plan()
    rep = {"service_reeds": service_door_reeds(), "person_doors": person_door_ids()[0],
           "clean": {"soft_limit_violations": validate_plan(plan), "cycle": cycle_time(plan),
                     "cells_done": len(plan["cells_done"]), "cells_skipped": plan["cells_skipped"], "n_cells": plan["n_cells"],
                     "per_cell_arm_s": round(sum(s.planned_s for s in cell_arm_steps(190.0, (0, 0, 0), 0)), 2)},
           "egg": {"soft_limit_violations": validate_plan(eggs), "cycle": cycle_time(eggs)},
           "faults": FAULTS}
    # scenario: chicken walks in 200 s into a clean
    ctl = run_scenario(plan, "clean", lambda t: base_inputs(t, cam_clear=not (200 <= t < 230), pir_active=(201 <= t < 228)), 400)
    rep["demo_chicken_enters"] = [e.__dict__ for e in ctl.log]
    return rep


if __name__ == "__main__":
    rep = demo()
    json.dump(rep, open(os.path.join(ROOT, "reports", "CT_COOP_A_routines.json"), "w"), indent=1, default=str)
    print(json.dumps({k: rep[k] for k in ("service_reeds", "person_doors", "clean", "egg")}, indent=1, default=str))
    print(rep["demo_chicken_enters"])
