// schedules.ts - finding and matching device schedules (no side effects, unit-tested).
// Used by schedule.runner.ts. Paths: schedules/{deviceId}/items/{id} (what the app writes)
// and the older devices/{deviceId}/schedules/{id}.

export interface ScheduleDoc {
  deviceId?: string;
  action?: "feed" | "clean" | "door" | "water" | "weed_pass";
  passes?: number;            // weed_pass: detection passes per run (1-10)
  task?: "weed" | "plant_scan" | "patrol"; // weed_pass: what the pass looks for (default weed)
  cronExpression?: string;
  enabled?: boolean;
  amount?: number;
  state?: "open" | "close";   // door: which way (default open)
  on?: boolean;               // water/relay: on or off (default on)
  timeZone?: string;          // IANA zone the cron was written in (the app stamps the browser's)
  lastRun?: number | { toMillis?: () => number } | null;
}

// Match one cron field (supports *, n, a-b, */n, and comma lists) against a value.
function matchField(field: string, val: number): boolean {
  return field.split(",").some((part) => {
    if (part === "*") return true;
    if (part.startsWith("*/")) {
      const n = Number(part.slice(2));
      return n > 0 && val % n === 0;
    }
    if (part.includes("-")) {
      const [a, b] = part.split("-").map(Number);
      return val >= a && val <= b;
    }
    return Number(part) === val;
  });
}

/** A usable IANA time zone name, or undefined. */
export function validTimeZone(tz: unknown): string | undefined {
  if (typeof tz !== "string" || !tz.trim()) return undefined;
  try {
    new Intl.DateTimeFormat("en-US", { timeZone: tz }).format(0);
    return tz;
  } catch {
    return undefined;
  }
}

const WEEKDAYS: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
function wallClock(d: Date, timeZone?: string) {
  if (!timeZone) return { min: d.getMinutes(), hour: d.getHours(), day: d.getDate(), month: d.getMonth() + 1, dow: d.getDay() };
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone, hourCycle: "h23", month: "numeric", day: "numeric", hour: "numeric", minute: "numeric", weekday: "short",
  }).formatToParts(d);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return { min: Number(get("minute")), hour: Number(get("hour")) % 24, day: Number(get("day")), month: Number(get("month")), dow: WEEKDAYS[get("weekday")] ?? 0 };
}

/**
 * 5-field cron: minute hour day-of-month month day-of-week.
 *
 * @param timeZone - Match in this IANA zone (the schedule's own); omitted = the hub's local time
 */
export function cronMatch(expr: string, d: Date, timeZone?: string): boolean {
  const f = expr.trim().split(/\s+/);
  if (f.length !== 5) return false;
  const w = wallClock(d, timeZone);
  return (
    matchField(f[0], w.min) &&
    matchField(f[1], w.hour) &&
    matchField(f[2], w.day) &&
    matchField(f[3], w.month) &&
    matchField(f[4], w.dow)
  );
}

/**
 * The zone a schedule is matched in: its own timeZone (the app stamps the browser's), then
 * TC_TIMEZONE on the hub, else undefined = the hub's local time (older schedules).
 */
export function scheduleTimeZone(s: ScheduleDoc, env: NodeJS.ProcessEnv = process.env): string | undefined {
  return validTimeZone(s.timeZone) ?? validTimeZone(env.TC_TIMEZONE);
}

function toMs(v: ScheduleDoc["lastRun"]): number {
  if (!v) return 0;
  if (typeof v === "number") return v;
  return v.toMillis?.() ?? 0;
}

/** The slice of the Firestore Admin SDK the runner uses (injected in tests). */
export interface ScheduleDb {
  collection(path: string): { listDocuments(): Promise<Array<{ id: string; collection(name: string): ScheduleQuerySource }>> };
  collectionGroup(name: string): ScheduleQuerySource;
}
interface ScheduleQuerySource {
  where(field: string, op: "==", value: unknown): { get(): Promise<{ docs: ScheduleSnap[] }> };
}
export interface ScheduleSnap {
  data(): unknown;
  ref: { path: string; parent: { parent: { id: string } | null }; set(v: Record<string, unknown>, o: { merge: boolean }): Promise<unknown> };
}

/**
 * Every enabled schedule, from the app's path (schedules/{deviceId}/items) and the legacy
 * devices/{deviceId}/schedules path, each once.
 */
export async function collectEnabledSchedules(db: ScheduleDb): Promise<Array<{ deviceId: string; s: ScheduleDoc; doc: ScheduleSnap }>> {
  const out: Array<{ deviceId: string; s: ScheduleDoc; doc: ScheduleSnap }> = [];
  const seen = new Set<string>();
  const add = (deviceId: string | undefined, doc: ScheduleSnap) => {
    if (!deviceId || seen.has(doc.ref.path)) return;
    seen.add(doc.ref.path);
    out.push({ deviceId, s: doc.data() as ScheduleDoc, doc });
  };
  // listDocuments() also returns the "missing" parent docs that only hold an items subcollection.
  // A schedule acts on the device it is filed under (rules enforce deviceId == path id).
  for (const parent of await db.collection("schedules").listDocuments()) {
    const snap = await parent.collection("items").where("enabled", "==", true).get();
    for (const doc of snap.docs) add(parent.id, doc);
  }
  const legacy = await db.collectionGroup("schedules").where("enabled", "==", true).get();
  for (const doc of legacy.docs) add((doc.data() as ScheduleDoc).deviceId || doc.ref.parent.parent?.id, doc);
  return out;
}

