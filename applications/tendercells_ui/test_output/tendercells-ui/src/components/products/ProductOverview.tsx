import BatteryChargingFullIcon from "@mui/icons-material/BatteryChargingFull";
import CloudIcon from "@mui/icons-material/Cloud";
import FenceIcon from "@mui/icons-material/Fence";
import GpsFixedIcon from "@mui/icons-material/GpsFixed";
import GrassIcon from "@mui/icons-material/Grass";
import SecurityIcon from "@mui/icons-material/Security";
import SensorsIcon from "@mui/icons-material/Sensors";
import SettingsInputComponentIcon from "@mui/icons-material/SettingsInputComponent";
import Box from "@mui/material/Box";
import Chip from "@mui/material/Chip";
import Divider from "@mui/material/Divider";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import type { ReactElement } from "react";

type ProductProfile = {
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

export function ProductHero({ product }: { product: string }) {
  const profile = PRODUCT_PROFILES[product];
  if (!profile) return null;

  return (
    <Paper elevation={2} sx={{ p: { xs: 2, md: 3 }, mb: 3, border: "1px solid #1F5C3B", overflow: "hidden" }}>
      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.05fr 0.95fr" }, gap: 3, alignItems: "center" }}>
        <Box>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" alignItems="center" sx={{ mb: 1 }}>
            <Chip label={profile.badge} size="small" sx={{ bgcolor: "#1A3D2B", color: "#C8B882" }} />
            <Chip label="Product profile" size="small" sx={{ bgcolor: "#123D25", color: "#8DD47A" }} />
          </Stack>
          <Typography variant="h4" sx={{ color: "#E4E7E5", fontWeight: 800, mb: 1 }}>
            {profile.name}
          </Typography>
          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 760, mb: 2 }}>
            {profile.summary}
          </Typography>
          <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
            {profile.chips.map((chip) => (
              <Chip key={chip.label} icon={chip.icon} label={chip.label} variant="outlined" />
            ))}
          </Stack>
        </Box>
        <ProductVisual profile={profile} />
      </Box>
    </Paper>
  );
}

export function ProductDetailsPanel({ product }: { product: string }) {
  const profile = PRODUCT_PROFILES[product];
  if (!profile) return null;

  return (
    <Paper elevation={2} sx={{ p: 2, mb: 2, border: "1px solid #1F5C3B" }}>
      <Typography variant="h6" gutterBottom>
        Product Details
      </Typography>
      <Stack spacing={1.25}>
        {profile.specs.map(([label, value]) => (
          <Box key={label} sx={{ display: "flex", justifyContent: "space-between", gap: 2 }}>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="body2" sx={{ color: "#E4E7E5", textAlign: "right" }}>
              {value}
            </Typography>
          </Box>
        ))}
      </Stack>
      <Divider sx={{ my: 2 }} />
      <Typography variant="subtitle2" sx={{ mb: 1, color: "#C8B882" }}>
        Setup Needs
      </Typography>
      <Stack spacing={0.75}>
        {profile.setupNeeds.map((need) => (
          <Typography key={need} variant="body2" color="text.secondary">
            - {need}
          </Typography>
        ))}
      </Stack>
    </Paper>
  );
}

function ProductVisual({ profile }: { profile: ProductProfile }) {
  return (
    <Box
      role="img"
      aria-label={`${profile.name} product visual`}
      sx={{
        minHeight: { xs: 220, sm: 260, lg: 300 },
        borderRadius: 1,
        bgcolor: "#001B14",
        border: "1px solid #1F5C3B",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <Box
        sx={{
          position: "absolute",
          inset: 0,
          background: `radial-gradient(circle at 68% 22%, ${profile.accent}66, transparent 28%), linear-gradient(145deg, #001B14 0%, #123D25 100%)`,
        }}
      />
      <Box
        sx={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "34%",
          bgcolor: "#2D6235",
          opacity: 0.82,
          clipPath: "polygon(0 28%, 18% 16%, 38% 29%, 57% 12%, 78% 28%, 100% 16%, 100% 100%, 0 100%)",
        }}
      />
      <Box
        sx={{
          position: "relative",
          width: { xs: 172, sm: 220 },
          height: { xs: 126, sm: 158 },
          border: `4px solid ${profile.accent}`,
          borderRadius: "50% 50% 18px 18px",
          bgcolor: "rgba(228,231,229,0.08)",
          boxShadow: "0 18px 34px rgba(0,0,0,0.38)",
        }}
      >
        <Typography
          sx={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: profile.accent,
            fontSize: { xs: "2.6rem", sm: "3.4rem" },
            fontWeight: 900,
          }}
        >
          {profile.imageLabel}
        </Typography>
        <Box sx={{ position: "absolute", bottom: -20, left: 22, width: 34, height: 34, borderRadius: "50%", bgcolor: "#101A16", border: `6px solid ${profile.accent}` }} />
        <Box sx={{ position: "absolute", bottom: -20, right: 22, width: 34, height: 34, borderRadius: "50%", bgcolor: "#101A16", border: `6px solid ${profile.accent}` }} />
      </Box>
    </Box>
  );
}
