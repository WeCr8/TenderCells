# Smart Feeder Integration Plan

## Current package evidence

The uploaded feeder package contains:
- canonical STEP/STL/GLB assets;
- master parameters;
- purchasing BOM;
- electronics BOM;
- XIAO ESP32C3 + HX711 documentation;
- actuator/drive options and firmware;
- validation reports;
- technical images;
- React/Three.js digital-twin integration examples.

Its app-integration README explicitly says to reuse TenderCells' existing Three.js + GLTFLoader and Firebase model upload flow.

## Reconciliation tasks

### 1. Product identity
Choose stable TenderCells family/type IDs before importing app code.

Suggested working identity:
- product family: `smart-feeder`
- twin type: DEVICE or HABITAT subassembly depending on deployment
- device ID pattern follows existing `tc:{kind}:{type}:{localId}` architecture

Do not rename existing repo contracts solely to match this package.

### 2. Firmware contract
Compare the feeder firmware with:
- current MQTT topic contract;
- E-STOP behavior;
- non-blocking loop rule;
- device registry heartbeat;
- Starter Node conventions.

Resolve differences before production use.

### 3. Electronics
The feeder package currently documents XIAO ESP32C3, HX711 and actuator power requirements.
Do not assume XIAO ESP32-S3 Builder pinouts apply to this feeder.

### 4. CAD/model authority
Honor package authority:
- manufacturing = canonical STEP
- printing = STL
- visualization = GLB

Do not use visualization meshes as manufacturing truth.

### 5. App integration
Reuse:
- current model upload service;
- GLTFLoader / Three.js scene infrastructure;
- existing Property Twin/device state patterns.

Do not create a second asset-storage or visualization system.

### 6. Builder conversion
Create a new Builder project only after:
- procurement BOM is reconciled;
- electronics pinout is checked;
- firmware path is selected;
- safety/testing prerequisites are documented.

Recommended project progression:
1. Meet the Feeder
2. Parts inventory
3. Mechanical assembly
4. Load-cell assembly
5. Drive assembly
6. Electronics
7. Power-off wiring
8. Calibration
9. Firmware flash
10. Dry feed test
11. MQTT/device found
12. Digital twin
13. supervised animal-use validation

One physical action per page.

### 7. Validation
Do not translate package validation filenames into a generic “production validated” claim.
Preserve exact validation scope and unresolved findings.

## Assistant opportunity after integration

Customer:
- feeder state/feed level/weight/alerts
- Builder project
- maintenance/troubleshooting guidance

Admin:
- content/CAD validation state
- firmware compatibility
- asset readiness

Physical dispense remains behind the existing local safety/control architecture.
