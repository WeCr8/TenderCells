"""Quick preview PNG of the framing (no mesh) from the model, matplotlib only."""
import os, sys
import matplotlib; matplotlib.use("Agg")
import matplotlib.pyplot as plt
from mpl_toolkits.mplot3d.art3d import Poly3DCollection
import coop_model as M
from coop_params import COLORS, IN
ROOT = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..")
fig = plt.figure(figsize=(12, 7)); ax = fig.add_subplot(111, projection="3d")
for p in M.all_parts():
    if p.group == "MESH" and "apron" not in p.name: continue
    verts, tris = p.shape.tessellate(2.0)
    pts = [[(v.X / IN, v.Y / IN, v.Z / IN) for v in (verts[a], verts[b], verts[c])] for a, b, c in tris]
    col = COLORS[p.layer] + ((0.35,) if p.group == "MESH" else (1.0,))
    ax.add_collection3d(Poly3DCollection(pts, facecolor=col, edgecolor=(0, 0, 0, 0.15), linewidths=0.2))
ax.set_xlim(-12, 64); ax.set_ylim(-12, 156); ax.set_zlim(0, 90)
ax.set_box_aspect((76, 168, 90)); ax.view_init(elev=22, azim=float(sys.argv[1]) if len(sys.argv) > 1 else -55)
ax.set_xlabel("X in"); ax.set_ylabel("Y in"); ax.set_zlabel("Z in")
ax.set_title("Chicken Tender family coop + run (TC-CHKN-BUILD-001 rev A) - framing, hardware cloth hidden")
out = os.path.join(ROOT, "reports", f"CT_COOP_A_preview{'_' + sys.argv[1] if len(sys.argv) > 1 else ''}.png")
plt.tight_layout(); plt.savefig(out, dpi=110); print(out)
