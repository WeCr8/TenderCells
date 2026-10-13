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

// 5-field cron: minute hour day-of-month month day-of-week.
export function cronMatch(expr: string, d: Date): boolean {
  const f = expr.trim().split(/\s+/);
  if (f.length !== 5) return false;
  return (
    matchField(f[0], d.getMinutes()) &&
    matchField(f[1], d.getHours()) &&
    matchField(f[2], d.getDate()) &&
    matchField(f[3], d.getMonth() + 1) &&
    matchField(f[4], d.getDay())
  );
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

/** Due now and not already fired this minute? */
export function isDue(s: ScheduleDoc, now: Date): boolean {
  if (!s.cronExpression || !cronMatch(s.cronExpression, now)) return false;
  const last = toMs(s.lastRun);
  return !(last && Math.floor(last / 60000) === Math.floor(now.getTime() / 60000));
}
