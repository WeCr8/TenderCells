# CLAUDE.md — Tender Cells / Chicken Tender
> Autonomous agent skill file for Claude Code.
> Drop in repo root. Claude Code reads this automatically on every session.
> Last updated: 2026-06-11 | Version: 2.0

---

## 1. Project Overview

**Tender Cells** is an AI-powered automated animal care platform by WeCr8 Solutions.
Flagship product: **Chicken Tender™** — automated chicken coop with ceiling-mounted
6DOF robot arm, cleaning automation, egg collection, feeding, watering, smart doors,
and real-time monitoring dashboard.

**Tech Stack:**
| Layer | Technology |
|---|---|
| Mobile App | React Native (Expo), TypeScript |
| State Management | Zustand |
| Backend / Auth | Firebase Auth, Firestore, Realtime DB |
| Cloud Functions | Firebase Functions (Node 18) |
| Real-time Control | MQTT via Mosquitto on Raspberry Pi 4 |
| Edge AI / Vision | ESP32-S3, TensorFlow Lite Micro |
| Predator Monitor | ESP32-CAM × 3, LoRa SX1276, 18650 + 5W solar |
| Coop Controller | ESP32 (main MCU) |
| Robot Arm | 6DOF arm, separate MCU (TBD) |
| Drive System | Mecanum wheels, DC motors (Roaming Roost) |
| Sensors | DHT22, MQ-137, load cells, reed switches |

**Product Ecosystem:**
| Product | Footprint | Description |
|---|---|---|
| Chicken Tender™ | 4×4×5 ft | Automated coop — arm, cleaning, feeding, egg map |
| Roaming Roost™ | 3×3×5 ft | Mobile geodesic dome on mecanum wheels |
| Duck Dock™ | 4×4×6 ft | Duck platform with pond management |
| Bunny Burrow™ | 3×3×5 ft | Rabbit automation — feeding, temp, housing |
| Goat Guardian™ | 6×6×8 ft | Large enclosure automation |
| Turkey Tower™ | 4×4×6 ft | Turkey-specific enclosure |
| Pigeon Palace™ | 4×4×6 ft | Smart pigeon housing |
| WatchTower AI™ | 3×3×5 ft | Solar predator monitor — ESP32 + LoRa + 3-cam dome |

---

## 2. Running Applications (June 2026)

**Tender Cells Web Apps (All Running):**

| App | Port | Path | Purpose |
|---|---|---|---|
| **tendercells-ui** | :5173 | applications/tendercells_ui/test_output/tendercells-ui | Main control dashboard (all products) |
| **chicken-tender** | :5174 | applications/tendercells_ui/test_output/chicken-tender | Chicken Tender device-specific UI |
| **duck-dock** | :5175 | applications/tendercells_ui/test_output/duck-dock | Duck Dock device-specific UI |
| **website** | :5176 | applications/tendercells_ui/test_output/website | Public marketing site |
| **express-api** | :3001 | applications/tendercells_ui/test_output/express-api | MQTT bridge (hardware control) |

**Start all apps:**
```bash
cd applications/tendercells_ui/test_output/tendercells-ui && npm run dev    # :5173
cd applications/tendercells_ui/test_output/chicken-tender && npm run dev    # :5174
cd applications/tendercells_ui/test_output/duck-dock && npm run dev         # :5175
cd applications/tendercells_ui/test_output/website && npm run dev           # :5176
cd applications/tendercells_ui/test_output/express-api && npm run dev       # :3001
```

**Main control app:** tendercells-ui (:5173)
- Multi-product dashboard (Chicken Tender, Roaming Roost, Duck Dock, etc.)
- 3D viewport, telemetry panel, quick actions
- **Status:** UI complete with hardware control hooks

**MQTT Hardware Control (Express API :3001)**

Hardware commands route through express-api (:3001) → MQTT broker → ESP32 devices.

