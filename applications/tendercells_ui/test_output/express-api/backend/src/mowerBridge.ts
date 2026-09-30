// mowerBridge.ts - runs linked robot mowers on the hub (see mower.ts for the rules).
//
//   home-assistant  Any mower Home Assistant exposes as a lawn_mower entity. The hub polls
//                   GET /api/states/{entity} and calls lawn_mower.start_mowing / pause /
//                   dock. HA_URL + HA_TOKEN (a long-lived access token) live only in the
//                   hub's environment - never in the browser, Firestore or the repo.
//   mqtt            A mower (DIY, or an OpenMower-style bridge) that speaks the Tender Cells
//                   contract itself: subscribes tc/{id}/cmd/mower {action, seq}, replies on
//                   tc/{id}/ack and publishes tc/{id}/state/mower.
//
// Either way the mower becomes a normal Tender Cells robot: retained tc/{id}/state/mower and
// tc/{id}/status, presence, /api/state.xml and the twin tc:robot:robot-mower:{id}.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import {
  ANIMAL_SEEN_WINDOW_MS, HA_SERVICE, haToActivity, mowingBlockedReason,
  type InterlockContext, type MowerAction, type MowerActivity, type MowerLink, type MowerState,
} from "./mower.js";
import { listAllEvents } from "./yardEvents.js";

/** What the bridge needs from the MQTT controller (kept narrow to avoid an import cycle). */
export interface MowerHost {
  publish(topic: string, payload: Record<string, unknown>, retain: boolean): boolean;
  /** Publish tc/{id}/cmd/{suffix} with a seq; null when the broker is down. */
  command(deviceId: string, suffix: string, payload: Record<string, unknown>): number | null;
  waitForAck(deviceId: string, seq: number): Promise<{ ok: boolean; error?: string } | null>;
  telemetry(deviceId: string): { payload?: Record<string, unknown>; at: number };
  subState(deviceId: string, sub: string): Record<string, unknown> | undefined;
  estopLatched(deviceId: string): boolean;
}

export interface CommandOutcome { ok: boolean; status: number; error?: string; acked?: boolean; message?: string }

const HA_URL = (process.env.HA_URL || "").replace(/\/+$/, "");
const HA_TOKEN = process.env.HA_TOKEN || "";
const POLL_MS = Math.max(5_000, Number(process.env.MOWER_POLL_MS || 15_000));
const LINKS_FILE = process.env.MOWER_LINKS_FILE || join(process.cwd(), ".tendercells", "mower-links.json");

export const HA_CONFIGURED = Boolean(HA_URL && HA_TOKEN);

const links = new Map<string, MowerLink>();
const states = new Map<string, MowerState>();
let host: MowerHost | null = null;
let timer: NodeJS.Timeout | null = null;

// ── storage (links survive a hub restart; no secrets are stored here) ────────
function load(): void {
  try {
    if (!existsSync(LINKS_FILE)) return;
    for (const l of JSON.parse(readFileSync(LINKS_FILE, "utf8")) as MowerLink[]) links.set(l.deviceId, l);
  } catch (e) {
    console.warn("[mower] could not read", LINKS_FILE, (e as Error).message);
  }
}
function save(): void {
  try {
    mkdirSync(dirname(LINKS_FILE), { recursive: true });
    writeFileSync(LINKS_FILE, JSON.stringify([...links.values()], null, 2));
  } catch (e) {
    console.warn("[mower] could not save", LINKS_FILE, (e as Error).message);
  }
}

// ── Home Assistant REST ──────────────────────────────────────────────────────
async function ha(path: string, init: RequestInit = {}): Promise<unknown> {
  if (!HA_CONFIGURED) throw Object.assign(new Error("Home Assistant is not configured on this hub: set HA_URL and HA_TOKEN"), { status: 503 });
  const res = await fetch(`${HA_URL}${path}`, {
    ...init,
    headers: { Authorization: `Bearer ${HA_TOKEN}`, "Content-Type": "application/json", ...(init.headers ?? {}) },
    signal: AbortSignal.timeout(8_000),
  });
  if (!res.ok) throw Object.assign(new Error(`Home Assistant replied ${res.status} for ${path.split("?")[0]}`), { status: 502 });
  return res.json();
}

interface HaState { entity_id: string; state: string; attributes?: Record<string, unknown> }

/** lawn_mower.* entities Home Assistant knows about (for the link picker). */
export async function listHaMowers(): Promise<{ entityId: string; name: string; state: MowerActivity }[]> {
  const all = (await ha("/api/states")) as HaState[];
  return all.filter((s) => s.entity_id.startsWith("lawn_mower."))
    .map((s) => ({ entityId: s.entity_id, name: String(s.attributes?.friendly_name ?? s.entity_id), state: haToActivity(s.state) }));
}

