# Tender Cells – Chicken Tender Fusion Design Agent Brief
## For Claude, MCP, and Autodesk Fusion Rapid Modeling

**Document ID:** `TC-CHKN-FUSION-AGENT-001`  
**Product:** Chicken Tender™  
**Platform:** Tender Cells™  
**Primary CAD Tool:** Autodesk Fusion  
**Purpose:** Give Claude/MCP/CAD agents a deterministic instruction set to rapidly build a parametric Chicken Tender coop, pen, rail-ready frame, bedding system, poop bin, deployable roost system, and future robot/WatchTower AI interfaces.

---

## 0. Web Research Notes Used for This Agent Brief

Use these Autodesk Fusion capabilities where available:

1. **User Parameters** should drive length, width, height, material thickness, clearances, rail locations, and module offsets.
2. **Configurations** can control user parameters, feature parameters, and suppression states for multiple product sizes and options.
3. **Derived components/configurations** help manage complex design variants and shared geometry.
4. **Fusion API / Python automation** can create sketches, extrudes, construction geometry, components, and parametric features through Fusion’s object model.

Sources referenced:
- Autodesk Fusion API basic concepts: https://help.autodesk.com/cloudhelp/ENU/Fusion-360-API/files/BasicConcepts_UM.htm
- Autodesk Fusion configurations overview: https://www.autodesk.com/products/fusion-360/blog/configurations-autodesk-fusion-overview/
- Autodesk Fusion parameters guide: https://www.autodesk.com/products/fusion-360/blog/mastering-fusion-parameters-a-guide-for-simplified-design-control/
- Autodesk configure user parameters tutorial: https://www.autodesk.com/learn/ondemand/tutorial/configure-user-parameters
- Autodesk derive from configurations article: https://www.autodesk.com/products/fusion-360/blog/how-to-derive-from-configurations-in-autodesk-fusion/

---

# 1. Agent Mission

Claude/MCP shall help create a parametric Autodesk Fusion master model for the **Chicken Tender™** product line.

The model must support these preset customer-facing coop sizes:

| Size Class | Name | Width | Depth | Height |
|---|---|---:|---:|---:|
| S | Small Coop | 36 in | 36 in | 60 in |
| M | Medium Coop | 48 in | 48 in | 72 in |
| L | Large Coop | 72 in | 72 in | 96 in |

The model shall also support future modular systems:

- TenderCells Rail System™
- WatchTower AI™ predator monitor
- Poop bin cassette
- Deep bedding tray
- Deployable roost poles
- Nest box module
- Feed/water modules
- Solar/control box modules
- Future robot arm interface

The CAD model must be modular enough that changing global parameters updates the entire assembly without remaking geometry.

---

# 2. Hard Design Rules

## 2.1 Master Layout Rule

All important geometry shall be driven from one master component:

```text
MASTER_LAYOUT
```

No module shall independently define critical system planes or major dimensions.

Every major part must reference:

- Fusion user parameters
- Named construction planes
- Named skeleton sketches
- Named envelope bodies

## 2.2 Actual Lumber Rule

Use actual lumber sizes, not nominal sizes.

| Nominal Lumber | Actual Size |
|---|---|
| 4x4 | 3.5 in x 3.5 in |
| 2x4 | 1.5 in x 3.5 in |
| 2x6 | 1.5 in x 5.5 in |
| 1x4 | 0.75 in x 3.5 in |
| 3/4 plywood | 0.75 in |
| 1/2 plywood | 0.50 in |

## 2.3 Robot Safety Rule

Robot/rail geometry must never be treated as normal interior geometry.

Use explicit envelopes:

```text
ROBOT_KEEPIN
ROBOT_KEEPOUT_WORKING
ROBOT_KEEPOUT_PARKED
BED_KEEPOUT
POOP_BIN_SWEEP
ROOST_SWEEP
```

## 2.4 Conditional Violation Rule

Roost poles, bed doors, or poop bin drawers may violate robot space only when:

```text
robot_state == PARKED
robot_homed == TRUE
robot_motion_enabled == FALSE
roost_or_bin_fault == FALSE
```

In Fusion, represent this with separate configurations or visibility/suppression states.

---

# 3. Fusion Project Folder Structure

Create this structure in Fusion/Data Panel and local exported archive if applicable:

