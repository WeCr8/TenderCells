"""CT72 rev A1.2 BOM -> ../BOM_A1.2.csv : qty + extended cost per tier (Starter / Plus / Pro) and the UR3e
pro_heavy option as a separate column (full variant cost; not a tier). Quantities come from the model
(geometry counts + cut lengths) plus non-geometric extras below. Prices: USD street estimates, Oct 2026, before
tax/shipping. 'vendor_pn' and 'vendor_url' are given where a specific part is meant; 'generic' marks commodity
items (any equivalent). Price basis notes say which were checked (A1.1 BOM_PRICE_CHECK.csv) and which are estimates.
"""
import csv, collections, os
import ct72_params as P
import ct72_model as M
from bom import CAT as CAT_A11, LEN_KEYS as LEN_A11

ROOT = os.path.join(M.HERE, "..")
park = tuple(P.PARK.values())
COLS = ("starter", "plus", "pro", "pro_heavy")

# key: (category, description, unit, unit_usd, vendor_pn, vendor_url, basis)
NEW = {
    # ---- motion (belt gantry)
    "NEMA17_XY": ("Motion", "NEMA17 stepper 0.59 Nm 2 A, 48 mm (X1, X2, Y)", "ea", 14.0, "StepperOnline 17HS19-2004S1",
                  "https://www.omc-stepperonline.com/nema-17-bipolar-59ncm-84oz-in-2a-42x48mm-4-wires-w-1m-cable-connector-17hs19-2004s1", "vendor list ~$14 (est)"),
    "NEMA17_Z": ("Motion", "NEMA17 stepper 0.59 Nm (Z, drives Tr8x2 screw via coupler)", "ea", 14.0, "StepperOnline 17HS19-2004S1",
                 "https://www.omc-stepperonline.com/nema-17-bipolar-59ncm-84oz-in-2a-42x48mm-4-wires-w-1m-cable-connector-17hs19-2004s1", "est"),
    "NEMA23_XY": ("Motion", "NEMA23 3.0 Nm closed-loop stepper + CL57T driver (pro_heavy X1/X2/Y)", "ea", 110.0, "StepperOnline 23HS45-4204D-E1000 + CL57T",
                  "https://www.omc-stepperonline.com/closed-loop-stepper-driver-0-8-0a-24-48vdc-for-nema-17-23-24-stepper-motor-cl57t", "CL57T $34-37 checked in A1.1; motor est"),
    "MOTOR_Z_N23B": ("Motion", "NEMA23 2.0 Nm with 24 V brake (pro_heavy Z)", "ea", 68.0, "StepperOnline 23HS30-5004D-E1000-B280",
                     "https://www.omc-stepperonline.com/nema-23-stepper-motor-2-0nm-283-22oz-in-with-24v-4-5w-electromagnetic-brake-23hs30-5004d-b280", "A1.1 check: $41-68"),
    "Z_TR8_KIT": ("Motion", "Tr8x2 lead screw (cut to length) + POM anti-backlash nut + KFL08 + KP08 + 5x8 coupler", "m", 30.0, "generic",
                  "https://www.amazon.com/s?k=T8+lead+screw+1500mm+lead+2mm", "est ~$40 per 1.5 m kit; 1.5 m stock exists"),
    "Z_SFU1605_KIT": ("Motion", "SFU1605 ball screw (cut) + BK12/BF12 + nut housing + coupler", "m", 110.0, "generic SFU1605",
                      "https://www.amazon.com/s?k=SFU1605+ballscrew+1500mm+BK12+BF12", "A1.1: ~$100-200 per 1.7 m"),
    "BELT_GT2_10": ("Motion", "GT2 10 mm fiberglass belt (X 2 loops + Y loop, ~11 m)", "m", 2.0, "Gates 2MGT-10 or equivalent",
                    "https://www.amazon.com/s?k=GT2+10mm+belt+10m", "est"),
    "BELT_HTD5M_15": ("Motion", "HTD-5M 15 mm open belt (pro_heavy, ~11 m)", "m", 9.0, "generic HTD5M-15", "https://www.amazon.com/s?k=HTD+5M+15mm+open+belt", "est"),
    "PULLEY_IDLER_KIT": ("Motion", "20T pulleys (3) + toothed/smooth idlers (6) + belt tensioners (3) for the belt width", "lot", 35.0, "generic",
                         "https://www.amazon.com/s?k=GT2+20T+pulley+10mm+idler+tensioner", "est (pro_heavy HTD: x3 cost)"),
    "IDLER_TENSIONER": ("Motion", "X-end idler + screw tensioner block (in PULLEY_IDLER_KIT)", "ea", 0.0, "", "", "counted in kit"),
    "VWHEEL_CARRIAGE": ("Motion", "V-wheel carriage: 4x Delrin Solid V wheels, eccentric spacers, M5 hardware, plate", "ea", 22.0, "OpenBuilds Solid V Wheel kit x4",
                        "https://openbuildspartstore.com/solid-v-wheel-kit/", "est"),
    "MGN15_RAIL": ("Motion", "MGN15 rail (Z mast; pro_heavy also X/Y), cut to length", "mm", 0.035, "generic MGN15", "https://www.amazon.com/s?k=MGN15+linear+rail", "A1 est"),
    "KLIPPER_MCU": ("Controls", "BTT SKR Mini E3 V3 (4x TMC2209 UART) - X, X1, Y, Z", "ea", 40.0, "BIGTREETECH SKR Mini E3 V3.0",
                    "https://github.com/bigtreetech/BIGTREETECH-SKR-mini-E3", "est"),
    "KLIPPER_HOST_ZERO": ("Controls", "Raspberry Pi Zero 2 W + 32 GB card (Klipper/Moonraker host, Starter)", "ea", 25.0, "Raspberry Pi Zero 2 W",
                          "https://www.raspberrypi.com/products/raspberry-pi-zero-2-w/", "MSRP $15 + card"),
    "DRV_EXT_STEP": ("Controls", "BTT Octopus (step/dir to the pro_heavy CL57T drivers + extra IO)", "ea", 65.0, "BIGTREETECH Octopus V1.1",
                     "https://github.com/bigtreetech/BIGTREETECH-OCTOPUS-V1.0", "est"),
    "PSU_24V_MOTION": ("Electronics", "24 V 150 W DIN PSU (steppers)", "ea", 30.0, "Mean Well HDR-150-24", "https://www.meanwell.com/webapp/product/search.aspx?prod=HDR-150", "est"),
    "ENDSTOP_MECH": ("Sensors", "Mechanical endstop (X min front+back, Y min, Z max)", "ea", 2.0, "generic", "", "est"),
    # ---- LeRobot / SO-101
    "ARM_SO101_FOLLOWER": ("Arm", "SO-101 follower kit, 6x Feetech STS3215-C047 12 V + bus board + printed parts", "ea", 230.0,
                           "SO-ARM101 follower (12 V)", "https://github.com/TheRobotStudio/SO-ARM100", "A1.1 check: $150-299"),
    "ARM_SO101_LEADER": ("Arm", "SO-101 leader kit (7.4 V STS3215 C001/C044/C046 mix) for teleop", "ea", 150.0, "SO-ARM101 leader",
                         "https://github.com/TheRobotStudio/SO-ARM100", "est (kits sold with follower)"),
    "SERVO_PSU_12V": ("Arm", "12 V 12.5 A PSU for the follower servo bus (6x 2.7 A stall), fused star feed", "ea", 25.0, "Mean Well LRS-150-12",
                      "https://www.meanwell.com/webapp/product/search.aspx?prod=LRS-150", "est; replaces the kit's 12 V 5 A brick"),
    "SERVO_BUS_FUSE": ("Arm", "Inline blade fuse holders + 3 A fuses x6 + 18 AWG star power harness (bypasses daisy-chain jumpers)", "lot", 12.0, "generic", "", "est"),
    "GRIPPER_SOFT": ("Arm", "Soft egg gripper: printed TPU 95A Fin Ray fingers + 3 mm EVA foam pads (replaces SO-101 jaws)", "lot", 10.0, "printed", "", "est"),
    "EGG_TOOL_VAC": ("Arm", "Starter egg tool: 12 V mini diaphragm pump, 12 V NC valve, XGZP6847A vacuum sensor, 25 mm silicone bellows cup, spring plunger + contact switch", "lot", 45.0,
                     "generic", "https://www.amazon.com/s?k=12V+mini+vacuum+pump+bellows+suction+cup", "est"),
    "ADAPTER_STARTER": ("Arm", "Vacuum-tool outrigger + plunger block (6 mm Al / printed)", "ea", 15.0, "", "", "est"),
    "ADAPTER_PLUS": ("Arm", "SO-101 adapter ring (printed PETG/ASA, M6 to the grid)", "ea", 8.0, "", "", "est"),
    "ADAPTER_PRO": ("Arm", "SO-101 adapter ring (printed PETG/ASA, M6 to the grid)", "ea", 8.0, "", "", "est"),
    "ADAPTER_PRO_HEAVY": ("Arm", "UR3e adapter ring 6061 160x12 mm", "ea", 80.0, "", "", "A1 est"),
    "ARM_PRO_HEAVY": ("Arm", "Universal Robots UR3e (arm + control box + teach pendant)", "ea", 33000.0, "UR3e",
                      "https://vention.com/parts/universal-robots-ur3e-collaborative-robot-arm-2446", "A1.1 check: $29.7k-$39.5k"),
    "TELEOP_TABLE": ("Arm", "Teleop station: small table + USB gamepad (gantry jog)", "lot", 45.0, "generic", "", "est"),
    # ---- compute + cameras + timing
    "COMPUTE_PI5": ("Compute", "Raspberry Pi 5 8 GB + active cooler + 64 GB A2 card + 27 W PSU", "ea", 190.0, "Raspberry Pi 5 8GB",
                    "https://www.raspberrypi.com/products/raspberry-pi-5/", "A1.1 check: board $130-175 after 2026 hikes"),
    "COMPUTE_JETSON": ("Compute", "Jetson Orin Nano Super dev kit 8 GB + 256 GB NVMe (Zach already owns one)", "ea", 290.0, "NVIDIA 945-13766-0000-000",
                       "https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/nano-super-developer-kit/", "A1.1 check $249 + NVMe"),
    "CAM_GS": ("Cameras", "Global-shutter cam with external trigger: Plus = Raspberry Pi Global Shutter Camera (IMX296) + lens; Pro = Arducam OV9281 (Jetson)", "ea", 65.0,
               "RPi GS Camera / Arducam OV9281 B0162", "https://www.raspberrypi.com/products/raspberry-pi-global-shutter-camera/", "RPi GS $50 + 6 mm lens; Arducam $52 (A1.1)"),
    "CAM_CSI_EXT": ("Cameras", "CSI-to-HDMI extension kit (gantry cam through the cable chain, ~3 m)", "ea", 18.0, "Arducam CSI-HDMI extension",
                    "https://www.amazon.com/s?k=arducam+csi+hdmi+extension", "est"),
    "TRIGGER_KIT": ("Timing", "Camera trigger harness: shielded twisted pair, 74LVC1T45 level shifter (3.3 V -> 1.8 V XTR), series R, JST-SH", "lot", 15.0,
                    "generic", "https://www.raspberrypi.com/documentation/accessories/camera.html", "est"),
    "NET_PTP": ("Timing", "5-port gigabit switch + Cat6 patch cables (wired PTP/chrony LAN: Pi/Jetson, training PC)", "lot", 30.0, "generic", "", "est"),
    "CAM_CORNER_XIAO": ("Cameras", "XIAO ESP32-S3 Sense monitor cam (Wi-Fi, not in the dataset)", "ea", 14.0, "Seeed 113991115",
                        "https://www.seeedstudio.com/XIAO-ESP32S3-Sense-p-5639.html", "vendor $13.99"),
    "CAM_TOOL": ("Cameras", "Starter gantry cam: XIAO ESP32-S3 Sense on the Z plate (scripted pick)", "ea", 14.0, "Seeed 113991115",
                 "https://www.seeedstudio.com/XIAO-ESP32S3-Sense-p-5639.html", "vendor"),
    "CAM_TOOL_UVC": ("Cameras", "pro_heavy gantry cam: USB UVC (UR3e has its own controller)", "ea", 40.0, "generic", "", "A1"),
    # ---- cell IO (XIAO) + coop actuation
    "CELL_IO_NODE": ("Controls", "Cell-IO node: XIAO ESP32-S3, MCP23017 IO expander, ADS1115 ADC, 2x HX711, 3.3 V/5 V buck, terminal PCB", "lot", 35.0,
                     "Seeed 113991114 + Adafruit 5346 + Adafruit 1085", "https://www.seeedstudio.com/XIAO-ESP32S3-p-5627.html", "est"),
    "ACT_DRIVER": ("Controls", "Pololu DRV8874 single brushed DC driver carrier (roost A, roost B, lid) - current sense for pinch/stall", "ea", 13.0,
                   "Pololu #4035", "https://www.pololu.com/product/4035", "vendor ~$13"),
    "ROOST_ACT": ("Coop", "12 V linear actuator 4 in stroke, ~200 N, built-in limit switches (generic; Glideforce/Progressive premium)", "ea", 32.0, "generic",
                  "https://www.amazon.com/s?k=12V+linear+actuator+4+inch+stroke", "est; generic OK per Zach (Oct 16)"),
    "LID_ACT": ("Coop", "12 V linear actuator 2 in stroke for the nest lids + lid-open reed switch", "ea", 28.0, "generic",
                "https://www.amazon.com/s?k=12V+linear+actuator+2+inch+stroke", "est"),
    "LOAD_CELL": ("Sensors", "5 kg bar load cell (2 per roost bar) for bird occupancy", "ea", 4.0, "TAL220B 5 kg class", "https://www.sparkfun.com/search/results?term=load+cell+5kg", "est"),
    "SW_LIMIT_ROOST": ("Sensors", "Roller limit switch: roost deployed/stowed (2 per bar)", "ea", 2.0, "generic", "", "est"),
    "ROOST_BAR": ("Coop", "Roost bar 2x1.5 in hardwood, 42 in, edges rounded", "ea", 12.0, "lumber", "", "est"),
    "ROOST_ARM": ("Coop", "Swing arm: 30x6 mm steel flat bar + bar bracket", "ea", 6.0, "generic", "", "est"),
    "ROOST_TUBE": ("Coop", "1 in steel tube torque shaft + 2 pillow blocks + lever + quick-release clevis pin", "ea", 30.0, "generic", "", "est"),
    "PINCH_GUARD": ("Safety", "Printed pinch guard over lever/clevis/hinge (finger-safe)", "ea", 4.0, "printed", "", "est"),
    "NEST_BOX": ("Coop", "Nest box 12x12x12 in, 1/2 in ply/HDPE: flat floor, back, dividers, aisle lip + top rail", "ea", 35.0, "materials", "", "est"),
    "NEST_LINER": ("Coop", "Removable washable nest pad liner 12x12 in (rubber/PP)", "ea", 8.0, "generic", "https://www.amazon.com/s?k=nesting+box+pads", "est"),
    "NEST_LID": ("Coop", "Hinged nest lid 1/2 in ply + piano hinge (common hinge rod)", "ea", 10.0, "materials", "", "est"),
    "NEST_SHELF": ("Coop", "18 mm ply shelf + 2 steel L-brackets (bank + basket)", "ea", 25.0, "materials", "", "est"),
    "BASKET_POCKET": ("Coop", "Basket pocket (ply) + printed corner locators + exterior hatch hinge/latch", "ea", 25.0, "materials", "", "est"),
    "EGG_BASKET": ("Coop", "Egg basket ~250x200x120 mm (wire or plastic) + foam liner", "ea", 15.0, "generic", "", "est"),
    "APRILTAG": ("Coop", "AprilTag tag36h11 id 0, 60 mm, laminated on a printed tab", "ea", 1.0, "printed", "https://github.com/AprilRobotics/apriltag-imgs", "est"),
    "DOOR_EGG_HATCH": ("Guarding", "Exterior egg-collection hatch: frame, hinge, latch", "ea", 20.0, "materials", "", "est"),
    "EXT_2020": ("Frame", "2020 extrusion", "mm", 0.010, "generic", "", "est"),
    "ESTOP_RELAY": ("Safety", "E-stop power relay (DIN, 24 V coil, 3NO): cuts stepper 24 V, servo 12 V and actuator 12 V", "ea", 18.0, "generic", "", "est"),
    "SAFETY_RELAY": ("Safety", "Dual-channel safety relay (E-stop + door) Cat 3/PLd", "ea", 310.0, "Pilz PNOZ s4 750104",
                     "https://shop.appliedindustrialautomation.com/products/PILZ-750104", "A1.1 check $309-540"),
}
CAT = {}
for k, (cat, desc, unit, price, note) in CAT_A11.items():
    CAT[k] = (cat, desc, unit, price, "generic", "", note)
