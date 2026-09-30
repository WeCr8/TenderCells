// yardEvents.ts - yard events, command acknowledgements and device presence.
//
// MQTT improvements (2026-09-27):
//   tc/{id}/event   device → API  station flags: eggs ready, pickup ready, weed detected
//                                  (human review), roost headcount ... upserted by id
//   tc/{id}/ack     device → API  {seq, ok, error?} reply to a command carrying seq, so
//                                  the API can tell the user "the robot accepted it"
//   tc/{id}/status  device → API  {online} retained + last-will "offline", plus lastSeen
//                                  from any message - so the UI knows who is reachable
// Everything here is in-memory (the API is the LAN hub); Firestore mirroring stays
// in mqtt.controller for sensors/state/alerts.

export type YardEventType = "egg_ready" | "pickup_ready" | "weed_detected" | "headcount" | "alert";
export type YardEventStatus = "active" | "pending_review" | "approved" | "rejected" | "treated" | "cleared";

export interface YardEvent {
  id: string;
  deviceId: string;
  type: YardEventType;
  status: YardEventStatus;
  title: string;
  detail?: string;
  count?: number;
  confidence?: number;       // 0..1
  itemId?: string;           // property-layout item the flag belongs to
  bedMm?: { x: number; y: number }; // position inside the item footprint (weeds)
  station?: string;          // e.g. "nest box 2"
  label?: string;            // what was seen, e.g. "fox" (predator alerts)
  bearingDeg?: number;       // from the reporting device, 0 = map north (up), clockwise
  distanceFt?: number;       // estimated range from the device, when known
  propFt?: { x: number; y: number }; // property position (ft) - mobile robot sightings
  ts: number;
  updatedAt: number;
}

const TYPES: YardEventType[] = ["egg_ready", "pickup_ready", "weed_detected", "headcount", "alert"];
const STATUSES: YardEventStatus[] = ["active", "pending_review", "approved", "rejected", "treated", "cleared"];
const ID_RE = /^[A-Za-z0-9_.:-]{1,64}$/;
const MAX_PER_DEVICE = 300;
const CLOSED_TTL_MS = 10 * 60_000; // keep treated/rejected/cleared flags visible for 10 min

const events = new Map<string, Map<string, YardEvent>>();

const num = (v: unknown): number | undefined => (typeof v === "number" && Number.isFinite(v) ? v : undefined);
const str = (v: unknown, max = 120): string | undefined =>
  typeof v === "string" && v.trim() ? v.trim().slice(0, max) : undefined;

/**
 * Validate and upsert an event published by a device.
 *
 * @param deviceId - From the topic (tc/{deviceId}/event)
 * @param payload  - Event JSON
 * @returns An error string when rejected, otherwise null
 */
export function ingestEvent(deviceId: string, payload: Record<string, unknown>): string | null {
  const id = str(payload.id, 64);
  if (!id || !ID_RE.test(id)) return "event.id missing or invalid";
  const type = payload.type as YardEventType;
  if (!TYPES.includes(type)) return `event.type must be one of ${TYPES.join(", ")}`;
  const status = (payload.status ?? (type === "weed_detected" ? "pending_review" : "active")) as YardEventStatus;
  if (!STATUSES.includes(status)) return `event.status must be one of ${STATUSES.join(", ")}`;
  const bed = payload.bedMm as { x?: unknown; y?: unknown } | undefined;
  const bedMm = bed && num(bed.x) !== undefined && num(bed.y) !== undefined ? { x: bed.x as number, y: bed.y as number } : undefined;
  const pf = payload.propFt as { x?: unknown; y?: unknown } | undefined;
  const propFt = pf && num(pf.x) !== undefined && num(pf.y) !== undefined ? { x: pf.x as number, y: pf.y as number } : undefined;
  const now = Date.now();

  const byId = events.get(deviceId) ?? new Map<string, YardEvent>();
  const prev = byId.get(id);
  byId.set(id, {
    ...(prev ?? {}),
    id, deviceId, type, status,
    title: str(payload.title) ?? prev?.title ?? type.replace(/_/g, " "),
    detail: str(payload.detail, 240) ?? prev?.detail,
    count: num(payload.count) ?? prev?.count,
    confidence: num(payload.confidence) ?? prev?.confidence,
    itemId: str(payload.itemId, 64) ?? prev?.itemId,
    bedMm: bedMm ?? prev?.bedMm,
    propFt: propFt ?? prev?.propFt,
    station: str(payload.station) ?? prev?.station,
    label: str(payload.label, 40) ?? prev?.label,
    bearingDeg: num(payload.bearingDeg) !== undefined ? (((payload.bearingDeg as number) % 360) + 360) % 360 : prev?.bearingDeg,
    distanceFt: num(payload.distanceFt) !== undefined ? Math.max(0, payload.distanceFt as number) : prev?.distanceFt,
    ts: prev?.ts ?? (num(payload.ts) ?? now),
    updatedAt: now,
  });
  // Bound memory: drop the oldest closed events first.
  if (byId.size > MAX_PER_DEVICE) {
    const sorted = [...byId.values()].sort((a, b) => a.updatedAt - b.updatedAt);
    for (const e of sorted) {
      if (byId.size <= MAX_PER_DEVICE) break;
      byId.delete(e.id);
    }
  }
  events.set(deviceId, byId);
  return null;
}

