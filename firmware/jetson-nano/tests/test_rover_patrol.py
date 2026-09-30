"""Rover weed patrol: coverage around zones, property-placed weeds, scout vs laser, animals
seen on the route, water-leak checks at water points, and the MQTT service wiring."""
import json

import pytest

from rover_patrol import (RoverConfig, RoverWeedPatrol, ScoutOnly, SimDrive, SimRoverDetector, animal_group,
                          coverage_route, frame_to_property, heading_to, water_point_at)
from weed_patrol import LaserController
from weed_patrol_service import WeedPatrolService
from zones import ZoneGuard, ZoneViolation

CFG = RoverConfig(width_ft=40, depth_ft=30, item_id="rover")
SELF = {"itemId": "rover", "x": 2, "y": 26, "width": 3, "depth": 2}


def square(zid, kind, x0, y0, x1, y1):
    return {"id": zid, "name": zid, "kind": kind, "poly": [[x0, y0], [x1, y0], [x1, y1], [x0, y1]]}


def zones(*zs):
    return ZoneGuard.from_payload({"v": 1, "units": "ft", "self": SELF, "zones": list(zs)})


class Clock:
    def __init__(self):
        self.t = 1000.0

    def __call__(self):
        return self.t


def make(has_laser=False, animals=(), leaking=(), clock=None):
    laser = LaserController(lambda on: None, lambda on: None, lambda: True, sleeper=lambda s: None,
                            student_mode=not has_laser, burn_enabled=has_laser)
    events = []
    det = SimRoverDetector(CFG, weeds=20, seed=3, animals=animals or [(38.5, 28.5, "Hen")], leaking=leaking)
    patrol = RoverWeedPatrol(CFG, det, SimDrive((20, 27)), laser, events.append, has_laser=has_laser,
                             clock=clock or Clock())
    return patrol, events


# ── geometry (same numbers as the OS roverPlan tests) ─────────────────────────
def test_frame_math_matches_the_os():
    assert frame_to_property((10, 10, 0), 2, 0) == (10, 8)   # north = up
    assert frame_to_property((10, 10, 90), 2, 0) == (12, 10)  # east
    assert frame_to_property((10, 10, 0), 0, 1) == (11, 10)  # right of north = east
    assert heading_to((0, 0), (0, 5)) == 180


def test_coverage_skips_no_go_zones():
    g = zones(square("septic", "no-go", 10, 10, 18, 18))
    pts = coverage_route({"x": 0, "y": 0, "width": 40, "depth": 30}, g, 4, 2)
    assert len(pts) > 50
    assert all(g.blocking(x, y, "drive") is None for x, y in pts)


# ── weeds ─────────────────────────────────────────────────────────────────────
def test_pass_reports_weeds_with_property_positions_for_a_scout():
    patrol, events = make()
    found = patrol.run_passes(1)
    weeds = [e for e in events if e["type"] == "weed_detected"]
    assert weeds and all(e["scout"] is True and e["itemId"] == "rover" for e in weeds)
    assert all(0 <= e["propFt"]["x"] <= 40 and 0 <= e["propFt"]["y"] <= 30 for e in weeds)
    w = next(f for f in found if f["id"].startswith("rweed-"))
    with pytest.raises(ScoutOnly):
        patrol.approve(w["id"], "burn")
    assert patrol.ack_alert(w["id"])["status"] == "treated"  # "Pulled it"


# ── animals ───────────────────────────────────────────────────────────────────
def test_animals_on_the_route_are_reported_once_with_their_group():
    patrol, events = make(animals=[(20, 14, "Hen"), (30, 6, "Fox")])
    patrol.run_passes(1, "weed")
    animals = [e for e in events if e.get("finding") == "animal"]
    by_label = {e["label"]: e for e in animals}
    assert by_label["Hen"]["animalGroup"] == "flock" and by_label["Hen"]["title"] == "Hen outside the run"
    assert by_label["Fox"]["animalGroup"] == "predator" and "coop" in by_label["Fox"]["detail"]
    # One sighting per animal per pass, even though it is in frame from several stops.
    assert sorted(e["label"] for e in animals) == ["Fox", "Hen"]
    assert animal_group("snake") == "predator" and animal_group("wombat") == "wildlife"