**API Endpoints** (base: http://localhost:3001/api/mqtt):
```bash
# Query device state
GET /devices/{deviceId}/telemetry     # Sensor data (temp, humidity, feed, water, chickens)
GET /devices/{deviceId}/state         # System state (idle/running/error/estop)
GET /devices/{deviceId}/alerts        # Active alerts

# Control hardware (QoS 1)
POST /devices/{deviceId}/door         # body: {state: "open"|"close"}
POST /devices/{deviceId}/feed         # body: {amount: number}
POST /devices/{deviceId}/clean        # body: {action: "start"|"stop"}
POST /devices/{deviceId}/arm          # body: {joints: [angles], speed: 0-1}

# Emergency (QoS 2, retained)
POST /devices/{deviceId}/estop        # Immediate power cut to all actuators

# Broker status
GET /mqtt/status                      # Connection status, device list
POST /mqtt/connect                    # Force reconnect
```

**Example curl commands:**
```bash
# Get sensor data
curl http://localhost:3001/api/mqtt/devices/ct_001/telemetry

# Open door
curl -X POST http://localhost:3001/api/mqtt/devices/ct_001/door \
  -H "Content-Type: application/json" \
  -d '{"state":"open"}'

# Dispense feed (100g)
curl -X POST http://localhost:3001/api/mqtt/devices/ct_001/feed \
  -H "Content-Type: application/json" \
  -d '{"amount":100}'
```

**MQTT Broker Configuration:**
```bash
# Default: mqtt://localhost:1883
# Override with environment variable:
export MQTT_BROKER=mqtt://192.168.1.100:1883
```

---

## 2b. MCP Server Stack (Claude Code Integration)

**Install these in order of impact (highest first):**

### Tier 1 — Essential (Install Now)
```bash
# CodeGraph — pre-indexes repo for 92% fewer tool calls
npx @colbymchenry/codegraph
codegraph init -i && codegraph index

# GitHub MCP — repo + PR + issues access
# (Already configured if GitHub connected to Claude)

# Filesystem MCP — direct file ops
# (Configured in ~/.claude/settings.json)
```

**Settings template** (~/.claude/settings.json):
```json
{
  "mcpServers": {
    "codegraph": {
      "command": "npx",
      "args": ["@colbymchenry/codegraph", "serve"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}" }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem", "${REPO_ROOT}"]
    }
  }
}
```

### Tier 2 — Recommended
- **Brave Search MCP** — web search for ESP32 docs, datasheets, competitor research
- **Memory MCP** — persistent context across sessions (which arm MCU, design decisions)
- **Sequential Thinking MCP** — step-by-step reasoning for complex architecture decisions

### Tier 3 — When Ready
- **Playwright MCP** — E2E test automation
- **SQLite MCP** — query Firebase emulator exports
- **Autodesk Fusion MCP** — CAD design (native integration)

**Local AI Models (Ollama :18789):**
- `qwen2.5-coder:7b` — code generation (primary)
- `llama3.2:latest` — reasoning
- `llama3:8b` — general tasks

Use models autonomously in code generation loops via Ollama API (`/api/chat/completions`).

---

## 3. Testing & Login

**tendercells-ui (:5173)** requires login. Default test account:
```
Email: demo@tendercells.local
Password: (check Firebase Emulator Auth or use sign-up flow)
```

After login, navigate to: Dashboard → Chicken Tender → Device Controls

---

## 4. Example: Control Chicken Tender Door
```bash
curl -X POST http://localhost:3001/api/mqtt/devices/ct_001/door \
  -H "Content-Type: application/json" \
  -d '{"state": "open"}'
```

**MQTT Topics (for ESP32 firmware):**
```
tc/{deviceId}/cmd/door        ← open|close
tc/{deviceId}/cmd/feed        ← amount in grams
tc/{deviceId}/cmd/clean       ← start|stop
tc/{deviceId}/cmd/arm         ← joint angles + speed
tc/{deviceId}/cmd/estop       ← active:true (QoS 2, retained)
tc/{deviceId}/sensors         ← publish telemetry (10s interval)
tc/{deviceId}/state           ← publish state transitions
tc/{deviceId}/alert           ← publish alerts (predator/fault)
```

---

## 3. Repository Structure (Development Layout)
│   └── package.json
├── docs/
│   ├── architecture.md
│   ├── hardware-bom.md
│   ├── adr/                         ← Architecture Decision Records
│   │   └── 001-mqtt-not-firebase-for-motion.md
│   ├── api/                         ← auto-generated API docs
│   ├── user-guide/
│   └── pitch/
├── scripts/
│   ├── verify.sh                    ← full autonomous verification runner
│   ├── gen-docs.sh                  ← documentation generator
│   ├── flash-firmware.sh            ← OTA flash helper
│   └── seed-firestore.sh            ← dev data seeder
└── tests/
    ├── unit/
    ├── integration/
    └── firmware/                    ← Unity test framework
```

---

## 3. Agent Skills & Autonomous Playbooks

> Claude Code: when a trigger phrase is detected, execute the full playbook
> autonomously — read files, make changes, run verification, report results.
> Do not stop to ask unless ambiguity would cause data loss or safety risk.

---

### SKILL: Autonomous Bug Fix

**Triggers:** "fix", "broken", "not working", "error", "crash", "exception", "undefined"

**Autonomous Playbook:**
```
1. READ the error — stack trace, log output, or description
2. LOCATE the file(s) — search codebase for relevant symbols
3. DIAGNOSE root cause — identify the exact line and why it fails
4. FIX narrowly — change only what's broken, preserve all other behavior
5. VERIFY — run the relevant test suite; if no test exists, write one first
6. COMMENT — add // FIX(YYYY-MM-DD): <one-line reason> above the change
7. REPORT — summarize: what was broken, what was changed, what test now passes
```

**Layer-specific diagnostics:**

*React Native / App:*
- Missing `await` on async Firebase calls → silent undefined
- `onSnapshot` not unsubscribed on unmount → memory leak + stale data
- Zustand state mutation without immer → reference equality failures
- Missing null check after Firebase snapshot → crash on first load

*ESP32 Firmware:*
- Heap fragmentation from `String` concatenation → use `char[]` buffers
- `delay()` > 50ms in loop → watchdog timer reset (8s timeout)
- WiFi `while(!connected)` blocking → replace with non-blocking state machine
- Stepper left energized when idle → heat buildup, coil damage

*Firebase Functions:*
- Unhandled promise rejection → function hangs until timeout
- Missing `res.end()` after async path → cold start timeout
- Firestore reads inside loops → use `getAll()` or batch reads

*MQTT / Control Plane:*
- QoS 0 for arm commands → packet loss during motion sequence
- Missing `retain: true` on E-STOP topic → new subscribers miss active stop
- Out-of-order joint commands → always include sequence number in payload

**Common patterns to check first:**
```typescript
// WRONG — listener never cleaned up
useEffect(() => {
  onSnapshot(doc, handler);
}, []);

// RIGHT
useEffect(() => {
  const unsub = onSnapshot(doc, handler);
  return () => unsub();
}, []);
```

```cpp
// WRONG — blocks main loop
while (!mqttClient.connected()) {
  mqttClient.connect(...);
  delay(1000);
}

// RIGHT — non-blocking reconnect
void reconnectIfNeeded() {
  if (!mqttClient.connected() && millis() - lastAttempt > 5000) {
    lastAttempt = millis();
    mqttClient.connect(...);
  }
}
```

---

### SKILL: Autonomous Feature Builder

**Triggers:** "add", "build", "implement", "create", "new feature", "I need"

**Autonomous Playbook:**
```
1. CLARIFY product scope (if ambiguous, default to Chicken Tender)
2. PLAN — list all files that need to change across all layers
3. SCHEMA — if Firebase changes needed, define new fields with defaults first
4. BUILD — implement in order: types → service → store → component → screen
5. WIRE UP — connect to existing navigation and state
6. TEST — write unit test for service layer, snapshot test for component
7. VERIFY — run full verify script
8. DOCUMENT — add JSDoc/inline comments; update relevant docs/ file
```

**UI conventions (non-negotiable):**
```typescript
// Color tokens — always use these, never raw hex elsewhere
const colors = {
  bg:         '#0D2B1E',  // dark forest green background
  surface:    '#1A3D2B',  // card/panel surface
  accent:     '#4A7C59',  // interactive elements
  gold:       '#C8B882',  // primary text / headings
  goldMuted:  '#8A7D55',  // secondary text
  danger:     '#CC3333',  // E-STOP, errors
  warning:    '#E8A020',  // warnings, diagnostics
  white:      '#F0EDE4',  // body text
}

// Header state indicator — always present
// States: 'idle' | 'running' | 'error' | 'estop'

// Hardware action pattern — always confirm before executing
const handleHardwareAction = async (action: () => Promise<void>) => {
  const confirmed = await showConfirmModal({
    title: 'Confirm Action',
    message: 'This will activate hardware. Continue?',
    destructive: false,
  });
  if (confirmed) await action();
};
```

**Firebase schema conventions:**
```typescript
// Device document shape
interface DeviceDoc {
  id: string;
  productType: 'chicken-tender' | 'roaming-roost' | 'watchtower' | 
               'duck-dock' | 'bunny-burrow' | 'goat-guardian' |
               'turkey-tower' | 'pigeon-palace';
  nickname: string;
  propertyId: string;
  location: { x: number; y: number };  // grid coords
  animalCount: number;
  hardwareConnected: boolean;
  simOnly: boolean;
  createdAt: Timestamp;
  updatedAt: Timestamp;
  // Never delete fields — add new ones with defaults
}

// Telemetry document shape
interface TelemetryDoc {
  deviceId: string;
  timestamp: Timestamp;
  temperature: number;   // °F
  humidity: number;      // %
  ammonia: number;       // ppm
  feedLevel: number;     // % 0-100
  waterLevel: number;    // % 0-100
  chickenCount: number;
  doorState: 'open' | 'closed' | 'unknown';
  systemState: 'idle' | 'running' | 'error' | 'estop';
}
```

---

### SKILL: Autonomous Verification

**Triggers:** "verify", "check everything", "run tests", "is it working", "audit"

**Autonomous Playbook — runs all checks in sequence, reports pass/fail:**

```
PHASE 1 — Static Analysis
  □ TypeScript: tsc --noEmit (zero errors required)
  □ ESLint: no errors, warnings allowed but flagged
  □ Firmware: platformio check (static analysis on all firmware targets)
  □ Secrets scan: grep for hardcoded IPs, API keys, passwords

PHASE 2 — Unit Tests
  □ App: jest --coverage (target >70% coverage on services/ and hooks/)
  □ Functions: jest on functions/src/
  □ Firmware: Unity test framework on logic units

PHASE 3 — Integration Tests
  □ Firebase emulator: start emulator, run integration suite
  □ MQTT: broker mock, verify publish/subscribe contracts
  □ E-STOP propagation: verify all subscribers receive within 100ms

PHASE 4 — Schema Validation
  □ Firestore security rules: firebase emulators:exec with rules tests
  □ MQTT topic format: verify all topics follow tc/{deviceId}/cmd|state|sensors|alert
  □ Payload schemas: validate JSON payloads against TypeScript interfaces

PHASE 5 — Firmware Build Check
  □ platformio run for chicken-tender target
  □ platformio run for watchtower target
  □ platformio run for roaming-roost target
  □ Check binary size against flash limits

PHASE 6 — Documentation Completeness
  □ Every public function has JSDoc
  □ Every new screen has a usage comment at top
  □ hardware-bom.md is up to date
  □ MQTT topic table matches actual code usage
  □ Firebase collections table matches actual code usage

PHASE 7 — Safety Checks
  □ E-STOP handler present in all firmware state machines
  □ Watchdog timer initialized in all firmware setup() functions
  □ No hardware commands possible without confirmation modal in UI
  □ Arm motion always checks chicken presence before executing
  □ Stepper disable on idle present in all motor control code
```

**Verification script (`scripts/verify.sh`):**
```bash
#!/bin/bash
set -e
PASS=0; FAIL=0; WARN=0

check() {
  local name="$1"; local cmd="$2"
  echo -n "  [$name] ... "
  if eval "$cmd" > /tmp/tc_verify_out 2>&1; then
    echo "✅ PASS"; ((PASS++))
  else
    echo "❌ FAIL"; ((FAIL++))
    cat /tmp/tc_verify_out | head -20
  fi
}

warn() {
  local name="$1"; local cmd="$2"
  echo -n "  [$name] ... "
  if eval "$cmd" > /tmp/tc_verify_out 2>&1; then
    echo "✅ PASS"; ((PASS++))
  else
    echo "⚠️  WARN"; ((WARN++))
    cat /tmp/tc_verify_out | head -10
  fi
}

echo "=== TENDER CELLS VERIFICATION ==="
echo ""
echo "--- Phase 1: Static Analysis ---"
check "TypeScript"     "cd app && npx tsc --noEmit"
check "ESLint"         "cd app && npx eslint src --max-warnings 0"
check "Secrets Scan"   "! grep -rn 'AIza\|password.*=.*[\"\x27][a-zA-Z0-9]' app/src firmware/"

echo ""
echo "--- Phase 2: Unit Tests ---"
check "App Tests"      "cd app && npx jest --coverage --passWithNoTests"
check "Functions Tests""cd functions && npx jest --passWithNoTests"

echo ""
echo "--- Phase 3: Firmware Build ---"
check "Coop Firmware"  "cd firmware/chicken-tender && pio run"
check "WatchTower FW"  "cd firmware/watchtower && pio run"
warn  "Roaming Roost"  "cd firmware/roaming-roost && pio run"

echo ""
echo "--- Phase 4: Safety Checks ---"
check "ESTOP in FW"    "grep -r 'estop\|ESTOP\|e_stop' firmware/ --include='*.cpp' -l | wc -l | grep -v '^0$'"
check "Watchdog in FW" "grep -r 'esp_task_wdt\|wdt_reset\|watchdog' firmware/ --include='*.cpp' -l | wc -l | grep -v '^0$'"
check "Confirm Modal"  "grep -r 'ConfirmModal\|showConfirmModal' app/src --include='*.tsx' -l | wc -l | grep -v '^0$'"

echo ""
echo "=== RESULTS: $PASS passed | $FAIL failed | $WARN warnings ==="
if [ $FAIL -gt 0 ]; then exit 1; fi
```

---

### SKILL: Autonomous Documentation Generator

**Triggers:** "document", "generate docs", "update readme", "write a guide", "explain"

**Autonomous Playbook:**
```
1. DETECT scope — which file/feature/product needs docs
2. READ the code — don't document from memory, read the actual implementation
3. CHOOSE format:
   - User-facing → plain language, numbered steps, troubleshooting table
   - Developer-facing → ADR format, code examples, data flow diagrams
   - API/function → JSDoc inline + generated markdown table
4. WRITE docs to correct location in docs/ folder
5. UPDATE the relevant index (architecture.md, README.md, hardware-bom.md)
6. VERIFY all links resolve, all referenced files exist
```

**Auto-generate these docs when code changes:**
```
Code changed in:          → Update this doc:
app/services/firebase.ts  → docs/api/firebase-schema.md
app/services/mqtt.ts      → docs/api/mqtt-topics.md
firmware/*/src/           → docs/hardware-bom.md + firmware flash guide
functions/src/            → docs/api/cloud-functions.md
screens/*.tsx             → docs/user-guide/<screen-name>.md
```

**ADR template (`docs/adr/NNN-title.md`):**
```markdown
# ADR-NNN: [Decision Title]
Date: YYYY-MM-DD
Status: Accepted | Deprecated | Superseded by ADR-NNN

## Context
[Why this decision was needed]

## Decision
[What was decided]

## Consequences
[What becomes easier, what becomes harder]

## Alternatives Considered
[What else was evaluated and why it was rejected]
```

**JSDoc standard for this codebase:**
```typescript
/**
 * Brief one-line description.
 *
 * @param deviceId - Firestore device document ID
 * @param command  - MQTT command payload
 * @returns Promise resolving to command acknowledgment or null on timeout
 * @throws {MqttTimeoutError} if device does not ack within 5000ms
 * @example
 *   await sendArmCommand(deviceId, { joint: 2, angle: 45 });
 */
```

---

### SKILL: Autonomous Pitch Deck Builder

**Triggers:** "pitch", "investor", "deck", "slide", "fundraise", "one-pager"

**Full 12-slide structure — generate complete content on request:**

**Slide 1 — Cover**
```
Tender Cells
AI-Powered Automated Animal Care
WeCr8 Solutions | [City, State] | wecr8.info
[Chicken Tender hero image]
```

**Slide 2 — Problem**
```
10M+ backyard chicken owners in the US spend 30+ min/day on manual coop tasks:
• Daily feeding and watering
• Waste cleaning (disease vector if neglected)  
• Egg collection and tracking
• Predator threats kill 25% of backyard flocks annually
• No integrated smart solution exists — current "smart coops" are just timer doors
```

**Slide 3 — Solution**
```
Chicken Tender™ — the first fully automated backyard coop system:
• 6DOF robot arm handles cleaning, egg collection, feeding
• AI sensors monitor health indicators 24/7 (temp, humidity, ammonia, headcount)
• WatchTower AI detects and deters predators with LoRa-mesh alerts
• Consumer UX — set-and-forget schedules, mobile dashboard
```

**Slide 4 — Product Demo**
```
[CoopDetail dashboard screenshot]
[WatchTower AI render]
Real-time: temperature, humidity, ammonia, feed level, water, chicken count
Diagnostics: fault codes, cleaning status, egg map
```

**Slide 5 — Product Ecosystem**
```
Platform approach — one app, multiple species:
Chicken Tender → Roaming Roost → Duck Dock → Bunny Burrow
→ Goat Guardian → Turkey Tower → Pigeon Palace → WatchTower AI
[Product family grid image]
```

**Slide 6 — Technology**
```
[Architecture diagram: App → Firebase → Pi MQTT Broker → ESP32 devices]
• React Native app — iOS + Android from single codebase
• Local-first control — MQTT for <50ms motion commands
• Edge AI — inference on-device, alerts only to cloud
• LoRa mesh — 500m+ predator alert range, no WiFi required
• Modular hardware — rail system supports tool-changer end effectors
```

**Slide 7 — Market Size**
```
TAM: $8B — global backyard poultry & small livestock equipment market
SAM: $1.2B — US tech-adopter backyard chicken hobbyist segment  
SOM: $24M — Year 3 target @ 20,000 units × $1,200 ASP
Adjacent: Duck, rabbit, goat, pigeon markets add 4× TAM expansion
```

**Slide 8 — Business Model**
```
Hardware:  Chicken Tender™ unit    $999 MSRP    ~45% gross margin
SaaS:      TenderCare subscription $19/mo/unit   ~80% gross margin
           (AI alerts, scheduling, health history, priority support)
Year 3 blended LTV per unit: $1,900 over 24mo subscription
CAC target: <$180 (content/community-led growth)
```

**Slide 9 — Traction**
```
[Update with actual milestones]
✅ Working prototype — Chicken Tender v0.1
✅ App live — iOS + Android (sim mode)
✅ WatchTower AI — hardware design complete
□ Beta program — [X] waitlist signups
□ First paying customer target: Q[X] 202X
```

**Slide 10 — Competition**
```
                  Automation   AI/Vision   Mobile Unit   Multi-species   UX
Farm.bot          ✅           ❌           ❌            ❌ (crops only)  ✅
Automatic doors   ❌           ❌           ❌            ❌              ✅
Custom DIY        ✅           Partial      ❌            ❌              ❌
Tender Cells      ✅           ✅           ✅            ✅              ✅
```

**Slide 11 — Team**
```
[Add team bios — WeCr8 Solutions founders/contributors]
Combined experience in: [manufacturing / software / hardware / agtech]
Advisors: [TBD]
```

**Slide 12 — The Ask**
```
Raising: $[X]
Use of funds:
  40% — Hardware manufacturing (Chicken Tender v1 production run)
  25% — Software (app polish, AI model training, cloud infrastructure)
  20% — Team (engineering hire)
  15% — Sales & marketing (waitlist activation, content)
Target: [X] units shipped by [date]
Contact: [email] | wecr8.info
```

---

### SKILL: Autonomous Code Review

**Triggers:** "review", "PR", "pull request", "check this code", "is this right"

**Autonomous Playbook:**
```
1. READ all changed files
2. CHECK each file against the checklist below
3. FLAG issues with severity: BLOCKER | WARNING | SUGGESTION
4. PROVIDE specific fix for each BLOCKER
5. SUMMARIZE: N blockers, N warnings, N suggestions — approve or request changes
```

**Review checklist:**
```
SAFETY (BLOCKER if missing):
  □ No hardware command without E-STOP check
  □ No arm motion without chicken presence check
  □ No new Firebase collection without security rules update
  □ No hardcoded secrets (API keys, WiFi passwords, device IDs)

CORRECTNESS (BLOCKER if wrong):
  □ All Firebase listeners have cleanup (return unsub from useEffect)
  □ All async functions have try/catch or error propagation
  □ MQTT arm commands use QoS 1 or 2, not QoS 0
  □ ESP32 loops have watchdog resets
  □ Stepper motors disabled when idle

CONVENTIONS (WARNING if violated):
  □ Colors use tokens, not raw hex
  □ Hardware actions go through confirmModal
  □ New screens have StatusHeader with device state
  □ TypeScript strict — no `any` types
  □ New public functions have JSDoc

PERFORMANCE (WARNING if found):
  □ No Firestore reads inside render functions
  □ No Firebase listeners duplicated across re-renders
  □ No `delay()` > 50ms in firmware loop
  □ Images optimized before bundle

DOCUMENTATION (SUGGESTION if missing):
  □ Complex logic has inline comment explaining why
  □ Non-obvious data transformations documented
  □ Hardware pin assignments have comments
```

---

### SKILL: Firmware Autonomous Builder

**Triggers:** "firmware", "ESP32", "arduino", "flash", "motor control", "sensor code"

**Autonomous Playbook:**
```
1. IDENTIFY which firmware target (chicken-tender / watchtower / roaming-roost)
2. READ existing main.cpp and state_machine.cpp before writing anything
3. IMPLEMENT following the state machine pattern below
4. VERIFY platformio builds successfully (zero errors)
5. CHECK binary size is within flash limits
6. DOCUMENT pin assignments and any timing dependencies
```

**State machine template (all firmware must follow this pattern):**
```cpp
// State machine — all ESP32 firmware follows this pattern
enum class SystemState {
  BOOT,
  CONNECTING,
  IDLE,
  RUNNING,
  ERROR,
  ESTOP
};

SystemState currentState = SystemState::BOOT;
unsigned long lastWatchdogReset = 0;
const unsigned long WATCHDOG_TIMEOUT_MS = 8000;

void setup() {
  esp_task_wdt_init(8, true);  // 8s watchdog, panic on timeout
  esp_task_wdt_add(NULL);
  // ... hardware init
  transitionTo(SystemState::CONNECTING);
}

void loop() {
  // Reset watchdog every iteration
  esp_task_wdt_reset();

  // Always handle E-STOP first, regardless of state
  if (eStopRequested) {
    transitionTo(SystemState::ESTOP);
  }

  switch (currentState) {
    case SystemState::IDLE:    handleIdle();    break;
    case SystemState::RUNNING: handleRunning(); break;
    case SystemState::ERROR:   handleError();   break;
    case SystemState::ESTOP:   handleEStop();   break;
    default: break;
  }

  mqttClient.loop();        // keep MQTT alive
  reconnectIfNeeded();      // non-blocking WiFi/MQTT reconnect
}

void transitionTo(SystemState next) {
  logStateTransition(currentState, next);  // publish to Firebase
  currentState = next;
}

// E-STOP: cut all power to actuators immediately
void handleEStop() {
  disableAllMotors();
  disableArm();
  mqttPublish("tc/" + deviceId + "/state", "{\"state\":\"estop\"}", 1, true);
  // Stays in ESTOP until manual clear via app
}
```

**MQTT payload schemas (firmware must match these exactly):**
```cpp
// Sensor publish (every 10s)
// Topic: tc/{deviceId}/sensors
// {"temp":67.2,"humidity":72,"ammonia":4,"feedLevel":80,"waterLevel":56,
//  "chickenCount":3,"doorState":"closed","ts":1234567890}

// State publish (on every transition)
// Topic: tc/{deviceId}/state
// {"state":"idle","uptime":3600,"freeHeap":180000,"rssi":-65,"ts":1234567890}

// Alert publish (on detection)
// Topic: tc/{deviceId}/alert
// {"type":"predator","confidence":0.87,"deviceId":"wt_001","ts":1234567890}

// Command subscribe (arm)
// Topic: tc/{deviceId}/cmd/arm
// {"seq":42,"joints":[0,45,90,0,45,0],"speed":0.3,"waitForAck":true}

// E-STOP subscribe (ALWAYS retained, QoS 2)
// Topic: tc/{deviceId}/cmd/estop
// {"active":true,"source":"app","ts":1234567890}
```

---

### SKILL: AI Agent Integration

**Triggers:** "add AI", "Claude integration", "agent feature", "smart suggestions"

**This codebase integrates Claude API for on-device intelligence:**

```typescript
// app/services/aiAgent.ts
// Claude integration for diagnostic suggestions and automation advice

const CLAUDE_PROXY_URL = process.env.EXPO_PUBLIC_FUNCTIONS_URL + '/ai/chat';

interface AgentMessage {
  role: 'user' | 'assistant';
  content: string;
}

// System prompt for coop-aware Claude instance
const COOP_SYSTEM_PROMPT = `You are TenderAI, the intelligent assistant for 
Tender Cells automated animal care systems. You have access to real-time sensor 
data for the user's devices. Help diagnose issues, suggest schedule optimizations, 
interpret diagnostic codes, and explain what sensor readings mean for animal health.

Current device context will be injected with each message.
Always prioritize animal safety. If readings suggest immediate health risk, 
say so clearly before anything else.`;

export const sendAgentMessage = async (
  message: string,
  deviceContext: TelemetryDoc,
  history: AgentMessage[]
): Promise<string> => {
  const contextualMessage = `
Device: ${deviceContext.deviceId}
Current readings: Temp ${deviceContext.temperature}°F, 
Humidity ${deviceContext.humidity}%, Ammonia ${deviceContext.ammonia}ppm,
Feed ${deviceContext.feedLevel}%, Water ${deviceContext.waterLevel}%,
Chickens detected: ${deviceContext.chickenCount}
System state: ${deviceContext.systemState}

User question: ${message}`;

  const response = await fetch(CLAUDE_PROXY_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      system: COOP_SYSTEM_PROMPT,
      messages: [...history, { role: 'user', content: contextualMessage }],
      max_tokens: 500,
    }),
  });

  const data = await response.json();
  return data.content[0].text;
};
```

**Firebase Function proxy (`functions/src/ai.ts`):**
```typescript
// Proxies Claude API calls — keeps API key server-side
export const aiChat = functions.https.onCall(async (data, context) => {
  if (!context.auth) throw new functions.https.HttpsError('unauthenticated', '');

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY!,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 500,
      system: data.system,
      messages: data.messages,
    }),
  });

  return await response.json();
});
```

**Agent-triggered automations (add these to the app):**
- Ammonia > 10ppm → agent suggests immediate cleaning cycle
- Feed < 20% + no schedule → agent prompts to set auto-refill schedule
- Temp < 35°F at night → agent alerts for cold stress, suggests heat lamp
- WatchTower alert + chickens outside → agent triggers Roaming Roost recall
- 3+ consecutive missed egg counts → agent flags possible broody hen

---

### SKILL: CI/CD Pipeline Builder

**Triggers:** "CI", "pipeline", "GitHub Actions", "automate builds", "deployment"

**GitHub Actions workflows to create/maintain:**

**`.github/workflows/ci.yml` — runs on every PR:**
```yaml
name: CI
on:
  pull_request:
    branches: [main, develop]

