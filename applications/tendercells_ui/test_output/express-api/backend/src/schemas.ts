// schemas.ts - request / payload schemas shared by the controller (validation) and
// describe.ts (the machine-readable API description), so the two never drift.

// ── Payload schema validators ─────────────────────────────────────────────────
// All schemas match the MQTT payload contracts defined in CLAUDE.md §4.
// Validation runs on both inbound (sensor/state/alert) and outbound (commands).

export type SchemaField = { type: string; required?: boolean; min?: number; max?: number; values?: string[] };
export type Schema = Record<string, SchemaField>;

export function validatePayload(payload: unknown, schema: Schema): string | null {
  if (typeof payload !== "object" || payload === null) return "Payload must be a JSON object";
  const obj = payload as Record<string, unknown>;
  for (const [key, rule] of Object.entries(schema)) {
    if (rule.required && !(key in obj)) return `Missing required field: ${key}`;
    if (!(key in obj)) continue;
    const val = obj[key];
    if (rule.type === "number" && typeof val !== "number") return `${key} must be a number`;
    if (rule.type === "string" && typeof val !== "string") return `${key} must be a string`;
    if (rule.type === "boolean" && typeof val !== "boolean") return `${key} must be a boolean`;
    if (rule.type === "array" && !Array.isArray(val)) return `${key} must be an array`;
    if (rule.values && typeof val === "string" && !rule.values.includes(val))
      return `${key} must be one of: ${rule.values.join(", ")}`;
    if (rule.type === "number" && typeof val === "number") {
      if (rule.min !== undefined && val < rule.min) return `${key} must be >= ${rule.min}`;
      if (rule.max !== undefined && val > rule.max) return `${key} must be <= ${rule.max}`;
    }
  }
  return null;
}

export const KNOWN_ROUTINES = [
  "egg_collection_routine",
  "cleaning_sweep_routine",
] as const;

// Hugging Face model id: <owner>/<name>.
export const HF_REPO_ID = /^[A-Za-z0-9][A-Za-z0-9_.-]{0,95}\/[A-Za-z0-9][A-Za-z0-9_.-]{0,95}$/;

const ZONE_KINDS = new Set(["no-go", "keep-out", "no-laser"]);
const num = (v: unknown) => typeof v === "number" && Number.isFinite(v) && Math.abs(v) < 100_000;

/**
 * Validate a rover coverage request: optional area {x,y,width,depth} and/or route [{x,y}] (feet).
 *
 * @returns An error message, or null when valid (or absent)
 */
export function validateCoverage(body: { area?: unknown; route?: unknown; waterPoints?: unknown }): string | null {
  if (body.area !== undefined) {
    const a = body.area as Record<string, unknown> | null;
    if (!a || !["x", "y", "width", "depth"].every((k) => num(a[k]))) return "area needs numeric x, y, width, depth (feet)";
    if ((a.width as number) <= 0 || (a.depth as number) <= 0) return "area width and depth must be positive";
  }
  if (body.route !== undefined) {
    const r = body.route as unknown[];
    if (!Array.isArray(r) || r.length < 2 || r.length > 500) return "route needs 2-500 points";
    if (!r.every((p) => p && num((p as Record<string, unknown>).x) && num((p as Record<string, unknown>).y))) return "route points need numeric x, y (feet)";
  }
  if (body.waterPoints !== undefined) {
    const w = body.waterPoints as Array<Record<string, unknown>>;
    if (!Array.isArray(w) || w.length > 50) return "waterPoints must be an array of at most 50 points";
    for (const [i, p] of w.entries()) {
      if (!p || typeof p.id !== "string" || !p.id || p.id.length > 64) return `waterPoints[${i}].id must be a string`;
      if (p.name !== undefined && (typeof p.name !== "string" || p.name.length > 60)) return `waterPoints[${i}].name must be a string (max 60)`;
      if (!num(p.x) || !num(p.y)) return `waterPoints[${i}] needs numeric x, y (feet)`;
      if (p.radiusFt !== undefined && (!num(p.radiusFt) || (p.radiusFt as number) <= 0 || (p.radiusFt as number) > 100)) return `waterPoints[${i}].radiusFt must be 0-100 ft`;
    }
  }
  return null;
}

/**
 * Validate an exclusion-zones payload ({v:1, units:'ft', self?, zones:[{id,name,kind,poly}]}).
 *
 * @returns An error message, or null when valid
 */
export function validateZones(body: unknown): string | null {
  const b = body as { v?: unknown; units?: unknown; zones?: unknown; self?: Record<string, unknown> } | null;
  if (!b || typeof b !== "object") return "body must be a JSON object";
  if (b.v !== 1) return "v must be 1";
  if (b.units !== "ft") return "units must be 'ft'";
  if (!Array.isArray(b.zones) || b.zones.length > 200) return "zones must be an array of at most 200 zones";
  if (b.self !== undefined && !(b.self && ["x", "y", "width", "depth"].every((k) => num(b.self![k])))) return "self needs numeric x, y, width, depth";
  // The robot cannot place zones without its own footprint (it would treat everything as clear).
  if ((b.zones as unknown[]).length > 0 && b.self === undefined) return "self (the robot footprint) is required when zones are sent";
  for (const [i, z] of (b.zones as Array<Record<string, unknown>>).entries()) {
    if (!z || typeof z.id !== "string" || z.id.length > 80) return `zones[${i}].id must be a string`;
    if (typeof z.name !== "string" || z.name.length > 120) return `zones[${i}].name must be a string`;
    if (!ZONE_KINDS.has(z.kind as string)) return `zones[${i}].kind must be no-go, keep-out or no-laser`;
    const poly = z.poly as unknown[];
    if (!Array.isArray(poly) || poly.length < 3 || poly.length > 64) return `zones[${i}].poly needs 3-64 points`;
    if (!poly.every((p) => Array.isArray(p) && p.length === 2 && num(p[0]) && num(p[1]))) return `zones[${i}].poly points must be [x, y] numbers`;
  }
  return null;
}

