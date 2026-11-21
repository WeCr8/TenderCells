# Chicken Tender family coop + run - CAD (rev A, draft)

Simple parametric 3D model of the coop and run in `docs/CHICKEN_TENDER_BUILD_GUIDE.md`
(TC-CHKN-BUILD-001 rev A): 4 x 4 ft coop raised 24 in, 3:12 roof sloping to the back, 4 x 12 x 6 ft run
(8 ft open + 4 ft under the coop), 2 nest boxes (12 in cubes) on the right, 45 in 2x4 roost, ramp,
pop door, cleanout door, run door, hardware cloth and the 12 in predator apron.

**What it reuses.** There was no wood-coop CAD in the repo (the June 2026 SolidWorks files and the
CT72 build123d model are the 72 in aluminium robot cell). This model follows the CT72 cell's
conventions (`hardware/ct72-cell/cad/` in PR #182): one parameter file, build123d, mm internally,
labeled + coloured STEP assemblies, the same `validate_step.py` re-import check. It uses the CT72
size preset 2 (M = 48 x 48 x 72 in) as the footprint and the CT72 nest-box rule
(12 in cube interior, 1 box per 4 hens, minimum 2). Every wood part comes from the guide's cut list
and is named by its ID (C1..C14, P1..P7, R1..R10).

## Files
| File | What |
|---|---|
| `step/CT_COOP_A_assembly.step` | Everything: COOP, RUN, MESH (hardware cloth + apron) groups, 78 named solids |
| `step/CT_COOP_A_framing_no_mesh.step` | Coop + run framing without hardware cloth (easier to look at) |
| `step/CT_COOP_A_coop_only.step` | Just the coop |
| `step/CT_COOP_A_assembly.stl` | Coarse mesh for quick viewers |
| `cad/coop_params.py` | Every dimension. Change a value, re-run `build.py` |
| `cad/coop_model.py` | Parts (framing as boxes, no joinery) |
| `cad/build.py`, `cad/validate_step.py`, `cad/render.py` | Export, re-import check, preview PNG |
| `reports/` | Build report (modelled cut list), STEP validation, preview PNGs |

## Open in SolidCraft
SolidCraft (open-source parametric CAD, solidcraft.io) reads STEP AP203/214/242 with names, colours
and the component tree: **File > Open > `CT_COOP_A_assembly.step`**, or `solidcraft CT_COOP_A_assembly.step`,
or drag the file onto the window (also works in the browser version). The STEP becomes an Import base
feature; later features build on it. It also opens in SolidWorks, Onshape, FreeCAD and Fusion.

## Rebuild
```
pip install build123d matplotlib
cd cad && python build.py && python validate_step.py "step/*.step" && python render.py
```

## Coordinate frame and assumptions
Origin = run-door end, left, ground. +X left->right, +Y run end -> coop back, +Z up (inches in the
names, mm in the file). Assumed where the guide is silent: window at 52 in, 8 in from the front;
cleanout hole 1 in above the floor; pop door shown open; top rails inside the 72 in posts so the run
walls are 72 in; roof is a flat envelope (ribs not modelled), so the top of the roof sheet is ~82 in,
above the 75-1/2 in post tops the guide quotes as the tallest point. Draft: not checked against a real build.
