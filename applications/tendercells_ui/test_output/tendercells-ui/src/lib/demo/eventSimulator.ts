// eventSimulator.ts - "Trigger an event" for the public demo.
//
// Each scenario is a real Tender Cells cause -> effect chain (device -> signal -> AI / rule ->
// Tender Cells OS -> actuator -> action -> notification). Running one:
//   1. plays the chain step by step in the UI (EventSimulatorPage),
//   2. applies its effect to the demo's own state where one exists (door, water, feed,
//      temperature, egg map) so the device pages show the change,
//   3. writes an entry to the event log with the full chain - the "Why did this happen?"
//      explanation - and links to how it works, how to build it and where to see it.
// Everything is simulation: nothing is sent to hardware.
import { updateDemoEquipment, DEMO_DEVICES } from "../../services/demo/demoEnvironment";
import { eggService } from "../../services/eggService";
import { DEMO_PROPERTY_ID, deviceTwinId, type SourceType } from "../twin/twin";
import { DEMO_MOWER_ID, simForceMowing, simMowers } from "../mower/mowerSim";

export type ChainKind = "device" | "signal" | "ai" | "rule" | "os" | "actuator" | "action" | "notify";

export interface ChainStep { kind: ChainKind; actor: string; detail: string }

export interface Scenario {
  id: string;
  title: string;
  emoji: string;
  /** One line: what happens, in real-world terms. */
  summary: string;
  steps: ChainStep[];
  /** What the owner sees at the end. */
  outcome: string;
  /** Concepts a student learns from it. */
  concepts: string[];
  /** OS page that shows the result. */
  see: { label: string; path: string };
  /** Website pages: how it works / build it. */
  learn: { label: string; href: string };
  build: { label: string; href: string };
  /** The twin this event changes (docs/TENDERCELLS_DIGITAL_TWIN_ARCHITECTURE.md). */
  twin: string;
  apply?: () => Promise<void> | void;
}

/**
 * Where each step's data would come from on a live farm. In the demo every value is
 * SIMULATED; the UI shows both so simulated and real data are never confused.
 */
export const LIVE_SOURCE: Record<ChainKind, SourceType> = {
  device: "SENSED", signal: "SENSED", ai: "INFERRED", rule: "CALCULATED", os: "CALCULATED",
  actuator: "COMMAND_STATE", action: "SENSED", notify: "CALCULATED",
};

/** Provenance of every demo event. */
export const DEMO_SOURCE = { source: "Tender Cells demo simulator", mode: "SIMULATED" as SourceType };

export interface EventLogEntry {
  id: string;
  scenarioId: string;
  title: string;
  emoji: string;
  outcome: string;
  steps: ChainStep[];
  at: number;
  /** Twin ID of the entity the event changed. */
  twin?: string;
  /** The reader opened "Why did this happen?" (missions use it). */
  explained?: boolean;
}

const CT = DEMO_DEVICES.chickenTender;

