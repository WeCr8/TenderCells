"""One BOM table that cross-checks every modelled electronics/mechanism part against the documents:
hardware/chicken-tender-starter/out/BOM.md + hw/*.yaml (PR #188), docs/CHICKEN_TENDER_PINOUT.md (PR #188) and
docs/CHICKEN_TENDER_BUILD_GUIDE.md section 7 (PR #189). -> reports/CT_COOP_A_showcase_bom_check.csv
Status: OK = modelled and matches; MISMATCH = model/doc disagree (see note); MISSING-IN-DOC = the design needs it
but no document lists it (showcase adds it, priced as an estimate); NOT-MODELLED = in the docs but not drawn
(fasteners, later phases); ASSUMED = placement/size the docs leave open."""
import csv, json, math, os
from collections import Counter
import sc_params as P, sc_model as M, engineering as E
import ebay_params as EP

ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
BOMD = "hardware/chicken-tender-starter/out/BOM.md (PR #188)"
HW = "hardware/chicken-tender-starter/hw/chicken-tender-starter.hw.yaml (PR #188)"
PIN = "docs/CHICKEN_TENDER_PINOUT.md (PR #188)"
GUIDE = "docs/CHICKEN_TENDER_BUILD_GUIDE.md s7 (PR #189)"
EBD = "docs/CHICKEN_TENDER_ELECTRONICS_BAY.md + ebay.py (showcase 2026-11-22)"
SVC = "service doors (Zach 2026-11-22; house.py walls/framing + service_params.py, other agent)"


