"""Write ct72_cell_a12.json for the controller (firmware/jetson-nano/ct72/) from the A1.2 CAD + the offline
reach/routine checks. Gantry no-go zones are exact Minkowski differences of every static obstacle AABB with
every gantry hardware box (plate, Z plate, tool cam = relative to pz; mast/screw/Z rail = absolute Z), so the
host can refuse any gantry target that would put hardware into coop furniture.
Usage: python export_cell_json.py <out.json>"""
import json, os, sys
import numpy as np
import ct72_params as P
import ct72_model as M
import reach_routines as R

REP = os.path.join(M.HERE, "..", "reports")


def nogo_zones(variant, roost="stowed", lid="open"):
    obs = R.obstacles(roost, lid, variant)
    # hardware boxes relative to (gx, gy, pz); 'abs_z' = z range fixed (mast group)
    t = P.ADAPTER_RINGS[variant][1]
    pxo = P.ARM_BASE_X_OFF
    hw = [("PLATE", (pxo - 125, -125, 0, pxo + 125, 125, P.ZPLATE_T), False),
          ("Z_PLATE", (-117, -60, 0, -107, 60, 150), False),
          ("CAM_TOOL", (-157, 70, 60, -127, 110, 100), False),
          ("MAST", (-81, -20, P.MAST_Z0, -41, 20, P.Z_BRIDGE1), True),
          ("Z_SCREW", (-103, 24, P.PZ_MIN, -95, 32, P.Z_BRIDGE1), True),
          ("Z_RAIL", (-91, -7.5, P.PZ_MIN, -81, 7.5, P.Z_BRIDGE1), True)]
    if variant == "starter":
        bxo = P.BASE_X_OFF["starter"]
        hw += [("TOOL", (bxo - 25, -25, -t - P.STARTER_TOOL_LEN, bxo + 25, 25, 0), False)]
    zones = []
    for on, b, sup in obs:
        if on.startswith(("TC_RAIL_X_", "TC_BELT_", "TC_IDLER_", "TC_ENDSTOP_", "TC_MOTOR_X_", "TC_CT72_FRAME_", "TC_CAM_GS_OVERHEAD")):
            continue   # frame-level parts: covered by the travel limits
        for hn, h, absz in hw:
            x0, x1 = b[0] - h[3], b[3] - h[0]
            y0, y1 = b[1] - h[4], b[4] - h[1]
            if absz:
                if h[5] <= b[2] or h[2] >= b[5]:
                    continue
                z0, z1 = P.PZ_MIN, P.PZ_MAX
            else:
                z0, z1 = b[2] - h[5], b[5] - h[2]
            # clip to travel
            x0c, x1c = max(x0, P.GX_MIN), min(x1, P.GX_MAX)
            y0c, y1c = max(y0, P.GY_MIN), min(y1, P.GY_MAX)
            z0c, z1c = max(z0, P.PZ_MIN), min(z1, P.PZ_MAX)
            if x0c < x1c and y0c < y1c and z0c < z1c:
                zones.append({"name": f"{hn}x{on}", "box": [round(v, 1) for v in (x0c, y0c, z0c, x1c, y1c, z1c)]})
    return zones


def sites(variant, reach, routines):
    paths = routines.get("approach_paths", {})
    def site(name, interior, items, key):
        aps = []
        for tname, tt in items.items():
            for kind in ("top", "side"):
                pp = paths.get(f"{key}/{tname}/{kind}")
                if pp and pp.get("ok"):
                    aps.append({"kind": kind, "target_name": tname, "target": tt["target_mm"], "gantry": pp["gantry"],
                                "pose_deg": pp.get("pose_deg"), "clear_mm": pp["clear"]})
        return {"name": name, "interior": [round(v, 1) for v in interior], "approaches": aps}
    boxes = []
    for i in range(P.NEST_BOX_COUNT):
        x0, x1, y0, y1, z0, z1 = M.nest_box_bounds(i)
        n = f"NEST_BOX_{i + 1:02d}"
        boxes.append(site(n, (x0, y0, z0, x1, y1, z1), reach["boxes"][n], n))
    x0, x1, y0, y1, z0, z1 = M.basket_bounds()
    return boxes, site("BASKET", (x0, y0, z0, x1, y1, z1), reach["basket"], "BASKET")


def main(out):
    d = {"rev": "A1.2", "units": "mm", "frame": "CAD: origin front-left-bottom frame corner, +X right, +Y back, +Z up; gantry z = plate underside",
         "travel": {"x": [P.GX_MIN, P.GX_MAX], "y": [P.GY_MIN, P.GY_MAX], "z": [P.PZ_MIN, P.PZ_MAX]},
         "park": [P.PARK["gx"], P.PARK["gy"], P.PARK["pz"]], "flock_size": P.FLOCK_SIZE, "basket_tag_id": 0,
         "grip_force_limit_n": P.GRIP_FORCE_LIMIT_N, "egg_break_n": P.EGG_BREAK_N, "vacuum_limit_kpa": P.VAC_LIMIT_KPA,
         "roost": {name: {"top_z_deployed": top, "radius": r, "pivot_x": M.roost_pivot_x(name), "y": [P.ROOST_Y0R, P.ROOST_Y0R + P.ROOST_BAR_LEN],
                          "stow": "swing down 90 deg to the right wall"} for name, top, r in P.ROOST_BARS},
         "variants": {}}
    for v in ("starter", "plus", "pro"):
        rp = os.path.join(REP, f"reach_{v}.json"); ro = os.path.join(REP, f"routines_{v}.json")
        if not (os.path.exists(rp) and os.path.exists(ro)):
            continue
        reach = json.load(open(rp)); routines = json.load(open(ro))
        boxes, basket = sites(v, reach, routines)
        cr, pz = R.clean_route(v)
        keep, cut = R.zone_filter(cr, v, R.obstacles("stowed", "closed", v))
        route, tz = [], R.transit_z(v)
        for a, b, w in R._merge(keep):
            if route and not np.allclose(route[-1], a):
                last = route[-1]
                route += [(last[0], last[1], tz), (a[0], a[1], tz)]
            if not route or not np.allclose(route[-1], a):
                route.append(a)
            route.append(b)
        d["variants"][v] = {"transit_z": tz, "nest_boxes": boxes, "basket": basket,
                            "nogo": nogo_zones(v), "clean_route": [[round(float(c), 1) for c in p] for p in route],
                            "clean_nogo_spans": routines.get("clean_nogo_spans_stowed", []),
                            "egg_plan": routines.get("egg_plan", [])}
    json.dump(d, open(out, "w"), indent=1)
    print(out, {v: (len(x["nogo"]), sum(len(b["approaches"]) for b in x["nest_boxes"]), len(x["basket"]["approaches"])) for v, x in d["variants"].items()})


if __name__ == "__main__":
    main(sys.argv[1] if len(sys.argv) > 1 else os.path.join(M.HERE, "..", "ct72_cell_a12.json"))
