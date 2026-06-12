# Chicken Tender™ Hardware Catalog

**Document ID:** TC-CHKN-HW-001  
**Product Family:** Chicken Tender™  
**Platform:** TenderCells™  
**Revision:** A

---

## 1. Purpose

This document serves as the master hardware catalog for Chicken Tender™ and related TenderCells™ products.

**Catalog Purpose:**
- Standardize hardware selections across all products
- Simplify procurement and supply chain management
- Establish approved components and vendors
- Maintain consistency across product families
- Support future automation upgrades and modularity

---

## 2. Compatible Product Families

### Primary Products

- Chicken Tender™
- Roaming Roost™
- Duck Dock™
- Goat Guardian™
- Bunny Burrow™
- Turkey Tower™
- Pigeon Palace™

### Platform Products

- WatchTower AI™ (predator monitoring)
- TenderCells Rail System™ (robotic automation)
- TenderCells Cloud™ (remote monitoring)

---

## 3. Structural Hardware

### Lumber Specifications

**4×4 Posts**

| Spec | Value |
|------|-------|
| Nominal | 4" × 4" |
| Actual | 3.5" × 3.5" |
| Material | Pressure-treated pine |
| Warranty | 5 years minimum |
| Use | Corner posts, structural supports, rail mounting |

**2×4 Framing**

| Spec | Value |
|------|-------|
| Nominal | 2" × 4" |
| Actual | 1.5" × 3.5" |
| Material | Pressure-treated pine or cedar |
| Use | Framing, roof supports, internal bracing |

**Plywood Sheets**

| Grade | Thickness | Use |
|-------|-----------|-----|
| BC Grade | 3/4" | Floors, bed cassettes, structural panels |
| BC Grade | 1/2" | Interior walls, non-structural surfaces |
| Exterior Grade | 3/4" | Roof sheathing, weather-exposed panels |

---

## 4. Fasteners & Hardware

### Structural Fasteners

| Component | Specification |
|-----------|---------------|
| Structural Screws | GRK RSS™ or equivalent (exterior grade) |
| Timber Screws | 3/16" deck screws, stainless |
| Lag Bolts | 1/2" × 6"+, galvanized |
| Carriage Bolts | 3/8"-1/2", stainless steel |
| Lock Washers | Galvanized or stainless |
| Lock Nuts | Nylon-insert, galvanized |

### General Fasteners

| Component | Specification |
|-----------|---------------|
| Deck Screws | #8 or #10, galvanized |
| Sheet Metal Screws | #10-16, stainless |
| Wood Screws | Various sizes, stainless exterior |
| Hinges | Stainless steel, 3"+ |
| Door Handles | Stainless steel, lockable |

---

## 5. Doors & Access Panels

### Chicken Access Door

**Purpose:** Chicken entry/exit to outdoor run or coop

**Automation Options:**
- Servo-driven (9-12kg torque)
- Linear actuator (100-150N)
- Lead screw mechanism (manual or motorized)

**Weather Protection:**
- Gaskets on frame (weatherstrip)
- Overlap design (no direct gaps)
- Drain holes to prevent water pooling

### Human Service Doors

**Purpose:** Maintenance access to interior

**Requirements:**
- Lockable from outside
- Weather-resistant seal
- Minimum 24" × 24" opening
- Hinges rated for coop size (60-100+ lbs)

### Nest Box Access

**Purpose:** Egg retrieval without entering coop

**Features:**
- Hinged or sliding exterior access
- Weather seal gasket
- Ventilation slots (prevent moisture trap)
- Removable interior tray

### Poop Bin Access Door

**Purpose:** Waste removal from cassette system

**Features:**
- Slide-out service area
- Positive latch (prevents accidental opening)
- Seal gasket around frame
- Handles on front and sides

---

## 6. Poop Bin System (Cassette Drawer)

### Recommended Materials

| Material | Pros | Cons | Cost |
|----------|------|------|------|
| HDPE (High-Density PE) | Lightweight, washable, durable | Less rigid | $$ |
| Polypropylene | Food-grade, chemical resistant | Yellows over time | $$ |
| Stainless Steel | Highly durable, food-safe | Heavy, expensive | $$$$ |
| Coated Plywood | Easy DIY, light | Water damage risk | $ |

