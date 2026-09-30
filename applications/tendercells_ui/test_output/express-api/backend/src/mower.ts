// mower.ts - bring-your-own robot mower: the pure parts (types, validation, vendor state
// mapping, capabilities and the animal-safety interlock). The runtime (polling, commands,
// storage) is in mowerBridge.ts; vendor HTTP clients are in mowerVendors.ts.
// See docs/ROBOT_MOWERS.md.
//
// Tender Cells does not drive the mower's wheels or blades. The mower keeps its own
// navigation, boundary wire / RTK map, lift and tilt blade stops. Tender Cells adds what
// the mower cannot know: whether the flock is out on the lawn, whether an animal was just
// seen there, the wildlife quiet hours and the property E-STOP. It refuses to start the
// mower and holds it at home the moment any of those is true.
//
// Adapters:
//   husqvarna       Husqvarna Automower Connect API (official; app key + secret on the hub)
//   gardena         GARDENA smart system API - SILENO mowers (official; same developer portal)
//   home-assistant  Any lawn_mower entity: Segway Navimow (Segway's official integration),
//                   Ecovacs GOAT (Home Assistant core), Worx / Kress / LandXcape, Mammotion,
//                   Dreame / MOVA, Bosch Indego, STIHL iMOW (community integrations)
//   mammotion       Mammotion Open API - LUBA / YUKA (official; 2025+ models; saved plans)
//   mqtt            DIY / OpenMower-style bridges speaking tc/{id}/cmd/mower

export type MowerAdapter = "home-assistant" | "mqtt" | "husqvarna" | "gardena" | "mammotion";
export type MowerActivity = "mowing" | "leaving" | "docked" | "paused" | "returning" | "error" | "unknown";

/**
 * start               mow now (optionally for durationMin, optionally in one work area)
 * resume_schedule     go back to the mower's own schedule
 * pause               stop where it is
 * park_until_next_schedule  go home, mow again at the next scheduled time
 * dock                go home and stay until told otherwise ("park until further notice")
 */
export type MowerAction = "start" | "resume_schedule" | "pause" | "park_until_next_schedule" | "dock";
export const MOWER_ACTIONS: MowerAction[] = ["start", "resume_schedule", "pause", "park_until_next_schedule", "dock"];
/** Actions that can send the mower out onto the lawn - these are interlocked. */
export const GO_ACTIONS: ReadonlySet<MowerAction> = new Set(["start", "resume_schedule"]);

/**
 * Mowing patterns. "auto" = the mower's own default (random or its app's setting).
 * stripes: parallel lanes at angleDeg · checkerboard: two perpendicular passes ·
 * diamond: two passes at +-45deg to angleDeg · spiral: outside-in loops · perimeter: edges only.
 */
export type MowPattern = "auto" | "stripes" | "checkerboard" | "diamond" | "spiral" | "perimeter";
export const MOW_PATTERNS: MowPattern[] = ["auto", "stripes", "checkerboard", "diamond", "spiral", "perimeter"];

/** Where the pattern is decided - honest per brand. */
export type PatternSupport =
  | "custom"       // Tender Cells sends the pattern (native MQTT / OpenMower-style mowers)
  | "vendor-area"  // pick a vendor work area; its pattern is set in the vendor app (Husqvarna)
  | "vendor-plan"  // run a saved vendor plan by name; pattern is part of the plan (Mammotion)
  | null;          // basic start / park only (GARDENA, Home Assistant)

/** A start request. Basic = mow now (optionally for a time); advanced adds where and how. */
export interface StartOptions {
  durationMin?: number;
  /** Husqvarna work area. */
  workAreaId?: number;
  /** Mammotion saved plan (task) name. */
  vendorTask?: string;
  pattern?: MowPattern;
  /** Stripe direction, degrees clockwise from map north. */
  angleDeg?: number;
  /** Extra laps around the edge before the pattern. */
  edgePasses?: number;
  /** Lane overlap, percent of blade width. */
  overlapPct?: number;
  /** Cutting height for this run, mm (custom-pattern mowers). */
  cuttingHeightMm?: number;
  /** Area to mow in property feet (custom-pattern mowers), drawn on the Property Twin. */
  area?: { x: number; y: number; width: number; depth: number };
}

export type HeadlightMode = "ALWAYS_ON" | "ALWAYS_OFF" | "EVENING_ONLY" | "EVENING_AND_NIGHT";
export const HEADLIGHT_MODES: HeadlightMode[] = ["ALWAYS_ON", "ALWAYS_OFF", "EVENING_ONLY", "EVENING_AND_NIGHT"];