def rows():
    cnt = {c: Counter(p.bom for p in M.parts(c) if p.bom) for c in M.ALL}
    def q(ref, cfgs=M.ALL):
        return max(cnt[c][ref] for c in cfgs)
    rl = M.route_lengths("plus")
    d = E.door()
    R = []
    def add(ref, item, src, doc_qty, mq, status, note="", configs="all", est_usd=""):
        R.append(dict(ref=ref, item=item, source=src, doc_qty=doc_qty, modelled_qty=mq, configs=configs, status=status, note=note, est_usd=est_usd))
    add("U1", "Seeed XIAO ESP32-S3 door controller", BOMD, 1, q("U1"), "OK", "in the control box, on the electronics plate")
    add("U2", "Pololu D36V6F5 5 V buck (#3792)", BOMD, 1, q("U2"), "OK")
    add("U3", "Pololu DRV8874 carrier (#4035), R1 20 k -> ~2.0 A limit", BOMD, 1, q("U3"), "OK")
    add("D1", "1N5817 Schottky", BOMD, 1, q("D1"), "OK")
    add("R1", "20 k VREF resistor", BOMD, 1, q("R1"), "OK")
    add("R2", "10 k DHT22 data pull-up (was R2/R3 4.7 k I2C pull-ups for the dropped DHT20)", BOMD, "2 (R2 R3)", 1 if q("R2") else 0, "OK",
        "DHT20 dropped 2026-11-22: R3 goes, R2 becomes 10 k (omit it if the DHT22 breakout already has the pull-up). Update PR #188 BOM.md", est_usd="0")
    add("M1", "12 V linear actuator, 300 mm stroke, built-in limits", BOMD, 1, 1, "OK",
        "Starter listing still 'verify listing'; model uses the parts.yaml minimums (420/720 mm hole-hole). Pro = Glideforce LACT12-12V-05")
    add("S1", "DHT22 / AM2302 temp/humidity, single-wire (replaces the I2C DHT20, Adafruit 5183)", BOMD + "; " + GUIDE, 1, q("S1"), "OK",
        "ONE per coop on the front-left post, 14 in above the floor: XIAO D4 on Base/Starter, WROOM GPIO4 on Plus/Pro (the old separate Pro DHT22 row is merged here). "
        "I2C does not like the 3.8 m run; DHT22 single-wire does. PR #188 BOM.md / door firmware still list the DHT20: swap the driver there", est_usd="+5 Base/Starter, -4.5 Plus/Pro")
    add("SW1", "22 mm mushroom E-STOP head (twist release) + NC contact blocks", BOMD + "; " + GUIDE + "; " + PIN, "1 head + 3 NC (Plus/Pro) / 1 head + 2 NC (Base/Starter)",
        "; ".join(f"{c} 1 + {EP.ESTOP_NC_BLOCKS_BY_CFG[c]} NC" for c in M.ALL) if EP.EBAY else q("SW1"), "OK",
        "DECIDED 2026-11-22: all contacts NC (fail-safe). Plus/Pro blocks: 1 XIAO DRV8874 SLEEP, 2 WROOM GPIO32, 3 EB2 motor-rail relay coil (hardware cut of every motor). "
        "Base/Starter: 1 XIAO SLEEP, 2 Starter picker TMC2209 EN (Base: spare). Catalog s14 fixed to NC. PR #188 BOM.md still lists 1 NC block: update there. Head on the back-wall station (EB-ESTOP)",
        est_usd="+3 Base/Starter, +6 Plus/Pro vs the 1-block BOM")
    add("RS1 RS2", "door reeds (closed + open) + magnet", BOMD + "; " + GUIDE, 2, 2, "OK", f"closed reed at the guide bottom, open reed {P.DOOR_LIFT:.0f} mm up")
    add("J1", "5.5x2.1 panel DC jack", BOMD, 1, q("J1"), "OK" if not EP.EBAY else "MISMATCH",
        "box bottom" if not EP.EBAY else "under-coop bay: use an IP67 panel jack (or PG9 gland + strain relief) on the EB1 bottom; the plain 5.5x2.1 jack is not weather-rated")
    add("F1", "inline 3 A blade fuse", BOMD, 1, q("F1"), "OK")
    add("PS1", "12 V Class 2 logic adapter: 3 A Base/Plus/Pro, 5 A Starter (picker)", BOMD + "; " + GUIDE, "1 (12 V 3 A)", q("PS1"), "ASSUMED",
        "DECIDED 2026-11-22: Starter upsizes to 12 V 5 A Class 2 (picker motors + vacuum pump on the same rail); Base keeps 3 A; Plus/Pro keep 3 A logic + PS2 motor rail. "
        "GFCI outlet location not given; modelled on a post ~0.9 m behind the coop", est_usd="+8 Starter (5 A vs 3 A)")
    add("TB1 TB2", "5.08 mm terminals", BOMD, 2, 2 if q("TB1 TB2") else 0, "OK", "drawn as one block")
    add("PLA/PETG", "printed parts: control box, lid, plate, clevis bracket, cord eye, door anchor, reed mount, 2 guide segments", BOMD, 1, q("PLA/PETG"), "OK",
        "door stop block assumed to be part of the printed guide segments (not stated)")
    add("PIN-M6", "M6 clevis pins (actuator both ends)", BOMD, 2, q("PIN-M6"), "OK", "fixed-end bracket drawn; rod-end pin is in the rod-end clevis")
    cl = d["cord"]
    add("CORD", "1.8 mm Dyneema door cord", BOMD, "1 m", f"{cl['with_knots_and_tails_mm'] / 1000:.2f} m incl. knots", "MISMATCH",
        f"routed path {cl['path_closed_mm']} mm + 2 x 80 mm knots/tails; the 1 m in the BOM is too short -> buy 2 m")
    add("PULLEY", "180 deg turnaround sheave (25 mm) + printed bracket", "-", 0, q("PULLEY"), "MISSING-IN-DOC",
        f"a direct rod -> cord-eye pull needs {d['direct_pull_fits']['needed_eye_to_fixed_clevis_mm']} mm from the eye to the wall clevis; the coop has {d['direct_pull_fits']['available_mm']} mm. Add a sheave by the right front post.", est_usd="4")
    add("GLAND", "PG7 cable glands", BOMD + "; " + GUIDE, 3, q("GLAND"), "OK", "BOM purpose (actuator + reeds) differs from the guide (actuator / sensors / camera-spare); count matches"
        + ("; now on the EB1 bottom (extra bay glands = EB-GLAND)" if EP.EBAY else ""))
    add("WIRE", "harness W13-W20", HW + "; " + GUIDE, "actuator 1.5 m, reeds 1.2 m, sensors 1.2 m, camera 1.5 m", "; ".join(f"{k} {v / 1000:.2f} m" for k, v in rl.items()),
        harness_status(), ("routed from the EB1 bottom glands: drip loop -> sealed chase on the back-left post -> under the left top plate -> front nailer. "
                     "len_mm (2026-11-22, ebay_params.HARNESS_LEN_MM): " + ", ".join(f"{k} {v[0]}" for k, v in EP.HARNESS_LEN_MM.items())
                     + ". 20 AWG actuator: ~0.4 V drop at 2 A, OK. DHT20 dropped (I2C on 3.8 m); DHT22 single-wire is fine. "
                     "PR #188 hw.yaml still has W13/W14 1500, W18/W19 1200, W20 100: copy these values there.")
        if EP.EBAY else "routed along the guide's path (glands -> back-left post -> under C10 -> front nailer C9): reeds need ~3.0-3.3 m, actuator ~1.8 m, DHT ~1.6 m. Update W13/W14/W18/W19/W20 len_mm.")
    if EP.EBAY:
        add("CTRL-BOX", "control box outside the back wall, top at 56 in", GUIDE, 1, 0, "MISMATCH",
            "RESOLVED by the under-coop bay: the guide-s7 box clashed with the cleanout door (only a 6 in strip left); its boards move to EB1, the E-STOP to a back-wall station. Update guide s7.")
    else:
        add("CTRL-BOX", "control box outside the back wall, top at 56 in", GUIDE, 1, 1, "MISMATCH",
            "the 36 x 28 in cleanout door spans x 6..42 in and z 29.25..57.25 in, so a box with its top at 56 in only fits in the 6 in strip left of the door (as seen from behind). Modelled 130 mm wide there; a wider box needs to go above 57.25 in or on the side wall.")
    add("CAM", "XIAO ESP32-S3 Sense camera node", GUIDE + "; " + PIN, 1, q("CAM"), "OK", "front-left upper corner, ~6 in below the roof; not in the Starter BOM (guide phase 3, ~$20)")
    add("WROOM", "ESP32-WROOM-32 DevKit V1 (coop sensor / feeder controller)", PIN + "; " + GUIDE, 1, q("WROOM", ("plus", "pro")), "OK",
        "Pro add-on; in bay EB1 lower DIN rail (Plus/Pro models). Firmware fix 818cf10 cherry-picked onto this branch 2026-11-22: PIN_STEPPER_ENABLE 33 (off strapping pin 12), NC E-STOP sense GPIO32 (CT_ESTOP_INPUT=1)"
        if EP.EBAY else "Pro add-on, second box below the control box (Plus/Pro models)", configs="plus, pro")
    add("MQ137", "MQ-137 ammonia module in a hardware-cloth cage", PIN + "; " + GUIDE, 1, q("MQ137", ("plus", "pro")), "OK",
        f"left wall, 12 in above floor, at y {P.MQ_Y / P.IN:.0f} in so it stays >= 18 in from the roost (guide gives no depth: ASSUMED)", configs="plus, pro")
    add("DIV", "MQ-137 divider 15 k top / 12 k bottom + 100 nF", PIN, 1, q("DIV", ("plus", "pro")), "OK", "x12/27 = 0.444; 5.25 V -> 2.33 V", configs="plus, pro")
    add("BUCK5", "5 V buck for WROOM + MQ-137 heater", PIN + "; " + GUIDE, 1, q("BUCK5", ("plus", "pro")), "OK", configs="plus, pro")
    add("FEEDER", "gravity feeder hung from joist C3", GUIDE, 1, 1, "OK", "motor + HX711 load cell (phase 4) not modelled")
    add("TB6600", "cleaning stepper driver (WROOM GPIO33/14/27)", PIN + "; " + GUIDE, 1, 0, "DROPPED",
        "DECIDED 2026-11-22: dropped on the gantry configs (Plus/Pro, the only tiers with the WROOM): the gantry + scraper tool T1 + T6 trowel do the cleaning, "
        "so the standalone scraper stepper + TB6600 (96 x 56 mm, 4 A) is a duplicate. Not bought, not drawn. Firmware keeps the pins (ENABLE 33, idle HIGH = off); "
        "GPIO14/27 free for bay I/O. Only a future no-gantry scraper build would add it back.", configs="-", est_usd="-10 Plus/Pro")
    add("FEED-DRV", "feeder DC motor driver (2nd DRV8874, GPIO26/25)", PIN + "; " + GUIDE, 1, q("FEED-DRV", ("plus", "pro")) if EP.EBAY else 0,
        "OK" if EP.EBAY else "NOT-MODELLED", "on the WROOM carrier in EB1" if EP.EBAY else "later phase; no mounting position in the guide", configs="plus, pro")
    add("HX711", "load cell + amplifier (feeder, phase 4)", PIN + "; " + GUIDE, 1, 0, "NOT-MODELLED",
        "later phase; mounts at the feeder (in the run), not in the bay. Use a NAU7802 (I2C) like the nest cells instead of the HX711 (no free WROOM GPIOs)")
    for ref in ("INS-M3", "SCR-M3x8", "SCR-M3x6", "SCR-WOOD"):
        add(ref, "fasteners", BOMD, "-", 0, "NOT-MODELLED", "fasteners are not drawn")
    add("C14/C15", "pop-door guides + lips", GUIDE + " step 8", 2, 2, "MISMATCH", "guide: INSIDE the front wall; the PR #189 CAD has them outside. Showcase follows the guide.")
    add("P5", "pop door clear opening", HW + " door.travel_mm 280", "11 in (279 mm)", f"{d['clear_opening_mm']['with_1/2in_overlap_and_280_lift']} mm",
        "MISMATCH", "with the closed door resting 1/2 in below the sill, a 280 mm lift leaves 267 mm (10.5 in) clear. Either stop the door at the sill or lift 292 mm (needs 302 mm with 10 mm slack: over a 300 mm stroke).")
    add("P6", "nest box (2 x 12 in)", GUIDE + " cut list", 1, 1, "MISMATCH",
        "robot options cut the outer wall, back end and divider to a 6 in rim and replace the lid with the egg-bay hood; base option = guide as written", configs="starter, plus, pro")
    add("C10", "side top nailers", GUIDE + " cut list", 2, 2, "OK", "missing from the PR #189 CAD; added in the showcase model (cable route runs under them)")
    # chain-link run + small gable roof (Zach 2026-11-21) - replaces guide R1-R10 wood run frame and the hardware-cloth run walls/roof
    import run_chainlink as RC
    half, ang, ys, z_bc = RC.roof_geom()
    run_len_ft = (P.CL_COOP_END_Y - P.CL_GATE_END_Y) / P.IN / 12
    CL = "showcase chain-link run (supersedes guide R1-R10 + run hardware cloth)"
    for ref, item, qty, usd, note in (
            ("CL-TP", "terminal post 2-3/8 in OD x 8 ft (4 corners) + 2 short back-corner posts", "6", "4 x 32 + 2 x 18", "set 24 in deep in concrete"),
            ("CL-LP", "line post 1-7/8 in OD x 8 ft", "2", "2 x 22", "mid-span; also carries the middle truss"),
            ("CL-RAIL", "top rail 1-3/8 in x 10 ft 6 in (swedged)", "3", "3 x 20", "2 sides + coop-end cross rail"),
            ("CL-FAB", "chain-link fabric 6 ft x 2 in mesh 11.5 ga (open run sides + gate)", f"~{2 * run_len_ft + 3:.0f} ft (buy 25 ft roll)", "150", "2 in mesh: raccoons reach through, snakes/weasels/rats get in - see guard toggle"),
            ("CL-FAB36", "chain-link fabric 3 ft (under-coop sides + back: 24 in exposed, ~11 in buried footer)", "~13 ft (buy 25 ft roll)", "70", ""),
            ("CL-TBAR", "tension bars 5 ft 8 in + 4 tension bands each", "4", "4 x 6", ""),
            ("CL-TBAR36", "tension bars 3 ft + 2 bands each (under-coop)", "6", "6 x 4", ""),
            ("CL-HW", "brace bands, rail end cups, loop caps, dome caps, 5/16 carriage bolts, alum. tie wires (~60)", "1 set", "45", ""),
            ("CL-TWIRE", "bottom tension wire 9 ga + hog rings", "30 ft", "15", ""),
            ("CL-CONC", "fast-set concrete 50 lb bags (8 in x 24 in holes)", "12", "12 x 7", "2 bags per full post"),
            ("CL-GATE", "chain-link walk gate for a ~43 in opening (frame ~39.5 x 70 in)", "1", "110", "replaces guide run door R8-R10"),
            ("CL-GATE-HW", "gate hinges (2 male + 2 female), fork latch + locking carabiner (two-step latch)", "1 set", "25", "guide rule: two latches per door"),
            ("RR1", "truss bottom chord 2x2", f"{len(ys)} x {(P.COOP_W - 2 * P.CL_PO + 40) / P.IN:.1f} in", "", "cut list; 2x2x8 ft"),
            ("RR2", "truss top chord 2x2 at 3:12 (14 deg ends)", f"{2 * len(ys)} x {(half + P.RUN_ROOF_OVERHANG) / math.cos(ang) / P.IN:.1f} in", "", "4 in eave overhang"),
            ("RR3", "truss king post 2x2", f"{len(ys)} x {half * math.tan(ang) / P.IN:.1f} in", "", ""),
            ("RR4", "purlins 2x2 (3 per slope)", f"6 x {(ys[-1] + 30 - ys[0] + P.RUN_ROOF_OVERHANG) / P.IN:.0f} in", "6 x 5", "2x2x8 ft stock"),
            ("RR-STRAP", "pipe straps / rail clamps, truss to top rail", f"{2 * len(ys)}", "15", ""),
            ("RR-PANEL", "corrugated steel panels 26 in wide, ribs down-slope, cut to ~2.6 ft", "10 pieces (4 x 8 ft panels)", "4 x 25", "keeps the corrugated roof; small 3:12 gable, ridge along the 12 ft length, ridge ~83 in"),
            ("RR-CAP", "ridge cap 10 ft", "1", "20", ""),
            ("RR-CLOS", "foam closure strips (eave + ridge, inside/outside)", "~12 x 3 ft", "24", ""),
            ("RR-SCREW", "#9 x 1 in roofing screws with EPDM washers", "~100 (box of 250)", "25", ""),
            ("RR-INFILL", "1/2 in hardware cloth: 2 gable triangles + coop-end ceiling strip", "~10 sq ft", "10", "closes the gap under the coop's roof overhang"),
    ):
        add(ref, item, CL, qty, "modelled" if ref not in ("CL-HW", "RR-SCREW") else "not drawn", "MISSING-IN-DOC" if ref.startswith(("CL", "RR")) else "OK", note, est_usd=usd)
    g = P.RUN_GUARD
    add("RUN_GUARD", f"predator layer toggle = {g} (none | chicken_wire | hardware_cloth_skirt), height {P.RUN_GUARD_H / P.IN:.0f} in", CL, 1, 1,
        "OK" if g == "hardware_cloth_skirt" else "MISMATCH",
        "2 in chain-link alone is NOT predator-proof. Chicken wire keeps chicks/small birds in or out but raccoons tear it and reach through; 1/2 in hardware cloth on the bottom 2-3 ft is the predator-proof pick.")
    add("HC-SKIRT", "1/2 in hardware cloth skirt 36 in x ~50 ft roll + hog rings / zip ties (~150)", CL, "1 roll", 1 if g == "hardware_cloth_skirt" else 0, "OK", "recommended option", est_usd="95")
    add("CW-LAYER", "1 in 20 ga chicken wire 36 in (lower) or 72 in (full) x 50 ft + hog rings / zip ties (~150)", CL, "1 roll", 1 if g == "chicken_wire" else 0, "OK", "alternative, NOT predator-proof", est_usd="35 (36 in) / 60 (72 in)")
    add("APRON", f"predator apron 1/2 in hardware cloth 12 in wide, {P.RUN_APRON}", GUIDE + " + showcase", "~40 ft", 1, "OK",
        "recommended: buried 2-4 in (L-footer). The guide's surface apron is still an option (RUN_APRON=surface)", est_usd="45")
    # robot options (showcase additions)
    for ref, item, cfgs, usd in (("HOOD", "egg-bay hood (ply/polycarbonate) + hinged collection door", "starter, plus, pro", "60"),
                                 ("LINER", "nest pads (2); centering (dished) pads for Starter/Plus", "all", "20"),
                                 ("BASKET", "shallow padded egg tray + AprilTag tag36h11 id0", "starter, plus, pro", "10"),
                                 ("ST-RAIL", "Starter Y rail (20x40 + MGN9) + carriage", "starter", "45"),
                                 ("ST-Z", "Starter Z plunger (T8 lead screw)", "starter", "20"),
                                 ("ST-MOT", "2 x NEMA17 + 2 x TMC2209", "starter", "42"),
                                 ("ST-CUP", "20 mm silicone bellows cup + tube", "starter", "8"),
                                 ("ST-PUMP", "12 V vacuum pump + valve + pressure sensor", "starter", "35"),
                                 ("PLUS-MOUNT", "SO-101 mount plate", "plus", "15"),
                                 ("PRO-RAIL", "Pro Y gantry (2040 + MGN12) + carriage", "pro", "60"),
                                 ("PRO-MOT", "Pro NEMA17 + GT2 + driver", "pro", "30")):
        add(ref, item, "showcase (not in any doc)", 0, 1, "MISSING-IN-DOC", "robot option part, rough price", configs=cfgs, est_usd=usd)
    if EP.EBAY:
        ebay_rows(add, q)
    service_door_rows(add)
    app_gap_rows(add)
    safety_rows(add, q)
    covered = {r["ref"] for r in R} | {"PLA/PETG", "R2", "TB1 TB2", "WIRE", "OUTLET"}
    allkeys = set().union(*[set(cnt[c]) for c in M.ALL])
    for k in sorted(allkeys - covered):
        cf = ", ".join(c for c in M.ALL if cnt[c][k])
        add(k, "modelled part with no BOM row (auto audit)", "sc_model parts (bom key)", "-", max(cnt[c][k] for c in M.ALL), "NO-BOM-ROW",
            "drawn in the CAD but nothing in the BOM tables prices it: add a row", configs=cf)
    return R


