---
name: farm-check
description: Daily Tender Cells farm check - read every device, flag animal-health risks first, list open yard flags, and suggest (never run) next actions. Use when the user asks how the farm, coop or chickens are doing.
---

# Farm check

Use the `tendercells` MCP tools. Do not request or confirm any action during a check.

1. Call `get_hub_status`. If the hub is offline, say so and stop.
2. Call `get_farm_snapshot`, or `get_device` for each device id.
3. **Animal safety first.** Before anything else, report any reading outside these limits, with the device and the number:
   - temperature below 35°F or above 85°F;
   - ammonia above 10 ppm (above 25 ppm is critical);
   - water below 15%;
   - feed below 20%;
   - any device in `error` or `estop`.
4. Call `get_alerts` and `get_yard_events` for each device. Summarise predator alerts from the last 24 h, and open flags (eggs ready, weeds, roost headcount).
5. End with up to three suggested next steps in plain words, such as "Top up the water on ct_001". If one is a hardware action, say the person can ask you to do it. That goes through `request_action` and their explicit yes.

If a reading suggests an animal is in immediate danger, recommend `emergency_stop` or checking the coop now.

Say "simulated" for device ids starting with `sim_`.