/** One weekly schedule slot (Husqvarna calendar task). start/duration in minutes. */
export interface ScheduleTask {
  start: number;
  duration: number;
  monday: boolean; tuesday: boolean; wednesday: boolean; thursday: boolean; friday: boolean; saturday: boolean; sunday: boolean;
  workAreaId?: number;
}
const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

/** What a mower (through its adapter) can do - drives which controls the app shows. */
export interface MowerCapabilities {
  actions: MowerAction[];
  startDuration: boolean;
  workAreas: boolean;
  cuttingHeight: { min: number; max: number } | null;
  headlight: boolean;
  schedule: "read" | "write" | null;
  stayOutZones: boolean;
  confirmError: boolean;
  position: boolean;
  patterns: PatternSupport;
}

/** Per-adapter baseline; Husqvarna narrows it further from the mower's own capabilities. */
export const ADAPTER_CAPABILITIES: Record<MowerAdapter, MowerCapabilities> = {
  husqvarna: {
    actions: ["start", "resume_schedule", "pause", "park_until_next_schedule", "dock"],
    startDuration: true, workAreas: true, cuttingHeight: { min: 1, max: 9 }, headlight: true, schedule: "write",
    stayOutZones: true, confirmError: true, position: true, patterns: "vendor-area",
  },
  gardena: {
    actions: ["start", "resume_schedule", "park_until_next_schedule", "dock"],
    startDuration: true, workAreas: false, cuttingHeight: null, headlight: false, schedule: null,
    stayOutZones: false, confirmError: false, position: false, patterns: null,
  },
  mammotion: {
    actions: ["start", "resume_schedule", "pause", "dock"],
    startDuration: false, workAreas: false, cuttingHeight: null, headlight: false, schedule: null,
    stayOutZones: false, confirmError: false, position: false, patterns: "vendor-plan",
  },
  "home-assistant": {
    actions: ["start", "pause", "dock"],
    startDuration: false, workAreas: false, cuttingHeight: null, headlight: false, schedule: null,
    stayOutZones: false, confirmError: false, position: false, patterns: null,
  },
  mqtt: {
    actions: ["start", "resume_schedule", "pause", "park_until_next_schedule", "dock"],
    startDuration: true, workAreas: false, cuttingHeight: null, headlight: false, schedule: null,
    stayOutZones: false, confirmError: false, position: false, patterns: "custom",
  },
};

export interface QuietHours {
  /** Local hour 0-23 when mowing stops (e.g. 20 = 8 pm). */
  start: number;
  /** Local hour 0-23 when mowing may resume (e.g. 7 = 7 am). */
  end: number;
}

