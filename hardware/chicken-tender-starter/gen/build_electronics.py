#!/usr/bin/env python3
"""Chicken Tender Starter electronics generator + electrical rule check (tc-hw/1).

Reads hw/chicken-tender-starter.hw.yaml (+ hw/variants/*.overlay.yaml) and hw/parts.yaml, writes:
  out/netlist.json, out/netlist.net (KiCad-style s-expression, nets only)
  out/wiring.svg
  out/bom_starter.csv, out/bom_pro.csv, out/BOM.md (both actuator tiers + totals)
  out/electrical_checks.json, out/ELECTRICAL_CHECKS.md
Usage: python gen/build_electronics.py [--check]   (--check exits 1 on any FAIL)
Only needs PyYAML.
"""
import copy, csv, json, os, sys
import yaml

HERE = os.path.dirname(os.path.abspath(__file__))
ROOT = os.path.normpath(os.path.join(HERE, ".."))
HW = os.path.join(ROOT, "hw")
OUT = os.path.join(ROOT, "out")


# ----------------------------------------------------------------------------- loading
def deep_merge(a, b):
    if not isinstance(a, dict) or not isinstance(b, dict):
        return copy.deepcopy(b)
    out = copy.deepcopy(a)
    for k, v in b.items():
        if v is None:
            out.pop(k, None)
        elif k == "harness":
            out["harness"] = copy.deepcopy(v)
        elif isinstance(v, dict) and isinstance(out.get(k), dict):
            out[k] = deep_merge(out[k], v)
        else:
            out[k] = copy.deepcopy(v)
    return out


def catalog():
    return yaml.safe_load(open(os.path.join(HW, "parts.yaml")))


def load(tier):
    base = yaml.safe_load(open(os.path.join(HW, "chicken-tender-starter.hw.yaml")))
    if tier != "starter":
        base = deep_merge(base, yaml.safe_load(open(os.path.join(HW, "variants", tier + ".overlay.yaml"))))
    return base


TIERS = ["starter", "pro"]
CAT = catalog()


# ----------------------------------------------------------------------------- checks
checks = []


def C(tier, name, result, detail, conf="checked"):
    checks.append(dict(tier=tier, check=name, result=result, detail=detail, data=conf))


def current_limit(hw):
    drv = CAT[hw["parts"]["U3"]["part"]]
    r1 = CAT[hw["parts"][hw["current_limit"]["r_vref_gnd"]]["part"]]["ohm"]
    vsleep = hw["current_limit"]["sleep_v"]
    vref = vsleep * r1 / (drv["r_vref_pullup_ohm"] + r1)
    k = drv["a_ipropi_uA_per_A"] * 1e-6 * drv["r_cs_ohm"]          # V per A at CS
    return vref, vref / k, k