jobs:
  app:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '18' }
      - run: cd app && npm ci
      - run: cd app && npx tsc --noEmit
      - run: cd app && npx eslint src --max-warnings 0
      - run: cd app && npx jest --coverage --ci
      - name: Upload coverage
        uses: codecov/codecov-action@v3

  functions:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '18' }
      - run: cd functions && npm ci
      - run: cd functions && npx tsc --noEmit
      - run: cd functions && npx jest --ci

  firmware:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/cache@v3
        with:
          path: ~/.platformio
          key: pio-${{ hashFiles('firmware/**/platformio.ini') }}
      - run: pip install platformio
      - run: cd firmware/chicken-tender && pio run
      - run: cd firmware/watchtower && pio run
      - run: cd firmware/roaming-roost && pio run

  security:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - name: Scan for secrets
        run: |
          ! grep -rn 'AIza[0-9A-Za-z\-_]{35}' . --exclude-dir=node_modules
          ! grep -rn 'password\s*=\s*"[^"]\+"\s*$' firmware/ --include='*.cpp'
```

**`.github/workflows/docs-gen.yml` — auto-generates docs on merge to main:**
```yaml
name: Generate Docs
on:
  push:
    branches: [main]

jobs:
  docs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with: { node-version: '18' }
      - run: npm ci
      - run: npm run docs:generate
      - name: Commit updated docs
        run: |
          git config --local user.email "action@github.com"
          git config --local user.name "GitHub Action"
          git add docs/api/
          git diff --staged --quiet || git commit -m "docs: auto-update API docs [skip ci]"
          git push