```text
TenderCells/
  00_Master/
    TC_MASTER_LAYOUT.f3d
    TC_GLOBAL_PARAMETERS.md
    TC_FUSION_AGENT_BRIEF.md

  01_Chicken_Tender/
    TC_CHKN_MASTER_ASM.f3d
    TC_CHKN_FRAME.f3d
    TC_CHKN_ROOF.f3d
    TC_CHKN_WALLS.f3d
    TC_CHKN_DOORS.f3d

  02_Modules/
    TC_MOD_POOP_BIN.f3d
    TC_MOD_DEEP_BED.f3d
    TC_MOD_ROOST_SYSTEM.f3d
    TC_MOD_NEST_BOX.f3d
    TC_MOD_FEED_SYSTEM.f3d
    TC_MOD_WATER_SYSTEM.f3d

  03_Automation/
    TC_RAIL_SYSTEM.f3d
    TC_ROBOT_MOUNT_INTERFACE.f3d
    TC_TOOL_INTERFACE.f3d

  04_Electronics/
    TC_CONTROL_BOX.f3d
    TC_SOLAR_KIT.f3d
    TC_WATCHTOWER_AI.f3d

  05_Envelopes/
    TC_ENV_ROBOT_KEEPIN.f3d
    TC_ENV_BED_KEEPOUT.f3d
    TC_ENV_POOP_BIN_SWEEP.f3d
    TC_ENV_ROOST_SWEEP.f3d

  99_Exports/
    STEP/
    GLB_GLTF/
    DRAWINGS/
    DXF_CUT_FILES/
```

---

# 4. Fusion Naming Rules

## 4.1 Components

```text
TC_[FAMILY]_[SUBSYSTEM]_[DESCRIPTION]
```

Examples:

```text
TC_CHKN_FRAME_CORNER_POST_FL
TC_CHKN_FRAME_BOTTOM_RING_FRONT
TC_MOD_POOP_BIN_TRAY
TC_MOD_ROOST_POLE_01
TC_RAIL_X_LEFT
TC_WATCH_CAMERA_RING
```

## 4.2 Sketches

```text
SK_[FUNCTION]_[PLANE/LOCATION]
```

Examples:

```text
SK_PLATFORM_FOOTPRINT
SK_SAFE_FOOTPRINT
SK_ROBOT_KEEPIN
SK_POOP_BIN_FOOTPRINT
SK_ROOST_HINGE_AXIS
```

## 4.3 Construction Planes

```text
PLANE_[SYSTEM]_[DATUM]
```

Examples:

```text
PLANE_FLOOR
PLANE_BED_TOP
PLANE_ROBOT_Z0
PLANE_ROBOT_PARK
PLANE_ROOF_BASE
```

## 4.4 Bodies

```text
BODY_[FUNCTION]_[DESCRIPTION]
```

Examples:

```text
BODY_ROBOT_KEEPIN
BODY_BED_KEEPOUT
BODY_POOP_BIN_STOWED
BODY_ROOST_SWEEP
```

---

# 5. Global User Parameters

Create these in Fusion: `Modify > Change Parameters`

## 5.1 Size Preset Parameters

```text
SIZE_PRESET = 2
```

Where:

```text
1 = Small 3x3x5
2 = Medium 4x4x6
3 = Large 6x6x8
```

## 5.2 Active Platform Dimensions

Start with Medium:

```text
PLATFORM_X = 48 in
PLATFORM_Y = 48 in
PLATFORM_Z = 72 in
```

Size presets:

```text
SMALL_X = 36 in
SMALL_Y = 36 in
SMALL_Z = 60 in

MEDIUM_X = 48 in
MEDIUM_Y = 48 in
MEDIUM_Z = 72 in

LARGE_X = 72 in
LARGE_Y = 72 in
LARGE_Z = 96 in
```

## 5.3 Lumber Parameters

```text
POST_4X4 = 3.5 in
STUD_2X4_THICK = 1.5 in
STUD_2X4_WIDE = 3.5 in
STUD_2X6_THICK = 1.5 in
STUD_2X6_WIDE = 5.5 in
PLY_3_4 = 0.75 in
PLY_1_2 = 0.50 in
```

## 5.4 Construction Clearances

```text
WOOD_WARP_ALLOW = 0.25 in
FASTENER_HEAD_ALLOW = 0.25 in
FRAME_INNER_CLEAR = 1.0 in
FRAME_WALL_CLEARANCE = 1.5 in
MODULE_CLEARANCE = 0.25 in
SERVICE_CLEARANCE = 2.0 in
CEILING_CLEARANCE = 2.0 in
```