def run_checks(tier):
    hw = load(tier)
    board = CAT[hw["board"]["part"]]
    bpins = board["pins"]
    pins = hw["pins"]
    drv = CAT[hw["parts"]["U3"]["part"]]
    reg = CAT[hw["parts"]["U2"]["part"]]
    act = CAT[hw["parts"]["M1"]["part"]]
    sup = CAT[hw["supply"]["part"]]
    fuse = CAT[hw["supply"]["fuse"]["part"]]
    door = hw["door"]
    flags = hw["firmware"]["flags"]

    # 1. pin map = the specified map
    want = {"D0": "MOT_EN", "D1": "MOT_PH", "D2": "DRV_nFAULT", "D3": "DRV_CS", "D4": "I2C_SDA", "D5": "I2C_SCL",
            "D6": "SPARE_D6", "D7": "DRV_EN_RAW", "D8": "REED_CLOSED", "D9": "REED_OPEN", "D10": "ESTOP_SENSE"}
    bad = [p for p, n in want.items() if pins.get(p, {}).get("net") != n]
    C(tier, "pin map matches the spec (D0 PWM, D1 dir, D2 fault, D3 CS, D4/D5 I2C, D6 spare, D7 enable via E-STOP, D8/D9 reeds, D10 E-STOP sense)",
      "FAIL" if bad else "PASS", "mismatch: %s" % bad if bad else "11/11 header pins as specified")

    # 2. pin constraints
    issues = []
    for p, d in pins.items():
        bp = bpins[p]
        if bp.get("strapping") and d["dir"] != "in":
            issues.append("%s strap pin driven" % p)
        if bp.get("boot_activity", "").startswith("U0TXD") and d["dir"] == "out":
            issues.append("%s toggles at boot but is an output" % p)
        if d.get("func") == "adc" and not str(bp.get("adc", "")).startswith("ADC1"):
            issues.append("%s ADC not on ADC1" % p)
    C(tier, "pin constraints (strap pin input-only, boot-log pin unused, ADC on ADC1)", "FAIL" if issues else "PASS",
      "; ".join(issues) or "D2 (GPIO3 strap) is a pulled-up input; D6 (U0TXD) spare; D3 = ADC1_CH3 works with Wi-Fi; "
      "D7 (U0RXD) is Hi-Z during boot and the carrier pulls SLEEP low, so the driver stays asleep through reset")

    # 3. netlist integrity: each node in exactly one net, every pin net exists
    seen, dup = {}, []
    for net, nodes in hw["nets"].items():
        for n in nodes:
            if n in seen:
                dup.append("%s in %s and %s" % (n, seen[n], net))
            seen[n] = net
    missing = [p for p, d in pins.items() if d["net"] not in hw["nets"] and not d["net"].startswith("SPARE") and d["net"] != "ESTOP_SENSE"]
    sense_ok = "U1.D10" in hw["nets"]["DRV_SLEEP"] and "SW1.2" in hw["nets"]["DRV_SLEEP"] and "SW1.1" in hw["nets"]["DRV_EN_RAW"]
    C(tier, "netlist integrity (no node in two nets, every pin net present)", "FAIL" if dup or missing else "PASS",
      "; ".join(dup + missing) or "%d nets, %d nodes" % (len(hw["nets"]), len(seen)))

    # 4. E-STOP topology
    C(tier, "E-STOP is hardware: NC contact in series D7 -> SW1 -> DRV8874 SLEEP, D10 senses SLEEP",
      "PASS" if sense_ok and drv["sleep_default"] == "low" and CAT[hw["parts"]["SW1"]["part"]]["contacts"] == "NC" else "FAIL",
      "Pressing the button or cutting either wire lets the carrier pull SLEEP low -> outputs Hi-Z (coast); the worm drive holds the door. "
      "Not a certified safety function (no redundancy/monitoring category) - it is a kid-friendly hard stop.")

    # 5. PH/EN mode
    C(tier, "DRV8874 PMODE tied to GND (PH/EN latched on wake)", "PASS" if "U3.PMODE" in hw["nets"]["GND"] else "FAIL",
      "Carrier leaves PMODE floating (= independent half-bridge); the plate ties it to GND")

    # 6. current limit
    vref, ilim, k = current_limit(hw)
    tgt, tol = hw["current_limit"]["target_A"], hw["current_limit"]["tolerance_A"]
    C(tier, "driver current limit ~2.0 A (R1 20 k VREF->GND with carrier 10 k pull-up to SLEEP = 3.3 V)",
      "PASS" if abs(ilim - tgt) <= tol and ilim <= drv["cont_A"] else "FAIL",
      "VREF = 3.3 x 20k/(10k+20k) = %.2f V; I_lim = VREF / (450 uA/A x 2.49 k = %.3f V/A) = %.2f A (<= %.1f A carrier continuous)" % (vref, k, ilim, drv["cont_A"]))

    # 7. CS within ADC range at the limit
    vcs = ilim * k * 1000
    C(tier, "current-sense voltage inside the ADC span at the limit", "PASS" if vcs < board["adc_full_scale_mV"] else "FAIL",
      "CS at %.2f A = %.0f mV < %d mV" % (ilim, vcs, board["adc_full_scale_mV"]))

    # 8. firmware jam threshold below the hardware limit
    oc = flags["OVERCURRENT_MA"] / 1000
    C(tier, "firmware jam threshold below the hardware limit", "PASS" if oc < ilim else "FAIL",
      "%.2f A < %.2f A (nFAULT also asserts while chopping; firmware holds 600 ms before faulting)" % (oc, ilim))

    # 9. actuator running current at door load vs limit
    frac = door["load_N_est"] / act["force_N"]
    i_run = act["i_noload_A"] + (act["i_maxload_A"] - act["i_noload_A"]) * frac
    conf = act.get("current_status", "estimate")
    C(tier, "actuator running current at the door load < 2 A and < the driver limit (%s)" % hw["parts"]["M1"]["part"],
      "PASS" if i_run < 2.0 and i_run < ilim else "FAIL",
      "no-load %.1f A, max-load %.1f A at %d N; door ~%d N -> ~%.2f A (linear interpolation, %s data)" % (
          act["i_noload_A"], act["i_maxload_A"], act["force_N"], door["load_N_est"], i_run, conf),
      "estimate" if conf != "checked" else "checked (vendor current) / estimate (load interpolation)")

    # 10. actuator spec gates
    gates = []
    if not act.get("limit_switches"): gates.append("no built-in limit switches")
    if act["v"] != 12: gates.append("not 12 V")
    if act["ip"] not in ("IP54", "IP65", "IP66", "IP67"): gates.append("not sealed")
    if act["stroke_mm"] < door["travel_mm"] + 10: gates.append("stroke %d < door travel %d + 10" % (act["stroke_mm"], door["travel_mm"]))
    C(tier, "actuator meets the spec (12 V, built-in end-of-stroke limits, sealed, stroke >= door travel)", "FAIL" if gates else "PASS",
      "; ".join(gates) or "%s, %d mm stroke vs %d mm door travel, limits built in" % (act["ip"], act["stroke_mm"], door["travel_mm"]))

    # 11. travel time vs firmware timeout
    v = act.get("speed_maxload_mm_s", act["speed_noload_mm_s"] * 0.8)
    t = door["travel_mm"] / v
    tmo = flags["CT_TRAVEL_TIMEOUT_MS"] / 1000
    C(tier, "firmware travel timeout covers the slowest full travel", "PASS" if tmo >= t * 1.3 else "FAIL",
      "%.0f mm at %.1f mm/s = %.1f s; timeout %.0f s" % (door["travel_mm"], v, t, tmo))

    # 12. duty cycle
    C(tier, "actuator duty cycle", "PASS" if 2 * t / 600 < act["duty_max"] else "WARN",
      "2 moves/day of %.0f s; even 2 moves in 10 min = %.0f %% < %.0f %% rated" % (t, 100 * 2 * t / 600, act["duty_max"] * 100))

    # 13. regulator
    i5 = board["i_typ_A"]["wifi_tx_peak"] + CAT["dht20-adafruit-5183"]["i_A"] + 0.01
    C(tier, "5 V regulator: 12 V in window, load < 600 mA", "PASS" if reg["vin"]["min"] <= 12 <= reg["vin"]["max"] and i5 < reg["iout_max_A"] else "FAIL",
      "12 V in %.1f-%d V; XIAO Wi-Fi peak + DHT20 ~%.2f A < %.1f A" % (reg["vin"]["min"], reg["vin"]["max"], i5, reg["iout_max_A"]))

    # 14. XIAO 5V pin after the Schottky
    d = CAT["d-1n5817"]
    v5 = reg["vout"] - d["vf_V"]
    C(tier, "XIAO 5V pin after the back-feed Schottky", "PASS" if board["vin_5v_pin"]["min"] <= v5 <= board["vin_5v_pin"]["max"] and i5 < d["if_max_A"] else "FAIL",
      "5.0 - %.2f = %.2f V (window %.1f-%.1f V); USB and the regulator never back-feed" % (d["vf_V"], v5, board["vin_5v_pin"]["min"], board["vin_5v_pin"]["max"]))

    # 15. 12 V budget
    i12 = ilim + reg["vout"] * i5 / (12 * reg["eff_est"])
    C(tier, "12 V adapter budget (worst case: driver at its limit + logic)", "PASS" if i12 <= 0.8 * sup["i_max_A"] else "WARN",
      "%.2f A + %.2f A = %.2f A <= 80 %% of %.1f A" % (ilim, i12 - ilim, i12, sup["i_max_A"]))

    # 16. fuse vs load and wire
    amp = {int(k): v for k, v in CAT["wire_ampacity_A"].items()}
    pw = [w for w in hw["harness"] if w.get("current") in ("V12", "MOT")]
    worst = min(amp[w["awg"]] for w in pw)
    C(tier, "3 A fuse above the load and below the power-wire ampacity", "PASS" if i12 < fuse["rating_A"] <= worst else "FAIL",
      "load %.2f A < fuse %.1f A <= 20 AWG %.1f A" % (i12, fuse["rating_A"], worst))

    # 17. signal wires and connectors
    conn = CAT["connectors"]
    over = [w["id"] for w in hw["harness"] if w.get("current") in ("V12", "MOT") and any(conn.get(c, {"rating_A": 99})["rating_A"] < fuse["rating_A"] for c in w["conn"])]
    C(tier, "no Dupont on a 12 V / motor wire", "FAIL" if over else "PASS",
      "over-rated: %s" % over if over else "12 V and motor wires use 5.08 mm screw terminals, the barrel jack and solder joints")

    # 18. logic levels
    lv = []
    if not (drv["logic_v"]["min"] <= board["logic_v"] <= drv["logic_v"]["max"]): lv.append("DRV8874 logic")
    s1 = CAT["dht20-adafruit-5183"]
    if not (s1["vdd"]["min"] <= 3.3 <= s1["vdd"]["max"]): lv.append("DHT20 VDD")
    C(tier, "logic levels (3.3 V XIAO -> DRV8874 1.8-5.5 V; DHT20 on 3V3 with 4.7 k pull-ups)", "FAIL" if lv else "PASS",
      ", ".join(lv) or "all 3.3 V; nothing on the XIAO sees 5 V or 12 V")

    # 19. 12 V never reaches the XIAO
    xnodes = [n for n in sum(hw["nets"].values(), []) if n.startswith("U1.")]
    hot = [n for n in xnodes if n in hw["nets"]["V12"] or n in hw["nets"]["V12_RAW"] or n in hw["nets"]["MOT_A"] or n in hw["nets"]["MOT_B"]]
    C(tier, "12 V / motor nets never touch the XIAO (the book's old error)", "FAIL" if hot else "PASS",
      "XIAO pins on 12 V: %s" % hot if hot else "XIAO is powered only from the 5 V regulator via D1")

    # 20. D7 source current
    i_d7 = 3.3 / (drv["r_vref_pullup_ohm"] + 20000) * 1000 + 0.1
    C(tier, "D7 drives SLEEP + VREF divider within GPIO limits", "PASS" if i_d7 < board["gpio_source_mA_max"] else "FAIL",
      "~%.2f mA << %d mA" % (i_d7, board["gpio_source_mA_max"]))

    # 21. supply class / kid safety
    C(tier, "power: 12 V Class 2 adapter, no battery", "PASS" if sup.get("class2") and hw["battery"]["part"] is None else "FAIL",
      "Class 2 limits energy at the source; adapter stays at a covered/indoor outlet, only 12 V goes outside")

    # 22. door closes under its own weight
    C(tier, "cord-lift door: actuator only lifts; closing is gravity", "PASS",
      "door <= %.1f kg (~%.0f N) rests on a hen at most; actuator force (%d N) can never push it down" % (door["mass_kg"], door["mass_kg"] * 9.81, act["force_N"]),
      "design rule")
    return hw