def ebay_rows(add, q):
    """Under-coop electronics bay (est prices ASSUMED, no purchases)."""
    E2 = ", ".join(EP.EB2_CFGS)
    for ref, item, qty, cfgs, usd, note in (
        ("EB-ENCL", EP.ENCL_NAME, "1 (Base/Starter) / 2 (Plus/Pro)", "all", "45 each", "EB1 door + sensor box; EB2 motion box. ASSUMED size class (300 x 200 x 130 swings under the pan; 250 tall does not)"),
        ("EB-TRAY", "drop-down tray: 6 mm HDPE plate, 2 stainless lift-off hinges, 2 stay arms + chain, spring plunger pin, pull handle", "1 per box", "all", "28 each", "no tools: pull the pin, tray tips back 90 deg, lid faces up"),
        ("EB-HANGER", "hanger frame: 1-1/2 in aluminium angle (2 legs + crossbar), M6 through-bolts + fender washers into the pit pan", "1 per box", "all", "18 each", ""),
        ("EB-DRIP", "drip roof 18 ga aluminium, 40 mm overhang, front drip edge, nylon spacers (5 mm air gap)", "1 per box", "all", "12 each", ""),
        ("EB-DIN", "35 mm DIN rail 260 mm", "2 per box", "all", "3 each", ""),
        ("EB-TB", "DIN terminal blocks (12 V / GND / 5 V buses, E-STOP loop, field terminals) + end stops + jumpers", "1 set per box", "all", "20 each", "Wago 221 DIN carriers are a fine alternative"),
        ("EB-GLAND", "extra cable glands (PG7 E-STOP, PG9 multi-hole, PG13.5 motor rail) - all on the box BOTTOM", "1-2 (EB1) + 6 (EB2)", "all", "1.5 each", "unused holes get blanking plugs"),
        ("EB-VENT", "M12 IP67 membrane breather vent (ePTFE), box bottom", "1 per box", "all", "4 each", "stops pumping condensation on day/night swings"),
        ("EB-CHASE", "sealed chase: 1-1/2 in Sch40 grey PVC (~0.9 m), bell end down, LB body + gasketed cover, duct seal, 3 straps, 1/2 in HC peck sleeve", "1", "all", "25", "one chase for both boxes, front face of the back-left post"),
        ("EB-RACE", "EB2 raceway: 1 in Sch40 PVC (~1.0 m), 2 sweep elbows, sweep tee into the chase", "1", E2, "12", "runs in front of the cassette gearmotor"),
        ("EB-HATCH", "service hatch in the back under-coop skirt: 1x2 PT frame, 1/2 in HC, 2 T-hinges (bottom), barrel bolt + locking carabiner, padlock hasp", "1 per box", "all", "22 each", "chain-link fabric cut + bound to the frame with tension wire / hog rings (run_chainlink.back_openings cuts the drawn fabric; ebay.py checks it)"),
        ("EB-ESTOP", "1-hole IP65 22 mm E-STOP station box (back wall, left of the cleanout, 43 in)", "1", "all", "12", "contact blocks counted in SW1 (NC only: 3 Plus/Pro, 2 Base/Starter)"),
        ("EB-FUSE", "DIN 6-way ATC blade fuse block + fuses (motor rail)", "1", E2, "18", ""),
        ("EB-RLY", "motor-rail relay 12 V coil 30 A + DIN socket (coil via E-STOP NC block 3) + flyback diode", "1", E2, "15", "hardware motor cut on Plus/Pro"),
        ("EB-GCTL", "4-axis ESP32 motion controller with 4 x TMC2209 (FluidNC-class), UART to the WROOM", "1", E2, "45", "ASSUMED part; no gantry controller in any doc yet"),
        ("CAS-DRIVE", "bed cassette drive: 12 V worm gearmotor + encoder, M1.5 rack 3 x 400, 20T pinion, Pololu G2 18v17-class driver", "1 set", E2, "95", "drawn in house.py; driver now in EB2"),
        ("CAS-LS", "cassette limit switches (home / 24 in service / full) + slot-flap switch, IP67 roller micro", "4", E2, "4 x 6", "drawn in house.py; terminals in EB2"),
        ("EB-BUS", "SO-101 bus-servo adapter (Feetech URT-1 class)", "1", E2, "12", "arm host (Pi 5 / Jetson) stays indoors or in the egg bay, NOT in the bay (heat)"),
        ("EB-DCDC", "12 -> 6 V 5 A buck (damper servos x3 + tiller fold servo)", "1", E2, "10", ""),
        ("PS2", EP.PS_MOTOR, "1", E2, "30", "DECIDED 2026-11-22. Motor-rail budget ~10.6 A peak if everything ran at once; firmware interlock keeps gantry and cassette apart -> ~8 A. Starter picker: PS1 upsized to 12 V 5 A Class 2 instead (no PS2)"),
        ("EB-COAT", "conformal coating (acrylic, MG 419D class) for all bay PCBs except connectors / XIAO antenna", "1 can", "all", "20", ""),
        ("EB-DESIC", "rechargeable silica-gel desiccant pack 40 g (tie-wrapped inside the lid)", "1 per box", "all", "4 each", "swap each winter"),
        ("EB-LOOM", "split loom + UV zip ties for the drip loops / chase run", "3 m", "all", "8", ""),
    ):
        add(ref, item, EBD, qty, q(ref) if ref not in ("EB-COAT", "EB-DESIC", "EB-LOOM") else "not drawn", "MISSING-IN-DOC", note, configs=cfgs, est_usd=usd + " ASSUMED")


