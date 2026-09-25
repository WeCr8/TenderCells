import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import CloudIcon from "@mui/icons-material/Cloud";
import FenceIcon from "@mui/icons-material/Fence";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import GrassIcon from "@mui/icons-material/Grass";
import SecurityIcon from "@mui/icons-material/Security";
import SensorsIcon from "@mui/icons-material/Sensors";
import SettingsInputComponentIcon from "@mui/icons-material/SettingsInputComponent";
import type { ReactElement } from "react";

export type ProductProfile = {
  name: string;
  badge: string;
  imageLabel: string;
  summary: string;
  accent: string;
  chips: { label: string; icon: ReactElement }[];
  specs: [string, string][];
  setupNeeds: string[];
};

export const PRODUCT_PROFILES: Record<string, ProductProfile> = {
  "chicken-tender": {
    name: "Chicken Tender",
    badge: "Automated coop",
    imageLabel: "CT",
    accent: "#6BBF59",
    summary:
      "Automated chicken coop platform for doors, latches, feeding, watering, cleaning, egg mapping, cameras, and robot-arm workflows.",
    chips: [
      { label: "Robot ready", icon: <SettingsInputComponentIcon /> },
      { label: "Coop automation", icon: <SensorsIcon /> },
      { label: "Safety lockouts", icon: <SecurityIcon /> },
    ],
    specs: [
      ["Footprint", "4 x 4 x 6 ft preset"],
      ["Motion", "XYZ rail + robot arm"],
      ["Control", "ESP32 + local MQTT"],
      ["Primary jobs", "Feed, water, clean, egg map"],
    ],
    setupNeeds: [
      "Register coop controller and first hardware modules",
      "Confirm doors, latches, motors, and rail limits",
      "Map nest boxes, feed, water, and cleaning zones",
      "Run simulation before enabling moving hardware",
    ],
  },
  "roaming-roost": {
    name: "Roaming Roost",
    badge: "Mobile product",
    imageLabel: "RR",
    accent: "#C8B882",
    summary:
      "Mobile pasture rotation enclosure for chickens. Plan yard routes, avoid obstacles, simulate travel, and connect drive motors, GPS, encoders, dock sensors, and battery telemetry.",
    chips: [
      { label: "GPS geofence", icon: <GpsFixedIcon /> },
      { label: "Dock charging", icon: <BatteryChargingFullIcon /> },
      { label: "Pasture rotation", icon: <GrassIcon /> },
    ],
    specs: [
      ["Footprint", "3 x 3 x 5 ft dome"],
      ["Drive", "4x mecanum wheel modules"],
      ["Navigation", "GPS boundary + obstacle sensors"],
      ["Power", "20Ah LiFePO4 / dock charging"],
      ["Comms", "WiFi + LoRa mesh"],
    ],
    setupNeeds: [
      "Register drive controller and wheel modules",
      "Define property boundary and no-go zones",
      "Calibrate dock sensor and return-to-home path",
      "Simulate pasture route before motor enable",
    ],
  },
  "duck-dock": {
    name: "Duck Dock",
    badge: "Waterfowl system",
    imageLabel: "DD",
    accent: "#5EB5D7",
    summary:
      "Duck habitat automation with dock access, pond level management, water quality monitoring, splash-resistant feeding, and waterfowl-safe routines.",
    chips: [
      { label: "Pond control", icon: <SensorsIcon /> },
      { label: "Water quality", icon: <SettingsInputComponentIcon /> },
      { label: "Dock access", icon: <SecurityIcon /> },
    ],
    specs: [
      ["Footprint", "4 x 4 x 6 ft dock"],
      ["Water", "Fill/drain valve support"],
      ["Sensors", "Level, turbidity, pH, temperature"],
      ["Jobs", "Feed, water, dock safety"],
    ],
    setupNeeds: [
      "Register dock controller and pond sensors",
      "Calibrate fill/drain levels",
      "Set water quality alert thresholds",
      "Confirm ramp, latch, and presence safety",
    ],
  },
  "goat-guardian": {
    name: "Goat Guardian",
    badge: "Large enclosure",
    imageLabel: "GG",
    accent: "#D0A34E",
    summary:
      "Large-animal enclosure automation for gates, fence status, pasture rotation, feed/water management, perimeter awareness, and predator response.",
    chips: [
      { label: "Fence status", icon: <FenceIcon /> },
      { label: "Pasture zones", icon: <GrassIcon /> },
      { label: "Predator alerts", icon: <SecurityIcon /> },
    ],
    specs: [
      ["Footprint", "6 x 6 x 8 ft shelter"],
      ["Gate", "Heavy-duty latch/servo support"],
      ["Feed", "Large hopper + water trough"],
      ["Perimeter", "Fence/gate sensor support"],
    ],
    setupNeeds: [
      "Register shelter, gate, and fence devices",
      "Map pasture and gate locations",
      "Set feed/water portions and refill alerts",
      "Arm perimeter and predator response rules",
    ],
  },
  "bunny-burrow": {
    name: "Bunny Burrow",
    badge: "Small animal habitat",
    imageLabel: "BB",
    accent: "#B9D7A3",
    summary:
      "Rabbit habitat automation for feeding, water, climate monitoring, enrichment scheduling, and safety alerts.",
    chips: [
      { label: "Climate guard", icon: <SensorsIcon /> },
      { label: "Feeding", icon: <SettingsInputComponentIcon /> },
      { label: "Safety", icon: <SecurityIcon /> },
    ],
    specs: [
      ["Footprint", "3 x 3 x 5 ft burrow"],
      ["Feed", "Pellet and hay station support"],
      ["Sensors", "Temperature, humidity, motion"],
      ["Water", "Bottle or bowl refill support"],
    ],
    setupNeeds: [
      "Register feed, water, and climate devices",
      "Set temperature guardrails",
      "Configure enrichment routines",
      "Confirm safety alerts and camera zones",
    ],
  },
  "turkey-tower": {
    name: "Turkey Tower",
    badge: "Large poultry",
    imageLabel: "TT",
    accent: "#C97D4B",
    summary:
      "Turkey-specific enclosure with wider access, taller roosting, oversized nest areas, feeding/water support, and predator-aware monitoring.",
    chips: [
      { label: "Tall roosts", icon: <SettingsInputComponentIcon /> },
      { label: "Predator watch", icon: <SecurityIcon /> },
      { label: "Poultry telemetry", icon: <SensorsIcon /> },
    ],
    specs: [
      ["Footprint", "4 x 4 x 6 ft tower"],
      ["Roost", "36 in perch height"],
      ["Doors", "Wide access support"],
      ["Feed", "Heavy feeder profile"],
    ],
    setupNeeds: [
      "Register tower controller and door hardware",
      "Set roost and nest locations",
      "Calibrate larger feed/water profile",
      "Confirm predator and night-close rules",
    ],
  },
  "predator-monitor": {
    name: "WatchTower AI",
    badge: "Predator monitor",
    imageLabel: "WT",
    accent: "#8DD47A",
    summary:
      "Solar-ready perimeter monitor for cameras, detections, alerts, LoRa broadcast, predator classification, and remote stream health.",
    chips: [
      { label: "AI detections", icon: <SecurityIcon /> },
      { label: "Camera zones", icon: <SensorsIcon /> },
      { label: "Solar/battery", icon: <BatteryChargingFullIcon /> },
    ],
    specs: [
      ["Coverage", "3-camera 360 degree dome"],
      ["Comms", "WiFi + LoRa mesh"],
      ["Power", "Solar + battery pack"],
      ["AI", "On-device detection profile"],
    ],
    setupNeeds: [
      "Register camera nodes and tower controller",
      "Set detection zones and thresholds",
      "Pair LoRa alert targets",
      "Test predator alert escalation",
    ],
  },
  "rail-system-modules": {
    name: "TenderCells Rail System",
    badge: "Module platform",
    imageLabel: "RS",
    accent: "#9CB7D8",
    summary:
      "Modular rail automation platform for internal enclosure tools, carriages, robot arm support, cleaning tools, and maintenance attachments.",
    chips: [
      { label: "Rail segments", icon: <SettingsInputComponentIcon /> },
      { label: "Tool modules", icon: <SensorsIcon /> },
      { label: "Service zones", icon: <SecurityIcon /> },
    ],
    specs: [
      ["Segments", "Expandable rail sections"],
      ["Motion", "Carriage + motor driver"],
      ["Tools", "Arm/toolhead mounting"],
      ["Safety", "Soft limits + home sensors"],
    ],
    setupNeeds: [
      "Register rail segments and carriage devices",
      "Define home/endstop locations",
      "Set service and no-collision zones",
      "Run segment scan before actuation",
    ],
  },
  "tender-cells-cloud": {
    name: "TenderCells Cloud",
    badge: "Software service",
    imageLabel: "TC",
    accent: "#78A6D8",
    summary:
      "Cloud dashboard for registered products, remote telemetry, model/config sync, fleet management, alerts, and open-source community device coordination.",
    chips: [
      { label: "Fleet registry", icon: <CloudIcon /> },
      { label: "Remote telemetry", icon: <SensorsIcon /> },
      { label: "Config sync", icon: <SettingsInputComponentIcon /> },
    ],
    specs: [
      ["Scope", "Products, devices, telemetry"],
      ["Access", "Firebase auth"],
      ["Data", "Models, configs, events"],
      ["Integrations", "MQTT/API bridge ready"],
    ],
    setupNeeds: [
      "Register cloud software product",
      "Connect device registry and owner accounts",
      "Set telemetry retention/consent",
      "Prepare export and open-source data paths",
    ],
  },
  "pigeon-palace": {
    name: "Pigeon Palace",
    badge: "Smart loft",
    imageLabel: "PP",
    accent: "#D6D9C8",
    summary:
      "Smart pigeon loft for access doors, RFID tracking, feeding/water routines, nest monitoring, route notes, and per-bird history.",
    chips: [
      { label: "Loft access", icon: <SecurityIcon /> },
      { label: "Flight tracking", icon: <GpsFixedIcon /> },
      { label: "Nest map", icon: <SensorsIcon /> },
    ],
    specs: [
      ["Footprint", "4 x 4 x 6 ft loft"],
      ["Tracking", "RFID/door sensor support"],
      ["Water/feed", "Routine automation"],
      ["History", "Per-bird event log ready"],
    ],
    setupNeeds: [
      "Register loft controller and access door",
      "Pair RFID or bird identity sensors",
      "Configure feed/water schedules",
      "Set route and return tracking options",
    ],
  },
};
