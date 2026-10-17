# DoorCell V1.4 Roadmap

## Open-Source Version

The open-source version should include:

- Parametric OpenSCAD files.
- Printable parts.
- BOM.
- Firmware.
- MQTT docs.
- Wiring diagrams.
- Safety checklist.
- Assembly photos.
- 4-H/student worksheet.

## TenderCells Kit Version

The kit version should include:

- Printed or molded frame.
- Printed or molded door.
- Replaceable rack strips.
- Motor with cable harness.
- ESP32 controller.
- Motor driver.
- Limit switches.
- Preflashed firmware.
- QR onboarding to TenderCells OS.
- Printed install guide.
- Spare rack segment.

## Product Tiers

| Tier | Direction | Electronics Position |
| --- | --- | --- |
| DoorCell Open Basic | User prints parts and sources electronics | ESP32, DRV8871, current sensor, LM2596, 12V plug-in power; target under $100 DIY |
| DoorCell Kit Lite | Prewired kit with printed/molded parts | Same Basic electronics, pretested harness, no camera/solar/battery |
| DoorCell Solar Lite | Optional solar experiment/add-on | CN3065 inside main controller box, 6V 3W panel in adjustable printed housing, 1S battery path |
| DoorCell Pro | Higher reliability kit | Encoder motor, sealed harness, better enclosure, optional battery/solar |
| DoorCell Connect Retrofit | Competitor/legacy integration path | TenderCells OS control layer where safe electrical interfaces exist |

## Future Improvements

- Nylon rack and pinion kit.
- Injection-molded weatherproof frame.
- Better sealed electronics bay.
- Snap-in motor cassette.
- Battery and solar lid.
- Door obstruction optical sensor.
- Door heater/de-icer option.
- Camera add-on bracket.
- TenderCells OS setup wizard.
- Home Assistant auto-discovery.

## Product Naming

Suggested names:

- TenderCells DoorCell
- DoorCell Open
- DoorCell Kit
- DoorCell Pro
- DoorCell Connect Retrofit
