import { useEffect, useState } from "react";
import AddIcon from "@mui/icons-material/Add";
import BuildIcon from "@mui/icons-material/Build";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import SettingsIcon from "@mui/icons-material/Settings";
import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Chip from "@mui/material/Chip";
import Dialog from "@mui/material/Dialog";
import DialogActions from "@mui/material/DialogActions";
import DialogContent from "@mui/material/DialogContent";
import DialogTitle from "@mui/material/DialogTitle";
import Divider from "@mui/material/Divider";
import IconButton from "@mui/material/IconButton";
import MenuItem from "@mui/material/MenuItem";
import Paper from "@mui/material/Paper";
import Stack from "@mui/material/Stack";
import Switch from "@mui/material/Switch";
import TextField from "@mui/material/TextField";
import Tooltip from "@mui/material/Tooltip";
import Typography from "@mui/material/Typography";

type ProductSectionPanelProps = {
  product: string;
  section: string;
};

type SectionDevice = {
  id: string;
  name: string;
  type: string;
  status: "ready" | "offline" | "setup";
};

type SectionConfig = {
  label: string;
  description: string;
  deviceTypes?: string[];
  defaultDevices?: SectionDevice[];
  options: string[];
  metrics: string[];
  actions: string[];
};

const PRODUCT_LABELS: Record<string, string> = {
  "chicken-tender": "Chicken Tender",
  "roaming-roost": "Roaming Roost",
  "duck-dock": "Duck Dock",
  "goat-guardian": "Goat Guardian",
  "bunny-burrow": "Bunny Burrow",
  "turkey-tower": "Turkey Tower",
  "predator-monitor": "WatchTower AI",
  "rail-system-modules": "Rail System Modules",
  "tendercells-cloud": "TenderCells Cloud",
  "tender-cells-cloud": "TenderCells Cloud",
  "pigeon-palace": "Pigeon Palace",
};