## 5.5 Safe Interior Parameters

```text
SAFE_X = PLATFORM_X - 2 * FRAME_WALL_CLEARANCE
SAFE_Y = PLATFORM_Y - 2 * FRAME_WALL_CLEARANCE
SAFE_Z = PLATFORM_Z - CEILING_CLEARANCE
```

## 5.6 Bedding Parameters

```text
BED_DEPTH_MIN = 6 in
BED_DEPTH_MAX = 12 in
BED_START_DEPTH = 6 in
BED_SAFETY_BUFFER = 6 in
BED_KEEPOUT_Z = BED_DEPTH_MAX + BED_SAFETY_BUFFER
BED_DRAWER_HEIGHT = 8 in
```

## 5.7 Poop Bin Parameters

```text
POOP_BIN_HEIGHT = 8 in
POOP_BIN_WALL = 0.5 in
POOP_BIN_CLEARANCE = 0.25 in
POOP_BIN_MAX_FILL = 6 in
POOP_BIN_PULL_OUT = 24 in
POOP_BIN_FRONT_DOOR_CLEAR = 2 in
POOP_BIN_X = PLATFORM_X - 12 in
POOP_BIN_Y = 18 in
```

## 5.8 Roost Parameters

```text
ROOST_DIAMETER = 2 in
ROOST_WALL_OFFSET = 3 in
ROOST_HEIGHT_LOW = 24 in
ROOST_HEIGHT_MID = 36 in
ROOST_HEIGHT_HIGH = 48 in
ROOST_SWEEP_BUFFER = 2 in
ROOST_CLEARANCE_ABOVE = 10 in
ROOST_CLEARANCE_SIDE = 6 in
```

## 5.9 Robot/Rail Parameters

```text
ROBOT_ZONE_X = SAFE_X
ROBOT_ZONE_Y = SAFE_Y
ROBOT_ZONE_Z = min(48 in, PLATFORM_Z - BED_DEPTH_MAX - CEILING_CLEARANCE)
ROBOT_Z0_OFFSET = 2 in
ROBOT_PARK_HEIGHT = PLATFORM_Z - 12 in
ROBOT_SAFE_BUFFER = 2 in
```

Recommended practical robot envelope by size:

| Size | Robot X | Robot Y | Robot Z |
|---|---:|---:|---:|
| Small | 24 in | 24 in | 24 in |
| Medium | 36 in | 36 in | 36 in |
| Large | 48 in | 48 in | 48 in |

## 5.10 Rail Parameters

```text
RAIL_OFFSET_FROM_WALL = 3 in
RAIL_X_LENGTH = SAFE_X
RAIL_Y_LENGTH = SAFE_Y
RAIL_Z_TRAVEL = ROBOT_ZONE_Z
RAIL_PROFILE_WIDTH = 1.5 in
RAIL_PROFILE_HEIGHT = 1.5 in
```

## 5.11 Door Parameters

```text
SERVICE_DOOR_WIDTH = 24 in
SERVICE_DOOR_HEIGHT = 48 in
CHICKEN_DOOR_WIDTH = 10 in
CHICKEN_DOOR_HEIGHT = 14 in
NEST_ACCESS_WIDTH = 18 in
NEST_ACCESS_HEIGHT = 14 in
POOP_BIN_ACCESS_HEIGHT = POOP_BIN_HEIGHT + 2 in
```

## 5.12 Roof Parameters

```text
ROOF_PITCH_RISE = 6 in
ROOF_OVERHANG_FRONT = 4 in
ROOF_OVERHANG_BACK = 4 in
ROOF_OVERHANG_SIDE = 4 in
RAFTER_SIZE_THICK = STUD_2X4_THICK
RAFTER_SIZE_WIDE = STUD_2X4_WIDE
```

## 5.13 Control Box / WatchTower Parameters

```text
CONTROL_BOX_WIDTH = 12 in
CONTROL_BOX_HEIGHT = 16 in
CONTROL_BOX_DEPTH = 6 in

WATCHTOWER_DIAMETER = 8 in
WATCHTOWER_HEIGHT = 5 in
WATCHTOWER_MOUNT_POLE_DIA = 1.5 in
```

---

# 6. Fusion Component Tree

