# Autodesk Fusion 360 Workflow

1. Create a new design in millimeters.
2. Run `TenderCells_GlobalParameters_Fusion360.py` from Scripts and Add-Ins.
3. Upload/insert `TC-GLOBAL-REF-0001_COORDINATE_FRAME_100MM.step` and canonical product STEP modules.
4. Ground the global reference component at the design origin.
5. Align product Datum A/B/C and module functional origins to `INTERFACE_CONTROL.csv`.
6. Convert imported bodies to components only when needed; preserve names and revision IDs.
7. Use user parameters for all new configurable geometry. Product parameters must use a family prefix.
8. Export STEP for interchange, STL/3MF for printing, and GLB for app visualization.

Imported STEP geometry is editable but is not the original parametric feature history. The included Fusion script restores the **global parameter contract**, not every product feature.