CAT.update(NEW)
LEN_KEYS = set(LEN_A11) | {"Z_TR8_KIT", "Z_SFU1605_KIT", "MGN15_RAIL", "EXT_2020"}
UNIT_M = {"Z_TR8_KIT", "Z_SFU1605_KIT"}   # priced per metre


def remap(k, v, p):
    if k == "CAM_CORNER":
        return "CAM_CORNER_XIAO"
    if k == "GUARD_MESH" and v in ("pro", "pro_heavy"):
        return "GUARD_MESH_PRO"
    if k == "COMPUTE_BOX" and False:
        return k
    return k


def model_counts(v):
    c = collections.Counter(); L = collections.defaultdict(float)
    for p in M.assemble(v, *park, with_arm=True):
        if not p.bom:
            continue
        k = remap(p.bom, v, p)
        if k in LEN_KEYS:
            L[k] += p.length
        c[k] += 1
    return c, L


def extra(v):
    s, pl, pr, ph = v == "starter", v == "plus", v == "pro", v == "pro_heavy"
    hf = pl or pr
    belt_m = 11.5
    e = {"CORNER_HW": 1, "CABLE_CHAIN": 1, "WIRING": 1, "BUCK": 1, "ENV_SENS": 1, "SW_BIN": 1,
         "PULLEY_IDLER_KIT": 3 if ph else 1, "KLIPPER_MCU": 0 if ph else 1, "DRV_EXT_STEP": 1 if ph else 0,
         "KLIPPER_HOST_ZERO": 1 if s else 0, "PSU_24V_MOTION": 1, "PSU_24V": 1 if ph else 0,
         "ENDSTOP_MAX": 0 if s else 3, "TOF": 0 if s else 1,
         "BELT_GT2_10": 0 if ph else belt_m, "BELT_HTD5M_15": belt_m if ph else 0,
         "ARM_SO101_LEADER": 1 if hf else 0, "SERVO_PSU_12V": 1 if hf else 0, "SERVO_BUS_FUSE": 1 if hf else 0, "GRIPPER_SOFT": 1 if hf else 0,
         "EGG_TOOL_VAC": 0,   # counted from the model (plunger part)
         "COMPUTE_PI5": 1 if pl else 0, "COMPUTE_JETSON": 1 if (pr or ph) else 0,
         "CAM_CSI_EXT": 1 if hf else 0, "TRIGGER_KIT": 1 if hf else 0, "NET_PTP": 1 if (hf or ph) else 0,
         "CELL_IO_NODE": 1, "ACT_DRIVER": 3, "LOAD_CELL": 4, "SW_LIMIT_ROOST": 4, "ESTOP_RELAY": 1,
         "SAFETY_RELAY": 1 if (pr or ph) else 0, "LIGHT_CURTAIN": 0}
    return e