Build the top-level assembly as:

```text
TC_CHICKEN_TENDER_MASTER
  MASTER_LAYOUT
  FRAME
    FRAME_POSTS
    FRAME_BOTTOM_RING
    FRAME_MID_RING
    FRAME_TOP_RING
    FRAME_ROOF_TRUSSES
  WALLS
    WALL_FRONT
    WALL_BACK
    WALL_LEFT
    WALL_RIGHT
  ROOF
    RAFTERS
    ROOF_PANELS
    RIDGE_CAP
  DOORS
    SERVICE_DOOR
    CHICKEN_POP_DOOR
    NEST_ACCESS_DOOR
    POOP_BIN_ACCESS_DOOR
  BED_SYSTEM
    DEEP_BED_TRAY
    BED_SUPPORT_LEDGERS
  POOP_BIN_MODULE
    POOP_BIN_TRAY
    POOP_BIN_SLIDES
    POOP_BIN_HANDLE
    POOP_BIN_LOCK
  ROOST_SYSTEM
    ROOST_BACKPLATE
    ROOST_POLES
    ROOST_ACTUATORS
  NEST_BOX
  FEED_SYSTEM
  WATER_SYSTEM
  RAIL_SYSTEM
  ROBOT_INTERFACE
  WATCHTOWER_AI_INTERFACE
  CONTROL_BOX
  SOLAR_INTERFACE
  ENVELOPES
    ROBOT_KEEPIN
    BED_KEEPOUT
    POOP_BIN_SWEEP
    ROOST_SWEEP
```

---

# 7. Step-by-Step Fusion Build Plan

## Step 1 – Create Master Design

1. Open Fusion.
2. Create a new design.
3. Save as `TC_CHICKEN_TENDER_MASTER`.
4. Set units to inches.
5. Create all user parameters.
6. Create component `MASTER_LAYOUT`.
7. Activate `MASTER_LAYOUT`.

## Step 2 – Create Master Planes

Inside `MASTER_LAYOUT`, create construction planes:

```text
PLANE_FLOOR                 = origin XY plane
PLANE_BED_TOP               = floor + BED_DEPTH_MAX
PLANE_ROBOT_Z0              = bed top + ROBOT_Z0_OFFSET
PLANE_ROBOT_TOP             = robot z0 + ROBOT_ZONE_Z
PLANE_ROBOT_PARK            = floor + ROBOT_PARK_HEIGHT
PLANE_ROOF_BASE             = floor + PLATFORM_Z
PLANE_POOP_BIN_BOTTOM       = floor + 0
PLANE_POOP_BIN_TOP          = floor + POOP_BIN_HEIGHT
```

## Step 3 – Create Master Skeleton Sketches

Create these sketches:

```text
SK_PLATFORM_FOOTPRINT       = PLATFORM_X x PLATFORM_Y
SK_SAFE_FOOTPRINT           = SAFE_X x SAFE_Y
SK_POST_LOCATIONS           = four POST_4X4 corner post rectangles
SK_ROBOT_ZONE               = ROBOT_ZONE_X x ROBOT_ZONE_Y
SK_BED_ZONE                 = bedding rectangle
SK_POOP_BIN_FOOTPRINT       = POOP_BIN_X x POOP_BIN_Y
SK_ROOST_LAYOUT             = roost centerlines at roost heights
```

## Step 4 – Create Reference Envelope Bodies

Create transparent/reference envelope bodies:

```text
BODY_PLATFORM_ENVELOPE      = SK_PLATFORM_FOOTPRINT extruded PLATFORM_Z
BODY_SAFE_INTERIOR          = SK_SAFE_FOOTPRINT extruded SAFE_Z
BODY_ROBOT_KEEPIN           = SK_ROBOT_ZONE extruded ROBOT_ZONE_Z
BODY_BED_KEEPOUT            = SK_BED_ZONE extruded BED_KEEPOUT_Z
BODY_POOP_BIN_STOWED        = SK_POOP_BIN_FOOTPRINT extruded POOP_BIN_HEIGHT
BODY_POOP_BIN_SWEEP         = stowed bin + POOP_BIN_PULL_OUT swept volume
BODY_ROOST_SWEEP            = roost deployed sweep plus ROOST_SWEEP_BUFFER
```

---

# 8. Frame Modeling Instructions

## 8.1 Frame Philosophy

The frame is wood-first and must be easy to build with actual lumber.

