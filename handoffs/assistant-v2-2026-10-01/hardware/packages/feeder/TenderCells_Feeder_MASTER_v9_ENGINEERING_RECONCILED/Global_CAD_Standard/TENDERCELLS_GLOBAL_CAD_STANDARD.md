# Tender Cells Global CAD Standard v1.0

This folder is the reusable engineering contract for Chicken Tender, Duck Dock, Roaming Roost, Predator Monitor and future Tender Cells hardware. Product CAD may change; these conventions should remain stable.

## Units and coordinate frame
All manufacturing geometry is millimeters. Use a right-handed coordinate system: **+X right, +Z up, -Y front/service side**. Product-level origin is datum intersection A/B/C. Never reposition imported vendor electronics to arbitrary local zero without recording the transform.

## Master datum scheme
- **Datum A:** primary mounting/base plane.
- **Datum B:** product longitudinal center plane.
- **Datum C:** product transverse center plane or defined service-face plane.
- **Functional origins:** named `IF_<SYSTEM>_<NN>` and stored in `INTERFACE_CONTROL.csv`.

## Geometry authority
1. Native CAD (when available)
2. Canonical STEP
3. STL for printing only
4. GLB for visualization/digital twin only

Do not dimension from STL or GLB. STEP is the neutral CAD authority in this package.

## Reuse rule
New Tender Cells products should import `TC-GLOBAL-REF-0001_COORDINATE_FRAME_100MM.step`, adopt the global parameters, then create product-specific parameters prefixed by product family, e.g. `CT_`, `DD_`, `RR_`, `PM_`.