// Headcount older than this cannot clear robot motion (sensors publish every 10s).
export const MOTION_TELEMETRY_MAX_AGE_MS = 60_000;

export const SCHEMAS: Record<string, Schema> = {
  // Robot mower link / settings (full rules in mower.ts validateMowerLink).
  mowerLink: {
    name: { type: "string", required: true },
    adapter: { type: "string", required: true, values: ["home-assistant", "mqtt", "husqvarna", "gardena", "mammotion"] },
    vendorId: { type: "string" },
    locationId: { type: "string" },
    autoResume: { type: "boolean" },
    entityId: { type: "string" },
    batteryEntityId: { type: "string" },
    deviceId: { type: "string" },
    guardHabitats: { type: "array" },
    noAnimalsConfirmed: { type: "boolean" },
    quietHours: { type: "object" },
  },
  mowerCommand: {
    action: { type: "string", required: true, values: ["start", "resume_schedule", "pause", "park_until_next_schedule", "dock"] },
    durationMin: { type: "number", min: 1, max: 1440 },
    workAreaId: { type: "number" },
    vendorTask: { type: "string" },
    pattern: { type: "string", values: ["auto", "stripes", "checkerboard", "diamond", "spiral", "perimeter"] },
    angleDeg: { type: "number", min: 0, max: 179 },
    edgePasses: { type: "number", min: 0, max: 5 },
    overlapPct: { type: "number", min: 0, max: 50 },
    cuttingHeightMm: { type: "number", min: 15, max: 120 },
    area: { type: "object" },
  },
  mowerSettings: {
    cuttingHeight: { type: "number", min: 1, max: 9 },
    headlight: { type: "string", values: ["ALWAYS_ON", "ALWAYS_OFF", "EVENING_ONLY", "EVENING_AND_NIGHT"] },
    schedule: { type: "array" },
    stayOutZone: { type: "object" },
    confirmError: { type: "boolean" },
  },
  door:    { state:   { type: "string", required: true, values: ["open", "close"] } },
  // Basic Roaming Roost differential drive (classroom rover + real product share this).
  drive:   {
    dir:   { type: "string", required: true, values: ["forward", "back", "left", "right", "stop"] },
    speed: { type: "number", required: false, min: 0, max: 1 },
  },
  // Relay/light: any farm load on/off (heat lamp, water pump, fan, grow light).
  light:   { on:      { type: "boolean", required: true } },
  cameraConfig: {
    enabled: { type: "array", required: true },
  },
  // GRBL gantry: coordinate move {x,y,speed} or real-time control {cmd}.
  gantry:  {
    x:     { type: "number", required: false },
    y:     { type: "number", required: false },
    speed: { type: "number", required: false, min: 0, max: 1 },
    cmd:   { type: "string", required: false, values: ["home", "unlock", "hold", "resume", "stop"] },
  },
  feed:    { amount:  { type: "number", required: true, min: 1, max: 5000 } },
  clean:   { action:  { type: "string", required: true, values: ["start", "stop"] } },
  routine: { routine: { type: "string", required: true, values: [...KNOWN_ROUTINES] } },
  // Hugging Face LeRobot policy run (arm service runs lerobot-rollout / lerobot-eval).
  policy: {
    repo_id:    { type: "string", required: true },
    task:       { type: "string", required: false },
    duration_s: { type: "number", required: false, min: 1, max: 600 },
    sim_env:    { type: "string", required: false, values: ["pusht", "aloha", "libero", "metaworld"] },
  },
  arm: {
    joints: { type: "array",  required: true },
    speed:  { type: "number", required: false, min: 0, max: 1 },
  },
  // Weed patrol (validated in the handlers; listed here so the API description has them).
  weedPass:    {
    passes: { type: "number", required: false, min: 1, max: 10 },
    // weed = find weeds for laser review; plant_scan = crop health; patrol = snakes / animals (alerts only)
    task:   { type: "string", required: false, values: ["weed", "plant_scan", "patrol"] },
  },
  weedApprove: { mode:   { type: "string", required: false, values: ["aim", "burn"] } },
  // Inbound sensor schema (for validation of received data)
  sensors: {
    temp:         { type: "number" },
    humidity:     { type: "number", min: 0, max: 100 },
    ammonia:      { type: "number", min: 0 },
    feedLevel:    { type: "number", min: 0, max: 100 },
    waterLevel:   { type: "number", min: 0, max: 100 },
    chickenCount: { type: "number", min: 0 },
  },
};
