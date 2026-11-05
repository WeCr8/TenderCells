---
name: device-connect
description: Guide a TenderCells Starter Node from Builder to browser flash, setup, MQTT heartbeat and device-found verification.
---

Follow the existing TenderCells device path rather than inventing a provisioning flow:
Builder → browser flasher → TenderNode-Setup → Wi-Fi/LoRa setup → MQTT heartbeat → TenderCells device registry.

Use existing MCP read tools to verify device presence/status after setup.
Do not send hardware motion to prove connectivity.