**Recommended:** HDPE or Polypropylene for balance of durability and cost

### Dimensions

| Specification | Value |
|---------------|-------|
| External Height | 8" |
| Interior Depth | Full coop depth |
| Recommended Travel | 24" (pull-out distance) |
| Minimum Depth | 18" |

### Drawer Slides

| Spec | Minimum | Recommended |
|------|---------|-------------|
| Load Rating | 100 lb | 200 lb |
| Material | Steel | Ball-bearing steel |
| Type | Full-extension | Smooth glide |
| Mounting | Bolted | Heavy-duty bolts |

**Approved Brands:** Blum, Grass, Accuride, VEVOR

### Bin Sensors

- **Bin Seated Switch:** Limit switch at home position (closed)
- **Bin Removed Switch:** Safety interlock (prevent arm operation if bin extracted)
- **Fill Level Sensor:** Optional ultrasonic or float sensor for automated alerts

---

## 7. Deep Bedding System

### Supported Bedding Depth

| Depth | Use | Notes |
|-------|-----|-------|
| Minimum: 6" | Basic absorption | Risk of odor breakthrough |
| Recommended: 8-10" | Optimal composting | Sweet spot for most coops |
| Maximum: 12" | Deep litter composting | Requires excellent ventilation |

### Approved Bedding Materials

| Material | Carbon Ratio | Odor Control | Cost |
|----------|-------------|--------------|------|
| Pine Shavings | 500:1 | Excellent | Low |
| Hemp Bedding | 400:1 | Very Good | Medium |
| Straw | 300:1 | Good | Low |
| Aspen Shavings | 600:1 | Good | Medium |

**NOT Approved:** Dust-producing materials, cedar (toxic to chickens), treated wood

### Bedding Sensors

| Sensor | Purpose | Typical | Notes |
|--------|---------|---------|-------|
| Moisture | Detect wet bedding | DHT22 + analog | Capacitive soil probe alternative |
| Temperature | Monitor composting heat | BME280 | Peak 140-160°F during active decomposition |
| Ammonia (NH₃) | Odor & health monitor | MQ-137 | Alert threshold: 10 ppm (warning), 25 ppm (critical) |

---

## 8. Roost System

### Fixed Roosts

**Specifications:**

| Parameter | Value |
|-----------|-------|
| Perch Diameter | 2" (nominal) |
| Material | Seasoned wood or composite |
| Clearance from Wall | 12" minimum |
| Height from Floor | 18-30" (2 ft minimum) |
| Spacing between Roosts | 4-6" horizontal |
| Load Capacity | 30 lbs per foot of perch |

**Material Options:**
- Seasoned hardwood (ash, oak)
- 2" diameter plastic composite perch
- Rough-cut branches (natural, minimal processing)

### Deployable Roosts