```

---

### SKILL: Database & Security Rules Auditor

**Triggers:** "security rules", "Firestore rules", "permissions", "auth", "access control"

**Firestore security rules template:**
```javascript
// firestore.rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users can only read/write their own data
    match /users/{userId} {
      allow read, write: if request.auth.uid == userId;
    }

    // Properties belong to their owner
    match /properties/{propertyId} {
      allow read, write: if request.auth.uid == resource.data.ownerId;

      // Devices within a property
      match /devices/{deviceId} {
        allow read, write: if request.auth.uid == 
          get(/databases/$(database)/documents/properties/$(propertyId)).data.ownerId;
      }
    }

    // Telemetry — owner read, device write (via service account)
    match /telemetry/{deviceId}/{docId} {
      allow read: if isDeviceOwner(deviceId);
      allow write: if request.auth.token.service_account == true;
    }

    // Alerts — owner read/write
    match /alerts/{deviceId}/{alertId} {
      allow read, write: if isDeviceOwner(deviceId);
    }

    // Schedules — owner read/write
    match /schedules/{deviceId}/{scheduleId} {
      allow read, write: if isDeviceOwner(deviceId);
    }

    function isDeviceOwner(deviceId) {
      let device = get(/databases/$(database)/documents/devices/$(deviceId));
      let property = get(/databases/$(database)/documents/properties/$(device.data.propertyId));
      return request.auth.uid == property.data.ownerId;
    }
  }
}
```

**Security audit checklist (run on every schema change):**
```
□ No collection readable without auth
□ Users cannot read other users' device data
□ Telemetry write-only for service accounts (devices), read-only for owners
□ No wildcard writes to root collections
□ Rate limiting on alert writes (prevent spam from malfunctioning device)
□ Validate payload shape in rules (not just auth)
```

---

### SKILL: Hardware BOM & Cost Tracker

**Triggers:** "BOM", "bill of materials", "cost", "parts list", "manufacturing cost"

**Current BOM template — update as hardware is finalized:**

```markdown
# Hardware BOM — Chicken Tender v1

## Enclosure & Structure
| Part | Spec | Qty | Est. Unit Cost | Source |
|---|---|---|---|---|
| Plywood panels | 3/4" BC plywood | 2 sheets | $45 | Local lumber |
| Roof framing | 2×2 pine | 12 ft | $8 | Local lumber |
| Leg posts | 4×4 post | 4 × 24" | $12 | Local lumber |
| Hardware (screws, brackets) | — | 1 kit | $25 | Hardware store |

## Electronics — Coop Controller
| Part | Spec | Qty | Est. Unit Cost | Source |
|---|---|---|---|---|
| Main MCU | ESP32-WROOM-32 | 1 | $4 | LCSC |
| Temp/Humidity | DHT22 | 2 | $2.50 | LCSC |
| Ammonia sensor | MQ-137 | 1 | $8 | Amazon |
| Load cell (feed) | 5kg, HX711 | 1 | $5 | Amazon |
| Load cell (water) | 5kg, HX711 | 1 | $5 | Amazon |
| Door servo | MG996R | 2 | $4.50 | LCSC |
| Reed switches | — | 4 | $0.80 | LCSC |
| Power supply | 12V 5A | 1 | $12 | Amazon |
| DC-DC converter | 12V→5V 3A | 1 | $3 | LCSC |
| PCB (custom) | — | 1 | $8 (10pc run) | JLCPCB |

## Robot Arm (TBD — document when selected)
| Part | Spec | Qty | Est. Unit Cost | Source |
|---|---|---|---|---|
| Arm unit | 6DOF, payload >500g | 1 | TBD | TBD |
| Rail (optional) | 300mm linear | 1 | TBD | TBD |
| End effector mount | Tool changer | 1 | TBD | TBD |
| Scraper attachment | 3D printed + steel | 1 | ~$5 | In-house |
| Egg gripper attachment | Soft gripper | 1 | TBD | TBD |

## WatchTower AI
| Part | Spec | Qty | Est. Unit Cost | Source |
|---|---|---|---|---|
| Camera MCU | ESP32-S3-EYE | 3 | $18 | Espressif |
| LoRa module | SX1276 915MHz | 1 | $7 | LCSC |
| Solar panel | 5W 6V | 1 | $12 | Amazon |
| Battery | 18650 × 3 (11.1V 6Ah) | 1 pack | $18 | Amazon |
| MPPT charger | CN3791 based | 1 | $6 | LCSC |
| Enclosure dome | 180mm acrylic | 1 | $15 | Custom |
| Mount pole | 1" EMT conduit 48" | 1 | $8 | Hardware store |

## Cost Summary
| Assembly | Est. BOM Cost | Target COGS | Target MSRP |
|---|---|---|---|
| Chicken Tender (excl. arm) | ~$165 | ~$220 | $599 |
| Robot arm add-on | TBD | TBD | $399 |
| Chicken Tender complete | TBD | ~$450 | $999 |
| WatchTower AI | ~$105 | ~$140 | $299 |
```

---

## 4. Quick Reference Tables

### Firebase Collections
```
/users/{uid}
  └── profile, preferences, subscription

/properties/{propertyId}
  └── ownerId, name, address, gridSize, gridScale
  └── /devices/{deviceId}
        └── productType, nickname, location, animalCount, simOnly

/telemetry/{deviceId}/{timestamp}
  └── temp, humidity, ammonia, feedLevel, waterLevel, chickenCount, doorState, systemState

/alerts/{deviceId}/{alertId}
  └── type (predator|fault|health), severity, message, acknowledged, ts

/schedules/{deviceId}/{scheduleId}
  └── action (feed|clean|door|water), cronExpression, enabled, lastRun

/eggMap/{deviceId}/{date}
  └── nestBoxes: [{id, hasEgg, collectedAt}]
