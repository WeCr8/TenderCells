# Electrical checks (generated)

| Tier | Check | Result | Detail | Data |
|---|---|---|---|---|
| starter | pin map matches the spec (D0 PWM, D1 dir, D2 fault, D3 CS, D4/D5 I2C, D6 spare, D7 enable via E-STOP, D8/D9 reeds, D10 E-STOP sense) | **PASS** | 11/11 header pins as specified | checked |
| starter | pin constraints (strap pin input-only, boot-log pin unused, ADC on ADC1) | **PASS** | D2 (GPIO3 strap) is a pulled-up input; D6 (U0TXD) spare; D3 = ADC1_CH3 works with Wi-Fi; D7 (U0RXD) is Hi-Z during boot and the carrier pulls SLEEP low, so the driver stays asleep through reset | checked |
| starter | netlist integrity (no node in two nets, every pin net present) | **PASS** | 19 nets, 55 nodes | checked |
| starter | E-STOP is hardware: NC contact in series D7 -> SW1 -> DRV8874 SLEEP, D10 senses SLEEP | **PASS** | Pressing the button or cutting either wire lets the carrier pull SLEEP low -> outputs Hi-Z (coast); the worm drive holds the door. Not a certified safety function (no redundancy/monitoring category) - it is a kid-friendly hard stop. | checked |
| starter | DRV8874 PMODE tied to GND (PH/EN latched on wake) | **PASS** | Carrier leaves PMODE floating (= independent half-bridge); the plate ties it to GND | checked |
| starter | driver current limit ~2.0 A (R1 20 k VREF->GND with carrier 10 k pull-up to SLEEP = 3.3 V) | **PASS** | VREF = 3.3 x 20k/(10k+20k) = 2.20 V; I_lim = VREF / (450 uA/A x 2.49 k = 1.121 V/A) = 1.96 A (<= 2.1 A carrier continuous) | checked |
| starter | current-sense voltage inside the ADC span at the limit | **PASS** | CS at 1.96 A = 2200 mV < 3100 mV | checked |
| starter | firmware jam threshold below the hardware limit | **PASS** | 1.80 A < 1.96 A (nFAULT also asserts while chopping; firmware holds 600 ms before faulting) | checked |
| starter | actuator running current at the door load < 2 A and < the driver limit (act-generic-12v-300mm) | **PASS** | no-load 0.8 A, max-load 3.0 A at 150 N; door ~15 N -> ~1.02 A (linear interpolation, assumed - verify listing/force data) | estimate |
| starter | actuator meets the spec (12 V, built-in end-of-stroke limits, sealed, stroke >= door travel) | **PASS** | IP54, 300 mm stroke vs 280 mm door travel, limits built in | checked |
| starter | firmware travel timeout covers the slowest full travel | **PASS** | 280 mm at 8.0 mm/s = 35.0 s; timeout 55 s | checked |
| starter | actuator duty cycle | **PASS** | 2 moves/day of 35 s; even 2 moves in 10 min = 12 % < 20 % rated | checked |
| starter | 5 V regulator: 12 V in window, load < 600 mA | **PASS** | 12 V in 5.2-50 V; XIAO Wi-Fi peak + DHT20 ~0.36 A < 0.6 A | checked |
| starter | XIAO 5V pin after the back-feed Schottky | **PASS** | 5.0 - 0.32 = 4.68 V (window 4.5-5.5 V); USB and the regulator never back-feed | checked |
| starter | 12 V adapter budget (worst case: driver at its limit + logic) | **PASS** | 1.96 A + 0.18 A = 2.14 A <= 80 % of 3.0 A | checked |
| starter | 3 A fuse above the load and below the power-wire ampacity | **PASS** | load 2.14 A < fuse 3.0 A <= 20 AWG 5.0 A | checked |
| starter | no Dupont on a 12 V / motor wire | **PASS** | 12 V and motor wires use 5.08 mm screw terminals, the barrel jack and solder joints | checked |
| starter | logic levels (3.3 V XIAO -> DRV8874 1.8-5.5 V; DHT20 on 3V3 with 4.7 k pull-ups) | **PASS** | all 3.3 V; nothing on the XIAO sees 5 V or 12 V | checked |
| starter | 12 V / motor nets never touch the XIAO (the book's old error) | **PASS** | XIAO is powered only from the 5 V regulator via D1 | checked |
| starter | D7 drives SLEEP + VREF divider within GPIO limits | **PASS** | ~0.21 mA << 40 mA | checked |
| starter | power: 12 V Class 2 adapter, no battery | **PASS** | Class 2 limits energy at the source; adapter stays at a covered/indoor outlet, only 12 V goes outside | checked |
| starter | cord-lift door: actuator only lifts; closing is gravity | **PASS** | door <= 1.0 kg (~10 N) rests on a hen at most; actuator force (150 N) can never push it down | design rule |
| pro | pin map matches the spec (D0 PWM, D1 dir, D2 fault, D3 CS, D4/D5 I2C, D6 spare, D7 enable via E-STOP, D8/D9 reeds, D10 E-STOP sense) | **PASS** | 11/11 header pins as specified | checked |
| pro | pin constraints (strap pin input-only, boot-log pin unused, ADC on ADC1) | **PASS** | D2 (GPIO3 strap) is a pulled-up input; D6 (U0TXD) spare; D3 = ADC1_CH3 works with Wi-Fi; D7 (U0RXD) is Hi-Z during boot and the carrier pulls SLEEP low, so the driver stays asleep through reset | checked |
| pro | netlist integrity (no node in two nets, every pin net present) | **PASS** | 19 nets, 55 nodes | checked |
| pro | E-STOP is hardware: NC contact in series D7 -> SW1 -> DRV8874 SLEEP, D10 senses SLEEP | **PASS** | Pressing the button or cutting either wire lets the carrier pull SLEEP low -> outputs Hi-Z (coast); the worm drive holds the door. Not a certified safety function (no redundancy/monitoring category) - it is a kid-friendly hard stop. | checked |
| pro | DRV8874 PMODE tied to GND (PH/EN latched on wake) | **PASS** | Carrier leaves PMODE floating (= independent half-bridge); the plate ties it to GND | checked |
| pro | driver current limit ~2.0 A (R1 20 k VREF->GND with carrier 10 k pull-up to SLEEP = 3.3 V) | **PASS** | VREF = 3.3 x 20k/(10k+20k) = 2.20 V; I_lim = VREF / (450 uA/A x 2.49 k = 1.121 V/A) = 1.96 A (<= 2.1 A carrier continuous) | checked |
| pro | current-sense voltage inside the ADC span at the limit | **PASS** | CS at 1.96 A = 2200 mV < 3100 mV | checked |
| pro | firmware jam threshold below the hardware limit | **PASS** | 1.80 A < 1.96 A (nFAULT also asserts while chopping; firmware holds 600 ms before faulting) | checked |
| pro | actuator running current at the door load < 2 A and < the driver limit (act-glideforce-lact12-12v-05) | **PASS** | no-load 1.2 A, max-load 3.2 A at 150 N; door ~15 N -> ~1.40 A (linear interpolation, checked data) | checked (vendor current) / estimate (load interpolation) |
| pro | actuator meets the spec (12 V, built-in end-of-stroke limits, sealed, stroke >= door travel) | **PASS** | IP65, 300 mm stroke vs 280 mm door travel, limits built in | checked |
| pro | firmware travel timeout covers the slowest full travel | **PASS** | 280 mm at 36.5 mm/s = 7.7 s; timeout 14 s | checked |
| pro | actuator duty cycle | **PASS** | 2 moves/day of 8 s; even 2 moves in 10 min = 3 % < 25 % rated | checked |
| pro | 5 V regulator: 12 V in window, load < 600 mA | **PASS** | 12 V in 5.2-50 V; XIAO Wi-Fi peak + DHT20 ~0.36 A < 0.6 A | checked |
| pro | XIAO 5V pin after the back-feed Schottky | **PASS** | 5.0 - 0.32 = 4.68 V (window 4.5-5.5 V); USB and the regulator never back-feed | checked |
| pro | 12 V adapter budget (worst case: driver at its limit + logic) | **PASS** | 1.96 A + 0.18 A = 2.14 A <= 80 % of 3.0 A | checked |
| pro | 3 A fuse above the load and below the power-wire ampacity | **PASS** | load 2.14 A < fuse 3.0 A <= 20 AWG 5.0 A | checked |
| pro | no Dupont on a 12 V / motor wire | **PASS** | 12 V and motor wires use 5.08 mm screw terminals, the barrel jack and solder joints | checked |
| pro | logic levels (3.3 V XIAO -> DRV8874 1.8-5.5 V; DHT20 on 3V3 with 4.7 k pull-ups) | **PASS** | all 3.3 V; nothing on the XIAO sees 5 V or 12 V | checked |
| pro | 12 V / motor nets never touch the XIAO (the book's old error) | **PASS** | XIAO is powered only from the 5 V regulator via D1 | checked |
| pro | D7 drives SLEEP + VREF divider within GPIO limits | **PASS** | ~0.21 mA << 40 mA | checked |
| pro | power: 12 V Class 2 adapter, no battery | **PASS** | Class 2 limits energy at the source; adapter stays at a covered/indoor outlet, only 12 V goes outside | checked |
| pro | cord-lift door: actuator only lifts; closing is gravity | **PASS** | door <= 1.0 kg (~10 N) rests on a hen at most; actuator force (150 N) can never push it down | design rule |
