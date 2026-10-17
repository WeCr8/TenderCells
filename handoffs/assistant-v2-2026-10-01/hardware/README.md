# TenderCells Hardware Engineering Sources

This handoff now carries both user-supplied engineering packages in two forms:

1. **Exact original archives** under `source-archives/`
2. **Expanded copies** under `packages/` for immediate agent inspection

No file from either source package was silently promoted to “field validated” merely because it is present here.

## Included packages

### Smart Feeder
Source archive:
`TenderCells_Feeder_MASTER_v9_ENGINEERING_RECONCILED.zip`

Expanded files: **290**

Useful starting points inside the expanded feeder package:
- `00_DROP_IN_START_HERE.md`
- canonical CAD and authority notes
- locked procurement BOM
- electronics/power documentation
- XIAO/HX711/actuator firmware material
- validation reports
- print/assembly documentation
- `App_Integration/` digital-twin assets and integration notes

Important engineering authority stated by the package:
- STEP = neutral manufacturing authority
- STL = printing output
- GLB = visualization

Do not create a second GLB/storage path; its app-integration notes explicitly call for using TenderCells' existing model upload/Three.js paths.

### DoorCell V1.4 Solar Ready
Source archive:
`TenderCells_DoorCell_V1_4_Solar_Ready_Assembly.zip`

Expanded files: **65**

Useful starting points:
- `README.md`
- `ASSEMBLY.md`
- `BOM.md`
- `ELECTRONICS.md`
- `ENGINEERING_CALCULATIONS.md`
- `PRINT_SETTINGS.md`
- `TEST_PLAN.md`
- `ROADMAP.md`
- STL/OpenSCAD/model assets
- solar housing and ball-mount parts

The DoorCell engineering calculations explicitly describe **prototype assumptions** suitable for concept/bench validation, not certification. Its test plan contains outstanding mechanical, electronics, safety, regression, field, and solar tests.

## Source integrity

Exact source-archive hashes are in:
`inventories/source-archives.json`

Expanded-file hashes are in:
- `inventories/feeder-files.json`
- `inventories/doorcell-files.json`

## Integration rule

Treat these as **engineering inputs** to the main TenderCells repo.

Before copying code/data into production:
1. compare against current repo contracts;
2. resolve MCU/pin/firmware differences;
3. map product documentation to the TenderCells documentation standard;
4. preserve safety gates;
5. execute/record validation tests;
6. only then mark Builder instructions as instruction-ready.
