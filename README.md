# Tender Cells — AI-Powered Automated Animal Care Platform

![Build](https://img.shields.io/badge/build-passing-6BBF59)
![Mobile Web](https://img.shields.io/badge/mobile%20web-responsive-6BBF59)
![Release SHA](https://img.shields.io/badge/release%20sha-pending-lightgrey)
![License](https://img.shields.io/badge/license-open%20source%20pending-D0A34E)

**WeCr8 Solutions** | Autonomous robot coop control system | React Native + Firebase + ESP32 + MQTT

---

## Project Structure

```text
tender-cells/
├── .claude/                      ← Claude Code configuration
│   ├── CLAUDE.md                 ← Agent skill file (READ THIS FIRST)
│   ├── settings.json             ← MCP servers + hooks + agent routing
│   ├── agents/                   ← Specialist agent definitions
│   │   ├── firmware-engineer.md
│   │   ├── app-builder.md
│   │   ├── code-reviewer.md
│   │   ├── docs-writer.md
│   │   ├── coop-architect.md
│   │   └── bom-tracker.md
│   └── hooks/                    ← Safety verification scripts
│       ├── pre-tool-check.ps1    ← Block hardcoded secrets
│       └── post-tool-verify.ps1  ← Auto-verify TypeScript, firmware builds
│
├── firmware/                     ← ESP32 firmware (Arduino)
│   ├── chicken-tender/           ← Main coop controller
│   │   ├── src/main.cpp          ← State machine + sensor + MQTT
│   │   └── platformio.ini        ← Build config
│   ├── watchtower/               ← Predator monitor (ESP32-S3)
│   ├── roaming-roost/            ← Mobile dome controller
│
├── functions/                    ← Firebase Cloud Functions (Node 18)
│   ├── src/
│   │   └── index.ts              ← AI proxy, alerts, schedules, cleanup
│   ├── package.json
│   └── tsconfig.json
│
├── app/                          ← React app (Vite + Firebase)
│   ├── src/
│   │   ├── screens/              ← UI screens (Dashboard, CoopDetail, etc.)
│   │   ├── components/           ← React components
│   │   ├── services/             ← Firebase, MQTT, AI service clients
│   │   ├── hooks/                ← Custom React hooks
│   │   ├── store/                ← Zustand state management
│   │   └── __tests__/
│   └── package.json
│
├── docs/                         ← Documentation
│   ├── architecture.md           ← System design
│   ├── hardware-bom.md           ← Parts list + costs
│   ├── adr/                      ← Architecture Decision Records
│   ├── api/                      ← Auto-generated API docs
│   └── user-guide/               ← Step-by-step guides
│
├── .env.example                  ← Environment variables template
├── firebase.json                 ← Firebase hosting + emulator config
├── firestore.rules               ← Firestore security rules
├── package.json                  ← Root project (Vite + scripts)
└── .github/workflows/ci.yml      ← GitHub Actions CI
```

---

## Quick Start

## Engineering Loop

For the active TenderCells UI app:

```bash
cd applications/tendercells_ui/test_output/tendercells-ui
npm run quality:loop
```

The loop writes `docs/quality-loop-report.md`. Production gates and kit/open-source requirements live in `docs/engineering-loop.md` and `docs/production-readiness.md` inside that UI app.

### 1. Install Dependencies

```bash
npm install
cd functions && npm install && cd ..
```

### 2. Configure Environment

```bash
# Copy template
cp .env.example .env

# Add your own values:
# - VITE_FIREBASE_* — from Firebase Console
# - ANTHROPIC_API_KEY — from https://console.anthropic.com
# - MQTT_BROKER_HOST — local IP (e.g., 192.168.1.100)
```

### 3. Start Firebase Emulator (for local development)

```bash
npm run firebase:emulate
# Opens emulator on http://localhost:4000
```

### 4. Build Firmware (optional, requires PlatformIO)

```bash
pip install platformio
cd firmware/chicken-tender && pio run
```

### 5. Run Development Server

```bash
npm run dev
# Vite app on http://localhost:5173
```

---

## Development with Local LLMs (Ollama)

The project is configured to use **local LLMs via Ollama** to minimize API costs:

```bash
# Install Ollama: https://ollama.ai
ollama pull deepseek-coder-v2  # For code tasks (firmware, app)
ollama pull llama3.2            # For docs/BOM tasks

# Start Ollama
ollama serve
# Runs on http://localhost:11434
```

Claude Code automatically routes tasks to local models:
- **firmware, app code** → `deepseek-coder-v2`
- **documentation, BOM** → `llama3.2`
- **Architecture decisions** → `deepseek-coder-v2`
- **Complex reasoning** → Claude Anthropic API (fallback)

See `.claude/settings.json` for agent definitions.

---

## Claude Code Agents

Read `.claude/CLAUDE.md` first — it contains the complete system design.

Trigger agents with phrases like:

```text
"fix the watchdog timer in firmware"
→ Routes to firmware-engineer agent (Ollama + deepseek-coder-v2)

"add a new screen for egg collection"
→ Routes to app-builder agent (Ollama + deepseek-coder-v2)

"document the MQTT schema"
→ Routes to docs-writer agent (Ollama + llama3.2)

"review this PR"
→ Routes to code-reviewer agent (auto-runs after Write/Edit)
```

---

## Critical Rules (DO / NEVER)

**NEVER:**
- Send motion commands through Firebase (use MQTT instead)
- Block ESP32 loop with `delay()` > 50ms
- Leave stepper motors energized when idle
- Hardcode WiFi credentials, API keys, device IDs
- Allow hardware action without confirmation modal in app
- Scope creep to new products until Chicken Tender v1 is stable

**ALWAYS:**
- Check E-STOP handling in firmware
- Average sensor readings over 3 samples
- Use MQTT QoS 2 + retain for E-STOP topic
- Update docs when changing APIs or MQTT topics
- Use color tokens, never raw hex in UI
- Run `tsc --noEmit` after app changes
- Run `pio run` after firmware changes

---

## Firebase Setup

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project (or use existing `tender-cells`)

### 2. Enable Services

- **Authentication** → Email/Password
- **Firestore Database** → Test mode (for dev)
- **Cloud Functions** → Node 18 runtime

### 3. Get Credentials

Project Settings → Web App → Copy config to `.env`:

```env
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=...
VITE_FIREBASE_PROJECT_ID=...
```

### 4. Deploy Functions

```bash
npm run functions:deploy
# Or use emulator locally: npm run firebase:emulate
```

---

## Architecture Overview

```text
React Native App (Expo)
        ↓ (Firebase Auth + Firestore)
        ↓
    Firebase
        ↓ (Cloud Functions)
        ↓
Pi MQTT Broker (Mosquitto)
        ↓ (MQTT QoS 1/2 local commands)
        ↓
ESP32 Firmware (State Machine)
        ├─ Sensors (temp, humidity, ammonia, feedLevel, water)
        ├─ Arm Control (6DOF coordinate)
        ├─ Door Servo
        ├─ Feed Dispenser
        ├─ Cleaning Cycle (stepper + scraper)
        └─ Watchdog Timer (8s timeout)
```

**Local-First Control:** Motion commands over MQTT (< 50ms latency), not Firebase.

---

## Next Steps (Gap Analysis)

See `.claude/CLAUDE.md` §6 for full gap table.

**Highest Priority (RED):**
- [ ] Finish Chicken Tender firmware state machine (skeleton created)
- [ ] Set up Mosquitto MQTT broker (not yet running)
- [ ] Deploy Cloud Functions (stubs created)
- [ ] Add app screens: Schedules, WasteCleaning, EggMap, TenderAI chat
- [ ] GitHub Actions CI pipeline (created, needs testing)

---

## Resources

- 📖 **Design Spec:** [.claude/CLAUDE.md](./.claude/CLAUDE.md)
- 🛠️ **Agent Definitions:** [.claude/agents/](./.claude/agents/)
- 🐛 **Current Issues:** Check GitHub Issues
- 📝 **Docs:** [docs/](./docs/)

---

## Contributing

1. Read `.claude/CLAUDE.md` — architecture & rules
2. Run `npm run lint` — check code style
3. Run `npm run build` — ensure TypeScript clean
4. Create pull request — CI runs automatically