/** Open events plus recently closed ones (so a treated weed can show "done"). */
export function listEvents(deviceId: string): YardEvent[] {
  const cutoff = Date.now() - CLOSED_TTL_MS;
  return [...(events.get(deviceId)?.values() ?? [])]
    .filter((e) => !["rejected", "treated", "cleared"].includes(e.status) || e.updatedAt > cutoff)
    .sort((a, b) => b.ts - a.ts);
}

export function getEvent(deviceId: string, id: string): YardEvent | undefined {
  return events.get(deviceId)?.get(id);
}

/** Optimistic local status change (the device confirms via its own event update). */
export function setEventStatus(deviceId: string, id: string, status: YardEventStatus): YardEvent | undefined {
  const e = getEvent(deviceId, id);
  if (e) { e.status = status; e.updatedAt = Date.now(); }
  return e;
}

/**
 * Turn a WatchTower predator alert (tc/{id}/alert) into a map event so the 3D view can
 * place it: bearing (and distance, when the camera can estimate it) from the tower.
 *
 * @returns An error string when the alert is not a predator detection, otherwise null
 */
export function ingestPredatorAlert(deviceId: string, payload: Record<string, unknown>): string | null {
  if (payload.type !== "predator") return "not a predator alert";
  const label = str(payload.label, 40) ?? str(payload.species, 40) ?? "Predator";
  const conf = num(payload.confidence);
  return ingestEvent(deviceId, {
    id: `predator-${Date.now()}`,
    type: "alert",
    status: "active",
    title: `${label[0].toUpperCase()}${label.slice(1)} detected`,
    detail: [num(payload.camera) !== undefined ? `camera ${(payload.camera as number) + 1}` : undefined,
      num(payload.distanceFt) !== undefined ? `~${Math.round(payload.distanceFt as number)} ft away` : undefined]
      .filter(Boolean).join(" · ") || undefined,
    label,
    confidence: conf,
    bearingDeg: payload.bearingDeg,
    distanceFt: payload.distanceFt,
    station: "WatchTower",
  });
}

// ── command acknowledgements ──────────────────────────────────────────────────
export interface Ack { ok: boolean; error?: string }
const pendingAcks = new Map<string, (ack: Ack) => void>();
let lastSeq = 0;

/** Monotonic command sequence number (unique even within the same millisecond). */
export function nextSeq(): number {
  lastSeq = Math.max(Date.now(), lastSeq + 1);
  return lastSeq;
}

/**
 * Wait for tc/{deviceId}/ack with this seq.
 *
 * @returns The device's ack, or null if none arrived in time (device offline or
 *          firmware without ack support - the command may still have run)
 */
export function waitForAck(deviceId: string, seq: number, timeoutMs = 3000): Promise<Ack | null> {
  const key = `${deviceId}:${seq}`;
  return new Promise((resolve) => {
    const timer = setTimeout(() => { pendingAcks.delete(key); resolve(null); }, timeoutMs);
    pendingAcks.set(key, (ack) => { clearTimeout(timer); pendingAcks.delete(key); resolve(ack); });
  });
}

export function ingestAck(deviceId: string, payload: Record<string, unknown>): void {
  const seq = num(payload.seq);
  if (seq === undefined) return;
  pendingAcks.get(`${deviceId}:${seq}`)?.({ ok: payload.ok !== false, error: str(payload.error, 240) });
}

// ── presence ──────────────────────────────────────────────────────────────────
interface Presence { online: boolean; lastSeen: number; since: number }
const presence = new Map<string, Presence>();

/** Any message from a device proves it is alive. */
export function touch(deviceId: string): void {
  const now = Date.now();
  const p = presence.get(deviceId);
  if (!p) presence.set(deviceId, { online: true, lastSeen: now, since: now });
  else { if (!p.online) { p.online = true; p.since = now; } p.lastSeen = now; }
}

export function ingestStatus(deviceId: string, payload: Record<string, unknown>): void {
  const online = payload.online !== false && payload.state !== "offline";
  const now = Date.now();
  const p = presence.get(deviceId);
  if (!p || p.online !== online) presence.set(deviceId, { online, lastSeen: online ? now : (p?.lastSeen ?? now), since: now });
  else if (online) p.lastSeen = now;
}

/** Presence for one device; devices silent for 90 s count as offline. */
export function getPresence(deviceId: string): Presence & { stale: boolean } {
  const p = presence.get(deviceId) ?? { online: false, lastSeen: 0, since: 0 };
  const stale = Date.now() - p.lastSeen > 90_000;
  return { ...p, online: p.online && !stale, stale };
}

/** Test helper. */
export function _resetYardState(): void {
  events.clear(); pendingAcks.clear(); presence.clear(); lastSeq = 0;
}
