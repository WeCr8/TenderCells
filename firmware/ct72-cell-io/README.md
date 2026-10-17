# CT72 cell-IO node (rev A1.2)

XIAO ESP32-S3 that owns the cell's local, safety-relevant IO for the Chicken Tender 72x72 cell:

| Function | Hardware | Rule |
|---|---|---|
| Camera trigger | D0 -> 74LVC1T45 -> 1.8 V XTR on every GS camera, shielded twisted pair, star from one point | 30 Hz, 1 ms pulse, each edge stamped (esp_timer us) and streamed as `{"trg":seq,"us":t}` |
| Roost bars A/B | 12 V linear actuators via DRV8874 (PH/EN), limit switches on MCP23017, 2 load cells per bar on HX711 | start only with the E-stop closed and the load at or below tare + 0.3 kg; stop on load rise, over-current (pinch/stall), 20 s timeout or E-stop |
| Nest lids | 12 V actuator via DRV8874, reed switch | open only counts when the reed switch confirms it |
| Starter vacuum tool | pump PWM D9, NC valve (MCP), XGZP6847A on ADS1115 A3 | 20 kPa limit (25 mm cup holds up to ~9.8 N; an egg weighs ~0.6 N) |
| E-stop | D10 HIGH = chain closed (opto) | E-stop open -> all outputs off. The relay chain also cuts 24 V (steppers), 12 V (servo bus) and 12 V (actuators) in hardware |

Host side: `firmware/jetson-nano/ct72/roost.py` (independent camera occupancy check + sequencing) and
`ct72/timing.py` (`DeviceClockSync` maps the trigger stamps onto the PTP/chrony cell clock).

Bring-up checks before it goes near birds: calibrate `hxScale` with a 2 kg weight; measure each actuator's
free-run current and set `OVERCURRENT_A` about 30% above it; check the limit switches stop the bar at both ends
with the host unplugged mid-move; scope the trigger at the camera end (< 1 ms skew between cameras).
Build: `pio run -e xiao_cell_io` (not flashed to hardware by this PR).
