# Smart Feeder v9: UNTESTED design package (read this first)

**Status: possible, never tested under working conditions.** Nothing here has been built, run with real feed, or bench-tested.
"Math verified" in the package means CAD dimensions, clearances, axes, pocket count and static load were reconciled on paper (by the package author's own audit; **not independently re-checked here**). It does **not** mean feed flow, dosing or jam behaviour is proven.

## Before anyone relies on it
- Run `Final_Engineering_Audit/PHYSICAL_VALIDATION_PROTOCOL.md`: dose repeatability (weighed dispenses), jam test, load-cell test, cleaning/environment.
- Treat feed dose as unknown: the 19.94 cm3 pocket volume is a geometric maximum, not a dose. Calibrate by weight for each feed type.
- Verify purchased parts dimensionally. Generic marketplace electronics are not interchangeable.
- Do not procure from `BOM/LEGACY_FULL_BUILD_BOM_DO_NOT_PROCURE.csv`. Use the `TC-FDR-0001` BOM only after a supplier/SKU check.
- Firmware in `Firmware/` has not been compiled or flashed here. The MG996R `.ino` is an alternate and not for the six-pocket indexer.
- Per the package's own readiness note: suitable for a controlled prototype or classroom pilot only; not for production release.

## What was imported (text only) and what was left out
Imported: docs, BOM, electronics tables, audit and parameter tables, global CAD standard tables, manufacturing notes, validation reports, firmware sources, and `CAD/MASTER_PARAMETERS.json`.
Left out on purpose: STEP/STL/GLB files (about 16 MB), vendor reference CAD, brand assets, marketing images, and the web/React Native app integration. They stay with the owner's original package (`TenderCells_Feeder_MASTER_v9_ENGINEERING_RECONCILED.zip`, received 2026-11-22).

## Engineering review
See `ENGINEERING_REVIEW_INDEPENDENT.md`: three blockers and a hole collision found (plate/housing overlap in the assembly STEP, M4 holes breaking into vertical holes, firmware pins vs pinout, homing logic). A fix proposal V9b is in `CAD_proposed/` and section F of the review: checked with tools, not built or tested.

## Known mismatches to resolve
See `COMPARISON_NOTES.md` in this folder. Headline items: the schedule UI offers feed amounts up to 5000 g while the backend clamps at 1000 g; the v9 hopper holds roughly 1.5-1.8 kg, and one pocket holds roughly 12-14 g if completely filled (planning density band only).