def harness_status():
    """OK when every routed run (worst tier) fits inside its HARNESS_LEN_MM buy length."""
    worst = {}
    for c in M.ALL:
        for k, v in M.route_lengths(c).items():
            worst[k] = max(worst.get(k, 0), v)
    bad = [w for w, (L, route, _) in EP.HARNESS_LEN_MM.items() if worst.get(route, 0) > L]
    return "OK" if not bad else "MISMATCH"


def safety_rows(add, q):
    """CLEAN/EGG safety sensors (docs/CHICKEN_TENDER_ROBOT_SAFETY.md s2.5) + T6. Prices ASSUMED, no purchases.
    Roost load cells: optional, default OFF (clean_params.ROOST_LOADCELLS; camera + PIR cover the roost)."""
    import clean_params as C
    SAF = "docs/CHICKEN_TENDER_ROBOT_SAFETY.md s2.5 (2026-11-22)"
    nadc = C.LOADCELL["n_adc"]
    for ref, item, qty, mq, usd, note in (
        ("PIR1", "AM312 mini PIR 3.3 V (front-right upper corner)", "1", "not drawn", "2", "WROOM MCP23017 INT + FluidNC feed_hold"),
        ("RS-EGGBAY", "egg-bay door reed (NC-when-home)", "1", "not drawn", "3", "series relay-coil chain + MCP23017"),
        ("RS1B", "second pop-door closed reed (FluidNC safety_door_pin)", "1", "not drawn", "3", ""),
        ("LC-NEST", "5 kg bar load cell per nest box", "2", "not drawn", "2 x 6", "required for the EGG routine"),
        ("LC-ADC", f"NAU7802 I2C load-cell ADC x{nadc} + TCA9548A I2C mux (fixed 0x2A address)", "1 set", "not drawn", "11" if nadc == 2 else "15",
         "WROOM I2C GPIO21/22; NAU7802 chosen over HX711 (no free WROOM GPIOs)"),
        ("LC-ROOST", "4 x 50 kg half-bridge cells + NAU7802 under the roost", "0 (optional, default OFF)" if not C.ROOST_LOADCELLS else "1 set", "not drawn",
         "0 (8 if fitted)" if not C.ROOST_LOADCELLS else "8", "DECIDED 2026-11-22: optional; camera 60 s clear hold + PIR already cover roost presence. ROOST_LC=1 turns the check back on"),
        ("RAIN1", "rain plate (YL-83 class) on the run roof", "1", "not drawn", "3", "or a weather API"),
        ("WD1", "retriggerable hardware watchdog (TPL5010 / 555 class) on the relay-coil chain", "1", "not drawn", "4", ""),
        ("TOOL-T6", "T6 slotted trowel 150 x 80, PETG-CF print (~58 g)", "1", q("TOOL-T6", ("plus", "pro")), "4", "hangs edge-on at dock x 824 (tools_cad.dock_parts, now in the scene)"),
    ):
        add(ref, item, SAF, qty, mq, "MISSING-IN-DOC", note, configs="plus, pro", est_usd=usd + " ASSUMED")


