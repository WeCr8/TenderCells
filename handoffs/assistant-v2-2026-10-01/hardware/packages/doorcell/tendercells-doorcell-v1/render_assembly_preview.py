#!/usr/bin/env python3
import math
import struct
from pathlib import Path

import matplotlib

matplotlib.use("Agg")

import matplotlib.pyplot as plt
import numpy as np
from mpl_toolkits.mplot3d.art3d import Poly3DCollection


ROOT = Path(__file__).resolve().parent
STL = ROOT / "stl"
OUT = ROOT / "doorcell_assembly_preview.png"


def load_binary_stl(path: Path) -> np.ndarray:
    data = path.read_bytes()
    if len(data) < 84:
        return load_ascii_stl(path)
    tri_count = struct.unpack_from("<I", data, 80)[0]
    expected = 84 + tri_count * 50
    if expected > len(data):
        return load_ascii_stl(path)
    tris = np.empty((tri_count, 3, 3), dtype=np.float32)
    offset = 84
    for i in range(tri_count):
        # normal: 12 bytes, then three vertices, then attribute bytes
        offset += 12
        for j in range(3):
            tris[i, j] = struct.unpack_from("<fff", data, offset)
            offset += 12
        offset += 2
    return tris


def load_ascii_stl(path: Path) -> np.ndarray:
    verts = []
    for line in path.read_text(errors="ignore").splitlines():
        line = line.strip()
        if line.startswith("vertex "):
            _, x, y, z = line.split()
            verts.append((float(x), float(y), float(z)))
    if len(verts) % 3 != 0 or not verts:
        raise ValueError(f"{path} does not contain parseable STL triangles")
    return np.array(verts, dtype=np.float32).reshape((-1, 3, 3))


def rot_z(deg: float) -> np.ndarray:
    a = math.radians(deg)
    c, s = math.cos(a), math.sin(a)
    return np.array([[c, -s, 0], [s, c, 0], [0, 0, 1]], dtype=np.float32)


def transform(tris: np.ndarray, translate=(0, 0, 0), rz=0) -> np.ndarray:
    r = rot_z(rz)
    t = np.array(translate, dtype=np.float32)
    return tris @ r.T + t


def to_plot_coords(tris: np.ndarray) -> np.ndarray:
    # OpenSCAD model: X = width, Y = height, Z = depth.
    # Matplotlib model: X = width, Y = depth, Z = height.
    out = np.empty_like(tris)
    out[:, :, 0] = tris[:, :, 0]
    out[:, :, 1] = tris[:, :, 2]
    out[:, :, 2] = tris[:, :, 1]
    return out


def add_part(ax, name, color, translate=(0, 0, 0), rz=0, alpha=1.0):
    tris = load_binary_stl(STL / f"{name}.stl")
    tris = transform(tris, translate=translate, rz=rz)
    tris = to_plot_coords(tris)
    coll = Poly3DCollection(
        tris,
        facecolors=color,
        edgecolors=(0.18, 0.18, 0.18, 0.18),
        linewidths=0.08,
        alpha=alpha,
    )
    ax.add_collection3d(coll)
    return tris


overall_w = 438
overall_h = 368
rail_thick = 32
motor_jamb_w = 78
top_seg_len = overall_w / 3
bottom_seg_len = overall_w / 3
left_jamb_seg_h = overall_h / 2
right_lower_h = 118
right_motor_h = 156
right_upper_h = overall_h - right_lower_h - right_motor_h
door_part_w = 270 / 2 + 14
door_part_h = 326 / 2 + 8

fig = plt.figure(figsize=(16, 10), dpi=180)
ax = fig.add_subplot(111, projection="3d")
fig.patch.set_facecolor("#f6f4ef")
ax.set_facecolor("#f6f4ef")

frame = (0.78, 0.78, 0.73, 1)
frame_dark = (0.68, 0.69, 0.66, 1)
green1 = (0.16, 0.58, 0.12, 1)
green2 = (0.20, 0.70, 0.14, 1)
rack = (0.92, 0.90, 0.82, 1)
black = (0.05, 0.05, 0.05, 1)
box = (0.48, 0.53, 0.48, 1)