const SECTION_CONFIG: Record<string, SectionConfig> = {
  coop: {
    label: "Coop Settings",
    description: "Manage enclosure dimensions, model preset, ventilation zones, and device grouping.",
    deviceTypes: ["Main controller", "Expansion hub", "Ventilation module"],
    defaultDevices: [{ id: "coop-controller", name: "Main Coop Controller", type: "Main controller", status: "ready" }],
    options: ["Auto climate profile", "Night safety lockout", "Maintenance mode"],
    metrics: ["Internal temp", "Humidity", "Occupancy"],
    actions: ["Calibrate enclosure", "Sync model", "Run diagnostics"],
  },
  doors: {
    label: "Doors & Latches",
    description: "Add and manage pop doors, access doors, magnetic latches, and limit switches.",
    deviceTypes: ["Pop door actuator", "Latch servo", "Limit switch", "Magnetic reed sensor"],
    defaultDevices: [
      { id: "front-pop-door", name: "Front Pop Door", type: "Pop door actuator", status: "ready" },
      { id: "service-latch", name: "Service Latch", type: "Latch servo", status: "setup" },
    ],
    options: ["Dawn open", "Dusk close", "Predator lockout", "Jam detection"],
    metrics: ["Door position", "Latch state", "Last cycle"],
    actions: ["Open selected", "Close selected", "Cycle test"],
  },
  motors: {
    label: "Motors & Rails",
    description: "Configure rail motors, travel limits, homing routines, and speed profiles.",
    deviceTypes: ["Stepper motor", "Rail carriage", "Endstop", "Motor driver"],
    defaultDevices: [{ id: "main-rail", name: "Main Rail Motor", type: "Stepper motor", status: "setup" }],
    options: ["Soft limits", "Homing required", "Current limit", "Stall detection"],
    metrics: ["Rail position", "Motor current", "Limit state"],
    actions: ["Home rail", "Jog forward", "Jog reverse"],
  },
  robot: {
    label: "Robot Arm",
    description: "Manage arm joints, toolheads, parking pose, and movement safety envelopes.",
    deviceTypes: ["Joint servo", "Gripper", "Toolhead", "Arm controller"],
    options: ["Safe envelope", "Park after task", "Slow teach mode"],
    metrics: ["Joint angle", "Toolhead", "Pose state"],
    actions: ["Park arm", "Teach pose", "Grip test"],
  },
  sensors: {
    label: "Sensors",
    description: "Add environmental, occupancy, scale, camera, and safety sensors.",
    deviceTypes: ["Temperature sensor", "Humidity sensor", "Load cell", "Camera", "Presence sensor"],
    defaultDevices: [{ id: "env-sensor", name: "Environment Sensor", type: "Temperature sensor", status: "ready" }],
    options: ["Log telemetry", "Alert thresholds", "Battery alerts"],
    metrics: ["Signal", "Last reading", "Battery"],
    actions: ["Scan bus", "Calibrate", "Export readings"],
  },
  feed: {
    label: "Feeding & Water",
    description: "Configure feed dispensers, water valves, portion schedules, and reservoir alerts.",
    deviceTypes: ["Feed auger", "Water valve", "Reservoir sensor", "Scale"],
    defaultDevices: [{ id: "feed-auger", name: "Feed Auger", type: "Feed auger", status: "ready" }],
    options: ["Scheduled feeding", "Low reservoir alert", "Anti-clog pulse"],
    metrics: ["Feed remaining", "Water flow", "Last dispense"],
    actions: ["Dispense test", "Prime water", "Tare scale"],
  },
  waste: {
    label: "Waste Cleaning",
    description: "Manage scraper motors, tray sensors, cleaning cycles, and safe-stop behavior.",
    deviceTypes: ["Scraper motor", "Tray sensor", "Waste bin sensor"],
    options: ["Scheduled clean", "Bin full alert", "Pause on occupancy"],
    metrics: ["Cycle count", "Bin level", "Motor load"],
    actions: ["Start clean", "Return home", "Clear fault"],
  },
  eggs: {
    label: "Egg Map",
    description: "Track nest boxes, egg sensors, collection reminders, and heat-map overlays.",
    deviceTypes: ["Nest sensor", "Egg scale", "Nest camera"],
    options: ["Collection reminders", "Nest heat map", "Breakage alert"],
    metrics: ["Nest occupancy", "Egg count", "Last collection"],
    actions: ["Reset count", "Mark collected", "Scan nests"],
  },
  route: {
    label: "Route Planning",
    description: "Plan mobile paths, waypoints, geofence behavior, and no-go zones.",
    deviceTypes: ["GPS module", "Wheel encoder", "Drive controller"],
    options: ["Geofence enabled", "Avoid slopes", "Return to dock"],
    metrics: ["Waypoint", "Heading", "Distance"],
    actions: ["Set waypoint", "Preview route", "Start route"],
  },
  "mobile-coop": {
    label: "Mobile Coop",
    description: "Configure mobile coop body, docking state, battery profile, and travel readiness.",
    deviceTypes: ["Drive base", "Battery module", "Dock sensor", "Charge controller"],
    defaultDevices: [{ id: "drive-base", name: "Drive Base", type: "Drive base", status: "setup" }],
    options: ["Auto dock", "Low battery return", "Travel lockout"],
    metrics: ["Battery", "Dock state", "Drive state"],
    actions: ["Dock now", "Unlock travel", "Run mobility check"],
  },
  dock: {
    label: "Dock Settings",
    description: "Manage dock access, ramp sensors, night closure, and waterfowl safety checks.",
    deviceTypes: ["Ramp actuator", "Dock latch", "Presence sensor"],
    defaultDevices: [{ id: "dock-ramp", name: "Dock Ramp", type: "Ramp actuator", status: "ready" }],
    options: ["Auto ramp", "Night close", "Presence lockout"],
    metrics: ["Ramp state", "Presence", "Last cycle"],
    actions: ["Raise ramp", "Lower ramp", "Cycle test"],
  },
  pond: {
    label: "Pond Level",
    description: "Monitor pond level, dock clearance, inlet/outlet valves, and pump behavior.",
    deviceTypes: ["Level sensor", "Pump relay", "Valve actuator"],
    options: ["Auto refill", "Overflow alert", "Pump protection"],
    metrics: ["Water level", "Pump state", "Valve state"],
    actions: ["Prime pump", "Open valve", "Close valve"],
  },
  water: {
    label: "Water Quality",
    description: "Track water quality probes and threshold-driven alerts.",
    deviceTypes: ["pH probe", "Turbidity sensor", "Temperature probe"],
    options: ["pH alert", "Temperature alert", "Sample logging"],
    metrics: ["pH", "Turbidity", "Water temp"],
    actions: ["Calibrate probe", "Sample now", "Export trend"],
  },
  fence: {
    label: "Fence Status",
    description: "Manage fence segments, gate sensors, perimeter alerts, and continuity checks.",
    deviceTypes: ["Gate sensor", "Fence monitor", "Perimeter camera"],
    options: ["Open gate alert", "Continuity check", "Night perimeter mode"],
    metrics: ["Gate state", "Segment health", "Last alert"],
    actions: ["Test segment", "Arm perimeter", "Silence alert"],
  },
  shelter: {
    label: "Shelter",
    description: "Configure shelter access, ventilation, bedding sensors, and temperature guards.",
    deviceTypes: ["Shelter door", "Vent fan", "Bedding sensor"],
    defaultDevices: [{ id: "shelter-door", name: "Shelter Door", type: "Shelter door", status: "ready" }],
    options: ["Auto shelter", "Heat alert", "Ventilation assist"],
    metrics: ["Shelter temp", "Door state", "Bedding"],
    actions: ["Open shelter", "Close shelter", "Vent test"],
  },
  pasture: {
    label: "Grazing Area",
    description: "Set grazing paddocks, rotation timing, gate state, and forage notes.",
    deviceTypes: ["Paddock gate", "GPS tag", "Pasture beacon"],
    options: ["Rotation reminders", "No-go areas", "Gate alerts"],
    metrics: ["Active paddock", "Time grazed", "Gate state"],
    actions: ["Rotate paddock", "Mark rested", "Preview map"],
  },
  security: {
    label: "Predator Alert",
    description: "Tune deterrents, perimeter sensors, alert rules, and response escalation.",
    deviceTypes: ["Motion sensor", "Deterrent light", "Siren", "Camera"],
    defaultDevices: [{ id: "perimeter-motion", name: "Perimeter Motion", type: "Motion sensor", status: "setup" }],
    options: ["Night arm", "Light deterrent", "Escalate alerts"],
    metrics: ["Threat level", "Perimeter state", "Last trigger"],
    actions: ["Arm security", "Test deterrent", "Review events"],
  },
  watchtower: {
    label: "WatchTower",
    description: "Manage WatchTower health, solar/battery state, camera module, and AI detection status.",
    deviceTypes: ["WatchTower unit", "Solar charger", "AI camera", "LTE bridge"],
    defaultDevices: [{ id: "watchtower-main", name: "WatchTower Main", type: "WatchTower unit", status: "ready" }],
    options: ["AI detection", "Solar charging", "Remote alerts"],
    metrics: ["Battery", "Solar input", "AI state"],
    actions: ["Run self-test", "Reboot tower", "Sync model"],
  },
  cameras: {
    label: "Cameras",
    description: "Add cameras, set zones, tune frame capture, and check stream health.",
    deviceTypes: ["Wide camera", "IR camera", "PTZ camera"],
    options: ["Night mode", "Record events", "Motion zones"],
    metrics: ["Stream state", "FPS", "Last detection"],
    actions: ["Add camera", "Test stream", "Calibrate zone"],
  },
  detections: {
    label: "Detections",
    description: "Tune object classes, confidence thresholds, capture windows, and review queues.",
    deviceTypes: ["Detection model", "Inference module", "Storage module"],
    options: ["Predator class", "Animal class", "Save clips", "Human review"],
    metrics: ["Confidence", "Events today", "Queue"],
    actions: ["Tune threshold", "Review queue", "Export clips"],
  },
  alerts: {
    label: "Alerts",
    description: "Configure notification routing, severity filters, and quiet hours.",
    deviceTypes: ["Siren", "Beacon", "Notification bridge"],
    options: ["Push alerts", "SMS alerts", "Quiet hours", "Escalation"],
    metrics: ["Open alerts", "Last alert", "Muted until"],
    actions: ["Send test", "Acknowledge all", "Review rules"],
  },
  rails: {
    label: "Rails",
    description: "Configure rail modules, segments, carriages, home sensors, and service zones.",
    deviceTypes: ["Rail segment", "Carriage", "Home sensor", "Power injector"],
    defaultDevices: [{ id: "rail-segment-a", name: "Rail Segment A", type: "Rail segment", status: "setup" }],
    options: ["Segment map", "Service zone", "Collision guard"],
    metrics: ["Segment health", "Carriage position", "Power state"],
    actions: ["Scan rail", "Home carriage", "Run segment test"],
  },
};