def service_door_rows(add):
    """Service-door hardware (doors drawn by the service-door agent). Prices ASSUMED, no purchases."""
    for ref, item, qty, usd, note in (
        ("SD-HINGE", "6 in galvanised/black strap hinges (large left side door, back service door) + 3 in T-hinges (right lower bedding panel)", "6 strap + 2 T", "6 x 6 + 2 x 4", "exterior screws, through-bolt the strap hinge leaf into the post"),
        ("SD-LATCH", "two-step latches: barrel bolt + spring snap / locking carabiner on each door (raccoon-proof)", "3 sets", "3 x 9", "guide rule: two latching actions per door"),
        ("SD-EPDM", "EPDM D-profile weatherstrip, self-adhesive", "~10 m", "18", "door stops + bedding panel"),
        ("SD-DRIP", "Z-flashing drip cap over each door head (aluminium)", "3 x ~1.2 m", "3 x 8", "tuck under the siding above"),
        ("SD-REED", "door-closed reed switches (NC/NO surface, wired to WROOM spare inputs, e.g. GPIO16/17/39)", "3", "3 x 5", "app can alert 'service door open at dusk'; inputs ASSUMED, not in firmware"),
    ):
        add(ref, item, SVC, qty, "drawn by service-door agent", "MISSING-IN-DOC", note, est_usd=usd + " ASSUMED")


