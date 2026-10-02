# Tender Cells Smart Feeder — Final Engineering Reconciliation V9

## Purpose
This revision audits the feeder as a physical mechanism rather than as a file bundle. CAD dimensions were re-measured from STEP solids and the interfaces were recomputed part-to-part.

## Corrections made
1. **Rotor radial clearance:** V8 used a 69.6 mm rotor in a 72 mm bore = 1.20 mm radial gap per side. V9 uses **70.8 mm OD**, giving **0.60 mm per side**.
2. **Rotor axial containment:** V8 rotor width was 40.0 mm while closure inner faces are 52.0 mm apart = **6.0 mm gap per side**, an unacceptable feed-loss path. V9 rotor width is **50.8 mm**, giving **0.60 mm per side**.
3. **Drive-side closure:** the servo-era side plate had a large center opening. It is no longer the default feed-containment plate. The V9 default uses a second 696-bearing closure plate on the drive side.
4. **Bearing count:** the default metering shaft is now treated as supported at both sides: **2 × 696 bearings + 2 retainers**.
5. **Drive axis:** V8's stepper reference subassembly mixed rotor Y-axis geometry with shaft/motor Z-axis geometry. `TC-FDR-SUB-2100_STEPPER_DRIVE_ALIGNED_V9.step` aligns the reference drive along the feeder rotor Y-axis.
6. **Gasket math:** the actual STEP gasket is 1.8 mm thick; the old 2.4 mm `gasket_cs` value is retired. Against a 1.6 mm groove, nominal proud compression is about **11.1%**.

## Feed metering calculation
Corrected rotor geometric void is approximately **19.94 cm³ per pocket** by cylinder-minus-solid analysis. Using a planning bulk-density band of 0.58–0.68 g/cm³ gives a theoretical completely-filled pocket of roughly **11.6–13.6 g**. At an engineering fill-factor band of 70–90%, the planning dispense is **8.1–12.2 g per 60° index**.

This is **not** a guaranteed feed dose. Real pellets/crumbles vary in bulk density, particle distribution, moisture and flowability. Calibration by weighed dispenses is mandatory.

## Hopper/load-cell calculation
Approximate inner hopper volume from the parametric square-frustum model is **2.61 L**. At 0.58–0.68 kg/L this represents about **1513–1773 g feed**. Using PETG density only as an engineering mass estimate plus a 300 g hardware allowance gives approximately **3744 g maximum static weighed mass**, or **74.9%** of a 5 kg cell. This is acceptable for a prototype static load, but human push loads and jams can exceed it; the overload guard remains mandatory.

## What “math verified” means
- STEP geometry, clearances, axes, dimensions, pocket count, index angle, gasket relationship and static load estimate are internally reconciled.
- It does **not** mean bulk material flow has been proven. The feeder must pass pellet, crumble, bridging, jam, dose-repeatability, washdown/cleanability and load-cell bypass tests before a production release.

## Canonical V9 CAD
- `CAD/CANONICAL/TC-FDR-ASM-2000_FEED_PATH_CORE_V9.step`
- `CAD/CANONICAL/TC-FDR-SUB-2100_STEPPER_DRIVE_ALIGNED_V9.step`
- `CAD/STEP/04_Six_Pocket_Rotor_D_Bore.step` — corrected rotor
- `CAD/STEP/05_Drive_Side_Plate_696.step` — default drive-side closure

The MG996R files remain alternates only.
