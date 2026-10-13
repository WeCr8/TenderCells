// scheduleExec.ts - the pure half of the cloud schedule runner (executeSchedules), unit-tested.
//
// FIX(2026-10-12): executeSchedules used to
//   - evaluate cron in UTC although the app builds it in the person's local time,
//   - only fire schedules whose minute was a multiple of 5 (it ran every 5 min, matched "now"),
//   - always open the door and send fixed amounts, ignoring the schedule's own state/amount/on,
//   - push to RTDB pending-commands, which nothing reads.
// Now each schedule is matched in its own time zone over the whole 5-minute window, mapped to
// the same command the hub's runner sends, and queued at deviceCommands/{deviceId}/queue/{id}
// with a deterministic id. The hub's runner claims the same id before it fires, so a schedule
// fires once whether the hub or the cloud sees it first; the hub delivers queued commands over
// local MQTT (after its own E-STOP / work-area checks) and hubless devices pull them from
// deviceApi with an API key.

export type ScheduleAction = "feed" | "clean" | "door" | "water" | "weed_pass";

export interface CloudSchedule {
  deviceId?: string;
  action?: ScheduleAction | string;
  cronExpression?: string;
  enabled?: boolean;
  amount?: number;
  state?: "open" | "close";
  on?: boolean;
  passes?: number;
  task?: string;
  timeZone?: string;
}

export interface QueuedCommand {
  command: "feed" | "clean" | "door" | "light" | "weed";
  payload: Record<string, unknown>;
  /** Robot motion inside an animal area: only a hub (with a live headcount) may deliver it. */
  motion: boolean;
}

/** How long a queued command stays deliverable. A door that opens 3 hours late is worse than none. */
export const COMMAND_TTL_MS = 10 * 60_000;

/** The command a schedule sends. Mirrors fire() in express-api/backend/src/schedule.runner.ts. */
export function commandFor(s: CloudSchedule): QueuedCommand | null {
  switch (s.action) {
    case "feed": return { command: "feed", payload: { amount: clampNum(s.amount, 1, 1000, 50) }, motion: false };
    case "door": return { command: "door", payload: { state: s.state === "close" ? "close" : "open" }, motion: false };
    case "water": return { command: "light", payload: { on: s.on !== false }, motion: false };
    case "clean": return { command: "clean", payload: { action: "start" }, motion: true };
    case "weed_pass":
      return {
        command: "weed",
        payload: { action: "pass", passes: clampNum(s.passes, 1, 10, 1), task: s.task === "plant_scan" || s.task === "patrol" ? s.task : "weed" },
        motion: true,
      };
    default: return null;
  }
}

function clampNum(v: unknown, lo: number, hi: number, dflt: number): number {
  const n = Number(v);
  if (!Number.isFinite(n)) return dflt;
  return Math.min(hi, Math.max(lo, Math.round(n)));
}

/** A usable IANA time zone name, or null. */
export function validTimeZone(tz: unknown): string | null {
  if (typeof tz !== "string" || !tz.trim()) return null;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(0);
    return tz;
  } catch {
    return null;
  }
}

/**
 * Which time zone a schedule's cron is written in: the schedule's own (the app stamps it),
 * then the coop's (devices/{id}.timeZone), then the owner's settings. null = unknown, and the
 * cloud then skips the schedule rather than fire it at a guessed hour.
 */
export function resolveTimeZone(...candidates: unknown[]): string | null {
  for (const c of candidates) {
    const tz = validTimeZone(c);
    if (tz) return tz;
  }
  return null;
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

/** Wall-clock fields of an instant in a time zone. */
export function localParts(ms: number, timeZone: string) {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", year: "numeric", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", weekday: "short",
  }).formatToParts(new Date(ms));
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return {
    minute: Number(get("minute")), hour: Number(get("hour")) % 24, day: Number(get("day")), month: Number(get("month")), weekday: WEEKDAYS[get("weekday")] ?? 0,
  };
}

function matchField(field: string, val: number): boolean {
  return field.split(",").some((part) => {
    if (part === "*") return true;
    const [range, stepStr] = part.split("/");
    const step = stepStr === undefined ? 1 : Number(stepStr);
    if (!Number.isInteger(step) || step <= 0) return false;
    let lo: number;
    let hi: number;
    if (range === "*") { lo = 0; hi = Number.MAX_SAFE_INTEGER; } else if (range.includes("-")) {
      [lo, hi] = range.split("-").map(Number);
    } else {
      lo = Number(range);
      hi = stepStr === undefined ? lo : Number.MAX_SAFE_INTEGER;
    }
    if (!Number.isFinite(lo) || !Number.isFinite(hi)) return false;
    return val >= lo && val <= hi && (val - lo) % step === 0;
  });
}

/** 5-field cron (minute hour day-of-month month day-of-week) against an instant, in `timeZone`. */
export function cronMatchesAt(expr: string, ms: number, timeZone: string): boolean {
  const f = String(expr ?? "").trim().split(/\s+/);
  if (f.length !== 5) return false;
  const p = localParts(ms, timeZone);
  const dow = p.weekday;
  return matchField(f[0], p.minute) && matchField(f[1], p.hour) && matchField(f[2], p.day) && matchField(f[3], p.month) &&
    (matchField(f[4], dow) || (dow === 0 && matchField(f[4], 7)));
}

/**
 * The minutes (UTC epoch ms at :00) in (fromMs, toMs] at which the schedule is due.
 * executeSchedules runs every 5 minutes and checks the 5 minutes since its last run.
 */
export function dueMinutes(expr: string, timeZone: string, fromMs: number, toMs: number): number[] {
  const out: number[] = [];
  const start = Math.floor(fromMs / 60_000) + 1;
  const end = Math.floor(toMs / 60_000);
  for (let m = start; m <= end && out.length < 60; m++) {
    if (cronMatchesAt(expr, m * 60_000, timeZone)) out.push(m * 60_000);
  }
  return out;
}

/** Deterministic queue id: the same schedule at the same minute is one command, from hub or cloud. */
export const commandId = (scheduleId: string, minuteMs: number) => `sched_${scheduleId}_${Math.floor(minuteMs / 60_000)}`;

/** Is the device's E-STOP latched, from any state the cloud can see? */
export function estopLatched(...states: Array<Record<string, unknown> | undefined | null>): boolean {
  return states.some((s) => !!s && (s.systemState === "estop" || s.state === "estop" || s.estop === true || s.estopActive === true));
}

/** May a pulled command go to a hubless device right now? null = yes, else the reason it is held back. */
export function pullRefusal(cmd: { motion?: boolean; expiresAt?: number }, estop: boolean, now: number): string | null {
  if (cmd.expiresAt && cmd.expiresAt < now) return "expired";
  if (estop) return "E-STOP is active on this device";
  if (cmd.motion) return "Robot motion needs the hub's work-area (chicken headcount) check";
  return null;
}
