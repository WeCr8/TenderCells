# DoorCell V1.4 Integration Plan

## Current package evidence

The uploaded DoorCell package contains:
- modular printable frame and sliding-door STLs;
- rack/pinion and motor mount;
- controller enclosure;
- limit switch parts;
- optional 145 × 145 mm solar-panel housing and adjustable mount;
- BOM;
- electronics documentation;
- engineering calculations;
- assembly instructions;
- test plan;
- product roadmap.

## Current engineering status

Treat DoorCell V1.4 as **prototype / bench-validation engineering**, not a certified or field-proven production door.

Its own engineering file states that the assumptions are suitable for concept validation and bench testing, not certification.

## Reconciliation tasks

### 1. Product docs
Map the package into the TenderCells product documentation standard:
- README
- BOM
- wiring
- firmware
- assembly
- troubleshooting
- API/MQTT
- safety/validation
- simulation

### 2. Firmware
The package supplies recommended ESP32 pins and MQTT topic direction, but production implementation must be reconciled with the current TenderCells firmware and MQTT contract.

### 3. Safety
Door control is a pinch/crush/entrapment mechanism.

Required before instruction-ready:
- open and closed limit behavior;
- timeout;
- calibrated overcurrent obstruction detection;
- safe close behavior;
- E-STOP;
- manual release;
- boot-state handling;
- repeated-command handling;
- power-loss behavior.

### 4. Solar
The CN3065/6V 3W/1S path is an optional experimental branch.
Do not mix the 1S solar charge path with the 12V motor power architecture without the intended isolation/regulation.

### 5. Builder book
The existing Chicken Tender Door concept book can now be reconciled against this real DoorCell package.

Recommended workflow:
1. compare every current concept page to DoorCell V1.4 geometry/BOM;
2. replace invented/mismatched parts;
3. create stable part IDs;
4. generate one-action pages from the real assembly order;
5. add wiring only after firmware/pinout reconciliation;
6. run the DoorCell test plan;
7. remove `concept` only after mechanical + electrical + safety review.

### 6. Product tiers
The package proposes:
- DoorCell Open Basic
- DoorCell Kit Lite
- DoorCell Solar Lite
- DoorCell Pro
- DoorCell Connect Retrofit

Treat these as roadmap/product-direction inputs until corresponding hardware/validation exists.
