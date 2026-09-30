// mowerBridge.ts - runs linked robot mowers on the hub (rules in mower.ts, vendor clouds in
// mowerVendors.ts). See docs/ROBOT_MOWERS.md.
//
//   husqvarna       Husqvarna Automower Connect API (official)
//   gardena         GARDENA smart system API - SILENO (official)
//   home-assistant  Any lawn_mower entity. HA_URL + HA_TOKEN live only in the hub's environment.
//   mqtt            A mower that speaks the Tender Cells contract itself: tc/{id}/cmd/mower
//                   {action, durationMin?, seq} -> tc/{id}/ack, and publishes tc/{id}/state/mower.
//
// Safety loop (every 5 s, no network): when a mower's interlock trips (door opened, animal
// seen, quiet hours, E-STOP) the hub HOLDS it - parks it until further notice (cloud mowers,
// so its own schedule cannot launch it into the flock) or sends it home if it is out (HA /
// MQTT). When the interlock clears it releases the hold, and - only if the owner opted in with
// autoResume - puts the mower back on its own schedule. Every mower becomes a normal Tender
// Cells robot: retained tc/{id}/state/mower + tc/{id}/status, /api/state.xml, twin
// tc:robot:robot-mower:{id}.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { randomBytes } from "node:crypto";
import {
  ADAPTER_CAPABILITIES, ANIMAL_SEEN_WINDOW_MS, GO_ACTIONS, HA_SERVICE, haToActivity, mowingBlockedReason,
  type InterlockContext, type MowerAction, type MowerActivity, type MowerCapabilities, type MowerInterlockEvent,
  type MowerLink, type MowerSettingsPatch, type MowerState, type StartOptions,
} from "./mower.js";
import { HUSQVARNA_CONFIGURED, MAMMOTION_CONFIGURED, gardena, husqvarna, mammotion } from "./mowerVendors.js";
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
const CLOUD_POLL_MS = Math.max(60_000, Number(process.env.MOWER_CLOUD_POLL_MS || 300_000));
const SAFETY_TICK_MS = 5_000;
const LINKS_FILE = process.env.MOWER_LINKS_FILE || join(process.cwd(), ".tendercells", "mower-links.json");

export const HA_CONFIGURED = Boolean(HA_URL && HA_TOKEN);
/** Which connections this hub is set up for (shown in the link dialog). */
export const vendorStatus = () => ({ homeAssistant: HA_CONFIGURED, husqvarna: HUSQVARNA_CONFIGURED, gardena: HUSQVARNA_CONFIGURED, mammotion: MAMMOTION_CONFIGURED });

const links = new Map<string, MowerLink>();
const states = new Map<string, MowerState>();
const held = new Set<string>();
const lastPoll = new Map<string, number>();
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

/** Mowers on a vendor account / Home Assistant, for the link picker. Never returns secrets. */
export async function discover(vendor: string): Promise<{ id: string; name: string; locationId?: string; detail?: string }[]> {
  switch (vendor) {
    case "home-assistant": return (await listHaMowers()).map((m) => ({ id: m.entityId, name: m.name, detail: m.state }));
    case "husqvarna": return (await husqvarna.list()).map((m) => ({ id: m.vendorId, name: m.name, detail: m.model }));
    case "gardena": return (await gardena.list()).map((m) => ({ id: m.vendorId, name: m.name, locationId: m.locationId }));
    case "mammotion": return (await mammotion.list()).map((m) => ({ id: m.vendorId, name: m.name, detail: m.model }));
    default: throw Object.assign(new Error("vendor must be home-assistant, husqvarna, gardena or mammotion"), { status: 400 });
  }
}

// ── adapters ─────────────────────────────────────────────────────────────────
interface Adapter {
  read(link: MowerLink): Promise<MowerState | null>;
  act(link: MowerLink, action: MowerAction, opts: StartOptions): Promise<CommandOutcome>;
  settings?(link: MowerLink, patch: MowerSettingsPatch): Promise<void>;
}

const offline = (link: MowerLink, source: MowerState["source"], error: string): MowerState =>
  ({ activity: "unknown", online: false, source, error, entityId: link.entityId, ts: Date.now() });

const cloudOk = (): CommandOutcome => ({ ok: true, status: 200, acked: true, message: "The mower's cloud accepted the command" });
const cloudFail = (e: unknown): CommandOutcome => {
  const err = e as Error & { status?: number };
  return { ok: false, status: err.status ?? 502, error: err.message };
};

