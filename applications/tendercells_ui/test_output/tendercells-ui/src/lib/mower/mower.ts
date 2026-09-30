// mower.ts - bring-your-own robot mower: types and the animal-safety interlock, used by the
// Robot Mowers page and the demo simulator. The hub enforces the same rules for real mowers
// (express-api/backend/src/mower.ts - keep the two in step). docs/ROBOT_MOWERS.md.
import { YARD_LIVE } from "../yard/yardTypes";

/** Live (hub API configured) or the in-browser demo simulator. */
export const MOWER_LIVE = YARD_LIVE;

export type MowerAdapter = "home-assistant" | "mqtt";
export type MowerActivity = "mowing" | "docked" | "paused" | "returning" | "error" | "unknown";
export type MowerAction = "start" | "pause" | "dock";

export interface QuietHours { start: number; end: number }

export interface MowerLink {
  deviceId: string;
  name: string;
  adapter: MowerAdapter;
  entityId?: string;
  batteryEntityId?: string;
  guardHabitats: string[];
  noAnimalsConfirmed: boolean;
  quietHours: QuietHours | null;
  createdAt: number;
  updatedAt: number;
}

export interface MowerInterlockEvent { reason: string; at: number; action: "refused" | "sent-home" }

export interface MowerState {
  activity: MowerActivity;
  battery?: number;
  error?: string;
  online: boolean;
  source: "home-assistant" | "device" | "simulator";
  entityId?: string;
  lastInterlock?: MowerInterlockEvent;
  ts: number;
}

/** One mower as the page shows it: settings, state and why it may not mow now. */
export interface MowerView { link: MowerLink; state: MowerState | null; blocked: string | null }

export const DEFAULT_QUIET_HOURS: QuietHours = { start: 20, end: 7 };
export const ANIMAL_SEEN_WINDOW_MS = 15 * 60_000;

export const ACTIVITY_LABEL: Record<MowerActivity, string> = {
  mowing: "Mowing", docked: "Docked", paused: "Paused", returning: "Returning to dock", error: "Error", unknown: "Unknown",
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