**States:**
- **Stowed:** Folded up, maximizes floor space (reduces to 2-3" height)
- **Deploying:** Motor transition (5-15 seconds)
- **Deployed:** Full height roosting (18-30" above floor)
- **Retracting:** Auto-retract at dawn (optional automation)

**Actuation Options:**

| Option | Cost | Speed | Reliability |
|--------|------|-------|------------|
| Servo (9kg torque) | $ | 0.5-1 sec | Medium |
| Linear Actuator (150N) | $$ | 5-10 sec | High |
| Gas Spring Assist | $ | 1-2 sec | Very High |

### Roost Sensors

- **Stowed Switch:** Reed switch or limit switch (confirms stowed position)
- **Deployed Switch:** Confirms fully deployed
- **Load Cell (optional):** Detect chicken presence

---

## 9. Nest Box System

### Components

| Component | Specification | Material |
|-----------|---------------|----------|
| Nest Tray | 12" × 12" × 12" interior | Wooden box or plastic |
| Egg Tray | 12" × 12" slide-out | Coated plywood or plastic |
| Roll-Away Insert | Optional (prevents broodiness) | Sloped plastic floor |
| Access Hatch | Hinged or sliding | Stainless hinges |
| Perches | 2" diameter | Wood or composite |
| Ventilation | Slots or grates | 1/4" mesh (predator-proof) |

### Configuration

| Coop Size | Min Boxes | Recommended | Spacing |
|-----------|-----------|------------|---------|
| Small (S) | 2 | 3 | 12" apart |
| Medium (M) | 4 | 6 | 12" apart |
| Large (L) | 6 | 9 | 12" apart |

**Rule:** 1 box per 2-3 hens (more is better, prevents competition)

### Nest Box Sensors

- **Egg Presence Sensor:** IR proximity (optical egg detection)
- **Occupancy Sensor:** PIR motion (detects broody hens)
- **Temperature:** Optional, for health monitoring

---

## 10. Feed System

### Feed Hopper Options

**Gravity-Fed**
- Simplest design
- No moving parts
- Capacity: 20-50 lbs

**Auger-Fed**
- Automated portion control
- Motor: 24V DC (slow-speed)
- Gear reduction: 30:1 minimum

### Feed Sensors

| Sensor | Purpose | Technology |
|--------|---------|------------|
| Level Sensor | Detect empty condition | Capacitive ultrasonic |
| Weight Sensor | Portion measurement | Load cell 50+ lbs range |
| Flow Meter | Consumption tracking | Optical or gravity |

### Actuators

- **Servo Gate:** 6-9kg torque, 90° rotation (opens/closes)
- **Auger Motor:** 24V DC, gear-reduced
- **Vibrator:** Settle material in gravity hopper

---

## 11. Water System

### Components

| Component | Specification | Material |
|-----------|---------------|----------|
| Reservoir | 5-20 gallon capacity | Food-grade plastic |
| Float Valve | Ball valve, auto-refill | Stainless or brass |
| Nipple Drinkers | 4-6 per coop | Stainless or plastic |
| Drip Tray | Beneath drinkers | Plastic (1-2 gallon) |
| Filter | Sediment 50-100 micron | Mesh or cartridge |
| Insulation (winter) | Heating element | 1000W immersion heater |

### Water Sensors

| Sensor | Purpose | Type | Alert Level |
|--------|---------|------|------------|
| Level Sensor | Detect empty | Ultrasonic/float | <20% full |
| Flow Meter | Consumption tracking | Turbine or gear | Real-time data |
| Leak Sensor | Detect drips/bursts | Capacitive floor mat | Immediate alert |
| Temperature | Winter freeze protection | DS18B20 or BME280 | <32°F |

### Water Quality

- Monthly filter changes (sediment)
- Weekly cleaning of drinker lines
- Drain & refill reservoir weekly

---

## 12. Environmental Monitoring Sensors

### Temperature & Humidity

| Sensor | Range | Accuracy | Cost | Notes |
|--------|-------|----------|------|-------|
| DHT22 | -40 to 80°C | ±0.5°C | $ | Most common, 1-2 sec |
| BME280 | -40 to 85°C | ±0.5°C, ±3%RH | $ | Includes pressure |
| SHT31 | -40 to 125°C | ±0.2°C, ±2%RH | $$ | High precision |
| AM2302 | -40 to 80°C | ±0.5°C | $ | Wired version of DHT22 |

**Recommended:** DHT22 (cost-effective, adequate for poultry)

### Ammonia (NH₃) Monitoring

| Sensor | Range | Output | Cost | Notes |
|--------|-------|--------|------|-------|
| MQ-137 | 5-100 ppm | Analog (0-5V) | $ | Most available, slow response |
| DGS-NDIR | 0-400 ppm | UART/analog | $$$ | Accurate, fast (NDIR) |
| Alphasense OXD-F10 | 0-50 ppm | 0-5V | $$ | Industrial grade |

**Thresholds:**
- <5 ppm: Good ventilation
- 5-10 ppm: Monitor closely
- 10-25 ppm: Warning (increase bedding depth or ventilation)
- >25 ppm: Critical (immediate action required)

### Air Quality (CO₂, VOC)

| Sensor | Measures | Range | Cost |
|--------|----------|-------|------|
| MH-Z19C | CO₂ | 0-5000 ppm | $$ |
| SGP30 | VOC + eCO₂ | 0-60000 ppm | $$ |
| CCS811 | eCO₂ + tVOC | 400-8192 ppm | $ |

**Recommended for PRO tier:** SGP30 (indoor air quality)

### Light Level

| Sensor | Range | Output | Cost |
|--------|-------|--------|------|
| BH1750 | 1-65535 lux | I2C digital | $ |
| LDR (GL5549) | 5-50000 lux | Analog (0-5V) | $ |
| TSL2561 | 0-40000 lux | I2C digital | $ |

**Use:** Trigger automated lighting, monitor daylight consistency

---

## 13. TenderCells Rail System™ (Motion Platform)

### Platform Architecture

**Supported Systems:**
- Cartesian gantry (3-axis: X, Y, Z)
- Tool changer (quick-disconnect end effector)
- Inspection carriage (telemetry payload)

### Linear Rails

**MGN12 (Compact)**
- Load: 5-10 kg
- Use: Small coops, prototype
- Length: 100-300mm standard

**MGN15 (Standard)**
- Load: 15-20 kg
- Use: Medium & large coops
- Length: 200-600mm standard

**MGN20 (Heavy-Duty)**
- Load: 30-40 kg
- Use: Large systems + robot arm integration
- Length: 300-800mm standard

### Drive Systems

**Belt-Driven (GT2 / HTD)**
- Quiet operation
- Good for light loads
- Maintenance: Belt tension every 6 months

**Lead Screw (T8 / Ball Screw)**
- Higher torque capacity
- Slower speed (~10 mm/s)
- More precise positioning

**Rack & Pinion (Large Systems)**
- Long travel distances
- Higher speeds
- Used for full-coop spanning gantries

---

## 14. Motion Electronics & Controllers

### Main Controller

**Current Standard:** ESP32-S3
- 32-bit processor @ 240 MHz
- 512 KB RAM, 16 MB Flash
- WiFi + Bluetooth
- 38 GPIO pins
- ADC, PWM, I2C, SPI, UART
- OTA firmware updates supported

**Future Option:** Industrial PLC or NVIDIA Jetson (for AI inference)

### Motor Drivers

**Current Standard:** TB6600 Stepper Driver
- 2-5A current (adjustable)
- Microstepping: 1-32
- Support: NEMA 17, NEMA 23 steppers
- Cost: $20-40 per unit

**Future Options:**
- DM542 (closed-loop, higher current)
- TMC2209 (silent, precision)

### Safety Hardware

| Component | Function | Type |
|-----------|----------|------|
| E-STOP Button | Emergency motion cut | Normally-open pushbutton |
| Limit Switches | End-of-travel safety | Reed or mechanical |
| Homing Switches | Position reference | Mechanical or optical |
| Relay Module | 12V/5V logic control | Electromagnetic or solid-state |
| DC Breaker | Power supply protection | 30A minimum |

---

## 15. Tool Changer System

Supports **quick-disconnect end effectors** for multi-function operation.

### Inspection Tools

- **Camera:** 1080p USB or CSI (for Pi)
- **Thermal Camera:** Seek or equivalent (predator heat signature)
- **Lighting:** 5050 LED strips (1000+ lumens, dimmable)

### Cleaning Tools

- **Scraper:** Stainless blade (3" width) on spring mount
- **Brush:** Soft-bristle rotating brush (dust removal)
- **Vacuum Nozzle:** Wet/dry vacuum adapter

### Feed & Water Tools

- **Feed Scoop:** Fixed 1-2 cup measure
- **Feed Dispenser:** Peristaltic pump or gravity gate
- **Water Flush Nozzle:** Pressure-washer safe

---

## 16. WatchTower AI™ Hardware

### Day Cameras

| Model | Resolution | FOV | Cost | Mounting |
|-------|-----------|-----|------|----------|
| Reolink RLC-610 | 5MP | 80° | $$$ | Bullet, IP67 |
| Hikvision DS-2CD | 4MP | 78° | $$ | Dome, IP67 |
| USB 1080p | 1080p | 90° | $ | Flexible, IP54 |

### Night Cameras (IR/Starlight)

- Reolink RLC-811A (5MP IR, 30m range)
- Hikvision darkfighter (4MP, ultra-low light)
- Pi NoIR v2.1 + IR illuminator (basic, DIY)

### AI Inference Cameras

| Module | Specs | Cost | Use |
|--------|-------|------|-----|
| XIAO ESP32S3 Sense | 2MP camera, XIAO form | $$ | Coop behavior AI |
| ESP32-CAM | 2MP OV2640, WiFi | $ | Streaming + detection |
| Raspberry Pi Zero 2W + Camera | 8MP Pi camera | $$ | Full Linux, OpenCV |

### WatchTower Sensors

**Motion Detection:**
- PIR (Passive InfraRed): Low power, detects heat
- Radar: Through-wall detection, weather-proof

**Weather Monitoring:**
- Rain sensor (conductivity or bucket-tilt)
- Wind sensor (anemometer)
- Light sensor (BH1750)

---

## 17. Predator Deterrents

### Lighting

| Type | Power | Coverage | Cost | Notes |
|------|-------|----------|------|-------|
| LED Spotlight | 10W | 30-50 ft | $ | Motion-activated |
| Flood Light | 30W | 60+ ft | $$ | Fixed or motion |
| Strobe Light | 50W | Wide | $$ | Disorienting, high deterrent |
| IR Illuminator | 5W | 30+ ft | $$ | Invisible to humans |

### Audio Deterrents

- **Siren:** 110-120 dB, battery + solar powered
- **Speaker:** Play predator vocalizations (coyote howls, eagle screams)
- **Audible Alarm:** Activation on motion sensor trigger

### Future Active Deterrents

- AI spotlight tracking (auto-follow predators)
- Adaptive audio (rotate different predator calls)
- Harmonic deterrent (ultrasonic frequencies)

---

## 18. Solar Power System

### Solar Panel Options

| Size | Wattage | Dimensions | Daily Output* | Cost |
|------|---------|-----------|----------------|------|
| Small | 50W | 30×22" | 150-200Wh | $ |
| Medium | 100W | 47×21" | 300-400Wh | $$ |
| Large | 200W | 78×39" | 600-800Wh | $$$ |

*Daily output varies by season (40% winter, 150% summer peak)

### Charge Controllers

**Small Systems (50W solar + 200Ah):**
- CN3065 (PWM, simple, <$50)
- Victron 75/15 (MPPT, 15A max, ~$100)

**Medium Systems (100W + 400Ah):**
- Victron 75/15 or 100/15
- Epever MPPT 60A

**Large Systems (200W+ + 600Ah+):**
- Victron 100/30 or 100/50
- Epever TraceS 60A/80A

**Recommended:** Victron (reliability, lifespan, monitoring)

### Battery Systems

**Small (18650 packs):**
- 24-48 Wh capacity
- DIY assembly required
- Cost: $50-100

**Preferred (LiFePO4):**

| Voltage | Capacity | Weight | Cost | Applications |
|---------|----------|--------|------|--------------|
| 12V | 100 Ah | 30 lbs | $$ | Single coop |
| 12V | 200 Ah | 60 lbs | $$$ | Multiple devices |
| 24V | 100 Ah | 60 lbs | $$$ | Commercial, multi-coop |

**Brands:** Battle Born, Relion, Victron

**Lifespan:** 3,000-5,000 cycles (10-15 years typical use)

---

## 19. Networking & Communication

### Local (Coop-to-App)

| Technology | Range | Bandwidth | Power | Use |
|------------|-------|-----------|-------|-----|
| WiFi 2.4GHz | 150 ft (indoor) | 11-54 Mbps | Medium | Primary local control |
| Bluetooth | 30 ft | 1 Mbps | Low | Secondary, backup link |

### Long-Range (Multiple Coops/Property)

| Technology | Range | Power | Bandwidth | Cost |
|------------|-------|-------|-----------|------|
| LoRa (915 MHz) | 500+ ft (outdoor) | Very Low | 50 kbps | $$ (per node) |
| LTE (cellular) | Unlimited (with plan) | Medium | 10+ Mbps | $$$ (monthly) |
| Starlink | Global | High | 50+ Mbps | $$$ (equipment + plan) |

**Recommended:** WiFi (primary) + LoRa mesh for WatchTower AI network

### Future Protocols

- Matter (smart home interoperability)
- Thread (mesh networking, low power)
- 5G (ultra-low latency)

---

## 20. Control Box Hardware

### Enclosure Selection

**NEMA 3R** (most common)
- Outdoor rated
- Weather-sealed
- Cost: $50-200
- Brands: Rittal, Hoffman, Stainless Enclosures

**NEMA 4X** (stainless, premium)
- Corrosion-resistant
- Food-industry approved
- Cost: $300-1000
- Brands: Rittal, Phoenix Contact

### Control Box Components

| Component | Purpose | Quantity | Notes |
|-----------|---------|----------|-------|
| DIN Rail | Component mounting | 1-2 | 35mm standard |
| Terminal Blocks | Wire connections | 3-6 | Screw or push-wire type |
| Fuse Holders | Circuit protection | 2-4 | 10-20A typical |
| Relays | 12V logic switching | 2-4 | DPDT or 4PDT coil |
| DC Breaker | Power protection | 1 | 30A minimum |
| ESP32 Mount | MCU enclosure | 1 | DIN module or custom |

---

## 21. Future Expansion Modules

### Robotics

- **Robotic Arm:** UR5/UR10 (collaborative), or custom 6DOF
- **Tool Changer:** Quick-disconnect pneumatic or mechanical
- **Autonomous Charging:** Cradle + pogo pin contacts

### Animal Monitoring

- **RFID Tags:** Micro-chip tracking per chicken
- **Flock Counting:** Computer vision for headcount
- **Thermal Health Scanning:** Identify sick birds (heat signature)

### Facility Monitoring

- **Weather Station:** Anemometer, rain gauge, barometer
- **Soil Moisture:** Subsurface sensors (predator burrow detection)
- **Compost Monitoring:** Temperature + decomposition rate

---

## 22. Approved Vendor Categories

### Electronics

- **Seeed Studio:** Open-source hardware, competitive pricing
- **Adafruit:** Tutorials + quality components
- **SparkFun:** Wide selection, US-based support
- **LCSC:** Bulk electronics, lowest cost (China-based)
- **Amazon:** Convenience, 2-day delivery (US)

### Motion Hardware

- **Hiwin:** Premium linear rails (Taiwan)
- **OpenBuilds:** Community-friendly, affordable frames
- **VEVOR:** Budget-friendly drawer slides & hardware
- **eBay:** Used industrial components (sourcing deals)

### Solar & Power

- **Victron Energy:** Premium reliability, monitoring
- **Renogy:** Mid-range, good customer support
- **BattleBorn:** LiFePO4 batteries, US-based
- **Amazon:** Quick sourcing, competitive pricing

### Cameras & Vision

- **Reolink:** Outdoor IP cameras, good value
- **Hikvision:** Professional-grade, wide selection
- **Raspberry Pi:** Community support, DIY-friendly
- **USB Cameras:** Lowest cost, easy integration

---

## 23. Hardware Selection Philosophy

**Priority Order (in descending importance):**

1. **Proven Reliability** — Use battle-tested components (avoid bleeding-edge)
2. **Ease of Replacement** — Select standard, widely-available parts
3. **Open Ecosystem** — Prefer components with community support
4. **Standardized Mounting** — DIN rail, M3/M5 threads, common connectors
5. **Cost Effectiveness** — Balance price and quality

### Design Principles

- **Modularity First:** Every subsystem (feed, water, motion) independently replaceable
- **Serviceability:** Customer can replace batteries, motors, controllers without tools
- **Future-Proofing:** Architecture supports automation upgrades (rail system, robot arm)
- **Standardization:** Consistent fasteners, sensors, connectors across all products

---

## Related Documents

- [CHICKEN_TENDER_MASTER_SPEC.md](./CHICKEN_TENDER_MASTER_SPEC.md) — Product requirements
- [hardware-bom.md](./hardware-bom.md) — Bill of materials by coop size
- [ADR-001](./adr/001-mqtt-not-firebase-for-motion.md) — Control plane architecture
- Excel: [Tender_Cells_Master_Product_Workbook.xlsx](./Tender_Cells_Master_Product_Workbook.xlsx)
- Excel: [TenderCells_Predator_Monitor_Hardware_List.xlsx](./TenderCells_Predator_Monitor_Hardware_List.xlsx)

---

**Document ID:** TC-CHKN-HW-001 | **Revision:** A | **Last Updated:** 2026-06-12