def test_laser_holds_near_a_recently_seen_animal():
    clock = Clock()
    patrol, _ = make(has_laser=True, animals=[(20, 14, "Cat")], clock=clock)
    patrol.run_passes(1)
    cat = next(a for a in patrol.alerts.values() if a["label"] == "Cat")
    w = {"id": "rweed-900", "x": cat["x"] + 4, "y": cat["y"], "size_mm": 30, "confidence": 0.9, "status": "pending_review"}
    patrol.weeds[w["id"]] = w
    with pytest.raises(ZoneViolation, match="Cat seen 4 ft away"):
        patrol.approve(w["id"], "burn")
    clock.t += 11 * 60  # the cat has moved on
    assert patrol.approve(w["id"], "burn")["status"] == "treated"


# ── water leaks ───────────────────────────────────────────────────────────────
def test_each_water_point_is_checked_once_per_pass_and_leaks_are_located():
    patrol, events = make(leaking={"tap"})
    patrol.set_water_points([{"id": "tap", "name": "Spigot", "x": 6.5, "y": 18.5, "radiusFt": 6.5},
                             {"id": "trough", "name": "Goat trough", "x": 30, "y": 10, "radiusFt": 7}])
    checks = []
    real = patrol.leak_detector.check
    patrol.leak_detector.check = lambda p, pose, cfg: (checks.append(p["id"]), real(p, pose, cfg))[1]
    patrol.run_passes(2)
    assert sorted(checks) == ["tap", "trough", "trough"]  # open leak at the tap is not re-checked
    leaks = [e for e in events if e.get("finding") == "leak"]
    assert len(leaks) == 1
    leak = leaks[0]
    assert leak["station"] == "tap" and leak["title"] == "Water leak at Spigot" and leak["status"] == "active"
    assert water_point_at(patrol.water_points, leak["propFt"]["x"], leak["propFt"]["y"])["id"] == "tap"
    patrol.ack_alert(leak["id"])  # "Fixed"
    assert events[-1]["status"] == "cleared" and events[-1]["finding"] == "leak"


def test_bad_water_points_are_rejected():
    patrol, _ = make()
    with pytest.raises((KeyError, ValueError, TypeError)):
        patrol.set_water_points([{"id": "x", "x": "near the shed"}])
    with pytest.raises(ValueError):
        patrol.set_water_points([{"id": "x", "x": 1, "y": 1, "radiusFt": 0}])


# ── service ───────────────────────────────────────────────────────────────────
def test_service_pass_takes_area_and_water_points_and_reports_pose():
    patrol, _ = make(leaking={"tap"})
    pub = []
    svc = WeedPatrolService("rover_001", patrol, lambda t, b, q, r: pub.append((t, b)))
    svc.handle("tc/rover_001/cmd/weed", json.dumps({
        "seq": 1, "action": "pass", "passes": 1, "task": "patrol",
        "area": {"x": 0, "y": 0, "width": 40, "depth": 30},
        "waterPoints": [{"id": "tap", "name": "Spigot", "x": 6.5, "y": 18.5}],
    }).encode())
    svc.wait_idle()
    assert [b for t, b in pub if t.endswith("/ack")][0] == {"seq": 1, "ok": True}
    events = [b for t, b in pub if t.endswith("/event")]
    assert any(e.get("finding") == "leak" for e in events)
    assert not any(e["type"] == "weed_detected" for e in events)  # patrol task: alerts only
    state = [b for t, b in pub if t.endswith("state/weed")][-1]
    assert set(state["pose"]) == {"xFt", "yFt", "headingDeg"}

    svc.handle("tc/rover_001/cmd/weed", json.dumps({"seq": 2, "action": "pass", "waterPoints": [{"id": "t"}]}).encode())
    ack = [b for t, b in pub if t.endswith("/ack")][-1]
    assert ack["ok"] is False and "Bad coverage" in ack["error"]


def test_service_refuses_burn_on_a_scout():
    patrol, _ = make()
    patrol.run_passes(1)
    pub = []
    svc = WeedPatrolService("rover_001", patrol, lambda t, b, q, r: pub.append((t, b)))
    weed_id = next(iter(patrol.weeds))
    svc.handle("tc/rover_001/cmd/weed", json.dumps({"seq": 5, "action": "approve", "eventId": weed_id, "mode": "burn"}).encode())
    ack = [b for t, b in pub if t.endswith("/ack")][-1]
    assert ack["ok"] is False and "camera only" in ack["error"]