async function readHa(link: MowerLink): Promise<MowerState> {
  const prev = states.get(link.deviceId);
  try {
    const s = (await ha(`/api/states/${link.entityId}`)) as HaState;
    let battery: number | undefined;
    if (link.batteryEntityId) {
      const b = (await ha(`/api/states/${link.batteryEntityId}`).catch(() => null)) as HaState | null;
      const n = Number(b?.state);
      if (Number.isFinite(n)) battery = Math.max(0, Math.min(100, Math.round(n)));
    }
    const online = s.state !== "unavailable";
    return { activity: haToActivity(s.state), battery, online, source: "home-assistant", entityId: link.entityId,
      error: s.state === "error" ? "The mower reports an error - check it in its own app" : undefined,
      lastInterlock: prev?.lastInterlock, ts: Date.now() };
  } catch (e) {
    return { activity: "unknown", online: false, source: "home-assistant", entityId: link.entityId,
      error: (e as Error).message, lastInterlock: prev?.lastInterlock, ts: Date.now() };
  }
}

// ── interlock ────────────────────────────────────────────────────────────────
function context(link: MowerLink): InterlockContext {
  const h = host!;
  const now = Date.now();
  const mowerState = h.subState(link.deviceId, "mower");
  return {
    now: new Date(now),
    estop: h.estopLatched(link.deviceId) || mowerState?.estop === true,
    habitat: (id) => {
      const t = h.telemetry(id);
      return t.payload ? { doorState: t.payload.doorState, ageMs: now - t.at } : undefined;
    },
    animalsSeen: listAllEvents()
      .filter((e) => e.finding === "animal" && e.status === "active" && now - e.ts < ANIMAL_SEEN_WINDOW_MS)
      .map((e) => e.label ?? e.animalGroup ?? "animal"),
  };
}

/** Why this mower may not run right now, or null. */
export function blockedReason(deviceId: string): string | null {
  const link = links.get(deviceId);
  if (!link || !host) return "This mower is not linked";
  return mowingBlockedReason(link, context(link));
}

// ── commands ─────────────────────────────────────────────────────────────────
async function send(link: MowerLink, action: MowerAction): Promise<CommandOutcome> {
  if (link.adapter === "home-assistant") {
    try {
      await ha(`/api/services/lawn_mower/${HA_SERVICE[action]}`, { method: "POST", body: JSON.stringify({ entity_id: link.entityId }) });
      // Home Assistant accepted the service call; the next poll shows what the mower did.
      return { ok: true, status: 200, acked: true, message: "Home Assistant accepted the command" };
    } catch (e) {
      const err = e as Error & { status?: number };
      return { ok: false, status: err.status ?? 502, error: err.message };
    }
  }
  const seq = host!.command(link.deviceId, "mower", { action });
  if (seq === null) return { ok: false, status: 503, error: "MQTT not connected" };
  const ack = await host!.waitForAck(link.deviceId, seq);
  if (ack && !ack.ok) return { ok: false, status: 409, acked: true, error: ack.error ?? "The mower refused the command" };
  return { ok: true, status: ack ? 200 : 202, acked: !!ack, ...(ack ? {} : { message: "Sent - no acknowledgement yet (mower offline or busy)" }) };
}

function recordInterlock(deviceId: string, reason: string, action: "refused" | "sent-home"): void {
  const s = states.get(deviceId);
  const next: MowerState = { ...(s ?? { activity: "unknown", online: false, source: "device", ts: Date.now() }),
    lastInterlock: { reason, at: Date.now(), action } };
  states.set(deviceId, next);
  const link = links.get(deviceId);
  // A native mower publishes its own state; only mirror bridged (HA) mowers.
  if (link?.adapter === "home-assistant") host?.publish(`tc/${deviceId}/state/mower`, { ...next }, true);
}

/**
 * Start / pause / dock. Start is refused while the interlock is not clear; pause and
 * dock are never refused (they make things safer).
 */
export async function commandMower(deviceId: string, action: MowerAction): Promise<CommandOutcome> {
  const link = links.get(deviceId);
  if (!link) return { ok: false, status: 404, error: "This mower is not linked" };
  if (action === "start") {
    const reason = blockedReason(deviceId);
    if (reason) { recordInterlock(deviceId, reason, "refused"); return { ok: false, status: 409, error: reason }; }
  }
  return send(link, action);
}

/** E-STOP on a mower: stop and send it home. A third-party mower cannot be power-cut from here. */
export async function onEstop(deviceId: string): Promise<void> {
  const link = links.get(deviceId);
  if (!link) return;
  await send(link, "pause");
  await send(link, "dock");
  recordInterlock(deviceId, "E-STOP pressed", "sent-home");
}

