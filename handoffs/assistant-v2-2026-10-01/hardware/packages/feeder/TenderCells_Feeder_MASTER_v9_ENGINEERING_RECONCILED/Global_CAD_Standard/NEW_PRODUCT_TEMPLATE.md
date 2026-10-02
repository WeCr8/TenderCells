# Tender Cells New Hardware Product Template

Use this for every new product family.

## 1. Product identity
Assign family code, product number, revision, intended animal/use case, indoor/outdoor rating target, classroom vs production classification.

## 2. Global CAD
Import the global coordinate reference, adopt units/axes/datums, and load the global parameter file.

## 3. Interface control
Define mounting, power, data, sensor, actuator, service/removal, food/water contact, drainage and safety interfaces in a product-specific `INTERFACE_CONTROL.csv`.

## 4. Electronics
Record exact manufacturer part number, distributor/SKU, supply voltage, peak current, connector, mounting pattern, envelope and vendor CAD provenance. Generic modules stay `REFERENCE_ENVELOPE` until receiving inspection.

## 5. Release set
Release native CAD if available, STEP authority, printable STL/3MF, dimensioned PDF/DWG, BOM, wiring, firmware tag, GLB plus manifest, app schema and receiving/QA checklist.

## 6. Validation
Record fit check, electrical test, jam/failure modes, environmental test, animal-contact/material review, service access, and actual as-built deviations.
