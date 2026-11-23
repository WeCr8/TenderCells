# Tolerances and Fits — Smart Feeder v5

All controlled CAD dimensions are millimeters. Do not scale STL files in the slicer.

## Functional interfaces
- **6 mm D-shaft:** purchased shaft controls final fit. Dry-fit before loading feed.
- **696 bearing:** nominal 6 × 15 × 5 mm. Verify purchased bearing OD/ID.
- **TAL220B-style load cell:** 55 × 12.7 × 12.7 mm reference, M5 mounting on the intended beam pattern. Purchased drawing controls.
- **Heat-set inserts:** M3/M4/M5. Print the included insert coupon first because insert OD and printer hole shrink vary.
- **TPU hopper gasket:** 1.8 mm modeled thickness. Verify compression with selected TPU durometer.
- **Rotor/housing:** must rotate freely under feed dust and pellet/crumb loading. Validate with the exact feed used in class or coop.

## FDM fit rule
For new mating features, 0.25–0.40 mm per-side clearance is a useful prototype starting range, but the supplied CAD geometry is the master. Adjust the parametric source rather than scaling exported STLs.

## Receiving inspection
Measure the actual purchased stepper, ULN2003 PCB, HX711 PCB, XIAO board, load cell, bearing, shaft, magnet and inserts before a multi-kit production run. Replace reference-envelope CAD when a selected SKU differs.
