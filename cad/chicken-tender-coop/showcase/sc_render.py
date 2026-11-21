"""Headless renderer for the showcase MP4s (no GPU / OSMesa / Blender in the sandbox, so this is a small
numba z-buffer rasterizer: flat shading, 2x supersampling, PIL overlays, ffmpeg H.264).

    python sc_render.py <cfg> <start_s> <end_s> <out.mp4>      # renders one chunk
    python sc_render.py <cfg> still <t> <out.png>
"""
from __future__ import annotations
import math, os, subprocess, sys
import numpy as np
from numba import njit
from PIL import Image, ImageDraw, ImageFont
import sc_params as P, sc_model as M, scene, anim

W, H, SS = 1920, 1080, 1.5
FONT = "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf"
FONTB = "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf"


@njit(cache=True, fastmath=True)
def raster(sx, sy, sz, cols, alpha, img, zb, opaque):
    h, w = zb.shape
    for i in range(sx.shape[0]):
        a = alpha[i]
        if opaque and a < 0.999:
            continue
        if (not opaque) and a >= 0.999:
            continue
        x0, x1, x2 = sx[i, 0], sx[i, 1], sx[i, 2]
        y0, y1, y2 = sy[i, 0], sy[i, 1], sy[i, 2]
        z0, z1, z2 = sz[i, 0], sz[i, 1], sz[i, 2]
        if z0 <= 0 or z1 <= 0 or z2 <= 0:
            continue
        area = (x1 - x0) * (y2 - y0) - (x2 - x0) * (y1 - y0)
        if abs(area) < 1e-9:
            continue
        minx = max(int(min(x0, x1, x2)), 0); maxx = min(int(max(x0, x1, x2)) + 1, w - 1)
        miny = max(int(min(y0, y1, y2)), 0); maxy = min(int(max(y0, y1, y2)) + 1, h - 1)
        if minx > maxx or miny > maxy:
            continue
        inv = 1.0 / area
        iz0, iz1, iz2 = 1.0 / z0, 1.0 / z1, 1.0 / z2
        cr, cg, cb = cols[i, 0], cols[i, 1], cols[i, 2]
        for py in range(miny, maxy + 1):
            fy = py + 0.5
            for px in range(minx, maxx + 1):
                fx = px + 0.5
                w0 = ((x1 - fx) * (y2 - fy) - (x2 - fx) * (y1 - fy)) * inv
                w1 = ((x2 - fx) * (y0 - fy) - (x0 - fx) * (y2 - fy)) * inv
                w2 = 1.0 - w0 - w1
                if w0 < 0 or w1 < 0 or w2 < 0:
                    continue
                iz = w0 * iz0 + w1 * iz1 + w2 * iz2
                z = 1.0 / iz
                if z < zb[py, px]:
                    if opaque:
                        zb[py, px] = z
                        img[py, px, 0] = cr; img[py, px, 1] = cg; img[py, px, 2] = cb
                    else:
                        img[py, px, 0] = img[py, px, 0] * (1 - a) + cr * a
                        img[py, px, 1] = img[py, px, 1] * (1 - a) + cg * a
                        img[py, px, 2] = img[py, px, 2] * (1 - a) + cb * a


def look_at(eye, tgt, up=(0, 0, 1)):
    f = np.asarray(tgt, float) - eye; f /= np.linalg.norm(f)
    r = np.cross(f, up); r /= np.linalg.norm(r)
    u = np.cross(r, f)
    return np.stack([r, u, f])


# camera keys: (t, eye, target, fov)
CAMS = {
    "wide": ((3600, 150, 2500), (650, 2650, 850), 44),
    "door": ((-1500, 900, 2400), (620, 2500, 1300), 40),
    "run": ((3300, -900, 1700), (600, 1500, 400), 46),
    "bay": ((2900, 2350, 2150), (1500, 3050, 1000), 34),
    "back": ((-700, 5600, 2000), (350, 3650, 1150), 36),
    "build": ((4800, -1800, 4200), (650, 1900, 700), 46),
}
SHOTS = [(0.0, "wide"), (2.6, "door"), (7.0, "run"), (11.6, "bay"), (22.2, "wide"), (25.2, "run"), (29.0, "door"),
         (31.6, "back"), (34.2, "door"), (36.8, "build"), (59.0, "build")]