```

### MQTT Topics
```
tc/{deviceId}/cmd/arm        QoS 1  ← joint angle commands
tc/{deviceId}/cmd/door       QoS 1  ← open|close
tc/{deviceId}/cmd/feed       QoS 1  ← dispense amount
tc/{deviceId}/cmd/clean      QoS 1  ← start|stop cleaning cycle
tc/{deviceId}/cmd/drive      QoS 1  ← Roaming Roost navigation
tc/{deviceId}/cmd/estop      QoS 2, retain:true  ← EMERGENCY STOP
tc/{deviceId}/state          QoS 1  ← device publishes state transitions
tc/{deviceId}/sensors        QoS 0  ← 10s sensor telemetry
tc/{deviceId}/alert          QoS 2  ← predator/fault alerts
tc/broadcast/alert           QoS 2  ← WatchTower broadcasts to all devices
```

### Diagnostic Codes
```
Code 10  — WiFi connection lost
Code 11  — MQTT broker unreachable
Code 12  — Rail blocked (encoder stall detected)
Code 20  — Arm joint limit exceeded
Code 21  — Arm force limit exceeded (collision)
Code 30  — Cleaning cycle: scraper not at home position
Code 31  — Scraper jammed (motor stall)
Code 40  — Feed dispenser jammed
Code 41  — Water supply low (below 10%)
Code 50  — Temperature critical (>90°F or <32°F)
Code 51  — Ammonia critical (>25ppm)
Code 60  — WatchTower battery critical (<10%)
Code 61  — WatchTower LoRa sync lost
Code 70  — Roaming Roost boundary breach
Code 71  — Roaming Roost drive motor stall
Code 99  — Unknown fault — check logs
```

### Key Constants
```typescript
// Sensor thresholds
const TEMP_MIN_F = 35;           // cold stress threshold
const TEMP_MAX_F = 85;           // heat stress threshold
const AMMONIA_WARNING_PPM = 10;  // ventilation needed
const AMMONIA_CRITICAL_PPM = 25; // immediate action required
const FEED_LOW_PCT = 20;         // trigger refill alert
const WATER_LOW_PCT = 15;        // trigger refill alert

// Timing
const SENSOR_PUBLISH_INTERVAL_MS = 10000;   // 10s
const MQTT_RECONNECT_INTERVAL_MS = 5000;    // 5s
const WATCHDOG_TIMEOUT_MS = 8000;           // 8s
const ARM_CMD_TIMEOUT_MS = 5000;            // 5s ack window
const CLEANING_CYCLE_DURATION_MS = 300000;  // 5 min max

// MQTT
const MQTT_QOS_CONTROL = 1;    // arm, door, feed commands
const MQTT_QOS_ESTOP = 2;      // emergency stop
const MQTT_QOS_TELEMETRY = 0;  // sensor data (lossy ok)
```

---

## 5. Agent Rules (Non-Negotiable)

```
ALWAYS:
  ✅ Run verify.sh after any code change
  ✅ Check E-STOP handling in any hardware control feature
  ✅ Add JSDoc to every new public function
  ✅ Use TypeScript strict — no implicit `any`
  ✅ Update docs/ when changing public APIs or MQTT topics
  ✅ Use color tokens, never raw hex in UI code
  ✅ Use QoS 2 + retain for E-STOP MQTT messages
  ✅ Average sensor readings over 3 samples before publishing

NEVER:
  ❌ Send motion commands through Firebase
  ❌ Block ESP32 loop with delay() > 50ms
  ❌ Leave stepper motors energized when idle
  ❌ Add Firestore collections without updating security rules
  ❌ Hardcode WiFi credentials, API keys, or device IDs
  ❌ Allow hardware action without confirmation modal in UI
  ❌ Move arm without checking chicken presence first
  ❌ Scope creep to new products until Chicken Tender v1 is stable
```

---

### SKILL: Autonomous Engineering & CAD (Autodesk MCP)

**Triggers:** "CAD", "design", "fusion", "model", "sketch", "part", "assembly",
"solidworks", "BOM", "drawing", "enclosure", "dimension", "tolerances",
"arm mount", "rail", "bracket", "export STL", "DXF", "manufacture"

---

#### What the Autodesk MCP Integration Gives You

As of April 2026, Autodesk ships a **native Fusion 360 MCP** — Claude connects
directly into a live Fusion session via the Model Context Protocol. No third-party
bridge required for Fusion 360 subscribers.

Additional MCP integrations available:
| Tool | MCP | Best for |
|---|---|---|
| Fusion 360 | Native (Autodesk official) | Parts, assemblies, parametric CAD, CAM |
| Autodesk Platform Services (APS) | `aps-mcp-server-nodejs` / Python / .NET | Cloud model access, BIM, AEC data |
| Autodesk 3ds Max | `3dsmax-mcp` (community) | Renders, visualizations, marketing assets |
| Autodesk Inventor | `autodesk-inventor` (Cadtastic) | Production add-ins, .NET 8 |
| Autodesk Civil 3D | `civil3d-mcp` (community) | Site grading, property layout |
| Autodesk Revit | `revit-mcp` (community) | BIM, building models |

---

#### Setup: Fusion 360 Native MCP (Recommended)

**Prerequisites:** Fusion 360 subscription, Claude Desktop app

**Step 1 — Enable Fusion MCP in Fusion 360:**
```
Fusion 360 → Utilities → Add-Ins → Scripts and Add-Ins
→ Search "MCP" → Enable Fusion MCP Bridge → Run on Startup ✓
```

**Step 2 — Configure Claude Desktop:**
```json
// Edit: ~/Library/Application Support/Claude/claude_desktop_config.json (macOS)
// Edit: %APPDATA%\Claude\claude_desktop_config.json (Windows)
{
  "mcpServers": {
    "fusion360": {
      "command": "python3",
      "args": ["/path/to/fusion-mcp-bridge/mcp-server/server.py"]
    }
  }
}
```

**Step 3 — Restart Claude Desktop.** A hammer icon appears — Fusion tools are live.

**Step 4 — Add your CLAUDE.md as context:**
```
In Claude Desktop → New Project → Upload CLAUDE.md
→ All engineering sessions now have Tender Cells context
```

---

#### Setup: Autodesk Platform Services MCP (Cloud Models)

For accessing models stored in Autodesk Construction Cloud or BIM 360:

```bash
# Clone the official APS MCP server
git clone https://github.com/autodesk-platform-services/aps-mcp-server-nodejs
cd aps-mcp-server-nodejs
npm install

# Set up credentials (get from APS portal: aps.autodesk.com)
export APS_CLIENT_ID=your_client_id
export APS_CLIENT_SECRET=your_client_secret

# Add to Claude Desktop config
{
  "mcpServers": {
    "aps": {
      "command": "node",
      "args": ["/path/to/aps-mcp-server-nodejs/server.js"]
    }
  }
}
```

Python alternative (faster iteration):
```bash
pip install fastmcp anthropic
git clone https://github.com/autodesk-platform-services/aps-mcp-server-python
cd aps-mcp-server-python
# Follow README for 2LO or 3LO auth setup
```

---

#### Autonomous CAD Playbook

```
When given a design task, Claude will autonomously:

1. UNDERSTAND — read the requirement; ask ONE clarifying question if truly ambiguous
2. REFERENCE — check docs/hardware-bom.md and existing CAD files before creating new
3. SKETCH — describe the geometry, constraints, and key dimensions before executing
4. BUILD — use Fusion MCP tools to create/modify geometry in the live session
5. VERIFY — take a screenshot, confirm dimensions match spec, check for interferences
6. EXPORT — generate STL (3D print), DXF (laser cut), or STEP (fabrication) as needed
7. DOCUMENT — update hardware-bom.md with new part, dimensions, material, and cost
8. SCREENSHOT — save a render to docs/cad/<part-name>.png for documentation
```

---

#### Tender Cells Design Standards

All parts must follow these conventions so the design system stays consistent:

```
UNITS:        inches (imperial) — matches US lumber and hardware standards
TOLERANCES:   ±0.010" for 3D printed fits, ±0.005" for machined, ±1/16" for wood
MATERIALS:    
  Structure   → 3/4" BC plywood or 2×2/4×4 pine
  Brackets    → 1/8" steel or 3D printed PETG (indoor), ASA (outdoor/UV)
  Fasteners   → #8 wood screws (wood), M3/M4 socket head (electronics mounts)
  Enclosures  → PLA+ (prototype), PETG or ASA (production outdoor)

NAMING:
  Parts       → TC-[PRODUCT]-[ASSEMBLY]-[PART]-[REV]
                e.g. TC-CT-ARM-MOUNT-BRACKET-R1
  Assemblies  → TC-[PRODUCT]-ASSY-[NAME]-R[N]
                e.g. TC-CT-ASSY-COOP-STRUCTURE-R2
  Drawings    → same as part name + .pdf

FOLDER STRUCTURE (Fusion / local):
  Tender Cells/
  ├── Chicken Tender/
  │   ├── Structure/
  │   ├── Arm System/
  │   ├── Doors & Latches/
  │   ├── Feeding & Water/
  │   ├── Electronics Mounts/
  │   └── Drawings/
  ├── WatchTower AI/
  │   ├── Dome Assembly/
  │   ├── Camera Mounts/
  │   ├── Electronics Enclosure/
  │   └── Pole Mount/
  └── Roaming Roost/
      ├── Dome Frame/
      ├── Base Ring/
      ├── Drive System/
      └── Door Assembly/
