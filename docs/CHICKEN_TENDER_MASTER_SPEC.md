# Chicken Tender™ Master Product Requirements & Engineering Specification

**Document ID:** TC-CHKN-MASTER-001  
**Product Family:** Chicken Tender™  
**Platform:** TenderCells™  
**Revision:** A  
**Status:** Active Development

---

## 1. Purpose

Chicken Tender™ is an intelligent poultry enclosure platform designed to automate routine chicken care activities while improving flock safety, sanitation, environmental monitoring, and operational efficiency.

The system serves as the foundational product within the TenderCells™ ecosystem and supports optional robotic automation, AI monitoring, cloud connectivity, solar power, and modular expansion.

---

## 2. Product Objectives

### Primary Goals

- Reduce daily labor requirements
- Improve flock safety
- Improve sanitation management
- Enable automated maintenance operations
- Support modular upgrades
- Support remote monitoring
- Enable future robotic interaction

### Secondary Goals

- Predator detection
- Environmental monitoring
- Automated feeding
- Automated watering
- Automated waste handling
- AI-assisted health monitoring
- Solar-powered operation

---

## 3. Product Variants

### Small Coop (Size S)

**Dimensions:**
- Width: 36"
- Depth: 36"
- Height: 60"

**Designation:** Chicken Tender™ Small

---

### Medium Coop (Size M)

**Dimensions:**
- Width: 48"
- Depth: 48"
- Height: 72"

**Designation:** Chicken Tender™ Medium

---

### Large Coop (Size L)

**Dimensions:**
- Width: 72"
- Depth: 72"
- Height: 96"

**Designation:** Chicken Tender™ Large

---

## 4. Variant Types

### BASE

Manual operation.

**Features:**
- Coop structure
- Nesting
- Roosting
- Ventilation

**Price Point:** Entry-level

---

### AUTO

Automated operation.

**Additional Features:**
- Motorized doors
- Environmental monitoring
- Automated lighting
- Control electronics

**Target:** DIY enthusiasts, small commercial operators

---

### PRO

Full TenderCells ecosystem integration.

**Additional Features:**
- TenderCells Rail System™
- WatchTower AI™ compatibility
- TenderCells Cloud™ integration
- Robot-ready architecture

**Target:** Commercial operations, tech-forward users

---

## 5. Structural Requirements

### Lumber Specifications

| Component | Nominal | Actual |
|-----------|---------|--------|
| 4×4 Posts | 4" × 4" | 3.5" × 3.5" |
| 2×4 Framing | 2" × 4" | 1.5" × 3.5" |
| 3/4" Plywood | 0.75" nominal | 0.75" |

**Materials:** Pressure-treated pine (5-year warranty minimum)

### Structural Components

Required elements:
- Bottom frame ring (foundation perimeter)
- Mid-frame ring (load distribution)
- Robot mounting ring (rail attachment points)
- Roof support ring (load bearing)
- Corner posts (vertical load path)
- Roof trusses (weather protection)
- Service access framing (door/hatch mounting)

---

## 6. Interior Zones

Enclosure divided into functional zones with specific operational requirements.

### Zone A – Chicken Living Area

**Purpose:** Primary occupancy

**Includes:**
- Bedding (deep litter or shavings)
- Feeding station
- Watering station
- Roosting perches

**Minimum Height:** 18" of clear space above bedding

---

### Zone B – Nesting Area

**Purpose:** Egg laying and collection

**Requirements:**
- Easy exterior access for collection
- Weather protection
- Removable trays for sanitation
- Minimum 12" × 12" box dimensions

---

### Zone C – Waste Collection Area

**Purpose:** Manure and bedding management

**Features:**
- Poop bin cassette (under roosts)
- Deep bedding collection zone
- Compost transfer points

**Supports:**
- Poop bin cassette systems
- Deep bedding composting
- Automated waste removal (future)

---

### Zone D – Robot Service Zone

**Purpose:** TenderCells Rail System operation

**Requirements:**
- Defined keep-in volume (robot workspace)
- Defined keep-out volume (safety)
- Clearance verification
- Path planning compatibility

---

## 7. Deep Bedding System

### Bedding Depth

**Minimum:** 6"  
**Maximum:** 12"  
**Recommended:** 8-10"

### Approved Materials

- Pine shavings
- Straw
- Hemp bedding
- Other carbon-rich, non-toxic materials

### Deep Bedding Objectives

- Odor reduction through aerobic decomposition
- Moisture management and absorption
- On-site composting support
- Thermal insulation (improves winter heating efficiency)
- Reduced ammonia levels

**Maintenance:** Weekly turning with deep litter fork recommended

---

## 8. Poop Bin Cassette System

### Purpose

Collect concentrated waste from roosting areas for easy removal and composting.

### Dimensions

**Height:** 8" external  
**Depth:** 24" recommended travel distance  
**Width:** 36" for Medium coop

### Operation Sequence

1. Service door opens (rear exterior access)
2. Bin latch releases
3. Bin slides outward on heavy-duty drawer slides
4. User removes accumulated waste
5. Bin returns and latches