def camera(t):
    k = max(i for i in range(len(SHOTS)) if SHOTS[i][0] <= t)
    name = SHOTS[k][1]
    eye, tgt, fov = [np.array(v, float) if not isinstance(v, (int, float)) else v for v in CAMS[name]]
    nxt = SHOTS[min(k + 1, len(SHOTS) - 1)]
    if nxt[0] > SHOTS[k][0] and t > nxt[0] - 0.8 and nxt[1] != name:
        s = anim.ease((t - (nxt[0] - 0.8)) / 0.8)
        e2, t2, f2 = CAMS[nxt[1]]
        eye = (1 - s) * eye + s * np.array(e2, float); tgt = (1 - s) * tgt + s * np.array(t2, float); fov = (1 - s) * fov + s * f2
    # slow drift so shots never look frozen
    ang = 0.025 * math.sin(0.35 * t)
    if name == "build":
        ang = 0.25 * anim.ease((t - 37.0) / 22.0)
    c, s_ = math.cos(ang), math.sin(ang)
    d = eye - tgt; eye = tgt + np.array([c * d[0] - s_ * d[1], s_ * d[0] + c * d[1], d[2]])
    return eye, tgt, fov


def layer_alpha(o, t):
    """X-ray: fade the walls + roof while the door mechanism is the subject."""
    xr = 0.0
    if 2.6 <= t <= 7.2 or 29.0 <= t <= 31.8 or 34.0 <= t <= 37.0:
        xr = 1.0
    if o["layer"] in ("ply", "roof") and o["step"] in (3, 4) and xr:
        return 0.22
    if o["step"] == 5 and o["layer"] in ("roof", "metal", "dark") and (6.8 <= t <= 12.2 or 22.0 <= t <= 29.2):
        return 0.25                       # see the hens through the run roof
    if (o["layer"] == "hood" or o["node"] == "hood_door") and 11.0 <= t <= 22.3:
        return 0.12
    return o["alpha"]


def sky(t):
    # morning warm -> day neutral -> dusk orange -> neutral studio for the build
    stops = [(0, (0.86, 0.88, 0.9)), (3, (0.98, 0.86, 0.72)), (8, (0.86, 0.9, 0.94)), (24, (0.86, 0.9, 0.94)),
             (29, (0.95, 0.72, 0.55)), (36.5, (0.42, 0.45, 0.6)), (37.5, (0.9, 0.91, 0.92)), (60, (0.9, 0.91, 0.92))]
    ts = [s[0] for s in stops]; cs = np.array([s[1] for s in stops])
    return np.array([np.interp(t, ts, cs[:, i]) for i in range(3)])


def _ground(g=14000.0, n=46):
    xs = np.linspace(-g, g, n + 1); T = []
    for i in range(n):
        for j in range(n):
            a, b, c, d = (xs[i], xs[j]), (xs[i + 1], xs[j]), (xs[i + 1], xs[j + 1]), (xs[i], xs[j + 1])
            T.append([(*a, -2), (*b, -2), (*c, -2)]); T.append([(*a, -2), (*c, -2), (*d, -2)])
    return np.array(T, float)


GROUND_TRIS = _ground()