# ----------------------------------------------------------------------------- netlist
def write_netlist(hw):
    json.dump({"design": hw["id"], "rev": hw["rev"], "nets": hw["nets"],
               "parts": {k: v["part"] for k, v in hw["parts"].items()}}, open(os.path.join(OUT, "netlist.json"), "w"), indent=1)
    lines = ['(export (version "E")', ' (design (source "chicken-tender-starter.hw.yaml") (tool "tc-hw/1 build_electronics.py"))', " (components"]
    for ref, p in sorted(hw["parts"].items()):
        lines.append('  (comp (ref "%s") (value "%s"))' % (ref, p["part"]))
    lines.append(" )")
    lines.append(" (nets")
    for i, (net, nodes) in enumerate(hw["nets"].items(), 1):
        lines.append('  (net (code "%d") (name "%s")' % (i, net))
        for n in nodes:
            ref, pin = n.split(".", 1)
            lines.append('   (node (ref "%s") (pin "%s"))' % (ref, pin))
        lines.append("  )")
    lines.append(" )")
    lines.append(")")
    open(os.path.join(OUT, "netlist.net"), "w").write("\n".join(lines) + "\n")


# ----------------------------------------------------------------------------- wiring SVG
NET_COL = {"V12": "#d62728", "V12_RAW": "#d62728", "V5": "#ff7f0e", "V5_XIAO": "#ff7f0e", "V3V3": "#e377c2", "GND": "#222222",
           "MOT_A": "#8c564b", "MOT_B": "#8c564b", "DRV_EN_RAW": "#9467bd", "DRV_SLEEP": "#9467bd", "DRV_VREF": "#7f7f7f"}


