# Tender Cells — Learning Tracks

> **Mission:** open-source engineering projects that teach **AI, electronics, robotics,
> manufacturing, and problem-solving** through real-world challenges. Chickens are the
> flagship — not the ceiling.

Tender Cells isn't a chicken company, a robotics company, or an education company. It's a
platform of **buildable, real-world engineering projects** that all link to one OS. Every
project: teaches a real skill, is **4-H / FFA friendly**, **leverages AI**, runs on
**low-cost hardware**, and is **open-source**.

## How tracks work
- Each project flashes the **same Starter Node** firmware (one binary, pick the
  `peripheral`) and links to the **TenderCells OS** — claim it, see it live, schedule it.
- Each lesson ships the **[printable pack](lessons/_TEMPLATE.md)**: Instructor Guide,
  Student Workbook, Wiring Sheet, BOM (with links), CAD files, AI Prompt Guide.
- Skills compound across tiers: sense → actuate → automate → design → manufacture.

**Status:** ✅ built · 🟡 partial (firmware or lesson exists) · 🔴 planned

---

## Tier 1 — High-traffic on-ramps
Things parents, teachers, and students already search for.

| # | Project | Teaches | Search terms | Status | Lesson |
|---|---------|---------|--------------|--------|--------|
| 1 | **Weather Station** | ESP32, temp/humidity, solar, data logging | "DIY weather station", "ESP32 weather station" | 🟡 | [sensors](CLASSROOM_SENSORS_AND_AUTOMATION.md) |
| 2 | **AI Camera Animal Detector** | computer vision, edge AI, classification | "AI camera project", "computer vision for kids" | 🟡 | [build-your-own device](CLASSROOM_BUILD_YOUR_OWN_DEVICE.md) |
| 3 | **Smart Greenhouse** | soil moisture, water control, automation | "smart greenhouse", "Arduino greenhouse" | 🟡 | [feeder/waterer](CLASSROOM_FEEDER_AND_WATERER.md) + [sensors](CLASSROOM_SENSORS_AND_AUTOMATION.md) |
| 4 | **Smart Chicken Coop** (flagship) | sensors, motors, solar, cameras | huge backyard-chicken audience | 🟡 | [door+rover](CLASSROOM_DOOR_AND_ROAMING_ROOST.md), [feeder](CLASSROOM_FEEDER_AND_WATERER.md), [sensors](CLASSROOM_SENSORS_AND_AUTOMATION.md) |
| 5 | **Predator Alert System** (WatchTower AI) | cameras, AI, notifications | farmers, ranchers, homesteaders | 🟡 | [build-your-own device](CLASSROOM_BUILD_YOUR_OWN_DEVICE.md) |

## Tier 2 — Future-engineer projects
Real engineering disciplines.

| # | Project | Teaches | Status | Note |
|---|---------|---------|--------|------|
| 6 | **CNC Machine Simulator** | coordinates, motion systems | 🔴 | paper model + toolpath worksheets first |
| 7 | **Robot Arm Basics** | kinematics, servos | 🟡 | [gantry capstone](CLASSROOM_GANTRY_AND_BOM.md); servo kit |
| 8 | **Conveyor System** ("Factory Automation for Kids") | manufacturing, sensors, automation | 🔴 | relay motor + IR sensor |
| 9 | **Vision-Guided Sorting** | computer vision + automation | 🔴 | combines #2 + #8 |
| 10 | **AGV (Autonomous Guided Vehicle)** | navigation, sensors, robotics | ✅ | **Roaming Roost drive already shipped** — [door+rover](CLASSROOM_DOOR_AND_ROAMING_ROOST.md) |

## Tier 3 — AI + coding
Highest current interest.

| # | Project | Teaches | Status | Lesson |
|---|---------|---------|--------|--------|
| 11 | **AI Chatbot for Your Project** | prompts, APIs, assistants | 🟡 | TenderAI (CLAUDE.md AI skill) |
| 12 | **AI Coding Assistant** | generate/debug code, responsible AI | 🟡 | [AI/CAD](CLASSROOM_AI_CAD_FUSION_MCP.md) |
| 13 | **AI Project Designer** | AI → real engineering ("design a chicken feeder, then build it") | 🟡 | [AI/CAD](CLASSROOM_AI_CAD_FUSION_MCP.md) |

## Tier 4 — Maker projects
Perform extremely well online; all reuse shipped actuators.

| # | Project | Reuses | Search | Status |
|---|---------|--------|--------|--------|
| 14 | **Smart Bird Feeder** | relay/servo feeder | huge YouTube niche | 🟡 |
| 15 | **Smart Pet Door** | door servo | massive pet audience | ✅ (door shipped) |
| 16 | **Smart Aquarium** | relay pump + sensors | fishkeeping + STEM | 🔴 |
| 17 | **Smart Garden** | sensors + relay | homesteading | 🟡 |
| 18 | **Hydroponics Controller** | pump + level + light | huge | 🔴 |

## Tier 5 — Manufacturing pathway (the differentiator)
Most STEM stops before manufacturing. Tender Cells doesn't.

| # | Project | Teaches | Status |
|---|---------|---------|--------|
| 19 | **CAD Basics** | Fusion / Onshape, drawing sheets | 🟡 [AI/CAD](CLASSROOM_AI_CAD_FUSION_MCP.md) |
| 20 | **Engineering Drawings** | GD&T basics, dimensions | 🔴 |
| 21 | **Reverse Engineering** | tear down → BOM + drawings | 🔴 |
| 22 | **Tool Identification** | drill, endmill, tap, reamer | 🔴 |
| 23 | **Build a Fixture** | manufacturing thinking | 🔴 |
| 24 | **Product Development** | idea → CAD → prototype → test | 🟡 [AI/CAD](CLASSROOM_AI_CAD_FUSION_MCP.md) |

---

## Highest-traffic priorities (build order for reach)
1. AI Camera Projects (#2) · 2. Smart Chicken Coop (#4) · 3. Predator Detection (#5) ·
4. Smart Greenhouse (#3) · 5. Robot Arm (#7) · 6. AGV (#10) · 7. CNC Simulator (#6) ·
8. AI Coding Assistant (#12) · 9. Smart Garden (#17) · 10. Hydroponics (#18).

## SEO / traffic notes
- One lesson page per project, titled with the search phrase ("ESP32 Weather Station —
  Build It in an Afternoon"). Printables are linkable PDFs → backlinks.
- Cross-link tracks; every page ends with "link it to the TenderCells OS."
- Free + open-source + printable = the combination teachers actually adopt and share.

## Every lesson ships the printable pack
See **[lessons/_TEMPLATE.md](lessons/_TEMPLATE.md)** — Instructor Guide, Student
Workbook, Wiring Sheet (color-coded), BOM (Amazon links + part numbers), CAD
(Fusion/STEP/STL), AI Prompt Guide.