def frame(cfg, objs, t):
    eye, tgt, fov = camera(t)
    Rv = look_at(eye, tgt)
    w, h = int(W * SS), int(H * SS)
    f = (h / 2) / math.tan(math.radians(fov) / 2)
    skyc = sky(t)
    grad = np.linspace(1.0, 0.82, h)[:, None, None] * skyc[None, None, :]
    img = np.ascontiguousarray(np.broadcast_to(grad, (h, w, 3))).astype(np.float32)
    zb = np.full((h, w), 1e12, np.float32)
    light = np.array([0.45, -0.55, 0.7]); light /= np.linalg.norm(light)
    fill = np.array([-0.6, 0.4, 0.3]); fill /= np.linalg.norm(fill)
    tint = 0.75 + 0.25 * skyc / skyc.max()
    allV, allC, allA = [], [], []
    # ground
    allV.append(GROUND_TRIS); allC.append(np.tile([[0.62, 0.66, 0.55]], (len(GROUND_TRIS), 1))); allA.append(np.ones(len(GROUND_TRIS)))
    for o in objs:
        Mx = scene.obj_tf(cfg, o, t)
        if abs(np.linalg.det(Mx[:3, :3])) < 1e-6:
            continue
        V = o["V"].astype(float) @ Mx[:3, :3].T + Mx[:3, 3]
        tris = V[o["F"]]
        n = np.cross(tris[:, 1] - tris[:, 0], tris[:, 2] - tris[:, 0])
        n /= np.linalg.norm(n, axis=1, keepdims=True) + 1e-12
        view = eye - tris.mean(1); view /= np.linalg.norm(view, axis=1, keepdims=True)
        n = np.where((np.sum(n * view, 1) < 0)[:, None], -n, n)
        sh = 0.42 + 0.5 * np.clip(n @ light, 0, 1) + 0.18 * np.clip(n @ fill, 0, 1)
        col = np.clip(np.array(o["color"])[None] * sh[:, None] * tint[None], 0, 1)
        allV.append(tris); allC.append(col); allA.append(np.full(len(tris), layer_alpha(o, t)))
    V = np.concatenate(allV); C = np.concatenate(allC).astype(np.float32); A = np.concatenate(allA).astype(np.float32)
    cam = (V - eye) @ Rv.T
    z = cam[..., 2]
    sx = (w / 2 + f * cam[..., 0] / np.maximum(z, 1e-3)).astype(np.float32)
    sy = (h / 2 - f * cam[..., 1] / np.maximum(z, 1e-3)).astype(np.float32)
    sz = z.astype(np.float32)
    raster(sx, sy, sz, C, A, img, zb, True)
    # transparent: far to near
    order = np.argsort(-sz.mean(1))
    raster(sx[order], sy[order], sz[order], C[order], A[order], img, zb, False)
    im = Image.fromarray((np.clip(img, 0, 1) * 255).astype(np.uint8)).resize((W, H), Image.LANCZOS)
    return im, (eye, Rv, f / SS)


def project(p, camst):
    eye, Rv, f = camst
    c = (np.asarray(p, float) - eye) @ Rv.T
    if c[2] <= 1:
        return None
    return (W / 2 + f * c[0] / c[2], H / 2 - f * c[1] / c[2])


OPTION_NAME = {"base": "Base coop (no robot)", "starter": "Starter - vacuum egg picker on a 2-axis rail",
               "plus": "Plus - LeRobot SO-101 arm", "pro": "Pro - SO-101 on a short gantry"}