Use:

- 4x4 corner posts
- 2x4 bottom ring
- 2x4 mid ring
- 2x4 robot/rail ring
- 2x4 top ring
- 2x4 rafters

## 8.2 Corner Posts

Create component `FRAME_POSTS`.

Create four rectangular posts:

- Size = `POST_4X4` x `POST_4X4`
- Height = `PLATFORM_Z`
- Position = outside interior clear footprint

Name:

```text
TC_CHKN_FRAME_POST_FL
TC_CHKN_FRAME_POST_FR
TC_CHKN_FRAME_POST_BL
TC_CHKN_FRAME_POST_BR
```

## 8.3 Bottom Ring

Create component `FRAME_BOTTOM_RING`.

Use 2x4s with the 3.5 inch face vertical unless otherwise required.

Members:

```text
TC_CHKN_BOTTOM_RING_FRONT
TC_CHKN_BOTTOM_RING_BACK
TC_CHKN_BOTTOM_RING_LEFT
TC_CHKN_BOTTOM_RING_RIGHT
```

## 8.4 Mid Ring

Place at `BED_DEPTH_MAX` or at the support height needed for the bed tray.

Purpose:

- Supports bedding module
- Supports poop bin rail ledgers
- Stiffens frame

## 8.5 Robot/Rail Ring

Place at `PLANE_ROBOT_Z0` or slightly above if rail system mounts higher.

Purpose:

- Rail mounting plane
- Mechanical datum for automation

## 8.6 Top Ring

Place at `PLATFORM_Z`.

Purpose:

- Roof support
- Structural closure

## 8.7 Bracing

Use 2x4 diagonal braces or plywood shear panels.

Add keep-out envelopes for braces if they intrude into robot/rail motion.

---

# 9. Wall, Roof, and Door Instructions

## 9.1 Walls

Create separate components:

```text
WALL_FRONT
WALL_BACK
WALL_LEFT
WALL_RIGHT
```

Use:

- 1/2 in plywood for interior panels
- 3/4 in where structural panels are needed

Add cutouts:

- Service door
- Chicken pop door
- Nest box door
- Vent openings
- Poop bin access door

## 9.2 Roof

Create `ROOF_ASM`.

Use:

- 2x4 rafters
- metal or polycarbonate panels
- overhangs from parameters

Minimum roof features:

- front overhang
- side overhangs
- ridge line
- drip edge reference

## 9.3 Doors

Door components:

```text
SERVICE_DOOR
CHICKEN_POP_DOOR
NEST_BOX_ACCESS_DOOR
POOP_BIN_ACCESS_DOOR
```

Each door must include:

- panel body
- hinge line
- latch location
- swing envelope
- optional open configuration

---

# 10. Poop Bin Drawer Module

## 10.1 Purpose

The poop bin is an 8 inch high slide-out cassette below the roost area.

## 10.2 Required Components

```text
POOP_BIN_TRAY
POOP_BIN_SLIDES_LEFT
POOP_BIN_SLIDES_RIGHT
POOP_BIN_HANDLE
POOP_BIN_LOCK
POOP_BIN_SEATED_SENSOR
```

## 10.3 Geometry

Tray:

- Height = `POOP_BIN_HEIGHT`
- Width = `POOP_BIN_X`
- Depth = `POOP_BIN_Y`
- Wall thickness = `POOP_BIN_WALL`

Slide extension:

- `POOP_BIN_PULL_OUT`

## 10.4 Motion

Use Fusion joints:

- Slider joint for bin cassette
- Limits:
  - 0 in = stowed
  - `POOP_BIN_PULL_OUT` = fully extended

## 10.5 Configurations

```text
POOP_BIN_STOWED
POOP_BIN_EXTENDED
POOP_BIN_REMOVED
```

## 10.6 Safety

Bin extension is maintenance-only unless robot state is parked.

Add bin seated switch in electronics BOM.

---

# 11. Deep Bedding Module

## 11.1 Bedding Practice Assumption

Support bedding depths:

```text
6 in to 12 in
```

Design for 12 in maximum + 6 in safety volume.

## 11.2 Required Geometry

```text
DEEP_BED_TRAY
BED_SUPPORT_LEDGERS
BED_RETENTION_LIP
BED_SERVICE_OPENING
```

## 11.3 Build Requirements

- washable liner
- moisture-tolerant materials
- removable tray or serviceable base
- no exposed sharp edges