export const SCENARIOS: Scenario[] = [
  {
    id: "predator",
    twin: deviceTwinId(CT),
    title: "Predator detected",
    emoji: "🦊",
    summary: "A camera spots a fox near the coop at dusk; the door closes and you are told.",
    steps: [
      { kind: "device", actor: "WatchTower camera", detail: "Motion near the coop run (camera 2, 18 m)" },
      { kind: "ai", actor: "Vision model", detail: "Classified: fox, 87% confidence" },
      { kind: "rule", actor: "Predator rule", detail: "Predator ≥ 80% confidence and animals outside or after dusk" },
      { kind: "os", actor: "Tender Cells OS", detail: "Runs the safety automation; checks E-STOP is clear" },
      { kind: "actuator", actor: "Chicken Tender door controller", detail: "Close door (limit switch confirms closed)" },
      { kind: "action", actor: "Coop door", detail: "Door closed" },
      { kind: "notify", actor: "Owner alert", detail: "\"Fox near the coop - door closed at 6:47 PM\"" },
    ],
    outcome: "Chicken Tender door closed and you were alerted.",
    concepts: ["computer vision", "confidence thresholds", "event handling", "actuators", "safety interlocks"],
    see: { label: "Predator monitor", path: "/predator-monitor" },
    learn: { label: "Predator Monitoring Guide", href: "/guides/predator-monitoring" },
    build: { label: "Build a camera node", href: "/guides/camera-node-first-build" },
    apply: () => { updateDemoEquipment(CT, { door: "closed" }); },
  },
  {
    id: "sunset",
    twin: deviceTwinId(CT),
    title: "Sunset - close the coop",
    emoji: "🌇",
    summary: "The light sensor sees dusk; the door closes once the birds are inside.",
    steps: [
      { kind: "device", actor: "Light sensor", detail: "Light fell below 40 lux for 5 minutes" },
      { kind: "signal", actor: "Headcount", detail: "7 of 7 hens inside (door RFID count)" },
      { kind: "rule", actor: "Dusk rule", detail: "Dark and everyone home → close; otherwise wait up to 15 min" },
      { kind: "os", actor: "Tender Cells OS", detail: "Schedules the close and logs it" },
      { kind: "actuator", actor: "Door controller", detail: "Close door, limit switch confirms" },
      { kind: "action", actor: "Coop door", detail: "Door closed for the night" },
      { kind: "notify", actor: "Daily summary", detail: "\"Coop closed at 7:52 PM - all 7 hens in\"" },
    ],
    outcome: "Door closed at dusk with every hen inside.",
    concepts: ["sensors", "schedules", "conditional logic", "limit switches"],
    see: { label: "Schedules", path: "/schedules" },
    learn: { label: "Sensors → Automation lesson", href: "/lessons/sensors-automation" },
    build: { label: "Build the door", href: "/lessons/door-roaming-roost" },
    apply: () => { updateDemoEquipment(CT, { door: "closed" }); },
  },
  {
    id: "egg-laid",
    twin: deviceTwinId(CT),
    title: "Egg laid",
    emoji: "🥚",
    summary: "A hen leaves a nest box; the camera finds a new egg and the egg map updates.",
    steps: [
      { kind: "device", actor: "Nest-box camera", detail: "Hen left nest box 2" },
      { kind: "ai", actor: "ChickenEye", detail: "New egg detected (brown, 90%)" },
      { kind: "os", actor: "Tender Cells OS", detail: "Updates today's egg map" },
      { kind: "notify", actor: "Egg flag", detail: "\"Eggs ready for pickup\" on the property map" },
    ],
    outcome: "A new egg is on today's egg map, waiting for pickup.",
    concepts: ["computer vision", "data records", "production tracking"],
    see: { label: "Egg map", path: "/egg-map" },
    learn: { label: "Chicken Tender product doc", href: "/docs/chicken-tender" },
    build: { label: "Your First Coop Brain", href: "/lessons/your-first-coop-brain" },
    apply: async () => {
      const day = await eggService.getDay(CT);
      const empty = day.nestBoxes.find((b) => !b.hasEgg) ?? day.nestBoxes[0];
      if (empty) await eggService.markLaid(CT, empty.id);
    },
  },
  {
    id: "water-low",
    twin: deviceTwinId(CT),
    title: "Water level low",
    emoji: "💧",
    summary: "The waterer drops to 12%; the valve tops it up and you are told.",
    steps: [
      { kind: "device", actor: "Water level sensor", detail: "Waterer at 12% (3-sample average)" },
      { kind: "rule", actor: "Low-water rule", detail: "Below 15% → top up and alert" },
      { kind: "os", actor: "Tender Cells OS", detail: "Starts the water top-up routine" },
      { kind: "actuator", actor: "Water valve relay", detail: "Open 40 s (timeout guard)" },
      { kind: "action", actor: "Waterer", detail: "Refilled to 95%" },
      { kind: "notify", actor: "Owner alert", detail: "\"Water was low - refilled\"" },
    ],
    outcome: "Waterer refilled from 12% to 95%.",
    concepts: ["analog sensors", "thresholds", "relays", "timeouts"],
    see: { label: "Chicken Tender", path: "/chicken-tender" },
    learn: { label: "Feeder + Waterer lesson", href: "/lessons/feeder-waterer" },
    build: { label: "Build a water monitor", href: "/lessons/feeder-waterer" },
    apply: () => { updateDemoEquipment(CT, { waterLevelPct: 95 }); },
  },
  {
    id: "feed-low",
    twin: deviceTwinId(CT),
    title: "Feed level low",
    emoji: "🌾",
    summary: "The hopper load cell reads 15%; you get a refill reminder.",
    steps: [
      { kind: "device", actor: "Feed load cell", detail: "Hopper at 15% (1.2 kg)" },
      { kind: "rule", actor: "Low-feed rule", detail: "Below 20% → remind the owner" },
      { kind: "os", actor: "Tender Cells OS", detail: "Creates a refill task" },
      { kind: "notify", actor: "Owner alert", detail: "\"Feed low - about 2 days left\"" },
    ],
    outcome: "Refill reminder created (feed at 15%).",
    concepts: ["load cells", "thresholds", "estimating from data"],
    see: { label: "Chicken Tender", path: "/chicken-tender" },
    learn: { label: "Feeder + Waterer lesson", href: "/lessons/feeder-waterer" },
    build: { label: "Build a feeder", href: "/lessons/feeder-waterer" },
    apply: () => { updateDemoEquipment(CT, { feedLevelPct: 15 }); },
  },
  {
    id: "heat",
    twin: deviceTwinId(CT),
    title: "Coop too hot",
    emoji: "🌡️",
    summary: "The coop reaches 92°F; the fan turns on and you get a heat-stress warning.",
    steps: [
      { kind: "device", actor: "Temperature / humidity sensor", detail: "92°F, 70% humidity" },
      { kind: "rule", actor: "Heat rule", detail: "Above 85°F → ventilate and warn" },
      { kind: "os", actor: "Tender Cells OS", detail: "Runs the cooling routine" },
      { kind: "actuator", actor: "Fan relay", detail: "Fan on" },
      { kind: "action", actor: "Coop", detail: "Cooling to 84°F" },
      { kind: "notify", actor: "Owner alert", detail: "\"Heat stress risk - check water and shade\"" },
    ],
    outcome: "Fan on; coop cooling from 92°F to 84°F.",
    concepts: ["temperature sensing", "animal welfare thresholds", "relays"],
    see: { label: "Chicken Tender", path: "/chicken-tender" },
    learn: { label: "Smart Chicken Coop Guide", href: "/guides/smart-chicken-coop" },
    build: { label: "Build a sensor node", href: "/lessons/your-first-coop-brain" },
    apply: () => { updateDemoEquipment(CT, { sensors: { tempF: 84 } }); },
  },
  {
    id: "missing-hen",
    twin: deviceTwinId(CT),
    title: "Hen missing at dusk",
    emoji: "🐔",
    summary: "Headcount is 6 of 7 at dusk; the door waits and you are told where to look.",
    steps: [
      { kind: "device", actor: "Door RFID reader", detail: "6 of 7 hens inside" },
      { kind: "rule", actor: "Headcount rule", detail: "Missing bird at dusk → hold door open 15 min, alert" },
      { kind: "os", actor: "Tender Cells OS", detail: "Finds Henrietta's last reading: the garden, 5:40 PM" },
      { kind: "notify", actor: "Owner alert", detail: "\"Henrietta is not in - last seen by the garden\"" },
    ],
    outcome: "Door held open; you know where the missing hen was last seen.",
    concepts: ["RFID", "counting", "rules with exceptions"],
    see: { label: "Animal roster", path: "/animals" },
    learn: { label: "Mobile coop & pasture guide", href: "/guides/pasture-rotation" },
    build: { label: "Build the door", href: "/lessons/door-roaming-roost" },
    apply: () => { updateDemoEquipment(CT, { door: "open" }); },
  },
  {
    id: "leak",
    twin: DEMO_PROPERTY_ID,
    title: "Rover finds a water leak",
    emoji: "🚰",
    summary: "The rover's camera sees standing water by the spigot and pins it on the map.",
    steps: [
      { kind: "device", actor: "Weed rover camera", detail: "Checking the ground around the garden spigot" },
      { kind: "ai", actor: "Wet-ground check", detail: "Wet area 4 ft across - much wetter than this spot usually is" },
      { kind: "rule", actor: "Leak rule", detail: "One open leak per water point" },
      { kind: "os", actor: "Tender Cells OS", detail: "Pins the leak on the 2D and 3D property map" },
      { kind: "notify", actor: "Owner alert", detail: "\"Water leak at Garden spigot\"" },
    ],
    outcome: "Leak pinned on the property map at the spigot.",
    concepts: ["mobile robots", "change detection", "maps"],
    see: { label: "Weed patrol", path: "/weed-patrol" },
    learn: { label: "Rover patrol: animals and leaks", href: "/docs/weed-patrol#weed-patrol-on-a-rover" },
    build: { label: "Build a device for the OS", href: "/os#build" },
  },
  {
    id: "mower-flock",
    twin: deviceTwinId(DEMO_MOWER_ID),
    title: "Hens let out while the mower runs",
    emoji: "🚜",
    summary: "Your own robot mower is out on its schedule when the coop door opens; Tender Cells sends it home.",
    steps: [
      { kind: "device", actor: "Chicken Tender door", detail: "Opened - the flock can reach the lawn" },
      { kind: "signal", actor: "Door sensor", detail: "doorState: open (tc/ct_001/sensors)" },
      { kind: "rule", actor: "Mower interlock", detail: "A guarded coop is open and the mower is mowing" },
      { kind: "os", actor: "Tender Cells OS", detail: "Hub mower bridge acts on the linked mower" },
      { kind: "actuator", actor: "Robot mower (hub mower bridge)", detail: "Pause, then return to dock - and hold it there" },
      { kind: "action", actor: "Robot mower", detail: "Returning to its dock" },
      { kind: "notify", actor: "Owner alert", detail: "\"Mower sent home - the flock is out\"" },
    ],
    outcome: "Mower sent home; it cannot start again until the door is closed.",
    concepts: ["interlocks", "integrations", "animal safety"],
    see: { label: "Robot mowers", path: "/mowers" },
    learn: { label: "Bring your own robot mower", href: "/docs/robot-mowers" },
    build: { label: "Link your mower", href: "/docs/robot-mowers#link-a-home-assistant-mower" },
    apply: () => {
      simForceMowing();
      updateDemoEquipment(CT, { door: "open" });
      simMowers(); // the interlock sends the mowing mower home
    },
  },
  {
    id: "offline",
    twin: deviceTwinId(DEMO_DEVICES.watchTower),
    title: "Device offline",
    emoji: "📡",
    summary: "WatchTower misses its check-ins; the OS marks it offline and flags it.",
    steps: [
      { kind: "device", actor: "WatchTower", detail: "No heartbeat for 3 intervals" },
      { kind: "signal", actor: "MQTT broker", detail: "Last-will message: offline" },
      { kind: "os", actor: "Tender Cells OS", detail: "Marks it offline; diagnostic code 10 (Wi-Fi lost)" },
      { kind: "notify", actor: "Owner alert", detail: "\"WatchTower offline - check power and Wi-Fi\"" },
    ],
    outcome: "WatchTower shown offline with a diagnostic code.",
    concepts: ["networking", "heartbeats", "diagnostics"],
    see: { label: "Diagnostics", path: "/diagnostics" },
    learn: { label: "Connect a device", href: "/docs/connect-a-device" },
    build: { label: "Build a device for the OS", href: "/os#build" },
  },
];

