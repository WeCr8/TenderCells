// mower.ts - bring-your-own robot mower: types and the animal-safety interlock, used by the
// Robot Mowers page and the demo simulator. The hub enforces the same rules for real mowers
// (express-api/backend/src/mower.ts - keep the two in step). docs/ROBOT_MOWERS.md.
import { YARD_LIVE } from "../yard/yardTypes";

/** Live (hub API configured) or the in-browser demo simulator. */
export const MOWER_LIVE = YARD_LIVE;

export type MowerAdapter = "home-assistant" | "mqtt" | "husqvarna" | "gardena" | "mammotion";
export type MowerActivity = "mowing" | "leaving" | "docked" | "paused" | "returning" | "error" | "unknown";
/** start / resume_schedule send it out (interlocked); pause / park / dock never are refused. */
export type MowerAction = "start" | "resume_schedule" | "pause" | "park_until_next_schedule" | "dock";
export const GO_ACTIONS: ReadonlySet<MowerAction> = new Set(["start", "resume_schedule"]);

export type MowPattern = "auto" | "stripes" | "checkerboard" | "diamond" | "spiral" | "perimeter";
/** custom: Tender Cells sends the pattern · vendor-area: Husqvarna work area · vendor-plan: Mammotion saved plan. */
export type PatternSupport = "custom" | "vendor-area" | "vendor-plan" | null;

/** A start request: basic = durationMin; advanced = where and how (what the mower supports). */
export interface StartOptions {
  durationMin?: number;
  workAreaId?: number;
  vendorTask?: string;
  pattern?: MowPattern;
  angleDeg?: number;
  edgePasses?: number;
  overlapPct?: number;
  cuttingHeightMm?: number;
  area?: { x: number; y: number; width: number; depth: number };
}

export type HeadlightMode = "ALWAYS_ON" | "ALWAYS_OFF" | "EVENING_ONLY" | "EVENING_AND_NIGHT";
export const HEADLIGHT_LABEL: Record<HeadlightMode, string> = {
  ALWAYS_ON: "Always on", ALWAYS_OFF: "Always off", EVENING_ONLY: "Evening only", EVENING_AND_NIGHT: "Evening and night",
};

export interface ScheduleTask {
  start: number; duration: number;
  monday: boolean; tuesday: boolean; wednesday: boolean; thursday: boolean; friday: boolean; saturday: boolean; sunday: boolean;
  workAreaId?: number;
}
export const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;

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

/** Same baseline the hub uses (express-api mower.ts ADAPTER_CAPABILITIES). */
export const ADAPTER_CAPABILITIES: Record<MowerAdapter, MowerCapabilities> = {
  husqvarna: { actions: ["start", "resume_schedule", "pause", "park_until_next_schedule", "dock"], startDuration: true, workAreas: true,
    cuttingHeight: { min: 1, max: 9 }, headlight: true, schedule: "write", stayOutZones: true, confirmError: true, position: true, patterns: "vendor-area" },
  gardena: { actions: ["start", "resume_schedule", "park_until_next_schedule", "dock"], startDuration: true, workAreas: false,
    cuttingHeight: null, headlight: false, schedule: null, stayOutZones: false, confirmError: false, position: false, patterns: null },
  mammotion: { actions: ["start", "resume_schedule", "pause", "dock"], startDuration: false, workAreas: false,
    cuttingHeight: null, headlight: false, schedule: null, stayOutZones: false, confirmError: false, position: false, patterns: "vendor-plan" },
  "home-assistant": { actions: ["start", "pause", "dock"], startDuration: false, workAreas: false,
    cuttingHeight: null, headlight: false, schedule: null, stayOutZones: false, confirmError: false, position: false, patterns: null },
  mqtt: { actions: ["start", "resume_schedule", "pause", "park_until_next_schedule", "dock"], startDuration: true, workAreas: false,
    cuttingHeight: null, headlight: false, schedule: null, stayOutZones: false, confirmError: false, position: false, patterns: "custom" },
};

export interface QuietHours { start: number; end: number }

export interface MowerLink {
  deviceId: string;
  name: string;
  adapter: MowerAdapter;
  entityId?: string;
  batteryEntityId?: string;
  vendorId?: string;
  locationId?: string;
  guardHabitats: string[];
  noAnimalsConfirmed: boolean;
  quietHours: QuietHours | null;
  autoResume?: boolean;
  createdAt: number;
  updatedAt: number;
}

export interface MowerInterlockEvent { reason: string; at: number; action: "refused" | "sent-home" | "held" | "resumed" }

/** What the mower's own app shows, mirrored. */
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
  plans?: { id: string; name: string }[];
}

export interface MowerState {
  activity: MowerActivity;
  battery?: number;
  error?: string;
  online: boolean;
  source: "home-assistant" | "husqvarna" | "gardena" | "mammotion" | "device" | "simulator";
  entityId?: string;
  held?: boolean;
  details?: MowerDetails;
  capabilities?: MowerCapabilities;
  lastInterlock?: MowerInterlockEvent;
  /** Last run's plan (native / simulated mowers). */
  plan?: StartOptions;
  ts: number;
}

/** Settings the mower's own app would change. None of these move it. */
export interface MowerSettingsPatch {
  cuttingHeight?: number;
  headlight?: HeadlightMode;
  schedule?: ScheduleTask[];
  stayOutZone?: { id: string; enabled: boolean };
  confirmError?: true;
}

/** One mower as the page shows it: settings, state and why it may not mow now. */
export interface MowerView { link: MowerLink; state: MowerState | null; blocked: string | null; capabilities?: MowerCapabilities }

/** Capabilities to offer for a mower (reported by the hub, else the adapter baseline). */
export const capsOf = (m: MowerView): MowerCapabilities => m.capabilities ?? m.state?.capabilities ?? ADAPTER_CAPABILITIES[m.link.adapter];

export const DEFAULT_QUIET_HOURS: QuietHours = { start: 20, end: 7 };
export const ANIMAL_SEEN_WINDOW_MS = 15 * 60_000;

export const ACTIVITY_LABEL: Record<MowerActivity, string> = {
  mowing: "Mowing", leaving: "Leaving the dock", docked: "Docked", paused: "Paused", returning: "Returning to dock", error: "Error", unknown: "Unknown",
};

/** 7 -> "07:00". */
export const hh = (h: number): string => `${String(h).padStart(2, "0")}:00`;

/** True when `date` (local time) is inside the quiet hours, which may wrap midnight. */
export function inQuietHours(q: QuietHours | null, date: Date): boolean {
  if (!q || q.start === q.end) return false;
  const h = date.getHours();
  return q.start < q.end ? h >= q.start && h < q.end : h >= q.start || h < q.end;
}

export interface InterlockContext {
  now: Date;
  estop: boolean;
  /** Door state of a guarded habitat, or undefined when unknown. */
  habitat: (deviceId: string) => { doorState?: string; ageMs: number } | undefined;
  animalsSeen: string[];
}

/**
 * Why the mower must not run now, or null when it may. Same rules as the hub.
 *
 * @param link - Mower settings
 * @param ctx  - Property state
 * @returns A reason for the owner, or null
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
    if (h.ageMs > 60_000) return `Cannot confirm the animals from ${id} are inside: its door state is out of date.`;
    if (h.doorState !== "closed") return `${id}: the door is ${h.doorState} - the animals may be on the lawn.`;
  }
  if (ctx.animalsSeen.length) {
    return `An animal was seen on the property in the last 15 minutes (${[...new Set(ctx.animalsSeen)].slice(0, 3).join(", ")}). Check the lawn is clear.`;
  }
  return null;
}
