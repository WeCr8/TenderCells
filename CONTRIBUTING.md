# Contributing to TenderCells

TenderCells is an open-source home farming and animal tending platform. We welcome software, firmware, hardware, documentation, simulation, and field-testing contributions.

## Good First Contributions

- Fix documentation gaps in a product build guide.
- Add product photos, wiring notes, or field-test observations.
- Improve mobile/tablet layout in the web app.
- Add tests around product registration and device registry flows.
- Add a sensor, actuator, or MQTT topic contract for a supported product.
- Create STL/CAD mounting brackets, enclosures, or tool modules.

## Project Areas

| Area | Typical work |
| --- | --- |
| Dashboard | React/Vite UI, Firebase Auth, device registry, simulation views |
| Firmware | ESP32, ESP32-S3, MQTT, safety states, sensor and actuator drivers |
| Hardware | BOMs, wiring diagrams, CAD, 3D printed parts, validation reports |
| Simulation | Three.js property simulation, Isaac Sim setup, robot and terrain models |
| Docs | Assembly guides, API contracts, troubleshooting, contributor tutorials |

## Documentation Required for Product Contributions

Every product or major hardware module should include:

- BOM with preferred and substitute parts.
- Wiring diagram or pinout.
- CAD/STL/source model files.
- Firmware setup and flashing instructions.
- Assembly instructions.
- Troubleshooting guide.
- API/MQTT topic documentation.
- Safety validation notes before moving hardware is enabled.

## Pull Request Checklist

- The change is scoped to one product, module, or workflow when possible.
- Build and type checks pass for the affected package.
- Firmware changes preserve E-STOP and watchdog behavior.
- Hardware movement is guarded by safety state, confirmation, or simulation mode.
- Docs are updated when APIs, wiring, MQTT topics, or setup steps change.
- Screenshots or short videos are attached for UI or hardware behavior changes.

## Local Quality Loop

For the current Vite app:

```bash
cd applications/tendercells_ui/test_output/tendercells-ui
npm run quality:loop
```

For website changes:

```bash
cd applications/tendercells_ui/test_output/website
npm run build
```

## Community Conduct

Be practical, kind, and evidence-driven. Many contributors will be builders working in garages, yards, farms, schools, and maker spaces. Make your work understandable enough that another person can repair, remix, or safely test it.