def labels(cfg, t):
    L = []
    a = P.ACT[P.ACT_TIER]
    lift = anim.door_lift(t)
    if 3.4 <= t <= 7.0 or 29.4 <= t <= 31.6:
        L += [((P.ACT_FIXED_X + 200, P.ACT_Y, P.ACT_Z), "12 V linear actuator (300 mm)"),
              ((P.PULLEY_X, P.ACT_Y, P.ACT_Z), "turnaround pulley"),
              (P.CORD_EYE, "cord eye"),
              ((P.XC, P.COOP_Y0, P.DOOR_Z_CLOSED + P.DOOR_PANEL[1] + lift - 40), "pop door: gravity close"),
              ((P.XC + 190, P.COOP_Y0 + 40, P.REED_OPEN_Z), "open reed"),
              ((P.XC + 190, P.COOP_Y0 + 40, P.REED_CLOSED_Z), "closed reed")]
    if 31.8 <= t <= 34.0:
        yb = P.COOP_Y1 + P.PLY_WALL
        L += [((P.CTRL_BOX_X, yb + P.CTRL_BOX[2] + 20, P.CTRL_BOX_TOP_Z - 50), "NC E-STOP on the control box"),
              ((P.CTRL_BOX_X, yb + 40, P.CTRL_BOX_TOP_Z - 20), "XIAO ESP32-S3 + DRV8874 + 5 V buck"),
              ((P.CTRL_BOX_X, yb + 10, P.GLAND_Z), "PG7 cable glands")]
    if 12.6 <= t <= 21.6 and cfg != "base":
        if cfg == "starter":
            L += [((P.ST_RAIL_X, 3200, P.HOOD_ROOF_Z - 30), "Y rail + Z plunger"), (tuple(anim.starter_cup(t)), "20 mm soft vacuum cup")]
            bx, by = P.BASKET_RAIL
        else:
            Ls, *_ = anim.arm_links(cfg, t)
            L += [(tuple(Ls["lower_arm_link"][:3, 3]), "LeRobot SO-101 follower")]
            bx, by = P.BASKET_PLUS
            if cfg == "pro":
                L += [((P.NB_CX, 3400, P.HOOD_ROOF_Z - 10), "Y gantry")]
        L += [((bx, by, P.BASKET_FLOOR_Z + 30), "egg tray + AprilTag")]
    return L


def overlay(im, cfg, t, camst):
    d = ImageDraw.Draw(im, "RGBA")
    f_s = ImageFont.truetype(FONT, 26); f_m = ImageFont.truetype(FONTB, 34); f_l = ImageFont.truetype(FONTB, 92)
    f_t = ImageFont.truetype(FONT, 22)
    placed = []
    for k, (p, txt) in enumerate(labels(cfg, t)):
        s = project(p, camst)
        if s is None or not (0 < s[0] < W and 0 < s[1] < H):
            continue
        tx, ty = s[0] + 60, s[1] - 70
        for _ in range(8):                        # nudge down until it clears earlier labels
            if all(abs(ty - py) > 40 or abs(tx - px) > 330 for px, py in placed):
                break
            ty += 44
        placed.append((tx, ty))
        tw = d.textlength(txt, font=f_t)
        if tx + tw + 20 > W:
            tx = s[0] - 60 - tw
        d.line([s, (tx, ty + 14)], fill=(20, 20, 20, 220), width=3)
        d.ellipse([s[0] - 6, s[1] - 6, s[0] + 6, s[1] + 6], fill=(230, 80, 40, 255))
        d.rounded_rectangle([tx - 8, ty - 4, tx + tw + 8, ty + 30], 6, fill=(255, 255, 255, 225))
        d.text((tx, ty), txt, font=f_t, fill=(20, 20, 20, 255))
    cap = anim.caption(cfg, t)
    if cap:
        tw = d.textlength(cap, font=f_m)
        d.rounded_rectangle([W / 2 - tw / 2 - 24, H - 120, W / 2 + tw / 2 + 24, H - 62], 12, fill=(15, 20, 25, 200))
        d.text((W / 2 - tw / 2, H - 112), cap, font=f_m, fill=(255, 255, 255, 255))
    # brand + option
    d.text((36, 26), "TenderCells", font=ImageFont.truetype(FONTB, 30), fill=(30, 60, 40, 255))
    d.text((36, 62), "Chicken Tender | " + OPTION_NAME[cfg], font=f_s, fill=(40, 40, 40, 255))
    # firmware HUD during door phases
    if TL_door(t):
        st = anim.fw_state(t)
        lines = [f"door_logic state: {st['state'].upper()}", f"lift {st['lift_mm']:.0f} / {P.DOOR_LIFT:.0f} mm   motor {st['motor']:+d}",
                 f"reed open {int(st['reed_open'])}   reed closed {int(st['reed_closed'])}",
                 f"E-STOP loop {'OK' if st['estop_ok'] else 'OPEN'}   latch {int(st['latched'])}   I {st['current_mA'] / 1000:.2f} A",
                 f"real time {st['real_t_s']:.0f} s (time-lapse)"]
        x0, y0 = W - 560, 30
        d.rounded_rectangle([x0, y0, W - 30, y0 + 36 + 34 * len(lines)], 12, fill=(15, 20, 25, 205))
        d.text((x0 + 18, y0 + 10), "XIAO ESP32-S3 door controller", font=ImageFont.truetype(FONTB, 22), fill=(140, 220, 160, 255))
        for i, ln in enumerate(lines):
            colr = (255, 120, 110, 255) if ("OPEN" in ln and "E-STOP" in ln) or "ESTOP" in ln else (235, 235, 235, 255)
            d.text((x0 + 18, y0 + 42 + 34 * i), ln, font=f_t, fill=colr)
    # title + end cards
    def card(alpha, title, sub, sub2=""):
        a = int(235 * alpha)
        d.rectangle([0, 0, W, H], fill=(245, 244, 238, a))
        tw = d.textlength(title, font=f_l)
        d.text((W / 2 - tw / 2, H / 2 - 150), title, font=f_l, fill=(30, 60, 40, int(255 * alpha)))
        for k, s in enumerate([sub, sub2]):
            if s:
                tw = d.textlength(s, font=f_m)
                d.text((W / 2 - tw / 2, H / 2 - 10 + 60 * k), s, font=f_m, fill=(40, 40, 40, int(255 * alpha)))
    if t < 2.5:
        card(1.0 - anim.seg(t, 1.9, 2.5), "TenderCells", "Chicken Tender: the smart backyard coop", OPTION_NAME[cfg])
    if t > 56.0:
        card(anim.seg(t, 56.0, 56.6), "TenderCells", "Chicken Tender | " + OPTION_NAME[cfg], END_LINE[cfg])
    return im