```

---

#### Key Parts to Model (Priority Order)

These are the open CAD tasks for Chicken Tender v1:

```
PRIORITY 1 — Blocking for prototype:
  □ TC-CT-ARM-CEILING-MOUNT-R1
      Ceiling bracket to attach 6DOF arm base to coop ridge beam
      Constraint: must fit between 2× roof rafters (~16" OC spacing)
      Material: 1/8" steel plate, 4× M6 through bolts to rafter

  □ TC-CT-RAIL-ENDSTOP-BRACKET-R1
      End stop mount for linear rail (if rail extension added to arm)
      Includes: microswitch mount, wire routing channel

  □ TC-CT-SCRAPER-TOOL-R1
      Cleaning end effector — fits tool-changer interface on arm
      Blade: 3" wide stainless scraper, spring-loaded for floor contact
      Handle: PETG printed, M5 bolt pattern for tool changer

  □ TC-CT-EGG-GRIPPER-R1
      Soft gripper for egg collection
      Consider: foam-tipped fingers, max grip force <0.5 lbf

PRIORITY 2 — Electronics enclosures:
  □ TC-CT-ELEC-BOX-R1
      Main ESP32 electronics enclosure, IP54 rated
      Mounts: DIN rail inside, cable glands for all exterior cables
      Size: fits ESP32 board + relay board + terminal blocks

  □ TC-WT-DOME-ASSY-R1
      WatchTower AI dome (180mm) — matches cross-section drawing
      Camera cradles at 120° spacing, central plate, wire channels

PRIORITY 3 — Roaming Roost drive system:
  □ TC-RR-WHEEL-BRACKET-R1
      Mecanum wheel mount for base ring
      4× positions, 90° spacing, motor mount + encoder mount

  □ TC-RR-BASE-RING-R1
      Full base ring weldment/assembly
      Attaches dome frame, carries wheel brackets, weatherproofed
```

---

#### Natural Language → Fusion Commands (Examples)

When Claude has Fusion MCP active, use prompts like these:

```
Design tasks:
"Create a rectangular sketch 4 inches × 4 inches on the XY plane"
"Extrude the sketch 0.75 inches to create the coop floor panel"
"Add a 0.5 inch hole at each corner, 0.75 inches from each edge"
"Fillet all exterior edges with 0.125 inch radius"
"Create a component called TC-CT-FLOOR-PANEL-R1"

Assembly tasks:
"Insert TC-CT-FLOOR-PANEL-R1 into the coop structure assembly"
"Align the floor panel to the four leg posts using coincident mates"
"Check for interference between the arm mount and roof rafters"
"Show the coop interior with walls transparent (section view)"

Export tasks:
"Export TC-CT-SCRAPER-TOOL-R1 as STL to docs/cad/stl/"
"Export the floor panel as DXF for laser cutting to docs/cad/dxf/"
"Save a rendered screenshot of the full coop assembly to docs/cad/renders/"
"Generate a flat pattern DXF for the steel arm mount bracket"

Analysis tasks:
"Calculate the total weight of the coop structure assembly"
"Verify the arm can reach all four corners of the 4×4 ft floor"
"Check minimum clearance between arm reach envelope and coop walls"
"Estimate print time and material for TC-CT-SCRAPER-TOOL-R1 at 0.2mm layers"
```

---

#### Engineering Calculations Reference

Common calculations Claude will perform during design tasks:

```python
# Arm reach envelope check
# Given: 6DOF arm, base at ceiling center, coop floor 4×4 ft
# Ceiling height: ~4.5 ft from floor
# Required: arm must reach all floor corners

import math

CEILING_HEIGHT = 54   # inches (4.5 ft)
COOP_HALF = 24        # inches (half of 4 ft = 2 ft from center to wall)
CORNER_DIST = math.sqrt(COOP_HALF**2 + COOP_HALF**2)  # 33.9" to corner
REQUIRED_REACH = math.sqrt(CORNER_DIST**2 + CEILING_HEIGHT**2)  # ~63" total

print(f"Corner distance from center: {CORNER_DIST:.1f} inches")
print(f"Required arm reach to floor corner: {REQUIRED_REACH:.1f} inches")
# → Arm must have ~63 inch total reach to hit all floor corners
# → If arm reach < 63", add 300mm linear rail extension at ceiling

# Mecanum wheel torque requirement (Roaming Roost)
TOTAL_WEIGHT_LB = 120   # dome + chickens + feed + water
WHEEL_RADIUS_IN = 3     # inches
FRICTION_COEFF = 0.6    # grass surface
SLOPE_DEG = 8           # typical backyard slope

import math
slope_rad = math.radians(SLOPE_DEG)
rolling_resistance = TOTAL_WEIGHT_LB * FRICTION_COEFF * math.cos(slope_rad)
grade_force = TOTAL_WEIGHT_LB * math.sin(slope_rad)
total_force = rolling_resistance + grade_force
torque_per_wheel = (total_force / 4) * (WHEEL_RADIUS_IN / 12) * 12  # in-lbs

print(f"Required torque per wheel: {torque_per_wheel:.1f} in-lbs")
# → Size DC motors to provide 2× this value for acceleration headroom

# WatchTower camera coverage check
MOUNT_HEIGHT_FT = 5     # pole height
CAMERA_FOV_DEG = 120    # wide angle lens horizontal FOV
CAMERAS = 3             # at 120° spacing = full 360°

coverage_radius = MOUNT_HEIGHT_FT * math.tan(math.radians(CAMERA_FOV_DEG / 2))
print(f"Ground coverage radius per camera: {coverage_radius:.1f} ft")
print(f"Full perimeter coverage: 360° at >{coverage_radius:.0f} ft radius")
```

---

#### Design Review Checklist

Run this before finalizing any part for fabrication:

```
STRUCTURAL:
  □ All load paths clearly defined — no unsupported overhangs > 2x thickness
  □ Fastener access — can you physically get a screwdriver/wrench to every bolt?
  □ Wood grain orientation correct on plywood panels (strength axis)
  □ Steel brackets have relief radii > 1.5× material thickness at bends

MANUFACTURING:
  □ 3D printed parts: no overhangs > 45° without supports
  □ 3D printed parts: minimum wall thickness 2.0mm (structural: 3.0mm)
  □ Laser cut parts: minimum feature size > 2× material thickness
  □ Machined parts: inside corners have relief radius for end mill
  □ All holes called out with standard drill sizes (not arbitrary decimals)

ANIMAL SAFETY:
  □ No exposed sharp edges inside coop (deburr all metal, sand all wood)
  □ No gaps 0.5"–2" that a chicken head or leg could get trapped in
  □ Arm travel envelope does not intersect perch or nest box locations
  □ All electrical enclosures are IP54 minimum inside coop (ammonia + moisture)
  □ No toxic materials — no cadmium plating, no lead solder exposed to animals

ASSEMBLY:
  □ Parts can be assembled without special tooling
  □ Sub-assemblies can be removed for service without full disassembly
  □ Electronics enclosures have cable management (glands, strain relief)
  □ Part number and revision visible/stamped on each part

DOCUMENTATION:
  □ Part added to hardware-bom.md with cost and source
  □ Render saved to docs/cad/renders/
  □ STL/DXF exported to docs/cad/stl/ or docs/cad/dxf/
  □ Any critical dimensions annotated in drawing
```

---

#### Cost-Free Local CAD Workflow

When Fusion 360 subscription isn't available:

```bash
# FreeCAD — fully open source parametric CAD
# macOS
brew install --cask freecad

# Linux
sudo apt install freecad

# Windows — download from freecad.org

# OpenSCAD — code-driven 3D modeling (good for parametric parts)
brew install openscad

# Example: Generate arm mount bracket in OpenSCAD
# (Claude can write .scad files directly — no MCP needed)
```

OpenSCAD template for parametric parts:
```scad
// TC-CT-ARM-MOUNT-BRACKET-R1
// Units: inches
// Material: 1/8" steel plate

PLATE_W = 4.0;    // width
PLATE_H = 3.0;    // height
PLATE_T = 0.125;  // thickness (1/8")
HOLE_D  = 0.25;   // M6 clearance hole
HOLE_INSET = 0.5; // from edge

module arm_mount_bracket() {
  difference() {
    cube([PLATE_W, PLATE_H, PLATE_T]);
    // Corner mounting holes
    for (x = [HOLE_INSET, PLATE_W - HOLE_INSET])
      for (y = [HOLE_INSET, PLATE_H - HOLE_INSET])
        translate([x, y, -0.01])
          cylinder(h = PLATE_T + 0.02, d = HOLE_D, $fn = 32);
    // Arm base bolt circle (4× M6 at 50mm BCD)
    for (a = [0, 90, 180, 270])
      translate([PLATE_W/2 + cos(a)*0.984,
                 PLATE_H/2 + sin(a)*0.984, -0.01])
        cylinder(h = PLATE_T + 0.02, d = HOLE_D, $fn = 32);
  }
}

arm_mount_bracket();
```

---

*Engineering skill powered by Autodesk Fusion MCP (native, April 2026) and
Autodesk Platform Services MCP. See aps.autodesk.com/blog for latest integration docs.*

---

## 6. Ecosystem Gap Analysis — Where Tender Cells Stands Now

> Based on competitive research June 2026. Update this section each sprint.

### What Exists vs. What's Missing

```
LAYER               STATUS        GAP / NEXT ACTION
─────────────────────────────────────────────────────────────────────
PRODUCT
  Chicken Tender     🟡 Prototype  Arm MCU TBD; cleaning end-effector
                                   not built; no egg gripper yet
  WatchTower AI      🟡 Designed   Electronics BOM done; dome CAD
                                   done; firmware not started
  Roaming Roost      🔴 Concept    Mecanum drive untested on grass;
                                   return-to-dock behavior undefined
  Duck Dock          🔴 Concept    No CAD, no firmware
  Bunny Burrow       🔴 Concept    No CAD, no firmware
  Goat Guardian      🔴 Concept    No CAD, no firmware
  Turkey Tower       🔴 Concept    No CAD, no firmware
  Pigeon Palace      🔴 Concept    No CAD, no firmware

APP (React Native)
  Dashboard          🟡 In-progress  Sim-only; no live hardware feed
  Product Registration 🟢 Working   Screens exist, sim mode works
  Property Layout    🟡 In-progress  Grid works; drag/drop incomplete
  CoopDetail         🟡 In-progress  3D MAP BETA toggle exists;
                                      real sensor feed missing
  Egg Map            🔴 Missing    Screen stub; no sensor backend
  Schedules          🔴 Missing    UI drafted; cron engine missing
  WasteCleaning      🔴 Missing    Screen stub; no arm command flow
  TenderAI Chat      🔴 Missing    Claude integration not built yet
  Notifications      🔴 Missing    No push alert pipeline
  OTA firmware update 🔴 Missing   No OTA flow in app

FIRMWARE
  Coop ESP32         🟡 Partial    State machine pattern not impl.;
                                   watchdog missing; sensors reading
                                   but not publishing to MQTT
  WatchTower ESP32   🔴 Not started  Camera, LoRa, solar mgmt all TBD
  Roaming Roost ESP32 🔴 Not started Drive control, nav, boundary TBD
  Arm MCU            🔴 TBD        Arm not selected yet

BACKEND / CLOUD
  Firebase Auth      🟢 Working    Users can log in
  Firestore schema   🟡 Partial    Collections defined; security
                                   rules not complete
  MQTT broker        🔴 Missing    Mosquitto not set up yet
  Firebase Functions 🔴 Missing    No functions deployed
  Claude AI proxy    🔴 Missing    aiChat function not built
  Telemetry TTL      🔴 Missing    No 90-day cleanup rule yet

INFRASTRUCTURE
  CI/CD pipeline     🔴 Missing    No GitHub Actions yet
  Firmware build CI  🔴 Missing    PlatformIO not in CI
  Test suite (app)   🔴 Missing    No Jest tests written
  Test suite (fw)    🔴 Missing    No Unity tests written
  Secrets management 🔴 Missing    No .env pattern enforced

DOCS & MARKETING
  README             🟡 Partial    Exists but thin
  Architecture doc   🔴 Missing
  Hardware BOM       🔴 Missing    Spreadsheet only, not in repo
  User guide         🔴 Missing
  Pitch deck         🟡 Structure  Deck structure defined; content
                                   needs real numbers + team slide
  Website tendercells.com 🔴 Missing  Domain not live yet
  Demo video         🔴 Missing

COMPETITOR LANDSCAPE (June 2026)
  Coop Tender (cooptender.com)  — doors only, WiFi, no arm/AI,
                                  4,000+ customers, Made in USA,
                                  $150-300 price point
  Farm.bot                      — open source gantry for crops,
                                  not animals, $2,995+
  DIY Raspberry Pi / Arduino    — no UX, no commercial product
  → TENDER CELLS DIFFERENTIATION: only product with robot arm +
    AI vision + mobile enclosure + multi-species platform + UX
```

---

## 7. MCP Server Stack — Install These Now

The 15 MCP servers worth installing in Claude Code in 2026 cover four jobs: code and repo access, databases, web grounding, and reasoning aids. Here is the curated set for Tender Cells specifically, prioritized by impact.

### Tier 1 — Install First (Repo Intelligence)

**CodeGraph** — codebase knowledge graph
```bash
# Cuts Claude Code tool calls by 92%, exploration time by 71%
npx @colbymchenry/codegraph
codegraph init -i    # interactive setup, point at repo root
codegraph index      # builds local SQLite graph — runs in background

# Add to ~/.claude/settings.json
{
  "mcpServers": {
    "codegraph": {
      "command": "npx",
      "args": ["@colbymchenry/codegraph", "serve"]
    }
  }
}
```
CodeGraph pre-indexes your codebase into a local SQLite knowledge graph and gives Claude Code eight purpose-built tools: codegraph_search, codegraph_context, codegraph_callers, codegraph_callees, codegraph_impact, codegraph_node, codegraph_files, and codegraph_status. Nothing leaves your machine.

**GitHub MCP** — official, repo + PR + issues + CI
```bash
# Already in Claude Desktop if you connected GitHub
# For Claude Code, add to settings.json:
{
  "mcpServers": {
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "<your-token>" }
    }
  }
}
```

**Filesystem MCP** — direct local file ops
```bash
{
  "mcpServers": {
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem",
               "/path/to/tender-cells"]
    }
  }
}
```

### Tier 2 — Install Second (Web + Memory)

**Brave Search MCP** — web search from within Claude Code
```bash
# Free tier: 2,000 searches/month
{
  "mcpServers": {
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": { "BRAVE_API_KEY": "<free-key from brave.com/search/api>" }
    }
  }
}
```
Use for: competitor research, ESP32 datasheet lookups, library version checks.

**Memory MCP** — persistent context across sessions
```bash
{
  "mcpServers": {
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    }
  }
}
```
Use for: remembering which arm MCU was chosen, which bugs were fixed, design decisions.

**Sequential Thinking MCP** — forces step-by-step reasoning
```bash
{
  "mcpServers": {
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    }
  }
}
```
Use for: complex architecture decisions, debugging multi-layer issues (app ↔ MQTT ↔ firmware).

### Tier 3 — Add When Ready

**Playwright MCP** — browser automation for app testing
```bash
{
  "mcpServers": {
    "playwright": {
      "command": "npx",
      "args": ["-y", "@playwright/mcp"]
    }
  }
}
```
Use for: automated E2E testing of the React Native web build.

**SQLite MCP** — query local databases
```bash
{
  "mcpServers": {
    "sqlite": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sqlite",
               "--db-path", "./local-dev.db"]
    }
  }
}
```
Use for: querying local dev Firestore emulator exports, CodeGraph database inspection.

**Sentry MCP** — error monitoring
```bash
# Once app is live and in production
{
  "mcpServers": {
    "sentry": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sentry"],
      "env": { "SENTRY_AUTH_TOKEN": "<token>",
               "SENTRY_ORG": "wecr8-solutions" }
    }
  }
}
```

**Autodesk Fusion MCP** — CAD (see Engineering skill above)

**Firecrawl MCP** — web scraping + competitor site crawling
```bash
npx firecrawl-mcp --install --all
# Free tier available at firecrawl.dev
```
Use for: crawling competitor sites, scraping ESP32 docs, pulling pricing data.

### Full .claude/settings.json Template
```json
{
  "mcpServers": {
    "codegraph": {
      "command": "npx",
      "args": ["@colbymchenry/codegraph", "serve"]
    },
    "github": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-github"],
      "env": { "GITHUB_PERSONAL_ACCESS_TOKEN": "${GITHUB_TOKEN}" }
    },
    "filesystem": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-filesystem",
               "${REPO_ROOT}"]
    },
    "brave-search": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-brave-search"],
      "env": { "BRAVE_API_KEY": "${BRAVE_API_KEY}" }
    },
    "memory": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-memory"]
    },
    "sequential-thinking": {
      "command": "npx",
      "args": ["-y", "@modelcontextprotocol/server-sequential-thinking"]
    },
    "fusion360": {
      "command": "python3",
      "args": ["${FUSION_MCP_PATH}/mcp-server/server.py"]
    }
  }
}
```

---

## 8. Subagent Team — .claude/agents/

Claude Code subagents are specialized, autonomous assistants with their own system prompt, curated tool permissions, and isolated context windows — create a team of AI experts with roles like Product Spec, Architect, Implementer/Tester, and chain them with hooks.

Create these files in `.claude/agents/` in your repo:

### agents/coop-architect.md
```markdown
---
name: coop-architect
description: >
  Hardware and software architecture reviewer for Tender Cells.
  Use when designing new features, reviewing system boundaries,
  or deciding between implementation approaches.
  Trigger: "review architecture", "design decision", "how should we structure"
