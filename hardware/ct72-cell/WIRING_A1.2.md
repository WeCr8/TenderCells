# CT72 rev A1.2 – wiring & electronics (draft)

## Power
| Rail | Source | Feeds | Cut by E-stop |
|---|---|---|---|
| 24 V | Mean Well HDR-150-24 | SKR Mini E3 V3 (4x TMC2209) -> NEMA17 X/X1/Y/Z | yes (E-stop relay; Pro: safety relay) |
| 12 V servo | Mean Well LRS-150-12 (12.5 A) | SO-101 follower via **fused star** (6 x 3 A), not daisy-chained | yes |
| 12 V actuators | 24->12 V buck or 12 V PSU | DRV8874 x3 (roost A, roost B, lid), Starter vacuum pump/valve | yes |
| 5 V | buck | Pi 5 (27 W USB-C PSU) / Jetson (own PSU), XIAO node, cams | no (compute stays up to log the stop) |

Servo bus budget: 6 x 2.7 A stall = 16.2 A only with the torque caps off. With the caps (`ct72/so101_limits.py`), 3 capped stalls + 3 moving = **7.4 A vs 12.5 A supply** (OK under an 80% rule). The leader arm uses its own 7.4 V / 5 V supply.

## E-stop chain
NC mushroom buttons in series (front; Pro adds right + door interlock) -> relay coil (Starter/Plus) or Pilz-class safety relay (Pro). The relay contacts open the three motor supplies above. An opto tap of the chain feeds the XIAO D10 and the SKR `estop_chain` pin (Klipper M112). Gantry Z is self-locking (Tr8x2), so the arm holds when power is cut. pro_heavy Z has a 24 V fail-safe brake.

## Camera trigger (Plus/Pro)
XIAO D0 -> 74LVC1T45 (3.3 V -> 1.8 V) -> shielded twisted pair, star-wired from one point -> XTR on each Raspberry Pi GS camera (IMX296, external trigger enabled) or the OV9281 trigger input (Jetson). 30 Hz, 1 ms pulse. Keep equal cable lengths, and scope it at the camera end: skew must be < 1 ms (the 60 s audit enforces it).

## Network + clocks
Wired gigabit switch: Pi 5 / Jetson (PTP grandmaster: ptp4l + phc2sys on the Ethernet PHC), plus the training PC (chrony or PTP slave). The XIAO node syncs over USB-CDC (4-timestamp exchange). The Klipper MCU clock is synced by Klipper itself, and its offset is logged. Wi-Fi XIAO monitor cams are not part of the dataset sync budget.

## Cell-IO node pin map
See `firmware/ct72-cell-io/include/pins.h`: D0 trigger, D1 HX711 SCK, D2/D3 HX711 DOUT A/B, D4/D5 I2C (MCP23017 0x20 for limits/directions, ADS1115 0x48 for IPROPI x3 + vacuum), D6/D7/D8 DRV8874 EN (roost A, roost B, lid), D9 pump PWM, D10 E-stop sense.
