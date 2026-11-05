# Chicken Tender Cell 72x72 – rev A1.2 CAD source (draft)

This is the parametric build123d/OCP source for the CT72 cell. The STEP files, reports and the A1/A1.1 history are in Google Drive: Tender Cells > CAD, BOMs & Build Instructions > Chicken Tender Cell 72x72 > rev 0 concept > `rev A1.2 (2026-10-16)`.

- `cad/ct72_params.py`: every dimension (flock size, nest boxes, roost bars, belt gantry, travel).
- `cad/ct72_model.py`: parts per variant (starter / plus / pro / pro_heavy), roost deployed/stowed, lids closed/open.
- `cad/checks_a12.py`: OCC clash checks; `cad/reach_routines.py`: SO-101/vacuum reach for TOP and SIDE access plus the egg/cleaning routine sweeps; `cad/gantry_sizing.py`; `cad/bom_a12.py`; `cad/export_cell_json.py`, which writes `ct72_cell_a12.json` for `firmware/jetson-nano/ct72`.
- Needs `pip install build123d numpy` and `ref/UR3e.step` (UR download, not committed) for pro_heavy.

Results and open decisions: `VERIFICATION_A1.2.md`.
