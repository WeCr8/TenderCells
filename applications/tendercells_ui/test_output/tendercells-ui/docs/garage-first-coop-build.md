# Garage First Coop Build

This is the first local Chicken Tender device target for `zgoodbody@gmail.com`.

## Registered Device

| Field | Value |
| --- | --- |
| Owner account | `zgoodbody@gmail.com` |
| Product name | `Garage Chicken Tender 001` |
| Product id | `garage-chicken-tender-001` |
| Device id | `ct_001` |
| Serial | `TC-CT-GARAGE-0001` |
| Activation code | `TC-GARAGE-001` |
| Model | `Chicken Tender Coop - Garage Dev Build` |
| Location | `Garage Electronics Bench` |
| MQTT base topic | `tc/ct_001` |
| API health | `http://localhost:4000/health` |

## Software Setup

1. Sign in as `zgoodbody@gmail.com`.
2. Go to `Products` or `Account -> Products`.
3. Select `Register Garage Coop`.
4. Confirm the device card shows serial `TC-CT-GARAGE-0001`.
5. Use `Reset Garage Coop` when testing needs a clean local product record.

Local registration is stored in browser localStorage under `tendercells_dev_products` when the API is unavailable.

## Electronics Bench Target

Initial bring-up should use the smallest safe hardware loop:

- ESP32 controller running Chicken Tender firmware.
- 12 V bench supply with current limit enabled.
- 5 V buck converter for controller and low-voltage modules.
- Door/latch actuator channel.
- Rail/motor channel.
- Feed actuator relay or motor driver channel.
- Water/level sensor input.
- Waste/cleaning actuator channel placeholder.
- Limit switches for open/closed and travel end stops.
- Emergency stop input wired normally closed where possible.
- Optional camera module or placeholder camera feed in app.

## MQTT Contract

Use these topics for garage testing:

```text
tc/ct_001/status
tc/ct_001/telemetry
tc/ct_001/command
tc/ct_001/command/door
tc/ct_001/command/feed
tc/ct_001/command/clean
tc/ct_001/command/estop
tc/ct_001/event
```

Suggested status payload:

```json
{
  "deviceId": "ct_001",
  "serial": "TC-CT-GARAGE-0001",
  "firmware": "garage-dev-r0",
  "online": true,
  "estop": false
}
```

## Bench Safety Checklist

- Current limit is set before powering actuators.
- E-stop cuts actuator power or command enable.
- Limit switches are verified before motorized travel.
- Door/latch motion is tested without animals.
- Firmware defaults to safe/off on reboot.
- App E-stop command is tested before automation routines.
- No exposed mains voltage is used in the dev bench loop.

## Exact Build Notes

The app expects this first unit to be a Chicken Tender hardware unit using `ct_001`. Keep firmware, MQTT, and UI records aligned to that ID until the first kit contract is stable.