/** Due now (in the schedule's time zone) and not already fired this minute? */
export function isDue(s: ScheduleDoc, now: Date, timeZone: string | undefined = scheduleTimeZone(s)): boolean {
  if (!s.cronExpression || !cronMatch(s.cronExpression, now, timeZone)) return false;
  const last = toMs(s.lastRun);
  return !(last && Math.floor(last / 60000) === Math.floor(now.getTime() / 60000));
}

// ── commands and the shared queue (same contract as functions/src/scheduleExec.ts) ─────────

export interface HubCommand {
  suffix: "feed" | "clean" | "door" | "light" | "weed";
  payload: Record<string, unknown>;
  /** Robot motion inside the coop/yard: needs the work-area gate (E-STOP + headcount). */
  motion: boolean;
}

const clampNum = (v: unknown, lo: number, hi: number, dflt: number) => {
  const n = Number(v);
  return Number.isFinite(n) ? Math.min(hi, Math.max(lo, Math.round(n))) : dflt;
};

/** The command a schedule sends. Mirrors commandFor() in functions/src/scheduleExec.ts. */
export function commandFor(s: ScheduleDoc): HubCommand | null {
  switch (s.action) {
    case "feed": return { suffix: "feed", payload: { amount: clampNum(s.amount, 1, 1000, 50) }, motion: false };
    case "door": return { suffix: "door", payload: { state: s.state === "close" ? "close" : "open" }, motion: false };
    case "water": return { suffix: "light", payload: { on: s.on !== false }, motion: false };
    case "clean": return { suffix: "clean", payload: { action: "start" }, motion: true };
    case "weed_pass":
      return {
        suffix: "weed",
        payload: { action: "pass", passes: clampNum(s.passes, 1, 10, 1), task: s.task === "plant_scan" || s.task === "patrol" ? s.task : "weed" },
        motion: true,
      };
    default: return null;
  }
}

/** Queue id shared with the cloud runner: one schedule at one minute is one command. */
export const commandId = (scheduleId: string, minuteMs: number) => `sched_${scheduleId}_${Math.floor(minuteMs / 60_000)}`;

/** How long a queued command stays deliverable (matches functions COMMAND_TTL_MS). */
export const COMMAND_TTL_MS = 10 * 60_000;

/** The slice of Firestore the queue code uses (deviceCommands/{deviceId}/queue/{id}). */
export interface QueueDb {
  /** Create the doc; false if it already exists. */
  create(deviceId: string, cmdId: string, doc: Record<string, unknown>): Promise<boolean>;
  update(deviceId: string, cmdId: string, patch: Record<string, unknown>): Promise<void>;
  pending(deviceId: string): Promise<Array<Record<string, unknown> & { id: string }>>;
  /** pending → delivering atomically; false when another hub/device took it. */
  take(deviceId: string, cmdId: string): Promise<boolean>;
}

export interface Delivery {
  /** E-STOP / work-area refusal for this device, or null to send. */
  refusal(deviceId: string, cmd: HubCommand): string | null;
  publish(deviceId: string, cmd: HubCommand): boolean;
}

/**
 * Claim a due schedule before firing it, so the cloud runner (or another hub) does not also
 * send it. Returns false when the command was already queued elsewhere; that copy is then
 * delivered by deliverQueued() if it is still pending.
 */
export async function claimScheduled(q: QueueDb, deviceId: string, scheduleId: string, cmd: HubCommand, minuteMs: number, now: number): Promise<{ claimed: boolean; id: string }> {
  const id = commandId(scheduleId, minuteMs);
  const claimed = await q.create(deviceId, id, {
    deviceId, command: cmd.suffix, payload: cmd.payload, motion: cmd.motion, source: "schedule", scheduleId,
    dueAt: minuteMs, status: "delivering", createdBy: "hub", createdAt: now, expiresAt: minuteMs + COMMAND_TTL_MS,
  });
  return { claimed, id };
}

/**
 * Deliver commands the cloud queued for devices on this hub, through the same gates as a
 * button press. Commands held by E-STOP / the work-area gate are marked blocked, never retried
 * later (a door must not swing open hours after its time).
 */
export async function deliverQueued(q: QueueDb, deviceIds: Iterable<string>, d: Delivery, now: number): Promise<Array<{ deviceId: string; id: string; status: string; reason?: string }>> {
  const out: Array<{ deviceId: string; id: string; status: string; reason?: string }> = [];
  for (const deviceId of deviceIds) {
    for (const c of await q.pending(deviceId)) {
      if (!(await q.take(deviceId, c.id))) continue;
      const cmd: HubCommand = { suffix: c.command as HubCommand["suffix"], payload: (c.payload ?? {}) as Record<string, unknown>, motion: c.motion === true };
      let status = "delivered";
      let reason: string | undefined;
      if (typeof c.expiresAt === "number" && c.expiresAt < now) { status = "expired"; reason = "expired"; } else if (!["feed", "clean", "door", "light", "weed"].includes(cmd.suffix)) {
        status = "blocked"; reason = `unknown command ${String(c.command)}`;
      } else {
        reason = d.refusal(deviceId, cmd) ?? undefined;
        if (reason) status = "blocked";
        else if (!d.publish(deviceId, cmd)) { status = "pending"; reason = "broker not connected"; }
      }
      await q.update(deviceId, c.id, { status, ...(reason ? { reason } : {}), settledAt: now, deliveredBy: "hub" });
      out.push({ deviceId, id: c.id, status, ...(reason ? { reason } : {}) });
    }
  }
  return out;
}