const DEFAULT_CONFIG: SectionConfig = {
  label: "Section",
  description: "Configure product-specific devices, automation options, and telemetry for this section.",
  deviceTypes: ["Controller", "Sensor", "Actuator"],
  options: ["Enabled", "Telemetry logging", "Simulation mode"],
  metrics: ["Status", "Automation", "Telemetry"],
  actions: ["Configure", "Run test", "Simulate"],
};

const getStorageKey = (product: string, section: string) => `tendercells_section_devices:${product}:${section}`;
const getOptionsStorageKey = (product: string, section: string) => `tendercells_section_options:${product}:${section}`;

const getConfig = (section: string) => SECTION_CONFIG[section] || DEFAULT_CONFIG;
const getDefaultEnabledOptions = (config: SectionConfig) =>
  config.options.slice(0, Math.ceil(config.options.length / 2));

export default function ProductSectionPanel({ product, section }: ProductSectionPanelProps) {
  const config = getConfig(section);
  const productLabel = PRODUCT_LABELS[product] || product;
  const storageKey = getStorageKey(product, section);
  const optionsStorageKey = getOptionsStorageKey(product, section);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingDevice, setEditingDevice] = useState<SectionDevice | null>(null);
  const [deviceName, setDeviceName] = useState("");
  const [deviceType, setDeviceType] = useState(config.deviceTypes?.[0] || "Controller");
  const [deviceStatus, setDeviceStatus] = useState<SectionDevice["status"]>("setup");
  const [devices, setDevices] = useState<SectionDevice[]>(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        return JSON.parse(saved) as SectionDevice[];
      } catch {
        return config.defaultDevices || [];
      }
    }

    return config.defaultDevices || [];
  });
  const [enabledOptions, setEnabledOptions] = useState<string[]>(() => {
    const saved = localStorage.getItem(optionsStorageKey);
    if (saved) {
      try {
        return JSON.parse(saved) as string[];
      } catch {
        return getDefaultEnabledOptions(config);
      }
    }

    return getDefaultEnabledOptions(config);
  });

  const canAddDevices = Boolean(config.deviceTypes?.length);

  useEffect(() => {
    const saved = localStorage.getItem(storageKey);
    if (saved) {
      try {
        setDevices(JSON.parse(saved) as SectionDevice[]);
      } catch {
        setDevices(config.defaultDevices || []);
      }
    } else {
      setDevices(config.defaultDevices || []);
    }

    const savedOptions = localStorage.getItem(optionsStorageKey);
    if (savedOptions) {
      try {
        setEnabledOptions(JSON.parse(savedOptions) as string[]);
      } catch {
        setEnabledOptions(getDefaultEnabledOptions(config));
      }
    } else {
      setEnabledOptions(getDefaultEnabledOptions(config));
    }

    setEditingDevice(null);
    setDialogOpen(false);
    setDeviceName("");
    setDeviceType(config.deviceTypes?.[0] || "Controller");
    setDeviceStatus("setup");
  }, [config, optionsStorageKey, storageKey]);

  const saveDevices = (nextDevices: SectionDevice[]) => {
    setDevices(nextDevices);
    localStorage.setItem(storageKey, JSON.stringify(nextDevices));
  };

  const saveOptions = (nextOptions: string[]) => {
    setEnabledOptions(nextOptions);
    localStorage.setItem(optionsStorageKey, JSON.stringify(nextOptions));
  };

  const openAddDialog = () => {
    setEditingDevice(null);
    setDeviceName("");
    setDeviceType(config.deviceTypes?.[0] || "Controller");
    setDeviceStatus("setup");
    setDialogOpen(true);
  };

  const openEditDialog = (device: SectionDevice) => {
    setEditingDevice(device);
    setDeviceName(device.name);
    setDeviceType(device.type);
    setDeviceStatus(device.status);
    setDialogOpen(true);
  };

  const handleSaveDevice = () => {
    const trimmedName = deviceName.trim();
    if (!trimmedName) return;

    if (editingDevice) {
      saveDevices(
        devices.map((device) =>
          device.id === editingDevice.id
            ? { ...device, name: trimmedName, type: deviceType, status: deviceStatus }
            : device
        )
      );
    } else {
      saveDevices([
        ...devices,
        {
          id: `${section}-${Date.now()}`,
          name: trimmedName,
          type: deviceType,
          status: deviceStatus,
        },
      ]);
    }

    setDeviceName("");
    setDeviceType(config.deviceTypes?.[0] || "Controller");
    setDeviceStatus("setup");
    setEditingDevice(null);
    setDialogOpen(false);
  };

  const handleDeleteDevice = (deviceId: string) => {
    saveDevices(devices.filter((device) => device.id !== deviceId));
  };

  const handleStatusChange = (deviceId: string, status: SectionDevice["status"]) => {
    saveDevices(devices.map((device) => (device.id === deviceId ? { ...device, status } : device)));
  };

  const handleOptionChange = (option: string, enabled: boolean) => {
    const nextOptions = enabled
      ? Array.from(new Set([...enabledOptions, option]))
      : enabledOptions.filter((enabledOption) => enabledOption !== option);
    saveOptions(nextOptions);
  };

  return (
    <Paper elevation={2} sx={{ p: 2, mt: 2, border: "1px solid #1F5C3B" }}>
      <Stack
        direction={{ xs: "column", sm: "row" }}
        spacing={1}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        sx={{ mb: 1 }}
      >
        <Box>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 0.5 }}>
            <Typography variant="h6" sx={{ color: "#E4E7E5" }}>
              {config.label}
            </Typography>
            <Chip label={productLabel} size="small" sx={{ bgcolor: "#1A3D2B", color: "#C8B882" }} />
          </Stack>
          <Typography variant="body2" color="text.secondary">
            {config.description}
          </Typography>
        </Box>
        {canAddDevices && (
          <Button variant="contained" startIcon={<AddIcon />} onClick={openAddDialog}>
            Add Device
          </Button>
        )}
      </Stack>

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", lg: "1.2fr 1fr" }, gap: 2, mt: 2 }}>
        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#002017", borderColor: "#1F5C3B" }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <BuildIcon fontSize="small" sx={{ color: "#6BBF59" }} />
            <Typography variant="subtitle2">Devices</Typography>
          </Stack>
          {devices.length === 0 ? (
            <Box sx={{ p: 2, border: "1px dashed #4A7C59", borderRadius: 1, textAlign: "center" }}>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                No devices added for {config.label.toLowerCase()}.
              </Typography>
              {canAddDevices && (
                <Button size="small" startIcon={<AddIcon />} onClick={openAddDialog}>
                  Add First Device
                </Button>
              )}
            </Box>
          ) : (
            <Stack spacing={1}>
              {devices.map((device) => (
                <Box
                  key={device.id}
                  sx={{
                    p: 1.25,
                    borderRadius: 1,
                    bgcolor: "#001B14",
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: { xs: "stretch", sm: "center" },
                    gap: 1,
                    flexDirection: { xs: "column", sm: "row" },
                  }}
                >
                  <Box>
                    <Typography variant="body2" sx={{ color: "#E4E7E5", fontWeight: 700 }}>
                      {device.name}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {device.type}
                    </Typography>
                  </Box>
                  <Stack direction="row" spacing={0.5} alignItems="center" justifyContent="flex-end">
                    <TextField
                      select
                      size="small"
                      value={device.status}
                      onChange={(event) => handleStatusChange(device.id, event.target.value as SectionDevice["status"])}
                      sx={{ minWidth: 112 }}
                    >
                      <MenuItem value="ready">ready</MenuItem>
                      <MenuItem value="setup">setup</MenuItem>
                      <MenuItem value="offline">offline</MenuItem>
                    </TextField>
                    <Tooltip title="Edit device">
                      <IconButton size="small" onClick={() => openEditDialog(device)} aria-label={`Edit ${device.name}`}>
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Delete device">
                      <IconButton
                        size="small"
                        color="error"
                        onClick={() => handleDeleteDevice(device.id)}
                        aria-label={`Delete ${device.name}`}
                      >
                        <DeleteIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </Box>
              ))}
            </Stack>
          )}
        </Paper>

        <Paper variant="outlined" sx={{ p: 1.5, bgcolor: "#002017", borderColor: "#1F5C3B" }}>
          <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 1 }}>
            <SettingsIcon fontSize="small" sx={{ color: "#6BBF59" }} />
            <Typography variant="subtitle2">Options</Typography>
          </Stack>
          <Stack spacing={0.5}>
            {config.options.map((option) => (
              <Box key={option} sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <Typography variant="body2">{option}</Typography>
                <Switch
                  size="small"
                  checked={enabledOptions.includes(option)}
                  onChange={(event) => handleOptionChange(option, event.target.checked)}
                />
              </Box>
            ))}
          </Stack>
        </Paper>
      </Box>

      <Divider sx={{ my: 2 }} />

      <Box sx={{ display: "grid", gridTemplateColumns: { xs: "1fr", sm: "repeat(3, 1fr)" }, gap: 1.5 }}>
        {config.metrics.map((label) => (
          <Box key={label} sx={{ p: 1.5, bgcolor: "#002017", borderRadius: 1 }}>
            <Typography variant="caption" color="text.secondary">
              {label}
            </Typography>
            <Typography variant="body2" sx={{ color: "#E4E7E5" }}>
              Ready
            </Typography>
          </Box>
        ))}
      </Box>

      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{ mt: 2 }}>
        {config.actions.map((action) => (
          <Button key={action} size="small" variant="outlined" startIcon={<PlayArrowIcon />}>
            {action}
          </Button>
        ))}
      </Stack>

      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>{editingDevice ? "Edit" : "Add"} {config.label} Device</DialogTitle>
        <DialogContent sx={{ pt: 2 }}>
          <TextField
            label="Device Name"
            value={deviceName}
            onChange={(event) => setDeviceName(event.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          />
          <TextField
            select
            label="Device Type"
            value={deviceType}
            onChange={(event) => setDeviceType(event.target.value)}
            fullWidth
            sx={{ mb: 2 }}
          >
            {(config.deviceTypes || []).map((type) => (
              <MenuItem key={type} value={type}>
                {type}
              </MenuItem>
            ))}
          </TextField>
          <TextField
            select
            label="Status"
            value={deviceStatus}
            onChange={(event) => setDeviceStatus(event.target.value as SectionDevice["status"])}
            fullWidth
          >
            <MenuItem value="ready">ready</MenuItem>
            <MenuItem value="setup">setup</MenuItem>
            <MenuItem value="offline">offline</MenuItem>
          </TextField>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>Cancel</Button>
          <Button onClick={handleSaveDevice} variant="contained" disabled={!deviceName.trim()}>
            {editingDevice ? "Save Device" : "Add Device"}
          </Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
}