def write_svg(hw):
    W, H = 1400, 860
    boxes = {  # ref: (x, y, w, h, title, [pins top->bottom], side)
        "J1": (40, 80, 150, 70, "J1 12 V jack\n(Class 2 adapter PS1)", ["TIP", "SLEEVE"]),
        "F1": (250, 60, 110, 50, "F1 3 A fuse", ["1", "2"]),
        "TB1": (420, 70, 120, 70, "TB1 12 V in", ["1", "2"]),
        "U2": (420, 230, 160, 90, "U2 D36V6F5\n5 V 600 mA", ["VIN", "GND", "VOUT"]),
        "D1": (640, 250, 90, 40, "D1 1N5817", ["A", "K"]),
        "U3": (620, 420, 190, 330, "U3 DRV8874\n(Pololu 4035)", ["VIN", "GND", "OUT1", "OUT2", "EN", "PH", "nFAULT", "CS", "SLEEP", "VREF", "PMODE"]),
        "R1": (640, 780, 90, 36, "R1 20k", ["1", "2"]),
        "U1": (950, 220, 200, 400, "U1 XIAO ESP32-S3", ["5V", "GND", "3V3", "D0", "D1", "D2", "D3", "D4", "D5", "D6", "D7", "D8", "D9", "D10"]),
        "S1": (1240, 120, 130, 110, "S1 DHT20 (3V3)", ["VIN", "GND", "SDA", "SCL"]),
        "R2": (1240, 260, 90, 30, "R2 4k7", ["1", "2"]),
        "R3": (1240, 300, 90, 30, "R3 4k7", ["1", "2"]),
        "SW1": (1240, 420, 130, 60, "SW1 E-STOP (NC)", ["1", "2"]),
        "RS1": (1240, 540, 130, 50, "RS1 reed CLOSED", ["1", "2"]),
        "RS2": (1240, 620, 130, 50, "RS2 reed OPEN", ["1", "2"]),
        "TB2": (300, 520, 120, 70, "TB2 motor out", ["1", "2"]),
        "M1": (40, 500, 170, 110, "M1 12 V actuator\n(limits built in)", ["+", "-"]),
    }
    pinpos = {}
    out = ['<svg xmlns="http://www.w3.org/2000/svg" width="%d" height="%d" viewBox="0 0 %d %d" font-family="Helvetica,Arial,sans-serif">' % (W, H, W, H),
           '<rect width="100%" height="100%" fill="#ffffff"/>',
           '<text x="20" y="30" font-size="20" font-weight="bold">Chicken Tender Starter - wiring (tc-hw/1 rev %s, generated)</text>' % hw["rev"],
           '<text x="20" y="52" font-size="12" fill="#555">12 V reaches ONLY F1, TB1, the DRV8874 VIN and the D36V6F5 VIN. The XIAO runs on the regulator 5 V through D1. Actuator tier: %s (%s)</text>' % (hw["tier"], hw["parts"]["M1"]["part"])]
    for ref, (x, y, w, h, title, plist) in boxes.items():
        out.append('<rect x="%d" y="%d" width="%d" height="%d" rx="6" fill="#f5f7fa" stroke="#333" stroke-width="1.5"/>' % (x, y, w, h))
        for i, line in enumerate(title.split("\n")):
            out.append('<text x="%d" y="%d" font-size="12" font-weight="bold">%s</text>' % (x + 6, y + 15 + 13 * i, line))
        n = len(plist)
        top = y + 18 + 13 * len(title.split("\n"))
        step = max(14, (y + h - 6 - top) / max(1, n))
        right = ref in ("U2", "J1", "TB1", "F1", "D1", "U3", "M1", "TB2", "R1")
        for i, p in enumerate(plist):
            py = top + step * i + 4
            px = x + w if right else x
            pinpos["%s.%s" % (ref, p)] = (px, py)
            out.append('<circle cx="%d" cy="%d" r="3" fill="#333"/>' % (px, py))
            tx = px - 6 if right else px + 6
            anchor = "end" if right else "start"
            out.append('<text x="%d" y="%d" font-size="10" text-anchor="%s">%s</text>' % (tx, py + 3, anchor, p))
    lane = 0
    for net, nodes in hw["nets"].items():
        pts = [pinpos[n] for n in nodes if n in pinpos]
        if len(pts) < 2: continue
        col = NET_COL.get(net, "#1f77b4")
        lane += 1
        bx = 880 + (lane % 9) * 6 if any(n.startswith("U1.") for n in nodes) else 600 - (lane % 12) * 7
        for (x0, y0) in pts:
            out.append('<polyline points="%d,%d %d,%d" fill="none" stroke="%s" stroke-width="%s" opacity="0.85"/>' % (x0, y0, bx, y0, col, 2.5 if net in ("V12", "V12_RAW", "MOT_A", "MOT_B", "GND") else 1.4))
        ys = [p[1] for p in pts]
        out.append('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="%s" opacity="0.85"/>' % (bx, min(ys), bx, max(ys), col, 2.5 if net in ("V12", "MOT_A", "MOT_B", "GND") else 1.4))
        out.append('<text x="%d" y="%d" font-size="9" fill="%s">%s</text>' % (bx + 3, min(ys) - 3, col, net))
    ly = 800
    for i, (k, c) in enumerate([("12 V", "#d62728"), ("5 V", "#ff7f0e"), ("3V3", "#e377c2"), ("GND", "#222"), ("motor", "#8c564b"), ("E-STOP / SLEEP", "#9467bd"), ("signal", "#1f77b4")]):
        out.append('<line x1="%d" y1="%d" x2="%d" y2="%d" stroke="%s" stroke-width="3"/><text x="%d" y="%d" font-size="11">%s</text>' % (800 + i * 85, ly, 830 + i * 85, ly, c, 834 + i * 85, ly + 4, k))
    out.append('<text x="800" y="830" font-size="11" fill="#555">I_lim = 3.3 V x 20k/30k / (450 uA/A x 2.49 k) = 1.96 A. PMODE to GND = PH/EN. E-STOP open -> SLEEP low -> outputs off.</text>')
    out.append("</svg>")
    open(os.path.join(OUT, "wiring.svg"), "w").write("\n".join(out))


