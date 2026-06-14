# Hardware Testing: Motors, Axis & Drives

**Device ID:** ct_test_001 (registered under your local development account)
**Test Phase:** Week 1 (Dec 8-14, 2025)  
**Components:** TB6600 stepper drivers, NEMA 17/23 motors, door servo, feed auger

---

## Wiring Quick Reference

### Door Servo (Motorized Entry/Exit)

```
ESP32 Pin 25 (PWM) → Servo Signal (yellow)
ESP32 Pin 13 (GND) → Servo Ground (black)
5V Power Supply  → Servo Power (red)

Servo: 9-12kg torque, 0-180° range
```

### Feed Auger Motor (Portion Dispenser)

```
ESP32 GPIO 16 (output) → TB6600 pulse
ESP32 GPIO 17 (output) → TB6600 direction
TB6600 OUT A/B → NEMA 23 stepper coils

Power: 24V DC (5A minimum)
Gear Ratio: 30:1 (reduces speed, increases torque)
```

### Door Limit Switches (Safety)

```
ESP32 GPIO 4 (input) → Home/open limit (NC)
ESP32 GPIO 5 (input) → Closed limit (NC)

Normally closed (NC) = safety: if wire breaks, circuit opens
```

---

## Test Sequence (Week 1)

### Day 1: Door Servo Commissioning

**Goal:** Verify servo range, speed, mechanical binding

**Setup:**
1. Connect servo to power (5V, 2A)
2. Wire signal to ESP32 GPIO 25
3. Load firmware: servo control test sketch
4. Power on, observe movement

**Test Commands:**

```bash
# Test door open (180°)
curl -X POST http://localhost:3001/api/mqtt/devices/ct_test_001/door \
  -H "Content-Type: application/json" \
  -d '{"state":"open"}'

# Test door close (0°)
curl -X POST http://localhost:3001/api/mqtt/devices/ct_test_001/door \
  -H "Content-Type: application/json" \
  -d '{"state":"close"}'
```

**Acceptance Criteria:**
- [ ] Servo moves smoothly from 0° to 180°
- [ ] No grinding, jamming, or stuttering
- [ ] Response time <300ms
- [ ] Holds position under load (chicken pushing on door)
- [ ] MQTT message received, published to `tc/ct_test_001/state`

**Troubleshooting:**
- Servo stuck/grinding → Check linkage, reduce load
- Slow response → Check PWM frequency (50Hz standard for servo)
- No movement → Verify signal voltage (3.3V from ESP32 sufficient)

---

### Day 2: Feed Auger Motor (TB6600 + Stepper)

**Goal:** Test portion dispenser, measure grain flow rate

**Setup:**
1. Mount NEMA 23 stepper to auger shaft
2. Wire TB6600 (4 outputs to stepper coils)
3. Connect GPIO 16 (pulse), GPIO 17 (direction)
4. 24V power supply (verify polarity!)

**Test Code (Arduino):**

```cpp
#define PULSE_PIN 16
#define DIR_PIN 17
#define DELAY_US 1000  // 1ms pulse → ~60 RPM at 200 steps/rev

void dispense(int pulses) {
  digitalWrite(DIR_PIN, LOW);  // Direction: forward
  for (int i = 0; i < pulses; i++) {
    digitalWrite(PULSE_PIN, HIGH);
    delayMicroseconds(DELAY_US);
    digitalWrite(PULSE_PIN, LOW);
    delayMicroseconds(DELAY_US);
  }
}

void setup() {
  pinMode(PULSE_PIN, OUTPUT);
  pinMode(DIR_PIN, OUTPUT);
}

void loop() {
  dispense(800);    // 4 full rotations (200 steps × 4)
  delay(5000);      // Wait 5 sec (measure dispensed grain)
  dispense(400);    // 2 full rotations (50g portion)
  delay(10000);     // Wait 10 sec
}
```

**Test Commands:**

```bash
# Dispense 50g (estimated: 400 stepper pulses)
curl -X POST http://localhost:3001/api/mqtt/devices/ct_test_001/feed \
  -H "Content-Type: application/json" \
  -d '{"amount":50}'

# Dispense 100g (800 pulses)
curl -X POST http://localhost:3001/api/mqtt/devices/ct_test_001/feed \
  -H "Content-Type: application/json" \
  -d '{"amount":100}'

# Dispense 200g (1600 pulses)
curl -X POST http://localhost:3001/api/mqtt/devices/ct_test_001/feed \
  -H "Content-Type: application/json" \
  -d '{"amount":200}'
```

**Measurement:**
- Dispense each amount 5 times
- Weigh dispensed grain
- Calculate average per pulse
- **Target:** ±10% accuracy (e.g., 50g ± 5g)

**Acceptance Criteria:**
- [ ] TB6600 receives pulse signal (LED blinks on board)
- [ ] Stepper motor rotates smoothly
- [ ] No grinding, coil overheating
- [ ] Grain flows consistently
- [ ] Portion accuracy within ±10%
- [ ] 10 consecutive portions correct

**Troubleshooting:**
- Motor doesn't spin → Check TB6600 coil wiring (A+/A-, B+/B-)
- Jerky/stalled → Reduce pulse delay (slower), check stepper current (TB6600 trim pot)
- Overheating → Stepper running hot; reduce current trim or add heatsink

---

### Day 3: Limit Switches & Homing

**Goal:** Verify safety interlocks, establish position reference (home)

**Wiring:**