tools: Read, Glob, Grep, WebSearch
model: sonnet
---
You are the senior architect for Tender Cells, an IoT animal care platform.

You know:
- The full system: React Native app → Firebase → MQTT Pi broker → ESP32 devices
- Local-first control principle: motion commands NEVER go through Firebase
- All products: Chicken Tender, WatchTower AI, Roaming Roost, and future SKUs
- Hardware constraints: ESP32 memory limits, LoRa packet size, MQTT QoS rules
- Safety requirements: E-STOP propagation, chicken presence checks, watchdog timers

When reviewing architecture:
1. Read the relevant code first — never advise from memory alone
2. Check against CLAUDE.md agent rules (DO/NEVER section)
3. Flag any proposal that routes motion commands through Firebase
4. Always consider offline-first resilience
5. Give a concrete recommendation, not just trade-offs
```

### agents/firmware-engineer.md
```markdown
---
name: firmware-engineer
description: >
  ESP32/Arduino firmware specialist. Use for all firmware tasks:
  writing new firmware, debugging crashes, reviewing C++ code,
  checking state machines, validating sensor code.
  Trigger: "firmware", "ESP32", "arduino", "C++", "sensor", "motor"
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---
You are an embedded firmware engineer specializing in ESP32/Arduino
for the Tender Cells automated animal care system.

Core rules you NEVER violate:
- Every firmware file must have: watchdog init, non-blocking WiFi reconnect,
  E-STOP subscriber, stepper-disable-on-idle
- No delay() > 50ms in any loop()
- State machine pattern: BOOT→CONNECTING→IDLE→RUNNING→ERROR→ESTOP
- MQTT QoS 2 + retain:true for E-STOP topic only
- Sensor reads averaged over 3 samples with outlier rejection
- All MQTT payloads match the schemas in CLAUDE.md exactly

When writing firmware:
1. Read existing main.cpp and state_machine.cpp first
2. Follow the template in CLAUDE.md firmware skill exactly
3. After writing, run: cd firmware/<target> && pio run
4. Report binary size and any warnings
```

### agents/app-builder.md
```markdown
---
name: app-builder
description: >
  React Native / TypeScript specialist for the Tender Cells mobile app.
  Use for UI features, Firebase integration, MQTT client, state management.
  Trigger: "screen", "component", "UI", "app feature", "React Native"
tools: Read, Write, Edit, Bash, Glob, Grep
model: sonnet
---
You are a React Native engineer for the Tender Cells app.