# ----------------------------------------------------------------------------- BOM
MECH = [  # shared mechanical/consumable lines (both actuator tiers); counts are for the printed box/brackets described in README.md (CAD not in the repo yet)
    ("PLA/PETG", "Printed parts (control box, lid, plate, clevis bracket, cord eye, door anchor, reed mount, 2 guide segments) ~260 g PETG", 1, 5.20, "estimate", "https://www.prusa3d.com/category/prusament-petg/ (~$20/kg)"),
    ("INS-M3", "M3 heat-set inserts, CNC Kitchen / Ruthex M3 standard (L 5.7, OD 4.6) - heatset mode only", 20, 0.12, "estimate", "https://www.cnckitchen.store/ (100-pack ~$12)"),
    ("SCR-M3x8", "M3 x 8 button-head screws (box, plate, brackets)", 20, 0.08, "estimate", "generic"),
    ("SCR-M3x6", "M3 x 6 screws (XIAO/DRV8874/regulator carriers to the plate, via standoffs)", 8, 0.08, "estimate", "generic"),
    ("SCR-WOOD", "#8 x 3/4 in exterior wood screws (brackets, guides, reed mount to the coop)", 16, 0.10, "estimate", "generic"),
    ("PIN-M6", "M6 x 30 shoulder/clevis bolt + nyloc (actuator pivot pins, both ends)", 2, 1.20, "estimate", "generic"),
    ("CORD", "1.8 mm braided Dyneema/UHMWPE cord, 1 m (door lift)", 1, 3.00, "estimate", "generic"),
    ("GLAND", "PG7 cable glands (actuator lead, reed leads)", 3, 0.50, "estimate", "generic"),
    ("WIRE", "Hook-up wire 20 AWG red/black 2 m, 26 AWG multicolor, Dupont jumpers, heat-shrink", 1, 6.00, "estimate", "generic"),
]


