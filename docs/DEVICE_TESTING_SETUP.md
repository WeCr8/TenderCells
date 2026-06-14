# Device Testing Setup Guide

**Purpose:** Register and test Chicken Tender hardware while developing software and CAD in parallel.

**Demo owner:** `demo-local-owner` | Firebase UID placeholder: `YOUR_FIREBASE_UID`

---

## Phase 1: Register Test Device (5 minutes)

### Option A: Via Firebase Console (Quickest)

1. Go to [Firebase Console](https://console.firebase.google.com) → tender-cells project
2. Firestore Database → Create document
3. Collection: `devices` | Document ID: `ct_test_001`
4. Add fields:

```json
{
  "id": "ct_test_001",
  "userId": "YOUR_FIREBASE_UID",
  "productType": "chicken-tender",
  "nickname": "Test Coop - Motor Testing",
  "size": "4x4x6",
  "tier": "PRO",
  "location": { "x": 0, "y": 0 },
  "animalCount": 0,
  "hardwareConnected": true,
  "simOnly": false,
  "mqttDeviceId": "ct_test_001",
  "createdAt": Timestamp.now(),
  "updatedAt": Timestamp.now()
}
```

### Option B: Via App UI (Once Integrated)

1. Sign in with your local development account.
2. Products → Add Device
3. Fill form:
   - Name: "Test Coop - Motor Testing"
   - Type: Chicken Tender
   - Size: 4×4×6 ft
   - Tier: PRO (for rail system)
   - Location: (0, 0)
   - Hardware Connected: ✓
   - Sim Mode: ☐

4. Register → Device added to your account

---

## Phase 2: Hardware Testing Setup

### Hardware you're testing:
- Motors (door, feed dispenser, auger)
- Axis & drives (TB6600 stepper drivers)
- Motion control (limit switches, homing)
- Sensors (optional: temp, ammonia)

### Test Sequence

**Stage 1: Motor Control (Week 1)**

```
ESP32 → TB6600 driver → NEMA 17/23 stepper

Test:
☐ Door servo (9kg torque, 0-180°)
☐ Feed auger motor (24V DC, gear-reduced)
☐ Limit switches (home/end positions)
☐ Homing sequence (find home, zero position)
```

**MQTT Commands to Test:**

```bash
# Open door
curl -X POST http://localhost:3001/api/mqtt/devices/ct_test_001/door \
  -H "Content-Type: application/json" \
  -d '{"state":"open"}'

# Close door
curl -X POST http://localhost:3001/api/mqtt/devices/ct_test_001/door \
  -H "Content-Type: application/json" \
  -d '{"state":"close"}'

# Dispense feed (100g)
curl -X POST http://localhost:3001/api/mqtt/devices/ct_test_001/feed \
  -H "Content-Type: application/json" \
  -d '{"amount":100}'

# Emergency stop (cuts power to all actuators)
curl -X POST http://localhost:3001/api/mqtt/devices/ct_test_001/estop \
  -H "Content-Type: application/json" \
  -d '{"active":true}'
```

**Stage 2: Sensor Integration (Week 2)**

```
DHT22 (temp/humidity) → ESP32 ADC
MQ-137 (ammonia) → ESP32 ADC
Load cells → HX711 → ESP32 SPI

Test:
☐ Sensor readings publish to MQTT
☐ Telemetry endpoint returns latest values
☐ App displays real-time sensor data
```

**Stage 3: Rail System (Week 3+)**

Once motors working:
- Mount linear rails (MGN15 or equivalent)
- Wire up stepper motors for X/Y/Z axes
- Implement homing sequence
- Test movement in each axis
- Test keep-in/keep-out volumes

---

## Parallel Development Workflow

You can work on **three tracks simultaneously:**

### Track 1: Hardware Testing (Your physical hardware)

**Timeline:** Week of Dec 8, 2025

| Task | Device | Status |
|------|--------|--------|
| Motor control (door) | ct_test_001 | Testing |
| Feed auger motor | ct_test_001 | Testing |
| Limit switches | ct_test_001 | Testing |
| Environmental sensors | ct_test_001 | Queued |

**Testing Commands Checklist:**
- [ ] Door open/close cycles (10×)
- [ ] Feed dispense amounts (50g, 100g, 200g)
- [ ] Emergency stop activation
- [ ] Hardware latency (<500ms response)

### Track 2: Software Development (Your main focus)

**Parallel to hardware testing:**

| Component | Status | Dependency |
|-----------|--------|-----------|
| Camera feed viewer | ✅ Done | None |
| Behavior analytics | ✅ Done | None |
| Device detail page | ✅ Done | None |
| Product specs dashboard | ✅ Done | None |
| **MQTT integration tests** | Next | Hardware telemetry |
| **Historical data charts** | Next | Telemetry endpoint |
| **Automated schedules** | Next | Control endpoints |

**Next Software Tasks (Dec 8-15):**
1. Wire real MQTT data into UI
2. Build historical telemetry graph
3. Implement control confirmations (hardware safety)
4. Add device settings panel

### Track 3: CAD & 3D Models (Ongoing)

**Continue building SolidWorks models:**

| Part | Size | Status |
|------|------|--------|
| Coop frame | 4×4×6 | In progress |
| Rail mount bracket | S/M/L | Design |
| Arm ceiling mount | Custom | Design |
| Scraper end effector | Standard | Design |
| Egg gripper | Standard | Design |

**Export & integrate as you finish:**
1. Export SolidWorks → Collada (.dae)
2. Optimize in Blender
3. Save as GLB to `public/models/coops/presets/`
4. Restart dev server → auto-loads in app

---

## Monitoring Hardware via App

### Real-Time Dashboard

Once device registered:

1. **Navigate:** App → Products → Device ID `ct_test_001`
2. **Select:** Device Detail tab
3. **View:**
   - Telemetry: Real-time sensor readings
   - Controls: Door, feed, clean buttons
   - 3D Model: Coop visualization
   - Health: Behavior analytics (when sensors active)

### Test Loop

```
Physical Motor → MQTT Publish → Express API Cache → React App Display
      ↓                              ↓                    ↓
Door opens ----→ Topic: tc/ct_test_001/state → Dashboard updates
(see telemetry in Telemetry tab within 5 sec)
```

### Troubleshooting

**No telemetry appearing?**
1. Check MQTT broker running (`localhost:1883`)
2. Verify ESP32 connecting and publishing
3. Check express-api subscribed to `tc/+/sensors`
4. Test endpoint: `curl http://localhost:3001/api/mqtt/devices/ct_test_001/telemetry`

**Device not in app?**
1. Sign in with your local development account.
2. Check Firestore: device exists in `devices` collection
3. Verify `userId` matches your Firebase UID

**Commands not responding?**
1. Check hardware E-STOP not active
2. Verify motor power supply (12V for door servo, 24V for auger)
3. Test TB6600 drivers with multimeter (should see ~5V on output)

---

## Testing Checklist

### Motor Control ☐

- [ ] Door servo responds to open command (moves 180°)
- [ ] Door servo responds to close command (moves 0°)
- [ ] Door motion smooth, no grinding
- [ ] Feed auger dispenses in portions (50g, 100g, 200g)
- [ ] Auger stops cleanly (no overshoot)
- [ ] Limit switches trigger at correct positions
- [ ] Homing sequence completes (finds home, homes to 0)
- [ ] Response time <500ms (command → hardware motion)

### Sensor Integration ☐

- [ ] DHT22 readings update every 10 sec
- [ ] MQ-137 ammonia readings in range 0-100 ppm
- [ ] Readings appear in app Telemetry tab
- [ ] Historical data retained 90+ days
- [ ] Alerts trigger at thresholds (ammonia >25 ppm)

### Safety ☐

- [ ] E-STOP command stops all motion immediately
- [ ] E-STOP retains on broker (survives reconnect)
- [ ] Watchdog timer prevents stuck loops (ESP32)
- [ ] No motion during homing sequence
- [ ] All hardware interlocks working

---

## Firebase Setup for User

**Collection: `devices`**

Structure per device:

```typescript
interface Device {
  id: string;                    // "ct_test_001"
  userId: string;                // "YOUR_FIREBASE_UID"
  productType: string;            // "chicken-tender"
  nickname: string;               // "Test Coop - Motor Testing"
  size: string;                   // "4x4x6"
  tier: string;                   // "PRO"
  location: { x: number; y: number };
  animalCount: number;
  hardwareConnected: boolean;     // true = real hardware, false = sim
  simOnly: boolean;               // false = testing, true = UI-only
  mqttDeviceId: string;           // "ct_test_001"
  createdAt: Timestamp;
  updatedAt: Timestamp;
}
```

**Security Rules:**

User can only see/modify their own devices:

```javascript
match /devices/{deviceId} {
  allow read, write: if request.auth.uid == resource.data.userId;
}
```

---

## Success Criteria

| Week | Hardware | Software | CAD |
|------|----------|----------|-----|
| **Dec 8-14** | Motor control working | MQTT integration | 4×4×6 frame assembly |
| **Dec 15-21** | Feed/water testing | Dashboard updates | Rail mount bracket |
| **Dec 22-28** | Full sensor suite | Scheduling system | Arm ceiling mount |
| **Jan 1+** | Rail system axis testing | Historical analytics | End effectors |

---

## Quick Start Command

**One-liner to test device registration:**

```bash
# Open browser console and run:
import { registerDevice } from './services/deviceService';

registerDevice('YOUR_FIREBASE_UID', {
  userId: 'YOUR_FIREBASE_UID',
  productType: 'chicken-tender',
  nickname: 'Test Coop',
  size: '4x4x6',
  tier: 'PRO',
  location: { x: 0, y: 0 },
  animalCount: 0,
  hardwareConnected: true,
  simOnly: false,
  mqttDeviceId: 'ct_test_001'
}).then(device => console.log('✓ Device registered:', device));
```

---

**Next:** Wire hardware to ESP32 → MQTT test → integrate telemetry into app