END_LINE = {"base": "Auto door: firmware-checked, gravity close, hardware E-STOP",
            "starter": "Auto door + vacuum egg picker: eggs in the tray, no coop visit",
            "plus": "Auto door + SO-101: teach it with the leader arm, train it in sim",
            "pro": "Auto door + SO-101 on a gantry: every nest spot, room to grow"}


def TL_door(t):
    return 2.6 <= t <= 7.4 or 29.0 <= t <= 37.0


def press_estop(objs, t):
    return objs


EDITS = {"full": [(0.0, 59.0)], "short": [(0.0, 7.0), (11.6, 25.0), (29.0, 37.0), (56.0, 59.0)]}


def edit_times(name, fps):
    out = []
    for a, b in EDITS[name]:
        out += list(np.arange(a, b, 1.0 / fps))
    return out


def main():
    cfg = sys.argv[1]
    objs = scene.build_objects(cfg)
    if sys.argv[2] == "still":
        t = float(sys.argv[3]); im, cs = frame(cfg, objs, t); overlay(im, cfg, t, cs).save(sys.argv[4]); return
    n0, n1, out = int(sys.argv[2]), int(sys.argv[3]), sys.argv[4]
    fps = int(os.environ.get("FPS", "24"))
    times = edit_times(os.environ.get("EDIT", "full"), fps)
    n1 = min(n1, len(times))
    os.makedirs(os.path.dirname(out) or ".", exist_ok=True)
    cmd = ["ffmpeg", "-y", "-v", "error", "-f", "rawvideo", "-pix_fmt", "rgb24", "-s", f"{W}x{H}", "-r", str(fps), "-i", "-",
           "-c:v", "libx264", "-preset", "veryfast", "-crf", "21", "-pix_fmt", "yuv420p", out]
    pr = subprocess.Popen(cmd, stdin=subprocess.PIPE)
    for n in range(n0, n1):
        t = times[n]
        im, cs = frame(cfg, objs, t)
        pr.stdin.write(np.asarray(overlay(im, cfg, t, cs)).tobytes())
    pr.stdin.close(); pr.wait()
    print("ok", cfg, n0, n1, len(times))


if __name__ == "__main__":
    main()
