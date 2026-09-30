"""Synthetic weed images from Isaac Sim Replicator - train the Weed Patrol detector without
hand-labelling. Run inside Isaac Sim's Python:

    ./python.sh firmware/jetson-nano/isaac/weed_dataset.py --stage yard.usda --bed bed1 --frames 500 --out _weeds

`--stage` is the property exported from the OS (Property Layout -> "Isaac Sim (.usda)"); `--bed`
is the garden item id (its box gives the bed size). Each frame scatters weed stand-ins over the
bed, moves the overhead camera like the gantry tool camera, and writes RGB + tight 2D boxes
(Replicator BasicWriter) you can convert to YOLO and train with `yolo detect train`.
Swap the cone stand-ins for real weed USD assets (`--weed-usd`) for better transfer.
"""

from __future__ import annotations

import argparse
from dataclasses import dataclass
from typing import Optional, Tuple


@dataclass
class DatasetPlan:
    """Pure description of a run (unit-tested without Isaac Sim)."""

    bed_min: Tuple[float, float]  # metres, stage XY
    bed_max: Tuple[float, float]
    frames: int = 500
    weeds_per_frame: int = 12
    camera_height_m: Tuple[float, float] = (0.6, 1.2)
    resolution: Tuple[int, int] = (1024, 768)
    weed_scale_m: Tuple[float, float] = (0.02, 0.08)

    def validate(self) -> None:
        if not (self.bed_max[0] > self.bed_min[0] and self.bed_max[1] > self.bed_min[1]):
            raise ValueError("bed_max must be above bed_min")
        if not 1 <= self.frames <= 100_000:
            raise ValueError("frames must be 1-100000")
        if not 1 <= self.weeds_per_frame <= 200:
            raise ValueError("weeds_per_frame must be 1-200")

    @property
    def centre(self) -> Tuple[float, float]:
        return ((self.bed_min[0] + self.bed_max[0]) / 2, (self.bed_min[1] + self.bed_max[1]) / 2)


def bed_bounds_from_stage(stage, bed_prim: str) -> Tuple[Tuple[float, float], Tuple[float, float], float]:
    """World-space XY bounds and top Z of a bed prim (needs pxr)."""
    from pxr import Usd, UsdGeom  # type: ignore

    prim = stage.GetPrimAtPath(bed_prim)
    if not prim.IsValid():
        raise ValueError(f"No prim at {bed_prim}")
    box = UsdGeom.BBoxCache(Usd.TimeCode.Default(), [UsdGeom.Tokens.default_]).ComputeWorldBound(prim).ComputeAlignedRange()
    lo, hi = box.GetMin(), box.GetMax()
    return (lo[0], lo[1]), (hi[0], hi[1]), hi[2]


def run(plan: DatasetPlan, stage_path: str, bed_prim: str, out_dir: str, weed_usd: Optional[str] = None) -> None:  # pragma: no cover
    from isaacsim import SimulationApp  # type: ignore

    app = SimulationApp({"headless": True})
    import omni.replicator.core as rep  # type: ignore
    import omni.usd  # type: ignore

    omni.usd.get_context().open_stage(stage_path)
    stage = omni.usd.get_context().get_stage()
    (x0, y0), (x1, y1), top = bed_bounds_from_stage(stage, bed_prim)
    plan.bed_min, plan.bed_max = (x0, y0), (x1, y1)
    plan.validate()
    cx, cy = plan.centre

    with rep.new_layer():
        camera = rep.create.camera(position=(cx, cy, top + plan.camera_height_m[1]), look_at=(cx, cy, top))
        render = rep.create.render_product(camera, plan.resolution)
        if weed_usd:
            weeds = rep.randomizer.instantiate([weed_usd] * plan.weeds_per_frame, size=plan.weeds_per_frame, mode="scene_instance")
            with weeds:
                rep.modify.semantics([("class", "weed")])
        else:
            weeds = rep.create.cone(count=plan.weeds_per_frame, semantics=[("class", "weed")])
        with rep.trigger.on_frame(num_frames=plan.frames):
            with weeds:
                rep.modify.pose(
                    position=rep.distribution.uniform((x0, y0, top), (x1, y1, top)),
                    rotation=rep.distribution.uniform((0, 0, 0), (0, 0, 360)),
                    scale=rep.distribution.uniform(plan.weed_scale_m[0], plan.weed_scale_m[1]),
                )
            with camera:  # the gantry tool camera looks straight down from a varying height
                rep.modify.pose(
                    position=rep.distribution.uniform((x0, y0, top + plan.camera_height_m[0]), (x1, y1, top + plan.camera_height_m[1])),
                    look_at=(cx, cy, top),
                )
        writer = rep.WriterRegistry.get("BasicWriter")
        writer.initialize(output_dir=out_dir, rgb=True, bounding_box_2d_tight=True)
        writer.attach([render])

    rep.orchestrator.run_until_complete()
    app.close()


def main() -> None:  # pragma: no cover
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("--stage", required=True)
    ap.add_argument("--bed", required=True, help="garden item id in the exported stage")
    ap.add_argument("--frames", type=int, default=500)
    ap.add_argument("--weeds", type=int, default=12)
    ap.add_argument("--out", default="_weeds")
    ap.add_argument("--weed-usd", default=None)
    a = ap.parse_args()
    from usd_names import prim_name

    plan = DatasetPlan((0, 0), (1, 1), frames=a.frames, weeds_per_frame=a.weeds)
    run(plan, a.stage, f"/World/Property/{prim_name(a.bed)}", a.out, a.weed_usd)


if __name__ == "__main__":  # pragma: no cover
    main()
