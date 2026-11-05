# Vendor / Open CAD File Index

This folder intentionally separates vendor/open-source CAD from Tender Cells-created reference envelopes.

## Seeed Studio XIAO ESP32C3
Seeed publishes official mechanical resources including 2D DXF dimensions and a 3D model from its XIAO ESP32C3 documentation. The Tender Cells package includes a lightweight reference STEP envelope under `Electronics/Reference_STEP/` so the main assembly stays portable. Replace it with the official model when doing enclosure-level interference verification.

Official resource page:
https://wiki.seeedstudio.com/XIAO_ESP32C3_Getting_Started/

## HX711
Soldered Electronics publishes an open-source HX711 board design including a production 3D STEP file. Their exact board is not necessarily dimensionally identical to inexpensive Amazon HX711 modules, so use their STEP only when purchasing/building that board.

Repository:
https://github.com/SolderedElectronics/Load-cell-amplifier-HX711-board-qwiic-hardware-design

Published STEP path:
`OUTPUTS/V1.1.1/Load-cell ampfilier HX711 board with easyC 3D.step`

## TAL220B 5 kg load cell
The package reference solid follows the SparkFun-listed TAL220B envelope: 55 x 12.7 x 12.7 mm and two M5 mounting holes on 40 mm centers.

Product/datasheet:
https://www.sparkfun.com/load-cell-5kg-straight-bar-tal220b.html
https://cdn.sparkfun.com/assets/e/5/f/5/6/TAL220B.pdf

## 28BYJ-48 / ULN2003
Supplier geometry varies. The included STEP files are fit-check envelopes and the printable carrier has generous mounting provisions. Verify your purchased board and motor before a production print.

## Licensing
Vendor/open-source files remain under their original licenses. Tender Cells-created geometry is separate so vendor files can be replaced without contaminating assembly ownership or revision control.
