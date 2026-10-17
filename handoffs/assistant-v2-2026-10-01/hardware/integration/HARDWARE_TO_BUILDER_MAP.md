# Hardware → Builder Map

## Feeder

Engineering source → Builder source:
- procurement BOM → `parts_list`
- canonical STEP/STL → technical drawing/reference
- technical images → step illustration candidates
- electronics BOM/PINOUT → electronics steps
- firmware → flash/code step
- calibration → checkpoint/test steps
- App_Integration GLB → Property Twin / digital-twin visualization
- validation reports → readiness metadata

Proposed milestone:
**M10 — Build a Smart Feeder**  
Only add to the main ladder after core safety/firmware reconciliation.

## DoorCell

Engineering source → Builder source:
- BOM → `parts_list`
- STLs/OpenSCAD → assembly visuals
- ASSEMBLY.md → source step order
- ELECTRONICS.md → power/wiring source
- ENGINEERING_CALCULATIONS.md → engineer-depth explanations
- TEST_PLAN.md → checkpoints/validation gates
- solar files → optional advanced branch

Near-term use:
**replace/reconcile the existing Chicken Tender Door concept book** rather than create a separate competing door manual.

## Shared rule

Builder must not copy raw prose blindly.

Convert engineering source into:
- one action;
- one image;
- parts used on that action;
- look_for;
- watch_out;
- safety gate;
- source_refs;
- validation/readiness state.
