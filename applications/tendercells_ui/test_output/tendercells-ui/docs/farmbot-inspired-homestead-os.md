# FarmBot-Inspired Homestead OS Direction

FarmBot is a useful north star because it connects hardware kits, open-source software, documentation, education, and community into one understandable product ecosystem. TenderCells should use those cues while expanding the idea from plant beds to animal care, mobile roaming enclosures, property simulation, device fleets, and custom homestead automation.

## What TenderCells Should Borrow As Patterns

- Visual planning first: users should place animals, coops, waterers, doors, cameras, obstacles, routes, charging zones, and feeding zones in a map-like editor.
- Remote web app control: every product needs browser controls, status, schedules, camera state, and safety controls on desktop, tablet, and phone.
- Local OS/device image: provide a TenderCells device runtime for Raspberry Pi, ESP32 controllers, and future edge computers.
- Self-host option: cloud service can be convenient, but local-first/self-hosted should stay real for homesteads with weak internet.
- Open-source stack: publish CAD, firmware, schemas, API contracts, wiring diagrams, BOMs, docs, and software under clear licenses.
- Kit tiers: separate software-only, DIY kit, partial kit, full kit, and prebuilt unit expectations.
- Community modification path: make 3D printed add-ons, custom tools, custom product templates, and parent-child module linking first-class.
- Education path: make school/research/community builds understandable with demo mode, simulations, worksheets, and safety notes.

## Developer Architecture Cues

FarmBot's developer docs are especially useful because they separate the system into firmware, an embedded OS, a web app/API/message broker, developer libraries, scripting, and simulation/offline workflows. TenderCells should use a similar separation while adapting it for animal safety and homestead diversity.

Recommended TenderCells responsibilities:

- Firmware: direct actuator and sensor control only. Doors, latches, motors, pumps, lights, valves, endstops, motor current, E-stop inputs, and watchdog behavior live here.
- TenderCells OS: edge runtime for Raspberry Pi or similar single-board computers. Handles schedules, local cache, MQTT/ROS bridge, camera process supervision, rules, safety interlocks, and offline operation.
- Web app: product registry, property layout, schedules, cameras, diagnostics, simulation, account setup, and remote operation.
- API server: durable product/device/property data, auth-aware sync, event history, registry import/export, and kit/community metadata.
- Message broker: realtime commands, telemetry, firmware state, job results, and resource updates.
- Developer SDKs: JavaScript/TypeScript, Python, and optional Lua-style scripting for community automation.
- Simulation adapters: browser simulation first, Isaac Sim/ROS/Gazebo/hardware-in-loop for advanced robotics.

This split keeps low-level motion safe and predictable while still giving open-source developers room to build integrations at the OS, app, API, and SDK layers.

## Offline And Local-First Requirements

FarmBot's offline-server notes are a reminder that fully offline operation has hidden time, scheduling, cert, and data-integrity problems. TenderCells should still be more local-first because homesteads often have weak internet, but it should do so explicitly:

- Devices need a reliable time source for schedules, certificates, event ordering, and feeding/door automation.
- A local-only setup should support an NTP source, local MQTT broker, local API, and browser app.
- The app should clearly show when it is using local fallback data versus synced/cloud data.
- Edge devices must keep animal-safety schedules running during internet loss.
- Remote alerts may degrade when internet is unavailable, but local E-stop and scheduled safety behavior must not.
- Offline mode should be supported, tested, and documented as a first-class homestead path, not an accidental state.

## Simulation And Headless Hardware

FarmBot documents a headless/no-motor simulation approach for software testing. TenderCells should support several equivalent modes:

- Browser-only demo: no hardware, seeded products, seeded animals, seeded property, and fake telemetry.
- Bench simulation: Raspberry Pi/edge computer plus controller board, no motors connected.
- Garage hardware-in-loop: motors/doors/sensors connected with low-speed setup limits.
- Field simulation: real installed hardware with animal-safe movement disabled or supervised.
- Isaac/ROS simulation: property scene, robot assets, route planning, synthetic telemetry, and terrain experiments.

Each mode should be visible in product metadata so users and contributors know whether a device is simulated, bench-tested, field-tested, or ready for kit/prebuilt use.

