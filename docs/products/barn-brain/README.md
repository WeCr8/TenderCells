# Barn Brain Edge Hub

Barn Brain is a TenderCells product idea for the local farm automation brain: a barn-side edge hub that can run device discovery, MQTT topics, routines, safety state, local dashboards, and AI-assisted monitoring close to the animals and hardware.

This is not an orderable kit yet. It is a contribution-ready concept for students, makers, agricultural engineers, and open-source developers.

Public framing: register interest to buy Barn Brain from TenderCells when hardware becomes available, or use the developer docs to build your own Jetson-powered edge hub and insert it into the TenderCells OS with a product record, MQTT topics, safety metadata, and a custom 3D/GLB asset.

## Recommended Hardware Direction

New prototypes should try an NVIDIA Jetson Nano-class developer kit. The current recommended path for new AI and robotics experiments is the NVIDIA Jetson Orin Nano Super Developer Kit.

Useful official NVIDIA resources:

- Jetson Orin Nano Super Developer Kit: https://www.nvidia.com/en-us/autonomous-machines/embedded-systems/jetson-orin/nano-super-developer-kit/
- Jetson Orin Nano setup guide: https://developer.nvidia.com/embedded/learn/get-started-jetson-orin-nano-devkit
- JetPack SDK: https://developer.nvidia.com/embedded/jetpack
- Jetson Download Center: https://developer.nvidia.com/embedded/downloads
- Legacy Jetson Nano setup guide: https://developer.nvidia.com/embedded/learn/get-started-jetson-nano-devkit

## What Barn Brain Should Do

- Run or coordinate the local MQTT broker and TenderCells device topics.
- Keep the product and device registry available without internet.
- Run local routines such as feed, water, door, predator alert, and cleaning schedules.
- Keep safety states close to the hardware: E-stop, lockout, manual override, low battery, offline device, and predator alert.
- Host local AI workloads for camera inference, animal checks, event classification, and future barn-side assistants.
- Bridge Chicken Tender, WatchTower AI, Roaming Roost, sensors, doors, feeders, and custom community modules.

## First Builder Milestones

1. Install NVIDIA JetPack / Jetson Linux using the official NVIDIA setup guide.
2. Confirm network, storage, and update behavior before connecting animal-care hardware.
3. Run a local MQTT broker and publish a test `tc/barn-brain/status` topic.
4. Register one simulated TenderCells device and one camera or sensor event.
5. Add a local routine that logs an input, checks a safety condition, and emits an action.
6. Document power, enclosure, cooling, backup, and manual override assumptions.

## Safety And Privacy Notes

Barn Brain should be local-first. No animal-care automation should require cloud access for core safety behavior. Avoid putting secrets, real owner emails, WiFi passwords, private camera feeds, or real farm addresses in public examples.