---

# 12. Roost System

## 12.1 Fixed Roosts

Default fixed roost bar:

```text
ROOST_DIAMETER = 2 in
```

Use rounded or chamfered geometry.

## 12.2 Deployable Roosts

Roost states:

```text
STOWED
DEPLOYING
DEPLOYED
RETRACTING
FAULT
```

## 12.3 Fusion Motion

Use revolute joint at hinge axis.

Limits:

- 0 deg = stowed
- 90 deg or configured deployed angle = deployed

Create sweep envelope for full range.

## 12.4 Hardware

- hinge
- roost pole
- actuator or servo
- stowed switch
- deployed switch
- mechanical hard stop

---

# 13. Rail System Interface

## 13.1 Rail System Purpose

The rail system is optional and should bolt into the frame without redefining the coop.

## 13.2 Required Components

```text
RAIL_X_LEFT
RAIL_X_RIGHT
RAIL_Y_BRIDGE
RAIL_Z_LIFT
TOOL_PLATE
CABLE_CHAIN
MOTOR_MOUNTS
LIMIT_SWITCHES
```

## 13.3 Motion Hardware

Base hardware:

- MGN12 or MGN15 rails
- NEMA 23 for X/Y
- NEMA 17 for Z
- TB6600 drivers
- belt, lead screw, or rack drive depending on size

## 13.4 Fusion Modeling

Rail system references:

```text
ROBOT_KEEPIN
SAFE_FOOTPRINT
PLANE_ROBOT_Z0
```

Rail system shall not reference bed tray, poop bin tray, or roost poles directly.

---

# 14. WatchTower AI Interface

## 14.1 Purpose

WatchTower AI is a predator monitoring module that can mount to the coop, pen, or exterior pole.

## 14.2 Required Interface Geometry

```text
WATCHTOWER_MOUNT_PAD
WATCHTOWER_CABLE_PASS
WATCHTOWER_SOLAR_PAD
```

## 14.3 Hardware Assumption

- AI camera or ESP32 camera
- night vision or IR
- PIR sensor
- radar sensor
- siren
- LED deterrent
- solar/battery option

## 14.4 Fusion Model

WatchTower shall be modeled as separate component with mounting adapter only in Chicken Tender assembly.

---

# 15. Electronics and Control Box

## 15.1 Control Box

Parameters:

```text
CONTROL_BOX_WIDTH = 12 in
CONTROL_BOX_HEIGHT = 16 in
CONTROL_BOX_DEPTH = 6 in
```

Components:

- enclosure
- DIN rail
- terminal blocks
- fuse blocks
- TB6600 drivers
- ESP32-S3
- buck converters
- cable glands

## 15.2 Required Wire Path Geometry

Create:

```text
UTILITY_CORRIDOR
CABLE_CHAIN_ZONE
CABLE_EXIT_LOCATIONS
```

Do not run cables through:

- poop bin sweep
- roost sweep
- service door swing
- chicken access door

---

# 16. Configurations

Create Fusion configurations if available.

```text
CFG_SMALL_BASE
CFG_SMALL_AUTO
CFG_MEDIUM_BASE
CFG_MEDIUM_PRO
CFG_LARGE_BASE
CFG_LARGE_PRO
CFG_MAINTENANCE
CFG_NIGHT
```

## Configuration Meanings

### CFG_SMALL_BASE

- 36 x 36 x 60
- no rail
- fixed roost
- manual poop bin

### CFG_SMALL_AUTO

- 36 x 36 x 60
- motorized door
- sensors
- WatchTower mount

### CFG_MEDIUM_BASE

- 48 x 48 x 72
- manual systems
- poop bin

### CFG_MEDIUM_PRO

- 48 x 48 x 72
- rail-ready
- deployable roosts
- electronics enclosure
- WatchTower interface

### CFG_LARGE_BASE

- 72 x 72 x 96
- larger frame
- manual service systems

### CFG_LARGE_PRO

- 72 x 72 x 96
- rail system
- modular automation
- WatchTower AI
- solar/control modules

### CFG_MAINTENANCE

- robot parked
- poop bin extended
- service doors open
- roosts stowed

### CFG_NIGHT

- robot parked
- roosts deployed
- WatchTower active

---

# 17. Claude/MCP Execution Checklist

## Phase 1 – Project Setup

