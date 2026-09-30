// mower.ts - bring-your-own robot mower: the pure parts (types, validation, Home Assistant
// state mapping and the animal-safety interlock). The runtime (polling, commands, storage)
// is in mowerBridge.ts. See docs/ROBOT_MOWERS.md.
//
// Tender Cells does not drive the mower's wheels or blades. The mower keeps its own
// navigation, boundary wire / RTK map, lift and tilt blade stops. Tender Cells adds what
// the mower cannot know: whether the flock is out on the lawn, whether an animal was just
// seen there, the wildlife quiet hours and the property E-STOP. It refuses to start the
// mower and sends it home (pause + dock) the moment any of those is true.

export type MowerAdapter = "home-assistant" | "mqtt";
export type MowerActivity = "mowing" | "docked" | "paused" | "returning" | "error" | "unknown";
export type MowerAction = "start" | "pause" | "dock";

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
  /** Animal habitats whose door must be closed (flock inside) before the mower may run. */
  guardHabitats: string[];
  /** The owner confirmed no animals ever roam where this mower works (guardHabitats empty). */
  noAnimalsConfirmed: boolean;
  /** No mowing between these hours (hedgehogs, toads and other night wildlife). null = off. */
  quietHours: QuietHours | null;
  createdAt: number;
  updatedAt: number;
}

export interface MowerInterlockEvent { reason: string; at: number; action: "refused" | "sent-home" }

/** What tc/{id}/state/mower carries (published retained by the bridge or by a native mower). */
export interface MowerState {
  activity: MowerActivity;
  battery?: number;
  error?: string;
  online: boolean;
  /** home-assistant (EXTERNAL source) or device (a native mower, SENSED). */
  source: "home-assistant" | "device";
  entityId?: string;
  estop?: boolean;
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
const hour = (v: unknown) => typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 23;

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
    if (b.adapter !== "home-assistant" && b.adapter !== "mqtt") return "adapter must be home-assistant or mqtt";
  }
  if (b.adapter === "home-assistant" && !partial && !(typeof b.entityId === "string" && HA_MOWER.test(b.entityId))) {
    return "entityId must be a Home Assistant lawn_mower entity, e.g. lawn_mower.front_yard";
  }
  if (has("entityId") && !(typeof b.entityId === "string" && HA_MOWER.test(b.entityId))) return "entityId must look like lawn_mower.front_yard";
  if (has("batteryEntityId") && b.batteryEntityId !== null && !(typeof b.batteryEntityId === "string" && HA_SENSOR.test(b.batteryEntityId))) {
    return "batteryEntityId must look like sensor.front_yard_battery";
  }
  if (has("deviceId") && !(typeof b.deviceId === "string" && DEVICE_ID.test(b.deviceId))) return "deviceId must be letters, digits, _ or - (max 40)";
  if (has("guardHabitats")) {
    if (!Array.isArray(b.guardHabitats) || b.guardHabitats.length > 20 || !b.guardHabitats.every((d) => typeof d === "string" && DEVICE_ID.test(d))) {
      return "guardHabitats must be a list of up to 20 device ids";
    }
  }
  if (has("noAnimalsConfirmed") && typeof b.noAnimalsConfirmed !== "boolean") return "noAnimalsConfirmed must be a boolean";
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
 * Home Assistant lawn_mower state -> Tender Cells activity.
 * HA states: mowing, docked, paused, returning, error (plus unavailable / unknown).
 */
export function haToActivity(state: string | undefined): MowerActivity {
  switch (state) {
    case "mowing": case "docked": case "paused": case "returning": case "error": return state;
    default: return "unknown";
  }
}

/** HA service for each action (lawn_mower domain). */
export const HA_SERVICE: Record<MowerAction, string> = { start: "start_mowing", pause: "pause", dock: "dock" };

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
 * Checked before every start and on every poll while it mows.
 *
 * @param link - The mower's settings
 * @param ctx  - Property state
 * @returns A reason written for the owner, or null
 * @example
 *   mowingBlockedReason(link, ctx) // "Chicken Tender ct_001: the door is open - the flock may be on the lawn."
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