const ADAPTERS: Record<MowerLink["adapter"], Adapter> = {
  "home-assistant": {
    async read(link) {
      try {
        const s = (await ha(`/api/states/${link.entityId}`)) as HaState;
        let battery: number | undefined;
        if (link.batteryEntityId) {
          const b = (await ha(`/api/states/${link.batteryEntityId}`).catch(() => null)) as HaState | null;
          const n = Number(b?.state);
          if (Number.isFinite(n)) battery = Math.max(0, Math.min(100, Math.round(n)));
        }
        return { activity: haToActivity(s.state), battery, online: s.state !== "unavailable", source: "home-assistant", entityId: link.entityId,
          error: s.state === "error" ? "The mower reports an error - check it in its own app" : undefined,
          capabilities: ADAPTER_CAPABILITIES["home-assistant"], ts: Date.now() };
      } catch (e) {
        return offline(link, "home-assistant", (e as Error).message);
      }
    },
    async act(link, action) {
      const service = HA_SERVICE[action];
      if (!service) return { ok: false, status: 400, error: `Home Assistant mowers cannot ${action.replace(/_/g, " ")}` };
      try {
        await ha(`/api/services/lawn_mower/${service}`, { method: "POST", body: JSON.stringify({ entity_id: link.entityId }) });
        return { ok: true, status: 200, acked: true, message: "Home Assistant accepted the command" };
      } catch (e) { return cloudFail(e); }
    },
  },
  husqvarna: {
    async read(link) {
      try { return await husqvarna.read(link.vendorId!); } catch (e) { return offline(link, "husqvarna", (e as Error).message); }
    },
    async act(link, action, opts) {
      try { await husqvarna.act(link.vendorId!, action, opts); return cloudOk(); } catch (e) { return cloudFail(e); }
    },
    settings: (link, patch) => husqvarna.settings(link.vendorId!, patch),
  },
  gardena: {
    async read(link) {
      try { return await gardena.read(link.locationId!, link.vendorId!); } catch (e) { return offline(link, "gardena", (e as Error).message); }
    },
    async act(link, action, opts) {
      try { await gardena.act(link.vendorId!, action, opts); return cloudOk(); } catch (e) { return cloudFail(e); }
    },
  },
  mammotion: {
    async read(link) {
      try { return await mammotion.read(link.vendorId!); } catch (e) { return offline(link, "mammotion", (e as Error).message); }
    },
    async act(link, action, opts) {
      try { await mammotion.act(link.vendorId!, action, opts); return cloudOk(); } catch (e) { return cloudFail(e); }
    },
  },
  mqtt: {
    async read(link) {
      const s = host?.subState(link.deviceId, "mower");
      return s ? { ...(s as unknown as MowerState), source: "device", capabilities: ADAPTER_CAPABILITIES.mqtt } : null;
    },
    async act(link, action, opts) {
      // Native mowers get the whole plan: pattern, angle, edge passes, overlap, height and area.
      const seq = host!.command(link.deviceId, "mower", { action, ...(action === "start" ? opts : {}) });
      if (seq === null) return { ok: false, status: 503, error: "MQTT not connected" };
      const ack = await host!.waitForAck(link.deviceId, seq);
      if (ack && !ack.ok) return { ok: false, status: 409, acked: true, error: ack.error ?? "The mower refused the command" };
      return { ok: true, status: ack ? 200 : 202, acked: !!ack, ...(ack ? {} : { message: "Sent - no acknowledgement yet (mower offline or busy)" }) };
    },
  },
};

const isCloud = (l: MowerLink) => l.adapter === "husqvarna" || l.adapter === "gardena" || l.adapter === "mammotion";
const bridged = (l: MowerLink) => l.adapter !== "mqtt"; // a native mower publishes its own state

/** Capabilities the app should offer for this mower. */
export function capabilitiesOf(deviceId: string): MowerCapabilities {
  const link = links.get(deviceId);
  if (!link) return ADAPTER_CAPABILITIES.mqtt;
  return states.get(deviceId)?.capabilities ?? ADAPTER_CAPABILITIES[link.adapter];
}

function publishState(link: MowerLink): void {
  const s = states.get(link.deviceId);
  if (!s || !bridged(link)) return;
  host?.publish(`tc/${link.deviceId}/state/mower`, { ...s, held: held.has(link.deviceId) }, true);
  host?.publish(`tc/${link.deviceId}/status`, { online: s.online }, true);
}