UI rules you NEVER violate:
- Colors: always use tokens (#0D2B1E bg, #C8B882 gold, #4A7C59 accent,
  #CC3333 danger) — never raw hex elsewhere
- Every screen has StatusHeader showing device state
- Every hardware action goes through ConfirmModal
- Firebase listeners always have cleanup: return unsub from useEffect
- TypeScript strict — no implicit any
- MQTT commands use the mqtt.ts service, never direct Firebase writes

When building a feature:
1. Read the existing screen/component it relates to first
2. Follow the feature builder playbook in CLAUDE.md
3. After writing, check: tsc --noEmit passes, no ESLint errors
4. Write a snapshot test for any new component
```

### agents/docs-writer.md
```markdown
---
name: docs-writer
description: >
  Technical writer for Tender Cells. Use for generating user guides,
  API documentation, ADRs, README updates, and pitch deck content.
  Trigger: "document", "write a guide", "README", "pitch", "ADR"
tools: Read, Write, Edit, Glob, WebSearch
model: haiku
---
You are a technical writer for Tender Cells by WeCr8 Solutions.

You write two kinds of docs:
1. USER-FACING: plain language, numbered steps, "what can go wrong"
   table, no jargon. Audience: backyard chicken hobbyist, not engineer.
2. DEVELOPER-FACING: ADR format, code examples, data flow diagrams,
   firmware flash instructions. Audience: contributing engineer.

Always:
- Read the actual code before documenting it
- Define Sim-only mode, E-STOP, Cleaning Cycle, Egg Map on first use
- Save output to correct docs/ subfolder
- Update the relevant index file after writing

For pitch content: use the 12-slide structure in CLAUDE.md.
Tone: confident, technical credibility, not jargon-heavy.
Audience: hardware-friendly seed investors or agtech VCs.
```

### agents/code-reviewer.md
```markdown
---
name: code-reviewer
description: >
  Autonomous code reviewer. Runs automatically after code changes.
  Checks for safety issues, correctness, conventions, and security.
  Trigger: "review", "PR", after any Write/Edit tool call on src files
tools: Read, Glob, Grep
model: sonnet
---
You are a senior code reviewer for Tender Cells.

Run the full review checklist from CLAUDE.md code review skill.
Severity levels: BLOCKER | WARNING | SUGGESTION

BLOCKERS must be fixed before any PR merges:
- Missing E-STOP handling in hardware control code
- Firebase listener without cleanup
- Hardcoded secrets or credentials
- Arm motion without chicken presence check
- MQTT arm commands using QoS 0

Output format:
## Review Summary
**Decision**: APPROVE / REQUEST CHANGES
**Blockers**: N | **Warnings**: N | **Suggestions**: N

### Blockers
[list each with file:line and exact fix]

### Warnings
[list each with recommendation]
```

### agents/hardware-bom-tracker.md
```markdown
---
name: hardware-bom-tracker
description: >
  Tracks hardware parts, costs, and sourcing for all Tender Cells products.
  Use when adding new parts, updating costs, or generating a BOM export.
  Trigger: "BOM", "parts list", "cost", "source", "add a part"
tools: Read, Write, Edit
model: haiku
---
You maintain the hardware BOM for Tender Cells in docs/hardware-bom.md.

When adding a part:
1. Read current hardware-bom.md
2. Add to correct product section with: Part | Spec | Qty | Unit Cost | Source
3. Update the cost summary totals
4. Flag if COGS would push above 45% of target MSRP

Naming convention for new parts: TC-[PRODUCT]-[ASSEMBLY]-[PART]-R[N]
Always note if a part is available on LCSC (cheaper) vs Amazon (faster).
```

---

## 9. Hooks — .claude/hooks/

Hooks are event-driven scripts that run when something happens in Claude Code — unlike prompts, they execute deterministic code and cannot hallucinate. Block dangerous commands before they run, inject project context automatically, log every tool call for audit.

Create `.claude/hooks/` and add these:

### hooks/pre-tool-use.sh — Safety Gate
```bash
#!/bin/bash
# Runs BEFORE every tool call — blocks dangerous operations

TOOL="$1"
ARGS="$2"

# Block writes to firmware while a cleaning cycle might be running
if [[ "$TOOL" == "Write" ]] && echo "$ARGS" | grep -q "firmware/chicken-tender/src/state_machine"; then
  echo "⚠️  SAFETY: Modifying state machine. Verify no cleaning cycle is active." >&2
fi

# Block hardcoded credentials
if [[ "$TOOL" == "Write" || "$TOOL" == "Edit" ]]; then
  if echo "$ARGS" | grep -qE '(password|api_key|secret)\s*=\s*"[^"]{4,}"'; then
    echo "❌ BLOCKED: Hardcoded credential detected. Use environment config." >&2
    exit 1
  fi
fi

# Block delay() > 50ms in firmware
if [[ "$TOOL" == "Write" || "$TOOL" == "Edit" ]]; then
  if echo "$ARGS" | grep -q "firmware/" && echo "$ARGS" | grep -qE "delay\([5-9][0-9]{1,}|delay\([0-9]{3,}"; then
    echo "⚠️  FIRMWARE: delay() > 50ms detected. Use non-blocking pattern." >&2
  fi
fi

exit 0
```

### hooks/post-tool-use.sh — Auto Verify
```bash
#!/bin/bash
# Runs AFTER Write/Edit on source files — triggers relevant checks

TOOL="$1"
FILE="$2"

if [[ "$TOOL" == "Write" || "$TOOL" == "Edit" ]]; then

  # TypeScript check after app changes
  if echo "$FILE" | grep -q "^app/.*\\.tsx\\?$"; then
    echo "→ Running TypeScript check..."
    cd app && npx tsc --noEmit --quiet 2>&1 | head -20
  fi

  # PlatformIO build check after firmware changes
  if echo "$FILE" | grep -q "^firmware/chicken-tender/"; then
    echo "→ Building chicken-tender firmware..."
    cd firmware/chicken-tender && pio run 2>&1 | tail -5
  fi
  if echo "$FILE" | grep -q "^firmware/watchtower/"; then
    echo "→ Building watchtower firmware..."
    cd firmware/watchtower && pio run 2>&1 | tail -5
  fi

  # Security rules check after Firestore schema changes
  if echo "$FILE" | grep -q "firestore\\.rules\\|firebase\\.json"; then
    echo "→ Validating Firestore rules..."
    firebase emulators:exec --only firestore "echo rules OK" 2>&1 | tail -3
  fi

fi
```

### hooks/stop.sh — Session Summary
```bash
#!/bin/bash
# Runs when Claude Code session ends — prints what was done

echo ""
echo "═══════════════════════════════════════"
echo "  TENDER CELLS SESSION SUMMARY"
echo "═══════════════════════════════════════"
echo ""

# Show files changed this session
echo "Files changed:"
git diff --name-only 2>/dev/null | head -20

echo ""
echo "Tests status:"
cd app && npx jest --passWithNoTests --silent 2>/dev/null && echo "✅ App tests pass" || echo "❌ App tests failing"

echo ""
echo "Open TODO items:"
grep -r "// TODO\|// FIXME\|// HACK" app/src firmware/ --include="*.ts" --include="*.tsx" --include="*.cpp" -l 2>/dev/null | head -10

echo ""
echo "Next recommended actions (check gap table in CLAUDE.md §6)"
```

### Register Hooks in .claude/settings.json
```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/pre-tool-use.sh"
          }
        ]
      }
    ],
    "PostToolUse": [
      {
        "matcher": "Write|Edit",
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/post-tool-use.sh"
          }
        ]
      }
    ],
    "Stop": [
      {
        "hooks": [
          {
            "type": "command",
            "command": ".claude/hooks/stop.sh"
          }
        ]
      }
    ]
  }
}
```

---

## 10. Sprint Zero — Recommended Build Order

Given the gap table above, here is the optimal sequence to get to
a working Chicken Tender v1 demo as fast as possible:

```
WEEK 1-2: Foundation (unblocks everything else)
  □ Set up GitHub repo with proper structure (mirror CLAUDE.md tree)
  □ Install CodeGraph + GitHub + Filesystem MCPs
  □ Create .claude/agents/ with all 6 subagents
  □ Install .claude/hooks/ (pre-tool-use, post-tool-use, stop)
  □ Set up Firebase Emulator locally
  □ Set up Mosquitto MQTT locally
  □ Add CI: GitHub Actions ci.yml (TypeScript + ESLint + PlatformIO)

WEEK 3-4: Firmware Core (blocks hardware testing)
  □ Implement state machine template on Chicken Tender ESP32
  □ Implement MQTT sensor publish (10s interval, correct schema)
  □ Implement non-blocking WiFi reconnect
  □ Implement watchdog timer
  □ Implement E-STOP subscriber (QoS 2, retained)
  □ Implement door servo control
  □ Write Unity tests for state machine transitions

WEEK 5-6: App Live Data (blocks user testing)
  □ Wire CoopDetail screen to live MQTT sensor feed
  □ Implement Schedules screen with cron engine
  □ Implement Egg Map screen with mock sensor data
  □ Implement WasteCleaning screen with arm command flow
  □ Build TenderAI chat with Claude proxy function
  □ Add push notification pipeline (predator alerts)

WEEK 7-8: WatchTower AI (second hardware product)
  □ ESP32-S3 camera firmware — 3-camera capture
  □ TFLite Micro model — predator vs not-predator classifier
  □ LoRa alert broadcast on detection
  □ Solar + battery management firmware
  □ App: alert feed from WatchTower events

WEEK 9-10: Polish + Pitch
  □ Record 90-second demo video (sim mode + real hardware)
  □ Complete pitch deck with real prototype photos
  □ Publish tendercells.com landing page
  □ Open beta waitlist
  □ Complete hardware-bom.md with real sourced costs
```

---

## 11. Hardware Specification References

**Master Product Workbook:** `docs/Tender_Cells_Master_Product_Workbook.xlsx`

- **Sheets:** Lists, Engineering_Assumptions, Product_Master, SKU_Master
- **Contents:** Product specs, BOM data, component sources, cost estimates
- **Owner:** WeCr8 Product Team
- **Usage:** Source for hardware-bom.md, part specifications, supplier links

**Predator Monitor Hardware List:** `docs/TenderCells_Predator_Monitor_Hardware_List.xlsx`

- **Contents:** WatchTower AI component list, sensors, PCB specs, assembly guide
- **Owner:** WeCr8 Hardware Team
- **Usage:** ESP32-CAM firmware requirements, 3-camera integration, LoRa module specs

**Chicken Tender™ Master Specification:** `docs/CHICKEN_TENDER_MASTER_SPEC.md`

- **Document ID:** TC-CHKN-MASTER-001
- **Contents:** Complete product requirements, engineering specs, success criteria
- **Covers:** Dimensions, zones, robot safety, cloud integration, manufacturing
- **Variants:** S/M/L sizes; BASE/AUTO/PRO feature tiers
- **Owner:** WeCr8 Product Team
- **Usage:** Source of truth for product scope, design validation, roadmap alignment

---

*Claude Code: read this file at the start of every session.
When in doubt about a convention, check this file before asking.
Keep this file updated as the project evolves — it is the source of truth.*