- [ ] Create Fusion design
- [ ] Set units to inches
- [ ] Create `MASTER_LAYOUT`
- [ ] Add all user parameters
- [ ] Create master planes
- [ ] Create master skeleton sketches
- [ ] Create reference envelope bodies

## Phase 2 – Frame

- [ ] Create 4x4 posts
- [ ] Create bottom ring
- [ ] Create mid ring
- [ ] Create top ring
- [ ] Create roof trusses
- [ ] Add bracing
- [ ] Confirm actual lumber dimensions

## Phase 3 – Interior Modules

- [ ] Create bed tray
- [ ] Create poop bin drawer
- [ ] Create nest box
- [ ] Create roost system
- [ ] Create door swing envelopes

## Phase 4 – Automation Interfaces

- [ ] Create rail keep-in interface
- [ ] Create robot park envelope
- [ ] Create WatchTower mounting interface
- [ ] Create control box mounting location
- [ ] Create cable corridors

## Phase 5 – Configurations

- [ ] Create Small/Medium/Large configs
- [ ] Create Base/Auto/Pro configs
- [ ] Create Night/Maintenance configs

## Phase 6 – Validation

- [ ] Check all sketches fully defined
- [ ] Check no unintentional dependencies
- [ ] Check safe footprint
- [ ] Check poop bin extension clearance
- [ ] Check roost sweep clearance
- [ ] Check robot keep-in vs keep-out
- [ ] Export STEP/GLB versions

---

# 18. Prompt for Claude / MCP

Use this prompt when starting the CAD automation session:

```text
You are assisting with the Autodesk Fusion design of the Tender Cells Chicken Tender product line.

Your job is to create a clean, parametric Fusion model using a top-down master layout strategy.

Use one master component named MASTER_LAYOUT to define all global parameters, construction planes, skeleton sketches, and reference envelopes.

Build the model around three customer-facing size presets:
- Small: 36 x 36 x 60 inches
- Medium: 48 x 48 x 72 inches
- Large: 72 x 72 x 96 inches

Use actual lumber dimensions:
- 4x4 = 3.5 x 3.5 inches
- 2x4 = 1.5 x 3.5 inches
- 3/4 plywood = 0.75 inches

Create a modular coop assembly with:
- wood frame
- roof
- walls
- doors
- deep bedding zone
- 8 inch poop bin drawer cassette
- fixed and deployable roost options
- optional rail system interface
- WatchTower AI mounting interface
- control box mounting interface
- solar kit mounting interface

Create explicit reference envelopes:
- ROBOT_KEEPIN
- BED_KEEPOUT
- POOP_BIN_SWEEP
- ROOST_SWEEP
- SAFE_INTERIOR

Do not let modules reference each other directly. They must reference MASTER_LAYOUT, user parameters, or named skeleton sketches.

Create configurations or documented parameter presets for:
- Small Base
- Small Auto
- Medium Base
- Medium Pro
- Large Base
- Large Pro
- Maintenance
- Night

Prioritize clean hierarchy, named features, stable parameters, and future editability over cosmetic detail.
```

---

# 19. Validation Rules

The model is not acceptable unless:

- All primary dimensions come from user parameters.
- All sketches are named.
- All important construction planes are named.
- Actual lumber dimensions are used.
- Safe robot envelopes are visible and inspectable.
- Poop bin can slide out by `POOP_BIN_PULL_OUT`.
- Roost sweep does not collide with parked robot envelope.
- Control box is not in a door swing or bin sweep zone.
- WatchTower mount does not interfere with roof or service doors.
- STEP and GLB exports can be generated.

---

# 20. Output Expectations

At minimum, the Fusion design should produce:

```text
TC_CHICKEN_TENDER_MASTER.f3d
TC_CHICKEN_TENDER_SMALL.glb
TC_CHICKEN_TENDER_MEDIUM.glb
TC_CHICKEN_TENDER_LARGE.glb
TC_CHICKEN_TENDER_MASTER.step
TC_CHICKEN_TENDER_DXF_CUTS.zip
```

---

# 21. Notes for Future Agents

Do not overbuild the first model.

The first useful deliverable is a clean parametric frame and module envelope system, not a perfect visual render.

Prioritize:

1. Parameter stability
2. Correct lumber dimensions
3. Clear modular interfaces
4. Door/bin/roost motion envelopes
5. Rail/robot safety zones

Cosmetic details can come later.