async function refresh(link: MowerLink): Promise<MowerState | undefined> {
  const s = await ADAPTERS[link.adapter].read(link);
  lastPoll.set(link.deviceId, Date.now());
  if (!s) return states.get(link.deviceId);
  const next = { ...s, lastInterlock: states.get(link.deviceId)?.lastInterlock, held: held.has(link.deviceId) };
  states.set(link.deviceId, next);
  publishState(link);
  return next;
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

function recordInterlock(deviceId: string, reason: string, action: MowerInterlockEvent["action"]): void {
  const s = states.get(deviceId);
  const link = links.get(deviceId);
  states.set(deviceId, { ...(s ?? { activity: "unknown", online: false, source: link?.adapter === "mqtt" ? "device" : "home-assistant", ts: Date.now() }),
    held: held.has(deviceId), lastInterlock: { reason, at: Date.now(), action } });
  if (link) publishState(link);
}

const OUT: MowerActivity[] = ["mowing", "leaving", "unknown"];

/**
 * Hold a mower at home: cloud mowers are parked until further notice even when docked (so
 * their own schedule cannot start them); HA / MQTT mowers are sent home when they are out.
 */
async function hold(link: MowerLink, reason: string): Promise<void> {
  held.add(link.deviceId);
  const s = states.get(link.deviceId);
  const out = !s || OUT.includes(s.activity) || s.activity === "paused";
  if (link.adapter === "husqvarna" || link.adapter === "gardena") {
    // "Park until further notice" also stops the mower's own schedule from launching it.
    await ADAPTERS[link.adapter].act(link, "dock", {});
  } else if (out) {
    if (capabilitiesOf(link.deviceId).actions.includes("pause") && s?.activity !== "paused") await ADAPTERS[link.adapter].act(link, "pause", {});
    await ADAPTERS[link.adapter].act(link, "dock", {});
  }
  console.warn(`[mower] ${link.deviceId}: held at home - ${reason}`);
  recordInterlock(link.deviceId, reason, out ? "sent-home" : "held");
  if (bridged(link)) await refresh(link).catch(() => undefined);
}

/** Interlock cleared: release the hold; resume the mower's own schedule only if opted in. */
async function release(link: MowerLink): Promise<void> {
  held.delete(link.deviceId);
  if (link.autoResume && capabilitiesOf(link.deviceId).actions.includes("resume_schedule")) {
    const out = await ADAPTERS[link.adapter].act(link, "resume_schedule", {});
    if (out.ok) recordInterlock(link.deviceId, "Animals in and lawn clear - back on its own schedule (auto-resume)", "resumed");
  } else {
    const s = states.get(link.deviceId);
    if (s) states.set(link.deviceId, { ...s, held: false });
    publishState(link);
  }
}

/** One safety pass for a mower: hold on a new block, backstop a mowing mower, release on clear. */
async function safetyCheck(link: MowerLink): Promise<void> {
  const reason = blockedReason(link.deviceId);
  const isHeld = held.has(link.deviceId);
  const s = states.get(link.deviceId);
  if (reason && !isHeld) return hold(link, reason);
  // Backstop: already held but it is out (its own schedule or someone's app started it).
  const recent = s?.lastInterlock && Date.now() - s.lastInterlock.at < 60_000;
  if (reason && isHeld && s && (s.activity === "mowing" || s.activity === "leaving") && !recent) return hold(link, reason);
  if (!reason && isHeld) return release(link);
}

// ── commands + settings ──────────────────────────────────────────────────────
/**
 * Run an action. Actions that send the mower out (start, resume_schedule) are refused while the
 * interlock is not clear; pause / park / dock are never refused (they make things safer).
 */
export async function commandMower(deviceId: string, action: MowerAction, opts: StartOptions = {}): Promise<CommandOutcome> {
  const link = links.get(deviceId);
  if (!link) return { ok: false, status: 404, error: "This mower is not linked" };
  if (!capabilitiesOf(deviceId).actions.includes(action)) {
    return { ok: false, status: 400, error: `This mower cannot ${action.replace(/_/g, " ")} through its connection` };
  }
  if (GO_ACTIONS.has(action)) {
    const reason = blockedReason(deviceId);
    if (reason) { recordInterlock(deviceId, reason, "refused"); return { ok: false, status: 409, error: reason }; }
    held.delete(deviceId);
  }
  const out = await ADAPTERS[link.adapter].act(link, action, opts);
  if (out.ok && bridged(link)) setTimeout(() => void refresh(link).catch(() => undefined), isCloud(link) ? 4_000 : 1_000).unref?.();
  return out;
}

/** Change what the mower's own app would: cutting height, headlight, schedule, stay-out zones, errors. */
export async function updateMowerSettings(deviceId: string, patch: MowerSettingsPatch): Promise<CommandOutcome> {
  const link = links.get(deviceId);
  if (!link) return { ok: false, status: 404, error: "This mower is not linked" };
  const adapter = ADAPTERS[link.adapter];
  if (!adapter.settings) return { ok: false, status: 400, error: "Settings cannot be changed through this mower's connection" };
  try {
    await adapter.settings(link, patch);
    setTimeout(() => void refresh(link).catch(() => undefined), 3_000).unref?.();
    return { ok: true, status: 200, acked: true, message: "Saved on the mower" };
  } catch (e) { return cloudFail(e); }
}

/** E-STOP on a mower: stop and hold it at home. A third-party mower cannot be power-cut from here. */
export async function onEstop(deviceId: string): Promise<void> {
  const link = links.get(deviceId);
  if (!link) return;
  held.delete(deviceId);
  await hold(link, "E-STOP pressed");
}

// ── loop ─────────────────────────────────────────────────────────────────────
async function tick(): Promise<void> {
  const now = Date.now();
  await Promise.all([...links.values()].map(async (l) => {
    try {
      // Mammotion has no park-until-further-notice, so its own schedule is caught by polling.
      const every = l.adapter === "mammotion" ? 60_000 : isCloud(l) ? CLOUD_POLL_MS : l.adapter === "mqtt" ? SAFETY_TICK_MS : POLL_MS;
      if (now - (lastPoll.get(l.deviceId) ?? 0) >= every) await refresh(l);
      await safetyCheck(l);
    } catch (e) {
      console.warn("[mower]", l.deviceId, (e as Error).message);
    }
  }));
}

/** Start the bridge (server.ts). Safe to call once. */
export function startMowerBridge(h: MowerHost): void {
  host = h;
  load();
  if (timer) return;
  timer = setInterval(() => void tick(), SAFETY_TICK_MS);
  timer.unref?.();
  if (links.size) {
    const v = vendorStatus();
    console.log(`[mower] ${links.size} linked mower(s); Home Assistant ${v.homeAssistant ? "on" : "off"}, Husqvarna/GARDENA ${v.husqvarna ? "on" : "off"}`);
  }
}

// ── link management ──────────────────────────────────────────────────────────
const view = (l: MowerLink) => ({
  link: l, state: states.get(l.deviceId) ? { ...states.get(l.deviceId)!, held: held.has(l.deviceId) } : null,
  blocked: host ? blockedReason(l.deviceId) : null, capabilities: capabilitiesOf(l.deviceId),
});

export const listLinks = (only?: Set<string> | null) => [...links.values()].filter((l) => !only || only.has(l.deviceId)).map(view);
export const getLink = (deviceId: string) => links.get(deviceId);
export function mowerView(deviceId: string) {
  const link = links.get(deviceId);
  return link ? view(link) : null;
}

/** Create a link. Vendor / HA mowers are read once first to prove the connection works. */
export async function createLink(body: Record<string, unknown>): Promise<MowerLink> {
  const deviceId = typeof body.deviceId === "string" ? body.deviceId : `mw_${randomBytes(3).toString("hex")}`;
  if (links.has(deviceId)) throw Object.assign(new Error(`${deviceId} is already linked`), { status: 409 });
  const now = Date.now();
  const link: MowerLink = {
    deviceId, name: String(body.name).trim(), adapter: body.adapter as MowerLink["adapter"],
    entityId: body.entityId as string | undefined, batteryEntityId: (body.batteryEntityId as string | null) ?? undefined,
    vendorId: body.vendorId as string | undefined, locationId: body.locationId as string | undefined,
    guardHabitats: (body.guardHabitats as string[] | undefined) ?? [], noAnimalsConfirmed: body.noAnimalsConfirmed === true,
    quietHours: body.quietHours === undefined ? { start: 20, end: 7 } : (body.quietHours as MowerLink["quietHours"]),
    autoResume: body.autoResume === true, createdAt: now, updatedAt: now,
  };
  if (link.adapter === "home-assistant") await ha(`/api/states/${link.entityId}`);
  if (link.adapter === "husqvarna") await husqvarna.read(link.vendorId!);
  if (link.adapter === "gardena") await gardena.read(link.locationId!, link.vendorId!);
  if (link.adapter === "mammotion") await mammotion.read(link.vendorId!);
  links.set(deviceId, link);
  save();
  if (host) void refresh(link).then(() => safetyCheck(link)).catch(() => undefined);
  return link;
}

export function updateLink(deviceId: string, patch: Record<string, unknown>): MowerLink | null {
  const link = links.get(deviceId);
  if (!link) return null;
  const next: MowerLink = { ...link, updatedAt: Date.now() };
  for (const k of ["name", "entityId", "batteryEntityId", "vendorId", "locationId", "guardHabitats", "noAnimalsConfirmed", "quietHours", "autoResume"] as const) {
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
  held.delete(deviceId);
  lastPoll.delete(deviceId);
  if (ok) save();
  return ok;
}

/** Test helpers. */
export function _resetMowers(h: MowerHost | null = null): void {
  links.clear(); states.clear(); held.clear(); lastPoll.clear(); host = h;
}
export const _safetyCheck = (deviceId: string) => { const l = links.get(deviceId); return l ? safetyCheck(l) : Promise.resolve(); };
export const _refresh = (deviceId: string) => { const l = links.get(deviceId); return l ? refresh(l) : Promise.resolve(undefined); };
