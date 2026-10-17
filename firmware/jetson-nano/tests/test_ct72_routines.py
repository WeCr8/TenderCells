import datetime as dt

import pytest

from ct72.cell import Cell, ZoneViolation
from ct72.gantry import SimGantry
from ct72.roost import RoostController, RoostInterlock, SimCellIO
from ct72.routines import CellRoutines, Egg, SimTool, tool_dir

NOON = dt.datetime(2026, 10, 17, 10, 45)


def make(variant="plus", birds_on_roost=0, hen_in=(), eggs_per_box=1, lid_open=True, floor_birds=0, now=NOON, fail_boxes=()):
    cell = Cell.load(variant=variant)
    g = SimGantry(cell); g.home(); g.park()
    io = SimCellIO()
    roost = RoostController(io, camera_birds_in_roost_zone=lambda: (birds_on_roost, __import__("time").monotonic()),
                            gantry_clear_of_roost=lambda: g.parked)
    def detect(box):
        site = [s for s in cell.nest_boxes if s.name == box][0]
        x0, y0, z0, x1, y1, z1 = site.interior
        return [Egg(box, ((x0 + x1) / 2 + 10, (y0 + y1) / 2 - 10, z0 + 22))] * eggs_per_box
    tool = SimTool(fail_boxes)
    r = CellRoutines(cell, g, tool, roost, io, detect, lambda: floor_birds, lambda b: b in hen_in, lambda: lid_open, now=lambda: now)
    return r, g, io, tool


@pytest.mark.parametrize("variant", ["starter", "plus", "pro"])
def test_egg_routine_end_to_end(variant):
    r, g, io, tool = make(variant)
    rep = r.egg_collection()
    assert rep.state == "DONE", rep.error
    assert rep.eggs_collected == len(r.cell.nest_boxes)
    assert rep.trace[1] == "RETRACT_ROOSTS" and rep.trace[-2] == "DEPLOY_ROOSTS"
    assert all(b.position == "deployed" for b in io.bars.values())
    assert g.parked


def test_side_approach_when_lid_closed():
    r, g, io, tool = make("plus", lid_open=False)
    rep = r.egg_collection()
    assert rep.state == "DONE", rep.error
    assert all(e.approach == "side" for e in rep.log if e.ok)


def test_starter_has_no_side_approach_so_closed_lid_aborts():
    r, *_ = make("starter", lid_open=False)
    rep = r.egg_collection()
    assert rep.state == "FAULT" and "no usable approach" in rep.error


def test_hen_in_box_is_skipped():
    r, *_ = make("plus", hen_in=("NEST_BOX_01",))
    rep = r.egg_collection()
    assert rep.state == "DONE" and rep.boxes_skipped == ["NEST_BOX_01"] and rep.eggs_collected == 1


def test_bird_on_roost_blocks_retraction():
    r, g, io, tool = make("plus")
    io.bars["A"].load_kg = 2.4
    rep = r.egg_collection()
    assert rep.state == "FAULT" and "load" in rep.error
    assert io.bars["A"].position == "deployed"


def test_camera_sees_bird_blocks_retraction():
    r, *_ = make("plus", birds_on_roost=1)
    rep = r.egg_collection()
    assert rep.state == "FAULT" and "camera sees 1" in rep.error


def test_outside_window_and_floor_birds_refused():
    r, *_ = make("plus", now=dt.datetime(2026, 10, 17, 3, 0))
    assert "schedule window" in r.egg_collection().error
    r, *_ = make("plus", floor_birds=2)
    assert "on the cell floor" in r.egg_collection().error


def test_failed_grip_counts_and_continues():
    r, *_ = make("plus", fail_boxes=("NEST_BOX_02",))
    rep = r.egg_collection()
    assert rep.state == "DONE" and rep.eggs_collected == 1 and rep.eggs_failed == 1


def test_cleaning_route_retracts_and_respects_zones():
    r, g, io, tool = make("plus", now=dt.datetime(2026, 10, 17, 12, 30))
    rep = r.cleaning()
    assert rep.state == "DONE", rep.error
    assert rep.trace[:3] == ["PREFLIGHT", "RETRACT_ROOSTS", "CLEAN_PASS"]
    assert len(g.moves) > 10


def test_zone_guard_refuses_mast_into_nest_bank():
    cell = Cell.load(variant="plus")
    with pytest.raises(ZoneViolation):
        cell.check_target((cell.travel["x"][0], 600.0, 1300.0))


def test_every_offline_approach_passes_the_online_guard():
    for v in ("starter", "plus", "pro"):
        cell = Cell.load(variant=v)
        for s in cell.nest_boxes + [cell.basket]:
            assert s.approaches, s.name
            for a in s.approaches:
                d = tool_dir(a.pose_deg)
                pre = tuple(gc - dc * 100 for gc, dc in zip(a.gantry, d))
                cell.check_target(a.gantry); cell.check_target(pre)


def test_roost_move_refused_unless_gantry_parked():
    io = SimCellIO()
    rc = RoostController(io, lambda: (0, __import__("time").monotonic()), lambda: False)
    with pytest.raises(RoostInterlock):
        rc.move("stowed")