def app_gap_rows(add):
    """Hardware the CAD/app expects with no controller pin / firmware yet (found in the 2026-11-22 review)."""
    for ref, item, cfgs, note in (
        ("IO-FAN", "exhaust fan PWM (25 kHz) + tach, damper servos x3, cassette PWM/DIR/CS + 4 limits", "plus, pro",
         "no pin in PINOUT / firmware. Proposal: WROOM GPIO23 fan PWM (LEDC 25 kHz), GPIO34 tach, PCA9685 on I2C 21/22 for 3 dampers + tiller fold, G2 PWM/DIR on 18/19, CS on GPIO36, limits on MCP23017 (same I2C). ASSUMED"),
        ("BED-SENS", "bed temperature: DS18B20 stainless probe (house.py); catalog s9 'BME280' line fixed 2026-11-22", "plus, pro",
         "DECIDED: DS18B20 stainless (waterproof, to 125 C, 1-wire on GPIO16 + 4.7 k); a BME280 cannot be buried in wet litter. Catalog now says DS18B20"),
        ("PULLEY-NOTE", "door actuator 760 mm direct pull vs 483 mm available", "all",
         "keep the turnaround sheave (PULLEY row) - or switch the Starter to a 200 mm stroke actuator with a 2:1 cord block (ASSUMED alternative)"),
    ):
        add(ref, item, "2026-11-22 app/firmware review", "-", 0, "MISSING-IN-DOC", note, configs=cfgs)


if __name__ == "__main__":
    R = rows()
    p = os.path.join(ROOT, "reports", "CT_COOP_A_showcase_bom_check.csv")
    with open(p, "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=list(R[0].keys())); w.writeheader(); w.writerows(R)
    from collections import Counter as C
    print(C(r["status"] for r in R), len(R))
