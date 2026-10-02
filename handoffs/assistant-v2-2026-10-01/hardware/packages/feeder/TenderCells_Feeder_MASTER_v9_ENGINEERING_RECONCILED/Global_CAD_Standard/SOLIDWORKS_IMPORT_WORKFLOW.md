# SolidWorks Workflow

1. Set document units to MMGS.
2. Import `CAD/CANONICAL/TC-GLOBAL-REF-0001_COORDINATE_FRAME_100MM.step` with 3D Interconnect enabled when appropriate.
3. Import canonical STEP modules as components; do not dissolve them merely to move parts.
4. Create assembly reference geometry matching Datum A/B/C.
5. Add global variables from `TenderCells_Global_Equations_SolidWorks.txt` through Tools > Equations. If you choose Link to External File, copy the equation file into your controlled project folder first.
6. Mate module origins using `INTERFACE_CONTROL.csv`; never mate to cosmetic faces when a functional datum is available.
7. Save native `.SLDPRT/.SLDASM` as your working derivative; the STEP files remain the interchange authority.
8. Before release, export STEP AP214/AP242 plus STL only for parts marked printable.

STEP cannot preserve the original feature tree. If a fully native parametric SolidWorks model is later created, add it as an additional authority level and maintain parameter equivalence with the global tables.