export interface MowerLink {
  deviceId: string;
  name: string;
  adapter: MowerAdapter;
  /** Home Assistant lawn_mower entity, e.g. lawn_mower.front_yard. */
  entityId?: string;
  /** Optional Home Assistant battery sensor, e.g. sensor.front_yard_battery. */
  batteryEntityId?: string;
  /** Husqvarna mower id, or GARDENA mower service id. */
  vendorId?: string;
  /** GARDENA location that holds the mower. */
  locationId?: string;
  /** Animal habitats whose door must be closed (flock inside) before the mower may run. */
  guardHabitats: string[];
  /** The owner confirmed no animals ever roam where this mower works (guardHabitats empty). */
  noAnimalsConfirmed: boolean;
  /** No mowing between these hours (hedgehogs, toads and other night wildlife). null = off. */
  quietHours: QuietHours | null;
  /**
   * When the interlock clears (animals back in, morning), put the mower back on its own
   * schedule. Opt-in: the owner pre-authorizes this instead of confirming each time.
   */
  autoResume?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface MowerInterlockEvent { reason: string; at: number; action: "refused" | "sent-home" | "held" | "resumed" }

/** Vendor details the app mirrors (what the mower's own app shows). */
export interface MowerDetails {
  vendorActivity?: string;
  vendorState?: string;
  mode?: string;
  cuttingHeight?: number;
  headlight?: HeadlightMode;
  schedule?: ScheduleTask[];
  stayOutZones?: { id: string; name: string; enabled: boolean }[];
  workAreas?: { id: number; name: string; cuttingHeight?: number }[];
  position?: { lat: number; lon: number };
  nextStart?: number;
  errorCode?: number;
  errorConfirmable?: boolean;
  model?: string;
  /** Saved plans on the mower's account (Mammotion). */
  plans?: { id: string; name: string }[];
}

/** What tc/{id}/state/mower carries (published retained by the bridge or by a native mower). */
export interface MowerState {
  activity: MowerActivity;
  battery?: number;
  error?: string;
  online: boolean;
  /** Where the data came from: a vendor cloud / Home Assistant (EXTERNAL) or the mower (SENSED). */
  source: "home-assistant" | "husqvarna" | "gardena" | "mammotion" | "device";
  entityId?: string;
  estop?: boolean;
  /** Tender Cells is holding it at home until the interlock clears. */
  held?: boolean;
  details?: MowerDetails;
  capabilities?: MowerCapabilities;
  lastInterlock?: MowerInterlockEvent;
  ts: number;
}

export const DEFAULT_QUIET_HOURS: QuietHours = { start: 20, end: 7 };
/** An animal seen on the lawn this recently blocks the mower. */
export const ANIMAL_SEEN_WINDOW_MS = 15 * 60_000;
/** A habitat's door state older than this cannot prove the flock is inside. */
export const HABITAT_STATE_MAX_AGE_MS = 60_000;

const DEVICE_ID = /^[A-Za-z0-9_-]{1,40}$/;
const HA_MOWER = /^lawn_mower\.[a-z0-9_]{1,80}$/;
const HA_SENSOR = /^sensor\.[a-z0-9_]{1,80}$/;
const VENDOR_ID = /^[A-Za-z0-9:_-]{1,80}$/;
const ADAPTERS: MowerAdapter[] = ["home-assistant", "mqtt", "husqvarna", "gardena", "mammotion"];
const hour = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 23;
const int = (v: unknown, min: number, max: number) => typeof v === "number" && Number.isInteger(v) && v >= min && v <= max;

/**
 * Validate a link / settings body.
 *
 * @param body    - Request body
 * @param partial - true for a settings update (fields optional)
 * @returns An error message, or null when valid
 */
export function validateMowerLink(body: unknown, partial = false): string | null {
  if (typeof body !== "object" || body === null) return "Body must be a JSON object";
  const b = body as Record<string, unknown>;
  const has = (k: string) => b[k] !== undefined;
  if (!partial || has("name")) {
    if (typeof b.name !== "string" || !b.name.trim() || b.name.length > 60) return "name must be 1-60 characters";
  }
  if (!partial || has("adapter")) {
    if (!ADAPTERS.includes(b.adapter as MowerAdapter)) return `adapter must be one of: ${ADAPTERS.join(", ")}`;
  }
  if (!partial) {
    if (b.adapter === "home-assistant" && !(typeof b.entityId === "string" && HA_MOWER.test(b.entityId))) {
      return "entityId must be a Home Assistant lawn_mower entity, e.g. lawn_mower.front_yard";
    }
    if ((b.adapter === "husqvarna" || b.adapter === "gardena" || b.adapter === "mammotion") && !(typeof b.vendorId === "string" && VENDOR_ID.test(b.vendorId))) {
      return "vendorId must be the mower's id from your mower account (pick it from the list)";
    }
    if (b.adapter === "gardena" && !(typeof b.locationId === "string" && VENDOR_ID.test(b.locationId))) {
      return "locationId must be the GARDENA location that holds the mower";
    }
  }
  if (has("entityId") && !(typeof b.entityId === "string" && HA_MOWER.test(b.entityId))) return "entityId must look like lawn_mower.front_yard";
  if (has("batteryEntityId") && b.batteryEntityId !== null && !(typeof b.batteryEntityId === "string" && HA_SENSOR.test(b.batteryEntityId))) {
    return "batteryEntityId must look like sensor.front_yard_battery";
  }
  if (has("vendorId") && !(typeof b.vendorId === "string" && VENDOR_ID.test(b.vendorId))) return "vendorId is not a valid mower id";
  if (has("locationId") && !(typeof b.locationId === "string" && VENDOR_ID.test(b.locationId))) return "locationId is not a valid location id";
  if (has("deviceId") && !(typeof b.deviceId === "string" && DEVICE_ID.test(b.deviceId))) return "deviceId must be letters, digits, _ or - (max 40)";
  if (has("guardHabitats")) {
    if (!Array.isArray(b.guardHabitats) || b.guardHabitats.length > 20 || !b.guardHabitats.every((d) => typeof d === "string" && DEVICE_ID.test(d))) {
      return "guardHabitats must be a list of up to 20 device ids";
    }
  }
  if (has("noAnimalsConfirmed") && typeof b.noAnimalsConfirmed !== "boolean") return "noAnimalsConfirmed must be a boolean";
  if (has("autoResume") && typeof b.autoResume !== "boolean") return "autoResume must be a boolean";
  if (has("quietHours") && b.quietHours !== null) {
    const q = b.quietHours as Record<string, unknown>;
    if (typeof q !== "object" || !hour(q.start) || !hour(q.end)) return "quietHours must be {start, end} hours 0-23, or null";
  }
  // Safety: a mower must either guard some habitats or the owner must say no animals are there.
  if (!partial) {
    const guards = Array.isArray(b.guardHabitats) ? b.guardHabitats.length : 0;
    if (guards === 0 && b.noAnimalsConfirmed !== true) {
      return "Pick the coops whose animals can reach this lawn, or confirm no animals ever roam where it mows";
    }
  }
  return null;
}

/**
 * Validate a command body.
 *
 * @returns Error message or null
 */
export function validateCommand(body: unknown, caps: MowerCapabilities): string | null {
  const b = (body ?? {}) as Record<string, unknown>;
  if (!MOWER_ACTIONS.includes(b.action as MowerAction)) return `action must be one of: ${MOWER_ACTIONS.join(", ")}`;
  if (!caps.actions.includes(b.action as MowerAction)) return `This mower cannot ${String(b.action).replace(/_/g, " ")} through its connection`;
  if (b.durationMin !== undefined) {
    if (b.action !== "start" || !caps.startDuration) return "durationMin is only for start, on mowers that support it";
    if (!int(b.durationMin, 1, 24 * 60)) return "durationMin must be 1-1440 minutes";
  }
  if (b.workAreaId !== undefined) {
    if (b.action !== "start" || !caps.workAreas) return "workAreaId is only for start, on mowers with work areas";
    if (!int(b.workAreaId, 0, 2 ** 31)) return "workAreaId must be a work area id";
  }
  if (b.vendorTask !== undefined) {
    if (b.action !== "start" || caps.patterns !== "vendor-plan") return "vendorTask is only for start, on mowers with saved plans";
    if (typeof b.vendorTask !== "string" || !b.vendorTask.trim() || b.vendorTask.length > 80) return "vendorTask must be a saved plan name";
  }
  if (caps.patterns === "vendor-plan" && b.action === "start" && b.vendorTask === undefined) {
    return "Pick one of the mower's saved plans to start";
  }
  const custom = ["pattern", "angleDeg", "edgePasses", "overlapPct", "cuttingHeightMm", "area"].filter((k) => b[k] !== undefined);
  if (custom.length) {
    if (b.action !== "start") return `${custom[0]} is only for start`;
    if (caps.patterns !== "custom") {
      return caps.patterns === "vendor-area" ? "This mower's pattern is set per work area in its own app - pick a work area instead"
        : caps.patterns === "vendor-plan" ? "This mower's pattern is part of its saved plan - pick a plan instead"
        : "This mower's connection only supports basic start / park - no patterns";
    }
    if (b.pattern !== undefined && !MOW_PATTERNS.includes(b.pattern as MowPattern)) return `pattern must be one of: ${MOW_PATTERNS.join(", ")}`;
    if (b.angleDeg !== undefined && !int(b.angleDeg, 0, 179)) return "angleDeg must be 0-179";
    if (b.edgePasses !== undefined && !int(b.edgePasses, 0, 5)) return "edgePasses must be 0-5";
    if (b.overlapPct !== undefined && !int(b.overlapPct, 0, 50)) return "overlapPct must be 0-50";
    if (b.cuttingHeightMm !== undefined && !int(b.cuttingHeightMm, 15, 120)) return "cuttingHeightMm must be 15-120";
    if (b.area !== undefined) {
      const a = b.area as Record<string, unknown>;
      const n = (v: unknown, min: number) => typeof v === "number" && Number.isFinite(v) && v >= min && v <= 5000;
      if (typeof a !== "object" || a === null || !n(a.x, 0) || !n(a.y, 0) || !n(a.width, 3) || !n(a.depth, 3)) {
        return "area must be {x, y, width, depth} in property feet (at least 3 ft wide)";
      }
    }
  }
  return null;
}

/** The start options a command body carries (already validated). */
export function startOptions(b: Record<string, unknown>): StartOptions {
  const keys = ["durationMin", "workAreaId", "vendorTask", "pattern", "angleDeg", "edgePasses", "overlapPct", "cuttingHeightMm", "area"] as const;
  return Object.fromEntries(keys.filter((k) => b[k] !== undefined).map((k) => [k, b[k]])) as StartOptions;
}

/** Settings the app can change on the mower (what its own app offers). None of these move it. */
export interface MowerSettingsPatch {
  cuttingHeight?: number;
  headlight?: HeadlightMode;
  schedule?: ScheduleTask[];
  stayOutZone?: { id: string; enabled: boolean };
  confirmError?: true;
}

/**
 * Validate a settings patch against what the mower supports.
 *
 * @returns Error message or null
 */
export function validateSettings(body: unknown, caps: MowerCapabilities): string | null {
  if (typeof body !== "object" || body === null) return "Body must be a JSON object";
  const b = body as Record<string, unknown>;
  const keys = Object.keys(b);
  if (!keys.length) return "Nothing to change";
  for (const k of keys) {
    if (!["cuttingHeight", "headlight", "schedule", "stayOutZone", "confirmError"].includes(k)) return `Unknown setting: ${k}`;
  }
  if (b.cuttingHeight !== undefined) {
    if (!caps.cuttingHeight) return "This mower's cutting height cannot be set through its connection";
    if (!int(b.cuttingHeight, caps.cuttingHeight.min, caps.cuttingHeight.max)) return `cuttingHeight must be ${caps.cuttingHeight.min}-${caps.cuttingHeight.max}`;
  }
  if (b.headlight !== undefined) {
    if (!caps.headlight) return "This mower has no headlight setting";
    if (!HEADLIGHT_MODES.includes(b.headlight as HeadlightMode)) return `headlight must be one of: ${HEADLIGHT_MODES.join(", ")}`;
  }
  if (b.schedule !== undefined) {
    if (caps.schedule !== "write") return "This mower's schedule cannot be changed through its connection";
    if (!Array.isArray(b.schedule) || b.schedule.length > 20) return "schedule must be a list of up to 20 tasks";
    for (const t of b.schedule as Record<string, unknown>[]) {
      if (!int(t.start, 0, 1439) || !int(t.duration, 1, 1440) || (t.start as number) + (t.duration as number) > 1440) {
        return "each task needs start 0-1439 and duration 1-1440 minutes, ending by midnight";
      }
      if (!DAYS.every((d) => typeof t[d] === "boolean")) return "each task needs monday..sunday true/false";
      if (!DAYS.some((d) => t[d])) return "each task needs at least one day";
      if (t.workAreaId !== undefined && !int(t.workAreaId, 0, 2 ** 31)) return "workAreaId must be a work area id";
    }
  }
  if (b.stayOutZone !== undefined) {
    if (!caps.stayOutZones) return "This mower has no stay-out zones through its connection";
    const z = b.stayOutZone as Record<string, unknown>;
    if (typeof z !== "object" || z === null || typeof z.id !== "string" || !VENDOR_ID.test(z.id) || typeof z.enabled !== "boolean") {
      return "stayOutZone must be {id, enabled}";
    }
  }
  if (b.confirmError !== undefined && (b.confirmError !== true || !caps.confirmError)) return "confirmError is not available for this mower";
  return null;
}

// ── Home Assistant ────────────────────────────────────────────────────────────
/**
 * Home Assistant lawn_mower state -> Tender Cells activity.
 * HA states: mowing, docked, paused, returning, error (plus unavailable / unknown).
 */
export function haToActivity(state: string | undefined): MowerActivity {
  switch (state) {
    case "mowing": case "docked": case "paused": case "returning": case "error": return state;
    default: return "unknown";
  }
}

/** HA service for each action HA supports (lawn_mower domain). */
export const HA_SERVICE: Partial<Record<MowerAction, string>> = { start: "start_mowing", pause: "pause", dock: "dock" };

// ── Husqvarna Automower Connect ───────────────────────────────────────────────
const up = (v: unknown) => (typeof v === "string" ? v.toUpperCase() : undefined);

/** Husqvarna mower.activity / mower.state -> Tender Cells activity. */
export function husqvarnaActivity(activity: unknown, state: unknown): MowerActivity {
  const s = up(state);
  if (s === "ERROR" || s === "FATAL_ERROR" || s === "ERROR_AT_POWER_UP") return "error";
  const a = up(activity);
  if (s === "PAUSED" && a !== "GOING_HOME") return "paused";
  switch (a) {
    case "MOWING": return "mowing";
    case "LEAVING": return "leaving";
    case "GOING_HOME": return "returning";
    case "CHARGING": case "PARKED_IN_CS": return "docked";
    case "STOPPED_IN_GARDEN": return "paused";
    default: return "unknown";
  }
}

/**
 * Parse one mower from GET /mowers/{id} (JSON:API "data" object).
 *
 * @returns State with details and the mower's own capabilities
 */
export function husqvarnaToState(data: Record<string, unknown>, now = Date.now()): MowerState {
  const a = (data.attributes ?? {}) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
  const mower = a.mower ?? {};
  const caps = a.capabilities ?? {};
  const base = ADAPTER_CAPABILITIES.husqvarna;
  const capabilities: MowerCapabilities = {
    ...base,
    workAreas: caps.workAreas === true,
    headlight: caps.headlights !== false,
    stayOutZones: caps.stayOutZones === true,
    confirmError: caps.canConfirmError === true,
    position: caps.position !== false,
  };
  const pos = Array.isArray(a.positions) && a.positions[0];
  const tasks = Array.isArray(a.calendar?.tasks) ? a.calendar.tasks : undefined;
  const details: MowerDetails = {
    vendorActivity: up(mower.activity), vendorState: up(mower.state), mode: up(mower.mode),
    cuttingHeight: typeof a.settings?.cuttingHeight === "number" ? a.settings.cuttingHeight : undefined,
    headlight: up(a.settings?.headlight?.mode) as HeadlightMode | undefined,
    schedule: tasks?.map((t: Record<string, unknown>) => ({
      start: Number(t.start), duration: Number(t.duration),
      ...Object.fromEntries(DAYS.map((d) => [d, t[d] === true])),
      ...(typeof t.workAreaId === "number" ? { workAreaId: t.workAreaId } : {}),
    }) as ScheduleTask),
    stayOutZones: Array.isArray(a.stayOutZones?.zones)
      ? a.stayOutZones.zones.map((z: Record<string, unknown>) => ({ id: String(z.id), name: String(z.name ?? z.id), enabled: z.enabled === true }))
      : undefined,
    workAreas: Array.isArray(a.workAreas)
      ? a.workAreas.map((w: Record<string, unknown>) => ({ id: Number(w.workAreaId), name: String(w.name || `Area ${w.workAreaId}`),
        ...(typeof w.cuttingHeight === "number" ? { cuttingHeight: w.cuttingHeight } : {}) }))
      : undefined,
    position: pos && typeof pos.latitude === "number" ? { lat: pos.latitude, lon: pos.longitude } : undefined,
    nextStart: typeof a.planner?.nextStartTimestamp === "number" && a.planner.nextStartTimestamp > 0 ? a.planner.nextStartTimestamp : undefined,
    errorCode: typeof mower.errorCode === "number" && mower.errorCode !== 0 ? mower.errorCode : undefined,
    errorConfirmable: mower.isErrorConfirmable === true,
    model: typeof a.system?.model === "string" ? a.system.model : undefined,
  };
  const activity = husqvarnaActivity(mower.activity, mower.state);
  return {
    activity,
    battery: typeof a.battery?.batteryPercent === "number" ? a.battery.batteryPercent : undefined,
    online: a.metadata?.connected !== false,
    error: activity === "error" ? `The mower reports error ${details.errorCode ?? ""}`.trim() : undefined,
    source: "husqvarna", details, capabilities, ts: now,
  };
}

/** JSON:API body for POST /mowers/{id}/actions. */
export function husqvarnaActionBody(action: MowerAction, opts: StartOptions = {}): Record<string, unknown> {
  switch (action) {
    case "start":
      if (opts.workAreaId !== undefined) return { data: { type: "StartInWorkArea", attributes: { workAreaId: opts.workAreaId, ...(opts.durationMin ? { duration: opts.durationMin } : {}) } } };
      // The API's Start always takes a duration; "mow now" without one = 3 hours.
      return { data: { type: "Start", attributes: { duration: opts.durationMin ?? 180 } } };
    case "resume_schedule": return { data: { type: "ResumeSchedule" } };
    case "pause": return { data: { type: "Pause" } };
    case "park_until_next_schedule": return { data: { type: "ParkUntilNextSchedule" } };
    case "dock": return { data: { type: "ParkUntilFurtherNotice" } };
  }
}

// ── GARDENA smart system (SILENO) ─────────────────────────────────────────────
/** GARDENA MOWER activity -> Tender Cells activity. */
export function gardenaActivity(activity: unknown, state: unknown): MowerActivity {
  const s = up(state);
  if (s === "ERROR") return "error";
  switch (up(activity)) {
    case "OK_CUTTING": case "OK_CUTTING_TIMER_OVERRIDDEN": return "mowing";
    case "OK_LEAVING": return "leaving";
    case "OK_SEARCHING": return "returning";
    case "OK_CHARGING": case "PARKED_TIMER": case "PARKED_PARK_SELECTED": case "PARKED_AUTOTIMER": return "docked";
    case "PAUSED": return "paused";
    default: return "unknown";
  }
}

/** GARDENA MOWER_CONTROL command for an action (PUT /v2/command/{serviceId}). */
export function gardenaCommand(action: MowerAction, opts: StartOptions = {}): { command: string; seconds?: number } {
  switch (action) {
    case "start": return { command: "START_SECONDS_TO_OVERRIDE", seconds: (opts.durationMin ?? 180) * 60 };
    case "resume_schedule": return { command: "START_DONT_OVERRIDE" };
    case "park_until_next_schedule": return { command: "PARK_UNTIL_NEXT_TASK" };
    case "dock": return { command: "PARK_UNTIL_FURTHER_NOTICE" };
    case "pause": throw Object.assign(new Error("GARDENA mowers cannot pause through the API - use Park"), { status: 400 });
  }
}

/**
 * Parse a GARDENA location (GET /v2/locations/{id}) for one mower service.
 *
 * @param included  - The location's "included" array (DEVICE, MOWER, COMMON objects)
 * @param serviceId - The mower's service id
 */
export function gardenaToState(included: Record<string, unknown>[], serviceId: string, now = Date.now()): MowerState | null {
  const byType = (type: string) => included.find((i) => i.type === type && i.id === serviceId) as Record<string, any> | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
  const mower = byType("MOWER");
  if (!mower) return null;
  const common = byType("COMMON");
  const v = (o: Record<string, any> | undefined, k: string) => o?.attributes?.[k]?.value; // eslint-disable-line @typescript-eslint/no-explicit-any
  const activity = gardenaActivity(v(mower, "activity"), v(mower, "state"));
  const err = v(mower, "lastErrorCode");
  const battery = v(common, "batteryLevel");
  return {
    activity,
    battery: typeof battery === "number" ? battery : undefined,
    online: up(v(common, "rfLinkState")) !== "OFFLINE" && up(v(mower, "state")) !== "UNAVAILABLE",
    error: activity === "error" ? `The mower reports ${err ?? "an error"}` : undefined,
    source: "gardena",
    details: { vendorActivity: up(v(mower, "activity")), vendorState: up(v(mower, "state")), model: v(common, "modelType") },
    capabilities: ADAPTER_CAPABILITIES.gardena, ts: now,
  };
}

/** GARDENA mowers in a location: [{serviceId, name}]. */
export function gardenaMowers(included: Record<string, unknown>[]): { serviceId: string; name: string }[] {
  return included.filter((i) => i.type === "MOWER").map((m) => {
    const common = included.find((i) => i.type === "COMMON" && i.id === m.id) as Record<string, any> | undefined; // eslint-disable-line @typescript-eslint/no-explicit-any
    return { serviceId: String(m.id), name: String(common?.attributes?.name?.value ?? m.id) };
  });
}

// ── Mammotion Open API (LUBA / YUKA) ──────────────────────────────────────────
/** Mammotion status text -> Tender Cells activity (the API reports a free-form status). */
export function mammotionActivity(status: unknown, chargeStatus?: unknown): MowerActivity {
  const s = String(status ?? "").toUpperCase();
  if (/ERR|FAULT|FAIL/.test(s)) return "error";
  if (/RETURN|BACK|GO_?HOME/.test(s)) return "returning";
  if (/PAUSE/.test(s)) return "paused";
  if (/MOW|WORK|CUT/.test(s)) return "mowing";
  if (/CHARG|DOCK|STATION|IDLE|STANDBY|READY/.test(s) || /CHARG/.test(String(chargeStatus ?? "").toUpperCase())) return "docked";
  return "unknown";
}

/** Parse GET /v1/mower/{id} (plain or {code, data} envelope). */
export function mammotionToState(raw: Record<string, unknown>, plans: { id: string; name: string }[] = [], now = Date.now()): MowerState {
  const d = ((raw.data && typeof raw.data === "object" ? raw.data : raw) ?? {}) as Record<string, unknown>;
  const activity = mammotionActivity(d.status, d.chargeStatus);
  const battery = Number(d.batteryLevel);
  return {
    activity, online: d.online !== false,
    battery: Number.isFinite(battery) ? battery : undefined,
    error: activity === "error" ? `The mower reports ${String(d.status)}` : undefined,
    source: "mammotion", capabilities: ADAPTER_CAPABILITIES.mammotion,
    details: { vendorState: typeof d.status === "string" ? d.status : undefined, model: typeof d.model === "string" ? d.model : undefined, plans },
    ts: now,
  };
}

/** Mammotion action body for POST /v1/mower/action. */
export function mammotionActionBody(deviceId: string, action: MowerAction, opts: StartOptions = {}): Record<string, unknown> {
  switch (action) {
    case "start": return { deviceId, action: "START", params: { taskName: opts.vendorTask } };
    case "resume_schedule": return { deviceId, action: "RESUME", params: {} };
    case "pause": return { deviceId, action: "PAUSE", params: {} };
    case "dock": return { deviceId, action: "RETURN", params: {} };
    case "park_until_next_schedule":
      throw Object.assign(new Error("Mammotion mowers cannot park until the next schedule through the API - use Return to dock"), { status: 400 });
  }
}

// ── interlock ─────────────────────────────────────────────────────────────────
/** 7 -> "07:00". */
export const hh = (h: number): string => `${String(h).padStart(2, "0")}:00`;

/** True when `date` (local time) falls inside the quiet hours, which may wrap midnight. */
export function inQuietHours(q: QuietHours | null, date: Date): boolean {
  if (!q || q.start === q.end) return false;
  const h = date.getHours();
  return q.start < q.end ? h >= q.start && h < q.end : h >= q.start || h < q.end;
}

/** Everything the interlock needs to know about the rest of the property. */
export interface InterlockContext {
  now: Date;
  /** E-STOP latched on the mower (or reported by it). */
  estop: boolean;
  /** Latest door state and its age for a habitat, or undefined when it never reported. */
  habitat: (deviceId: string) => { doorState?: unknown; ageMs: number } | undefined;
  /** Animals seen on the property recently: labels for the message. */
  animalsSeen: string[];
}

/**
 * Why the mower must not run now, or null when it may.
 * Checked before every start and continuously while the mower is linked.
 *
 * @param link - The mower's settings
 * @param ctx  - Property state
 * @returns A reason written for the owner, or null
 * @example
 *   mowingBlockedReason(link, ctx) // "ct_001: the door is open - the animals may be on the lawn."
 */
export function mowingBlockedReason(link: MowerLink, ctx: InterlockContext): string | null {
  if (ctx.estop) return "E-STOP is active. Clear it before the mower may run.";
  if (inQuietHours(link.quietHours, ctx.now)) {
    const q = link.quietHours!;
    return `Quiet hours (${hh(q.start)}-${hh(q.end)}): no mowing at night, to protect hedgehogs, toads and other wildlife.`;
  }
  if (link.guardHabitats.length === 0 && !link.noAnimalsConfirmed) {
    return "No coops are guarded. Pick the coops whose animals can reach this lawn, or confirm no animals ever roam here.";
  }
  for (const id of link.guardHabitats) {
    const h = ctx.habitat(id);
    if (!h || h.doorState === undefined) return `Cannot confirm the animals from ${id} are inside: no door state from it yet.`;
    if (h.ageMs > HABITAT_STATE_MAX_AGE_MS) return `Cannot confirm the animals from ${id} are inside: its door state is out of date.`;
    if (h.doorState !== "closed") return `${id}: the door is ${String(h.doorState)} - the animals may be on the lawn.`;
  }
  if (ctx.animalsSeen.length) {
    const what = [...new Set(ctx.animalsSeen)].slice(0, 3).join(", ");
    return `An animal was seen on the property in the last ${ANIMAL_SEEN_WINDOW_MS / 60_000} minutes (${what}). Check the lawn is clear.`;
  }
  return null;
}