def bom_rows(hw):
    rows = []
    seen = {}
    for ref, p in hw["parts"].items():
        key = p["part"]
        seen.setdefault(key, []).append(ref)
    for key, refs in seen.items():
        c = CAT[key]
        rows.append(dict(refs=" ".join(sorted(refs)), part=key, desc=c["src"].split(" (")[0] if c["kind"] != "actuator" else c["src"],
                         qty=len(refs), unit=c["price_usd"], status=c["price_status"], source=c["src"].split(" ")[0] if c["src"].startswith("http") else c["src"]))
    for ref, desc, qty, unit, status, src in MECH:
        rows.append(dict(refs=ref, part=ref, desc=desc, qty=qty, unit=unit, status=status, source=src))
    for r in rows:
        r["ext"] = None if r["unit"] is None else round(r["qty"] * r["unit"], 2)
    return rows


def money(v):
    return "verify" if v is None else "%.2f" % v


def write_bom(all_rows):
    md = ["# Chicken Tender Starter - BOM per actuator tier", "",
          "Generated by `gen/build_electronics.py` from `hw/parts.yaml`. `checked` = price read on the vendor page 2026-10-16; "
          "`estimate` = typical street price, not checked; `verify listing` = no listing chosen, no price given.",
          "Both actuator tiers share everything except the actuator (M1). See `../TIERS.md` for the Starter / Plus / Pro product tiers.", ""]
    for tier, rows in all_rows.items():
        with open(os.path.join(OUT, "bom_%s.csv" % tier), "w", newline="") as f:
            w = csv.DictWriter(f, fieldnames=["refs", "part", "desc", "qty", "unit", "ext", "status", "source"])
            w.writeheader()
            for r in rows:
                w.writerow(dict(r, unit="" if r["unit"] is None else r["unit"], ext="" if r["ext"] is None else r["ext"]))
        priced = [r for r in rows if r["ext"] is not None]
        tot = sum(r["ext"] for r in priced)
        chk = sum(r["ext"] for r in priced if r["status"] == "checked")
        unpriced = [r["refs"] for r in rows if r["ext"] is None]
        md += ["## Actuator tier: %s" % tier, "", "| Ref | Item | Qty | Unit $ | Ext $ | Price |", "|---|---|---:|---:|---:|---|"]
        for r in rows:
            md.append("| %s | %s | %d | %s | %s | %s |" % (r["refs"], r["desc"].replace("|", "/"), r["qty"], money(r["unit"]), money(r["ext"]), r["status"]))
        note = (" **Not included: %s** (no listing chosen - verify listing/force, then add its price)." % ", ".join(unpriced)) if unpriced else ""
        md += ["", "**Total: $%.2f** (of which $%.2f checked, $%.2f estimate; before tax/shipping).%s" % (tot, chk, tot - chk, note), ""]
        all_rows[tier] = (rows, tot, chk)
    gen = CAT["act-generic-12v-300mm"]
    g = CAT["act-glideforce-lact12-12v-05"]
    md += ["## Actuators", "",
           "| Tier | Actuator | Price | Force | Speed (no load) | Stroke | Seal | Limit switches | Current |", "|---|---|---:|---|---|---|---|---|---|",
           "| Starter | generic 12 V linear actuator - **verify listing/force** | verify | >= %d N (minimum) | ~%g mm/s (assumed) | >= 290 mm (%d mm assumed) | >= %s | required, built in | %.1f / %.1f A (assumed) |" % (
               gen["force_N"], gen["speed_noload_mm_s"], gen["stroke_mm"], gen["ip"], gen["i_noload_A"], gen["i_maxload_A"]),
           "| Pro | [Glideforce LACT12-12V-05](https://www.pololu.com/product/2326) (Pololu #2326) | $%.2f (checked) | %d N | %.1f mm/s (%.1f at max load) | %d mm | %s | built in | %.1f / %.1f A, %.0f A stall (checked) |" % (
               g["price_usd"], g["force_N"], g["speed_noload_mm_s"], g["speed_maxload_mm_s"], g["stroke_mm"], g["ip"], g["i_noload_A"], g["i_maxload_A"], g["i_stall_A"]),
           "", "Starter: no ASIN or price is given on purpose. Pick a listing that meets every minimum above and verify its force, stroke, current and hole size before buying; "
           "if its speed is below ~8 mm/s, raise `CT_TRAVEL_TIMEOUT_MS` in `firmware/chicken-tender-starter/platformio.ini`.",
           "", "The ~2.0 A driver limit caps any actuator's current regardless of its rating; a door load of ~15 N is a small fraction of either actuator's rating."]
    open(os.path.join(OUT, "BOM.md"), "w").write("\n".join(md) + "\n")