```
Door open limit:  switch → GPIO 4 (reads LOW when pressed)
Door closed limit: switch → GPIO 5 (reads LOW when pressed)
```

**Homing Sequence (Firmware):**

```cpp
#define HOME_PIN 4
#define LIMIT_PIN 5

void homeAxis() {
  // Move door toward "open" until home switch triggers
  while (digitalRead(HOME_PIN) == HIGH) {
    moveServo(180);  // Move open
    delayMicroseconds(100);
  }
  // Home found, set position = 0
  currentPosition = 0;
  Serial.println("Homed!");
}

void moveToPosition(int degrees) {
  // Safety check: don't exceed limits
  if (degrees < 0) degrees = 0;
  if (degrees > 180) degrees = 180;
  
  // Check closed limit
  if (degrees == 0 && digitalRead(LIMIT_PIN) == LOW) {
    Serial.println("At closed limit, stopping");
    return;
  }
  
  // Move servo
  servo.write(degrees);
}
```

**Test Sequence:**

```
1. Run homing
   ☐ Door moves to "open"
   ☐ Stops at home switch
   ☐ Position zeros
   ☐ Serial output: "Homed!"

2. Move to closed (0°)
   ☐ Door moves to closed position
   ☐ Closed limit triggers
   ☐ Further close commands rejected

3. Move to open (180°)
   ☐ Door moves to open position
   ☐ Open limit triggers
   ☐ Further open commands rejected

4. Cycle 10×
   ☐ Home → Open → Closed → Home (repeat 10 times)
   ☐ No motion beyond limits
   ☐ All switches trigger consistently
```

**Acceptance Criteria:**
- [ ] Home sequence finds correct position
- [ ] Limits prevent over-travel
- [ ] Safety interlocks reliable (no jamming)
- [ ] 50+ cycle test without failure

---

### Day 4: Emergency Stop (E-STOP)

**Goal:** Verify immediate motion cutoff, power isolation

**MQTT E-STOP Message:**

```bash
curl -X POST http://localhost:3001/api/mqtt/devices/ct_test_001/estop \
  -H "Content-Type: application/json" \
  -d '{"active":true}'
```

**Firmware Response:**

```cpp
void handleEStop() {
  // IMMEDIATELY cut all motion
  noInterrupts();              // Disable interrupts
  digitalWrite(ENABLE_PIN, LOW); // Disable motor drivers
  servo.write(90);             // Center servo (safe position)
  Serial.println("E-STOP ACTIVE");
  
  // Stay in E-STOP until manual clear
  while (true) {
    delay(100);  // Watchdog reset
  }
}
```

**Test Procedure:**

```
1. Start door moving (open)
2. Send E-STOP command mid-motion
3. Door stops immediately
4. All servo/motor power cut
5. Device state = E-STOP

Expected: <100ms from command to full stop
```

**Acceptance Criteria:**
- [ ] Motion stops immediately (<100ms)
- [ ] No coasting or overshoot
- [ ] All power cut to actuators
- [ ] Device enters safe state
- [ ] Requires manual reset to exit E-STOP

---

## Daily Test Log Template

**Date:** Dec 8, 2025  
**Component:** Door Servo  
**Tester:** Local development owner

```
Test: Open command
Result: ✓ Moves smoothly, 180° range
Time: 0.28s response
Notes: Slight mechanical bind at 90° (check linkage)

Test: Close command
Result: ✓ Returns to 0°
Time: 0.25s response
Notes: Normal

Test: Limit switches
Result: ✓ Both triggers correctly
Notes: None

Test: Cycle 10×
Result: ✓ All 10 cycles successful
Time: Per cycle avg 0.27s
Issues: None

Summary: ✓ PASSED
Signature: ___________
```

---

## Hardware Specifications Reference

### TB6600 Stepper Driver

| Parameter | Spec |
|-----------|------|
| Input Voltage | 10-46V DC |
| Output Current | 2-5A (adjustable) |
| Microstepping | 1-32 |
| Logic Input | 3.3V compatible |
| Pulse Frequency | Up to 200 kHz |

**Trim Pots:**
- Current limit: Adjust for stepper (start 50%, increase if stalled)
- Decay: Typically set to middle position

### NEMA 23 Stepper

| Parameter | Spec |
|-----------|------|
| Holding Torque | 3+ Nm (30+ kg-cm) |
| Step Angle | 1.8° (200 steps/rev) |
| Coil Impedance | 3.5 Ω (NEMA 23-sized) |
| Rated Current | 3-5A |

### Door Servo (MG996R or equivalent)

| Parameter | Spec |
|-----------|------|
| Torque | 9kg @ 5V (25kg @ 6V) |
| Range | 0-180° |
| Speed | 0.17 sec/60° @ 5V |
| Voltage | 4.8-7.2V |
| Connector | Standard 3-pin |

---

## Next: Hardware Integration Checklist

Once motors tested & working:

- [ ] Mount servo in coop door frame (secure, no binding)
- [ ] Mount stepper to auger shaft (square coupling)
- [ ] Install limit switches at open/closed positions
- [ ] Run electrical to control box
- [ ] Wire ESP32 + TB6600 + relay modules
- [ ] Test full assembly under load
- [ ] Connect MQTT → verify telemetry publishing
- [ ] Integrate with app dashboard

---

**Questions?** Check DEVICE_TESTING_SETUP.md for troubleshooting or CLAUDE.md section 4 for hardware agent guidance.
