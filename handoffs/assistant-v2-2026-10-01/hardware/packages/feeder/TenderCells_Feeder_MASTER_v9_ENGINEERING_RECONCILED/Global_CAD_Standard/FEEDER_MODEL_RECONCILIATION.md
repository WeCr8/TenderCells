# Feeder Model Reconciliation — v6

## Resolved mismatch
The v5 package mixed three different engineering states:

- `00_FULL_ASSEMBLY_V3.step`: servo-era mechanical assembly.
- `00C_DEFAULT_STEPPER_DRIVE_SUBASSEMBLY.step`: current default 28BYJ-48 drive concept.
- `TenderCells_Smart_Feeder_Interactive_v4.glb`: app-oriented functional model with a different overall envelope.

They are no longer presented as equivalent.

### Canonical v6 roles
- `TC-FDR-ASM-1000_MECHANICAL_CORE.step` — neutral mechanical core, servo-drive hardware removed.
- `TC-FDR-SUB-1100_STEPPER_DRIVE_MODULE.step` — default stepper drive module.
- `TC-FDR-SUB-1200_LOAD_CELL_MODULE.step` — load-cell module.
- `TC-FDR-GLB-1000_MECHANICAL_CORE_EXACT.glb` — visualization generated directly from canonical STEP geometry.
- Legacy full assembly moved/copied to `CAD/LEGACY_REFERENCE/` and is **not** the current default build authority.

### Envelope comparison
Canonical mechanical core STEP: **248.00 × 190.00 × 402.70 mm**.
Old interactive GLB: **316.00 × 215.00 × 402.00 mm**.

The old GLB is retained for software behavior tests only and must not be used for dimensions.
