# Tender Cells Real-Asset Marketing Imagery

## Source-of-truth rule
Every image in `Real_Asset_Renders/` whose name begins `REAL_` or `CAD-Exact` is rendered/composited from the actual canonical GLB geometry shipped in this package:

- `CAD/CANONICAL/TC-FDR-GLB-1000_MECHANICAL_CORE_EXACT.glb`
- `CAD/CANONICAL/TC-FDR-GLB-1100_STEPPER_DRIVE_EXACT.glb`

The farm scenery is marketing context. The feeder geometry placed into the farm composite comes from the packaged GLB, not an AI-invented feeder.

## Brand rule
`Brand_Assets/SOURCE_OF_TRUTH/TenderCells_Logo_FULL_ORIGINAL.png` is copied from the supplied original logo image and is the marketing raster source for this edition. Do not redraw its linework.

## Image classifications
- `01_REAL_CORE_ISOMETRIC.png`: exact GLB geometry, CAD presentation.
- `02_REAL_CORE_FRONT.png`: exact GLB geometry.
- `03_REAL_CORE_SIDE.png`: exact GLB geometry.
- `04_REAL_STEPPER_DRIVE.png`: exact default stepper-drive GLB geometry.
- `05_REAL_ASSET_COMBINED.png`: combined exact package GLB geometry.
- `06_REAL_CORE_TRANSPARENT.png`: transparent exact-geometry marketing source.
- `07_REAL_CAD_FARM_MARKETING_COMPOSITE.png`: exact feeder geometry composited into farm scenery.
- `08_REAL_CAD_STUDIO_MARKETING.png`: exact feeder geometry on studio background.
- `TC-FDR-MKT-1000_REAL_CAD_COMBINED.glb`: combined GLB source for marketing/web rendering.

## Important limitation
These images are marketing/communication assets, not manufacturing drawings. Dimensions and interfaces must come from STEP, the master parameter files, and the measurement audit.