export const scenarioById = (id: string): Scenario | undefined => SCENARIOS.find((s) => s.id === id);

// ── event log (this browser) ───────────────────────────────────────────────────
export const EVENT_LOG_KEY = "tendercells_demo_event_log_v1";
export const EVENT_LOG_EVENT = "tendercells-demo-event-log";
const MAX_LOG = 30;

export function readEventLog(): EventLogEntry[] {
  try {
    const raw = localStorage.getItem(EVENT_LOG_KEY);
    return raw ? (JSON.parse(raw) as EventLogEntry[]) : [];
  } catch {
    return [];
  }
}

function writeEventLog(log: EventLogEntry[]): void {
  try { localStorage.setItem(EVENT_LOG_KEY, JSON.stringify(log.slice(0, MAX_LOG))); } catch { /* storage unavailable */ }
  window.dispatchEvent(new CustomEvent(EVENT_LOG_EVENT));
}

/**
 * Run a scenario: apply its effect to the demo state and log it (newest first).
 *
 * @returns The log entry, with the full cause -> effect chain
 */
export async function runScenario(id: string, now: number = Date.now()): Promise<EventLogEntry> {
  const s = scenarioById(id);
  if (!s) throw new Error(`Unknown event ${id}`);
  await s.apply?.();
  const entry: EventLogEntry = { id: `${id}-${now}`, scenarioId: id, title: s.title, emoji: s.emoji, outcome: s.outcome, steps: s.steps, at: now, twin: s.twin };
  writeEventLog([entry, ...readEventLog()]);
  return entry;
}

/** Remember that "Why did this happen?" was opened for an entry. */
export function markExplained(entryId: string): void {
  writeEventLog(readEventLog().map((e) => (e.id === entryId ? { ...e, explained: true } : e)));
}

export function clearEventLog(): void {
  writeEventLog([]);
}