def main():
    rows = {}
    for v in COLS:
        c, L = model_counts(v)
        for k, n in c.items():
            if k in LEN_KEYS:
                q = round(L[k] / 1000.0, 3)
            else:
                q = n
            rows.setdefault(k, {})[v] = q
        for k, n in extra(v).items():
            rows.setdefault(k, {})[v] = rows.get(k, {}).get(v, 0) + n
    # drop the A1 compute keys superseded in A1.2
    for k in ("SBC_PI5", "SBC_JETSON", "MCU_ESP32S3", "DRV_TB6600", "DRV_CLOSED", "BELT_KIT", "NEMA23_XY_A1", "ROOST_POLE", "SW_ROOST"):
        rows.pop(k, None)
    out = os.path.join(ROOT, "BOM_A1.2.csv")
    tot = {v: 0.0 for v in COLS}
    with open(out, "w", newline="") as f:
        w = csv.writer(f)
        w.writerow(["item", "category", "description", "unit", "qty_starter", "qty_plus", "qty_pro", "qty_pro_heavy_option",
                    "unit_usd_est", "ext_starter_usd", "ext_plus_usd", "ext_pro_usd", "ext_pro_heavy_option_usd",
                    "vendor_pn", "vendor_url", "price_basis"])
        for k in sorted(rows, key=lambda k: (CAT[k][0], k)):
            cat, desc, unit, price, pn, url, basis = CAT[k]
            if k in UNIT_M:
                unit_out, up = "m", price
            else:
                unit_out = "m" if unit == "mm" else unit
                up = price * 1000 if unit == "mm" else price
            q = [rows[k].get(v, 0) for v in COLS]
            if all(x == 0 for x in q):
                continue
            ext = []
            for v, qq in zip(COLS, q):
                val = 0.0 if k == "LIGHT_CURTAIN" else round(qq * up, 2)
                ext.append(val); tot[v] += val
            w.writerow([k, cat, desc, unit_out, *q, round(up, 2), *ext, pn, url, basis])
        w.writerow([])
        w.writerow(["TOTAL_EST", "", "Estimated parts cost (USD, excl. tax/shipping/labour, +/-30% draft)", "", "", "", "", "", "",
                    *[round(tot[v]) for v in COLS], "", "", "pro_heavy column = full UR3e variant, not a tier"])
    print({v: round(t) for v, t in tot.items()})
    return tot


if __name__ == "__main__":
    main()
