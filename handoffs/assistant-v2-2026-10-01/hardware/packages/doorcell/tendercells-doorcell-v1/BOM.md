# DoorCell V1.4 Bill of Materials

## Electronics

This BOM is split into a **DoorCell Basic** electronics target and optional upgrades. Basic is the sub-$100 goal; camera, solar, and battery are intentionally outside the base target.

## DoorCell Basic Electronics Target

| Item | Recommended Part | Quantity | CAD Envelope | DIY Target | Notes |
| --- | --- | ---: | ---: | ---: | --- |
| Microcontroller | ESP32 DevKitC / ESP32-WROOM dev board | 1 | 58 x 31 x 8 mm | $4-$8 | Wi-Fi, MQTT, OTA firmware path |
| Motor | 12V JGA25-370 / 25GA-370 metal gearmotor with encoder, 30-60 RPM | 1 | 25 mm body dia., 65 mm body length plus encoder relief | $10-$20 | Preferred over servo for sliding door |
| Motor driver | DRV8871 single DC motor driver | 1 | 31 x 26 x 7 mm | $5-$10 | Compact 12V brushed motor driver |
| Current sensor | INA219 or ACS712 | 1 | 26 x 22 x 7 mm | $2-$6 | Obstruction detection and motor load monitoring |
| Buck converter | LM2596 12V to 5V buck module | 1 | 44 x 22 x 14 mm | $2-$6 | Powers ESP32 and sensors |
| Optional solar charger | HiLetgo / Solar Charger v1.0 CN3065 module | 1 | 44 x 24 x 8 mm | $2-$8 | Fits inside main controller box; 1S LiPo charge path |
| Open limit switch | Waterproof microswitch or magnetic reed switch | 1 | Bracketed separately | $2-$4 | Detects full open |
| Closed limit switch | Waterproof microswitch or magnetic reed switch | 1 | Bracketed separately | $2-$4 | Detects full closed |
| Inline fuse | 2A automotive blade or glass fuse holder | 1 | 45 x 15 x 14 mm | $2-$4 | Required safety item |
| Primary power | 12V 2A DC wall supply | 1 | External | $8-$12 | Best for fixed coop |
| Manual button | 16 mm momentary waterproof push button | 1 | 16.2 mm cutout | $2-$5 | Local open/close or pairing |
| Status LED | 5 mm LED or small sealed indicator | 1 | Lid/side mounted | $1-$3 | Door state and error indicator |
| Harness | JST/XH connectors, wire, heat shrink, cable glands | 1 set | two M12 glands, one M10 gland | $6-$12 | Do not skip strain relief |

Expected DIY electronics total: **$45-$80** with generic modules, or **$70-$95** with better switches, glands, and a better encoder motor.

## Optional Electronics Upgrades

| Item | Recommendation | Notes |
| --- | --- | --- |
| Solar panel | 6V 3W 500mA mini panel, 145 x 145 mm | Fits optional two-piece panel housing |
| Solar charger | CN3065 Solar Charger v1.0 | Fits main controller enclosure, not a separate pod |
| 1S LiPo/Li-ion battery | Protected cell/pack sized for load and climate | Requires low-voltage cutoff and charge safety validation |
| Boost converter | 1S to logic or motor voltage as required | Needed only for a validated solar-powered variant |
| Higher-current driver | BTS7960 module | Use only if the selected motor exceeds DRV8871 comfort range |
| Better temperature sensor | BME280 / SHT31 | Coop temp/humidity |
| Lower-cost temp sensor | DHT22 | Good enough for first build |
| Ammonia sensor | MQ-137 module | Requires calibration and ventilation notes |
| Camera | ESP32-CAM, USB camera, or IP camera | Not in Basic; better handled by ChickenEye/WatchTower |
| Battery backup | 12V SLA or LiFePO4 pack | Requires charger, fuse, enclosure, and low-voltage cutoff |
| Solar | 10W to 20W panel with 12V charge controller | Depends on camera and climate load |

The 6V 3W/500mA Solar Lite option is smaller than the 10W-20W full solar option. Treat it as a controller/battery charging experiment until power budget and motor duty cycle are validated.

## Power

| Item | Recommendation | Notes |
| --- | --- | --- |
| Primary power | 12V 2A DC wall supply | Best for fixed coop and Basic kit |
| Battery option | 12V sealed lead acid or LiFePO4 pack | Use fuse and charge controller |
| Solar option | 10W to 20W panel with 12V charge controller | Depends on camera and climate load |
| Fuse | 2A inline automotive fuse | Required for kit version |
| Power switch | Waterproof toggle switch | Local service disconnect |

## Mechanical Hardware

| Item | Quantity | Notes |
| --- | ---: | --- |
| M3 x 8 screws | 20 | Electronics, covers |
| M3 x 12 screws | 20 | Printed part joining |
| M3 heat-set inserts | 30 | Use brass inserts for repeated assembly |
| M3 heat-set inserts for electronics posts | 12-20 | Controller board hold-down straps and solar housing |
| M4 x 16 screws | 8 | Frame mounting |
| M4 washers | 8 | Frame mounting |
| 608 bearings | 2-4 | Optional roller support |
| 3 x 8 mm dowel pins | 4 | Door panel alignment |
| Weather gasket foam | 1 roll | Sealing around opening |
| PTFE dry lube | 1 | Use on rack and guides |
| Stainless screws | As needed | Outdoor use |

## Printed Materials

| Part Area | Recommended Material | Reason |
| --- | --- | --- |
| Frame | PETG, ASA, or ABS | Weather resistance |
| Door panel | PETG or ASA | Outdoor and impact resistance |
| Rack teeth | Nylon, PETG-CF, ASA, or replaceable PETG | Wear part |
| Pinion | Nylon, PETG-CF, or off-the-shelf M2 16T gear | Better wear life |
| Controller box | PETG or ASA | Weather resistance |
| Prototype only | PLA+ | Indoor testing only |

## Kit vs DIY Options

### DIY Open-Source Build

- User prints parts.
- User buys listed electronics.
- Firmware and wiring are open.
- TenderCells OS connection through MQTT.

### TenderCells Kit

- Preprinted or injection-mold-ready parts.
- Preloaded ESP32.
- Tested motor and driver.
- Cable harness.
- Weather seals.
- Printed safety checklist.
- TenderCells OS onboarding QR code.