// ── polling + the watcher that sends a mowing mower home ─────────────────────
const MOVING: MowerActivity[] = ["mowing"];

async function pollOne(link: MowerLink): Promise<void> {
  let state: MowerState | undefined;
  if (link.adapter === "home-assistant") {
    state = await readHa(link);
    states.set(link.deviceId, state);
    host!.publish(`tc/${link.deviceId}/state/mower`, { ...state }, true);
    host!.publish(`tc/${link.deviceId}/status`, { online: state.online }, true);
  } else {
    const s = host!.subState(link.deviceId, "mower");
    if (s) state = { ...(s as unknown as MowerState), source: "device", lastInterlock: states.get(link.deviceId)?.lastInterlock };
    if (state) states.set(link.deviceId, state);
  }
  if (!state || !MOVING.includes(state.activity)) return;
  const reason = blockedReason(link.deviceId);
  if (!reason) return;
  // The mower is out while it must not be (its own schedule, or the flock was let out).
  console.warn(`[mower] ${link.deviceId}: sending home - ${reason}`);
  await send(link, "pause");
  await send(link, "dock");
  recordInterlock(link.deviceId, reason, "sent-home");
  // Show what the mower did (returning / docked) now, not at the next poll.
  if (link.adapter === "home-assistant") {
    const after = await readHa(link);
    states.set(link.deviceId, after);
    host!.publish(`tc/${link.deviceId}/state/mower`, { ...after }, true);
  }
}

async function pollAll(): Promise<void> {
  await Promise.all([...links.values()].map((l) => pollOne(l).catch((e) => console.warn("[mower]", l.deviceId, (e as Error).message))));
}

/** Start the bridge (server.ts). Safe to call once. */
export function startMowerBridge(h: MowerHost): void {
  host = h;
  load();
  if (timer) return;
  timer = setInterval(() => void pollAll(), POLL_MS);
  timer.unref?.();
  if (links.size) console.log(`[mower] ${links.size} linked mower(s); Home Assistant ${HA_CONFIGURED ? "configured" : "not configured"}`);
}

// ── link management ──────────────────────────────────────────────────────────
export const listLinks = (only?: Set<string> | null) =>
  [...links.values()].filter((l) => !only || only.has(l.deviceId))
    .map((l) => ({ link: l, state: states.get(l.deviceId) ?? null, blocked: host ? blockedReason(l.deviceId) : null }));

export const getLink = (deviceId: string) => links.get(deviceId);

export function mowerView(deviceId: string) {
  const link = links.get(deviceId);
  return link ? { link, state: states.get(deviceId) ?? null, blocked: blockedReason(deviceId) } : null;
}

/** Create a link. HA mowers are checked against Home Assistant first. */
export async function createLink(body: Record<string, unknown>): Promise<MowerLink> {
  if (body.adapter === "home-assistant") await ha(`/api/states/${body.entityId}`);
  const deviceId = typeof body.deviceId === "string" ? body.deviceId : `mw_${randomBytes(3).toString("hex")}`;
  if (links.has(deviceId)) throw Object.assign(new Error(`${deviceId} is already linked`), { status: 409 });
  const now = Date.now();
  const link: MowerLink = {
    deviceId, name: String(body.name).trim(), adapter: body.adapter as MowerLink["adapter"],
    entityId: body.entityId as string | undefined, batteryEntityId: (body.batteryEntityId as string | null) ?? undefined,
    guardHabitats: (body.guardHabitats as string[] | undefined) ?? [], noAnimalsConfirmed: body.noAnimalsConfirmed === true,
    quietHours: body.quietHours === undefined ? { start: 20, end: 7 } : (body.quietHours as MowerLink["quietHours"]),
    createdAt: now, updatedAt: now,
  };
  links.set(deviceId, link);
  save();
  if (host) void pollOne(link).catch(() => undefined);
  return link;
}

export function updateLink(deviceId: string, patch: Record<string, unknown>): MowerLink | null {
  const link = links.get(deviceId);
  if (!link) return null;
  const next: MowerLink = { ...link, updatedAt: Date.now() };
  for (const k of ["name", "entityId", "batteryEntityId", "guardHabitats", "noAnimalsConfirmed", "quietHours"] as const) {
    if (patch[k] !== undefined) (next as unknown as Record<string, unknown>)[k] = k === "name" ? String(patch[k]).trim() : patch[k];
  }
  if (next.batteryEntityId === null) next.batteryEntityId = undefined;
  links.set(deviceId, next);
  save();
  return next;
}

export function removeLink(deviceId: string): boolean {
  const ok = links.delete(deviceId);
  states.delete(deviceId);
  if (ok) save();
  return ok;
}

/** Test helper. */
export function _resetMowers(h: MowerHost | null = null): void {
  links.clear(); states.clear(); host = h;
}