# Frame ring
add_part(ax, "frame_top_left", frame)
add_part(ax, "frame_top_center", frame, (top_seg_len, 0, 0))
add_part(ax, "frame_top_right", frame, (top_seg_len * 2, 0, 0))
add_part(ax, "frame_bottom_center", frame, (bottom_seg_len, overall_h - rail_thick, 0))
add_part(ax, "frame_bottom_left", frame, (0, overall_h - rail_thick, 0))
add_part(ax, "frame_bottom_right", frame, (bottom_seg_len * 2, overall_h - rail_thick, 0))
add_part(ax, "frame_left_lower", frame_dark, (0, rail_thick, 0))
add_part(ax, "frame_left_upper", frame_dark, (0, rail_thick + left_jamb_seg_h, 0))
add_part(ax, "frame_right_lower", frame_dark, (overall_w - motor_jamb_w, rail_thick, 0))
add_part(ax, "frame_right_motor_mid", frame_dark, (overall_w - motor_jamb_w, rail_thick + right_lower_h, 0))
add_part(ax, "frame_right_upper", frame_dark, (overall_w - motor_jamb_w, rail_thick + right_lower_h + right_motor_h, 0))

# Sliding door, partially closed
door_x = 151
door_y = 21
door_z = 18
add_part(ax, "sliding_door_left_upper", green1, (door_x, door_y + door_part_h, door_z))
add_part(ax, "sliding_door_left_lower", green1, (door_x, door_y, door_z))
add_part(ax, "sliding_door_right_upper", green2, (door_x + door_part_w - 14, door_y + door_part_h, door_z))
add_part(ax, "sliding_door_right_lower", green2, (door_x + door_part_w - 14, door_y, door_z))

# Rack strips
add_part(ax, "rack_strip", rack, (door_x + 8, door_y + 19, door_z + 12))
add_part(ax, "rack_strip", rack, (door_x + 99, door_y + 19, door_z + 12))
add_part(ax, "rack_strip", rack, (door_x + 190, door_y + 19, door_z + 12))

# Motor and controller
add_part(ax, "motor_mount", black, (overall_w - motor_jamb_w + 72, rail_thick + right_lower_h + 32, 8), rz=90)
add_part(ax, "pinion_gear", black, (overall_w - motor_jamb_w + 32, rail_thick + right_lower_h + 78, 36))
add_part(ax, "controller_box", box, (-195, rail_thick + right_lower_h + 20, 8))

# Optional solar panel housing and adjustable ball mount.
solar_black = (0.08, 0.08, 0.08, 1)
add_part(ax, "solar_panel_back_tray", solar_black, (-205, -150, 12))
add_part(ax, "solar_panel_front_bezel", solar_black, (-205, -150, 27))
add_part(ax, "solar_ball_mount_base", box, (-120, -78, -32))

# Cable between controller and motor bay
xs = [-25, overall_w - motor_jamb_w + 42]
ys = [32, 32]
zs = [rail_thick + right_lower_h + 70, rail_thick + right_lower_h + 82]
ax.plot(xs, ys, zs, color="black", linewidth=3)

# Simple screw head dots on front plane
for x in [22, top_seg_len + 22, top_seg_len * 2 + 22, overall_w - 24]:
    ax.scatter([x], [60], [16], color="black", s=15)
    ax.scatter([x], [60], [overall_h - 16], color="black", s=15)
for y in [55, overall_h / 2, overall_h - 55]:
    ax.scatter([24], [60], [y], color="black", s=15)
    ax.scatter([overall_w - 39], [60], [y], color="black", s=15)

ax.text(
    -165,
    72,
    382,
    "TenderCells DoorCell V1.4 Electronics + Solar-Ready Assembly",
    color=(0.05, 0.30, 0.18),
    fontsize=12,
    weight="bold",
)

all_x = [-225, overall_w + 40]
all_y = [-45, 100]
all_z = [-180, overall_h + 20]
ax.set_xlim(all_x)
ax.set_ylim(all_y)
ax.set_zlim(all_z)
ax.set_box_aspect((all_x[1] - all_x[0], all_y[1] - all_y[0], all_z[1] - all_z[0]))
ax.view_init(elev=18, azim=-72)
ax.set_axis_off()
plt.tight_layout(pad=0)
plt.savefig(OUT, bbox_inches="tight", pad_inches=0.08)
print(OUT)