## Where TenderCells Expands The Idea

TenderCells is not only a fixed CNC-style garden system. It should support:

- Stationary animal systems: Chicken TenderCell, Duck Dock, Bunny Burrow, Goat Guardian, Pigeon Palace, Turkey Tower.
- Mobile systems: Roaming Roost, mobile shelters, autonomous yard patrol, docking/charging behavior.
- Perimeter systems: WatchTower AI, predator monitoring, camera/solar/battery sensor nodes.
- Modular accessories: door systems, latch systems, waterers, feeders, camera kits, sensor pods, controller boards, motor-axis kits, rail modules, printed parts.
- Digital property model: yard boundaries, trees, fences, sheds, water, terrain, no-go zones, route paths, and live product placement.
- Simulation ladder: browser 2D/3D first, then NVIDIA Isaac Sim, ROS 2, Gazebo, hardware-in-loop, and eventual terrain learning from device telemetry.

## Product UX Requirements

The app should feel like an operating system for the homestead:

- Register product: choose product tile, scan QR/activation code, or define custom build.
- Place product: put the product on the property layout and set footprint/height/clearances.
- Configure modules: attach door, feeder, waterer, camera, rail, sensor, printed part, or custom tool to a parent product.
- Simulate: preview movement, schedules, route constraints, door states, feeding/watering, and safety zones.
- Operate: control hardware with manual commands, scheduled jobs, and emergency stop.
- Observe: camera views, telemetry, animal records, egg maps, health metrics, diagnostics, logs.
- Share: export/import product definitions, property layouts, firmware contracts, and Isaac/ROS simulation assets.

## Hardware Architecture Cues

TenderCells should define a universal module interface inspired by tool-mount ecosystems:

- Electrical: 5V, 12V/24V, ground, protected peripheral outputs, sensor inputs, I2C/UART/CAN where appropriate.
- Fluid: water/air/vacuum optional ports for waterers, cleaning, pneumatic locks, and custom modules.
- Mechanical: printed adapter plates, rail slots, latch mounts, camera mounts, tool bays, serviceable fasteners.
- Identity: every module can expose a module ID, firmware version, safety status, calibration state, and parent product link.
- Safety: E-stop, limit switches, stall/current detection, watchdog, low-speed setup mode, and animal-proximity lockouts.

## Community And Business Boundaries

Open-source users should be empowered, but expectations need to be clear:

- DIY builds are supported by docs, examples, schemas, and forums.
- Kit/prebuilt customers can receive more direct setup support.
- Hardware designs should clearly say whether they are prototype, open-source ready, kit ready, or commercially ready.
- Safety-critical motion must not be marked ready based on simulation alone.
- Community designs need licenses, CAD revision, firmware contract version, BOM, and known-risk notes.

## Autonomous Loop Requirements

The local autonomous loop should check for these FarmBot-inspired OS pillars:

- Product catalog includes full products, add-ons, printed parts, and custom products.
- Registry supports product/module metadata, parent-child links, firmware/simulation/asset revisions, and safety state.
- Property editor supports equipment placement, obstacles, route previews, and export/import targets.
- Viewport supports real-time 2D/3D, registered product rendering, custom GLB/GLTF assets, and camera presets.
- Device runtime docs define local OS image, MQTT/ROS contracts, firmware flashing, and self-host setup.
- Community docs include assembly, BOM, CAD, schematics, wiring, troubleshooting, forum/contribution paths, and DIY support boundaries.
- Developer docs define API, message broker, SDK, scripting, offline/local-first, simulation, and security boundaries.

## Reference Links

- FarmBot developer documentation: https://developer.farm.bot/v15/docs/farmbot-software-development
- FarmBot high-level software overview: https://developer.farm.bot/v15/docs/farmbot-software-development/high-level-overview.html
- FarmBot offline server notes: https://developer.farm.bot/v15/docs/web-app/running-servers-offline
- FarmBot simulation notes: https://developer.farm.bot/v15/docs/farmbot-os/simulating-a-farmbot
- TenderCells third-party attribution and reuse policy: `docs/third-party-attribution.md`
