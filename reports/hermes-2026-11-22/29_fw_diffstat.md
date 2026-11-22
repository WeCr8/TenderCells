# firmware + hardware changes on fix/chicken-tender-mq137-ppm-2026-11-20 since its merge-base with docs/chicken-tender-build-2026-11-20

```diff
docs/CHICKEN_TENDER_PINOUT.md                      | 160 ++++++++
 firmware/chicken-tender-starter/README.md          |  67 ++++
 firmware/chicken-tender-starter/include/pins.h     |  26 ++
 .../lib/door_logic/door_logic.cpp                  | 171 +++++++++
 .../lib/door_logic/door_logic.h                    |  95 +++++
 firmware/chicken-tender-starter/platformio.ini     |  41 ++
 firmware/chicken-tender-starter/src/main.cpp       | 373 ++++++++++++++++++
 .../chicken-tender-starter/test/host/.gitignore    |   1 +
 firmware/chicken-tender-starter/test/host/Makefile |  19 +
 .../test/host/test_door_logic.cpp                  | 272 ++++++++++++++
 firmware/chicken-tender/lib/mq137/mq137.h          |  78 ++++
 firmware/chicken-tender/platformio.ini             |  15 +-
 firmware/chicken-tender/src/main.cpp               | 322 +++++++++++++---
 firmware/chicken-tender/test/host/.gitignore       |   1 +
 firmware/chicken-tender/test/host/Makefile         |  13 +
 firmware/chicken-tender/test/host/test_mq137.cpp   |  62 +++
 firmware/starter-node/src/main.cpp                 |  12 +-
 firmware/watchtower/src/main.cpp                   |  19 +-
 hardware/chicken-tender-starter/README.md          |  42 +++
 hardware/chicken-tender-starter/TIERS.md           |  21 ++
 .../gen/build_electronics.py                       | 415 +++++++++++++++++++++
 .../hw/chicken-tender-starter.hw.yaml              |  98 +++++
 hardware/chicken-tender-starter/hw/parts.yaml      | 173 +++++++++
 .../chicken-tender-starter/hw/tc-hw.schema.json    |  27 ++
 .../hw/variants/pro.overlay.yaml                   |   7 +
 hardware/chicken-tender-starter/out/BOM.md         |  75 ++++
 .../out/ELECTRICAL_CHECKS.md                       |  48 +++
 hardware/chicken-tender-starter/out/bom_pro.csv    |  24 ++
 .../chicken-tender-starter/out/bom_starter.csv     |  24 ++
 .../out/electrical_checks.json                     | 310 +++++++++++++++
 hardware/chicken-tender-starter/out/netlist.json   | 118 ++++++
 hardware/chicken-tender-starter/out/netlist.net    | 117 ++++++
 hardware/chicken-tender-starter/out/wiring.svg     | 254 +++++++++++++
 33 files changed, 3433 insertions(+), 67 deletions(-)
```