**Future Enhancement:** Robot-assisted dumping with compost transfer to separate bin

### Hardware Requirements

- Heavy-duty ball-bearing drawer slides (100+ lb capacity)
- Corrosion-resistant hardware (stainless steel or galvanized)
- Washable/cleanable interior surfaces
- Positive retention latch
- Weather seal gaskets

---

## 9. Roost System

### Deployable Roost Option

**States:**
- **Stowed:** Folded up, maximizes floor space
- **Deploying:** Motor-driven transition
- **Deployed:** Chickens roosting, elevated sleeping
- **Retracting:** Auto-retract at dawn (optional)

### Requirements

- Safe for chicken feet (2" diameter minimum perch)
- Easy cleaning access
- Robot clearance verification (minimum 24" above)
- Load capacity: 150+ lbs (20 chickens)

---

## 10. Nest Box System

### Design Requirements

- **Exterior Service Access:** Customer can collect eggs without entering coop
- **Weather Protection:** Roof overhang minimum 12"
- **Interior Dimensions:** 12" × 12" × 12" per box
- **Removable Trays:** Easy sanitation
- **Ventilation:** Passive airflow, no drafts

### Quantity

| Coop Size | Min Boxes | Recommended |
|-----------|-----------|------------|
| Small (S) | 2 | 3 |
| Medium (M) | 4 | 6 |
| Large (L) | 6 | 9 |

**Rule of Thumb:** 1 box per 2-3 hens

---

## 11. TenderCells Rail System™ Compatibility

Chicken Tender™ structure **shall support optional installation** of the TenderCells Rail System™ for robotic cleaning, inspection, and maintenance.

### Supported Rail Configurations

| Coop Size | Rail Space | Designation |
|-----------|-----------|---|
| Small (S) | 24" × 24" × 24" | Small Rail |
| Medium (M) | 36" × 36" × 36" | Medium Rail |
| Large (L) | 48" × 48" × 48" | Large Rail |

### Rail Functions

- **Inspection:** Automated visual assessment of coop health
- **Cleaning:** Brush/vacuum end effectors for debris removal
- **Tool Positioning:** Precise placement for repairs and maintenance
- **Monitoring:** Thermal, air quality, and visual sensors

---

## 12. Robot Safety Architecture

### Robot State Machine

| State | Code | Description |
|-------|------|-------------|
| Unknown | S0 | Power-on or comms lost |
| Homing | S1 | Initializing position |
| Parked | S2 | Idle, safe position |
| Working | S3 | Active maintenance task |
| Fault | S4 | Safety fault triggered |

**E-STOP:** Always returns to S2 (Parked)

### Keep-In Volume

**Definition:** Maximum allowable robot workspace within coop.

- Excludes structural members
- Excludes nest boxes (safety)
- Excludes roosting areas during operation
- Excludes chicken occupancy zones

**Dimensions:** 80% of total coop interior volume

### Keep-Out Volume

**Definition:** Areas robot shall NEVER enter.

**Includes:**
- Structural corner posts and bracing
- Nest box enclosures
- Roosting perches (during use)
- Occupied bedding zones (chicken safety)
- Ventilation ducts
- Electrical enclosures

**Implementation:** Software boundary checking + physical limit switches

---

## 13. WatchTower AI™ Compatibility

Optional predator monitoring and threat detection system.

### Supported Sensors

- **Cameras:** 2MP/5MP color, night vision capable
- **Night Vision:** Passive IR illumination
- **IR Thermal:** Temperature-based motion detection
- **Radar:** Perimeter motion detection (future)
- **Audio:** Distress call detection (future)

### Threat Detection Capability

**Can Detect:**
- Coyotes, foxes, wild dogs (perimeter breaches)
- Raccoons, opossums (climbing attempts)
- Hawks, aerial predators (overhead approach)
- Domestic dogs (neighborhood threats)
- Human intrusion (security)

**Alert Types:**
- Perimeter breach (audible/visual)
- Slow approach (warning phase)
- Active attack (lockdown/alarm)

### Integration

- LoRa mesh networking (500m+ range)
- Battery + solar powered
- Local alerts (sirens, lights)
- Cloud notifications (optional)

---

## 14. Control Electronics

### Base Controller

**MCU:** ESP32-S3  
**Firmware:** Arduino/MicroPython  
**Languages:** C/C++ or Python  
**OTA Updates:** Supported

### Motion Controllers

**Motor Driver:** TB6600 stepper driver (door actuators)  
**Servo Support:** PWM-based door servos  
**Relay Modules:** 12V/5V logic outputs

### Sensors

**Environmental:**
- Temperature/Humidity (DHT22)
- Ammonia level (MQ-137)
- Air quality (optional)

**Physical:**
- Door position (reed switches)
- Load cells (feed/water monitoring)
- Motion sensors (perimeter)

### Communication

| Protocol | Use Case | Range |
|----------|----------|-------|
| WiFi (2.4GHz) | Cloud, local control | 150 ft |
| Bluetooth | Mobile app, direct pairing | 30 ft |
| LoRa (future) | WatchTower mesh | 500+ ft |
| MQTT | TenderCells cloud | Via WiFi gateway |

---

## 15. Power Options

### AC Powered (Primary)

**Standard Mode:**
- 120V household outlet
- 15A circuit (safe for continuous operation)
- Instant operation, no startup delay

**Applications:**
- Permanent installations
- Urban/suburban locations
- Commercial operations

### Solar Powered (Optional)

**Components:**
- 200W+ solar panel array
- MPPT controller (80%+ efficiency)
- LiFePO4 battery bank (4.8kWh minimum)
- Hybrid inverter (48V 5kW)

**Performance:**
- Year-round operation in temperate climate
- 3 days autonomy during cloudy weather
- Smart load shedding during peak consumption

**Applications:**
- Off-grid locations
- Sustainable operations
- Zero energy consumption goal

---

## 16. TenderCells Cloud™ Integration

Optional cloud connectivity via Firebase/MQTT.

### Cloud Functions

| Feature | Benefit |
|---------|---------|
| Alerts | Push notifications for system events |
| Monitoring | Real-time sensor dashboard |
| Device Management | OTA firmware updates, remote control |
| Historical Trends | 90-day sensor data retention |
| Reports | CSV export, weekly summaries |
| Multi-Device | Manage multiple coops from one app |

### Data Privacy

- End-to-end encryption (HTTPS + TLS)
- User data isolation (per-tenant databases)
- Optional local-only operation (no cloud)
- Data retention policies (GDPR compliant)

---

## 17. Manufacturing & Assembly

### Design for Modularity

- Replaceable panel sections
- Standardized fasteners (no proprietary hardware)
- Snap-fit or bolt-together connectors
- Field-serviceable components

### Quality Standards

- **Material Certification:** Pressure-treated lumber verification
- **Hardware:** Stainless steel or hot-dip galvanized (outdoor rated)
- **Assembly:** Torque specifications for structural bolts
- **Testing:** Pressure wash, wind load, load testing

### Service & Warranty

- **Structural:** 5-year warranty
- **Electronics:** 2-year warranty
- **Labor:** Field-serviceable design (customer-replaceable parts)
- **Support:** Online documentation + community forum

---

## 18. Future Expansion

Chicken Tender™ architecture shall support optional integration with:

| Product | Integration | Timeframe |
|---------|-------------|-----------|
| WatchTower AI™ | Predator monitoring | Q3 2026 |
| TenderCells Rail System™ | Robotic cleaning | Q4 2026 |
| Roaming Roost™ | Mobile enclosure | 2027 |
| Duck Dock™ | Aquatic habitat | 2027 |
| Automated Arm | Egg collection, tool use | 2027 |
| Cloud Analytics | AI health monitoring | Q2 2026 |
| Mobile App | Remote control + monitoring | Q2 2026 |

---

## 19. Success Criteria

A successful Chicken Tender™ system shall meet ALL of the following:

### Safety & Animal Welfare

- ✅ Protect chickens from predators (96%+ uptime)
- ✅ Maintain safe environmental conditions (temp 40-85°F)
- ✅ Prevent injury hazards (no sharp edges, safe clearances)
- ✅ Support natural behaviors (roosting, nesting, dust bathing)

### Labor Reduction

- ✅ Reduce daily care time by 50% minimum
- ✅ Automate door operation (motorized entry/exit)
- ✅ Automate feeding/watering (optional automated systems)
- ✅ Simplify sanitation (cassette bins, deep bedding)

### Operational Excellence

- ✅ Improve flock health metrics (lower disease rate)
- ✅ Improve egg production tracking
- ✅ Reduce odor by 70%+ (deep litter system)
- ✅ Enable data-driven decision making (sensors + cloud)

### Product Scalability

- ✅ Available in 3 sizes (S, M, L)
- ✅ 3 feature tiers (BASE, AUTO, PRO)
- ✅ Modular architecture (mix & match features)
- ✅ Field-serviceable (customer-replaceable parts)

### Business Goals

- ✅ MSRP competitive with market ($599-$1,499)
- ✅ COGS target: 45% of retail price
- ✅ Gross margin: 50%+ after manufacturing
- ✅ First production units: Q3 2026

---

## Document Control

| Revision | Date | Author | Change |
|----------|------|--------|--------|
| A | 2026-06-12 | WeCr8 Product Team | Initial master spec |

---

## Related Documents

- [CLAUDE.md](../CLAUDE.md) — Agent system prompts & implementation guide
- [ADR-001: MQTT vs Firebase](./adr/001-mqtt-not-firebase-for-motion.md) — Control plane decisions
- [ADR-002: 3D Model Loading](./adr/002-3d-model-loading.md) — Asset pipeline architecture
- [CAD-TO-WEB.md](./CAD-TO-WEB.md) — SolidWorks export workflow
- [hardware-bom.md](./hardware-bom.md) — Component sourcing & costs
- Excel specs: [Master Product Workbook](./Tender_Cells_Master_Product_Workbook.xlsx)

---

**Document ID:** TC-CHKN-MASTER-001 | **Revision:** A | **Status:** Active Development
