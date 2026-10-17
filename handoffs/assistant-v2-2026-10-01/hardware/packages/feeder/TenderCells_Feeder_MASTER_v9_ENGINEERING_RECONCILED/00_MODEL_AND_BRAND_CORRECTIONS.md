# v6 Corrections

## Brand
- Replaced v5 downstream icon exports.
- App icons are now generated from the repository's dedicated `tc-mark.svg`, not the full wordmark lockup.
- Full lockup and mark are separate assets.
- Legacy v5 derivatives are explicitly prefixed `LEGACY_DO_NOT_USE_`.

## Mechanical/digital models
- Identified legacy full STEP as servo-era geometry while firmware/docs specify the 28BYJ-48 stepper default.
- Created a canonical drive-neutral mechanical core.
- Made the stepper drive and load-cell assemblies explicit modules.
- Moved the old full assembly to legacy reference status.
- Created CAD-exact GLBs directly from canonical STEP geometry.
- Old interactive GLB remains only as a functional software demo and is prohibited as a dimension source.

## Global engineering reuse
Added reusable parameter, datum, naming, interface, SolidWorks, Fusion, electronics-envelope, GLB, metadata-schema and new-product-template documents under `Global_CAD_Standard/`.
