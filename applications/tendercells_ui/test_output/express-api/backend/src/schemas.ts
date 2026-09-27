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

// Headcount older than this cannot clear robot motion (sensors publish every 10s).
export const MOTION_TELEMETRY_MAX_AGE_MS = 60_000;

export const SCHEMAS: Record<string, Schema> = {
  door:    { state:   { type: "string", required: true, values: ["open", "close"] } },
  // Basic Roaming Roost differential drive (classroom rover + real product share this).
  drive:   {
    dir:   { type: "string", required: true, values: ["forward", "back", "left", "right", "stop"] },
    speed: { type: "number", required: false, min: 0, max: 1 },
  },
  // Relay/light: any farm load on/off (heat lamp, water pump, fan, grow light).
  light:   { on:      { type: "boolean", required: true } },
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
  weedPass:    { passes: { type: "number", required: false, min: 1, max: 10 } },
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