# ----------------------------------------------------------------------------- main
def main():
    os.makedirs(OUT, exist_ok=True)
    rows = {}
    for t in TIERS:
        hw = run_checks(t)
        rows[t] = bom_rows(hw)
        if t == "starter":
            write_netlist(hw)
            write_svg(hw)
    write_bom(rows)
    json.dump(checks, open(os.path.join(OUT, "electrical_checks.json"), "w"), indent=1)
    md = ["# Electrical checks (generated)", "", "| Tier | Check | Result | Detail | Data |", "|---|---|---|---|---|"]
    md += ["| %s | %s | **%s** | %s | %s |" % (c["tier"], c["check"], c["result"], c["detail"], c["data"]) for c in checks]
    open(os.path.join(OUT, "ELECTRICAL_CHECKS.md"), "w").write("\n".join(md) + "\n")
    n = {k: sum(1 for c in checks if c["result"] == k) for k in ("PASS", "WARN", "FAIL")}
    print("electrical checks: %(PASS)d PASS, %(WARN)d WARN, %(FAIL)d FAIL" % n)
    for t in TIERS:
        print("BOM %s: $%.2f priced total ($%.2f checked)%s" % (t, rows[t][1], rows[t][2], " + actuator (verify listing/force)" if any(r["ext"] is None for r in rows[t][0]) else ""))
    for c in checks:
        if c["result"] != "PASS":
            print(" ", c["tier"], c["result"], c["check"], "-", c["detail"])
    if "--check" in sys.argv and n["FAIL"]:
        sys.exit(1)


if __name__ == "__main__":
    main()
